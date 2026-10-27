const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {maps,sha}=require('./asset-maps.cjs');
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
 for(const bundle of config.bundles){
  const original=fs.readFileSync(path.join(root,'workers',bundle.name+'.mjs'),'utf8');assert.equal(sha(original),bundle.sha256,'Captured Worker template changed');
  const parsed=maps(original);assert.equal(parsed.length,bundle.maps.length);let source=original;
  for(let i=parsed.length-1;i>=0;i--){
   const map=parsed[i],spec=bundle.maps[i];assert.equal(map.name,spec.name);const next={};
   for(const entry of spec.entries){
    let value=fs.readFileSync(path.join(root,entry.file),'utf8');
    for(const extra of [...(entry.append||[]),...(features[bundle.name+'/'+map.name+'/'+entry.key]||[])])value+='\n'+fs.readFileSync(path.join(root,extra),'utf8').replace(/\r\n/g,'\n');
    next[entry.key]=value;
    if(map.name==='crmWorkflowAssets'){
     const file=path.join(out,'public/api/crm-workflow',entry.key);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);
     if(entry.key==='agent-cabinet.html')fs.writeFileSync(path.join(out,'public/agent-cabinet.html'),value);
    }
   }
   const same=JSON.stringify(next)===JSON.stringify(map.value);
   source=source.slice(0,map.start)+(same?map.literal:JSON.stringify(next))+source.slice(map.end);
  }
  fs.mkdirSync(path.join(out,'workers'),{recursive:true});fs.writeFileSync(path.join(out,'workers',bundle.name+'.mjs'),source);
  report.bundles.push({name:bundle.name,sha256:sha(source),baselineEqual:source===original});
 }
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(path.relative(out,f)!=='build-manifest.json')report.files.push({path:path.relative(out,f).replace(/\\/g,'/'),sha256:sha(fs.readFileSync(f))});}}
 walk(out);fs.writeFileSync(path.join(out,'build-manifest.json'),JSON.stringify(report,null,2)+'\n');return report;
}
module.exports={build};
if(require.main===module)console.log(JSON.stringify(build().bundles));
