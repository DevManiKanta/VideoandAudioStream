// import React from 'react';
// import { View } from 'react-native';
// import { WebView } from 'react-native-webview';
// // ChartComponent is a functional component that renders a chart in a WebView
// const ChartComponent = ({ data, firstPeakIndex, secondPeakIndex }) => {
//   // Mapping the input data into an array of scatter plot data points with 'x' and 'y' values
//   const scatterData = data.map((value, index) => ({ x: index, y: value }));
//   // HTML content to render the chart with Chart.js and Chart.js Plugin for annotations
//   const chartHtml = `
//     <html>
//       <head>
//         <!-- Importing Chart.js library for creating charts -->
//         <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//         <!-- Importing Chart.js plugin for annotations on charts -->
//         <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation"></script>
//       </head>
//       <body>
//         <!-- Canvas element where the chart will be drawn -->
//         <canvas id="myChart" style="width: 100vw; height: 100vh;"></canvas>
//         <script>
//           // Accessing the canvas element where the chart will be rendered
//           var ctx = document.getElementById('myChart').getContext('2d');

//           // Array to store annotation configurations
//           var annotations = [];

//           // Check if the firstPeakIndex is valid and not null
//           if (${firstPeakIndex} !== null && ${firstPeakIndex} >= 0) {
//             // Push annotation configuration for a vertical red line at the position of the first peak index
//             annotations.push({
//               type: 'line',
//               mode: 'vertical', // This is a vertical line
//               scaleID: 'x', // The line will be drawn on the x-axis
//               value: ${firstPeakIndex}, // The position of the vertical line on the x-axis
//               borderColor: 'red', // The color of the line
//               borderWidth: 3, // The thickness of the line (updated for a thicker line)
//               label: {
//                 content: 'First Peak', // Label text displayed next to the line
//                 enabled: true, // Enable the label
//                 position: 'top' // Position the label above the line
//               }
//             });
//           }

//           // Check if the secondPeakIndex is valid and not null
//           if (${secondPeakIndex} !== null && ${secondPeakIndex} >= 0) {
//             // Push annotation configuration for a vertical red line at the position of the second peak index
//             annotations.push({
//               type: 'line',
//               mode: 'vertical', // This is a vertical line
//               scaleID: 'x', // The line will be drawn on the x-axis
//               value: ${secondPeakIndex}, // The position of the vertical line on the x-axis
//               borderColor: 'red', // The color of the line
//               borderWidth: 3, // The thickness of the line (updated for a thicker line)
//               label: {
//                 content: 'Second Peak', // Label text displayed next to the line
//                 enabled: true, // Enable the label
//                 position: 'top' // Position the label above the line
//               }
//             });
//           }

//           // Creating the chart using Chart.js
//           new Chart(ctx, {
//             type: 'scatter', // The chart type is scatter plot
//             data: {
//               datasets: [{
//                 label: 'Audio Chunk Sum', // The label for the dataset
//                 data: ${JSON.stringify(scatterData)}, // Using the scatterData array for the chart points
//                 borderColor: 'blue', // Color of the line connecting the points (though it's a scatter chart)
//                 backgroundColor: 'rgba(0, 0, 255, 0.5)', // The color for the scatter plot points (semi-transparent blue)
//                 pointRadius: 6, // Radius of the points in the scatter plot
//                 pointHoverRadius: 8, // Radius when a point is hovered over
//                 pointBackgroundColor: 'blue', // Background color of the points
//                 showLine: false // Do not draw a line connecting the points, just the points themselves
//               }]
//             },
//             options: {
//               responsive: true, // Make the chart responsive to screen size changes
//               maintainAspectRatio: false, // Allow the chart to adjust the aspect ratio freely
//               plugins: {
//                 annotation: {
//                   annotations: annotations // Use the previously defined annotations (e.g., vertical red lines)
//                 },
//                 tooltip: {
//                   enabled: true // Enable tooltips on hover
//                 }
//               },
//               scales: {
//                 x: {
//                   title: { display: true, text: 'Chunk Index' }, // Label for the x-axis
//                   grid: { color: 'lightgray' } // Color of the grid lines on the x-axis
//                 },
//                 y: {
//                   title: { display: true, text: 'Sum Value' }, // Label for the y-axis
//                   grid: { color: 'green' } // Color of the grid lines on the y-axis
//                 }
//               }
//             }
//           });
//         </script>
//       </body>
//     </html>
//   `;
//   return (
//     <View style={{ height: 300, width: '100%', marginTop: 20 }}>
//       {/* WebView is used to render the chart HTML content within the React Native app */}
//       <WebView originWhitelist={['*']} source={{ html: chartHtml }} />
//     </View>
//   );
// };
// export default ChartComponent;

import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
// ChartComponent is a functional component that renders a chart in a WebView
const ChartComponent = ({ data, firstPeakIndex, secondPeakIndex }) => {
  // Mapping the input data into an array of scatter plot data points with 'x' and 'y' values
  const scatterData = data.map((value, index) => ({ x: index, y: value }));
  // HTML content to render the chart with Chart.js and Chart.js Plugin for annotations
  const chartHtml = `
    <html>
      <head>
        <!-- Importing Chart.js library for creating charts -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <!-- Importing Chart.js plugin for annotations on charts -->
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation"></script>
      </head>
      <body>
        <!-- Canvas element where the chart will be drawn -->
        <canvas id="myChart" style="width: 100vw; height: 100vh;"></canvas>
        <script>
          // Accessing the canvas element where the chart will be rendered
          var ctx = document.getElementById('myChart').getContext('2d');

          // Array to store annotation configurations
          var annotations = [];

          // Check if the firstPeakIndex is valid and not null
          if (${firstPeakIndex} !== null && ${firstPeakIndex} >= 0) {
            // Push annotation configuration for a vertical red line at the position of the first peak index
            annotations.push({
              type: 'line',
              mode: 'vertical', // This is a vertical line
              scaleID: 'x', // The line will be drawn on the x-axis
              value: ${firstPeakIndex}, // The position of the vertical line on the x-axis
              borderColor: 'red', // The color of the line
              borderWidth: 3, // The thickness of the line (updated for a thicker line)
              label: {
                content: 'First Peak', // Label text displayed next to the line
                enabled: true, // Enable the label
                position: 'top' // Position the label above the line
              }
            });
          }

          // Check if the secondPeakIndex is valid and not null
          if (${secondPeakIndex} !== null && ${secondPeakIndex} >= 0) {
            // Push annotation configuration for a vertical red line at the position of the second peak index
            annotations.push({
              type: 'line',
              mode: 'vertical', // This is a vertical line
              scaleID: 'x', // The line will be drawn on the x-axis
              value: ${secondPeakIndex}, // The position of the vertical line on the x-axis
              borderColor: 'red', // The color of the line
              borderWidth: 3, // The thickness of the line (updated for a thicker line)
              label: {
                content: 'Second Peak', // Label text displayed next to the line
                enabled: true, // Enable the label
                position: 'top' // Position the label above the line
              }
            });
          }

          // Creating the chart using Chart.js
          new Chart(ctx, {
            type: 'scatter', // The chart type is scatter plot
            data: {
              datasets: [{
                label: 'Audio Chunk Sum', // The label for the dataset
                data: ${JSON.stringify(
                  scatterData
                )}, // Using the scatterData array for the chart points
                borderColor: 'blue', // Color of the line connecting the points (though it's a scatter chart)
                backgroundColor: 'rgba(0, 0, 255, 0.5)', // The color for the scatter plot points (semi-transparent blue)
                pointRadius: 6, // Radius of the points in the scatter plot
                pointHoverRadius: 8, // Radius when a point is hovered over
                pointBackgroundColor: 'blue', // Background color of the points
                showLine: true // Do not draw a line connecting the points, just the points themselves
              }]
            },
            options: {
              responsive: true, // Make the chart responsive to screen size changes
              maintainAspectRatio: false, // Allow the chart to adjust the aspect ratio freely
              plugins: {
                annotation: {
                  annotations: annotations // Use the previously defined annotations (e.g., vertical red lines)
                },
                tooltip: {
                  enabled: true // Enable tooltips on hover
                }
              },
              scales: {
                x: { 
                  title: { display: true, text: 'Chunk Index' }, // Label for the x-axis
                  grid: { color: 'lightgray' } // Color of the grid lines on the x-axis
                },
                y: { 
                  title: { display: true, text: 'Sum Value' }, // Label for the y-axis
                  grid: { color: 'green' }, // Color of the grid lines on the y-axis
                  ticks: {
      display: false // This hides the numbers on the Y-axis
    }
                  
                }
              }
            }
          });
        </script>
      </body>
    </html>
  `;
  return (
    <View style={{ height: 500, width: "100%", marginTop: 20 }}>
      {/* WebView is used to render the chart HTML content within the React Native app */}
      <WebView originWhitelist={["*"]} source={{ html: chartHtml }} />
    </View>
  );
};
export default ChartComponent;
