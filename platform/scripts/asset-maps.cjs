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
module.exports={maps,sha};
