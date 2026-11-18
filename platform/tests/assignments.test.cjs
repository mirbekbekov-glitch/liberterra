const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { maps, assignments, served, sha } = require('../scripts/asset-maps.cjs');
const { build } = require('../scripts/build.cjs');
const { extract } = require('../scripts/extract-assignments.cjs');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assignments.json'), 'utf8'));
const features = fs.existsSync(path.join(root, 'features.json'))
  ? JSON.parse(fs.readFileSync(path.join(root, 'features.json'), 'utf8')) : {};
const source = name => fs.readFileSync(path.join(root, 'workers', name + '.mjs'), 'utf8');

test('присваивания после карты читаются и не берутся из текста ресурсов', () => {
  for (const bundle of manifest.bundles) {
    const text = source(bundle.name);
    const found = assignments(text, maps(text));
    assert.ok(found.length >= bundle.entries.length, 'присваиваний не меньше, чем записей манифеста');
    for (const item of found) {
      assert.equal(text.slice(item.start, item.end), item.literal);
      assert.ok(!'\'"`'.includes(item.value[0] || ''), 'значение разобрано, а не оставлено литералом');
    }
  }
});

test('отдаваемое значение — последнее присваивание, иначе карта', () => {
  const text = source('backend');
  const table = served(text);
  const cabinet = table.get('crmWorkflowAssets\u0000crm-workspace.js');
  assert.equal(cabinet.from, 'assignment');
  const mapValue = maps(text).find(m => m.name === 'crmWorkflowAssets').value['crm-workspace.js'];
  assert.notEqual(cabinet.value, mapValue, 'запись карты для этого ключа не отдаётся');
});

test('манифест соответствует шаблонам и вынесенным файлам', () => {
  for (const bundle of manifest.bundles) {
    assert.equal(sha(source(bundle.name)), bundle.sha256, 'манифест снят с текущего шаблона');
    for (const entry of bundle.entries) {
      const file = fs.readFileSync(path.join(root, entry.file), 'utf8');
      assert.equal(sha(file), entry.sha256, entry.file + ' разошёлся с манифестом');
    }
  }
  // Повторное извлечение без записи даёт тот же состав.
  const again = extract({ write: false });
  assert.deepEqual(again.bundles.map(b => b.entries.map(e => e.map + '|' + e.key)),
    manifest.bundles.map(b => b.entries.map(e => e.map + '|' + e.key)));
});

test('правка вынесенного файла доходит до собранного бандла', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-assign-'));
  try {
    const report = build(path.join(dir, 'out'));
    assert.ok(report.bundles.length);
    for (const bundle of manifest.bundles) {
      const table = served(fs.readFileSync(path.join(dir, 'out/workers', bundle.name + '.mjs'), 'utf8'));
      for (const entry of bundle.entries) {
        let expected = fs.readFileSync(path.join(root, entry.file), 'utf8');
        for (const extra of features[bundle.name + '/' + entry.map + '/' + entry.key] || [])
          expected += '\n' + fs.readFileSync(path.join(root, extra), 'utf8').replace(/\r\n/g, '\n');
        const actual = table.get(entry.map + '\u0000' + entry.key);
        assert.ok(actual, `в сборке нет ключа ${entry.map}[${entry.key}]`);
        assert.equal(actual.value, expected, `${entry.file} не доехал до бандла`);
      }
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('дописанное из features.json попадает в отдаваемое значение ровно один раз', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-feature-'));
  try {
    build(path.join(dir, 'out'));
    for (const [key, extras] of Object.entries(features)) {
      const [bundleName, mapName, entryKey] = key.split('/');
      const table = served(fs.readFileSync(path.join(dir, 'out/workers', bundleName + '.mjs'), 'utf8'));
      const value = table.get(mapName + '\u0000' + entryKey);
      assert.ok(value, `в сборке нет ключа ${mapName}[${entryKey}]`);
      for (const extra of extras) {
        const text = fs.readFileSync(path.join(root, extra), 'utf8').replace(/\r\n/g, '\n');
        const mark = text.trim().slice(0, 400);
        const count = value.value.split(mark).length - 1;
        assert.equal(count, 1, `${extra} встречается в ${entryKey} ${count} раз, а должен один`);
      }
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// Фичу могли дописать прямо в Worker до того, как её положили в features.json.
// Тогда append сдублировал бы её молча, поэтому сборка обязана остановиться.
test('сборка падает, если фича уже внутри отдаваемого значения', () => {
  const key = 'backend/crmWorkflowAssets/crm-workflow.js';
  const file = manifest.bundles.find(b => b.name === 'backend').entries
    .find(e => e.map === 'crmWorkflowAssets' && e.key === 'crm-workflow.js').file;
  const value = fs.readFileSync(path.join(root, file), 'utf8');
  const deals = fs.readFileSync(path.join(root, 'features/deals.js'), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(value.includes(deals.trim().slice(0, 400)),
    'воронка сделок уже внутри снимка: если это перестало быть правдой, тест надо переписать');
  const backup = fs.readFileSync(path.join(root, 'features.json'), 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-guard-'));
  try {
    fs.writeFileSync(path.join(root, 'features.json'),
      JSON.stringify({ ...JSON.parse(backup), [key]: ['features/deals.js'] }, null, 2) + '\n');
    assert.throws(() => build(path.join(dir, 'out')), /уже внутри/);
    assert.ok(!fs.existsSync(path.join(dir, 'out')), 'проверка идёт до записи: каталог сборки не создан');
  } finally {
    fs.writeFileSync(path.join(root, 'features.json'), backup);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
