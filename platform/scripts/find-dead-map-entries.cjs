// Какие записи карт ресурсов не доходят до сайта.
//
// Worker после карты делает присваивания вида files["/path"]="…" — выигрывает
// последнее. Извлечение в assets/ читает только литералы карт, поэтому для
// таких ключей файл в assets/ мёртв: правка его ничего не меняет на сайте.
// Скрипт только читает; сеть не нужна. Запуск:
//   node platform/scripts/find-dead-map-entries.cjs

const fs = require('fs'), vm = require('vm'), path = require('path');
const { maps } = require('./asset-maps.cjs');
const ROOT = require('path').resolve(__dirname, '..');

for (const bundle of ['site', 'backend']) {
  const s = fs.readFileSync(path.join(ROOT, 'workers', bundle + '.mjs'), 'utf8');
  const parsed = maps(s);
  const mapValues = {};
  for (const m of parsed) mapValues[m.name] = m.value;

  function literalAt(start) {
    const q = s[start]; let i = start + 1;
    for (;;) { const c = s[i]; if (c === '\\') { i += 2; continue; } if (c === q) break; i++; }
    try { return vm.runInNewContext('(' + s.slice(start, i + 1) + ')'); } catch { return null; }
  }
  const re = /\b(files|crmWorkflowAssets|crmAssetPatch)\[("([^"\\]|\\.)*")\]\s*=\s*(["'`])/g;
  const last = {};                        // выигрывает последнее присваивание
  let m;
  while ((m = re.exec(s))) {
    const val = literalAt(m.index + m[0].length - 1);
    if (val !== null) last[m[1] + '|' + JSON.parse(m[2])] = val;
  }
  console.log(`\n================ ${bundle}.mjs`);
  const rows = [];
  for (const [k, served] of Object.entries(last)) {
    const [mapName, key] = k.split('|');
    const inMap = mapValues[mapName]?.[key];
    rows.push({ mapName, key,
      state: inMap === undefined ? 'ключа в карте нет'
           : inMap === served ? 'совпадает'
           : `карта мертва (${inMap.length} -> ${served.length})` });
  }
  for (const r of rows.sort((a,b)=>a.mapName.localeCompare(b.mapName)||a.key.localeCompare(b.key)))
    console.log(`  ${r.mapName.padEnd(18)} ${r.key.padEnd(26)} ${r.state}`);
  console.log(`  итого: ${rows.filter(r=>r.state.startsWith('карта мертва')).length} мёртвых из ${rows.length}`);
}
