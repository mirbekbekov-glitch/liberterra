(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LiberterraRequestResponse=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const actions=new Set(['Позвонить','Отправить подборку','Назначить показ']);
  function status(request,records,now=Date.now(),limitMinutes){
    const received=Date.parse(request?.created_at||'');
    if(!Number.isFinite(received))return {kind:'unknown'};
    const client=records.find(record=>record.kind==='client'&&String(record.source_request_id)===String(request.id));
    const deals=client?records.filter(record=>record.kind==='deal'&&record.client_id===client.id&&record.source==='request:'+request.id):[];
    const responses=deals.flatMap(deal=>Array.isArray(deal.action_results)?deal.action_results:[])
      .filter(result=>actions.has(result.action)&&String(result.result||'').trim()&&Number.isFinite(Date.parse(result.at))&&Date.parse(result.at)>=received)
      .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    const complete=deals.every(deal=>!Number.isFinite(deal.action_results_total)||deal.action_results_total<=(deal.action_results||[]).length);
    if(responses.length){
      // Ordinary CRM listing keeps only the newest 100 results per deal.
      // Do not present a guessed first-response time when older events exist.
      return complete?{kind:'recorded',at:responses[0].at,elapsedMinutes:Math.max(0,Math.floor((Date.parse(responses[0].at)-received)/60000))}:{kind:'recorded',at:null,elapsedMinutes:null};
    }
    if(!complete)return {kind:'unknown-history'};
    const ageMinutes=Math.max(0,Math.floor((now-received)/60000));
    return {kind:client?'claimed':'available',ageMinutes,overdue:Number.isFinite(limitMinutes)&&limitMinutes>0&&now-received>limitMinutes*60000};
  }
  return {status};
});

/* Client → selection → showing → next task. No private records in browser storage. */
(() => {
  'use strict';
  const root = document.querySelector('#agentCabinet');
  const content = root?.querySelector('[data-crm-content]');
  if (!content) return;
  const panels = Object.fromEntries(['clients','selections','calendar','objects','owners','requests'].map(key => [key, root.querySelector(`[data-crm-panel="${key}"]`)]));
  if (Object.values(panels).some(panel => !panel)) return;
  const stages = {new:'Первичный контакт',selection:'Подбор',viewing:'Показ',negotiation:'Переговоры',won:'Завершение'};
  const roles = {buyer:'Покупатель',tenant:'Арендатор',owner:'Собственник'};
  const state = {records:[],objects:[],requests:[],specialization:'',canManageResources:false,ready:false,epoch:0};
  const elements = [];
  const node = (tag, text, className) => { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(className) el.className=className; return el; };
  const button = (text, action) => { const el=node('button',text,'crm-secondary-button crm-small-button');el.type='button';el.addEventListener('click',action);return el; };
  const requestTime = (item, now=Date.now()) => {
    const received=Date.parse(item.created_at||'');
    if(!Number.isFinite(received))return null;
    const when=new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(received);
    const minutes=Math.floor((now-received)/60000);
    if(minutes<0)return 'Поступила '+when;
    const age=minutes<60?`${minutes} мин`:minutes<1440?`${Math.floor(minutes/60)} ч ${minutes%60} мин`:`${Math.floor(minutes/1440)} д ${Math.floor(minutes%1440/60)} ч`;
    return `Поступила ${when} · ожидает ${age}`;
  };
  const responseStatus = item => window.LiberterraRequestResponse.status(item,state.records,Date.now(),60);
  const responseLabel = status => {
    if(status.kind==='recorded')return status.elapsedMinutes===null?'Первый ответ записан · точное время недоступно':`Первый ответ записан через ${status.elapsedMinutes} мин`;
    if(status.kind==='unknown-history')return 'Первый ответ: проверьте полную историю клиента';
    if(status.kind==='unknown')return '';
    if(status.overdue)return `Первый ответ не записан · просрочено на ${(m=>m<60?m+' мин':m<1440?Math.floor(m/60)+' ч '+(m%60)+' мин':Math.floor(m/1440)+' д '+Math.floor(m%1440/60)+' ч')(status.ageMinutes-60)}`;
    return `Первый ответ не записан · осталось ${60-status.ageMinutes} мин`;
  };
  const uuid = () => { const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
  const records = kind => state.records.filter(record=>record.kind===kind);
  const clientName = id => records('client').find(client=>client.id===id)?.name || 'Клиент';
  const objectName = id => { const object=state.objects.find(item=>String(item.id)===String(id));return object?`${object.title||object.district||'Объект'} · #${id}`:`Объект #${id}`; };
  const errorText = error => ({crm_request_unavailable:'Заявка больше недоступна. Обновите список.',crm_request_claimed:'Заявка уже закреплена за другим агентом. Обновите список.',crm_version_conflict:'Запись изменена в другой вкладке. Обновите CRM и повторите изменение.',crm_invalid_budget:'Проверьте бюджет: верхняя граница должна быть не меньше нижней.',crm_invalid_phone:'Проверьте номер телефона.',crm_invalid_fields:'Заполните обязательные поля и проверьте длину текста.',crm_object_unavailable:'Один из объектов больше недоступен. Обновите CRM и измените подборку.',crm_client_not_found:'Клиент недоступен. Обновите CRM.',crm_busy:'Сервис занят. Повторите сохранение.',crm_showing_too_early:'Нельзя завершить показ раньше назначенного времени.',crm_limit_reached:'Достигнут лимит записей CRM.'}[error.code] || error.message || 'Не удалось выполнить действие.');
  const globalStatus=node('p','Загружаем клиентов и подборки…','crm-workflow-status');globalStatus.setAttribute('role','status');
  const toolbar=node('div',undefined,'crm-workflow-toolbar');toolbar.append(globalStatus,button('Обновить данные',()=>load()));content.querySelector('.crm-counters').after(toolbar);
  const requestNotice=node('section',undefined,'crm-workflow-card crm-request-notice');requestNotice.setAttribute('aria-label','Доступные профильные заявки');requestNotice.setAttribute('aria-live','polite');requestNotice.hidden=true;toolbar.after(requestNotice);
  let seenRequestIds=null,newlyArrived=0;
  const overview=node('p','');root.querySelector('[data-crm-panel="overview"]').append(overview);

  function makeForm(panel, fields, submitLabel, onSubmit) {
    const form=node('form',undefined,'crm-local-form crm-workflow-form');
    for(const [name,label,type,options] of fields){
      const wrap=node('label',label);const input=node(type==='textarea'?'textarea':type==='select'?'select':'input');input.name=name;
      if(type==='select') Object.entries(options||{}).forEach(([value,text])=>input.add(new Option(text,value)));
      else if(type!=='textarea') input.type=type;
      if(type==='number'){input.min='0';input.step='any';}if(type==='textarea')input.maxLength=2000;
      if(type==='text')input.maxLength=200;
      wrap.append(input);form.append(wrap);
    }
    const submit=node('button',submitLabel,'crm-primary-button');submit.type='submit';
    const status=node('p','','crm-local-result');status.setAttribute('role','status');form.append(submit,status);panel.append(form);elements.push(form);
    form.addEventListener('input',()=>{form._pending=null;});
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(!state.ready||content.hidden)return;
      const epoch=state.epoch;submit.disabled=true;status.textContent='Сохраняем…';
      try{await onSubmit(Object.fromEntries(new FormData(form)),form);if(epoch===state.epoch)status.textContent='Сохранено.';}
      catch(error){if(epoch===state.epoch)status.textContent=errorText(error);}
      finally{if(epoch===state.epoch)submit.disabled=!state.ready;}
    });
    return form;
  }
  function resetForm(form){form.reset();form._record=null;form._id=null;form._pending=null;form.querySelector('[role="status"]').textContent='';}
  function edit(form,record){resetForm(form);if(record.stage==='lost'&&form.elements.stage&&!form.elements.stage.querySelector('option[value="lost"]'))form.elements.stage.add(new Option('Завершение (без сделки)','lost'));form._record=record;form._id=record.id;for(const [key,value]of Object.entries(record))if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;}
  async function save(kind,data,form,extra={}){
    if(!state.ready||content.hidden)throw Error('Сначала войдите и загрузите CRM.');
    const epoch=state.epoch;
    form._id ||= uuid();form._pending ||= uuid();
    const result=await window.LiberterraAgentAccess.request('save_crm_record',{id:form._id,kind,version:form._record?.version||0,mutation_id:form._pending,data:{...data,...(form._record?.source_request_id?{source_request_id:form._record.source_request_id}:{})},...extra});
    if(epoch!==state.epoch||content.hidden)return;
    const index=state.records.findIndex(record=>record.id===result.record.id);
    if(index<0)state.records.push(result.record);else state.records[index]=result.record;
    form._record=result.record;form._pending=null;render();return result.record;
  }
  function tab(key){root.querySelector(`[data-crm-tab="${key}"]`).click();}
  function openTabFromHash(attempt){
    const key=String(location.hash||"").replace(/^#/,"").trim();
    if(!key)return;
    const target=root.querySelector(`[data-crm-tab="${key}"]`);
    if(target){target.click();return;}
    if((attempt||0)<20)setTimeout(()=>openTabFromHash((attempt||0)+1),250);
  }
  window.addEventListener("hashchange",()=>openTabFromHash(0));
  setTimeout(()=>openTabFromHash(0),0);
  // Кабинет схлопнут до четырёх разделов: остальные вкладки скрыты, их содержимое перенесено
  function simplifyCabinet(attempt){
    if(!document.querySelector("#crm-four-tabs")){
      const st=document.createElement("style");
      st.id="crm-four-tabs";
      st.textContent=`body.agent-crm-page .crm-tabs [data-crm-tab]{display:none!important}body.agent-crm-page .crm-tabs [data-crm-tab="overview"],body.agent-crm-page .crm-tabs [data-crm-tab="requests"],body.agent-crm-page .crm-tabs [data-crm-tab="objects"],body.agent-crm-page .crm-tabs [data-crm-tab="clients"],body.agent-crm-page .crm-tabs [data-crm-tab="tasks"]{display:flex!important}`;
      document.head.appendChild(st);
    }
    if(root.dataset.simplified==="1")return;
    const buttons=[...root.querySelectorAll("[data-crm-tab]")];
    if(!buttons.length){if((attempt||0)<20)setTimeout(()=>simplifyCabinet((attempt||0)+1),250);return;}
    root.dataset.simplified="1";
    const KEEP={overview:"Сегодня",requests:"Заявки",objects:"Объекты",clients:"Клиенты"};
    const MERGE={clients:["deals","selections"],objects:["owners"]};
    const panel=(key)=>root.querySelector(`[data-crm-panel="${key}"]`);
    Object.keys(MERGE).forEach((target)=>{const host=panel(target);if(!host)return;MERGE[target].forEach((key)=>{const p=panel(key);if(!p||p===host)return;while(p.firstChild)host.appendChild(p.firstChild);});});
    buttons.forEach((btn)=>{const key=btn.dataset.crmTab;if(KEEP[key]){btn.hidden=false;btn.style.setProperty("display","flex","important");if(!btn.children.length)btn.textContent=KEEP[key];return;}btn.hidden=true;btn.style.display="none";});
    const visible=buttons.filter((btn)=>!btn.hidden);
    const active=visible.find((btn)=>btn.classList.contains("is-active")||btn.getAttribute("aria-selected")==="true");
    if(!active&&visible.length)visible[0].click();
  }
  setTimeout(()=>simplifyCabinet(0),0);
  const clientArea=node('section',undefined,'crm-client-workflow');panels.clients.prepend(clientArea);
  clientArea.append(node('h2','Клиенты'),node('p','Покупатели и арендаторы: требования, контакты и стадии работы.'));
  const clientForm=makeForm(clientArea,[['name','Имя клиента','text'],['phone','Телефон','tel'],['role','Роль','select',roles],['stage','Этап работы','select',stages],['city','Город','text'],['district','Район / ЖК','text'],['property_type','Тип недвижимости','text'],['rooms','Комнаты','text'],['budget_min','Бюджет от','number'],['budget_max','Бюджет до','number'],['currency','Валюта','select',{USD:'USD',KGS:'KGS'}],['notes','Требования и заметки','textarea']],'Сохранить клиента',async(data,form)=>{await save('client',data,form);});
  clientForm.elements.namedItem('name').required=true;clientForm.elements.namedItem('name').maxLength=120;clientForm.elements.phone.maxLength=40;
  clientForm.hidden=true;
  const newClient=button('Добавить клиента',()=>{resetForm(clientForm);clientForm.hidden=false;clientForm.scrollIntoView({block:'start'});clientForm.elements.namedItem('name').focus();});
  clientArea.insertBefore(newClient,clientForm);
  clientForm.insertBefore(button('Закрыть форму',()=>{clientForm.hidden=true;newClient.focus();}),clientForm.querySelector('[role="status"]'));
  const clientList=node('div',undefined,'crm-workflow-list');clientArea.append(clientList);
  const clientSearch=node('input');clientSearch.type='search';clientSearch.placeholder='Найти клиента';clientSearch.setAttribute('aria-label','Поиск клиента');clientSearch.className='crm-workflow-search';clientList.before(clientSearch);clientSearch.addEventListener('input',renderClients);
  clientForm.elements.role.querySelector('option[value="owner"]').remove();
  root.querySelector('[data-crm-tab="clients"]').textContent='Клиенты';
  const ownerArea=node('section',undefined,'crm-owner-workflow');panels.owners.append(ownerArea);
  ownerArea.append(node('p','Контакты собственников и стадии работы. Объект можно разместить после уточнения данных.'));
  const ownerForm=clientForm.cloneNode(true);ownerForm.className='crm-local-form crm-workflow-form';ownerForm.querySelector('[type="button"]')?.remove();ownerForm.querySelector('[name="role"]').replaceChildren(new Option('Собственник','owner'));ownerForm.querySelector('[type="submit"]').textContent='Сохранить собственника';ownerArea.append(ownerForm);elements.push(ownerForm);
  ownerForm.elements.namedItem('name').parentElement.firstChild.textContent='Имя собственника';
  ownerForm.addEventListener('input',()=>{ownerForm._pending=null;});
  ownerForm.addEventListener('submit',async event=>{event.preventDefault();const submit=ownerForm.querySelector('[type="submit"]'),status=ownerForm.querySelector('[role="status"]');submit.disabled=true;try{await save('client',{...Object.fromEntries(new FormData(ownerForm)),role:'owner'},ownerForm);status.textContent='Сохранено.';}catch(error){status.textContent=errorText(error);}finally{submit.disabled=!state.ready;}});
  ownerForm.hidden=true;
  const newOwner=button('Добавить собственника',()=>{resetForm(ownerForm);ownerForm.hidden=false;ownerForm.scrollIntoView({block:'start'});ownerForm.elements.namedItem('name').focus();});
  ownerArea.insertBefore(newOwner,ownerForm);
  ownerForm.insertBefore(button('Закрыть форму',()=>{ownerForm.hidden=true;newOwner.focus();}),ownerForm.querySelector('[role="status"]'));
  const ownerList=node('div',undefined,'crm-workflow-list');ownerArea.append(ownerList);

  panels.selections.append(node('p','Выберите объекты из общей базы или своих объявлений. В клиентскую ссылку попадут только опубликованные объекты.'));
  const selectionForm=makeForm(panels.selections,[['title','Название подборки (для вас)','text'],['client_id','Клиент','select',{}]],'Сохранить подборку',async(data,form)=>{
    data.object_ids=[...selectedObjects];const saved=await save('selection',data,form);if(saved)editSelection(saved);
  });
  selectionForm.elements.title.required=true;selectionForm.elements.title.maxLength=120;selectionForm.elements.client_id.required=true;
  const picker=node('div',undefined,'crm-object-picker');
  const objectSearch=node('input');objectSearch.type='search';objectSearch.placeholder='Поиск по ID, району, названию';objectSearch.setAttribute('aria-label','Поиск объектов для подборки');
  const objectScope=node('select');objectScope.setAttribute('aria-label','Источник объектов');objectScope.add(new Option('Все доступные','all'));objectScope.add(new Option('Мои объекты','own'));
  const selectedCount=node('p');const pickerList=node('div',undefined,'crm-picker-list');picker.append(objectSearch,objectScope,selectedCount,pickerList);selectionForm.querySelector('button').before(picker);
  let selectedObjects=new Set();objectSearch.addEventListener('input',renderPicker);objectScope.addEventListener('change',renderPicker);
  panels.selections.append(button('Новая подборка',()=>{resetForm(selectionForm);selectedObjects.clear();renderPicker();}));
  const selectionList=node('div',undefined,'crm-workflow-list');panels.selections.append(selectionList);
  function editSelection(record){edit(selectionForm,record);selectedObjects=new Set(record.object_ids);renderPicker();tab('selections');}

  panels.calendar.querySelector('h2').textContent='Показы';
  panels.calendar.append(node('p','Ваш план показов. Время указано по Бишкеку (UTC+6). Запись не отправляет приглашения клиенту.'));
  const appointmentForm=makeForm(panels.calendar,[['client_id','Клиент','select',{}],['object_id','Объект','select',{}],['local_time','Дата и время, Бишкек','datetime-local'],['status','Результат','select',{planned:'Запланирован',completed:'Состоялся',cancelled:'Отменён'}],['notes','Заметка о показе','textarea']],'Сохранить показ',async(data,form)=>{
    const date=new Date(data.local_time+':00+06:00');if(!data.local_time||Number.isNaN(date.getTime())||new Date(date.getTime()+21600000).toISOString().slice(0,16)!==data.local_time)throw Error('Укажите существующую дату и время.');
    data.starts_at=date.toISOString();await save('appointment',data,form);
  });
  ['client_id','object_id','local_time'].forEach(name=>{appointmentForm.elements[name].required=true;});appointmentForm.elements.notes.maxLength=1000;
  appointmentForm.hidden=true;
  const newAppointment=button('Назначить показ',()=>{resetForm(appointmentForm);appointmentForm.hidden=false;appointmentForm.scrollIntoView({block:'start'});appointmentForm.elements.client_id.focus();});
  panels.calendar.insertBefore(newAppointment,appointmentForm);
  appointmentForm.insertBefore(button('Закрыть форму',()=>{appointmentForm.hidden=true;newAppointment.focus();}),appointmentForm.querySelector('[role="status"]'));
  const appointmentList=node('div',undefined,'crm-workflow-list');panels.calendar.append(appointmentList);
  const requestIntro=node('p');panels.requests.append(requestIntro);
  const requestSearch=node('input');requestSearch.type='search';requestSearch.placeholder='Поиск по заявкам';requestSearch.setAttribute('aria-label','Поиск по заявкам');requestSearch.className='crm-workflow-search';
  const requestScope=node('select');requestScope.setAttribute('aria-label','Обработка заявки');for(const [key,label]of [['all','Все заявки'],['new','Новые для меня'],['taken','В моей работе']])requestScope.add(new Option(label,key));
  const requestList=node('div',undefined,'crm-workflow-list');panels.requests.append(requestSearch,requestScope,button('Обновить заявки',()=>load()),requestList);requestSearch.addEventListener('input',renderRequests);requestScope.addEventListener('change',renderRequests);

  function openNewRequests(){requestScope.value='new';requestSearch.value='';tab('requests');renderRequests();requestSearch.focus();}
  function openWaitingRequests(){requestScope.value='all';requestSearch.value='';tab('requests');renderRequests();requestSearch.focus();}
  function setOptions(select,items,label){const value=select.value;select.replaceChildren(new Option('Выберите…',''));items.forEach(item=>select.add(new Option(label(item),item.id)));select.value=value;}
  function render(){
    const clients=records('client').filter(client=>client.role!=='owner');
    [selectionForm.elements.client_id,appointmentForm.elements.client_id].forEach(select=>setOptions(select,clients,item=>item.name));
    setOptions(appointmentForm.elements.object_id,state.objects,item=>objectName(item.id));
    renderClients();renderPicker();renderSelections();renderAppointments();renderObjectStages();renderRequests();
    overview.textContent=`Клиентов: ${clients.length} · Подборок: ${records('selection').length} · Запланировано показов: ${records('appointment').filter(item=>item.status==='planned').length}`;
    const available=state.requests.filter(item=>item.claim_status!=='other'&&item.claim_status!=='mine'&&!state.records.some(record=>record.kind==='client'&&record.source_request_id===item.id));
    const waitingOverdue=state.requests.filter(item=>item.claim_status!=='other'&&responseStatus(item).overdue);
    requestNotice.replaceChildren();requestNotice.hidden=!state.ready||(!available.length&&!waitingOverdue.length);
    if(!requestNotice.hidden){requestNotice.append(node('h3',available.length?(newlyArrived?`Поступило новых заявок: ${newlyArrived}`:`Доступно профильных заявок: ${available.length}`):`Первый ответ просрочен: ${waitingOverdue.length}`));if(available.length)requestNotice.append(node('p','Откройте заявку и примите её в работу. Она закрепится за первым агентом.'),button('Открыть заявки',openNewRequests));if(waitingOverdue.length)requestNotice.append(node('p',`Без записанного первого ответа больше часа: ${waitingOverdue.length}`),button('Проверить ожидание ответа',openWaitingRequests));}
    newlyArrived=0;
    window.dispatchEvent(new CustomEvent('liberterra:crm-data',{detail:{clients,objects:state.objects,records:state.records,ready:state.ready,canManageResources:state.canManageResources,dealStages:state.dealStages||[],requestsAvailable:available.length,requestsOverdue:waitingOverdue.length}}));
  }
  function renderClients(){
    clientList.replaceChildren();ownerList.replaceChildren();if(!records('client').some(client=>client.role==='owner'))ownerList.append(node('p','Собственников пока нет. Добавьте контакт или перенесите его из заявок.'));const query=clientSearch.value.trim().toLocaleLowerCase('ru');
    const clients=records('client').filter(client=>client.role==='owner'||`${client.name} ${client.phone}`.toLocaleLowerCase('ru').includes(query));
    if(!clients.length)clientList.append(node('p',query?'Клиенты не найдены.':'Добавьте первого клиента.'));
    clients.forEach(client=>{
      const card=node('article',undefined,'crm-workflow-card');
      card.dataset.clientId=client.id;card.dataset.role=client.role;
      card.dataset.initials=String(client.name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('ru')||'—';
      const clientDeals=records('deal').filter(deal=>deal.client_id===client.id&&!['won','lost'].includes(deal.stage));
      const clientLate=clientDeals.filter(deal=>Number.isFinite(Date.parse(deal.next_action_at))&&Date.parse(deal.next_action_at)<Date.now()).length;
      card.dataset.deals=String(clientDeals.length);
      card.append(node('h3',client.name,'crm-client-name'),node('p',`${roles[client.role]} · ${stages[client.stage]||'Завершение (без сделки)'}`,'crm-client-role'),stageControl('client',client,client.name));
      const clientChip=node('span',clientLate?`Просрочено действие: ${clientLate}`:clientDeals.length?`В работе · сделок ${clientDeals.length}`:'Сделок нет','crm-client-chip');
      clientChip.dataset.kind=clientLate?'late':clientDeals.length?'ok':'none';
      if(client.role!=='owner')card.append(clientChip);
      if(client.phone){
       const phoneLine=node('p',undefined,'crm-client-phone'),phoneText=String(client.phone).trim(),digits=phoneText.replace(/\D/g,'');
       let intl=digits;if(!phoneText.startsWith('+')&&!intl.startsWith('996')){const local=intl.replace(/^0+/,'');if(local.length===9)intl='996'+local;}
       if(digits.length>=9){const callLink=node('a',phoneText);callLink.href='tel:+'+intl;phoneLine.append(callLink);}else phoneLine.textContent=phoneText;
       card.append(phoneLine);
      }
      card.append(node('p',[client.city,client.district,client.property_type,client.rooms&&`${client.rooms} комн.`,(client.budget_min!==''||client.budget_max!=='')?`${client.budget_min!==''?client.budget_min:'—'} – ${client.budget_max!==''?client.budget_max:'—'} ${client.currency}`:'Бюджет не указан'].filter(Boolean).join(' · '),'crm-client-meta'));
      if(client.source_request_id)card.append(node('p',`Из заявки #${client.source_request_id}`));
      const actions=node('div',undefined,'crm-workflow-actions');actions.append(button('Открыть',()=>{const form=client.role==='owner'?ownerForm:clientForm;edit(form,client);form.hidden=false;form.scrollIntoView({block:'start'});form.elements.namedItem('name').focus();}));
      if(client.role!=='owner')actions.append(button('Создать сделку',()=>window.dispatchEvent(new CustomEvent('liberterra:new-deal-for-client',{detail:{client_id:client.id}}))),button('Подобрать объекты',()=>window.dispatchEvent(new CustomEvent('liberterra:match-client',{detail:{id:client.id}}))),button('Показ',()=>{resetForm(appointmentForm);appointmentForm.elements.client_id.value=client.id;appointmentForm.hidden=false;tab('calendar');appointmentForm.scrollIntoView({block:'start'});}));
      actions.append(button('История работы',()=>window.dispatchEvent(new CustomEvent('liberterra:client-history',{detail:{id:client.id}}))));
      actions.append(button('Задача',()=>window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{client_id:client.id,title:`Позвонить: ${client.name}`}}))));card.append(actions);(client.role==='owner'?ownerList:clientList).append(card);
    });
  }
  function renderPicker(){
    pickerList.replaceChildren();selectedCount.textContent=`Выбрано: ${selectedObjects.size} из 50`;
    const query=objectSearch.value.trim().toLocaleLowerCase('ru');
    const options=state.objects.filter(item=>(objectScope.value!=='own'||item.own)&&`${item.id} ${item.title} ${item.district} ${item.city}`.toLocaleLowerCase('ru').includes(query));
    options.forEach(item=>{
      const label=node('label',undefined,'crm-picker-item'),check=node('input');check.type='checkbox';check.value=item.id;check.checked=selectedObjects.has(String(item.id));
      check.addEventListener('change',()=>{if(check.checked&&selectedObjects.size>=50){check.checked=false;return;}if(check.checked)selectedObjects.add(String(item.id));else selectedObjects.delete(String(item.id));selectionForm._pending=null;selectedCount.textContent=`Выбрано: ${selectedObjects.size} из 50`;});
      label.append(check,node('span',`${objectName(item.id)} · ${item.price||'Цена не указана'} ${item.per||''}${item.own?' · Мой объект':''}`));pickerList.append(label);
    });
    for(const id of selectedObjects)if(!state.objects.some(item=>String(item.id)===id)){const line=node('p',`Объект #${id} недоступен. `);line.append(button('Убрать',()=>{selectedObjects.delete(id);renderPicker();}));pickerList.append(line);}
    if(!options.length)pickerList.append(node('p','Нет подходящих объектов.'));
  }
  function renderSelections(){
    selectionList.replaceChildren();if(!records('selection').length)selectionList.append(node('p','Подборок пока нет.'));
    records('selection').forEach(selection=>{
      const card=node('article',undefined,'crm-workflow-card');card.append(node('h3',selection.title),node('p',`${clientName(selection.client_id)} · Объектов: ${selection.object_ids.length}`));
      const actions=node('div',undefined,'crm-workflow-actions');actions.append(button('Изменить',()=>editSelection(selection)));actions.append(button('Назначить показ',()=>window.dispatchEvent(new CustomEvent('liberterra:selection-viewing',{detail:{id:selection.id}}))));
      const toggle=button(selection.share_enabled?'Отозвать ссылку':'Создать ссылку клиенту',async()=>{
        toggle.disabled=true;try{await save('selection',selection,{_record:selection,_id:selection.id},{share_enabled:!selection.share_enabled});globalStatus.textContent=selection.share_enabled?'Ссылка отозвана.':'Ссылка готова. Её можно скопировать ниже.';}catch(error){globalStatus.textContent=errorText(error);toggle.disabled=false;}
      });actions.append(toggle);card.append(actions);
      if(selection.share_enabled&&selection.share_token){
        const url=new URL('/api/crm-workflow/selection.html',location.origin);url.hash=selection.share_token;
        const label=node('label','Ссылка для клиента');const input=node('input');input.readOnly=true;input.value=url.href;input.className='crm-share-link';input.addEventListener('focus',()=>input.select());label.append(input);card.append(label);
        const open=node('a','Открыть подборку','crm-text-button');open.href=url.href;open.target='_blank';open.rel='noopener noreferrer';card.append(open);
      }
      selectionList.append(card);
    });
  }
  function renderAppointments(){
    appointmentList.replaceChildren();const list=records('appointment').slice().sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
    if(!list.length)appointmentList.append(node('p','Показов пока нет.'));
    list.forEach(item=>{
      const card=node('article',undefined,'crm-workflow-card');card.append(node('h3',clientName(item.client_id)),node('p',objectName(item.object_id)),node('p',`${new Date(item.starts_at).toLocaleString('ru-RU',{timeZone:'Asia/Bishkek'})} · ${{planned:'Запланирован',completed:'Состоялся',cancelled:'Отменён'}[item.status]}`));
      if(item.notes)card.append(node('p',item.notes));const actions=node('div',undefined,'crm-workflow-actions');
      actions.append(button('Изменить / результат',()=>{edit(appointmentForm,item);appointmentForm.elements.local_time.value=new Date(Date.parse(item.starts_at)+21600000).toISOString().slice(0,16);appointmentForm.hidden=false;appointmentForm.scrollIntoView({block:'start'});}),button('Следующая задача',()=>window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{client_id:item.client_id,object_id:item.object_id,title:'Уточнить решение после показа'}}))));if(item.status==='completed')actions.append(button('Следующий шаг по сделке',()=>window.dispatchEvent(new CustomEvent('liberterra:viewing-followup',{detail:{id:item.id}}))));card.append(actions);appointmentList.append(card);
    });
  }
  function stageControl(kind,record,label){
    const wrap=node('label','Стадия работы','crm-work-stage'),select=node('select');select.setAttribute('aria-label','Стадия: '+label);
    Object.entries(stages).forEach(([key,text])=>select.add(new Option(text,key)));if(record.stage==='lost')select.add(new Option('Завершение (без сделки)','lost'));select.value=record.stage||'new';select.disabled=!state.ready;
    select.addEventListener('change',async()=>{select.disabled=true;try{await save(kind,{...record,stage:select.value},{_record:record.id?record:null,_id:record.id});globalStatus.textContent='Стадия работы обновлена.';}catch(error){globalStatus.textContent=errorText(error);select.value=record.stage||'new';select.disabled=!state.ready;}});wrap.append(select);return wrap;
  }
  function renderObjectStages(){
    root.querySelectorAll('.crm-object-card[data-crm-object-id]').forEach(card=>{
      card.querySelector('.crm-work-stage')?.remove();const objectId=card.dataset.crmObjectId;
      const record=records('object_stage').find(item=>item.object_id===objectId)||{object_id:objectId,stage:'new'};
      const actions=card.querySelector('.crm-object-actions');if(actions)actions.prepend(stageControl('object_stage',record,'объект #'+objectId));
    });
  }
  function firstContactForm(card,item,client){
    const source='request:'+item.id;
    const deal=records('deal').find(record=>record.client_id===client.id&&record.source===source);
    if(deal){if(!['won','lost'].includes(deal.stage))card.append(button('Следующее действие',()=>window.dispatchEvent(new CustomEvent('liberterra:quick-action',{detail:{id:deal.id}}))));return;}
    const open=button('Назначить первый контакт',()=>{
      open.remove();const form=node('form',undefined,'crm-local-form crm-workflow-form');form.dataset.firstContactForm='';
      const actionLabel=node('label');actionLabel.append(node('span','Первое действие'));const action=node('select');action.name='action';for(const [value,label]of [['call','Позвонить'],['selection','Отправить подборку'],['viewing','Назначить показ']])action.add(new Option(label,value));actionLabel.append(action);
      const dateLabel=node('label');dateLabel.append(node('span','Срок · время Бишкека'));const date=node('input');date.type='datetime-local';date.name='deadline';date.required=true;date.value=window.LiberterraActionModel.localDate(new Date(Date.now()+86400000).toISOString());dateLabel.append(date);
      const submit=node('button','Сохранить первое действие','crm-secondary-button crm-small-button');submit.type='submit';const status=node('p','','crm-local-result');status.setAttribute('role','status');form.append(actionLabel,dateLabel,submit,status);card.append(form);
      const id=uuid(),mutation_id=uuid();form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;status.textContent='Сохраняем…';try{
        const next=window.LiberterraActionModel.actionData({stage:'new'},{action:action.value,deadline:date.value});
        const result=await window.LiberterraAgentAccess.request('save_crm_record',{kind:'deal',id,version:0,mutation_id,data:{title:(item.title||'Заявка #'+item.id).slice(0,160),client_id:client.id,deal_type:client.role==='owner'?'sell':client.role==='tenant'?'rent':'buy',object_id:item.object_id||'',stage:'new',currency:client.currency,source,...next}});
        if(content.hidden)return;const index=state.records.findIndex(record=>record.id===result.record.id);if(index<0)state.records.push(result.record);else state.records[index]=result.record;render();globalStatus.textContent=result.already_imported?'По этой заявке уже есть сделка. Проверьте назначенное действие.':'Первое действие назначено по заявке #'+item.id+'.';
      }catch(error){status.textContent=errorText(error);submit.disabled=false;}});
      action.focus();
    });card.append(open);
  }
  function renderRequests(){
    requestList.replaceChildren();const query=requestSearch.value.trim().toLocaleLowerCase('ru');
    requestIntro.textContent=state.ready?'Общий поток: '+(state.specialization==='sale'?'покупка':'аренда')+'. Опубликованные заявки и приватные обращения по объектам доступны профильным агентам. Первый принявший закрепляет заявку за собой. Контакты, сохранённые в вашей CRM, видны только вам.':'Заявки загрузятся после входа в CRM.';
    const list=state.requests.filter(item=>{
      const taken=records('client').some(client=>client.source_request_id===item.id);
      return (requestScope.value==='all'||(requestScope.value==='taken'?taken:!taken&&item.claim_status!=='other'&&item.claim_status!=='mine'))&&[item.title,item.district,item.contact_name,item.id].join(' ').toLocaleLowerCase('ru').includes(query);
    });
    if(!list.length)requestList.append(node('p',state.ready?'По выбранным условиям заявок нет.':'Заявки ещё не загружены.'));
    list.forEach(item=>{
      const card=node('article',undefined,'crm-workflow-card');card.append(node('h3',item.title||'Заявка #'+item.id),node('p',[item.city,item.district,item.price].filter(Boolean).join(' · ')));if(item.claim_status!=='other'){const taken=records('client').some(client=>client.source_request_id===item.id);if(!taken&&item.claim_status==='available'){const timing=requestTime(item);if(timing)card.append(node('p',timing,'crm-request-time'));}const status=responseStatus(item),label=responseLabel(status);if(label)card.append(node('p',label,'crm-request-response'+(status.overdue?' crm-request-overdue':'')));}if(item.object_id){const link=node('a','Открыть исходный объект');link.href='/object.html?id='+encodeURIComponent(item.object_id);card.append(link);}
      if(!item.direction)card.append(node('p','Уточнить направление: в исходной заявке не указано «купить» или «снять».'));
      if(item.description)card.append(node('p',item.description));if(item.contact_name||item.phone)card.append(node('p',[item.contact_name,item.phone].filter(Boolean).join(' · ')));
      const existing=records('client').find(client=>client.source_request_id===item.id);
      if(existing){card.append(node('p','В моей работе · '+roles[existing.role]+' · '+(stages[existing.stage]||'Завершение')),button('Открыть контакт',()=>{const owner=existing.role==='owner';tab(owner?'owners':'clients');const form=owner?ownerForm:clientForm;edit(form,existing);form.scrollIntoView({block:'start'});}));firstContactForm(card,item,existing);}
      else if(item.claim_status==='other'){card.append(node('p','В работе у другого агента. Контакты и сообщение скрыты.'));}
      else {const actions=node('div',undefined,'crm-workflow-actions');const rolesForRequest=[[item.direction==='sale'?'buyer':item.direction==='rent'?'tenant':state.specialization==='sale'?'buyer':'tenant','В клиенты']];if(!item.object_id)rolesForRequest.push(['owner','В собственники']);for(const [role,label]of rolesForRequest){
        const transfer=button(label,async()=>{actions.querySelectorAll('button').forEach(el=>el.disabled=true);try{
          const data={name:(item.contact_name||'Контакт по заявке #'+item.id).slice(0,120),phone:item.phone||'',role,stage:'new',city:item.city||'',district:item.district||'',property_type:'',rooms:item.rooms||'',budget_min:'',budget_max:'',currency:/сом|KGS/i.test(item.price)?'KGS':'USD',notes:('Заявка #'+item.id+' · '+item.title+'\nБюджет: '+item.price+'\n'+(item.description||'')).slice(0,2000),source_request_id:item.id};
          const saved=await save('client',data,transfer);if(!saved)return;requestScope.value='taken';renderRequests();globalStatus.textContent='Контакт добавлен в вашу работу. Назначьте первое действие по заявке.';
        }catch(error){if(error.code==='crm_request_claimed'){await load();globalStatus.textContent=errorText(error);return;}globalStatus.textContent=errorText(error);actions.querySelectorAll('button').forEach(el=>el.disabled=false);}});actions.append(transfer);
      }card.append(actions);}requestList.append(card);
    });
  }
  async function load(){
    window.dispatchEvent(new CustomEvent('liberterra:crm-loading'));
    const epoch=++state.epoch;state.ready=false;globalStatus.textContent='Загружаем CRM…';elements.forEach(form=>form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true));
    try{const result=await (window.LiberterraCrmEarly?window.LiberterraCrmEarly.take():window.LiberterraAgentAccess.request('list_crm_workflow'));if(epoch!==state.epoch||content.hidden)return;state.records=result.records||[];state.objects=result.objects||[];state.requests=result.requests||[];state.specialization=result.specialization||'';state.canManageResources=result.can_manage_resources===true;state.dealStages=result.deal_stages||[];const availableIds=new Set(state.requests.filter(item=>item.claim_status!=='other'&&item.claim_status!=='mine'&&!state.records.some(record=>record.kind==='client'&&record.source_request_id===item.id)).map(item=>String(item.id)));newlyArrived=seenRequestIds?[...availableIds].filter(id=>!seenRequestIds.has(id)).length:0;seenRequestIds=availableIds;state.ready=true;render();globalStatus.textContent='Данные обновлены. Данные сохраняются в вашем кабинете.';}
    catch(error){if(epoch===state.epoch){state.records=[];state.objects=[];state.requests=[];render();globalStatus.textContent=`CRM недоступна: ${errorText(error)} Нажмите «Обновить данные».`;}}
    finally{if(epoch===state.epoch)elements.forEach(form=>form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=!state.ready));}
  }
  new MutationObserver(()=>{if(content.hidden){state.epoch++;state.ready=false;state.records=[];state.objects=[];state.requests=[];seenRequestIds=null;newlyArrived=0;elements.forEach(resetForm);selectedObjects.clear();render();}}).observe(content,{attributes:true,attributeFilter:['hidden']});
  let crmInflight=null,crmLoadedAt=0;
  window.LiberterraCrmWorkflow={update(){queueMicrotask(function(){
    if(crmInflight||(state.ready&&Date.now()-crmLoadedAt<60000))return;
    crmInflight=load().then(function(){crmLoadedAt=Date.now();}).finally(function(){crmInflight=null;});
  });},reload:load};
  // Refresh shared intake only while it is being viewed; do not poll hidden tabs.
  setInterval(()=>{if(state.ready&&!document.hidden&&!content.hidden&&!document.querySelector('.crm-action-dialog[open],[data-first-contact-form]')&&(!root.querySelector('[data-crm-panel="overview"]').hidden||!panels.requests.hidden))load();},60000);
  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-crm-workflow-action]');if(!action)return;
    if(!state.ready){globalStatus.textContent='Дождитесь загрузки CRM или нажмите «Обновить данные».';return;}
    if(action.dataset.crmWorkflowAction==='selection'){selectedObjects.add(action.dataset.objectId);renderPicker();tab('selections');}
    if(action.dataset.crmWorkflowAction==='task')window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{object_id:action.dataset.objectId,title:'Связаться по объекту'}}));
  });
})();

/* Deals are independent records. Server metadata determines allowed transitions. */
(() => {
 'use strict';
 const root=document.querySelector('#agentCabinet'),content=root?.querySelector('[data-crm-content]');if(!content)return;
 const nav=root.querySelector('.crm-tabs'),overview=root.querySelector('[data-crm-panel="overview"]');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls='crm-secondary-button')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
 const uuid=()=>crypto.randomUUID();
 const money=(value,currency)=>{if(value===''||value===undefined||value===null)return'Не указана';const amount=Number(value);if(!Number.isFinite(amount))return'Не указана';const text=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:Number.isInteger(amount)?0:2}).format(amount);return currency==='USD'?'$'+text:currency==='KGS'||!currency?text+' сом':text+' '+currency;};
 const date=value=>value?new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Не указана';
 const localDate=value=>{if(!value)return '';const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)),part=key=>parts.find(p=>p.type===key)?.value||'';return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`};
 const isoDate=value=>value?new Date(value+':00+06:00').toISOString():'';
 const errors={crm_invalid_transition:'Этот переход недоступен. Обновите CRM.',crm_loss_reason_required:'Укажите причину потери сделки.',crm_close_details_required:'Для закрытия выберите объект и укажите сумму сделки.',crm_next_action_required:'Назначьте следующее действие.',crm_next_action_past:'Назначьте будущее время действия.',crm_client_phone_required:'Укажите телефон в карточке клиента.',crm_client_needs_required:'Заполните бюджет, тип, район и комнатность в карточке клиента.',crm_object_required:'Выберите объект продажи.',crm_viewing_required:'Выберите объект и дату показа.',crm_viewing_result_required:'Запишите результат показа.',crm_agreed_price_required:'Укажите согласованную цену.',crm_deposit_required:'Укажите сумму и дату задатка.',crm_documents_confirmation_required:'Подтвердите готовность документов.',crm_version_conflict:'Сделка изменена в другой вкладке. Обновите CRM и откройте карточку заново.',crm_invalid_money:'Сумма должна быть положительной или нулевой, с точностью до двух знаков.',crm_client_not_found:'Клиент недоступен. Обновите CRM.',crm_object_unavailable:'Объект недоступен. Выберите доступный объект.',crm_history_limit:'Достигнут предел истории записи. Обратитесь к администратору.',crm_busy:'Сервис занят. Повторите сохранение.'};
 let state={records:[],objects:[],stages:[],ready:false},tasks=null,epoch=0,editing=null,pendingId='',newId='',busy=new Set(),dragging='';
 const records=kind=>state.records.filter(r=>r.kind===kind);
 const stageInfo=id=>state.stages.find(s=>s.id===id);
 const stageLabel=id=>stageInfo(id)?.label||id;
 const clientName=id=>records('client').find(c=>c.id===id)?.name||'Клиент недоступен';
 const objectName=id=>state.objects.find(o=>String(o.id)===String(id))?.title||`Объект #${id}`;
 const tab=el('button','Сделки','crm-tab');tab.type='button';tab.dataset.crmTab='deals';tab.id='crm-deals-tab';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.setAttribute('aria-controls','crm-deals-panel');tab.tabIndex=-1;
 nav.querySelector('[data-crm-tab="clients"]').after(tab);
 const panel=el('section',undefined,'crm-panel crm-deals');panel.dataset.crmPanel='deals';panel.id='crm-deals-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;content.append(panel);
 const head=el('div',undefined,'crm-deal-heading'),headCopy=el('div');const headSummary=el('p','Откройте карточку или перенесите сделку на доступный этап.','crm-deal-muted');headCopy.append(el('h2','Сделки'),headSummary);
 const create=button('Новая сделка',()=>openForm(null),'crm-primary-button');create.disabled=true;head.append(headCopy,create);panel.append(head);
 const status=el('p','Загружаем сделки…','crm-workflow-status');status.setAttribute('role','status');panel.append(status);
 const tools=el('div',undefined,'crm-deal-tools'),search=el('input');search.type='search';search.placeholder='Название или клиент';search.setAttribute('aria-label','Поиск сделки');
 const mobileStage=el('select');mobileStage.setAttribute('aria-label','Этап воронки');
 tools.append(search,mobileStage,button('Обновить',()=>window.LiberterraCrmWorkflow.reload()));panel.append(tools);
 const stageRail=el('nav',undefined,'crm-stage-rail');stageRail.setAttribute('aria-label','Этапы воронки');panel.append(stageRail);
 const board=el('div',undefined,'crm-deal-board');board.setAttribute('aria-label','Сделки по этапам');panel.append(board);
 if(!document.getElementById('lt-clients-20261119')){const clientsStyle=document.createElement('style');clientsStyle.id='lt-clients-20261119';clientsStyle.textContent="body.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id]:not(#lt0){display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:6px 12px!important;padding:14px 16px!important;border-radius:14px!important;border:1px solid var(--v20-line,#E3E8EE)!important;background:var(--card,#fff)!important;box-shadow:none!important;margin:0 0 10px!important}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id]:not(#lt0)::before{content:attr(data-initials);order:-2;flex:0 0 42px;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--v20-accent-soft,#FBEFEF);color:var(--v20-accent-hover,#8F1918);font:600 14px/1 'Onest',system-ui,sans-serif;letter-spacing:.02em}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-name:not(#lt0){order:-1;flex:0 1 auto;margin:0!important;font:600 16px/1.3 'Onest',system-ui,sans-serif!important;color:var(--v20-ink,#252A31)!important;overflow-wrap:anywhere}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip:not(#lt0){order:9;margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font:500 13px/1.25 'Onest',system-ui,sans-serif;white-space:nowrap}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip:not(#lt0)::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"late\"]:not(#lt0){background:rgba(190,44,40,.12);color:#9E231F}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"ok\"]:not(#lt0){background:rgba(31,157,97,.13);color:#18794A}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"none\"]:not(#lt0){background:rgba(107,101,96,.12);color:#5B636E}\nbody.v20.agent-crm-page #crmClientsPanel :is(.crm-client-role,.crm-client-phone,.crm-client-meta):not(#lt0){flex:0 0 auto;margin:0!important;font-size:13px!important;line-height:1.35!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-role:not(#lt0){order:1}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-phone:not(#lt0){order:2}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-phone a:not(#lt0){color:var(--v20-ink,#252A31)!important;text-decoration:none;font-weight:500}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-phone a:not(#lt0):hover{color:#BE2C28!important;text-decoration:underline}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-meta:not(#lt0){order:3}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] :is(.crm-client-role,.crm-client-phone)::after{content:\"·\";margin-left:12px;color:var(--v20-line,#D8D2CF)}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-work-stage:not(#lt0){order:10;flex:0 0 auto;display:flex!important;align-items:center;gap:8px;margin:2px 0 0!important;font-size:13px!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-work-stage select:not(#lt0){min-height:36px!important;padding:5px 10px!important;border-radius:9px!important;font-size:13px!important}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-workflow-actions:not(#lt0){order:11;flex:1 1 auto;display:flex!important;flex-wrap:wrap;justify-content:flex-end;gap:6px!important;margin:4px 0 0!important}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-workflow-actions button:not(#lt0){min-height:36px!important;padding:6px 12px!important;border-radius:9px!important;font-size:13px!important;line-height:1.2!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id]:not(#lt0){background:#20252C!important;border-color:#424A53!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id]:not(#lt0)::before{background:rgba(240,138,130,.18);color:#F08A82}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-client-name:not(#lt0){color:#F1F3F5!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel :is(.crm-client-role,.crm-client-phone,.crm-client-meta):not(#lt0){color:#C4CBD4!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-client-phone a:not(#lt0){color:#F1F3F5!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"late\"]:not(#lt0){background:rgba(240,138,130,.16);color:#F08A82}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"ok\"]:not(#lt0){background:rgba(79,201,140,.16);color:#7BDCAB}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel .crm-client-chip[data-kind=\"none\"]:not(#lt0){background:rgba(255,255,255,.1);color:#B9C0CA}\n@media (max-width:760px){\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-chip:not(#lt0){margin-left:0;order:4;flex:0 0 auto}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-workflow-actions:not(#lt0){flex:1 1 100%;justify-content:flex-start}\nbody.v20.agent-crm-page #crmClientsPanel .crm-client-name:not(#lt0){flex:1 1 calc(100% - 54px)}\nbody.v20.agent-crm-page #crmClientsPanel .crm-workflow-card[data-client-id] .crm-workflow-actions button:not(#lt0){flex:1 1 auto}\n}";document.head.append(clientsStyle);}
 if(!document.getElementById('lt-deals-20261118')){const dealsStyle=document.createElement('style');dealsStyle.id='lt-deals-20261118';dealsStyle.textContent="@media (min-width:901px){\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-board{display:flex!important;flex-wrap:wrap!important;gap:12px!important;align-items:flex-start!important;overflow:visible!important;padding:4px 2px 10px!important;grid-template-columns:none!important;background:transparent!important;border:0!important;box-shadow:none!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-board>.crm-deal-column{flex:1 1 0!important;min-width:180px!important;min-height:220px!important;margin:0!important;padding:12px!important;display:flex!important;flex-direction:column!important;gap:10px!important;background:#F4F2F1!important;border:0!important;border-radius:14px!important;box-shadow:none!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-board>.crm-deal-column[data-terminal=\"true\"]{flex:1 1 calc(50% - 6px)!important;min-height:0!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))!important;align-content:start;background:transparent!important;border:1px solid var(--v20-line,#E3E8EE)!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-column[data-terminal=\"true\"]>:is(h3,.crm-deal-col-sum,.crm-deal-empty){grid-column:1/-1}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-column[data-terminal=\"true\"] .crm-deal-card>:not(.crm-deal-open):not(.crm-deal-client):not(.crm-deal-amount){display:none!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-column[data-terminal=\"true\"] .crm-deal-empty{padding:8px 10px!important}\n}\n}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-column>h3{margin:0 4px!important;font:600 14px/1.35 'Onest',system-ui,sans-serif!important;color:var(--v20-ink,#252A31)!important;display:flex;align-items:center;gap:6px}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-col-sum{margin:-6px 4px 2px!important;font-size:12px!important;line-height:1.3!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-empty{margin:0!important;padding:14px 10px!important;border:1px dashed #DCD6D4!important;border-radius:12px!important;background:transparent!important;font-size:12px!important;color:var(--v20-muted,#6B6560)!important;text-align:center}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card{margin:0!important;padding:12px!important;display:flex!important;flex-direction:column!important;gap:6px!important;background:#fff!important;border:1px solid var(--v20-line,#E3E8EE)!important;border-radius:12px!important;box-shadow:none!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card:hover{border-color:#D8C9C7!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card>*{margin:0!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-open{display:block;width:100%;padding:0!important;min-height:0!important;border:0!important;background:none!important;text-align:left!important;font:600 14px/1.35 'Onest',system-ui,sans-serif!important;color:var(--v20-ink,#252A31)!important;cursor:pointer;overflow-wrap:anywhere}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-open:hover{color:#BE2C28!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-client{font-size:12px!important;line-height:1.3!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-amount{display:block;font:650 16px/1.2 'Onest',system-ui,sans-serif!important;color:var(--v20-ink,#252A31)!important;font-variant-numeric:tabular-nums}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-next{padding-top:8px!important;border-top:1px solid var(--v20-line,#ECE3E2)!important;font-size:13px!important;line-height:1.35!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-next span{display:block;font-size:11px!important;letter-spacing:.02em;text-transform:none!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-next strong{font-weight:600!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card :is(.crm-deal-due,.crm-deal-commission){font-size:12px!important;line-height:1.35!important;color:var(--v20-muted,#6B6560)!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-fast-deal-actions{display:flex!important;flex-wrap:wrap;gap:6px!important;margin-top:4px!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-fast-deal-actions button{flex:1 1 auto;min-height:36px!important;padding:6px 10px!important;border-radius:9px!important;font-size:13px!important;line-height:1.2!important}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-tag{align-self:flex-start}\nbody.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-tag[data-kind=\"late\"]{background:rgba(190,44,40,.12)!important;color:#9E231F!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-board>.crm-deal-column{background:rgba(255,255,255,.04)!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card{background:#20252C!important;border-color:#424A53!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) :is(.crm-deal-column>h3,.crm-deal-card .crm-deal-open,.crm-deal-card .crm-deal-amount){color:#F1F3F5!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) :is(.crm-deal-col-sum,.crm-deal-empty,.crm-deal-card .crm-deal-client,.crm-deal-card .crm-deal-next span,.crm-deal-card .crm-deal-due,.crm-deal-card .crm-deal-commission){color:#C4CBD4!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-next{border-top-color:#424A53!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-empty{border-color:#424A53!important}\nhtml[data-theme=\"dark\"] body.v20.agent-crm-page #crmClientsPanel:not(#lt0) .crm-deal-card .crm-deal-tag[data-kind=\"late\"]{background:rgba(240,138,130,.16)!important;color:#F08A82!important}";document.head.append(dealsStyle);}
 search.addEventListener('input',renderBoard);mobileStage.addEventListener('change',renderBoard);
 stageRail.addEventListener('click',event=>{const chip=event.target.closest('button[data-stage]');if(!chip||!state.ready)return;mobileStage.value=chip.dataset.stage;renderBoard();chip.focus();});
 const day=el('section',undefined,'crm-day');
 const dayHead=el('div',undefined,'crm-deal-heading');dayHead.append(el('h2','Рабочий день'),button('К сделкам',()=>tab.click()));day.append(dayHead);
 const metrics=el('div',undefined,'crm-day-metrics'),attention=el('div',undefined,'crm-day-attention');day.append(metrics,attention);
 const dialog=el('dialog',undefined,'crm-deal-dialog');dialog.setAttribute('aria-labelledby','crm-deal-title');
 const dialogHead=el('div',undefined,'crm-deal-heading'),dialogTitle=el('h2','Новая сделка');dialogTitle.id='crm-deal-title';dialogHead.append(dialogTitle,button('Закрыть',()=>dialog.close()));dialog.append(dialogHead);
 const form=el('form',undefined,'crm-deal-form'),inputs={},fieldLabels={};
 for(const [name,label,type,max]of [['title','Название сделки','text',160],['client_id','Клиент','select'],['deal_type','Тип сделки','select'],['object_id','Объект','select'],['stage','Этап','select'],['amount','Сумма сделки','number'],['currency','Валюта','select'],['planned_commission','Плановая комиссия','number'],['source','Источник','text',100],['next_action','Следующее действие','text',240],['next_action_at','Срок действия · Бишкек','datetime-local'],['viewing_at','Дата показа · Бишкек','datetime-local'],['viewing_result','Результат показа','text',500],['agreed_price','Согласованная цена','number'],['deposit_amount','Сумма задатка','number'],['deposit_at','Дата задатка · Бишкек','datetime-local'],['documents_confirmed','Документы подготовлены и проверены','checkbox'],['lost_reason','Причина потери','textarea',500],['notes','Заметка','textarea',2000]]){
  const wrap=el('label',label),input=el(type==='select'?'select':type==='textarea'?'textarea':'input');input.name=name;inputs[name]=input;
  input.setAttribute('aria-label',label);if(type!=='select'&&type!=='textarea')input.type=type;if(max)input.maxLength=max;if(type==='number'){input.min='0';input.step='0.01';}wrap.append(input);fieldLabels[name]=wrap;form.append(wrap);
 }
 for(const name of ['title','client_id','stage','currency'])inputs[name].required=true;
 inputs.currency.append(new Option('USD','USD'),new Option('KGS','KGS'));
 for(const [label,value]of [['Не указан',''],['Покупка','buy'],['Продажа','sell'],['Аренда','rent']])inputs.deal_type.add(new Option(label,value));
 const section=(title,names)=>{const group=el('section',undefined,'crm-deal-section'),heading=el('h3',title);group.append(heading);for(const name of names)group.append(fieldLabels[name]);form.append(group);return group;};
 section('Основное',['title','client_id','deal_type','object_id']);
 section('Этап и следующий шаг',['stage','next_action','next_action_at']);
 const stageChoices=el('div',undefined,'crm-deal-stage-choices');stageChoices.setAttribute('role','group');stageChoices.setAttribute('aria-label','Выберите этап сделки');fieldLabels.stage.after(stageChoices);
 stageChoices.addEventListener('click',event=>{const choice=event.target.closest('button[data-stage]');if(!choice||choice.disabled)return;inputs.stage.value=choice.dataset.stage;inputs.stage.dispatchEvent(new Event('change',{bubbles:true}));inputs.stage.dispatchEvent(new Event('input',{bubbles:true}));choice.focus();});
 const datePresets=el('div',undefined,'crm-deal-date-presets');datePresets.setAttribute('role','group');datePresets.setAttribute('aria-label','Быстрый выбор срока действия');
 for(const [offset,label,hour]of [[1,'Через час',null],[24,'Завтра · 10:00','10:00'],[72,'Через 3 дня · 10:00','10:00']]){const preset=button(label,()=>{const future=localDate(new Date(Date.now()+offset*3600000).toISOString());inputs.next_action_at.value=hour?future.slice(0,10)+'T'+hour:future;inputs.next_action_at.dispatchEvent(new Event('input',{bubbles:true}));inputs.next_action_at.focus();},'crm-deal-date-preset');preset.type='button';datePresets.append(preset);}
 fieldLabels.next_action_at.after(datePresets,el('p','Время Бишкека (UTC+6). Выбранный срок можно изменить вручную.','crm-deal-date-hint'));
 section('Суммы и заметки',['amount','currency','planned_commission','source','notes']);
 const stageDetails=section('Данные этапа',['viewing_at','viewing_result','agreed_price','deposit_amount','deposit_at','documents_confirmed','lost_reason']);
 function syncStageChoices(){stageChoices.replaceChildren();for(const option of inputs.stage.options){const choice=button(option.textContent,()=>{},'crm-deal-stage-choice');choice.type='button';choice.dataset.stage=option.value;choice.setAttribute('aria-pressed',String(option.value===inputs.stage.value));stageChoices.append(choice);}}
 const submit=el('button','Сохранить сделку','crm-primary-button');submit.type='submit';
 const result=el('p','','crm-deal-result');result.setAttribute('role','status');const footer=el('div',undefined,'crm-deal-footer');footer.append(el('p','Плановая комиссия — ожидаемая сумма, не полученный доход.','crm-deal-muted'),submit,result);form.append(footer);dialog.append(form);
 const history=el('section',undefined,'crm-deal-history');dialog.append(history);
 // Звонки клиента из телефонии. Запрос идёт через сервер CRM: он проверяет, что клиент принадлежит агенту.
 const callsBox=el('section',undefined,'crm-deal-history crm-deal-calls');dialog.append(callsBox);document.body.append(dialog);
 let callsToken=0;
 const callNotes={not_configured:'Телефония не подключена.',no_phone:'У клиента не указан телефон.',no_agent_email:'В профиле нет email, поэтому звонки не найти.',unavailable:'Звонки временно недоступны. Закройте и снова откройте карточку.'};
 const talk=seconds=>seconds>=60?`${Math.floor(seconds/60)} мин ${seconds%60} с`:`${seconds} с`;
 async function loadCalls(clientId){
  const mine=++callsToken,fresh=()=>mine===callsToken&&dialog.open;
  callsBox.replaceChildren(el('h3','Звонки'),el('p','Загружаем звонки…','crm-deal-muted'));
  try{
   const response=await window.LiberterraAgentAccess.request('list_crm_workflow',{data:{calls:{client_id:clientId}}});
   if(!fresh())return;
   const callsPage=response.calls_page||{status:'unavailable',items:[]};callsBox.replaceChildren(el('h3','Звонки'));
   if(callsPage.status!=='ok'){callsBox.append(el('p',callNotes[callsPage.status]||callNotes.unavailable,'crm-deal-muted'));return;}
   if(!callsPage.items.length){callsBox.append(el('p','Звонков с этим клиентом пока нет.','crm-deal-muted'));return;}
   const list=el('ol');
   for(const call of callsPage.items){const row=el('li');row.append(el('strong',(call.direction==='out'?'Исходящий':'Входящий')+(call.answered?'':', без ответа')),el('small',`${date(call.started_at)} · ${call.answered?talk(call.duration):'не отвечен'}${call.has_recording?' · есть запись':''}`));list.append(row);}
   callsBox.append(list);
  }catch(error){if(fresh())callsBox.replaceChildren(el('h3','Звонки'),el('p',errors[error.code]||callNotes.unavailable,'crm-deal-muted'));}
 }
 dialog.addEventListener('close',()=>{callsToken++;});
 function terminalFields(){const stage=inputs.stage.value,lost=stage==='lost',order=['new','qualification','selection','viewing_scheduled','viewing_done','negotiation','agreement','documents','won'],index=order.indexOf(stage),sale=inputs.deal_type.value==='sell';fieldLabels.lost_reason.hidden=!lost;inputs.lost_reason.required=lost;inputs.object_id.required=stage==='won'||index>=3||sale&&index>=2;inputs.viewing_at.required=index>=3;inputs.viewing_result.required=index>=4;inputs.agreed_price.required=index>=6;inputs.deposit_amount.required=index>=7;inputs.deposit_at.required=index>=7;inputs.documents_confirmed.required=stage==='won';inputs.next_action_at.required=!lost&&stage!=='won'&&Boolean(editing);inputs.amount.required=stage==='won';for(const [name,show]of [['viewing_at',index>=3],['viewing_result',index>=4],['agreed_price',index>=6],['deposit_amount',index>=7],['deposit_at',index>=7],['documents_confirmed',stage==='won']])fieldLabels[name].hidden=!show;stageDetails.hidden=![...stageDetails.querySelectorAll('label')].some(label=>!label.hidden);datePresets.hidden=lost||stage==='won';for(const choice of stageChoices.querySelectorAll('button[data-stage]'))choice.setAttribute('aria-pressed',String(choice.dataset.stage===stage));}
 inputs.stage.addEventListener('change',terminalFields);form.addEventListener('input',()=>{pendingId='';});
 inputs.deal_type.addEventListener('change',terminalFields);
 function selectOptions(select,options,current){select.replaceChildren();for(const [value,label]of options)select.add(new Option(label,value));select.value=current||'';}
 function openForm(record,stageOverride){
  if(!state.ready)return;editing=record;newId=record?.id||uuid();pendingId='';form.reset();result.textContent='';
  selectOptions(inputs.client_id,[['','Выберите клиента'],...records('client').map(c=>[c.id,c.name])],record?.client_id);
  selectOptions(inputs.object_id,[['','Пока без объекта'],...state.objects.map(o=>[o.id,o.title||`Объект #${o.id}`])],record?.object_id);
  const available=record?[record.stage,...(stageInfo(record.stage)?.transitions||[])]:['new'];
  selectOptions(inputs.stage,available.map(id=>[id,stageLabel(id)]),stageOverride||record?.stage||'new');
  syncStageChoices();
  for(const [name,input]of Object.entries(inputs))if(!['client_id','object_id','stage'].includes(name)){if(input.type==='checkbox')input.checked=record?.[name]===true;else input.value=input.type==='datetime-local'?localDate(record?.[name]):record?.[name]??(name==='currency'?'USD':'');}
  inputs.client_id.disabled=Boolean(record);
  if(stageOverride&&!['lost','won'].includes(stageOverride))inputs.next_action_at.value=localDate(new Date(Date.now()+24*3600000).toISOString());
  terminalFields();dialogTitle.textContent=record?'Карточка сделки':'Новая сделка';history.replaceChildren();
  if(record){history.append(el('h3','История изменений'));const list=el('ol');for(const event of [...(record.history||[])].reverse()){const row=el('li');row.append(el('strong',event.type==='created'?'Сделка создана':event.type==='stage_changed'?`${stageLabel(event.from)} → ${stageLabel(event.to)}`:'Карточка обновлена'),el('small',`${date(event.at)} · Автор: ${event.author_id}`));list.append(row);}history.append(list);}
  if(!records('client').length)result.textContent='Сначала добавьте клиента в разделе «Клиенты».';
  callsBox.replaceChildren();callsToken++;
  submit.disabled=false;dialog.showModal();inputs.title.focus();
  if(record?.client_id)loadCalls(record.client_id);
 }
 window.addEventListener('liberterra:new-deal-for-client',event=>{if(!state.ready||content.hidden)return;const client=records('client').find(item=>String(item.id)===String(event.detail?.client_id)&&item.role!=='owner');if(!client)return;tab.click();openForm(null);inputs.client_id.value=client.id;inputs.title.value=`Сделка: ${client.name}`;inputs.title.focus();});
 async function persist(record,data,id,mutation){
  const requestEpoch=epoch;
  const response=await window.LiberterraAgentAccess.request('save_crm_record',{kind:'deal',id,version:record?.version||0,mutation_id:mutation,data});
  if(requestEpoch!==epoch||content.hidden)throw Error('Сессия или данные изменились. Обновите CRM.');
  const index=state.records.findIndex(r=>r.id===response.record.id);if(index<0)state.records.push(response.record);else state.records[index]=response.record;
  renderBoard();renderDay();return response.record;
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!state.ready||content.hidden)return;submit.disabled=true;result.textContent='Сохраняем…';pendingId||=uuid();
  try{const data=Object.fromEntries(new FormData(form));if(editing)data.client_id=editing.client_id;for(const name of ['next_action_at','viewing_at','deposit_at'])data[name]=isoDate(data[name]);data.documents_confirmed=inputs.documents_confirmed.checked;editing=await persist(editing,data,newId,pendingId);pendingId='';dialog.close();status.textContent='Сделка сохранена.';window.LiberterraCrmWorkflow.reload();}
  catch(error){result.textContent=errors[error.code]||error.message||'Не удалось сохранить. Повторите попытку.';}
  finally{submit.disabled=!state.ready;}
 });
 async function move(record,next){
  if(!state.ready||busy.has(record.id)||record.stage===next)return;
  openForm(record,next);
 }
 function syncStageRail(){
  const keys=state.stages.map(stage=>stage.id).join('|');
  if(stageRail.dataset.keys!==keys){
   const previousScroll=stageRail.scrollLeft;stageRail.replaceChildren();stageRail.dataset.keys=keys;
   for(const stage of state.stages){const chip=el('button',undefined,'crm-stage-chip');chip.type='button';chip.dataset.stage=stage.id;chip.append(el('span',stage.label),el('strong','0'));stageRail.append(chip);}
   stageRail.scrollLeft=previousScroll;
  }
  const query=search.value.trim().toLocaleLowerCase('ru');
  for(const chip of stageRail.querySelectorAll('button[data-stage]')){
   const count=state.ready?records('deal').filter(deal=>deal.stage===chip.dataset.stage&&(!query||(deal.title+' '+clientName(deal.client_id)).toLocaleLowerCase('ru').includes(query))).length:0;
   chip.querySelector('strong').textContent=String(count);
   chip.setAttribute('aria-pressed',String(chip.dataset.stage===mobileStage.value));
   chip.disabled=!state.ready;
  }
 }

 const dealIcon=paths=>{const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','16');svg.setAttribute('height','16');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');for(const d of paths){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p);}return svg;};
 const DEAL_ICONS={"phone":["M6.6 10.9a15.1 15.1 0 0 0 6.5 6.5l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"],"chat":["M21 11.6a8.4 8.4 0 0 1-12.1 7.5L3.5 20.5l1.5-5.2A8.4 8.4 0 1 1 21 11.6z"],"task":["M9 4.5h6a1 1 0 0 1 1 1v.5H8v-.5a1 1 0 0 1 1-1z","M8 6H6.5a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17.5 6H16","M9.2 13.2l2 2 3.6-3.9"]};
 function dealTools(deal){
  const row=el('div',undefined,'crm-deal-tools');
  const client=records('client').find(record=>record.id===deal.client_id);
  const phone=String((client&&client.phone)||'').trim();
  const digits=phone.replace(/\D/g,'');
  let intl=digits;
  if(!phone.startsWith('+')&&!intl.startsWith('996')){const local=intl.replace(/^0+/,'');if(local.length===9)intl='996'+local;}
  if(digits.length>=9){
   const call=el('a',undefined,'crm-deal-tool');call.href='tel:+'+intl;
   call.title='Позвонить: '+phone;call.setAttribute('aria-label','Позвонить клиенту, '+phone);call.append(dealIcon(DEAL_ICONS.phone));row.append(call);
   const chat=el('a',undefined,'crm-deal-tool');chat.href='https://wa.me/'+intl;chat.target='_blank';chat.rel='noopener noreferrer';
   chat.title='Написать в WhatsApp: '+phone;chat.setAttribute('aria-label','Написать клиенту в WhatsApp, '+phone);chat.append(dealIcon(DEAL_ICONS.chat));row.append(chat);
  }
  const live=Array.isArray(tasks)?tasks.filter(task=>task.status!=='done'):[];
  const open=live.filter(task=>task.deal_id?task.deal_id===deal.id:(task.client_id&&task.client_id===deal.client_id));
  const linked=open.length>0&&open.every(task=>task.deal_id);
  const late=open.filter(task=>task.due_at&&Date.parse(task.due_at)<Date.now()).length;
  const badge=button('',()=>window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{client_id:deal.client_id||'',deal_id:deal.id,object_id:deal.object_id||'',title:deal.next_action||''}})),'crm-deal-tool crm-deal-tasks');
  badge.append(dealIcon(DEAL_ICONS.task),el('span',tasks===null?'—':String(open.length)));
  if(late)badge.dataset.late='true';
  if(!open.length&&tasks!==null)badge.dataset.empty='true';
  badge.title=tasks===null?'Задачи ещё не загружены. Нажмите, чтобы поставить задачу':'Открытых задач '+(linked?'по сделке':'клиента')+': '+open.length+(late?', просрочено: '+late:'')+'. Нажмите, чтобы поставить задачу';
  badge.setAttribute('aria-label',badge.title);row.append(badge);
  if(digits.length<9)row.append(el('span','Телефон не указан','crm-deal-tool-hint'));
  return row;
 }

 const BISHKEK=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
 function dealTag(deal){
  if(['won','lost'].includes(deal.stage))return null;
  const at=deal.next_action_at&&Number.isFinite(Date.parse(deal.next_action_at))?Date.parse(deal.next_action_at):null;
  if(!String(deal.next_action||'').trim()&&at===null)return tagNode('Нет действия','none','Следующее действие не назначено');
  if(at===null)return null;
  if(at<Date.now())return tagNode('Просрочено','late','Срок следующего действия прошёл');
  if(BISHKEK(new Date(at))===BISHKEK(new Date()))return tagNode('Сегодня','today','Следующее действие сегодня');
  return null;
 }
 function tagNode(text,kind,hint){const tag=el('span',text,'crm-deal-tag');tag.dataset.kind=kind;tag.title=hint;return tag;}
 function renderBoard(){
  syncStageRail();
  if(state.ready){const live=records('deal').filter(d=>!['won','lost'].includes(d.stage)),plan=new Map();for(const d of live){const v=Number(d.planned_commission);if(d.planned_commission!==''&&d.planned_commission!==undefined&&Number.isFinite(v)&&v>0)plan.set(d.currency||'KGS',(plan.get(d.currency||'KGS')||0)+v);}
   headSummary.textContent=live.length?`В работе: ${live.length} · плановая комиссия ${plan.size?[...plan].map(([c,v])=>money(v,c)).join(' · '):'не указана'}. Карточку можно перетащить на другой этап.`:'Сделок в работе нет. Создайте первую кнопкой «Новая сделка».';}
  board.replaceChildren();create.disabled=!state.ready||!state.stages.length;
  if(!state.ready){board.append(el('p','Сделки недоступны до успешной загрузки CRM.'));return;}
  if(!state.stages.length){board.append(el('p','Для работы со сделками требуется обновление сервера CRM.'));return;}
  const query=search.value.trim().toLocaleLowerCase('ru');
  for(const stage of state.stages){
   const deals=records('deal').filter(d=>d.stage===stage.id&&(!query||(d.title+' '+clientName(d.client_id)).toLocaleLowerCase('ru').includes(query)));
   const column=el('section',undefined,'crm-deal-column');column.dataset.stage=stage.id;column.dataset.mobileHidden=String(mobileStage.value!==stage.id);column.dataset.terminal=String(['won','lost'].includes(stage.id));
   column.append(el('h3',`${stage.label} · ${deals.length}`));
   {const sums=new Map();for(const d of deals){const v=Number(d.amount);if(d.amount!==''&&d.amount!==undefined&&Number.isFinite(v)&&v>0)sums.set(d.currency||'KGS',(sums.get(d.currency||'KGS')||0)+v);}
    column.append(el('p',sums.size?[...sums].map(([c,v])=>money(v,c)).join(' · '):'—','crm-deal-col-sum'));}
   column.addEventListener('dragover',event=>{const record=records('deal').find(d=>d.id===dragging);if(record&&stageInfo(record.stage)?.transitions.includes(stage.id)){event.preventDefault();event.dataTransfer.dropEffect='move';}});
   column.addEventListener('drop',event=>{event.preventDefault();const record=records('deal').find(d=>d.id===event.dataTransfer.getData('text/plain'));if(record&&stageInfo(record.stage)?.transitions.includes(stage.id))move(record,stage.id);dragging='';});
   if(!deals.length)column.append(el('p','Нет сделок','crm-deal-empty'));
   for(const deal of deals){
    const card=el('article',undefined,'crm-deal-card');card.dataset.dealId=deal.id;card.draggable=!busy.has(deal.id)&&stage.transitions.length>0;
    card.addEventListener('dragstart',event=>{if(!state.ready||busy.has(deal.id)){event.preventDefault();return;}dragging=deal.id;event.dataTransfer.setData('text/plain',deal.id);event.dataTransfer.effectAllowed='move';});card.addEventListener('dragend',()=>{dragging='';});
    const open=button(deal.title,()=>openForm(deal),'crm-deal-open');open.setAttribute('aria-label',`Открыть сделку: ${deal.title}`);open.disabled=busy.has(deal.id);const tag=dealTag(deal);if(tag)card.append(tag);
    card.append(open,el('p',clientName(deal.client_id),'crm-deal-client'),dealTools(deal),el('strong',money(deal.amount,deal.currency),'crm-deal-amount'));
    if(deal.object_id)card.append(el('p',objectName(deal.object_id),'crm-deal-muted'));
    const next=el('p',undefined,'crm-deal-next');next.append(el('span','Следующее действие'),el('strong',deal.next_action||'Укажите следующее действие'));
    card.append(next,el('small',deal.next_action_at?'Срок: '+date(deal.next_action_at):'Срок не назначен','crm-deal-due'),el('small','План комиссии: '+money(deal.planned_commission,deal.currency),'crm-deal-commission'));
    if(!['won','lost'].includes(deal.stage)){
     const actions=el('div',undefined,'crm-attention-actions crm-fast-deal-actions');
     for(const [label,complete]of [['Назначить действие',false],['Записать результат',true]]){const action=button(label,()=>window.dispatchEvent(new CustomEvent('liberterra:quick-action',{detail:{id:deal.id,complete}})),'crm-secondary-button');action.disabled=busy.has(deal.id);actions.append(action);}
     card.append(actions);
    }
    column.append(card);
   }
   board.append(column);
  }
 }
 function renderDay(){
  metrics.replaceChildren();attention.replaceChildren();
  const active=records('deal').filter(d=>!['won','lost'].includes(d.stage)),final=active.filter(d=>['agreement','documents'].includes(d.stage));
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const due=(tasks||[]).filter(t=>t.status==='open'&&t.due_at&&Number.isFinite(Date.parse(t.due_at)));
  const overdue=due.filter(t=>Date.parse(t.due_at)<Date.now()),todayTasks=due.filter(t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t.due_at))===today);
  const dueDeals=active.filter(d=>d.next_action_at&&Date.parse(d.next_action_at)<Date.now()+86400000).sort((a,b)=>Date.parse(a.next_action_at)-Date.parse(b.next_action_at));
  for(const [label,value]of [['Активные сделки',state.ready?active.length:'—'],['На финальной стадии',state.ready?final.length:'—'],['Задачи на сегодня',tasks?todayTasks.length:'—'],['Просрочено',tasks?overdue.length:'—']]){const k=el('div',undefined,'crm-day-metric');k.append(el('span',label),el('strong',String(value)));metrics.append(k);}
  const forecast=el('div',undefined,'crm-day-forecast');forecast.append(el('h3','Плановая комиссия'));
  let any=false;for(const currency of ['USD','KGS']){const values=active.filter(d=>d.currency===currency&&d.planned_commission!==''&&d.planned_commission!==undefined);if(values.length){any=true;forecast.append(el('p',money(values.reduce((sum,d)=>sum+Math.round(Number(d.planned_commission)*100),0)/100,currency)));}}
  if(!any)forecast.append(el('p',state.ready?'Пока не указана':'Загружаем…'));forecast.append(el('small','По активным сделкам. Не является полученным доходом.'));attention.append(forecast);
  const urgent=el('div');urgent.append(el('h3','Требуют внимания'));
  if(tasks===null)urgent.append(el('p','Задачи ещё не загружены.'));else if(!overdue.length)urgent.append(el('p','Просроченных задач нет.'));
  for(const task of overdue.sort((a,b)=>a.due_at.localeCompare(b.due_at)).slice(0,3))urgent.append(button(task.title+' · '+date(task.due_at),()=>root.querySelector('[data-crm-tab="tasks"]').click(),'crm-deal-task-link'));
  for(const deal of dueDeals.slice(0,5))urgent.append(button((Date.parse(deal.next_action_at)<Date.now()?'Просрочено: ':'Скоро: ')+(deal.next_action||deal.title)+' · '+date(deal.next_action_at),()=>{tab.click();openForm(deal)},'crm-deal-task-link'));
  attention.append(urgent);
 }
 window.addEventListener('liberterra:crm-loading',()=>{state.ready=false;create.disabled=true;submit.disabled=true;});
 window.addEventListener('liberterra:crm-data',event=>{
  epoch++;const d=event.detail;state={records:d.records||[],objects:d.objects||[],stages:d.dealStages||[],ready:!!d.ready};
  const stage=mobileStage.value;selectOptions(mobileStage,state.stages.map(s=>[s.id,s.label]),stage||'new');
  submit.disabled=!state.ready;
  if(!state.ready){dialog.close();editing=null;tasks=null;busy.clear();form.reset();result.textContent='';history.replaceChildren();}
  status.textContent=state.ready?'Данные сохранены в вашей CRM.':'Не удалось загрузить CRM. Нажмите «Обновить».';renderBoard();renderDay();
 });
 window.addEventListener('liberterra:tasks-data',event=>{tasks=event.detail.ready===false?null:event.detail.tasks;renderDay();renderBoard();});
 renderDay();
})();

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LiberterraDealViewsModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const TERMINAL_STAGES = new Set(["won", "lost"]);

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function timestamp(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  }

  function buildRows(input, query) {
    const source = input || {};
    const records = Array.isArray(source.records) ? source.records : [];
    const objects = Array.isArray(source.objects) ? source.objects : [];
    const stages = Array.isArray(source.stages) ? source.stages : [];
    const clients = new Map(records.filter((item) => item && item.kind === "client").map((item) => [String(item.id), item]));
    const objectMap = new Map(objects.map((item) => [String(item.id), item]));
    const stageMap = new Map(stages.map((item) => [String(item.id), item]));
    const needle = text(query).toLocaleLowerCase("ru");

    return records
      .filter((item) => item && item.kind === "deal")
      .map((deal) => {
        const client = clients.get(String(deal.client_id));
        const object = deal.object_id ? objectMap.get(String(deal.object_id)) : null;
        const stage = stageMap.get(String(deal.stage));
        const row = {
          id: text(deal.id),
          title: text(deal.title) || "Сделка без названия",
          client: text(client && client.name) || "Клиент недоступен",
          stageId: text(deal.stage),
          stage: text(stage && stage.label) || text(deal.stage) || "Этап не указан",
          object: text(object && object.title) || (deal.object_id ? `Объект #${deal.object_id}` : "Не привязан"),
          nextAction: text(deal.next_action) || "Не назначено",
          nextActionAt: text(deal.next_action_at),
          amount: deal.amount,
          currency: text(deal.currency) || "USD",
          plannedCommission: deal.planned_commission,
          terminal: Boolean(stage && stage.terminal) || TERMINAL_STAGES.has(text(deal.stage)),
        };
        row.searchText = [row.title, row.client, row.stage, row.object, row.nextAction].join(" ").toLocaleLowerCase("ru");
        return row;
      })
      .filter((row) => !needle || row.searchText.includes(needle))
      .sort((left, right) => Number(left.terminal) - Number(right.terminal)
        || timestamp(left.nextActionAt) - timestamp(right.nextActionAt)
        || left.title.localeCompare(right.title, "ru"))
      .map(({ searchText, ...row }) => row);
  }

  return { buildRows };
});

(() => {
  "use strict";

  const root = document.querySelector("#agentCabinet");
  const panel = root && root.querySelector('[data-crm-panel="deals"]');
  const model = window.LiberterraDealViewsModel;
  const tools = panel && panel.querySelector(".crm-deal-tools");
  const board = panel && panel.querySelector(".crm-deal-board");
  const search = tools && tools.querySelector('input[type="search"]');
  if (!panel || !model || !tools || !board || !search) return;

  const STORAGE_KEY = "liberterra-crm-deals-view";
  const state = { records: [], objects: [], stages: [], ready: false };
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const money = (value, currency) => {
    if (value === "" || value === undefined || value === null) return "Не указана";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Не указана";
    try {
      const text = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
      return currency === "USD" ? "$" + text : currency === "KGS" || !currency ? text + " сом" : text + " " + currency;
    } catch (_) {
      return `${amount.toLocaleString("ru-RU")} ${currency || ""}`.trim();
    }
  };
  const date = (value) => value
    ? new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Bishkek", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "Не назначено";

  const switcher = element("div", undefined, "crm-deal-view-switch");
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Вид сделок");
  const kanbanButton = element("button", "Канбан");
  const listButton = element("button", "Список");
  kanbanButton.type = listButton.type = "button";
  kanbanButton.dataset.dealView = "kanban";
  listButton.dataset.dealView = "list";
  switcher.append(kanbanButton, listButton);
  tools.append(switcher);

  const listView = element("div", undefined, "crm-deal-list-view");
  listView.hidden = true;
  listView.setAttribute("aria-label", "Список сделок");
  board.after(listView);

  function savedView() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "kanban";
    } catch (_) {
      return "kanban";
    }
  }

  function openDeal(id) {
    const cards = board.querySelectorAll(".crm-deal-card");
    const card = Array.from(cards).find((item) => item.dataset.dealId === id);
    const open = card && card.querySelector(".crm-deal-open");
    if (open) open.click();
  }

  function cell(label, value, className) {
    const item = element("td", value, className);
    item.dataset.label = label;
    return item;
  }

  function renderList() {
    listView.replaceChildren();
    if (!state.ready) {
      listView.append(element("p", "Сделки недоступны до успешной загрузки CRM.", "crm-deal-list-empty"));
      return;
    }
    const rows = model.buildRows(state, search.value);
    if (!rows.length) {
      listView.append(element("p", search.value.trim() ? "По вашему запросу сделок нет." : "Пока нет сделок.", "crm-deal-list-empty"));
      return;
    }

    const table = element("table", undefined, "crm-deal-table");
    const caption = element("caption", `${rows.length} ${rows.length === 1 ? "сделка" : "сделок"}`);
    const head = element("thead");
    const headRow = element("tr");
    ["Сделка", "Клиент", "Этап", "Объект", "Следующее действие", "Сумма", "Комиссия", ""].forEach((label) => {
      const th = element("th", label);
      th.scope = "col";
      headRow.append(th);
    });
    head.append(headRow);
    const body = element("tbody");
    rows.forEach((row) => {
      const tr = element("tr");
      const title = cell("Сделка", row.title, "crm-deal-list-title");
      title.append(element("span", row.nextActionAt ? date(row.nextActionAt) : "Без срока", "crm-deal-list-date"));
      tr.append(
        title,
        cell("Клиент", row.client),
        cell("Этап", row.stage),
        cell("Объект", row.object),
        cell("Следующее действие", row.nextAction),
        cell("Сумма", money(row.amount, row.currency), "crm-deal-list-number"),
        cell("Комиссия", money(row.plannedCommission, row.currency), "crm-deal-list-number")
      );
      const action = cell("", "", "crm-deal-list-action");
      const open = element("button", "Открыть");
      open.type = "button";
      open.addEventListener("click", () => openDeal(row.id));
      action.append(open);
      tr.append(action);
      body.append(tr);
    });
    table.append(caption, head, body);
    listView.append(table);
  }

  function setView(view, persist) {
    const next = view === "list" ? "list" : "kanban";
    panel.dataset.dealView = next;
    board.hidden = next !== "kanban";
    listView.hidden = next !== "list";
    kanbanButton.setAttribute("aria-pressed", String(next === "kanban"));
    listButton.setAttribute("aria-pressed", String(next === "list"));
    if (next === "list") renderList();
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* Preference is optional. */ }
    }
  }

  switcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-deal-view]");
    if (button) setView(button.dataset.dealView, true);
  });
  search.addEventListener("input", () => {
    if (panel.dataset.dealView === "list") renderList();
  });
  window.addEventListener("liberterra:crm-data", (event) => {
    const detail = event.detail || {};
    state.records = detail.records || [];
    state.objects = detail.objects || [];
    state.stages = detail.dealStages || [];
    state.ready = Boolean(detail.ready);
    if (panel.dataset.dealView === "list") renderList();
  });

  setView(savedView(), false);
})();

/* Liberterra CRM attention 20261104 */
window.LiberterraAttentionModel=function dailyAttentionModel(records,stages=[],now=Date.now()){
 const day=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
 const today=day(now),terminal=new Set(['won','lost',...stages.filter(s=>s.terminal===true||s.terminal==='true').map(s=>s.id)]);
 const groups={late:[],today:[],none:[]};
 for(const record of records){
  if(record.kind!=='deal'||terminal.has(record.stage))continue;
  const due=Date.parse(record.next_action_at),missingAction=!String(record.next_action||'').trim(),missingDate=!Number.isFinite(due);
  const group=missingAction||missingDate?'none':due<now?'late':day(due)===today?'today':null;
  if(group)groups[group].push({record,due,reason:missingAction&&missingDate?'Назначьте действие и срок':missingAction?'Укажите следующее действие':missingDate?'Назначьте срок действия':''});
 }
 for(const rows of Object.values(groups))rows.sort((a,b)=>(Number.isFinite(a.due)?a.due:Infinity)-(Number.isFinite(b.due)?b.due:Infinity)||String(a.record.id).localeCompare(String(b.record.id)));
 return groups;
};
(()=>{const style=document.createElement("style");style.id="crm-attention-style";style.textContent=".crm-attention{margin:20px 0;padding:20px;border:1px solid #cbd5e1;border-radius:18px;background:#fff;color:#19212c;min-width:0}\n.crm-attention h2{margin:0 0 10px;font-size:22px}.crm-attention p{line-height:1.5}\n.crm-attention-filters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}\n.crm-attention-filters button{min-height:44px;padding:8px 12px;border:1px solid #a7b8c8;border-radius:10px;background:#fff;color:#1b3d61;cursor:pointer;font:inherit}\n.crm-attention-filters button[aria-pressed=\"true\"]{background:#1b3d61;color:#fff;border-color:#1b3d61}\n.crm-attention button:focus-visible{outline:3px solid #1b3d61;outline-offset:3px}\n.crm-attention-group{margin-top:18px}.crm-attention-group h3{font-size:16px;margin:0 0 8px}\n.crm-attention .crm-reminder{width:100%;min-height:48px;border:0;border-radius:12px;text-align:left;display:flex;flex-direction:column;gap:6px;padding:12px;margin-top:8px;cursor:pointer;overflow-wrap:anywhere;font:inherit}\n.crm-attention .crm-reminder.late{background:#fff0ef;color:#a22f28}.crm-attention .crm-reminder.today{background:#e9f3ff;color:#174c80}.crm-attention .crm-reminder.none{background:#fff4dd;color:#744b0b}\nhtml[data-theme=\"dark\"] .crm-attention{background:#10243c;color:#e9f1ff;border-color:#304965}\n@media(max-width:414px){.crm-attention{padding:14px}}\n\n:root{--action-ink:#19212c;--action-paper:#fff;--action-line:#b7c6d5;--action-accent:#1b3d61;--action-muted:#44566b}\n.crm-attention-actions{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}\n.crm-attention-actions button{min-height:44px;padding:8px 12px;background:var(--action-paper);color:var(--action-accent);border:1px solid var(--action-line);border-radius:10px;font:inherit;cursor:pointer}\n.crm-action-dialog{box-sizing:border-box;width:min(680px,calc(100% - 24px));max-height:calc(100dvh - 32px);overflow:auto;border:1px solid var(--action-line);border-radius:18px;padding:24px;background:var(--action-paper);color:var(--action-ink)}\n.crm-action-dialog::backdrop{background:#071426a6}.crm-action-dialog h2{margin:0 0 16px;font-size:22px}\n.crm-action-dialog form{display:grid;gap:14px}.crm-action-dialog label,.crm-action-field{display:grid;gap:7px;min-width:0}\n.crm-action-dialog input,.crm-action-dialog select,.crm-action-dialog textarea{box-sizing:border-box;width:100%;min-width:0;min-height:44px;border:1px solid var(--action-line);border-radius:9px;padding:10px;font:inherit;background:var(--action-paper);color:var(--action-ink)}\n.crm-action-dialog textarea{min-height:100px;resize:vertical}.crm-action-dialog button{min-height:44px;white-space:normal}\n.crm-action-dialog :focus-visible{outline:3px solid var(--action-accent);outline-offset:3px}\n.crm-action-dialog p{line-height:1.5;overflow-wrap:anywhere}.crm-action-hint{font-size:13px;color:var(--action-muted);margin:0}\n.crm-match-list{display:grid;gap:12px;max-height:45vh;overflow:auto}.crm-action-dialog .crm-match-row{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;padding:12px;border:1px solid var(--action-line);border-radius:12px;align-items:start}\n.crm-match-row input[type=checkbox]{width:22px;min-height:44px;margin:0}.crm-match-row span{display:grid;gap:6px;overflow-wrap:anywhere}.crm-match-row small{line-height:1.5;color:var(--action-muted)}\n.crm-action-notes{white-space:pre-wrap}.crm-action-banner:empty{display:none}\n.crm-history-dates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.crm-history-controls{display:flex;gap:10px;flex-wrap:wrap}.crm-history-list{display:grid;gap:16px}.crm-history-entry{border-top:1px solid var(--action-line);padding-top:12px;min-width:0}.crm-history-entry h3{margin:0 0 8px;overflow-wrap:anywhere}.crm-history-entry p{margin:8px 0}.crm-action-dialog [hidden]{display:none!important}\nhtml[data-theme=dark]{--action-ink:#e9f1ff;--action-paper:#10243c;--action-line:#60758e;--action-accent:#91c1fa;--action-muted:#bdcde0}\n@media(max-width:414px){.crm-action-dialog{padding:16px}.crm-attention-actions button{flex:1 1 100%}.crm-history-dates{grid-template-columns:1fr}.crm-history-controls button{flex:1 1 100%}}\n";document.head.append(style);})();
'use strict';
// Consume complete, authorized timeline pages; never silently report a truncated summary.
function report(pages){
 if(!Array.isArray(pages)||!pages.length||pages.at(-1).next_cursor)throw Error('Incomplete history');
 const entries=new Map();for(const page of pages){if(!Array.isArray(page.items))throw Error('Invalid history');for(const item of page.items)entries.set(item.key,item);}
 const result={recorded_results:0,calls:0,selections:0,viewing_actions:0,other_actions:0,completed_viewings:0,planned_viewings:0,cancelled_viewings:0};
 for(const item of entries.values()){
  if(item.key.startsWith('result:')){result.recorded_results++;const field={call:'calls',selection:'selections',viewing:'viewing_actions'}[item.type]||'other_actions';result[field]++;}
  if(item.key.startsWith('appointment:')){const field={completed:'completed_viewings',planned:'planned_viewings',cancelled:'cancelled_viewings'}[item.status];if(field)result[field]++;}
 }
 return result;
}
function previousActivityPeriod(period){
 const parse=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Проверьте диапазон дат.');const time=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)throw Error('Проверьте диапазон дат.');return time;};
 const start=parse(period.from),end=parse(period.to),day=86400000;if(end<start)throw Error('Проверьте диапазон дат.');
 const days=(end-start)/day+1,from=new Date(start-days*day).toISOString().slice(0,10),to=new Date(start-day).toISOString().slice(0,10);
 if(!/^\d{4}-/.test(from)||from<'0001-01-01')throw Error('Предыдущий период выходит за допустимые даты.');return {from,to};
}
function activityChange(current,previous){
 const delta=current-previous;return {delta,percent:previous===0?(current===0?0:null):Math.round(delta/previous*1000)/10};
}
function activityChangeText(current,previous){
 const {delta,percent}=activityChange(current,previous),signed=value=>(value>0?'+':'')+String(value).replace('.',',');
 return signed(delta)+' · '+(percent===null?'процент не рассчитан: ранее 0':signed(percent)+'%');
}
function activityReportEntries(pages,metric){
 report(pages);const entries=new Map();for(const page of pages)for(const item of page.items)entries.set(item.key,item);
 return [...entries.values()].filter(item=>{
  if(metric==='recorded_results')return item.key.startsWith('result:');
  const type={calls:'call',selections:'selection',viewing_actions:'viewing'}[metric];
  if(type)return item.key.startsWith('result:')&&item.type===type;
  if(metric==='other_actions')return item.key.startsWith('result:')&&!['call','selection','viewing'].includes(item.type);
  const status={completed_viewings:'completed',planned_viewings:'planned',cancelled_viewings:'cancelled'}[metric];
  return Boolean(status)&&item.key.startsWith('appointment:')&&item.status===status;
 }).sort((a,b)=>String(b.at).localeCompare(String(a.at))||String(b.key).localeCompare(String(a.key)));
}
function searchActivityEntries(entries,query){const needle=String(query||'').trim().toLocaleLowerCase('ru').replace(/ё/g,'е');if(!needle)return entries;return entries.filter(item=>[item.title,item.text,item.deal_title,item.next_action,item.client_name].some(value=>String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').includes(needle)));}
function filterActivityEntries(entries,query,clientId){const searched=searchActivityEntries(entries,query);return clientId?searched.filter(item=>String(item.client_id||'')===String(clientId)):searched;}
function clientsWithoutNextStep(pages,clients,deals){report(pages);const contacts=new Map();for(const page of pages)for(const item of page.items)if(item.key.startsWith('result:')&&item.client_id&&(!contacts.has(String(item.client_id))||String(item.at)>String(contacts.get(String(item.client_id)).at)))contacts.set(String(item.client_id),item);return clients.flatMap(client=>{const contact=contacts.get(String(client.id));if(!contact)return [];const active=deals.filter(deal=>String(deal.client_id)===String(client.id)&&!['won','lost'].includes(deal.stage));if(!active.length)return [];const missing=active.filter(deal=>!deal.next_action||!deal.next_action_at);return missing.map(deal=>({client,deal,contact}));});}
function attentionClientsWithoutStep(records){const clients=records.filter(record=>record.kind==='client'),deals=records.filter(record=>record.kind==='deal');const pages=[{items:deals.flatMap(deal=>(deal.action_results||[]).map(result=>({key:'result:'+result.id,client_id:result.client_id||deal.client_id,at:result.at}))),next_cursor:''}];return clientsWithoutNextStep(pages,clients,deals).sort((a,b)=>String(a.contact.at).localeCompare(String(b.contact.at))||String(a.client.name).localeCompare(String(b.client.name),'ru'));}
function daysSinceContact(at,now=new Date()){const contact=Date.parse(at),current=new Date(now).getTime();if(!Number.isFinite(contact)||!Number.isFinite(current))return null;const day=value=>Math.floor((value+21600000)/86400000);return Math.max(0,day(current)-day(contact));}
function daysSinceContactLabel(days){if(days===null)return 'Срок бездействия неизвестен';if(days===0)return 'Контакт сегодня';const lastTwo=days%100,last=days%10,word=lastTwo>=11&&lastTwo<=14?'дней':last===1?'день':last>=2&&last<=4?'дня':'дней';return 'Без следующего шага '+days+' '+word;}
function contactOlderThanThreeDays(rows,now=new Date()){return rows.filter(row=>{const days=daysSinceContact(row.contact.at,now);return days!==null&&days>3;});}
function activityPeriodPreset(kind,now=new Date()){
 const local=new Date(new Date(now).getTime()+6*60*60*1000),to=local.toISOString().slice(0,10);
 if(kind==='today')return {from:to,to};
 if(kind==='month')return {from:to.slice(0,8)+'01',to};
 if(kind==='week'){local.setUTCDate(local.getUTCDate()-(local.getUTCDay()+6)%7);return {from:local.toISOString().slice(0,10),to};}
 throw Error('Неизвестный период');
}
function activityReportCsv(period,total,rows,comparison){
 const fields=['recorded_results','calls','selections','viewing_actions','other_actions','completed_viewings','planned_viewings','cancelled_viewings'];
 const labels=['Записано результатов','Звонки с результатом','Подборки с результатом','Действия по показам','Другие действия','Показы со статусом «Состоялся»','Запланированные показы','Отменённые показы'];
 const cell=value=>{let text=String(value??'');if(typeof value!=='number'&&(/^[\s\uFEFF]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text)))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
 const data=[['Отчёт по действиям и показам'],['С даты · Бишкек',period.from],['По дату · Бишкек',period.to],['Правило подсчёта','Результаты — по времени записи. Показы — по времени обновления записи и текущему статусу, не по дате проведения.'],[],['Клиент',...labels],['ИТОГО',...fields.map(key=>total[key])],...rows.map(row=>[row.client.name,...fields.map(key=>row.counts[key])])];
 if(comparison){data.push([],['Сравнение с предыдущим периодом'],['Предыдущий период · Бишкек',comparison.period.from,comparison.period.to],['Показатель','Текущий период','Предыдущий период','Изменение','Изменение, %']);fields.forEach((key,index)=>{const change=activityChange(total[key],comparison.total[key]);data.push([labels[index],total[key],comparison.total[key],change.delta,change.percent===null?'Не рассчитан: ранее 0':change.percent]);});}
 return '\uFEFFsep=;\r\n'+data.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
if(typeof module==='object'&&module.exports)module.exports={report,activityReportCsv,previousActivityPeriod,activityChange,activityChangeText,activityPeriodPreset,activityReportEntries,searchActivityEntries,filterActivityEntries,clientsWithoutNextStep,attentionClientsWithoutStep,daysSinceContact,daysSinceContactLabel,contactOlderThanThreeDays};else window.LiberterraActivityReport={report,activityReportCsv,previousActivityPeriod,activityChange,activityChangeText,activityPeriodPreset,activityReportEntries,searchActivityEntries,filterActivityEntries,clientsWithoutNextStep,attentionClientsWithoutStep,daysSinceContact,daysSinceContactLabel,contactOlderThanThreeDays};

/* Attention panel for the deployed agent cabinet. Uses its existing editor/API. */
(() => {
 'use strict';
 const root=document.querySelector('#agentCabinet'),overview=root?.querySelector('[data-crm-panel="overview"]');
 if(!overview||!window.LiberterraAttentionModel)return;
 const section=document.createElement('section');section.className='crm-attention';section.setAttribute('aria-label','Требует внимания');
 let records=[],stages=[],ready=false,filter='all',olderThanThree=false;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const labels={late:'Просрочено',today:'Сегодня',none:'Без следующего шага'};
 function render(){
  const focused=section.contains(document.activeElement)?document.activeElement?.dataset.filter:null;
  section.replaceChildren(el('h2','Требует внимания'));
  if(!ready){section.append(el('p','Сводка появится после успешной загрузки CRM.'));return;}
  section.append(el('p','Активные сделки · время Бишкека. Откройте сделку, чтобы назначить следующий шаг.'));
  const groups=window.LiberterraAttentionModel(records,stages),total=Object.values(groups).reduce((n,rows)=>n+rows.length,0),filters=el('div');
  filters.className='crm-attention-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Фильтр внимания');
  for(const [key,label,count] of [['all','Все',total],...Object.keys(groups).map(key=>[key,labels[key],groups[key].length])]){
   const button=el('button',label+' · '+count);button.type='button';button.dataset.filter=key;button.setAttribute('aria-pressed',String(filter===key));button.addEventListener('click',()=>{filter=key;render();});filters.append(button);
  }
  section.append(filters);const results=el('div');results.setAttribute('aria-live','polite');let shown=0;
  for(const key of Object.keys(groups)){
   if(filter!=='all'&&filter!==key||!groups[key].length)continue;
   const group=el('div');group.className='crm-attention-group';group.append(el('h3',labels[key]));
   for(const {record,reason} of groups[key]){
    shown++;const button=el('button');button.type='button';button.className='crm-reminder '+key;
    button.append(el('strong',record.title||'Сделка без названия'),el('span',reason||record.next_action));
    button.append(el('span',reason?'Открыть и назначить':new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(record.next_action_at))));
    button.addEventListener('click',()=>{
     const card=[...root.querySelectorAll('.crm-deal-card')].find(node=>node.dataset.dealId===String(record.id));
     const open=card?.querySelector('.crm-deal-open');
     if(!open||open.disabled){notice.textContent='Карточка пока недоступна. Обновите CRM и повторите попытку.';return;}
     root.querySelector('[data-crm-tab="deals"]')?.click();open.click();
    });group.append(button);
    const actions=el('div');actions.className='crm-attention-actions';
    for(const [label,complete] of [['Назначить действие',false],['Записать результат',true]]){
     const quick=el('button',label);quick.type='button';quick.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('liberterra:quick-action',{detail:{id:record.id,complete}})));actions.append(quick);
    }group.append(actions);
   }results.append(group);
  }
  if(!shown)results.append(el('p',total?'В этой категории сделок нет.':'Срочных и неназначенных действий нет.'));
  const notice=el('p');notice.setAttribute('role','status');results.append(notice);section.append(results);
  const contacted=window.LiberterraActivityReport.attentionClientsWithoutStep(records),urgent=window.LiberterraActivityReport.contactOlderThanThreeDays(contacted),visible=olderThanThree?urgent:contacted,clientGroup=el('section');clientGroup.className='crm-attention-group';clientGroup.append(el('h3','Клиенты без следующего шага после контакта'));
  const ageFilter=el('button','Без шага больше 3 дней · '+urgent.length);ageFilter.type='button';ageFilter.setAttribute('aria-pressed',String(olderThanThree));ageFilter.addEventListener('click',()=>{olderThanThree=!olderThanThree;render();section.querySelector('[data-contact-age-filter]')?.focus();});ageFilter.dataset.contactAgeFilter='true';clientGroup.append(ageFilter);
  clientGroup.append(el('p','По результатам, загруженным в кабинет. Полную историю за период смотрите в отчёте.'));
  if(!visible.length)clientGroup.append(el('p',olderThanThree?'Клиентов без шага больше 3 дней нет.':'Таких клиентов среди загруженных результатов нет.'));
  for(const {client,deal,contact} of visible){const row=el('div');row.className='crm-reminder none';row.append(el('strong',client.name),el('span',deal.title||'Сделка без названия'),el('span','Последний контакт: '+new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(contact.at))),el('span',window.LiberterraActivityReport.daysSinceContactLabel(window.LiberterraActivityReport.daysSinceContact(contact.at))));const history=el('button','История клиента');history.type='button';history.dataset.attentionHistoryClient=String(client.id);history.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('liberterra:client-history',{detail:{id:client.id}})));const assign=el('button','Назначить действие');assign.type='button';assign.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('liberterra:quick-action',{detail:{id:deal.id,complete:false}})));row.append(history,assign);clientGroup.append(row);}
  section.append(clientGroup);
  if(focused)section.querySelector(`[data-filter="${focused}"]`)?.focus();
 }
 window.addEventListener('liberterra:crm-loading',()=>{ready=false;records=[];render();});
 window.addEventListener('liberterra:crm-data',event=>{ready=event.detail?.ready===true;records=ready?event.detail.records||[]:[];stages=ready?event.detail.dealStages||[]:[];render();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready)render();});
 render();
})();

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LiberterraActionModel=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const actions={call:'Позвонить',selection:'Отправить подборку',viewing:'Назначить показ'};
 const fields=['title','client_id','deal_type','object_id','stage','currency','amount','planned_commission','source','next_action','next_action_at','viewing_at','viewing_result','agreed_price','deposit_amount','deposit_at','documents_confirmed','lost_reason','notes'];
 function localDate(value){if(!value||!Number.isFinite(Date.parse(value)))return '';const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)),get=k=>parts.find(p=>p.type===k).value;return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;}
 function actionData(record,{action,deadline,result='',complete=false},now=Date.now()){
  if(!record||['won','lost'].includes(record.stage))throw Error('Закрытая сделка недоступна для быстрого действия.');
  if(!actions[action])throw Error('Выберите следующее действие.');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(deadline))throw Error('Укажите дату и время по Бишкеку.');
  const due=new Date(deadline+':00+06:00');if(!Number.isFinite(due.getTime())||localDate(due.toISOString())!==deadline)throw Error('Проверьте дату и время.');
  if(due.getTime()<=now)throw Error('Срок должен быть в будущем.');
  const data={};for(const key of fields)if(Object.hasOwn(record,key))data[key]=record[key];
  data.next_action=actions[action];data.next_action_at=due.toISOString();
  if(complete){
   result=String(result).trim();if(!result)throw Error('Запишите результат выполненного действия.');if(result.length>500)throw Error('Результат: не более 500 символов.');
   if(record.action_journal===true)return data;
   const stamp=new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',dateStyle:'short',timeStyle:'short'}).format(new Date(now));
   const line=`[Результат · ${stamp} · Бишкек] ${record.next_action||'Действие'}: ${result}`;
   data.notes=[String(record.notes||'').trim(),line].filter(Boolean).join('\n');
   if(data.notes.length>2000)throw Error('В заметках недостаточно места для результата. Сохранённые заметки не будут сокращены. Откройте карточку и освободите место.');
  }
  return data;
 }
 function appointmentData(selection,objects,{objectId,deadline,notes=''},now=Date.now()){
  if(!selection?.client_id||!Array.isArray(selection.object_ids))throw Error('Подборка недоступна. Обновите CRM.');
  if(!selection.object_ids.map(String).includes(String(objectId))||!objects.some(o=>String(o.id)===String(objectId)))throw Error('Выберите доступный объект из этой подборки.');
  const due=actionData({stage:'new'},{action:'viewing',deadline},now).next_action_at;
  notes=String(notes).trim();if(notes.length>1000)throw Error('Заметка: не более 1000 символов.');
  return {client_id:selection.client_id,object_id:String(objectId),starts_at:due,status:'planned',notes};
 }
 function duplicateAppointment(records,data){return records.find(r=>r.kind==='appointment'&&r.status==='planned'&&r.client_id===data.client_id&&String(r.object_id)===String(data.object_id)&&Date.parse(r.starts_at)===Date.parse(data.starts_at));}
 const norm=v=>String(v||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 function price(value){
  const text=String(value||''),usd=/\$|USD/i.test(text),kgs=/сом|KGS/i.test(text);if(usd===kgs||/(?:от|до)\s*(?:\$|USD|KGS)?\s*\d|\d\s*[-–]\s*\d/i.test(text))return null;
  const matches=text.match(/\d[\d\s\u00a0.,]*/g);if(matches?.length!==1)return null;let number=matches[0].trim().replace(/\u00a0/g,' ');
  if(/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(number))number=number.replace(/,/g,'');
  else if(/^\d{1,3}(?: \d{3})+(?:[.,]\d{1,2})?$/.test(number))number=number.replace(/ /g,'').replace(',','.');
  else if(/^\d+(?:[.,]\d{1,2})?$/.test(number))number=number.replace(',','.');else return null;
  const amount=Number(number);return Number.isFinite(amount)?{currency:usd?'USD':'KGS',amount}:null;
 }
 function matchObjects(client,objects){
  return objects.map(object=>{
   const matched=[],unknown=[],conflicts=[];
   for(const [key,label] of [['city','Город'],['district','Район']]){
    if(!norm(client[key]))continue;const options=norm(client[key]).split(/[,;]+/).map(s=>s.trim()).filter(Boolean),value=norm(object[key]);
    if(!value)unknown.push(label+' не указан');else if(options.includes(value))matched.push(label);else conflicts.push(label+' отличается');
   }
   const desired=client.role==='buyer'?'sale':client.role==='tenant'?'rent':null;
   const deal=/аренд|rent/.test(norm(object.deal))?'rent':/продаж|sale|sell/.test(norm(object.deal))?'sale':null;
   if(desired){if(!deal)unknown.push('Тип сделки не указан');else if(desired===deal)matched.push('Тип сделки');else conflicts.push('Другой тип сделки');}
   if(norm(client.rooms)){
    const requested=norm(client.rooms).match(/^([1-9])(?:\s*-\s*([1-9]))?$/),actual=norm(object.rooms).match(/^([1-9])(?:\s*(?:комн.*|к))?$/);
    if(!requested||!actual)unknown.push('Комнатность требует проверки');else if(+actual[1]>=+requested[1]&&+actual[1]<=+(requested[2]||requested[1]))matched.push('Комнатность');else conflicts.push('Комнатность отличается');
   }
   const min=Number(client.budget_min)||0,max=Number(client.budget_max)||0;
   if(min||max){const cost=price(object.price);if(!cost||cost.currency!==client.currency||/м²|м2|m2|m²/i.test(String(object.per||'')+' '+String(object.price||'')))unknown.push('Бюджет: проверьте цену, валюту и единицу');else if(cost.amount>=min&&(!max||cost.amount<=max))matched.push('Бюджет');else conflicts.push('Цена вне бюджета');}
   if(norm(client.property_type))unknown.push('Тип недвижимости: '+client.property_type+' — проверьте карточку');
   return {object,matched,unknown,conflicts};
  }).sort((a,b)=>a.conflicts.length-b.conflicts.length||b.matched.length-a.matched.length||String(a.object.id).localeCompare(String(b.object.id)));
 }
 return {actions,actionData,appointmentData,duplicateAppointment,localDate,matchObjects,price};
});

/* Fast actions and client matching. Private state remains in memory only. */
(() => {
 'use strict';
 const root=document.querySelector('#agentCabinet'),content=root?.querySelector('[data-crm-content]'),model=window.LiberterraActionModel;if(!content||!model)return;
 let state={ready:false,records:[],objects:[]},epoch=0,active=null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=el('button',text,'crm-secondary-button');b.type='button';b.addEventListener('click',fn);return b;};
 const banner=el('p','','crm-action-banner');banner.setAttribute('role','status');root.querySelector('[data-crm-panel="overview"]').prepend(banner);
 function close(returnToHistory=false){if(active){const previous=active;active=null;previous.dialog.close();previous.dialog.remove();const original=previous.focus;const replacement=original?.dataset?.attentionHistoryClient&&[...root.querySelectorAll('[data-attention-history-client]')].find(node=>node.dataset.attentionHistoryClient===original.dataset.attentionHistoryClient);const target=original?.isConnected?original:replacement;if(target){target.focus();if(replacement)target.scrollIntoView({block:'center',behavior:'smooth'});}if(returnToHistory&&previous.back&&previous.epoch===epoch&&state.ready&&!content.hidden)previous.back();}}
 function modal(title){
  close();const dialog=el('dialog',undefined,'crm-action-dialog'),heading=el('h2',title);heading.id='crm-action-title';dialog.setAttribute('aria-labelledby',heading.id);
  const form=el('form'),status=el('p');status.setAttribute('role','status');const cancel=button('Отмена',()=>close(true));
  dialog.append(heading,form,status,cancel);root.append(dialog);active={dialog,form,status,cancel,busy:false,pending:null,epoch,focus:document.activeElement};
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!active?.busy)close(true);});
  dialog.showModal();return active;
 }
 function field(form,label,name,type){const wrap=el('div',undefined,'crm-action-field'),caption=el('label',label),input=el(type==='textarea'?'textarea':type==='select'?'select':'input');if(!['textarea','select'].includes(type))input.type=type;input.name=name;input.id='crm-action-'+name;caption.htmlFor=input.id;wrap.append(caption,input);form.append(wrap);return input;}
 function valid(context){return active===context&&context.epoch===epoch&&state.ready&&!content.hidden;}
 function busy(context,value){context.busy=value;context.form.querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=value);context.cancel.disabled=value;}
 const errors={crm_version_conflict:'Сделка изменилась в другой вкладке. Обновите CRM и повторите действие.',crm_object_unavailable:'Объект больше недоступен. Обновите CRM и измените подборку.',crm_client_not_found:'Клиент больше недоступен. Обновите CRM.',crm_history_limit:'История сделки заполнена. Обратитесь к администратору.',crm_busy:'Сервис занят. Повторите сохранение.'};
 async function save(context,request,success){
  if(!valid(context)||context.busy)return;
  busy(context,true);context.status.textContent='Сохраняем…';context.pending||=request;
  try{
   const response=await window.LiberterraAgentAccess.request('save_crm_record',context.pending);
   if(!valid(context))return;
   if(!response?.record?.id)throw Error('Сервер не подтвердил сохранение. Повторите попытку.');
   close();banner.textContent=success;
   await window.LiberterraCrmWorkflow.reload();
   if(context.afterSave&&state.ready&&!content.hidden)context.afterSave();
   return true;
  }catch(error){if(valid(context)){context.status.textContent=errors[error.code]||error.message||'Не удалось сохранить. Повторите попытку.';if(error.code==='crm_version_conflict'){context.form.querySelector('[type="submit"]').dataset.conflict='true';if(context.recover)context.recover.hidden=false;}}}
  finally{if(valid(context)){busy(context,false);const submit=context.form.querySelector('[type="submit"]');if(submit?.dataset.conflict)submit.disabled=true;}}
 }
 function actionDialog(id,complete,back,draft){
  const record=state.records.find(r=>r.kind==='deal'&&String(r.id)===String(id));if(!state.ready||content.hidden||!record||['won','lost'].includes(record.stage))return;
  const context=modal(complete?'Результат и следующий шаг':'Назначить следующее действие');context.back=()=>back?.(false);context.afterSave=()=>back?.(true);const {form}=context;context.dialog.classList.add('crm-action-dialog--next-step');
  form.append(el('p',record.title,'crm-action-subject'));
  if(complete){form.append(el('p','Выполненное действие: '+(record.next_action||'Не указано'),'crm-action-previous'));const result=field(form,'Что получилось?','result','textarea');result.required=true;result.maxLength=500;result.value=draft?.result||'';}
  const action=field(form,'Следующее действие','action','select');for(const [value,label] of Object.entries(model.actions))action.add(new Option(label,value));
  action.value=draft?.action&&model.actions[draft.action]?draft.action:Object.keys(model.actions).find(k=>model.actions[k]===record.next_action)||'call';
  const choices=el('div',undefined,'crm-action-choice-group');choices.setAttribute('role','group');choices.setAttribute('aria-label','Выберите следующее действие');
  for(const [value,label]of Object.entries(model.actions)){const choice=el('button',label,'crm-action-choice');choice.type='button';choice.setAttribute('aria-pressed',String(value===action.value));choice.addEventListener('click',()=>{action.value=value;action.dispatchEvent(new Event('input',{bubbles:true}));action.dispatchEvent(new Event('change',{bubbles:true}));choice.focus();});choices.append(choice);}
  action.closest('.crm-action-field').after(choices);
  action.addEventListener('change',()=>{[...choices.children].forEach((choice,index)=>choice.setAttribute('aria-pressed',String(action.options[index]?.value===action.value)));});
  const deadline=field(form,'Срок · время Бишкека','deadline','datetime-local');deadline.required=true;deadline.value=draft?.deadline||Date.parse(record.next_action_at)>Date.now()&&model.localDate(record.next_action_at)||model.localDate(new Date(Date.now()+3600000).toISOString());
  const presets=el('div',undefined,'crm-action-date-presets');presets.setAttribute('role','group');presets.setAttribute('aria-label','Быстрый выбор срока действия');
  for(const [hours,label,time]of [[1,'Через час',null],[24,'Завтра · 10:00','10:00'],[72,'Через 3 дня · 10:00','10:00']]){const preset=el('button',label,'crm-action-date-preset');preset.type='button';preset.addEventListener('click',()=>{const future=model.localDate(new Date(Date.now()+hours*3600000).toISOString());deadline.value=time?future.slice(0,10)+'T'+time:future;deadline.dispatchEvent(new Event('input',{bubbles:true}));deadline.focus();});presets.append(preset);}
  deadline.closest('.crm-action-field').after(presets,el('p','Время Бишкека (UTC+6). Срок можно изменить вручную.','crm-action-hint'));
  form.append(el('p','«Назначить показ» планирует следующий шаг. Сам показ с объектом и временем оформляется в календаре.','crm-action-hint'));
  if(complete)form.append(el('p',record.action_journal===true?'Результат сохранится в журнале с автором и временем. Заметки сделки сохранятся.':'Результат добавится в заметки сделки вместе со следующим шагом.','crm-action-hint'));
  const submit=el('button',complete?'Сохранить результат и шаг':'Сохранить действие','crm-primary-button');submit.type='submit';const footer=el('div',undefined,'crm-action-footer');const recover=button('Обновить и продолжить',async()=>{if(active!==context||content.hidden||context.busy)return;const values=Object.fromEntries(new FormData(form));recover.disabled=true;context.recovering=true;context.status.textContent='Обновляем CRM…';try{await window.LiberterraCrmWorkflow.reload();}catch{}context.recovering=false;if(!state.ready){if(active===context&&!content.hidden){recover.disabled=false;context.status.textContent='CRM не обновилась. Черновик сохранён в этой вкладке. Повторите обновление.';}return;}if(content.hidden)return;const fresh=state.records.find(r=>r.kind==='deal'&&String(r.id)===String(id));if(!fresh||['won','lost'].includes(fresh.stage)){banner.textContent='Сделка больше недоступна для действия. Проверьте её актуальный статус.';back?.(false);return;}const restored=actionDialog(id,complete,back,values);if(restored)restored.status.textContent='Черновик восстановлен. Проверьте обновлённую сделку и срок перед сохранением.';});recover.hidden=true;context.recover=recover;footer.append(submit,recover,context.status,context.cancel);form.append(footer);
  form.addEventListener('input',()=>{if(!context.busy)context.pending=null;});
  form.addEventListener('submit',event=>{event.preventDefault();if(context.busy||!valid(context))return;try{const values=Object.fromEntries(new FormData(form));const data=model.actionData(record,{...values,complete});const request={kind:'deal',id:record.id,version:record.version,mutation_id:crypto.randomUUID(),data};if(complete&&record.action_journal===true)data.action_result=String(values.result).trim();save(context,request,complete?'Результат сохранён. Следующий шаг назначен.':'Следующее действие сохранено.');}catch(error){context.status.textContent=error.message;}});
  form.querySelector('textarea,select').focus();
  return context;
 }
 function matching(client){
  if(!state.ready||content.hidden||!state.records.some(r=>r.kind==='client'&&r.id===client.id))return;
  const context=modal('Подбор объектов для '+client.name),form=context.form;
  form.append(el('p',[client.city,client.district,client.property_type,client.rooms&&client.rooms+' комн.',client.budget_max&&'До '+client.budget_max+' '+client.currency].filter(Boolean).join(' · ')||'Требования пока не заполнены: сравните объекты вручную.'));
  form.append(el('p','Совпадения рассчитаны по доступным полям. Тип недвижимости, неизвестную валюту и неполные данные нужно проверить. В клиентскую ссылку попадут только опубликованные объекты.','crm-action-hint'));
  const title=field(form,'Название подборки','title','text');title.required=true;title.maxLength=120;title.value=('Подборка для '+client.name).slice(0,120);
  const search=field(form,'Поиск по названию, району или номеру','search','search'),scope=field(form,'Показывать','scope','select');scope.add(new Option('Без явных несовпадений','match'));scope.add(new Option('Все доступные объекты','all'));
  const counter=el('p'),list=el('div',undefined,'crm-match-list'),selected=new Set();form.append(counter,list);
  const rows=model.matchObjects(client,state.objects);
  function renderList(){
   list.replaceChildren();counter.textContent='Выбрано: '+selected.size+' из 50';let count=0;
   for(const row of rows){const o=row.object;if(scope.value==='match'&&row.conflicts.length)continue;if(![o.id,o.title,o.city,o.district].join(' ').toLocaleLowerCase('ru').includes(search.value.trim().toLocaleLowerCase('ru')))continue;count++;
    const label=el('label',undefined,'crm-match-row'),check=el('input');check.type='checkbox';check.value=o.id;check.checked=selected.has(String(o.id));
    check.addEventListener('change',()=>{if(check.checked&&selected.size>=50){check.checked=false;context.status.textContent='Можно выбрать до 50 объектов.';return;}if(check.checked)selected.add(String(o.id));else selected.delete(String(o.id));context.pending=null;counter.textContent='Выбрано: '+selected.size+' из 50';});
    const copy=el('span');copy.append(el('strong',o.title||'Объект #'+o.id),el('span',[o.price||'Цена не указана',o.per,o.district].filter(Boolean).join(' · ')));
    if(row.matched.length)copy.append(el('small','Совпадает: '+row.matched.join(', ')));
    if(row.unknown.length)copy.append(el('small','Проверить: '+row.unknown.join('; ')));
    if(row.conflicts.length)copy.append(el('small','Не совпадает: '+row.conflicts.join('; ')));
    label.append(check,copy);list.append(label);
   }
   if(!count)list.append(el('p','Подходящих объектов пока нет. Выберите «Все доступные объекты» или измените поиск.'));
  }
  search.addEventListener('input',renderList);scope.addEventListener('change',renderList);title.addEventListener('input',()=>context.pending=null);renderList();
  const submit=el('button','Сохранить подборку','crm-primary-button');submit.type='submit';form.append(submit);
  const id=crypto.randomUUID();form.addEventListener('submit',event=>{event.preventDefault();if(!selected.size){context.status.textContent='Выберите хотя бы один объект.';return;}save(context,{kind:'selection',id,version:0,mutation_id:crypto.randomUUID(),data:{title:title.value.trim(),client_id:client.id,object_ids:[...selected]}},'Подборка сохранена. В разделе «Подборки» можно создать и скопировать ссылку клиенту.').then(saved=>{if(saved&&!active&&state.ready)root.querySelector('[data-crm-tab="selections"]')?.click();});});
  title.focus();
 }
 function viewing(selection){
  if(!state.ready||content.hidden)return;
  const client=state.records.find(r=>r.kind==='client'&&r.id===selection.client_id);if(!client)return;
  const context=modal('Назначить показ из подборки'),form=context.form;
  form.append(el('p','Клиент: '+client.name),el('p','Подборка: '+selection.title));
  const objects=state.objects.filter(o=>selection.object_ids.map(String).includes(String(o.id)));
  if(!objects.length){form.append(el('p','Объекты этой подборки больше недоступны. Обновите CRM или измените подборку.'));context.cancel.textContent='Закрыть';return;}
  const object=field(form,'Объект для показа','objectId','select');object.required=true;
  if(objects.length>1)object.add(new Option('Выберите объект',''));
  for(const item of objects)object.add(new Option((item.title||'Объект')+' · #'+item.id,String(item.id)));
  const deadline=field(form,'Дата и время показа · Бишкек','deadline','datetime-local');deadline.required=true;
  const notes=field(form,'Заметка к показу','notes','textarea');notes.maxLength=1000;
  form.append(el('p','Показ появится в календаре. Клиенту и другим участникам уведомления автоматически не отправляются.','crm-action-hint'));
  const submit=el('button','Сохранить показ','crm-primary-button');submit.type='submit';form.append(submit);
  form.addEventListener('input',()=>{if(!context.busy){context.pending=null;context.status.textContent='';}});
  const id=crypto.randomUUID();
  form.addEventListener('submit',event=>{event.preventDefault();if(!valid(context)||context.busy)return;try{
   const data=model.appointmentData(selection,state.objects,Object.fromEntries(new FormData(form)));
   if(model.duplicateAppointment(state.records,data)){context.status.textContent='Такой показ уже запланирован. Откройте календарь, чтобы изменить его.';return;}
   save(context,{kind:'appointment',id,version:0,mutation_id:crypto.randomUUID(),data},'Показ сохранён в календаре.').then(saved=>{if(saved&&!active&&state.ready)root.querySelector('[data-crm-tab="calendar"]')?.click();});
  }catch(error){context.status.textContent=error.message;}});
  (objects.length>1?object:deadline).focus();
 }
 function viewingFollowup(appointment){
  if(!state.ready||content.hidden||appointment.status!=='completed')return;
  const deals=state.records.filter(r=>r.kind==='deal'&&r.client_id===appointment.client_id&&!['won','lost'].includes(r.stage));
  const context=modal('Следующий шаг после показа'),form=context.form;
  form.append(el('p','Результат показа: '+(appointment.notes||'Не указан в календаре')));
  if(!deals.length){form.append(el('p','У этого клиента нет активной сделки. Создайте её в разделе «Сделки», затем назначьте следующий шаг.'));context.cancel.textContent='Закрыть';return;}
  const select=field(form,'Для какой сделки назначить действие?','dealId','select');select.required=true;
  if(deals.length>1)select.add(new Option('Выберите сделку',''));
  for(const deal of deals)select.add(new Option(deal.title+(String(deal.object_id)===String(appointment.object_id)?' · объект показа':''),deal.id));
  form.append(el('p','Результат уже сохранён в календаре. На следующем экране назначьте действие по выбранной сделке.','crm-action-hint'));
  const submit=el('button','Перейти к следующему действию','crm-primary-button');submit.type='submit';form.append(submit);
  form.addEventListener('submit',event=>{event.preventDefault();if(valid(context)&&deals.some(d=>d.id===select.value))actionDialog(select.value,false);});select.focus();
 }
 function activityReport(){
  if(!state.ready||content.hidden)return;
  const clients=state.records.filter(r=>r.kind==='client'),context=modal('Отчёт по действиям и показам'),form=context.form;
  context.cancel.textContent='Закрыть';
  const from=field(form,'С даты · Бишкек','from','date'),to=field(form,'По дату · Бишкек','to','date');from.required=to.required=true;to.value=model.localDate(new Date().toISOString()).slice(0,10);from.value=to.value.slice(0,8)+'01';
  form.append(el('p','Результаты считаются по времени записи в журнал. Показы — по времени обновления записи и её текущему статусу. Назначение следующего действия не считается состоявшимся показом.','crm-action-hint'));
  const submit=el('button','Сформировать отчёт','crm-primary-button');submit.type='submit';form.append(submit);const output=el('div');form.append(output);let run=0;
  const presets=el('div',undefined,'crm-attention-actions');presets.setAttribute('role','group');presets.setAttribute('aria-label','Быстрый выбор периода');const presetButtons=[];
  function invalidatePeriod(){run++;submit.disabled=false;output.replaceChildren();context.status.textContent='Сформируйте отчёт для выбранного периода.';for(const item of presetButtons)item.setAttribute('aria-pressed','false');}
  for(const [kind,label] of [['today','Сегодня'],['week','Неделя'],['month','Месяц']]){const item=button(label,()=>{const period=window.LiberterraActivityReport.activityPeriodPreset(kind);from.value=period.from;to.value=period.to;invalidatePeriod();item.setAttribute('aria-pressed','true');});item.setAttribute('aria-pressed',kind==='month'?'true':'false');presetButtons.push(item);presets.append(item);}
  form.prepend(presets);presets.after(el('p','По времени Бишкека: сегодня; с понедельника по сегодня; с первого числа месяца по сегодня.','crm-action-hint'));
  for(const input of [from,to])input.addEventListener('input',invalidatePeriod);
  form.addEventListener('submit',async event=>{event.preventDefault();if(!valid(context)||submit.disabled)return;if(from.value>to.value){context.status.textContent='Проверьте диапазон дат.';return;}const ticket=++run,period={from:from.value,to:to.value},all=[],rows=[];submit.disabled=true;output.replaceChildren();
   try{const previousPeriod=window.LiberterraActivityReport.previousActivityPeriod(period),previousPages=[];
    for(const [index,range] of [period,previousPeriod].entries())for(const [clientIndex,client] of clients.entries()){if(!valid(context)||ticket!==run)return;if(!client.history_paging)throw Error('Обновите CRM: сервер ещё не подтвердил поддержку полной истории.');let cursor='',pages=[],cursors=new Set();do{context.status.textContent=(index?'Предыдущий':'Текущий')+' период: клиент '+(clientIndex+1)+' из '+clients.length;const response=await window.LiberterraAgentAccess.request('list_crm_workflow',{data:{history:{client_id:client.id,...range,cursor}}});if(!valid(context)||ticket!==run)return;const page=response?.history_page;if(!page||!Array.isArray(page.items)||typeof page.next_cursor!=='string')throw Error('Не удалось получить полную историю. Повторите запрос.');pages.push(page);cursor=page.next_cursor;if(cursor&&cursors.has(cursor))throw Error('Сервер повторил страницу. Отчёт не сформирован.');cursors.add(cursor);}while(cursor);if(index)previousPages.push(...pages);else{all.push(...pages);rows.push({client,counts:window.LiberterraActivityReport.report(pages)});}}
    const comparison={period:previousPeriod,total:window.LiberterraActivityReport.report(previousPages.length?previousPages:[{items:[],next_cursor:''}])};
    if(!valid(context)||ticket!==run)return;const total=window.LiberterraActivityReport.report(all.length?all:[{items:[],next_cursor:''}]);const labels={recorded_results:'Записано результатов',calls:'Звонки с результатом',selections:'Подборки с результатом',viewing_actions:'Действия по показам',other_actions:'Другие действия',completed_viewings:'Показы со статусом «Состоялся»',planned_viewings:'Запланированные показы',cancelled_viewings:'Отменённые показы'};output.append(el('h3',period.from+' — '+period.to));for(const [key,label]of Object.entries(labels))output.append(el('p',label+': '+total[key]));output.append(el('h3','По клиентам'));let count=0;for(const row of rows){if(!Object.values(row.counts).some(Boolean))continue;count++;const section=el('section');section.append(el('strong',row.client.name),el('p','Результатов: '+row.counts.recorded_results+' · Состоявшихся показов: '+row.counts.completed_viewings),button('История клиента',()=>history(row.client)));output.append(section);}if(!count)output.append(el('p','За этот период действий и показов нет. Выберите другой период.'));context.status.textContent='Отчёт сформирован по полной истории '+clients.length+' клиентов.';
    const comparisonView=el('section');comparisonView.append(el('h3','Сравнение с предыдущим периодом'),el('p',previousPeriod.from+' — '+previousPeriod.to+' · столько же календарных дней · Бишкек'),el('p','Текущий → предыдущий · изменение. Процент считается относительно предыдущего значения.','crm-action-hint'));
    for(const [key,label] of Object.entries(labels))comparisonView.append(el('p',label+': '+total[key]+' → '+comparison.total[key]+' · '+window.LiberterraActivityReport.activityChangeText(total[key],comparison.total[key])));
    output.prepend(comparisonView);context.status.textContent='Отчёт и сравнение сформированы по полной истории '+clients.length+' клиентов.';
    output.prepend(button('Скачать CSV для Excel',()=>{if(!valid(context)||ticket!==run)return;const csv=window.LiberterraActivityReport.activityReportCsv(period,total,rows.filter(row=>Object.values(row.counts).some(Boolean)),comparison);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Liberterra-report-'+period.from+'_'+period.to+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}));
    const unresolved=window.LiberterraActivityReport.clientsWithoutNextStep(all.length?all:[{items:[],next_cursor:''}],clients,state.records.filter(record=>record.kind==='deal'));
    const unresolvedView=el('section');unresolvedView.append(el('h3','Клиенты без следующего шага после контакта'),el('p','Активные сделки с результатом контакта в выбранном периоде и без действия или срока.'));
    if(!unresolved.length)unresolvedView.append(el('p','Таких клиентов за выбранный период нет.'));
    for(const {client,deal,contact} of unresolved){const row=el('div',undefined,'crm-history-entry');row.append(el('strong',client.name),el('p',deal.title+' · Последний контакт: '+model.localDate(contact.at).replace('T',' ')+' · Бишкек'));row.append(button('Назначить действие',()=>actionDialog(deal.id,false)));unresolvedView.append(row);}
    output.append(unresolvedView);
    const summary=el('div'),details=el('section');details.hidden=true;while(output.firstChild)summary.append(output.firstChild);output.append(summary,details);
    function showDetails(metric,label,trigger){
     if(!valid(context)||ticket!==run)return;
     const entries=window.LiberterraActivityReport.activityReportEntries(all.length?all:[{items:[],next_cursor:''}],metric);let shown=0,filtered=entries;
     summary.hidden=true;details.hidden=false;details.replaceChildren();const back=button('Вернуться к отчёту',()=>{details.hidden=true;summary.hidden=false;trigger.focus();});
     details.append(back,el('h3',label+' · '+period.from+' — '+period.to+' · Бишкек'));
     const search=field(details,'Поиск по записям','detail-search','search');search.maxLength=200;search.placeholder='Клиент, сделка, результат или следующий шаг';
     const clientFilter=field(details,'Клиент','detail-client','select');clientFilter.add(new Option('Все клиенты',''));
     const enriched=entries.map(item=>{const appointment=item.key.startsWith('appointment:')?state.records.find(record=>record.kind==='appointment'&&record.id===item.key.slice(12)):null;const clientId=item.client_id||appointment?.client_id||'';return {...item,client_id:clientId,client_name:clients.find(client=>String(client.id)===String(clientId))?.name||''};});filtered=enriched;
     const clientIds=new Set(enriched.map(item=>String(item.client_id||'')).filter(Boolean));for(const client of clients.filter(client=>clientIds.has(String(client.id))).sort((a,b)=>a.name.localeCompare(b.name,'ru')))clientFilter.add(new Option(client.name,client.id));
     const counter=el('p'),list=el('div',undefined,'crm-history-list'),more=button('Показать ещё записи',()=>{renderMore();addActionButtons();});details.append(counter,list,more);
     function updateFilters(){filtered=window.LiberterraActivityReport.filterActivityEntries(enriched,search.value,clientFilter.value);shown=0;list.replaceChildren();renderMore();addActionButtons();}
     search.addEventListener('input',updateFilters);clientFilter.addEventListener('change',updateFilters);
     function addActionButtons(){[...list.children].forEach((section,index)=>{if(section.querySelector('[data-crm-from-report]'))return;const item=filtered[index],deal=state.records.find(record=>record.kind==='deal'&&record.id===item?.deal_id);if(!deal||['won','lost'].includes(deal.stage))return;const next=button('Назначить следующий шаг',()=>actionDialog(deal.id,false));next.dataset.crmFromReport='true';section.append(next);});}
     function renderMore(){for(const item of filtered.slice(shown,shown+50)){const section=el('section',undefined,'crm-history-entry'),client=clients.find(client=>String(client.id)===String(item.client_id));section.append(el('h4',item.title||label));if(client){section.append(el('p',client.name));section.append(button('Открыть карточку клиента',()=>{const tab=root.querySelector('[data-crm-tab="clients"]'),clientSearch=root.querySelector('.crm-client-workflow .crm-workflow-search'),clientList=root.querySelector('.crm-client-workflow .crm-workflow-list');if(!tab||!clientSearch||!clientList){context.status.textContent='Раздел клиентов недоступен. Обновите CRM.';return;}close();tab.click();clientSearch.value=client.name;clientSearch.dispatchEvent(new Event('input',{bubbles:true}));const cards=[...clientList.querySelectorAll('.crm-workflow-card')].filter(card=>card.querySelector('h3')?.textContent===client.name&&(!client.phone||[...card.querySelectorAll('p')].some(p=>p.textContent===client.phone)));if(cards.length!==1){clientSearch.focus();banner.textContent='Найдено несколько клиентов с одинаковыми данными. Выберите нужную карточку в списке.';return;}cards[0].querySelector('.crm-workflow-actions button')?.click();}));}if(item.deal_title)section.append(el('p',item.deal_title));section.append(el('p',model.localDate(item.at).replace('T',' ')+' · Бишкек','crm-action-hint'));if(item.text)section.append(el('p',item.text,'crm-action-notes'));if(item.next_action)section.append(el('p','Следующий шаг: '+item.next_action+' · '+model.localDate(item.next_action_at).replace('T',' ')));if(item.starts_at)section.append(el('p','Показ: '+model.localDate(item.starts_at).replace('T',' ')+' · '+({planned:'Запланирован',completed:'Состоялся',cancelled:'Отменён'}[item.status]||item.status)));list.append(section);}shown=Math.min(shown+50,filtered.length);counter.textContent=filtered.length?'Показано '+shown+' из '+filtered.length:search.value.trim()||clientFilter.value?'По фильтрам записей нет.':'За выбранный период записей нет.';more.hidden=shown>=filtered.length;}
     renderMore();addActionButtons();back.focus();context.status.textContent='Детализация по данным сформированного отчёта.';
    }
    for(const [key,label] of Object.entries(labels)){const paragraph=[...summary.children].find(node=>node.tagName==='P'&&node.textContent===label+': '+total[key]);if(!paragraph)continue;const trigger=button((key==='calls'?'Звонки':label)+': '+total[key],()=>showDetails(key,label,trigger));paragraph.replaceWith(trigger);}
   }catch(error){if(valid(context)&&ticket===run){output.replaceChildren();context.status.textContent=error.message||'Не удалось сформировать полный отчёт.';}}finally{if(valid(context)&&ticket===run)submit.disabled=false;}
  });from.focus();
 }
 const reportButton=button('Отчёт по действиям и показам',activityReport);reportButton.disabled=true;root.querySelector('[data-crm-panel="overview"]').prepend(reportButton);window.addEventListener('liberterra:crm-data',event=>{reportButton.disabled=event.detail?.ready!==true;});window.addEventListener('liberterra:crm-loading',()=>{reportButton.disabled=true;});
 function historyAction(context,client,resume){
  const deals=state.records.filter(r=>r.kind==='deal'&&String(r.client_id)===String(client.id)&&!['won','lost'].includes(r.stage));
  if(!deals.length)return;
  const actions=el('div',undefined,'crm-history-controls');
  let selected=deals.find(deal=>String(deal.id)===String(resume?.dealId))?.id||deals[0].id;
  if(deals.length>1){const select=field(actions,'Сделка для следующего действия','history-deal','select');for(const deal of deals)select.add(new Option(deal.title||'Сделка без названия',deal.id));select.value=String(selected);select.addEventListener('change',()=>{selected=select.value;syncResult();});}
  const open=complete=>{const value=name=>context.form.querySelector(`[name="${name}"]`)?.value||'';const snapshot={dealId:selected,query:value('query'),type:value('type'),from:value('from'),to:value('to')};actionDialog(selected,complete,saved=>{const latest=state.records.find(record=>record.kind==='client'&&String(record.id)===String(client.id));if(latest)history(latest,{...snapshot,notice:saved?(complete?'Результат сохранён. История обновлена.':'Следующее действие сохранено. История обновлена.'):''});});};
  actions.append(button('Назначить действие',()=>open(false)));
  const result=button('Записать результат',()=>open(true));
  const syncResult=()=>{const deal=deals.find(item=>String(item.id)===String(selected));result.disabled=!deal?.next_action;result.title=result.disabled?'Сначала назначьте следующее действие.':'';};
  actions.append(result);syncResult();
  context.form.append(actions);
 }
 function pagedHistory(client,resume){
  const context=modal('История работы: '+client.name),form=context.form;
  context.cancel.textContent='Закрыть';
  historyAction(context,client,resume);
  if(resume?.notice){const notice=el('p',resume.notice);notice.setAttribute('role','status');form.append(notice);}
  const search=field(form,'Поиск по всей истории','query','search');search.maxLength=200;search.value=resume?.query||'';
  const type=field(form,'Тип записи','type','select');for(const [value,label] of Object.entries({all:'Все записи',call:'Звонки',selection:'Подборки',viewing:'Показы',note:'Заметки',other:'Другие действия'}))type.add(new Option(label,value));
  type.value=resume?.type||'all';const dates=el('div',undefined,'crm-history-dates');form.append(dates);const from=field(dates,'С даты · Бишкек','from','date'),to=field(dates,'По дату · Бишкек','to','date');from.value=resume?.from||'';to.value=resume?.to||'';
  form.append(el('p','Поиск включает старые результаты, заметки клиента и сделок, а также показы. Дата показа указана отдельно от времени обновления записи.','crm-action-hint'));
  const controls=el('div',undefined,'crm-history-controls'),apply=el('button','Найти','crm-primary-button');apply.type='submit';
  const reset=button('Сбросить фильтры',()=>{search.value='';type.value='all';from.value='';to.value='';invalidate();load(false);});controls.append(apply,reset);form.append(controls);
  const count=el('p'),list=el('div',undefined,'crm-history-list'),more=button('Загрузить более ранние',()=>load(true));more.hidden=true;form.append(count,list,more);
  let sequence=0,cursor='',loading=false,shown=0,seen=new Set(),filters=null;
  function invalidate(){sequence++;loading=false;cursor='';shown=0;seen=new Set();list.replaceChildren();count.textContent='';more.hidden=true;apply.disabled=false;context.status.textContent='Нажмите «Найти», чтобы применить фильтры.';}
  function render(item){const section=el('section',undefined,'crm-history-entry');section.append(el('h3',item.title));if(item.deal_title)section.append(el('p',item.deal_title,'crm-action-hint'));const date=model.localDate(item.at);section.append(el('p',(item.type==='note'||item.starts_at?'Обновлено: ':'')+(date?date.replace('T',' ')+' · Бишкек':'Дата не указана')+(item.author_id?' · Автор: '+item.author_id:''),'crm-action-hint'));if(item.text)section.append(el('p',item.text,'crm-action-notes'));if(item.next_action)section.append(el('p','Следующий шаг: '+item.next_action+' · '+model.localDate(item.next_action_at).replace('T',' ')));if(item.starts_at)section.append(el('p','Показ: '+model.localDate(item.starts_at).replace('T',' ')+' · '+({planned:'Запланирован',completed:'Состоялся',cancelled:'Отменён'}[item.status]||item.status)));list.append(section);}
  async function load(append){
   if(!valid(context)||loading)return;if(from.value&&to.value&&from.value>to.value){context.status.textContent='Дата начала должна быть не позже даты окончания.';return;}
   if(!append){cursor='';shown=0;seen=new Set();list.replaceChildren();filters={client_id:client.id,query:search.value.trim(),type:type.value,from:from.value,to:to.value};}
   const ticket=++sequence;loading=true;apply.disabled=true;more.disabled=true;context.status.textContent='Загружаем историю…';
   try{const response=await window.LiberterraAgentAccess.request('list_crm_workflow',{data:{history:{...filters,cursor:append?cursor:''}}});if(!valid(context)||ticket!==sequence)return;const page=response?.history_page;if(!page||!Array.isArray(page.items)||typeof page.next_cursor!=='string')throw Error('Сервер не подтвердил загрузку истории. Повторите попытку.');for(const item of page.items){if(seen.has(item.key))continue;seen.add(item.key);render(item);shown++;}cursor=page.next_cursor;count.textContent=shown?'Показано '+shown+' из '+page.total:'По этим фильтрам записей нет.';more.hidden=!cursor;context.status.textContent='';}
   catch(error){if(valid(context)&&ticket===sequence){context.status.textContent=error.code==='crm_client_not_found'?'Клиент недоступен. Обновите CRM.':error.code==='crm_invalid_date'?'Проверьте даты фильтра.':error.message||'Не удалось загрузить историю.';if(append)more.hidden=false;}}
   finally{if(valid(context)&&ticket===sequence){loading=false;apply.disabled=false;more.disabled=false;}}
  }
  for(const input of [search,type,from,to])input.addEventListener('input',invalidate);
  form.addEventListener('submit',event=>{event.preventDefault();load(false);});search.focus();load(false);
 }
 function history(client,resume){
  if(client.history_paging===true&&state.ready&&!content.hidden){pagedHistory(client,resume);return;}
  if(!state.ready||content.hidden)return;const context=modal('История работы: '+client.name);historyAction(context,client,resume);if(resume?.notice){const notice=el('p',resume.notice);notice.setAttribute('role','status');context.form.append(notice);}const deals=state.records.filter(r=>r.kind==='deal'&&r.client_id===client.id);
  if(!deals.length)context.form.append(el('p','Сделок пока нет. Создайте сделку в разделе «Сделки».'));
  for(const deal of deals){const item=el('section');item.append(el('h3',deal.title),el('p','Следующий шаг: '+(deal.next_action||'Не назначен')));if(deal.next_action_at)item.append(el('p','Срок по Бишкеку: '+model.localDate(deal.next_action_at).replace('T',' ')));if(deal.notes){item.append(el('h4','Заметки и прежние результаты'),el('p',deal.notes,'crm-action-notes'));}const results=deal.action_results||[];if(results.length)item.append(el('h4','Журнал результатов'));if(deal.action_results_total>results.length)item.append(el('p','Показаны последние '+results.length+' из '+deal.action_results_total+' результатов. Более ранние записи сохранены в журнале.'));for(const result of results){const entry=el('section',undefined,'crm-result-entry');entry.append(el('strong',result.action),el('p',result.result,'crm-action-notes'),el('p',model.localDate(result.at).replace('T',' ')+' · Бишкек · Автор: '+result.author_id),el('p','Следующий шаг: '+result.next_action+' · '+model.localDate(result.next_action_at).replace('T',' ')));item.append(entry);}if(!deal.notes&&!results.length)item.append(el('p','Результаты пока не записаны.'));context.form.append(item);}
  const appointments=state.records.filter(r=>r.kind==='appointment'&&r.client_id===client.id).sort((a,b)=>Date.parse(b.starts_at)-Date.parse(a.starts_at));
  if(appointments.length)context.form.append(el('h3','Показы клиента'));
  for(const appointment of appointments){const object=state.objects.find(o=>String(o.id)===String(appointment.object_id)),item=el('section');item.append(el('strong',object?.title||'Объект #'+appointment.object_id),el('p',model.localDate(appointment.starts_at).replace('T',' ')+' · '+({planned:'Запланирован',completed:'Состоялся',cancelled:'Отменён'}[appointment.status]||appointment.status)));if(appointment.notes)item.append(el('p',appointment.notes,'crm-action-notes'));context.form.append(item);}
  context.cancel.textContent='Закрыть';context.cancel.focus();
 }
 window.addEventListener('liberterra:quick-action',event=>actionDialog(event.detail?.id,event.detail?.complete===true));
 window.addEventListener('liberterra:match-client',event=>{const client=state.records.find(r=>r.kind==='client'&&r.id===event.detail?.id);if(client)matching(client);});
 window.addEventListener('liberterra:client-history',event=>{const client=state.records.find(r=>r.kind==='client'&&r.id===event.detail?.id);if(client)history(client);});
 window.addEventListener('liberterra:selection-viewing',event=>{const selection=state.records.find(r=>r.kind==='selection'&&r.id===event.detail?.id);if(selection)viewing(selection);});
 window.addEventListener('liberterra:viewing-followup',event=>{const appointment=state.records.find(r=>r.kind==='appointment'&&r.id===event.detail?.id);if(appointment)viewingFollowup(appointment);});
 window.addEventListener('liberterra:crm-loading',()=>{epoch++;state={ready:false,records:[],objects:[]};if(active?.recovering)active.epoch=epoch;else close();});
 window.addEventListener('liberterra:crm-data',event=>{epoch++;const recovering=active?.recovering&&event.detail?.ready!==true;if(recovering)active.epoch=epoch;else close();state={ready:event.detail?.ready===true,records:event.detail?.records||[],objects:event.detail?.objects||[]};});
 new MutationObserver(()=>{if(content.hidden){epoch++;state={ready:false,records:[],objects:[]};close();banner.textContent='';}}).observe(content,{attributes:true,attributeFilter:['hidden']});
})();

/* Admin-only first-response summary and contact-free request detail. */
(() => {
  'use strict';
  const root=document.querySelector('#agentCabinet');
  const overview=root?.querySelector('[data-crm-panel="overview"]');
  if(!overview)return;
  const element=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);return node;};
  const section=element('section');section.className='crm-workflow-card';section.setAttribute('aria-label','Первый ответ команды');section.hidden=true;
  const title=element('h3','Первый ответ команды · 1 час');
  const controls=element('div');controls.className='crm-workflow-actions';
  const label=element('label','Период '),period=element('select');period.setAttribute('aria-label','Период первого ответа');
  for(const [value,name] of [['7','7 дней'],['30','30 дней'],['0','Всё время']]){const option=element('option',name);option.value=value;period.append(option);}label.append(period);
  const refresh=element('button','Обновить сводку');refresh.type='button';refresh.className='crm-secondary-button crm-small-button';controls.append(label,refresh);
  const status=element('p','Загружаем командную сводку…');status.setAttribute('role','status');
  const content=element('div'),detail=element('section');detail.hidden=true;detail.setAttribute('aria-label','Обращения по показателю');
  section.append(title,controls,status,content,detail);overview.append(section);
  let active=false,loading=false,lastLoaded=0,detailVersion=0,loadVersion=0,activeDetail=null;
  const names={overdue:'Просрочено без ответа',unclaimed:'Незакреплено',claimed:'Принято',answered:'Ответ записан'};
  const date=value=>{const timestamp=Date.parse(value||'');return Number.isFinite(timestamp)?new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(timestamp):'Дата не указана';};
  function render(data){
    content.replaceChildren();detail.hidden=true;detail.replaceChildren();detailVersion++;
    const metrics=element('div');metrics.className='crm-workflow-actions';
    for(const kind of ['overdue','unclaimed','claimed','answered']){
      const button=element('button',`${names[kind]}: ${Number(data[kind])||0}`);button.type='button';button.className='crm-secondary-button crm-small-button';
      button.setAttribute('aria-label',`${names[kind]}: ${Number(data[kind])||0}. Показать обращения`);
      button.addEventListener('click',()=>loadDetail(kind,0));metrics.append(button);
    }
    content.append(metrics);
    if(data.period_days)content.append(element('p',`За выбранный период. Старше периода: ${Number(data.older_count)||0}.`));
    else content.append(element('p','За всё время публикации заявок. Старые обращения также включены.'));
    if(data.agents?.length){
      const scroll=element('div');scroll.className='crm-team-response-scroll';const table=element('table');table.className='crm-team-response-table';
      const head=element('thead'),header=element('tr');for(const name of ['Агент','Принято','Просрочено','Ответ записан']){const cell=element('th',name);cell.scope='col';header.append(cell);}head.append(header);table.append(head);
      const body=element('tbody');for(const agent of data.agents){const row=element('tr');for(const value of [agent.name,agent.claimed,agent.overdue,agent.answered])row.append(element('td',value));body.append(row);}table.append(body);scroll.append(table);content.append(scroll);
    }else content.append(element('p','Закреплённых заявок за выбранный период нет.'));
    content.append(element('p','Принятие заявки не считается ответом. Учитывается записанный результат звонка, подборки или показа.'));
    if(activeDetail)loadDetail(activeDetail.kind,activeDetail.offset);
  }
  async function loadDetail(kind,offset){
    if(!active)return;activeDetail={kind,offset};const version=++detailVersion;detail.hidden=false;detail.replaceChildren(element('h4',names[kind]),element('p','Загружаем обращения…'));
    try{
      const result=await window.LiberterraAgentAccess.request('get_team_first_response',{period_days:Number(period.value),detail_kind:kind,offset});
      if(!active||version!==detailVersion)return;
      const page=result.first_response?.detail;if(!page||page.kind!==kind)throw Error('detail_unavailable');
      detail.replaceChildren(element('h4',`${names[kind]} · ${page.total}`));
      if(!page.items.length){detail.append(element('p','Обращений нет.'));return;}
      const scroll=element('div');scroll.className='crm-team-response-scroll';const table=element('table');table.className='crm-team-response-table';
      const head=element('thead'),header=element('tr');for(const name of ['Поступила','Заявка','Направление','Статус','Агент']){const cell=element('th',name);cell.scope='col';header.append(cell);}head.append(header);table.append(head);
      const body=element('tbody');for(const item of page.items){const row=element('tr');for(const value of [date(item.created_at),item.title||`Заявка #${item.id}`,item.direction==='sale'?'Покупка':item.direction==='rent'?'Аренда':'Не уточнено',item.claim_status==='claimed'?'Принята':'Не закреплена',item.agent_name||'—'])row.append(element('td',value));body.append(row);}table.append(body);scroll.append(table);detail.append(scroll);
      const nav=element('div');nav.className='crm-workflow-actions';
      if(offset>0){const previous=element('button','Назад');previous.type='button';previous.className='crm-secondary-button crm-small-button';previous.addEventListener('click',()=>loadDetail(kind,Math.max(0,offset-40)));nav.append(previous);}
      if(offset+page.items.length<page.total){const next=element('button','Следующие');next.type='button';next.className='crm-secondary-button crm-small-button';next.addEventListener('click',()=>loadDetail(kind,offset+40));nav.append(next);}detail.append(nav);
      detail.append(element('p',`Показано ${offset+1}–${offset+page.items.length} из ${page.total}. Контакты клиентов здесь не выводятся.`));
    }catch(_){if(active&&version===detailVersion)detail.replaceChildren(element('h4',names[kind]),element('p','Не удалось загрузить обращения. Повторите выбор показателя.'));}
  }
  async function load(){
    if(!active||loading)return;const version=++loadVersion;loading=true;period.disabled=true;refresh.disabled=true;refresh.textContent='Обновляем…';status.textContent='Обновляем сводку…';detailVersion++;
    try{const result=await window.LiberterraAgentAccess.request('get_team_first_response',{period_days:Number(period.value)});if(!active||version!==loadVersion)return;render(result.first_response);lastLoaded=Date.now();status.textContent='Сводка обновлена.';}
    catch(_){if(active&&version===loadVersion)status.textContent='Не удалось загрузить командную сводку. Повторите обновление.';}
    finally{if(version===loadVersion){loading=false;period.disabled=false;refresh.disabled=false;refresh.textContent='Обновить сводку';}}
  }
  period.addEventListener('change',()=>{activeDetail=null;load();});refresh.addEventListener('click',load);
  window.addEventListener('liberterra:crm-data',event=>{active=event.detail?.ready===true&&event.detail?.canManageResources===true;section.hidden=!active;if(active&&Date.now()-lastLoaded>60000)load();});
  window.addEventListener('liberterra:crm-loading',()=>{active=false;section.hidden=true;content.replaceChildren();detail.replaceChildren();detailVersion++;loadVersion++;loading=false;period.disabled=false;refresh.disabled=false;refresh.textContent='Обновить сводку';lastLoaded=0;status.textContent='Ожидаем данные CRM…';});
})();
