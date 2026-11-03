(() => {
  'use strict';
  const status=document.getElementById('selectionStatus'),list=document.getElementById('selectionObjects'),retry=document.getElementById('selectionRetry');
  const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  async function load(){
    retry.hidden=true;list.replaceChildren();status.textContent='Загружаем подборку…';
    const token=location.hash.slice(1);if(!/^[0-9a-f]{64}$/i.test(token)){status.textContent='Ссылка на подборку неполная. Попросите агента отправить её ещё раз.';return;}
    try{
      const response=await fetch('/api/crm-selection',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({token}),signal:AbortSignal.timeout(25000)});
      const result=await response.json();if(!response.ok||!result.ok)throw Error(response.status===404?'Ссылка отозвана или подборка недоступна.':'Не удалось загрузить подборку.');
      status.textContent=result.objects.length?`Объектов: ${result.objects.length}${result.unavailable_count?' · Некоторые объявления больше не доступны.':''}`:'В подборке пока нет доступных опубликованных объектов.';
      for(const object of result.objects){
        const card=node('article');card.className='selection-card';
        const photo=String(object.photo_url||'').split(/\s*(?:\||\n)\s*/).find(url=>/^https?:\/\//i.test(url));
        if(photo){const img=node('img');img.src=photo;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.remove(),{once:true});card.append(img);}
        const copy=node('div');copy.append(node('h2',object.title||`Объект #${object.id}`),node('strong',`${object.price||'Цена по запросу'} ${object.per||''}`),node('p',[object.city,object.district].filter(Boolean).join(' · ')),node('p',[object.area,object.rooms&&`${object.rooms} комн.`,object.floor].filter(Boolean).join(' · ')));
        const link=node('a','Подробнее об объекте');link.href='/object.html?id='+encodeURIComponent(object.id);copy.append(link);card.append(copy);list.append(card);
      }
    }catch(error){status.textContent=error.name==='TimeoutError'?'Сервис отвечает дольше обычного. Попробуйте ещё раз.':error.message;retry.hidden=false;}
  }
  retry.addEventListener('click',load);window.addEventListener('hashchange',load);load();
})();
