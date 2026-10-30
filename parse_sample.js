const fs = require('fs');

const html = fs.readFileSync('sample_page.html', 'utf8');

console.log('HTML length:', html.length);

// Look for iframes
const iframes = html.match(/<iframe[^>]*>/gi);
console.log('Iframes:', iframes);

// Look for template preview src or URLs
const urls = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];
console.log('Total URLs found:', urls.length);

const interesting = urls.filter(u => 
  u.includes('template') || 
  u.includes('preview') || 
  u.includes('wedding') || 
  u.includes('audio') || 
  u.includes('mp3') || 
  u.includes('cdn') ||
  u.includes('biihappy') ||
  u.includes('m-invite')
);
console.log('Interesting URLs:', Array.from(new Set(interesting)).slice(0, 30));

// Look for JSON or props embedded in the page
const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
if (nextData) {
  console.log('Found __NEXT_DATA__!');
  fs.writeFileSync('next_data.json', nextData[1]);
} else {
  console.log('No __NEXT_DATA__, looking for self.__next_f or similar');
  const nextF = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g);
  if (nextF) {
    console.log('Found next_f chunks:', nextF.length);
    fs.writeFileSync('next_f.txt', nextF.join('\n\n---CHUNK---\n\n'));
  }
}
