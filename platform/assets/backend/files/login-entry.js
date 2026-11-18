(() => {
  const params=new URLSearchParams(location.search);
  // A post-login destination must remain on this site, including encoded/backslash forms.
  let destination='/profile.html';
  try {const candidate=new URL(params.get('next')||destination,location.origin);if(candidate.origin===location.origin&&!candidate.pathname.startsWith('/login'))destination=candidate.pathname+candidate.search+candidate.hash;}catch(_){}
  params.set('next',destination);history.replaceState(null,'',location.pathname+'?'+params.toString());
  function decorate() {
    const card=document.querySelector('#userRegistrationGate .registration-card');if(!card||card.querySelector('.auth-home'))return;
    const mode=card.querySelector('[data-email-auth-form]')?.dataset.emailMode;
    if(mode==='login'||mode==='register'){
      const row=document.createElement('p');row.className='auth-switch';row.append(mode==='register'?'Уже есть аккаунт?':'Нет аккаунта?');
      const button=document.createElement('button');button.type='button';button.dataset.emailTab=mode==='register'?'login':'register';button.textContent=mode==='register'?'Войти':'Зарегистрироваться';row.append(button);card.append(row);
    }
    const home=document.createElement('a');home.className='auth-home';home.href='/';home.textContent='← На главную';card.append(home);
  }
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  window.LiberterraUserAccess.openLogin();
  if(params.get('mode')==='register')document.querySelector('[data-email-tab="register"]')?.click();
  decorate();
})();
