import Chart from 'chart.js/auto';

function plotLineChart(canvas, data, xTitle, yTitle) {
  const config = {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: xTitle
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: yTitle
          }
        },

      },
      onClick: (e) => {
        // const canvasPosition = Chart.helpers.getRelativePosition(e, chart);
        console.log(e);
        // // Substitute the appropriate scale IDs
        const dataX = e.chart.scales.x.getValueForPixel(e.x);
        const dataY = e.chart.scales.y.getValueForPixel(e.y);
        console.log({dataX,dataY});
      }
    }
  };
  return new Chart(canvas, config);
}
export { plotLineChart }