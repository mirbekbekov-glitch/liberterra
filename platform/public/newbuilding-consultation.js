(() => {
  const copy={ru:['Консультация по ЖК','Имя','Телефон','Что интересует','Цены','Планировки','Рассрочка','Просмотр','Другой вопрос','Ваш вопрос (необязательно)','Согласен на обработку имени, телефона и вопроса Liberterra и передачу назначенному агенту для консультации.','Отправить заявку','Закрыть','Отправляем…','Заявка сохранена. Мы свяжемся с вами по указанному телефону.','Не удалось подтвердить сохранение. Повторите отправку этой же заявки: дубль не создастся.','Слишком много обращений. Попробуйте через час.'],en:['Project consultation','Name','Phone','Topic','Prices','Floor plans','Installments','Viewing','Other','Question (optional)','I consent to Liberterra processing my name, phone and question and sharing them with the assigned agent for this consultation.','Send request','Close','Sending…','Request saved. We will contact you at the supplied phone number.','Could not confirm receipt. Retry this same request; it will not create a duplicate.','Too many requests. Try again in an hour.'],zh:['楼盘咨询','姓名','电话','咨询主题','价格','户型','分期','看房','其他','问题（选填）','同意Liberterra处理我的姓名、电话和问题，并转交指定经纪人用于此次咨询。','提交','关闭','发送中…','已保存申请。我们将通过所填电话联系您。','无法确认保存。请重试同一申请，不会重复创建。','请求过多，请一小时后重试。']};
  const dialog=document.createElement('dialog');dialog.className='nb-consult';document.body.append(dialog);
  let busy=false, opener;
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-consult-project]');if(!button)return;
    opener=button;const lang=document.documentElement.lang;const t=copy[lang]||copy.ru;
    const project=button.dataset.consultProject, names={mansara:'MANSARA',termeli:'Termeli',leven:'Leven Park'};
    const id=crypto.randomUUID();let submittedData;
    dialog.innerHTML=`<form><button type="button" class="nb-close">${t[12]}</button><h2>${t[0]} · ${names[project]}</h2><label>${t[1]}<input name="name" autocomplete="name" maxlength="80" required></label><label>${t[2]}<input name="phone" type="tel" autocomplete="tel" maxlength="25" pattern="[+0-9 ()\\-]{7,25}" required></label><label>${t[3]}<select name="topic">${['prices','plans','installments','viewing','other'].map((v,i)=>`<option value="${v}">${t[i+4]}</option>`).join('')}</select></label><label>${t[9]}<textarea name="question" maxlength="1000"></textarea></label><div hidden><input name="website" tabindex="-1" autocomplete="off"></div><label class="nb-consent"><input name="consent" type="checkbox" required>${t[10]}</label><button type="submit">${t[11]}</button><p role="status" aria-live="polite"></p></form>`;
    const form=dialog.querySelector('form'), status=dialog.querySelector('[role=status]'), submit=form.querySelector('[type=submit]');
    dialog.querySelector('.nb-close').onclick=()=>{if(!busy)dialog.close();};
    form.onsubmit=async e=>{e.preventDefault();if(busy||!form.reportValidity())return;busy=true;submit.disabled=true;status.textContent=t[13];
      if(!submittedData){submittedData=Object.fromEntries(new FormData(form));submittedData.consent=form.elements.consent.checked;submittedData.project=project;submittedData.id=id;form.querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);}
      const data=submittedData;
      try{const response=await fetch('/api/newbuilding-consultation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});const result=await response.json();
        if(!response.ok||!result.ok){status.textContent=t[response.status===429?16:15];submit.disabled=false;}
        else{status.textContent=t[14]+' № '+result.id;form.querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);}
      }catch(_){status.textContent=t[15];submit.disabled=false;}finally{busy=false;}
    };dialog.showModal();form.elements.name.focus();
  });
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  dialog.addEventListener('close',()=>opener?.focus());
})();
