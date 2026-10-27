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
  function update() {
    const loading=document.querySelector('#profileCard .profile-loading');
    if(loading&&document.querySelector('#userRegistrationGate [data-email-auth-form]')&&!window.LiberterraUserAccess?.isRegistered?.()){
      const empty=document.createElement('div');empty.className='profile-empty';
      const title=document.createElement('strong');title.textContent='Войдите в свой аккаунт';
      const description=document.createElement('span');description.textContent='Уже есть аккаунт? Войдите по email и паролю. Если аккаунта ещё нет — зарегистрируйтесь.';
      empty.append(title,description,actions());loading.replaceWith(empty);
    }
    const header=document.querySelector('.public-header')||document.querySelector('.site-header .header-controls');
    if(header&&!header.querySelector('.lt-auth-actions'))header.append(actions());
    const entry=header?.querySelector('.lt-auth-actions');
    if(entry)entry.hidden=Boolean(document.querySelector('.lt-account-menu'));
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
