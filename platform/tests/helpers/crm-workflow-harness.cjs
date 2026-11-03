const fs=require('node:fs'),vm=require('node:vm');
module.exports=function harness(){
  let actor='a',approved=true,registered=true,locked=false,specialization='sale';
  const sheets=new Map();
  function sheet(){const rows=[];return {rows,getLastRow:()=>rows.length,getLastColumn:()=>rows[0]?.length||0,
    getRange:(row,col,height=1,width=1)=>({
      setValues(values){values.forEach((values,i)=>{rows[row-1+i]||=[];values.forEach((value,j)=>rows[row-1+i][col-1+j]=value);});},
      setValue(value){rows[row-1]||=[];rows[row-1][col-1]=value;},
      getValue:()=>rows[row-1]?.[col-1],
      getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row-1+i]?.[col-1+j]??''))
    })};}
  const objects=[{id:'1',title:'Квартира в центре',city:'Бишкек',district:'Центр',price:'$80 000',per:'',area:'65 м²',rooms:'2',deal:'Продажа',status:'active',owner:'a',phone:'PRIVATE-OWNER',commission:'PRIVATE-COMMISSION'},
    {id:'2',title:'Партнёрский объект',city:'Бишкек',district:'Юг',price:'$90 000',status:'active',owner:'b'},
    {id:'3',title:'Чужой закрытый объект',status:'moderation',owner:'b'}];
  const book={getSheetByName:name=>sheets.get(name)||null,insertSheet(name){const value=sheet();sheets.set(name,value);return value;}};
  const ensure=(sheet,headers)=>{if(!sheet.rows.length)sheet.rows.push([...headers]);headers.forEach(header=>{if(!sheet.rows[0].includes(header))sheet.rows[0].push(header);});return Object.fromEntries(sheet.rows[0].map((key,i)=>[key,i+1]));};
  const c=vm.createContext({console,Date,JSON,Set,Map,
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'private-book'})},
    getAgentPrivateBook_:()=>book,
    registeredUserContext_:()=>registered?{ok:true,telegramId:actor,webUserId:actor==='a'?'web-a':undefined}:{ok:false,error:'registration_required'},
    approvedAgentContext_:(_,context)=>approved?{...context,specialization}:{ok:false,error:'agent_not_approved'},
    normalizeAgentSpecialization_:value=>['sale','rent'].includes(value)?value:'',
    requestRows_:catalog=>catalog.filter(row=>row.deal==='Запрос'),publicCatalogContactPhone_:row=>row.public_contact_phone||'',
    passwordAccounts_:()=>[{telegram_id:'a',web_user_id:'web-a',_account_type:'Агент'}],passwordAccountActive_:()=>true,
    ensureHeaders_:ensure,
    sheetRowsAsObjects_:(sheet,headers)=>{ensure(sheet,headers);return sheet.rows.slice(1).map((row,i)=>({_row:i+2,...Object.fromEntries(headers.map(header=>[header,String(row[sheet.rows[0].indexOf(header)]??'')]))}));},
    cleanText_:value=>String(value??'').trim(),normalizeObjectId_:value=>String(value??'').trim(),safeSheetValue_:value=>String(value??''),
    LockService:{getScriptLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},
    SpreadsheetApp:{flush(){}},Utilities:{getUuid:()=>require('node:crypto').randomUUID()},
    catalogRows_:()=>objects,objectRows_:catalog=>catalog.filter(row=>row.deal!=='Запрос'),objectAgentLinks_:()=>[],
    getObjectRecordById_:id=>objects.find(object=>object.id===id),isPublicCrmObject_:object=>object?.status==='active',
    listingAgentIdForObject_:id=>objects.find(object=>object.id===id)?.owner,
    ownsListingKey_:(actor,key)=>actor.telegramId===key,
    ownObjectIds_:actor=>objects.filter(object=>object.owner===actor.telegramId).map(object=>object.id),objectIdsEqual_:(a,b)=>a===b,
    AGENT_TASK_HEADERS:['task_id','agent_key','title','object_id','due_at','status','created_at','updated_at','client_id'],
    getAgentTasksSheet_:()=>{const sheet=book.getSheetByName('Agent Tasks')||book.insertSheet('Agent Tasks');ensure(sheet,c.AGENT_TASK_HEADERS);return sheet;}
  });
  vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../../apps-script/crm-workflow-server.gs'),'utf8'),c);
  return {c,objects,sheets,setSpecialization(value){specialization=value;},setActor(value){actor=value;},setApproved(value){approved=value;},setRegistered(value){registered=value;},setLocked(value){locked=value;},
    request(action,payload={}){if(action==='get_public_crm_selection')return c.getPublicCrmSelection_(payload);if(['list_agent_tasks','save_agent_task'].includes(action))return c.agentTasksAction_(payload,action);return c.crmWorkflowAction_(payload,action);}};
};
