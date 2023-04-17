// file upload and fetch
import { readFile } from './utils';
import { parseCSV } from "./data-parsing";
import { plotLineChart } from './graph-plotting';
import { uploadFile, fetchFiles, fetchFileByName, getKeys } from "./file-upload";



const constans = {
  dbName: "raw-data",
  dbVersion: 1,
  obejectStoreName: "csv-store"
}

const fileUploadBtn = document.getElementById("file-upload-btn");
const canvas = document.getElementById("canvas");
const fetchBtn = document.getElementById("fetch-files-btn");

fileUploadBtn.addEventListener('change', async (e) => {
  // console.log(e);
  const files = e.target.files;
  let lastFile;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    lastFile = await uploadFile(file, constans.dbName, constans.dbVersion, constans.obejectStoreName);
  }
  const fileData = await readFile(lastFile.data)
  const parsedData = parseCSV(fileData, ['timestamp', 'speedometer_x', 'speedometer_y']);

  const labels = parsedData.map((row) => new Date(parseInt(row[0]) * 1000));
  const datasets = [
    {
      label: "Speedometer",
      data: parsedData.map((row) => parseFloat(row[1])),
      borderColor: "red",
    },
    {
      label: "Gyrometer",
      data: parsedData.map((row) => parseFloat(row[2])),
      borderColor: "blue",
    },
  ];

  plotLineChart(canvas, { labels: labels, datasets: datasets }, 'timestamp', 'readings');

})

fetchBtn.addEventListener('click', () => {
  getUploadedFiles();
})


async function getUploadedFiles() {
  const files = await getKeys(constans.dbName, constans.dbVersion, constans.obejectStoreName);
  const file = await fetchFiles(constans.dbName, constans.dbVersion, constans.obejectStoreName, "");
  // const file = await fetchFileByName(files[0], {
  //   dbName: constans.dbName,
  //   dbVersion: constans.dbVersion,
  //   objectStoreName: constans.obejectStoreName
  // })
  console.log(file);
}