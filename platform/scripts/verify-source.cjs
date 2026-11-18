const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), manifest=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/,/\bya29\.[A-Za-z0-9_-]{30,}/,/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/,/\bAKIA[0-9A-Z]{16}\b/];
let parsed=0;
// Published assets mix classic scripts and ES modules; each is parsed in its own mode.
function checkScript(source,name){
 if(/^\s*(?:export|import)[\s{*]/m.test(source)){cp.execFileSync(process.execPath,['--input-type=module','--check'],{input:source,stdio:['pipe','pipe','pipe']});return;}
 new vm.Script(source,{filename:name});
}
for(const entry of manifest.files){
 const file=path.join(root,entry.path),bytes=fs.readFileSync(file);
 if(process.argv.includes('--baseline'))assert.equal(sha(bytes),entry.sha256,'Baseline changed: '+entry.path);
 if(/\.(mjs|js|gs|css|html|json|txt)$/.test(file)){
  const source=bytes.toString('utf8');
  for(const pattern of patterns)assert(!pattern.test(source),'Potential credential in '+entry.path);
  if(/\.(js|gs)$/.test(file)){checkScript(source,entry.path);parsed++;}
  if(file.endsWith('.mjs')){cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});parsed++;}
  if(file.endsWith('.json'))JSON.parse(source);
 }
}
const backend=fs.readFileSync(path.join(root,'workers/backend.mjs'),'utf8');
const crmMap=require('./asset-maps.cjs').maps(backend).find(map=>map.name==='crmWorkflowAssets');
assert(crmMap,'CRM asset map missing');
const embedded=crmMap.value;
let authored=0;
function inspect(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){inspect(file);continue;}const source=fs.readFileSync(file,'utf8');for(const pattern of patterns)assert(!pattern.test(source),'Potential credential in '+file);if(/\.(cjs|js)$/.test(file)){checkScript(source,file);authored++;}if(file.endsWith('.json'))JSON.parse(source);}}
for(const directory of ['assets','features','dev','scripts','tests'])inspect(path.join(root,directory));
if(process.argv.includes('--baseline'))for(const [name,source]of Object.entries(embedded))assert.equal(fs.readFileSync(path.join(root,'assets/backend/crmWorkflowAssets',name),'utf8'),source,'Extracted CRM asset differs from active backend: '+name);
console.log(JSON.stringify({files:manifest.files.length,syntaxChecked:parsed,authoredSyntaxChecked:authored,crmAssets:Object.keys(embedded).length,baseline:process.argv.includes('--baseline'),credentialPatterns:'passed'}));
