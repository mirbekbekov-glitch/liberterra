// Synthetic identity/Sheets adapter. Production workflow functions remain unchanged.
const fs=require('node:fs'),path=require('node:path');
const harness=require('../tests/helpers/crm-workflow-harness.cjs');
module.exports=function sandbox(file){
 const h=harness();
 if(file&&fs.existsSync(file)){
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.schema!==1)throw Error('Unsupported sandbox data schema');
  for(const [name,rows]of saved.sheets)h.c.getAgentPrivateBook_().insertSheet(name).rows.push(...rows);
 }
 function persist(){if(!file)return;fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify({schema:1,sheets:[...h.sheets].map(([name,sheet])=>[name,sheet.rows])},null,2));fs.renameSync(tmp,file);}
 return {request(actor,action,payload={}){
   h.setActor(actor);h.setRegistered(['a','b','blocked'].includes(actor));h.setApproved(actor!=='blocked');
   const result=h.request(action,payload);if(result.ok&&action.startsWith('save_'))persist();return result;
  },dashboard(actor){
   if(!['a','b'].includes(actor))return {ok:false,error:'agent_not_approved'};
   return {ok:true,agent:{name:'Тестовый агент '+actor.toUpperCase(),specialization:'sale'},objects:[],clients:[],notes:[],counters:{active:0,moderation:0,removed:0}};
  }};
};
