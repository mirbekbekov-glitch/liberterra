const crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
// Embedded maps use double- or single-quoted JS strings; both are read here.
function readString(source,i){
 const quote=source[i];let out='';i++;
 // A template literal is read as text only when it interpolates nothing.
 for(;;){
  const c=source[i];
  if(c===undefined)return null;
  if(c==='\\'){
   const n=source[i+1];i+=2;
   if(n==='n')out+='\n';else if(n==='r')out+='\r';else if(n==='t')out+='\t';else if(n==='b')out+='\b';else if(n==='f')out+='\f';else if(n==='v')out+='\v';else if(n==='0'&&!/[0-9]/.test(source[i]||''))out+='\0';
   else if(n==='x'){out+=String.fromCharCode(parseInt(source.slice(i,i+2),16));i+=2;}
   else if(n==='u'){if(source[i]==='{'){const end=source.indexOf('}',i);out+=String.fromCodePoint(parseInt(source.slice(i+1,end),16));i=end+1;}else{out+=String.fromCharCode(parseInt(source.slice(i,i+4),16));i+=4;}}
   else if(n==='\n')continue;else if(n==='\r'){if(source[i]==='\n')i++;continue;}
   else out+=n;
   continue;
  }
  if(c===quote)return {value:out,next:i+1};
  if(quote==='`'&&c==='$'&&source[i+1]==='{')return null;
  out+=c;i++;
 }
}
function readObject(source,start){
 const value={};let i=start+1;
 for(;;){
  while(/\s/.test(source[i]))i++;
  if(source[i]==='}')return {value,next:i+1};
  if(source[i]===','){i++;continue;}
  if(!'"\''.includes(source[i]))return null;
  const key=readString(source,i);if(!key)return null;i=key.next;
  while(/\s/.test(source[i]))i++;
  if(source[i]!==':')return null;i++;
  while(/\s/.test(source[i]))i++;
  if(!'"\'`'.includes(source[i]))return null;
  const item=readString(source,i);if(!item)return null;i=item.next;
  value[key.value]=item.value;
 }
}
function maps(source){
 const found=[];
 for(const match of source.matchAll(/(?:const|var|let)\s+(files|crmAssetPatch|crmWorkflowAssets)\s*=\s*(?=\{)/g)){
  const start=match.index+match[0].length;
  const parsed=readObject(source,start);
  if(!parsed)continue;
  const end=parsed.next;
  found.push({name:match[1],start,end,value:parsed.value,literal:source.slice(start,end)});
 }
 return found;
}
// Below the maps the Worker reassigns single keys: files["/path"]="…". The last
// assignment wins at runtime, so for those keys the map literal is never served.
// Reads the same string forms as the maps; matches inside a map literal are
// skipped, because there they are asset text, not code.
function assignments(source,known=maps(source)){
 const found=[];
 for(const match of source.matchAll(/\b(files|crmAssetPatch|crmWorkflowAssets)\s*\[\s*(?=["'])/g)){
  const at=match.index;
  if(known.some(map=>at>=map.start&&at<map.end))continue;
  let i=match.index+match[0].length;
  const key=readString(source,i);if(!key)continue;i=key.next;
  while(/\s/.test(source[i]))i++;
  if(source[i]!==']')continue;i++;
  while(/\s/.test(source[i]))i++;
  if(source[i]!=='='||source[i+1]==='=')continue;i++;
  while(/\s/.test(source[i]))i++;
  if(!'"\'`'.includes(source[i]))continue;
  const start=i,item=readString(source,i);if(!item)continue;
  found.push({name:match[1],key:key.value,start,end:item.next,value:item.value,literal:source.slice(start,item.next)});
 }
 return found;
}
// What the Worker actually serves per key: the last assignment, else the map.
function served(source){
 const found=maps(source),list=assignments(source,found),out=new Map();
 for(const map of found)for(const [key,value] of Object.entries(map.value))out.set(map.name+'\u0000'+key,{name:map.name,key,value,from:'map'});
 for(const item of list)out.set(item.name+'\u0000'+item.key,{name:item.name,key:item.key,value:item.value,from:'assignment'});
 return out;
}
module.exports={maps,assignments,served,sha};
