(() => {
  'use strict';
  const next = location.pathname + location.search;
  const url = mode => '/api/crm-workflow/login.html?mode=' + mode + '&next=' + encodeURIComponent(next);
  function actions() {
    const box = document.createElement('div');box.className = 'lt-auth-actions';
    for (const [mode,label] of [['login','Войти'],['register','Зарегистрироваться']]) {
      const a=document.createElement('a');a.href=url(mode);a.textContent=label;a.className=mode==='login'?'lt-auth-primary':'lt-auth-secondary';box.append(a);
    }
    return box;
  }
  function knownUser(){try{const r=JSON.parse(localStorage.getItem('liberterra-verified-web-user')||'null');return r&&r.verified_at&&Date.now()-Number(r.verified_at)<7*24*60*60*1000?r.user:null;}catch(_){return null;}}
  function accountActions(){const box=document.createElement('div');box.className='lt-auth-actions lt-auth-account';const p=document.createElement('a');p.href='/profile.html';p.className='lt-auth-primary';p.textContent='Профиль';const out=document.createElement('a');out.href='/';out.className='lt-auth-secondary lt-auth-logout';out.style.cssText='background:transparent!important;color:#252a31!important;border:1px solid #d6dbe1!important;box-shadow:none!important';out.textContent='Выйти';out.addEventListener('click',async e=>{e.preventDefault();out.textContent='Выходим…';try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'});}catch(_){}finally{localStorage.removeItem('liberterra-verified-web-user');sessionStorage.removeItem('liberterra-verified-web-user');sessionStorage.removeItem('liberterra-profile-view');location.assign('/');}});box.append(p,out);return box;}
  function show(el,on){el.hidden=!on;if(on)el.style.removeProperty('display');else el.style.setProperty('display','none','important');}
  function update() {
    const loading=document.querySelector('#profileCard .profile-loading');
    if(loading&&document.querySelector('#userRegistrationGate [data-email-auth-form]')&&!window.LiberterraUserAccess?.isRegistered?.()){
      const empty=document.createElement('div');empty.className='profile-empty';
      const title=document.createElement('strong');title.textContent='Войдите в свой аккаунт';
      const description=document.createElement('span');description.textContent='Уже есть аккаунт? Войдите по email и паролю. Если аккаунта ещё нет — зарегистрируйтесь.';
      empty.append(title,description,actions());loading.replaceWith(empty);
    }
    const header=document.querySelector('.public-header')||document.querySelector('.site-header .header-controls');
    const user=knownUser(),menu=Boolean(document.querySelector('.lt-account-menu'));
    if(header&&!header.querySelector('.lt-auth-actions:not(.lt-auth-account)'))header.append(actions());
    const entry=header?.querySelector('.lt-auth-actions:not(.lt-auth-account)');
    if(entry)show(entry,!(Boolean(user)||menu));
    let account=header?.querySelector('.lt-auth-account');
    if(header&&user&&!menu&&!account){account=accountActions();header.append(account);}
    if(account)show(account,Boolean(user)&&!menu);
    for(const empty of document.querySelectorAll('#profileCard .profile-empty,.crm-access-state')) {
      if(empty.querySelector('.lt-auth-actions'))continue;
      if(!/Войдите|registration_required|telegram_required/.test(empty.textContent))continue;
      const title=empty.querySelector('strong'),description=empty.querySelector('span');
      if(title)title.textContent='Войдите в свой аккаунт';
      if(description)description.textContent='Уже есть аккаунт? Войдите по email и паролю. Если аккаунта ещё нет — зарегистрируйтесь.';
      empty.append(actions());
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});else update();
  new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
})();
