const fetch = require('node-fetch');

async function checkPersonalStatus() {
  try {
    const res = await fetch('https://downdetector.com.ar/problemas/personal/');
    const html = await res.text();
    const reportsMatch = html.match(/chartData: (\[.*?\])/);
    if (reportsMatch) {
      const data = JSON.parse(reportsMatch[1]);
      const currentReports = data[data.length - 1]?.y || 0;
      console.log('Current reports for Personal:', currentReports);
    } else {
      console.log('Could not find reports data');
    }
  } catch (e) {
    console.error('Error fetching data:', e);
  }
}

checkPersonalStatus();
