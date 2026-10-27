const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), manifest=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/,/\bya29\.[A-Za-z0-9_-]{30,}/,/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/,/\bAKIA[0-9A-Z]{16}\b/];
let parsed=0;
for(const entry of manifest.files){
 const file=path.join(root,entry.path),bytes=fs.readFileSync(file);
 if(process.argv.includes('--baseline'))assert.equal(sha(bytes),entry.sha256,'Baseline changed: '+entry.path);
 if(/\.(mjs|js|gs|css|html|json|txt)$/.test(file)){
  const source=bytes.toString('utf8');
  for(const pattern of patterns)assert(!pattern.test(source),'Potential credential in '+entry.path);
  if(/\.(js|gs)$/.test(file)){new vm.Script(source,{filename:entry.path});parsed++;}
  if(file.endsWith('.mjs')){cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});parsed++;}
  if(file.endsWith('.json'))JSON.parse(source);
 }
}
const backend=fs.readFileSync(path.join(root,'workers/backend.mjs'),'utf8');
const marker='const crmWorkflowAssets = ',start=backend.indexOf(marker),end=backend.indexOf(';\nfunction crmWorkflowAssetResponse',start);
assert(start>=0&&end>start,'CRM asset map missing');
const embedded=JSON.parse(backend.slice(start+marker.length,end));
if(process.argv.includes('--baseline'))for(const [name,source]of Object.entries(embedded))assert.equal(fs.readFileSync(path.join(root,'public/api/crm-workflow',name),'utf8'),source,'Served CRM asset differs from active backend: '+name);
console.log(JSON.stringify({files:manifest.files.length,syntaxChecked:parsed,crmAssets:Object.keys(embedded).length,baseline:process.argv.includes('--baseline'),credentialPatterns:'passed'}));
