/* Protected workspace. Unconnected contract/request previews remain local drafts. */
(() => {
  'use strict';
  const root=document.getElementById('agentCabinet');
  const content=root?.querySelector('[data-crm-content]');
  if(!content) return;
  const nav=root.querySelector('.crm-tabs'), model=window.LiberterraCrmDraftModel;
  const definitions=[['overview','Обзор'],['owners','Собственники'],['tasks','Задачи'],['selections','Подборки'],['calls','Звонки'],['analytics','Аналитика'],['calendar','Показы'],['contracts','Договоры'],['requests','Заявки'],['messages','Сообщения']];
  const panels={};
  for(const [key,label] of definitions){
    const tab=document.createElement('button');tab.type='button';tab.className='crm-tab';tab.id=`workspace-${key}-tab`;
    tab.dataset.crmTab=key;tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;tab.setAttribute('aria-controls',`workspace-${key}`);tab.textContent=label;nav.append(tab);
    const panel=document.createElement('section');panel.className='crm-panel';panel.id=`workspace-${key}`;panel.dataset.crmPanel=key;panel.hidden=true;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
    const heading=document.createElement('h2');heading.textContent=label;panel.append(heading);content.append(panel);panels[key]=panel;
  }
  // Preserve the existing objects/clients/notes/access tabs and their handlers.
  const order=['overview','requests','owners','objects','clients','selections','calendar','tasks','messages','notes','private-access','calls','analytics','contracts'];
  order.forEach(key=>{const tab=nav.querySelector(`[data-crm-tab="${key}"]`);if(tab)nav.append(tab);});
  nav.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...nav.querySelectorAll('[role="tab"]')].filter(tab=>!tab.hidden),index=tabs.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();
  });
  function paragraph(panel,text){const p=document.createElement('p');p.textContent=text;panel.append(p);return p;}
  const summary=paragraph(panels.overview,'Сводка появится после успешной загрузки существующего кабинета.');
  const analysis=paragraph(panels.analytics,'Финансовая аналитика не подключена. Выручка и конверсия не вычисляются из числа объявлений.');
  const tasksForm=document.createElement('form');tasksForm.className='crm-local-form';
  tasksForm.innerHTML='<label>Задача<input name="title" maxlength="180" required placeholder="Например: позвонить клиенту"></label><label>Объект<select name="object_id"><option value="">Без объекта</option></select></label><label>Срок<input name="due_at" type="datetime-local"></label><button class="crm-primary-button" type="submit">Добавить задачу</button><p class="crm-local-result" role="status"></p>';
  panels.tasks.append(tasksForm);
  const clientLabel=document.createElement('label');clientLabel.textContent='Клиент';
  const taskClient=document.createElement('select');taskClient.name='client_id';taskClient.add(new Option('Без клиента',''));clientLabel.append(taskClient);tasksForm.insertBefore(clientLabel,tasksForm.querySelector('button'));
  let clientNames=new Map();
  window.addEventListener('liberterra:crm-data',event=>{
    const current=taskClient.value;clientNames=new Map(event.detail.clients.map(client=>[client.id,client.name]));
    taskClient.replaceChildren(new Option('Без клиента',''));event.detail.clients.forEach(client=>taskClient.add(new Option(client.name,client.id)));taskClient.value=current;
    const objectSelect=tasksForm.elements.object_id,selected=objectSelect.value;objectSelect.replaceChildren(new Option('Без объекта',''));
    event.detail.objects.forEach(object=>objectSelect.add(new Option(`${object.title||object.district||'Объект'} · #${object.id}`,object.id)));objectSelect.value=selected;
    renderTasks();
  });
  window.addEventListener('liberterra:crm-task',event=>{taskClient.value=event.detail.client_id||'';tasksForm.elements.object_id.value=event.detail.object_id||'';tasksForm.elements.title.value=event.detail.title||'';taskRequestId='';nav.querySelector('[data-crm-tab="tasks"]').click();tasksForm.elements.title.focus();});
  const tasksList=document.createElement('div');tasksList.className='crm-task-list';panels.tasks.append(tasksList);
  let tasks=[],taskRequestId='',tasksLoad=0;
  const taskText=value=>String(value??'');
  function renderTasks(){
    tasksList.replaceChildren();
    if(!tasks.length){paragraph(tasksList,'Задач пока нет. Добавьте первую задачу выше.');return;}
    tasks.sort((a,b)=>(a.status==='done')-(b.status==='done')||taskText(a.due_at||'9999').localeCompare(taskText(b.due_at||'9999')));
    for(const task of tasks){
      const item=document.createElement('article');item.className='crm-task-item';
      const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=task.title;copy.append(title);
      const detail=document.createElement('p');detail.textContent=[clientNames.get(task.client_id)||'',task.object_id?`Объект ${task.object_id}`:'',task.due_at?new Date(task.due_at).toLocaleString('ru-RU'):'Без срока',task.status==='done'?'Выполнено':'В работе'].filter(Boolean).join(' · ');copy.append(detail);item.append(copy);
      const button=document.createElement('button');button.type='button';button.className='crm-secondary-button crm-small-button';button.textContent=task.status==='done'?'Вернуть в работу':'Выполнено';
      button.addEventListener('click',async()=>{button.disabled=true;try{await window.LiberterraAgentAccess.request('save_agent_task',{task_id:task.task_id,status:task.status==='done'?'open':'done'});await loadTasks();}catch(error){button.disabled=false;tasksForm.querySelector('[role="status"]').textContent=error.message||'Не удалось обновить задачу.';}});item.append(button);tasksList.append(item);
    }
  }
  async function loadTasks(){
    const current=++tasksLoad;tasksList.textContent='Загружаем задачи…';
    try{const result=await window.LiberterraAgentAccess.request('list_agent_tasks');if(current!==tasksLoad||content.hidden)return;tasks=Array.isArray(result.tasks)?result.tasks:[];renderTasks();}
    catch(error){if(current!==tasksLoad||content.hidden)return;tasksList.textContent=`Не удалось загрузить задачи: ${error.message||'ошибка сервиса'}`;}
  }
  tasksForm.addEventListener('input',()=>{taskRequestId='';});
  tasksForm.addEventListener('submit',async event=>{
    event.preventDefault();if(content.hidden)return;
    const output=tasksForm.querySelector('[role="status"]'),button=tasksForm.querySelector('[type="submit"]');
    const data=Object.fromEntries(new FormData(tasksForm));
    if(!taskRequestId){
      const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
      const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
      taskRequestId=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }
    const due=data.due_at?new Date(data.due_at):null;
    if(due&&Number.isNaN(due.getTime())){output.textContent='Укажите корректный срок.';return;}
    button.disabled=true;output.textContent='Сохраняем задачу…';
    try{await window.LiberterraAgentAccess.request('save_agent_task',{task_id:taskRequestId,title:data.title,object_id:data.object_id,client_id:data.client_id,due_at:due?due.toISOString():''});taskRequestId='';tasksForm.reset();output.textContent='Задача сохранена.';await loadTasks();}
    catch(error){output.textContent=`Не удалось сохранить задачу: ${error.message||'ошибка сервиса'}. Проверьте список перед повтором.`;}
    finally{button.disabled=false;}
  });
  paragraph(panels.calls,'Журнал звонков не подключён. Звонки не совершаются и записи не создаются.');
  const link=(panel,label,href)=>{const a=document.createElement('a');a.className='crm-secondary-button';a.href=href;a.textContent=label;panel.append(a);};
  link(panels.messages,'Открыть сообщения','/messages.html');
  paragraph(panels.messages,'Используется существующая страница сообщений с её авторизацией.');
  paragraph(panels.contracts,'Совместная сделка: только проверка локального черновика. Агенты, объект и полномочия ещё не проверены сервером. Согласования не запрашиваются; документ не подписан.');
  function form(panel,fields,validate,label){
    const f=document.createElement('form');f.className='crm-local-form';
    for(const [name,title,type,values] of fields){
      const l=document.createElement('label');l.textContent=title;
      const input=document.createElement(type==='textarea'?'textarea':type==='select'?'select':'input');input.name=name;input.required=true;
      if(type==='select')for(const [value,text] of values){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);}
      else if(type!=='textarea'){input.type=type;if(type==='number'){input.min='0';input.step='any';}}
      l.append(input);f.append(l);
    }
    const button=document.createElement('button');button.type='submit';button.className='crm-primary-button';button.textContent=label;f.append(button);
    const output=document.createElement('p');output.setAttribute('role','status');output.className='crm-local-result';f.append(output);
    f.addEventListener('submit',event=>{event.preventDefault();if(content.hidden)return;try{output.textContent=validate(Object.fromEntries(new FormData(f)));}catch(error){output.textContent=error.message;}});
    panel.append(f);return f;
  }
  const session=model.createDraftSession();
  const dealFields=[['objectId','ID объекта','text'],['firstAgent','ID первого агента','text'],['secondAgent','ID второго агента','text'],['firstRole','Роль первого агента','text'],['secondRole','Роль второго агента','text'],['firstShare','Доля первого, %','number'],['secondShare','Доля второго, % (допустимо 0)','number'],['commission','Общая комиссия','number'],['commissionUnit','Единица комиссии','select',[['percent','%'],['usd','USD']]],['terms','Условия сотрудничества','textarea']];
  const open=document.createElement('button');open.type='button';open.className='crm-primary-button';open.textContent='Проверить условия совместной сделки';panels.contracts.append(open);
  const dialog=document.createElement('dialog');dialog.className='crm-dialog';dialog.setAttribute('aria-label','Черновик совместной сделки');
  const title=document.createElement('h2');title.textContent='Черновик совместной сделки';dialog.append(title);
  paragraph(dialog,'Только в памяти вкладки. Не договор, не подпись, не подтверждение согласия другого агента.');
  form(dialog,dealFields,input=>{const deal=model.validateDeal(input);return `Доли ${deal.firstShare}% + ${deal.secondShare}% = 100%. Комиссия: ${deal.commission} ${deal.commissionUnit==='usd'?'USD':'%'}. Согласие первого: не запрошено. Согласие второго: не запрошено. Документ: не прикреплён, не подписан. На сервер не отправлено.`;},'Проверить условия');
  const close=document.createElement('button');close.type='button';close.textContent='Закрыть';close.className='crm-secondary-button';close.onclick=()=>dialog.close();dialog.append(close);content.append(dialog);
  open.onclick=()=>{if(!content.hidden)dialog.showModal();};
  // Only the existing authenticated dashboard loader invokes this hook.
  window.LiberterraCrmWorkspace={update({objects,clients,counters}){
    summary.textContent=`В загруженном кабинете: объектов ${objects.length}, закреплений клиентов ${clients.length}. Активно: ${Number(counters.active)||0}; на модерации: ${Number(counters.moderation)||0}; снято: ${Number(counters.removed)||0}.`;
    analysis.textContent=`Источник: существующий кабинет. Объектов: ${objects.length}; закреплений: ${clients.length}. Данные о доходах, звонках и конверсии отсутствуют.`;
    const select=tasksForm.elements.object_id;select.replaceChildren(new Option('Без объекта',''));
    objects.forEach(item=>select.add(new Option(item.title||item.district||`Объект ${item.id}`,item.id)));
    queueMicrotask(loadTasks);
  }};
  new MutationObserver(()=>{if(content.hidden){tasksLoad++;tasks=[];tasksList.replaceChildren();taskRequestId='';dialog.close();session.clear();content.querySelectorAll('.crm-local-form').forEach(f=>{f.reset();f.querySelector('[role="status"]').textContent='';});}}).observe(content,{attributes:true,attributeFilter:['hidden']});
})();
