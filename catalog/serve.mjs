// Локальный прогон Worker в Node: подменяем fetch на чтение сохранённого CSV.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import worker from './worker.mjs';
const csv = readFileSync(new URL('../pub.csv', import.meta.url), 'utf8');
const agents = readFileSync(new URL('../agents.json', import.meta.url), 'utf8');
globalThis.fetch = async (url) => String(url).includes('public-agents')
  ? new Response(agents, { status: 200, headers: { 'content-type': 'application/json' } })
  : new Response(csv, { status: 200, headers: { 'content-type': 'text/csv' } });
createServer(async (req, res) => {
  const response = await worker.fetch(new Request('http://localhost:8787' + req.url), {}, {});
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(8787, () => console.log('слушаю http://localhost:8787'));
