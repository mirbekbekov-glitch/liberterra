const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {build}=require('../scripts/build.cjs'),sandbox=require('./sandbox.cjs');
const root=path.resolve(__dirname,'..');
async function start({port=4173,dataDir=path.join(root,'.sandbox')}={}){
 build();fs.mkdirSync(dataDir,{recursive:true});const lock=path.join(dataDir,'server.lock');
 const store=sandbox(path.join(dataDir,'sheets.json')),sessions=new Map();let origin;
 const actorFor=request=>sessions.get((request.headers.get('cookie')||'').match(/(?:^|;\s*)lt_sandbox=([a-f0-9]+)/)?.[1]);
 const context=vm.createContext({Request,Response,Headers,URL,TextDecoder,Uint8Array,AbortSignal,
  ACCOUNT_WEBHOOK_URL:'https://sandbox.invalid/apps-script',
  verifyWebSession:async request=>{const actor=actorFor(request);return actor?{sub:actor}:null;},isAuthorizedWebSession:async()=>true,
  fetch:async(url,options)=>{
   if(url!=='https://sandbox.invalid/apps-script')throw Error('External network denied');
   const payload=JSON.parse(options.body);
   if(payload.auth_secret!=='sandbox-only'||!['a','b','blocked'].includes(payload.web_user_id)||payload.init_data)return Response.json({ok:false,error:'registration_required'},{status:403});
   return Response.json(store.request(payload.web_user_id,payload.action,payload));
  }});
 const backend=fs.readFileSync(path.join(root,'dist/workers/backend.mjs'),'utf8');
 for(const name of ['corsResponse','handleCrmAction','handlePublicCrmSelection']){
  const found=backend.match(new RegExp('^(?:async )?function '+name+'\\([^]*?^\\}','m'));if(!found)throw Error('Missing gateway '+name);vm.runInContext(found[0],context);
 }
 const headers={ 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-src 'none'; form-action 'self'; base-uri 'self'"};
 fs.writeFileSync(lock,String(process.pid),{flag:'wx'});
 const server=http.createServer(async(req,res)=>{
  const reply=(status,body,type='application/json',extra={})=>{res.writeHead(status,{...headers,'Content-Type':type,...extra});res.end(type==='application/json'?JSON.stringify(body):body);};
  try{
   if(req.headers.host!==new URL(origin).host)return reply(403,{ok:false,error:'host_denied'});
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    if(req.headers.origin!==origin)return reply(403,{ok:false,error:'origin_denied'});
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>32768)return reply(413,{ok:false,error:'request_too_large'});chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);let input;try{input=JSON.parse(bytes);}catch{return reply(400,{ok:false,error:'invalid_json'});}
    if(url.pathname==='/__dev/session'){
     if(!['a','b','blocked',''].includes(input.actor))return reply(400,{ok:false,error:'invalid_actor'});
     const old=(req.headers.cookie||'').match(/lt_sandbox=([a-f0-9]+)/)?.[1];if(old)sessions.delete(old);
     const token=crypto.randomBytes(24).toString('hex');if(input.actor)sessions.set(token,input.actor);
     return reply(200,{ok:true},'application/json',{'Set-Cookie':`lt_sandbox=${input.actor?token:''}; HttpOnly; SameSite=Strict; Path=/`});
    }
    const request=new Request(url,{method:'POST',headers:req.headers,body:bytes});const actor=actorFor(request);
    if(url.pathname==='/__dev/read'){
     if(!actor)return reply(403,{ok:false,error:'registration_required'});
     if(input.action==='get_agent_dashboard'){const data=store.dashboard(actor);return reply(data.ok?200:403,data);}
     if(input.action==='list_agent_private_access'&&actor!=='blocked')return reply(200,{ok:true,incoming:[],outgoing:[]});
     return reply(403,{ok:false,error:'sandbox_action_unavailable'});
    }
    if(url.pathname==='/api/crm-action'){
     const response=await context.handleCrmAction(request,{EMAIL_AUTH_SHARED_SECRET:'sandbox-only'});
     return reply(response.status,await response.json());
    }
    return reply(404,{ok:false,error:'sandbox_action_unavailable'});
   }
   if(req.method!=='GET')return reply(405,{ok:false,error:'method_not_allowed'});
   if(url.pathname==='/__dev/session')return reply(200,{actor:actorFor(new Request(url,{headers:req.headers}))||''});
   if(url.pathname==='/__dev/client.js')return reply(200,fs.readFileSync(path.join(__dirname,'client.js')),'text/javascript');
   if(['/api/crm-workflow/agent-access.js','/agent-access.js'].includes(url.pathname))return reply(200,fs.readFileSync(path.join(__dirname,'access.js')),'text/javascript');
   if(['/telegram-membership.js','/analytics.js','/api/crm-workflow/auth-entry.js'].includes(url.pathname))return reply(200,'/* Disabled on isolated sandbox. */','text/javascript');
   if(url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/crm-workflow/')&&url.pathname!=='/api/crm/style.css')return reply(404,{ok:false,error:'sandbox_api_unavailable'});
   const rel=url.pathname==='/'?'agent-cabinet.html':decodeURIComponent(url.pathname).replace(/^\//,'');
   const pub=path.join(root,'dist/public'),file=path.resolve(pub,rel);
   if(!file.startsWith(pub+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return reply(404,'Not available in CRM sandbox','text/plain');
   const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
   let body=fs.readFileSync(file);
   if(type==='text/html')body=body.toString('utf8').replace(/<script\b[^>]*src=["']https?:[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href=["']https?:[^>]*>/gi,'').replace('</head>',`<style>body{padding-top:78px!important}.sandbox-bar{position:fixed;z-index:10000;top:0;left:0;right:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;background:#fff4ce;color:#392b05;font:12px system-ui;border-bottom:1px solid #927326}.sandbox-bar button{min-height:32px;background:white;color:#392b05;border:1px solid #927326;border-radius:6px;padding:4px 10px}</style></head>`).replace('</body>','<script src="/__dev/client.js" defer></script></body>');
   reply(200,body,type);
  }catch(error){reply(500,{ok:false,error:'sandbox_error'});console.error(error.message);}
 });
 const cleanup=()=>{if(fs.existsSync(lock))fs.unlinkSync(lock);};server.once('close',cleanup);
 await new Promise((resolve,reject)=>{server.once('error',e=>{cleanup();reject(e)});server.listen(port,'127.0.0.1',resolve);});origin='http://127.0.0.1:'+server.address().port;
 return {server,origin,close:()=>new Promise(resolve=>server.close(resolve))};
}
module.exports={start};
if(require.main===module)start({port:Number(process.argv[2]||4173)}).then(app=>{console.log('Isolated CRM sandbox: '+app.origin);for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit()));}).catch(e=>{console.error(e.message);process.exitCode=1;});
