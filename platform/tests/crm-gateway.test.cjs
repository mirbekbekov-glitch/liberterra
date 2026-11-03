const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').resolve(__dirname,'../workers/backend.mjs'),'utf8');let session={sub:'verified-agent'},calls=[];
const c=vm.createContext({Request,Response,Headers,URL,TextDecoder,Uint8Array,AbortSignal,
  ACCOUNT_WEBHOOK_URL:'https://backend.test',verifyWebSession:async()=>session,isAuthorizedWebSession:async()=>true,
  fetch:async(url,options)=>{calls.push({url,payload:JSON.parse(options.body)});return Response.json({ok:true,records:[]});}});
for(const name of ['corsResponse','handleCrmAction','handlePublicCrmSelection'])vm.runInContext(source.match(new RegExp('^(?:async )?function '+name+'\\([^]*?^\\}','m'))[0],c);
const request=data=>new Request('https://site.test/api/crm-action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
(async()=>{
  let result=await c.handleCrmAction(request({action:'list_crm_workflow',web_user_id:'attacker',auth_secret:'attacker',telegram_id:'attacker'}),{EMAIL_AUTH_SHARED_SECRET:'server-secret'});
  assert.equal(result.status,200);assert.equal(calls[0].payload.web_user_id,'verified-agent');assert.equal(calls[0].payload.auth_secret,'server-secret');assert.equal(calls[0].payload.telegram_id,undefined);
  result=await c.handleCrmAction(request({action:'save_crm_record',init_data:'signed-data',web_user_id:'attacker',auth_secret:'attacker',agent_key:'attacker'}),{});
  assert.equal(result.status,200);assert.equal(calls[1].payload.init_data,'signed-data');assert.equal(calls[1].payload.web_user_id,undefined);assert.equal(calls[1].payload.auth_secret,undefined);assert.equal(calls[1].payload.agent_key,undefined);
  assert.equal(calls[0].url,calls[1].url,'web and Telegram use the same backend');
  session=null;result=await c.handleCrmAction(request({action:'list_crm_workflow'}),{});assert.equal(result.status,403);assert.equal(calls.length,2);
  assert.equal((await c.handleCrmAction(request({action:'delete_user_object'}),{})).status,400);
  assert.equal((await c.handleCrmAction(request({action:'list_crm_workflow',data:'a'.repeat(40000)}),{})).status,413);
  result=await c.handlePublicCrmSelection(request({token:'a'.repeat(64),auth_secret:'attacker',action:'delete_user_object'}));assert.equal(result.status,200);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2].payload)),{action:'get_public_crm_selection',token:'a'.repeat(64)});
  assert.equal(result.headers.get('cache-control'),'no-store');
  console.log('CRM gateway: trusted identity, same backend, operation allowlist, payload bounds and public token-only request OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
