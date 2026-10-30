const fs = require('fs');
const html = fs.readFileSync('sample_page.html', 'utf8');

// Find all class names or structure related to the template container
const templateArea = html.match(/class="[^"]*template-[^"]*"/gi);
console.log('Template classes:', Array.from(new Set(templateArea || [])));

// Let's inspect CSS styles
const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Number of style tags:', styles.length);

// Look for background colors, font families, and images
const bgImages = html.match(/url\([^)]+\)/gi) || [];
console.log('Background images count:', bgImages.length);
console.log('Sample background images:', Array.from(new Set(bgImages)).slice(0, 15));

// Check color codes
const hexColors = html.match(/#[0-9a-fA-F]{3,8}\b/gi) || [];
const colorCounts = {};
hexColors.forEach(c => {
  const norm = c.toLowerCase();
  colorCounts[norm] = (colorCounts[norm] || 0) + 1;
});
const sortedColors = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);
console.log('Top colors:', sortedColors.slice(0, 15));

// Find template-preview container html
const previewIdx = html.indexOf('template-preview');
if (previewIdx !== -1) {
  console.log('Snippet around template-preview:');
  console.log(html.substring(previewIdx - 100, previewIdx + 1000));
}
