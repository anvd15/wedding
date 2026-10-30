const fs = require('fs');
const content = fs.readFileSync('next_f.txt', 'utf8');

// Print all text in chunks
const chunks = content.split('---CHUNK---');
chunks.forEach((chunk, i) => {
  if (chunk.includes('6aa123ef407b170926848b0d') || chunk.includes('templateId') || chunk.includes('Forever Plaza') || chunk.includes('THÀNH PHONG')) {
    console.log(`=== Chunk ${i} (length: ${chunk.length}) ===`);
    // Print unescaped snippet
    let unescaped = chunk.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    console.log(unescaped.substring(0, 1500));
  }
});
