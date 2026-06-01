const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1GYrPRyPda-w1fGCxFOkieSHT7X5kK5TbikQZuZ-oe1k/edit?usp=sharing', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const tabsToFind = ["Shooting", "Ve", "CUTS", "Counter", "1 Ve"];
    for (let tab of tabsToFind) {
      let idx = data.indexOf(`"${tab}"`);
      if (idx !== -1) {
          console.log(`Tab JSON ${tab}:`, data.substring(idx - 20, idx + 80));
      }
    }
  });
});
