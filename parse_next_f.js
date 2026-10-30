const fs = require('fs');
const content = fs.readFileSync('next_f.txt', 'utf8');

// Search for section titles, text, image configurations
const lines = content.split('\n');
console.log('Total lines in next_f.txt:', lines.length);

// Let's find snippets that describe elements or text
const relevant = [];
lines.forEach(l => {
  if (l.includes('Thành Phong') || l.includes('Thu Trang') || l.includes('Forever Plaza') || l.includes('SAVE') || l.includes('RSVP') || l.includes('gift')) {
    relevant.push(l.substring(0, 300));
  }
});
console.log('Relevant hits:', relevant.length);
console.log(relevant.slice(0, 10));

// Find template design data
const designMatch = content.match(/\{"id":"6aa123ef407b170926848b0d"[^}]*\}/);
if (designMatch) {
  console.log('Template design object:', designMatch[0]);
}

// Find all image URLs and stock shapes
const stockImages = content.match(/https:\\\/\\\/cdn\.biihappy\.com[^\s"'\\]+/g) || [];
console.log('Stock images count:', stockImages.length);
console.log('Sample stock images:', Array.from(new Set(stockImages.map(s => s.replace(/\\\//g, '/')))).slice(0, 20));
