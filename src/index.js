// file upload and fetch
import { readFile } from './utils';
import { parseCSV } from "./data-parsing";
import { plotLineChart } from './graph-plotting';

import { uploadFile, fetchFiles } from "./file-upload";
const constans = {
  dbName: "raw-data",
  dbVersion: 1,
  obejectStoreName: "csv-store"
}

const fileUploadBtn = document.getElementById("file-upload-btn");
const canvas = document.getElementById("canvas")
fileUploadBtn.addEventListener('change', async (e) => {
  // console.log(e);
  const files = e.target.files;
  let lastFile;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    lastFile = await uploadFile(file, constans.dbName, constans.dbVersion, constans.obejectStoreName);
  }
  console.log({ lastFile });
  const fileData = await readFile(lastFile.data)
  const parsedData = parseCSV(fileData, ['timestamp', 'speedometer_x', 'speedometer_y']);
  console.log(parsedData);

  // const formattedData = parsedData.map(row => {
  //     return {
  //         timestamp: new Date(Number(row[0]) * 1000),
  //         speedometer: Number(row[1]),
  //         gyrometer: Number(row[2])
  //     };
  // });

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