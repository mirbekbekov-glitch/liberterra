/* Deals are independent records. Server metadata determines allowed transitions. */
(() => {
 'use strict';
 const root=document.querySelector('#agentCabinet'),content=root?.querySelector('[data-crm-content]');if(!content)return;
 const nav=root.querySelector('.crm-tabs'),overview=root.querySelector('[data-crm-panel="overview"]');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls='crm-secondary-button')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
 const uuid=()=>crypto.randomUUID();
 const money=(value,currency)=>value===''||value===undefined?'Не указана':new Intl.NumberFormat('ru-RU',{style:'currency',currency,maximumFractionDigits:2}).format(value);
 const date=value=>value?new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Bishkek',dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Не указана';
 const errors={crm_invalid_transition:'Этот переход недоступен. Обновите CRM.',crm_loss_reason_required:'Укажите причину потери сделки.',crm_close_details_required:'Для закрытия выберите объект и укажите сумму сделки.',crm_version_conflict:'Сделка изменена в другой вкладке. Обновите CRM и откройте карточку заново.',crm_invalid_money:'Сумма должна быть положительной или нулевой, с точностью до двух знаков.',crm_client_not_found:'Клиент недоступен. Обновите CRM.',crm_object_unavailable:'Объект недоступен. Выберите доступный объект.',crm_history_limit:'Достигнут предел истории записи. Обратитесь к администратору.',crm_busy:'Сервис занят. Повторите сохранение.'};
 let state={records:[],objects:[],stages:[],ready:false},tasks=null,epoch=0,editing=null,pendingId='',newId='',busy=new Set(),dragging='';
 const records=kind=>state.records.filter(r=>r.kind===kind);
 const stageInfo=id=>state.stages.find(s=>s.id===id);
 const stageLabel=id=>stageInfo(id)?.label||id;
 const clientName=id=>records('client').find(c=>c.id===id)?.name||'Клиент недоступен';
 const objectName=id=>state.objects.find(o=>String(o.id)===String(id))?.title||`Объект #${id}`;
 const tab=el('button','Сделки','crm-tab');tab.type='button';tab.dataset.crmTab='deals';tab.id='crm-deals-tab';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.setAttribute('aria-controls','crm-deals-panel');tab.tabIndex=-1;
 nav.querySelector('[data-crm-tab="clients"]').after(tab);
 const panel=el('section',undefined,'crm-panel crm-deals');panel.dataset.crmPanel='deals';panel.id='crm-deals-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;content.append(panel);
 const head=el('div',undefined,'crm-deal-heading'),headCopy=el('div');headCopy.append(el('p','CRM · СДЕЛКИ','crm-eyebrow'),el('h2','Воронка сделок'),el('p','Откройте карточку или перенесите сделку на доступный этап.','crm-deal-muted'));
 const create=button('Новая сделка',()=>openForm(null),'crm-primary-button');create.disabled=true;head.append(headCopy,create);panel.append(head);
 const status=el('p','Загружаем сделки…','crm-workflow-status');status.setAttribute('role','status');panel.append(status);
 const tools=el('div',undefined,'crm-deal-tools'),search=el('input');search.type='search';search.placeholder='Название или клиент';search.setAttribute('aria-label','Поиск сделки');
 const mobileStage=el('select');mobileStage.setAttribute('aria-label','Этап воронки');
 tools.append(search,mobileStage,button('Обновить',()=>window.LiberterraCrmWorkflow.reload()));panel.append(tools);
 const board=el('div',undefined,'crm-deal-board');board.setAttribute('aria-label','Сделки по этапам');panel.append(board);
 search.addEventListener('input',renderBoard);mobileStage.addEventListener('change',renderBoard);
 const day=el('section',undefined,'crm-day');overview.prepend(day);
 const dayHead=el('div',undefined,'crm-deal-heading');dayHead.append(el('h2','Рабочий день'),button('К сделкам',()=>tab.click()));day.append(dayHead);
 const metrics=el('div',undefined,'crm-day-metrics'),attention=el('div',undefined,'crm-day-attention');day.append(metrics,attention);
 const dialog=el('dialog',undefined,'crm-deal-dialog');dialog.setAttribute('aria-labelledby','crm-deal-title');
 const dialogHead=el('div',undefined,'crm-deal-heading'),dialogTitle=el('h2','Новая сделка');dialogTitle.id='crm-deal-title';dialogHead.append(dialogTitle,button('Закрыть',()=>dialog.close()));dialog.append(dialogHead);
 const form=el('form',undefined,'crm-deal-form'),inputs={};
 for(const [name,label,type,max]of [['title','Название сделки','text',160],['client_id','Клиент','select'],['object_id','Объект','select'],['stage','Этап','select'],['amount','Сумма сделки','number'],['currency','Валюта','select'],['planned_commission','Плановая комиссия','number'],['source','Источник','text',100],['next_action','Следующее действие','text',240],['lost_reason','Причина потери','textarea',500],['notes','Заметка','textarea',2000]]){
  const wrap=el('label',label),input=el(type==='select'?'select':type==='textarea'?'textarea':'input');input.name=name;inputs[name]=input;
  input.setAttribute('aria-label',label);if(type!=='select'&&type!=='textarea')input.type=type;if(max)input.maxLength=max;if(type==='number'){input.min='0';input.step='0.01';}wrap.append(input);form.append(wrap);
 }
 for(const name of ['title','client_id','stage','currency'])inputs[name].required=true;
 inputs.currency.append(new Option('USD','USD'),new Option('KGS','KGS'));
 const submit=el('button','Сохранить сделку','crm-primary-button');submit.type='submit';
 const result=el('p','','crm-deal-result');result.setAttribute('role','status');form.append(el('p','Плановая комиссия — ожидаемая сумма, не полученный доход.','crm-deal-muted'),submit,result);dialog.append(form);
 const history=el('section',undefined,'crm-deal-history');dialog.append(history);document.body.append(dialog);
 function terminalFields(){const lost=inputs.stage.value==='lost';inputs.lost_reason.closest('label').hidden=!lost;inputs.lost_reason.required=lost;inputs.object_id.required=inputs.stage.value==='won';inputs.amount.required=inputs.stage.value==='won';}
 inputs.stage.addEventListener('change',terminalFields);form.addEventListener('input',()=>{pendingId='';});
 function selectOptions(select,options,current){select.replaceChildren();for(const [value,label]of options)select.add(new Option(label,value));select.value=current||'';}
 function openForm(record,stageOverride){
  if(!state.ready)return;editing=record;newId=record?.id||uuid();pendingId='';form.reset();result.textContent='';
  selectOptions(inputs.client_id,[['','Выберите клиента'],...records('client').map(c=>[c.id,c.name])],record?.client_id);
  selectOptions(inputs.object_id,[['','Пока без объекта'],...state.objects.map(o=>[o.id,o.title||`Объект #${o.id}`])],record?.object_id);
  const available=record?[record.stage,...(stageInfo(record.stage)?.transitions||[])]:['new'];
  selectOptions(inputs.stage,available.map(id=>[id,stageLabel(id)]),stageOverride||record?.stage||'new');
  for(const [name,input]of Object.entries(inputs))if(!['client_id','object_id','stage'].includes(name))input.value=record?.[name]??(name==='currency'?'USD':'');
  terminalFields();dialogTitle.textContent=record?'Карточка сделки':'Новая сделка';history.replaceChildren();
  if(record){history.append(el('h3','История изменений'));const list=el('ol');for(const event of [...(record.history||[])].reverse()){const row=el('li');row.append(el('strong',event.type==='created'?'Сделка создана':event.type==='stage_changed'?`${stageLabel(event.from)} → ${stageLabel(event.to)}`:'Карточка обновлена'),el('small',`${date(event.at)} · Автор: ${event.author_id}`));list.append(row);}history.append(list);}
  if(!records('client').length)result.textContent='Сначала добавьте клиента в разделе «Клиенты».';
  submit.disabled=false;dialog.showModal();inputs.title.focus();
 }
 async function persist(record,data,id,mutation){
  const requestEpoch=epoch;
  const response=await window.LiberterraAgentAccess.request('save_crm_record',{kind:'deal',id,version:record?.version||0,mutation_id:mutation,data});
  if(requestEpoch!==epoch||content.hidden)throw Error('Сессия или данные изменились. Обновите CRM.');
  const index=state.records.findIndex(r=>r.id===response.record.id);if(index<0)state.records.push(response.record);else state.records[index]=response.record;
  renderBoard();renderDay();return response.record;
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!state.ready||content.hidden)return;submit.disabled=true;result.textContent='Сохраняем…';pendingId||=uuid();
  try{editing=await persist(editing,Object.fromEntries(new FormData(form)),newId,pendingId);pendingId='';dialog.close();status.textContent='Сделка сохранена.';window.LiberterraCrmWorkflow.reload();}
  catch(error){result.textContent=errors[error.code]||error.message||'Не удалось сохранить. Повторите попытку.';}
  finally{submit.disabled=!state.ready;}
 });
 async function move(record,next){
  if(!state.ready||busy.has(record.id)||record.stage===next)return;
  if(next==='lost'||next==='won'){openForm(record,next);return;}
  busy.add(record.id);status.textContent='Сохраняем этап…';renderBoard();
  try{await persist(record,{...record,stage:next},record.id,uuid());status.textContent='Этап сохранён.';}
  catch(error){status.textContent=errors[error.code]||error.message;}
  finally{busy.delete(record.id);renderBoard();}
 }
 function renderBoard(){
  board.replaceChildren();create.disabled=!state.ready||!state.stages.length;
  if(!state.ready){board.append(el('p','Сделки недоступны до успешной загрузки CRM.'));return;}
  if(!state.stages.length){board.append(el('p','Для работы со сделками требуется обновление сервера CRM.'));return;}
  const query=search.value.trim().toLocaleLowerCase('ru');
  for(const stage of state.stages){
   const deals=records('deal').filter(d=>d.stage===stage.id&&(!query||(d.title+' '+clientName(d.client_id)).toLocaleLowerCase('ru').includes(query)));
   const column=el('section',undefined,'crm-deal-column');column.dataset.stage=stage.id;column.dataset.mobileHidden=String(mobileStage.value!==stage.id);column.dataset.terminal=String(['won','lost'].includes(stage.id));
   column.append(el('h3',`${stage.label} · ${deals.length}`));
   column.addEventListener('dragover',event=>{const record=records('deal').find(d=>d.id===dragging);if(record&&stageInfo(record.stage)?.transitions.includes(stage.id)){event.preventDefault();event.dataTransfer.dropEffect='move';}});
   column.addEventListener('drop',event=>{event.preventDefault();const record=records('deal').find(d=>d.id===event.dataTransfer.getData('text/plain'));if(record&&stageInfo(record.stage)?.transitions.includes(stage.id))move(record,stage.id);dragging='';});
   if(!deals.length)column.append(el('p','Нет сделок','crm-deal-empty'));
   for(const deal of deals){
    const card=el('article',undefined,'crm-deal-card');card.dataset.dealId=deal.id;card.draggable=!busy.has(deal.id)&&stage.transitions.length>0;
    card.addEventListener('dragstart',event=>{if(!state.ready||busy.has(deal.id)){event.preventDefault();return;}dragging=deal.id;event.dataTransfer.setData('text/plain',deal.id);event.dataTransfer.effectAllowed='move';});card.addEventListener('dragend',()=>{dragging='';});
    const open=button(deal.title,()=>openForm(deal),'crm-deal-open');open.disabled=busy.has(deal.id);card.append(open,el('p',clientName(deal.client_id),'crm-deal-client'),el('strong',money(deal.amount,deal.currency),'crm-deal-amount'));
    if(deal.object_id)card.append(el('p',objectName(deal.object_id),'crm-deal-muted'));
    card.append(el('p',deal.next_action||'Укажите следующее действие','crm-deal-next'),el('small','План комиссии: '+money(deal.planned_commission,deal.currency)));
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
  for(const [label,value]of [['Активные сделки',state.ready?active.length:'—'],['На финальной стадии',state.ready?final.length:'—'],['Задачи на сегодня',tasks?todayTasks.length:'—'],['Просрочено',tasks?overdue.length:'—']]){const k=el('div',undefined,'crm-day-metric');k.append(el('span',label),el('strong',String(value)));metrics.append(k);}
  const forecast=el('div',undefined,'crm-day-forecast');forecast.append(el('h3','Плановая комиссия'));
  let any=false;for(const currency of ['USD','KGS']){const values=active.filter(d=>d.currency===currency&&d.planned_commission!==''&&d.planned_commission!==undefined);if(values.length){any=true;forecast.append(el('p',money(values.reduce((sum,d)=>sum+Math.round(Number(d.planned_commission)*100),0)/100,currency)));}}
  if(!any)forecast.append(el('p',state.ready?'Пока не указана':'Загружаем…'));forecast.append(el('small','По активным сделкам. Не является полученным доходом.'));attention.append(forecast);
  const urgent=el('div');urgent.append(el('h3','Требуют внимания'));
  if(tasks===null)urgent.append(el('p','Задачи ещё не загружены.'));else if(!overdue.length)urgent.append(el('p','Просроченных задач нет.'));
  for(const task of overdue.sort((a,b)=>a.due_at.localeCompare(b.due_at)).slice(0,3))urgent.append(button(task.title+' · '+date(task.due_at),()=>root.querySelector('[data-crm-tab="tasks"]').click(),'crm-deal-task-link'));
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
 window.addEventListener('liberterra:tasks-data',event=>{tasks=event.detail.ready===false?null:event.detail.tasks;renderDay();});
 renderDay();
})();
