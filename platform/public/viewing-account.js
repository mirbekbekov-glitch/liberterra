function buildViewingWhatsAppUrl(item,day,time,origin='https://liberterra.kg'){
  let number=String(item.phone||'').replace(/\D/g,'');
  if(/^0\d{9}$/.test(number))number='996'+number.slice(1);else if(/^\d{9}$/.test(number))number='996'+number;
  if(!/^[1-9]\d{7,14}$/.test(number))return '';
  const url=new URL('/object?id='+encodeURIComponent(item.id),origin).href;
  const date=day.split('-').reverse().join('.');
  const message=`Здравствуйте! Я оставил заявку на просмотр объекта «${item.title||'Недвижимость'}».\n${url}\nЖелаемая дата: ${date}, время: ${time} по Бишкеку (UTC+6). Подтвердите, пожалуйста, удобно ли вам.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
if(typeof module!=='undefined')module.exports={whatsappUrl:buildViewingWhatsAppUrl};
/* Account-based viewing requests and history. */
(() => {
  'use strict';
  if(typeof window==='undefined')return;
  const words = {
    ru:['Просмотры','Обновить','Ожидает ответа агента','Предложено новое время','Просмотр согласован','Просмотр состоялся','Отменён','Подтвердить','Предложить другое время','Отменить просмотр','Отметить состоявшимся','Открыть объект','Запросов пока нет','Не удалось выполнить запрос. Обновите историю перед повтором.','Войдите в Liberterra, чтобы записаться на просмотр. После входа вы останетесь на этом объекте.','Дата','Время по Бишкеку (UTC+6)','Отправить заявку и открыть WhatsApp','Согласен передать имя и выбранное время назначенному агенту для организации просмотра.','Заявка сохранена в кабинете. В WhatsApp подготовлено сообщение с объектом, датой и временем — нажмите «Отправить». Время пока не подтверждено.','Загрузка…','Мои запросы','Входящие от клиентов','Записаться на просмотр','Данные изменились. Обновите список.','Уже есть активная заявка на этот объект.','Войти','WhatsApp для этого объекта не указан. Заявка сохранена в кабинете.','Заявка сохранена. Нажмите «Открыть WhatsApp», затем отправьте готовое сообщение. Время пока не подтверждено.','WhatsApp открылся с готовым текстом. Если не открылся, нажмите «Открыть WhatsApp». Заявку в кабинете сохранить не удалось — записи на сайте нет.','Сначала войдите в аккаунт, чтобы отправить заявку на просмотр.','Для этого объекта нет доступного контакта WhatsApp.','Похоже, время просмотра уже запрашивали. Проверьте «Мои запросы».','Заявка на просмотр временно недоступна. Сообщение подготовлено в WhatsApp, но заявка не сохранена на сайте.','Объект больше недоступен для записи на просмотр.','Нет свободного агента для этого объекта.','Нельзя записаться на собственный объект.','Вы отправили слишком много заявок. Попробуйте позже.'],
    en:['Viewings','Refresh','Awaiting agent','New time proposed','Confirmed','Completed','Cancelled','Confirm','Propose another time','Cancel viewing','Mark completed','View property','No requests yet','Request failed. Refresh history before retrying.','Sign in to Liberterra to request a viewing. You will stay on this property after sign-in.','Date','Bishkek time (UTC+6)','Submit request and open WhatsApp','I agree to share my name and chosen time with the assigned agent to arrange a viewing.','Request saved to your account. WhatsApp has a ready message with the listing, date and time — tap Send. The time is not confirmed yet.','Loading…','My requests','Incoming requests','Request a viewing','Record changed. Refresh the list.','An active request already exists for this property.','Sign in','WhatsApp contact is not listed for this property. The request was saved to your account.','Request saved. Tap “Open WhatsApp” below, then send the prepared message. The time is not confirmed yet.','WhatsApp opened with a ready message, but the request could not be saved to your account. Send the WhatsApp message; no request was recorded on the site.','Sign in first to submit a viewing request.','No WhatsApp contact is available for this listing.','A viewing request may already exist. Check “My requests”.','Viewing requests are temporarily unavailable. A WhatsApp message was prepared, but the request was not saved on the site.','This listing is no longer available for viewing requests.','No available agent is assigned to this listing.','You cannot request a viewing for your own listing.','Too many requests. Please try again later.'],
    zh:['看房预约','刷新','等待经纪人回复','已提议新时间','已确认','已完成','已取消','确认','建议其他时间','取消预约','标记已完成','查看房源','暂无预约','请求失败。请刷新记录后重试。','请登录 Liberterra 预约看房。登录后您仍会停留在当前房源页面。','日期','比什凯克时间 (UTC+6)','提交请求并打开 WhatsApp','我同意将姓名和所选时间提供给负责经纪人以安排看房。','请求已保存到账号。WhatsApp 已准备好包含房源、日期和时间的消息，请点击发送。时间尚未确认。','加载中…','我的预约','客户预约','预约看房','记录已更改，请刷新。','此房源已有有效预约。','登录','此房源未提供 WhatsApp 联系方式。请求已保存到账号。','请求已保存。请点击下方“打开 WhatsApp”，然后发送预填消息。看房时间尚未确认。','WhatsApp 已打开并填好消息，但预约未能保存到账号。请在 WhatsApp 发送消息；网站未创建预约记录。','请先登录以提交看房预约。','此房源没有可用的 WhatsApp 联系方式。','可能已存在看房预约，请查看“我的预约”。','看房预约暂时不可用。WhatsApp 消息已准备好，但网站未保存预约。','此房源目前无法预约看房。','此房源没有可用的经纪人。','不能预约查看自己的房源。','请求过多，请稍后再试。']
  };
  const t=i=>(words[(document.documentElement.lang||'ru').split('-')[0]]||words.ru)[i];
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const api=()=>window.LiberterraAgentAccess;
  const hasSession=()=>Boolean(api()?.hasUserSession()||window.LiberterraUserAccess?.isRegistered?.());
  const request=(action,data)=>api().request(action,data);
  const errorMessageIndex={version_conflict:24,active_request_exists:25,registration_required:29,invalid_session:29,invalid_telegram_session:29,consent_required:18,invalid_time:11,feature_disabled:32,busy_retry:32,viewing_storage_error:32,save_unconfirmed:32,object_unavailable:33,agent_unavailable:34,own_object:35,daily_limit:36};
  const errorText=e=>t(errorMessageIndex[e.code]===undefined?13:errorMessageIndex[e.code]);
  function login(root,onReady){
    root.append(el('p',t(14)));
    const button=el('button',t(26));button.type='button';button.className='viewing-login';
    button.onclick=()=>{
      window.addEventListener('liberterra:user-registered',onReady,{once:true});
      if(window.LiberterraUserAccess?.openLogin?.())return;
      const next=window.location.pathname+window.location.search;
      window.location.assign('/profile.html?auth=login&next='+encodeURIComponent(next));
    };
    root.append(button);
  }
  function fields(form){const day=el('input'),time=el('input');day.type='date';time.type='time';day.required=time.required=true;time.value='15:00';day.min=new Date(Date.now()+21600000).toISOString().slice(0,10);day.max=new Date(Date.now()+90*86400000+21600000).toISOString().slice(0,10);[[15,day],[16,time]].forEach(([i,n])=>{const label=el('label',t(i));label.append(n);form.append(label);});return {day,time};}
  function mount(parent,item){
    if(item.isRequest||!item.id)return;
    const panel=el('section');panel.className='viewing-panel';
    const slot=parent.querySelector('[data-viewing-request]');
    if(slot)slot.append(panel);
    else {
      const discussion=parent.querySelector('[data-agent-object-workspace]');
      if(discussion)discussion.before(panel);else parent.append(panel);
    }
    const render=(authenticated=false)=>{
      panel.replaceChildren(el('h2',t(23)));
      if(!authenticated&&!hasSession()){login(panel,()=>render(true));return;}
      const form=el('form'),{day,time}=fields(form),consent=el('input');consent.type='checkbox';consent.required=true;
      const label=el('label'),consentText=el('span',t(18));label.className='viewing-consent';label.append(consent,consentText);form.append(label);
      const button=el('button',t(17)),status=el('p'),whatsapp=el('a','Открыть WhatsApp');button.type='submit';status.setAttribute('role','status');whatsapp.hidden=true;whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';form.append(button,status,whatsapp);panel.append(form);
      let key=crypto.randomUUID(),fingerprint='';
      form.onsubmit=async event=>{event.preventDefault();const current=day.value+'|'+time.value;if(fingerprint&&current!==fingerprint)key=crypto.randomUUID();fingerprint=current;button.disabled=true;status.textContent=t(20);
        const link=buildViewingWhatsAppUrl(item,day.value,time.value,location.origin);let whatsappWindow=null;
        // Open the prefilled WhatsApp draft immediately from the user's click.
        // Do not make the external handoff depend on the catalog API succeeding.
        if(link){whatsapp.href=link;whatsapp.hidden=false;try{whatsappWindow=window.open(link,'_blank','noopener,noreferrer');}catch(_){} }
        try{
          await request('create_viewing',{object_id:String(item.id),day:day.value,time:time.value,request_key:key,consent:consent.checked});
          if(link){status.textContent=whatsappWindow?t(19):t(28);}
          else{if(whatsappWindow)whatsappWindow.close();status.textContent=t(27);}
        }
        catch(e){if(link)status.textContent=t(30)+' '+errorText(e);else if(['registration_required','invalid_session','invalid_telegram_session'].includes(e.code)){panel.replaceChildren(el('h2',t(23)));login(panel,()=>render(true));}else status.textContent=errorText(e);}finally{button.disabled=false;}
      };
    };
    render();
  }
  async function history(root){
    root.replaceChildren(el('h1',t(0)));if(!hasSession()){login(root,()=>history(root));return;}
    const refresh=el('button',t(1));refresh.onclick=()=>history(root);const status=el('p',t(20));status.setAttribute('role','status');root.append(refresh,status,el('p',t(27)));refresh.disabled=true;
    try{const result=await request('list_viewings',{});status.textContent='';
      if(!result.viewings.length)root.append(el('p',t(12)));
      result.viewings.forEach(r=>{
        const agent=r.agent_id===result.viewer_id,card=el('article');card.className='viewing-panel';
        card.append(el('h2',(agent?t(22):t(21))+' · №'+r.object_id),el('p',r.day+' '+r.time+' (UTC+6)'),el('p',t({pending:2,proposed:3,confirmed:4,completed:5,cancelled:6}[r.status])));
        if(agent)card.append(el('p',r.client_name));
        const a=el('a',t(11));a.href='/object?id='+encodeURIComponent(r.object_id);card.append(a);
        async function change(next,data={}){card.querySelectorAll('button').forEach(b=>b.disabled=true);try{await request('update_viewing',{id:r.id,version:r.version,status:next,...data});await history(root);}catch(e){status.textContent=errorText(e);card.querySelectorAll('button').forEach(b=>b.disabled=false);}}
        function button(label,next){const b=el('button',t(label));b.onclick=()=>change(next);card.append(b);}
        if((agent&&r.status==='pending')||(!agent&&r.status==='proposed'))button(7,'confirmed');
        if(['pending','proposed','confirmed'].includes(r.status))button(9,'cancelled');
        if(agent&&r.status==='confirmed'&&Date.parse(r.day+'T'+r.time+':00+06:00')<=Date.now())button(10,'completed');
        if(agent&&['pending','proposed','confirmed'].includes(r.status)){
          const details=el('details');details.append(el('summary',t(8)));const form=el('form'),f=fields(form),b=el('button',t(8));form.append(b);form.onsubmit=e=>{e.preventDefault();change('proposed',{day:f.day.value,time:f.time.value});};details.append(form);card.append(details);
        }
        root.append(card);
      });
      document.dispatchEvent(new CustomEvent('liberterra:viewings-read',{detail:result}));
    }catch(e){status.textContent=errorText(e);}finally{refresh.disabled=false;}
  }
  window.LiberterraViewingAccount={mount,history};
})();
