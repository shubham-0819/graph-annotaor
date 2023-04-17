import { readFile } from '../utils';
import { openDB } from 'idb';

/**
 * Uploads a file to IndexedDB.
 * @param {File} file - The file to upload.
 * @param {string} dbName - The name of the IndexedDB database.
 * @param {number} dbVersion - The version of the IndexedDB database.
 * @param {string} objectStoreName - The name of the object store to use for uploads.
 * @returns {Promise<void>} - A promise that resolves when the file has been uploaded successfully.
 */
async function uploadFile(file, dbName, dbVersion, objectStoreName) {
  if (!file) {
    throw new Error('No file selected');
  }
  if (file.size > 200 * 1024 * 1024) {
    throw new Error('File size exceeds 200 MB');
  }
  if (!/\.(csv)$/i.test(file.name)) {
    throw new Error('Invalid file extension');
  }
  const fileContent = await readFile(file);
  // Check if the file format is valid (only allow comma-separated values)
  if (!/^.+,[^,]+(?:\r?\n|.)*$/gm.test(fileContent)) {
    throw new Error('Invalid file format');
  }
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      const store = db.createObjectStore(objectStoreName);
      store.createIndex('nameIndex', 'name', { unique: true });
    },
  });
  const upload = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    data: file,
    annotationCount: 0,
  };
  const tx = db.transaction(objectStoreName, 'readwrite');
  const uploadsStore = tx.objectStore(objectStoreName);
  const existingFile = await uploadsStore.get(file.name);
  if (existingFile) {
    // If a file with the same name exists, generate a new name
    const randomString = Math.random().toString(36).substring(2, 5);
    const newName = `${file.name}-${randomString}`;
    upload.name = newName;
    console.log(`File name "${file.name}" already exists, renamed to "${newName}"`);
  }

  await uploadsStore.add(upload, upload.name);

  return upload;
}


/**
 * Fetches a list of uploaded files from IndexedDB and performs search, sort, and filter operations.
 * @param {string} dbName - The name of the IndexedDB database.
 * @param {number} dbVersion - The version of the IndexedDB database.
 * @param {string} objectStoreName - The name of the object store to use for uploads.
 * @param {string} searchQuery - A search query to filter the files by name.
 * @param {string} sortField - The name of the field to sort the files by.
 * @param {string} sortOrder - The sort order, either "asc" or "desc".
 * @param {number} offset - The number of items to skip before returning results.
 * @param {number} limit - The maximum number of items to return.
 * @returns {Promise<File[]>} - A promise that resolves with an array of files that match the search, sort, and filter criteria.
 */
async function fetchFiles(dbName, dbVersion, objectStoreName, searchQuery, sortField = false, sortOrder = 'asc', offset = 0, limit = 100) {
  const db = await openDB(dbName, dbVersion);
  const cursor = await createCursor(db, objectStoreName);
  const files = await filterFiles(cursor, searchQuery, limit + offset);
  if (sortField) {
    sortFiles(files, sortField, sortOrder);
  }
  const result = paginateFiles(files, offset, limit);
  return result;
}

/**
 * Creates an object store cursor to iterate over the files in the database.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {string} objectStoreName - The name of the object store to use for uploads.
 * @returns {Promise<IDBCursorWithValue>} - A promise that resolves with a cursor for the object store.
 */
async function createCursor(db, objectStoreName) {
  const uploadsStore = db.transaction(objectStoreName, 'readonly').objectStore(objectStoreName);
  const cursor = await uploadsStore.openCursor();
  return cursor;
}

/**
 * Filters the files by name using a search query and returns an array of matching files.
 * @param {IDBCursorWithValue} cursor - The cursor for the object store.
 * @param {string} searchQuery - A search query to filter the files by name.
 * @param {number} limit - The maximum number of files to return.
 * @returns {Promise<File[]>} - A promise that resolves with an array of matching files.
 */
async function filterFiles(cursor, searchQuery, limit) {
  const items = [];
  let count = 0;

  while (cursor && count < limit) {
    const upload = cursor.value;

    if (!searchQuery || upload.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      // const blob = new Blob([upload.data], { type: upload.type });
      // const file = new File([blob], upload.name, { lastModified: upload.lastModified });
      // files.push(file);
      items.push(upload)
    }
    cursor = await cursor.continue();
    count++;
  }
  return items;
}

/**
 * Sorts an array of files by a given field and sort order.
 * @param {File[]} files - The array of files to sort.
 * @param {string} sortField - The name of the field to sort the files by.
 * @param {string} sortOrder - The sort order, either "asc" or "desc".
 */
function sortFiles(files, sortField, sortOrder) {
  files.sort((fileA, fileB) => {
    let valA = fileA[sortField];
    let valB = fileB[sortField];

    // If the field is a date, convert it to a timestamp for comparison
    if (valA instanceof Date && valB instanceof Date) {
      valA = valA.getTime();
      valB = valB.getTime();
    }

    // Compare the values based on the sort order
    if (sortOrder === 'asc') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    } else {
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    }
  });
}

/**
 * Paginates an array of files by skipping a certain number of items and returning a maximum number of items.
 * @param {File[]} files - The array of files to paginate.
 * @param {number} offset - The number of items to skip before returning results.
 * @param {number} limit - The maximum number of items to return.
 * @returns {File[]} - The array of files that were paginated.
 */
function paginateFiles(files, offset, limit) {
  const startIndex = offset < 0 ? 0 : offset;
  const endIndex = startIndex + limit > files.length ? files.length : startIndex + limit;
  return files.slice(startIndex, endIndex);
}

async function getKeys(dbName, dbVersion, objectStoreName) {
  return openDB(dbName, dbVersion).then(function (db) {
    if (!db.objectStoreNames.contains(objectStoreName)) {
      return [];
    }

    var tx = db.transaction(objectStoreName, 'readonly');
    var store = tx.objectStore(objectStoreName);
    var request = store.getAllKeys();

    return request.then(function (keys) {
      return keys;
    });
  });
}

async function fetchFileByName(name, { dbName, dbVersion, objectStoreName }) {
  if (!name) return;
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      db.createObjectStore(objectStoreName);
    },
  });

  const tx = db.transaction(objectStoreName, 'readonly');
  const uploadsStore = tx.objectStore(objectStoreName);
  const index = uploadsStore.index('nameIndex');
  const request = index.get(name);
  const file = await request;

  if (file) {
    return file;
  } else {
    console.log('File not found');
    return null;
  }
}

export { uploadFile, fetchFiles, fetchFileByName, getKeys }
