/**
 * Reads the contents of a file as text.
 * @param {File} file - The file to read.
 * @returns {Promise<string>} - A promise that resolves with the file contents as text.
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = () => {
            reject(reader.error);
        };
    });
}


export { readFile };