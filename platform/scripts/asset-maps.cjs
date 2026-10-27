const crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function maps(source){
 const found=[];
 for(const match of source.matchAll(/(?:const|var|let)\s+(files|crmAssetPatch|crmWorkflowAssets)\s*=\s*(?=\{)/g)){
  const start=match.index+match[0].length;let depth=0,quoted=false,escaped=false,end;
  for(let i=start;i<source.length;i++){
   const c=source[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}
   else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break;}
  }
  try{const value=JSON.parse(source.slice(start,end));if(Object.values(value).every(v=>typeof v==='string'))found.push({name:match[1],start,end,value,literal:source.slice(start,end)});}catch{}
 }
 return found;
}
module.exports={maps,sha};
