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
  const state = {records:[],objects:[],requests:[],specialization:'',ready:false,epoch:0};
  const elements = [];
  const node = (tag, text, className) => { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(className) el.className=className; return el; };
  const button = (text, action) => { const el=node('button',text,'crm-secondary-button crm-small-button');el.type='button';el.addEventListener('click',action);return el; };
  const uuid = () => { const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
  const records = kind => state.records.filter(record=>record.kind===kind);
  const clientName = id => records('client').find(client=>client.id===id)?.name || 'Клиент';
  const objectName = id => { const object=state.objects.find(item=>String(item.id)===String(id));return object?`${object.title||object.district||'Объект'} · #${id}`:`Объект #${id}`; };
  const errorText = error => ({crm_request_unavailable:'Заявка больше недоступна. Обновите список.',crm_version_conflict:'Запись изменена в другой вкладке. Обновите CRM и повторите изменение.',crm_invalid_budget:'Проверьте бюджет: верхняя граница должна быть не меньше нижней.',crm_invalid_phone:'Проверьте номер телефона.',crm_invalid_fields:'Заполните обязательные поля и проверьте длину текста.',crm_object_unavailable:'Один из объектов больше недоступен. Обновите CRM и измените подборку.',crm_client_not_found:'Клиент недоступен. Обновите CRM.',crm_busy:'Сервис занят. Повторите сохранение.',crm_showing_too_early:'Нельзя завершить показ раньше назначенного времени.',crm_limit_reached:'Достигнут лимит записей CRM.'}[error.code] || error.message || 'Не удалось выполнить действие.');
  const globalStatus=node('p','Загружаем клиентов и подборки…','crm-workflow-status');globalStatus.setAttribute('role','status');
  const toolbar=node('div',undefined,'crm-workflow-toolbar');toolbar.append(globalStatus,button('Обновить CRM',()=>load()));content.querySelector('.crm-counters').after(toolbar);
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
  const clientArea=node('section',undefined,'crm-client-workflow');panels.clients.prepend(clientArea);
  clientArea.append(node('h2','Клиенты'),node('p','Покупатели и арендаторы: требования, контакты и стадии работы.'));
  const clientForm=makeForm(clientArea,[['name','Имя клиента','text'],['phone','Телефон','tel'],['role','Роль','select',roles],['stage','Этап работы','select',stages],['city','Город','text'],['district','Район / ЖК','text'],['property_type','Тип недвижимости','text'],['rooms','Комнаты','text'],['budget_min','Бюджет от','number'],['budget_max','Бюджет до','number'],['currency','Валюта','select',{USD:'USD',KGS:'KGS'}],['notes','Требования и заметки','textarea']],'Сохранить клиента',async(data,form)=>{await save('client',data,form);});
  clientForm.elements.namedItem('name').required=true;clientForm.elements.namedItem('name').maxLength=120;clientForm.elements.phone.maxLength=40;
  clientArea.append(button('Новый клиент',()=>{resetForm(clientForm);clientForm.elements.namedItem('name').focus();}));
  const clientList=node('div',undefined,'crm-workflow-list');clientArea.append(clientList);
  const clientSearch=node('input');clientSearch.type='search';clientSearch.placeholder='Найти клиента';clientSearch.setAttribute('aria-label','Поиск клиента');clientSearch.className='crm-workflow-search';clientList.before(clientSearch);clientSearch.addEventListener('input',renderClients);
  clientForm.elements.role.querySelector('option[value="owner"]').remove();
  root.querySelector('[data-crm-tab="clients"]').textContent='Клиенты';
  const ownerArea=node('section',undefined,'crm-owner-workflow');panels.owners.append(ownerArea);
  ownerArea.append(node('p','Контакты собственников и стадии работы. Объект можно разместить после уточнения данных.'));
  const ownerForm=clientForm.cloneNode(true);ownerForm.className='crm-local-form crm-workflow-form';ownerForm.querySelector('[name="role"]').replaceChildren(new Option('Собственник','owner'));ownerForm.querySelector('[type="submit"]').textContent='Сохранить собственника';ownerArea.append(ownerForm);elements.push(ownerForm);
  ownerForm.elements.namedItem('name').parentElement.firstChild.textContent='Имя собственника';
  ownerForm.addEventListener('input',()=>{ownerForm._pending=null;});
  ownerForm.addEventListener('submit',async event=>{event.preventDefault();const submit=ownerForm.querySelector('[type="submit"]'),status=ownerForm.querySelector('[role="status"]');submit.disabled=true;try{await save('client',{...Object.fromEntries(new FormData(ownerForm)),role:'owner'},ownerForm);status.textContent='Сохранено.';}catch(error){status.textContent=errorText(error);}finally{submit.disabled=!state.ready;}});
  ownerArea.append(button('Новый собственник',()=>{resetForm(ownerForm);ownerForm.elements.namedItem('name').focus();}));
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
  panels.calendar.append(button('Новый показ',()=>resetForm(appointmentForm)));
  const appointmentList=node('div',undefined,'crm-workflow-list');panels.calendar.append(appointmentList);
  const requestIntro=node('p');panels.requests.append(requestIntro);
  const requestSearch=node('input');requestSearch.type='search';requestSearch.placeholder='Поиск по заявкам';requestSearch.setAttribute('aria-label','Поиск по заявкам');requestSearch.className='crm-workflow-search';
  const requestScope=node('select');requestScope.setAttribute('aria-label','Обработка заявки');for(const [key,label]of [['all','Все заявки'],['new','Новые для меня'],['taken','В моей работе']])requestScope.add(new Option(label,key));
  const requestList=node('div',undefined,'crm-workflow-list');panels.requests.append(requestSearch,requestScope,button('Обновить заявки',()=>load()),requestList);requestSearch.addEventListener('input',renderRequests);requestScope.addEventListener('change',renderRequests);

  function setOptions(select,items,label){const value=select.value;select.replaceChildren(new Option('Выберите…',''));items.forEach(item=>select.add(new Option(label(item),item.id)));select.value=value;}
  function render(){
    const clients=records('client').filter(client=>client.role!=='owner');
    [selectionForm.elements.client_id,appointmentForm.elements.client_id].forEach(select=>setOptions(select,clients,item=>item.name));
    setOptions(appointmentForm.elements.object_id,state.objects,item=>objectName(item.id));
    renderClients();renderPicker();renderSelections();renderAppointments();renderObjectStages();renderRequests();
    overview.textContent=`Клиентов: ${clients.length} · Подборок: ${records('selection').length} · Запланировано показов: ${records('appointment').filter(item=>item.status==='planned').length}`;
    window.dispatchEvent(new CustomEvent('liberterra:crm-data',{detail:{clients,objects:state.objects}}));
  }
  function renderClients(){
    clientList.replaceChildren();ownerList.replaceChildren();if(!records('client').some(client=>client.role==='owner'))ownerList.append(node('p','Собственников пока нет. Добавьте контакт или перенесите его из заявок.'));const query=clientSearch.value.trim().toLocaleLowerCase('ru');
    const clients=records('client').filter(client=>client.role==='owner'||`${client.name} ${client.phone}`.toLocaleLowerCase('ru').includes(query));
    if(!clients.length)clientList.append(node('p',query?'Клиенты не найдены.':'Добавьте первого клиента.'));
    clients.forEach(client=>{
      const card=node('article',undefined,'crm-workflow-card');card.append(node('h3',client.name),node('p',`${roles[client.role]} · ${stages[client.stage]||'Завершение (без сделки)'}`),stageControl('client',client,client.name));
      if(client.phone)card.append(node('p',client.phone));
      card.append(node('p',[client.city,client.district,client.property_type,client.rooms&&`${client.rooms} комн.`,(client.budget_min!==''||client.budget_max!=='')?`${client.budget_min!==''?client.budget_min:'—'} – ${client.budget_max!==''?client.budget_max:'—'} ${client.currency}`:'Бюджет не указан'].filter(Boolean).join(' · ')));
      if(client.source_request_id)card.append(node('p',`Из заявки #${client.source_request_id}`));
      const actions=node('div',undefined,'crm-workflow-actions');actions.append(button('Открыть',()=>{const form=client.role==='owner'?ownerForm:clientForm;edit(form,client);form.scrollIntoView({block:'start'});}));
      if(client.role!=='owner')actions.append(button('Подборка',()=>{resetForm(selectionForm);selectionForm.elements.client_id.value=client.id;selectionForm.elements.title.value=`Подборка для ${client.name}`.slice(0,120);selectedObjects.clear();renderPicker();tab('selections');}),button('Показ',()=>{resetForm(appointmentForm);appointmentForm.elements.client_id.value=client.id;tab('calendar');}));
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
      const actions=node('div',undefined,'crm-workflow-actions');actions.append(button('Изменить',()=>editSelection(selection)));
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
      actions.append(button('Изменить / результат',()=>{edit(appointmentForm,item);appointmentForm.elements.local_time.value=new Date(Date.parse(item.starts_at)+21600000).toISOString().slice(0,16);appointmentForm.scrollIntoView({block:'start'});}),button('Следующая задача',()=>window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{client_id:item.client_id,object_id:item.object_id,title:'Уточнить решение после показа'}}))));card.append(actions);appointmentList.append(card);
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
  function renderRequests(){
    requestList.replaceChildren();const query=requestSearch.value.trim().toLocaleLowerCase('ru');
    requestIntro.textContent=state.ready?'Общий поток: '+(state.specialization==='sale'?'покупка':'аренда')+'. Все опубликованные заявки этого направления. Контакты в вашей работе видны только вам.':'Заявки загрузятся после входа в CRM.';
    const list=state.requests.filter(item=>{
      const taken=records('client').some(client=>client.source_request_id===item.id);
      return (requestScope.value==='all'||(requestScope.value==='taken'?taken:!taken))&&[item.title,item.district,item.contact_name,item.id].join(' ').toLocaleLowerCase('ru').includes(query);
    });
    if(!list.length)requestList.append(node('p',state.ready?'По выбранным условиям заявок нет.':'Заявки ещё не загружены.'));
    list.forEach(item=>{
      const card=node('article',undefined,'crm-workflow-card');card.append(node('h3',item.title||'Заявка #'+item.id),node('p',[item.city,item.district,item.price].filter(Boolean).join(' · ')));
      if(!item.direction)card.append(node('p','Уточнить направление: в исходной заявке не указано «купить» или «снять».'));
      if(item.description)card.append(node('p',item.description));if(item.contact_name||item.phone)card.append(node('p',[item.contact_name,item.phone].filter(Boolean).join(' · ')));
      const existing=records('client').find(client=>client.source_request_id===item.id);
      if(existing){card.append(node('p','В моей работе · '+roles[existing.role]+' · '+(stages[existing.stage]||'Завершение')),button('Открыть контакт',()=>{const owner=existing.role==='owner';tab(owner?'owners':'clients');const form=owner?ownerForm:clientForm;edit(form,existing);form.scrollIntoView({block:'start'});}));}
      else {const actions=node('div',undefined,'crm-workflow-actions');for(const [role,label]of [[item.direction==='sale'?'buyer':item.direction==='rent'?'tenant':state.specialization==='sale'?'buyer':'tenant','В клиенты'],['owner','В собственники']]){
        const transfer=button(label,async()=>{actions.querySelectorAll('button').forEach(el=>el.disabled=true);try{
          const data={name:(item.contact_name||'Контакт по заявке #'+item.id).slice(0,120),phone:item.phone||'',role,stage:'new',city:item.city||'',district:item.district||'',property_type:'',rooms:item.rooms||'',budget_min:'',budget_max:'',currency:/сом|KGS/i.test(item.price)?'KGS':'USD',notes:('Заявка #'+item.id+' · '+item.title+'\nБюджет: '+item.price+'\n'+(item.description||'')).slice(0,2000),source_request_id:item.id};
          const saved=await save('client',data,transfer);if(!saved)return;const form=saved.role==='owner'?ownerForm:clientForm;tab(saved.role==='owner'?'owners':'clients');edit(form,saved);form.scrollIntoView({block:'start'});globalStatus.textContent='Контакт добавлен в вашу работу. Исходная заявка сохранена.';
        }catch(error){globalStatus.textContent=errorText(error);actions.querySelectorAll('button').forEach(el=>el.disabled=false);}});actions.append(transfer);
      }card.append(actions);}requestList.append(card);
    });
  }
  async function load(){
    const epoch=++state.epoch;state.ready=false;globalStatus.textContent='Загружаем CRM…';elements.forEach(form=>form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true));
    try{const result=await window.LiberterraAgentAccess.request('list_crm_workflow');if(epoch!==state.epoch||content.hidden)return;state.records=result.records||[];state.objects=result.objects||[];state.requests=result.requests||[];state.specialization=result.specialization||'';state.ready=true;render();globalStatus.textContent='CRM обновлена. Данные сохраняются в вашем кабинете.';}
    catch(error){if(epoch===state.epoch){state.records=[];state.objects=[];state.requests=[];render();globalStatus.textContent=`CRM недоступна: ${errorText(error)} Нажмите «Обновить CRM».`;}}
    finally{if(epoch===state.epoch)elements.forEach(form=>form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=!state.ready));}
  }
  new MutationObserver(()=>{if(content.hidden){state.epoch++;state.ready=false;state.records=[];state.objects=[];state.requests=[];elements.forEach(resetForm);selectedObjects.clear();render();}}).observe(content,{attributes:true,attributeFilter:['hidden']});
  window.LiberterraCrmWorkflow={update(){queueMicrotask(load);}};
  // Refresh shared intake only while it is being viewed; do not poll hidden tabs.
  setInterval(()=>{if(state.ready&&!document.hidden&&!content.hidden&&!panels.requests.hidden)load();},60000);
  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-crm-workflow-action]');if(!action)return;
    if(!state.ready){globalStatus.textContent='Дождитесь загрузки CRM или нажмите «Обновить CRM».';return;}
    if(action.dataset.crmWorkflowAction==='selection'){selectedObjects.add(action.dataset.objectId);renderPicker();tab('selections');}
    if(action.dataset.crmWorkflowAction==='task')window.dispatchEvent(new CustomEvent('liberterra:crm-task',{detail:{object_id:action.dataset.objectId,title:'Связаться по объекту'}}));
  });
})();
