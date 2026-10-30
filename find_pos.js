const fs = require('fs');
const html = fs.readFileSync('sample_page.html', 'utf8');

let pos = 0;
while (true) {
  let found = html.indexOf('6aa123ef407b170926848b0d', pos);
  if (found === -1) break;
  console.log('Found at:', found);
  console.log(html.substring(Math.max(0, found - 50), Math.min(html.length, found + 150)));
  console.log('---');
  pos = found + 25;
}
