const fs = require('fs');

const content = fs.readFileSync('next_f.txt', 'utf8');

// Find the design json inside chunk 9
const match = content.match(/"design":(\{[\s\S]*?\})\s*,\s*"[^"]*":/);
if (match) {
  let rawJson = match[1];
  // Replace escaped quotes
  let cleaned = rawJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  try {
    const design = JSON.parse(cleaned);
    fs.writeFileSync('template_design.json', JSON.stringify(design, null, 2));
    console.log('Saved template_design.json successfully!');
  } catch (err) {
    console.log('JSON parse failed:', err.message);
    // Write cleaned as is
    fs.writeFileSync('template_design_raw.json', cleaned);
  }
} else {
  // Let's search by string position
  const start = content.indexOf('{"_id":"6aa123ef407b170926848b0d"');
  if (start !== -1) {
    console.log('Found start at:', start);
    // Find matching bracket
    let depth = 0;
    let end = -1;
    let inString = false;
    let escaped = false;
    for (let i = start; i < content.length; i++) {
      let char = content[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
    }
    if (end !== -1) {
      let raw = content.substring(start, end).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      try {
        const obj = JSON.parse(raw);
        fs.writeFileSync('template_design.json', JSON.stringify(obj, null, 2));
        console.log('Parsed and saved via bracket matching! Elements count:', obj.elements ? obj.elements.length : 'no elements');
      } catch (e) {
        console.log('Bracket match parse error:', e.message);
        fs.writeFileSync('template_design_raw.txt', raw);
      }
    }
  }
}
