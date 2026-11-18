// Готовит точную пару «что искать / на что заменить» для инлайновых копий price()
// внутри workers/*.mjs и проверяет поведение исправленной функции.
const fs = require('fs');
const vm = require('vm');
const ROOT = '/home/user/liberterra/platform/';

// Исправленная версия лежит в ассете, который я уже правил.
const fixedFile = fs.readFileSync(ROOT + 'assets/site/files/listing-format.js', 'utf8');
const grab = (src) => {
  const i = src.indexOf('function price(value)');
  const j = src.indexOf('\n  }', i);
  return src.slice(i, j + 4);
};
const newBody = grab(fixedFile);

// Старая версия — из снимка боевого файла до правки.
const oldFile = fs.readFileSync(ROOT + 'public/api/crm-workflow/crm-workspace.js', 'utf8');
const liveListing = fs.readFileSync('/tmp/claude-0/-home-user-liberterra/8471d812-1ac4-5deb-8a33-a9d70964ff7e/scratchpad/live/lf-live.js', 'utf8');
const oldBody = grab(liveListing);

console.log('старая price():', oldBody.length, 'симв.');
console.log('новая  price():', newBody.length, 'симв.  (+' + (newBody.length - oldBody.length) + ')');

// Как эти тела выглядят внутри строкового литерала Worker.
const escape = (s) => JSON.stringify(s).slice(1, -1);
const oldEsc = escape(oldBody), newEsc = escape(newBody);

for (const f of ['workers/site.mjs', 'workers/backend.mjs']) {
  const s = fs.readFileSync(ROOT + f, 'utf8');
  const raw = s.split(oldBody).length - 1;
  const esc = s.split(oldEsc).length - 1;
  console.log(`${f.padEnd(20)} копий как есть: ${raw}   копий экранированных: ${esc}   всего: ${raw + esc}`);
}

// Проверка поведения новой версии.
const win = {}; globalThis.window = win;
vm.runInNewContext(fixedFile, { window: win });
const price = win.LiberterraListingFormat.price;
const cases = [['150000 сом', '150 000 сом'], ['150000 сом / мес', '150 000 сом / мес'],
  ['150 000 сом', '150 000 сом'], ['$150000', '$150 000'], ['999 сом', '999 сом'],
  ['87000 KGS', '87 000 KGS'], ['1500.50 сом', '1500.50 сом'], ['45000 сомнительно', '45000 сомнительно']];
let bad = 0;
for (const [input, want] of cases) {
  const got = price(input);
  if (got !== want) { bad++; console.log(`  FAIL ${JSON.stringify(input)} -> ${JSON.stringify(got)}, ждали ${JSON.stringify(want)}`); }
}
console.log(bad ? `\n${bad} провалов` : '\nповедение новой price(): все случаи прошли');

fs.writeFileSync('/tmp/claude-0/-home-user-liberterra/8471d812-1ac4-5deb-8a33-a9d70964ff7e/scratchpad/harness/price-old.txt', oldBody);
fs.writeFileSync('/tmp/claude-0/-home-user-liberterra/8471d812-1ac4-5deb-8a33-a9d70964ff7e/scratchpad/harness/price-new.txt', newBody);
console.log('\nтела сохранены: price-old.txt / price-new.txt');
