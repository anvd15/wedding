const fs = require('fs');
const html = fs.readFileSync('sample_page.html', 'utf8');

const key = '\"design\":{';
const startIdx = html.indexOf(key);
if (startIdx !== -1) {
  const jsonStart = startIdx + '\"design\":'.length;
  // Look forward until end of design object
  // Since string has escaped quotes \" and backslashes \\
  let str = html.substring(jsonStart, 206000);
  
  // Unescape JSON string:
  // Note: inside next_f script, it's stringified JSON inside a string
  // let's do unescape carefully
  let unescaped = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      if (next === '"') {
        unescaped += '"';
        i++;
      } else if (next === '\\') {
        unescaped += '\\';
        i++;
      } else if (next === 'n') {
        unescaped += '\n';
        i++;
      } else if (next === 't') {
        unescaped += '\t';
        i++;
      } else if (next === 'u' && i + 5 < str.length) {
        const hex = str.substring(i + 2, i + 6);
        unescaped += String.fromCharCode(parseInt(hex, 16));
        i += 5;
      } else {
        unescaped += str[i];
      }
    } else {
      unescaped += str[i];
    }
  }

  // Now find matching balanced braces in unescaped
  let depth = 0;
  let end = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < unescaped.length; i++) {
    let c = unescaped[i];
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
    const finalJsonStr = unescaped.substring(0, end);
    try {
      const data = JSON.parse(finalJsonStr);
      fs.writeFileSync('template_design.json', JSON.stringify(data, null, 2));
      console.log('SUCCESS! Parsed template design!');
      console.log('Title:', data.title);
      console.log('Music:', data.settings ? data.settings.backgroundMusic : null);
      console.log('Elements count:', data.elements ? data.elements.length : 0);
    } catch (e) {
      console.log('Parse error:', e.message);
      fs.writeFileSync('temp_debug.txt', finalJsonStr.substring(0, 3000));
    }
  } else {
    console.log('Could not find closing brace');
  }
}
