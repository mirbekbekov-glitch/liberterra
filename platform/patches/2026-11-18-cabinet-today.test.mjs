import fs from 'node:fs';
const win = {};
globalThis.window = win;
const stub = () => ({ setAttribute(){}, append(){}, prepend(){}, addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[], classList:{add(){}}, dataset:{}, style:{} });
globalThis.document = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: stub, body: stub() };
globalThis.MutationObserver = class { observe(){} disconnect(){} };
globalThis.addEventListener = () => {};
win.addEventListener = () => {};
new Function(fs.readFileSync('crm-workspace.js','utf8'))();
const model = globalThis.LiberterraCrmHomeModel || win.LiberterraCrmHomeModel;
if (!model) { console.log('МОДЕЛЬ НЕ ЗАРЕГИСТРИРОВАНА'); process.exit(1); }

const now = Date.parse('2026-11-18T12:00:00Z');
const overdueDeal = { kind:'deal', stage:'negotiation', next_action_at:'2026-11-10T00:00:00Z' };
const client = { kind:'client', stage:'active' };

const cases = [
  ['экран со скриншота: 217 заявок, клиентов нет',
   { records: [], objects: [], tasks: [], tasksReady: true, requests: 217 }, 'Принять заявки · 217', 'requests'],
  ['просрочка важнее заявок',
   { records: [overdueDeal], objects: [], tasks: [], tasksReady: true, requests: 217 }, 'Разобрать просроченное · 1', 'attention'],
  ['заявок нет, клиентов нет',
   { records: [], objects: [], tasks: [], tasksReady: true, requests: 0 }, 'Добавить первого клиента', 'client'],
  ['заявок нет, клиент есть',
   { records: [client], objects: [], tasks: [], tasksReady: true, requests: 0 }, 'Открыть воронку сделок', 'deal'],
  ['requests не передан (старый вызов)',
   { records: [client], objects: [], tasks: [], tasksReady: true }, 'Открыть воронку сделок', 'deal'],
  ['requests = null',
   { records: [], objects: [], tasks: [], tasksReady: true, requests: null }, 'Добавить первого клиента', 'client'],
];

let bad = 0;
for (const [name, input, wantLabel, wantKind] of cases) {
  const r = model.summarize(input, now).primary;
  const ok = r.label === wantLabel && r.kind === wantKind;
  if (!ok) bad++;
  console.log(`${ok?'ok  ':'FAIL'}  ${name}\n        -> ${r.kind} / "${r.label}"${ok?'':`  ожидалось ${wantKind} / "${wantLabel}"`}`);
}
console.log(bad ? `\n${bad} провалов` : '\nвсе случаи прошли');
process.exit(bad ? 1 : 0);
