const fs = require('fs');

const html = fs.readFileSync('sample_page.html', 'utf8');

// Search for audio/music in the HTML
const audioMatch = html.match(/https?:\/\/[^\s"'<>]+\.(?:mp3|wav|ogg|m4a)[^\s"'<>]*/gi);
console.log('Audio URLs:', audioMatch);

// Look for fonts
const fonts = html.match(/https?:\/\/fonts\.[^\s"'<>]+/gi);
console.log('Fonts:', fonts);

// Find text in HTML between tags
// Let's strip out script and style tags to see readable text
let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
clean = clean.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

// Extract readable text chunks
const textChunks = clean.match(/>([^<]{2,})</g) || [];
const texts = textChunks
  .map(t => t.replace(/[><]/g, '').trim())
  .filter(t => t.length > 1 && !t.startsWith('{') && !t.startsWith('.'));

console.log('Sample readable texts:');
console.log(Array.from(new Set(texts)).slice(0, 80));

fs.writeFileSync('extracted_texts.json', JSON.stringify(Array.from(new Set(texts)), null, 2));
