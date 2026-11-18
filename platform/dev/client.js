(() => {
 const bar=document.createElement('aside');bar.className='sandbox-bar';bar.setAttribute('aria-label','Тестовое окружение');
 bar.innerHTML='<strong>ЛОКАЛЬНЫЙ СТЕНД · только тестовые данные</strong><span data-sandbox-user></span>';
 for(const [actor,label]of [['a','Агент A'],['b','Агент B'],['blocked','Без допуска'],['','Выйти']]){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',async()=>{b.disabled=true;await fetch('/__dev/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({actor})});location.reload();});bar.append(b);
 }
 document.body.prepend(bar);fetch('/__dev/session').then(r=>r.json()).then(r=>{bar.querySelector('[data-sandbox-user]').textContent=r.actor?'Вход: '+r.actor.toUpperCase():'Гость';});
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(a&&new URL(a.href).origin!==location.origin){event.preventDefault();bar.querySelector('[data-sandbox-user]').textContent='Внешние переходы отключены на стенде';}},true);
})();
