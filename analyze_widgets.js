const fs = require('fs');
const d = JSON.parse(fs.readFileSync('template_design.json'));

const texts = d.widgets.filter(w => w.type === 'text').map(w => ({
  id: w.id,
  text: w.data?.text || w.data?.content,
  fontFamily: w.style?.fontFamily,
  fontSize: w.style?.fontSize,
  fontWeight: w.style?.fontWeight,
  color: w.style?.color,
  top: w.style?.top,
  left: w.style?.left,
  textAlign: w.style?.textAlign
})).sort((a,b) => (a.top || 0) - (b.top || 0));

console.log('--- ALL TEXTS IN ORDER OF TOP ---');
texts.forEach(t => console.log(`[top:${Math.round(t.top)}px font:${t.fontFamily} ${t.fontSize}px ${t.color}] ${t.text?.replace(/\n/g, ' ')}`));

const specials = d.widgets.filter(w => !['text', 'line'].includes(w.type)).map(w => ({
  id: w.id,
  type: w.type,
  top: Math.round(w.style?.top || 0),
  left: Math.round(w.style?.left || 0),
  width: w.style?.width,
  height: w.style?.height,
  data: w.data
}));

console.log('\n--- SPECIAL WIDGETS ---');
console.log(JSON.stringify(specials, null, 2));
