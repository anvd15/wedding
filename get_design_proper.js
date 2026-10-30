const fs = require('fs');
const html = fs.readFileSync('sample_page.html', 'utf8');

const target = '{\\"_id\\":\\"6aa123ef407b170926848b0d\\"';
const pos = html.indexOf(target);
console.log('Pos target:', pos);

if (pos !== -1) {
  // We have the start!
  // Let's parse stringified JSON using JSON.parse on the outer chunk
  // Look backwards for self.__next_f.push([1,"
  const scriptStart = html.lastIndexOf('self.__next_f.push([1,"', pos);
  console.log('Script start:', scriptStart);
  const scriptEnd = html.indexOf('"])</script>', pos);
  console.log('Script end:', scriptEnd);
  
  const rawString = html.substring(scriptStart + 'self.__next_f.push([1,"'.length, scriptEnd);
  console.log('Raw chunk length:', rawString.length);
  
  // Parse the JS string literal
  const unescapedChunk = JSON.parse('"' + rawString + '"');
  console.log('Unescaped chunk length:', unescapedChunk.length);
  
  // Find {"_id":"6aa123ef407b170926848b0d"
  const start = unescapedChunk.indexOf('{"_id":"6aa123ef407b170926848b0d"');
  console.log('Start in unescaped:', start);
  
  let depth = 0;
  let end = -1;
  let inStr = false;
  let esc = false;
  for (let i = start; i < unescapedChunk.length; i++) {
    let c = unescapedChunk[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (!inStr) {
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }
  
  if (end !== -1) {
    const jsonStr = unescapedChunk.substring(start, end);
    const design = JSON.parse(jsonStr);
    fs.writeFileSync('template_design.json', JSON.stringify(design, null, 2));
    console.log('SUCCESSFUL FULL EXTRACTION!');
    console.log('Title:', design.title);
    console.log('Canvas Height:', design.settings.canvasHeight);
    console.log('Music:', design.settings.backgroundMusic);
    console.log('Total elements:', design.elements.length);
  }
}
