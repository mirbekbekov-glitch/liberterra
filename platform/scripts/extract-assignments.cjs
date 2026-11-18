// Извлечение значений, которые Worker присваивает после карты ресурсов.
//
// Карта — не единственный источник: ниже по коду стоят присваивания вида
// files["/path"]="…", и при старте Worker выигрывает последнее. Для таких
// ключей файл в assets/ не отдаётся никогда. Скрипт выносит отдаваемые
// значения в assets/<bundle>/assign/<карта>/<ключ> и записывает assignments.json,
// после чего build.cjs собирает их обратно и правка начинает доходить до сайта.
//
// Запуск один раз: node platform/scripts/extract-assignments.cjs
// Существующий манифест не перезаписывается.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { maps, assignments, sha } = require('./asset-maps.cjs');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'assignments.json');

// Ключ -> путь внутри assets/. Обратимо и без выхода за каталог.
function fileNameFor(key) {
  const rest = key.replace(/^\//, '');
  if (rest === '') return '__root__';
  assert.ok(!rest.split('/').includes('..'), 'Недопустимый ключ: ' + key);
  assert.ok(/^[A-Za-z0-9._/-]+$/.test(rest), 'Недопустимый ключ: ' + key);
  return rest;
}

function extract({ write = true } = {}) {
  assert.ok(!write || !fs.existsSync(manifestPath), 'assignments.json уже есть; удалите его осознанно, чтобы пересобрать');
  const report = { version: 1, bundles: [] };
  for (const name of ['site', 'backend']) {
    const file = path.join(root, 'workers', name + '.mjs');
    const source = fs.readFileSync(file, 'utf8');
    const known = maps(source);
    const list = assignments(source, known);

    // Выигрывает последнее присваивание: остальные остаются в шаблоне как есть.
    const lastOf = new Map();
    for (const item of list) lastOf.set(item.name + '\u0000' + item.key, item);

    const entries = [], used = new Map();
    for (const item of [...lastOf.values()].sort((a, b) => a.start - b.start)) {
      const relative = path.posix.join('assets', name, 'assign', item.name, fileNameFor(item.key));
      const clash = used.get(relative);
      assert.ok(!clash, `Ключи «${clash}» и «${item.key}» дают один файл ${relative}`);
      used.set(relative, item.key);
      if (write) {
        const target = path.join(root, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, item.value);
      }
      entries.push({ map: item.name, key: item.key, file: relative, sha256: sha(item.value), bytes: Buffer.byteLength(item.value) });
    }
    report.bundles.push({ name, sha256: sha(source), entries });
  }
  if (write) fs.writeFileSync(manifestPath, JSON.stringify(report, null, 2) + '\n');
  return report;
}

module.exports = { extract, fileNameFor };
if (require.main === module) {
  const report = extract();
  for (const bundle of report.bundles) console.log(`${bundle.name}: вынесено ${bundle.entries.length} присваиваний`);
}
