(() => {
  'use strict';
  function unread(rows, viewer, seen) {
    return rows.filter(r => {
      if (r.client_id !== viewer && r.agent_id !== viewer) return false;
      const events = Array.isArray(r.events) ? r.events : [];
      const last = events[events.length - 1];
      return last && last.by !== viewer && Number(r.version) > Number(seen[r.id] || 0);
    }).length;
  }
  if (typeof module !== 'undefined') module.exports = {unread};
  if (typeof window === 'undefined') return;
  const words = {ru:['Уведомления о просмотрах','Новых событий: ','Не удалось обновить уведомления'],en:['Viewing notifications','New events: ','Could not refresh notifications'],zh:['看房通知','新消息：','无法更新通知']};
  const text = i => (words[(document.documentElement.lang || 'ru').split('-')[0]] || words.ru)[i];
  let button, counter, busy=false, timer, stopped=false;
  let memory = {};
  const key = viewer => 'liberterra-viewing-seen-v1:'+viewer;
  function read(viewer) {try {const value=JSON.parse(localStorage.getItem(key(viewer))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(_){return memory[viewer]||{};}}
  function markSeen(viewer, rows) {
    const seen = read(viewer);
    rows.forEach(r=>{seen[r.id]=Math.max(Number(seen[r.id])||0,Number(r.version)||0);});
    memory[viewer]=seen;
    try {localStorage.setItem(key(viewer),JSON.stringify(seen));}catch(_){}
  }
  function render(result) {
    const count=unread(result.viewings,String(result.viewer_id),read(result.viewer_id));
    button.hidden=false; counter.textContent=count>99?'99+':String(count);counter.hidden=!count;
    button.title=text(0);button.setAttribute('aria-label',text(0)+'. '+text(1)+count);
  }
  async function refresh() {
    clearTimeout(timer);
    if(stopped||busy||document.hidden||!window.LiberterraAgentAccess?.hasUserSession())return;
    busy=true;
    try {const result=await window.LiberterraAgentAccess.request('list_viewings',{});render(result);}
    catch(e) {
      if(['pilot_access_required','feature_disabled','invalid_telegram_session','registration_required'].includes(e.code)){stopped=true;button.hidden=true;}
      else {counter.hidden=true;button.title=text(2);button.setAttribute('aria-label',text(2));}
    } finally {busy=false;if(!stopped&&!document.hidden)timer=setTimeout(refresh,60000);}
  }
  function init() {
    const profile=document.querySelector('.header-profile');
    const header=document.querySelector('header');
    if(!profile&&!header)return;
    button=document.createElement('a');button.href='/viewing-account.html';button.hidden=true;button.className='viewing-notification';
    button.style.cssText='position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;flex-shrink:0;color:#842b43;text-decoration:none;border-radius:12px;';
    // Inline hidden wins over the inline display rule below via an explicit stylesheet.
    const style=document.createElement('style');style.textContent='.viewing-notification[hidden],.viewing-notification-count[hidden]{display:none!important}.viewing-notification:focus-visible{outline:3px solid #842b43;outline-offset:3px}';document.head.append(style);
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','24');icon.setAttribute('height','24');icon.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');icon.append(path);
    counter=document.createElement('span');counter.className='viewing-notification-count';counter.hidden=true;counter.setAttribute('aria-hidden','true');counter.style.cssText='position:absolute;top:0;right:0;min-width:18px;padding:1px 4px;border-radius:12px;background:#b52c44;color:white;font-size:11px;text-align:center;';button.append(icon,counter);
    if(profile)profile.before(button);else header.append(button);
    document.addEventListener('liberterra:viewings-read',e=>{if(!e.detail?.viewer_id||!Array.isArray(e.detail.viewings))return;markSeen(e.detail.viewer_id,e.detail.viewings);render(e.detail);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else refresh();});
    window.addEventListener('storage',e=>{if(e.key?.startsWith('liberterra-viewing-seen-v1:'))refresh();});
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
