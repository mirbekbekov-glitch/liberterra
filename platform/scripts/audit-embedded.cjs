// Проверка, какие встроенные файлы отдаются не из карты ресурсов.
// Только чтение: ничего не пишет и ничего не выкладывает.
// Сеть: только боевые URL liberterra.kg.
//
//   node platform/scripts/audit-embedded.cjs
//   node platform/scripts/audit-embedded.cjs --json
//
// Разбирает карту `const files={…}` в workers/site.mjs, собирает присваивания
// `files["…"]=` после неё, скачивает каждый текстовый файл с боевого URL и
// сравнивает SHA-256. Расхождение означает, что правка ассета до сайта не дойдёт.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ORIGIN = 'https://liberterra.kg';
const BINARY = /\.(png|webp|jpe?g|svg|ico|woff2?|ttf)$/i;
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const json = process.argv.includes('--json');

const source = fs.readFileSync(path.join(root, 'workers/site.mjs'), 'utf8');

function literalAt(at) {
  if (source[at] !== '"') return null;
  let j = at + 1;
  while (j < source.length) { if (source[j] === '\\') { j += 2; continue; } if (source[j] === '"') break; j++; }
  return { end: j + 1, value: vm.runInNewContext(source.slice(at, j + 1)) };
}

// 1. Карта ресурсов.
const map = new Map();
let i = source.indexOf('const files={');
if (i < 0) { console.error('карта const files={…} не найдена'); process.exit(1); }
i += 'const files={'.length;
while (i < source.length) {
  while (' \t\r\n,'.includes(source[i])) i++;
  if (source[i] === '}') break;
  const key = literalAt(i);
  if (!key) break;
  i = key.end;
  while (' \t\r\n'.includes(source[i])) i++;
  if (source[i] !== ':') break;
  i++;
  while (' \t\r\n'.includes(source[i])) i++;
  const value = literalAt(i);
  if (!value) break;
  i = value.end;
  map.set(key.value, value.value);
}

// 2. Присваивания после карты: выигрывает последнее.
const assigns = new Map();
for (const m of source.matchAll(/files\["(\/[^"]*)"\]\s*=/g)) {
  const offset = m.index + m[0].length + source.slice(m.index + m[0].length).match(/^\s*/)[0].length;
  const lit = literalAt(offset);
  if (!assigns.has(m[1])) assigns.set(m[1], 0);
  assigns.set(m[1], assigns.get(m[1]) + 1);
  if (lit) map.set(m[1], lit.value); // для сравнения берём то, что отдаётся
}

// 3. Дублирование ключа в теле Worker.
const duplicates = [];
for (const key of map.keys()) {
  const needle = '"' + key + '":"';
  let count = 0, from = -1;
  while ((from = source.indexOf(needle, from + 1)) >= 0) count++;
  if (count > 1) duplicates.push([key, count]);
}

// 4. Сравнение с боем.
const paths = [...map.keys()].filter((p) => !BINARY.test(p));
const same = [], diff = [], failed = [];
for (const p of paths) {
  let body;
  try {
    body = execFileSync('curl', ['-sS', '--fail', '--max-time', '30', ORIGIN + p], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    failed.push([p, String(error.message || error).slice(0, 60)]);
    continue;
  }
  if (sha(body) === sha(map.get(p))) same.push(p);
  else diff.push({ path: p, вWorker: map.get(p).length, наБою: body.length, присваиваний: assigns.get(p) || 0 });
}

if (json) {
  console.log(JSON.stringify({ записейВКарте: map.size, совпало: same.length, разошлось: diff.length, неполучено: failed, расхождения: diff, дубликатыКлюча: duplicates }, null, 1));
} else {
  console.log(`в карте ${map.size} записей, проверено ${paths.length} текстовых`);
  console.log(`совпало ${same.length}, разошлось ${diff.length}` + (failed.length ? `, не получено ${failed.length}` : ''));
  for (const d of diff.sort((a, b) => a.path < b.path ? -1 : 1)) {
    console.log(`  ${d.path.padEnd(28)} worker ${String(d.вWorker).padStart(7)} → бой ${String(d.наБою).padStart(7)}` + (d.присваиваний ? `  (присваиваний: ${d.присваиваний})` : ''));
  }
  if (duplicates.length) {
    console.log('ключ встречается в Worker больше одного раза:');
    for (const [key, count] of duplicates) console.log(`  ${key} — ${count}`);
  }
  for (const [p, why] of failed) console.log(`  не получено: ${p} — ${why}`);
  console.log('расхождение значит, что правка ассета до сайта не дойдёт: ищите источник по DEVELOPMENT.md,');
  console.log('раздел «Какие файлы отдаются не из карты ресурсов».');
}
