// One-time extraction from the immutable production snapshot. Refuses overwrite.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {maps,sha}=require('./asset-maps.cjs'),root=path.resolve(__dirname,'..');
assert(!fs.existsSync(path.join(root,'assets.json')),'Assets already extracted');
const manifest={version:1,bundles:[]};
for(const name of ['backend','site']){
 const source=fs.readFileSync(path.join(root,'workers',name+'.mjs'),'utf8');
 const bundle={name,sha256:sha(source),maps:[]};
 for(const map of maps(source)){
  const entries=[];
  for(const [key,value]of Object.entries(map.value)){
   const rel=key==='/'?'_root.html':key.replace(/^\//,'');assert(!rel.includes('..'));
   const file='assets/'+name+'/'+map.name+'/'+rel;
   fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),value,{flag:'wx'});
   entries.push({key,file,sha256:sha(value),append:[]});
  }
  bundle.maps.push({name:map.name,entries});
 }
 manifest.bundles.push(bundle);
}
fs.writeFileSync(path.join(root,'assets.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('Extracted '+manifest.bundles.reduce((n,b)=>n+b.maps.reduce((n,m)=>n+m.entries.length,0),0)+' embedded resources');
