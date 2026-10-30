const fs = require('fs');
const html = fs.readFileSync('sample_page.html', 'utf8');

const idx = html.indexOf('"_id":"6aa123ef407b170926848b0d"');
console.log('Index in html:', idx);
if (idx !== -1) {
  // Grab 2000 chars
  console.log(html.substring(idx, idx + 1000));
}
