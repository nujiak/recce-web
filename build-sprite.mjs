import fs from 'fs';
import path from 'path';

const icons = [
  ['add', 'add'],
  ['add_location', 'add_location'],
  ['arrow_back', 'arrow_back'],
  ['arrow_downward', 'arrow_downward'],
  ['bookmarks', 'bookmarks'],
  ['check', 'check'],
  ['close', 'close'],
  ['construction', 'construction'],
  ['content_copy', 'content_copy'],
  ['delete', 'delete'],
  ['download', 'download'],
  ['edit', 'edit'],
  ['expand_more', 'keyboard_arrow_down'],
  ['explore', 'explore'],
  ['history', 'history'],
  ['location_on', 'location_on'],
  ['map', 'map'],
  ['my_location', 'my_location'],
  ['near_me', 'near_me'],
  ['open_in_new', 'open_in_new'],
  ['palette', 'palette'],
  ['route', 'route'],
  ['satellite_alt', 'satellite_alt'],
  ['schedule', 'schedule'],
  ['settings', 'settings'],
  ['share', 'share'],
  ['sort_by_alpha', 'sort_by_alpha'],
  ['straighten', 'straighten'],
  ['toggle_off', 'toggle_off'],
  ['toggle_on', 'toggle_on'],
  ['undo', 'undo'],
];

const srcDir = 'node_modules/@material-symbols/svg-400/outlined';
const outFile = 'public/icons/sprite.svg';

let symbols = '';
for (const [id, fileName] of icons) {
  const filePath = path.join(srcDir, `${fileName}.svg`);
  const svg = fs.readFileSync(filePath, 'utf-8');
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 48 48';
  const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  symbols += `  <symbol id="${id}" viewBox="${viewBox}">${inner}</symbol>\n`;
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}</svg>\n`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, sprite);

console.log(`Wrote ${icons.length} icons to ${outFile}`);
