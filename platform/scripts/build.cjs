const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {maps,assignments,sha}=require('./asset-maps.cjs');
const root=path.resolve(__dirname,'..');
function build(out=path.join(root,'dist')){
 out=path.resolve(out);
 // Only remove an owned build directory; never clean arbitrary caller paths.
 if(fs.existsSync(out)&&fs.readdirSync(out).length){
  const marker=path.join(out,'build-manifest.json');
  assert.ok(fs.existsSync(marker),'Output must be empty or an existing generated build');
  const old=JSON.parse(fs.readFileSync(marker,'utf8'));assert.equal(old.schemaVersion,1);assert.ok(Array.isArray(old.bundles)&&Array.isArray(old.files));
  const known=new Set(old.files.map(entry=>entry.path).concat('build-manifest.json'));
  function check(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);assert.ok(!item.isSymbolicLink(),'Symlinks are not build outputs');if(item.isDirectory())check(file);else assert.ok(known.has(path.relative(out,file).replace(/\\/g,'/')),'Unexpected file in output: '+file);}}check(out);
  for(const entry of old.files){const file=path.resolve(out,entry.path);assert.ok(file.startsWith(out+path.sep),'Invalid build manifest path');if(fs.existsSync(file))fs.unlinkSync(file);}
  fs.unlinkSync(marker);
 }
 const config=JSON.parse(fs.readFileSync(path.join(root,'assets.json'),'utf8')),report={schemaVersion:1,bundles:[],files:[]};
 const features=fs.existsSync(path.join(root,'features.json'))?JSON.parse(fs.readFileSync(path.join(root,'features.json'),'utf8')):{};
 fs.mkdirSync(out,{recursive:true});
 fs.cpSync(path.join(root,'public'),path.join(out,'public'),{recursive:true});
 fs.cpSync(path.join(root,'apps-script'),path.join(out,'apps-script'),{recursive:true});
 // Ключи, которые Worker перезаписывает присваиванием после карты: правка карты
 // для них в бой не идёт, поэтому собираются они из assets/<bundle>/assign/.
 const assignConfig=fs.existsSync(path.join(root,'assignments.json'))?JSON.parse(fs.readFileSync(path.join(root,'assignments.json'),'utf8')):{bundles:[]};
 for(const bundle of config.bundles){
  const original=fs.readFileSync(path.join(root,'workers',bundle.name+'.mjs'),'utf8');assert.equal(sha(original),bundle.sha256,'Captured Worker template changed');
  const parsed=maps(original);assert.equal(parsed.length,bundle.maps.length);
  const assignSpec=assignConfig.bundles.find(item=>item.name===bundle.name);
  if(assignSpec)assert.equal(assignSpec.sha256,bundle.sha256,'assignments.json снят с другого шаблона Worker');
  const found=assignments(original,parsed),edits=[];
  // Выигрывает последнее присваивание ключа; остальные остаются как есть.
  const lastOf=new Map();for(const item of found)lastOf.set(item.name+'\u0000'+item.key,item);
  const overridden=new Set(lastOf.keys()),servedValue=new Map();
  const withExtras=(value,key)=>{for(const extra of features[key]||[])value+='\n'+fs.readFileSync(path.join(root,extra),'utf8').replace(/\r\n/g,'\n');return value;};
  for(const entry of assignSpec?.entries||[]){
   const item=lastOf.get(entry.map+'\u0000'+entry.key);
   assert.ok(item,`В шаблоне нет присваивания ${entry.map}[${entry.key}]`);
   const value=withExtras(fs.readFileSync(path.join(root,entry.file),'utf8'),bundle.name+'/'+entry.map+'/'+entry.key);
   servedValue.set(entry.map+'\u0000'+entry.key,value);
   edits.push({start:item.start,end:item.end,text:value===item.value?item.literal:JSON.stringify(value)});
  }
  for(let i=parsed.length-1;i>=0;i--){
   const map=parsed[i],spec=bundle.maps[i];assert.equal(map.name,spec.name);const next={};
   for(const entry of spec.entries){
    const id=map.name+'\u0000'+entry.key;
    let value=fs.readFileSync(path.join(root,entry.file),'utf8');
    for(const extra of entry.append||[])value+='\n'+fs.readFileSync(path.join(root,extra),'utf8').replace(/\r\n/g,'\n');
    // Дописанное из features.json идёт в то значение, которое реально отдаётся.
    if(!overridden.has(id))value=withExtras(value,bundle.name+'/'+map.name+'/'+entry.key);
    next[entry.key]=value;
    if(!servedValue.has(id))servedValue.set(id,value);
   }
   const same=JSON.stringify(next)===JSON.stringify(map.value);
   edits.push({start:map.start,end:map.end,text:same?map.literal:JSON.stringify(next)});
  }
  for(const [id,value] of servedValue){
   const [mapName,key]=id.split('\u0000');
   if(mapName!=='crmWorkflowAssets')continue;
   const file=path.join(out,'public/api/crm-workflow',key);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);
   if(key==='agent-cabinet.html')fs.writeFileSync(path.join(out,'public/agent-cabinet.html'),value);
  }
  let source=original;
  for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  fs.mkdirSync(path.join(out,'workers'),{recursive:true});fs.writeFileSync(path.join(out,'workers',bundle.name+'.mjs'),source);
  report.bundles.push({name:bundle.name,sha256:sha(source),baselineEqual:source===original});
 }
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(path.relative(out,f)!=='build-manifest.json')report.files.push({path:path.relative(out,f).replace(/\\/g,'/'),sha256:sha(fs.readFileSync(f))});}}
 walk(out);fs.writeFileSync(path.join(out,'build-manifest.json'),JSON.stringify(report,null,2)+'\n');return report;
}
module.exports={build};
if(require.main===module)console.log(JSON.stringify(build().bundles));
