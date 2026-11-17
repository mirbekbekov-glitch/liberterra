(() => {
  'use strict';
  const source = 'https://www.cci.kg/reestry/reestr-rieltorov.html';
  const words = {
    ru:['В реестре ТПП КР','Сертификат','Проверено','Источник — ТПП КР','Запись в реестре не гарантирует безопасность сделки.','Реестр риелторов ТПП КР','Полное ФИО','Номер сертификата','Ссылка на запись ТПП КР','Отправить на проверку','Данные сохранены.','Не удалось сохранить. Попробуйте снова.','Заявлено','Подтверждено','Отклонено','Telegram ID агента (для администратора)','Загрузить','Статус','Я сверил ФИО и сертификат с источником; статус сертификата действителен.','Сохранить решение','Не удалось загрузить данные реестра.','После изменения данных требуется новая проверка.'],
    en:['Listed in the CCI KR register','Certificate','Checked','Source — CCI KR','Registry inclusion does not guarantee transaction safety.','CCI KR realtor register','Full legal name','Certificate number','CCI registry URL','Submit for review','Saved.','Could not save. Please retry.','Pending','Verified','Rejected','Agent Telegram ID (administrator)','Load','Status','I matched the name and certificate with the source; the certificate is valid.','Save decision','Could not load registry details.','Changes require a new review.'],
    zh:['已列入吉尔吉斯共和国工商会名册','证书','核查日期','来源 — 工商会','列入名册不保证交易安全。','工商会房地产经纪人名册','完整姓名','证书编号','工商会名册链接','提交审核','已保存。','保存失败，请重试。','待审核','已核实','未通过','经纪人 Telegram ID（管理员）','加载','状态','我已核对姓名和证书，证书状态有效。','保存决定','无法加载名册信息。','修改资料后需要重新审核。']
  };
  const t = i => (words[(document.documentElement.lang || 'ru').split('-')[0]] || words.ru)[i];
  function element(tag, text) { const n=document.createElement(tag); if(text)n.textContent=text; return n; }
  function valid(record) {
    const age=Date.now()-Date.parse(record?.checked_at);
    return Boolean(record?.status==='verified' && typeof record.certificate==='string' && record.certificate.trim() && Number.isFinite(age) && age>=0 && age<=90*86400000 && /^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(record.source));
  }
  // Public evidence comes from the server's registry projection, never a profile checkbox.
  function selectAgents(agents, mode) {
    if (mode === 'only') return agents.filter(agent => valid(agent.registry));
    if (mode === 'verified') return agents.slice().sort((a, b) => Number(valid(b.registry)) - Number(valid(a.registry)));
    return agents.slice();
  }
  function badge(parent, record) {
    parent.querySelector('[data-registry-badge]')?.remove();
    const verified = valid(record);
    const copies = {
      ru: ['Реестр не подтверждён', 'На платформе пока нет действующего подтверждения. Это не означает, что агент отсутствует в реестре.', 'Аттестация подтверждена', 'Открыть реестр ТПП КР'],
      en: ['Registry unconfirmed', 'The platform has no current verification. This does not mean the agent is absent from the register.', 'Certification verified', 'Open the CCI KR register'],
      zh: ['名册状态未确认', '平台暂无有效核验。这不代表该经纪人不在名册中。', '资格已核实', '打开工商会名册'],
      ky: ['Реестр ырасталган эмес', 'Платформада учурдагы ырастоо жок. Бул агент реестрде жок дегенди билдирбейт.', 'Аттестация ырасталды', 'КР СӨП реестрин ачуу']
    };
    const lang = (document.documentElement.lang || 'ru').split('-')[0];
    const copy = copies[lang === 'kg' ? 'ky' : lang] || copies.ru;
    const box = element('details');
    box.className = 'registry-badge registry-badge--' + (verified ? 'verified' : 'unconfirmed');
    box.dataset.registryBadge = verified ? 'verified' : 'unconfirmed';
    const summary = element('summary');
    const icon = element('span', verified ? '✓' : 'i');
    icon.className = 'registry-status-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(icon, element('span', verified ? t(0) : copy[0]));
    box.append(summary);
    if (verified) {
      box.append(element('p', copy[2]), element('p', t(1) + ': ' + record.certificate),
        element('p', t(2) + ': ' + new Date(record.checked_at).toLocaleDateString(lang === 'kg' ? 'ky' : lang)));
    } else {
      box.append(element('p', copy[1]));
    }
    const link = element('a', verified ? t(3) : copy[3]);
    link.href = verified ? record.source : source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    box.append(link);
    if (verified) box.append(element('p', t(4)));
    parent.append(box);
  }

  function adminReviews(parent, request) {
    const section=element('section');section.id='certificateReviews';section.className='registry-editor';parent.append(section);
    section.append(element('h3','Проверка сертификатов'));
    const open=element('button','Загрузить заявки');open.type='button';section.append(open);
    const notice=element('p');notice.setAttribute('role','status');section.append(notice);
    const list=element('div');section.append(list);
    async function load(){
      open.disabled=true;notice.textContent='Загружаем заявки…';list.replaceChildren();
      try{
        const result=await request('list_certificate_reviews');if(!section.isConnected)return;
        const reviews=Array.isArray(result.reviews)?result.reviews:[];
        notice.textContent=reviews.length?'Заявок на проверку: '+reviews.length:'Нет заявок на проверку.';
        for(const review of reviews){
          const form=element('form');form.className='registry-editor';list.append(form);
          form.append(element('h4',review.agent_name||'Агент'),element('p','ФИО: '+review.full_name),element('p','Сертификат: '+review.certificate));
          function field(label,type){const wrap=element('label',label),input=element('input');input.type=type;wrap.append(input);form.append(wrap);return input;}
          const sourceInput=field('Ссылка на запись официального реестра','url');sourceInput.value=source;
          const validInput=field('Номер и ФИО сверены с официальным реестром; сертификат действителен','checkbox');
          const ownerInput=field('Подтверждена принадлежность аккаунта владельцу сертификата','checkbox');
          const reason=field('Причина отказа','text');reason.maxLength=500;
          const label=element('label','Решение'),decision=element('select');
          for(const [value,text]of [['','Выберите решение'],['verified','Подтвердить'],['rejected','Отклонить']]){const option=element('option',text);option.value=value;decision.append(option);}decision.required=true;label.append(decision);form.append(label);
          const save=element('button','Сохранить решение');save.type='submit';form.append(save);
          const message=element('p');message.setAttribute('role','status');form.append(message);
          form.onsubmit=async event=>{
            event.preventDefault();if(save.disabled)return;
            if(decision.value==='verified'&&(!validInput.checked||!ownerInput.checked)){message.textContent='Для подтверждения отметьте обе выполненные проверки.';return;}
            if(decision.value==='verified'&&!/^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(sourceInput.value.trim())){message.textContent='Укажите ссылку на официальный реестр ТПП КР.';return;}
            save.disabled=true;message.textContent='Сохраняем решение…';
            try{
              await request('decide_certificate_review',{agent_id:review.agent_id,decision:decision.value,source:sourceInput.value.trim(),reason:reason.value.trim(),checked_valid:validInput.checked,checked_identity:ownerInput.checked});
              if(!section.isConnected)return;
              form.replaceChildren(element('p',decision.value==='verified'?'Подтверждено. Отметка появится в каталоге после обновления данных (до 30 секунд).':'Заявка отклонена.'));
            }catch(error){if(section.isConnected){message.textContent='Решение не подтверждено сервером. Обновите список перед повторной попыткой.';save.disabled=false;}}
          };
        }
      }catch(error){if(section.isConnected)notice.textContent='Не удалось получить заявки. Проверьте права администратора и повторите.';}
      finally{open.disabled=false;}
    }
    open.onclick=load;
  }
  async function editor(parent) {
    parent.querySelector('[data-registry-editor]')?.remove();
    const box=element('section');box.dataset.registryEditor='';box.className='registry-editor';parent.append(box);
    box.append(element('h3','Реестр риелторов ТПП КР'));
    const status=element('p','Загружаем данные сертификата…');status.setAttribute('role','status');box.append(status);
    const request=async(action,data={})=>{
      try{return await window.LiberterraAgentAccess.request(action,data);}
      catch(error){
        if(action!=='get_user_profile'||error.code!=='unsupported_action')throw error;
        const response=await fetch('/api/user-access',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'web_profile'})});
        const result=await response.json();if(!response.ok||!result.ok)throw Error('profile_unavailable');return result;
      }
    };
    try {
      const result=await request('get_user_profile');
      if(!box.isConnected)return;
      const user=result.user;
      if(user?.is_admin===true)adminReviews(box,request);
      if(!user||user.account_type!=='Агент'){status.textContent='Подача сертификата доступна в профиле агента.';return;}
      const labels={verified:'Аттестация подтверждена',pending:'Сертификат на проверке',rejected:'Сертификат не подтверждён',unverified:'Сертификат ещё не подтверждён'};
      status.textContent=labels[user.certificate_verification?.status]||labels.unverified;
      const form=element('form');box.append(form);
      function input(label,name,value,max){const wrap=element('label',label),field=element('input');field.name=name;field.value=value||'';field.required=true;field.maxLength=max;wrap.append(field);form.append(wrap);return field;}
      const full=input('ФИО по сертификату','certificate_legal_name',user.certificate_legal_name,160);full.minLength=5;
      const cert=input('Номер сертификата','certificate_number',String(user.certificate_number||'').replace(/^№\s*/u,''),40);cert.pattern='[A-Za-zА-Яа-я0-9-]{3,40}';
      form.append(element('p','Укажите данные точно как в сертификате. Администратор сверит их с реестром и подтвердит принадлежность сертификата вашему аккаунту.'));
      const save=element('button','Отправить на проверку');save.type='submit';form.append(save);
      const sourceLink=element('a','Открыть реестр ТПП КР');sourceLink.href=source;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';box.append(sourceLink);
      form.onsubmit=async event=>{
        event.preventDefault();if(save.disabled)return;save.disabled=true;status.textContent='Сохраняем данные сертификата…';
        let saved=false;
        try {
          const fresh=await request('get_user_profile');
          if(!box.isConnected)return;
          if(!fresh.user||fresh.user.account_type!=='Агент')throw Error('agent_required');
          await request('update_user_profile',{full_name:fresh.user.name,phone:fresh.user.phone,certificate_number:cert.value.trim(),certificate_legal_name:full.value.trim()});
          saved=true;
          const review=await request('submit_certificate_review');
          if(!box.isConnected)return;
          status.textContent=review.status==='verified'?'Аттестация уже подтверждена.':'Заявка отправлена на проверку. Статус появится здесь после решения администратора.';
          save.textContent='Отправить повторно';
        }catch(error){if(box.isConnected)status.textContent=saved?'Данные сохранены, но отправка на проверку не подтверждена. Обновите страницу и проверьте статус перед повторной отправкой.':'Не удалось сохранить сертификат. Проверьте вход и данные, затем попробуйте снова.';}
        finally{save.disabled=false;}
      };
    }catch(error){if(!box.isConnected)return;status.textContent='Не удалось загрузить сертификат. Войдите в аккаунт и повторите.';const retry=element('button','Повторить');retry.type='button';retry.onclick=()=>editor(parent);box.append(retry);}
  }

  window.LiberterraRegistry={badge,editor,valid,selectAgents};
  function translateSort(){const select=document.querySelector('#agentRegistrySort');if(!select)return;const lang=(document.documentElement.lang||'ru').split('-')[0];const labels={ru:['Порядок специалистов','По количеству объявлений','Сначала с подтверждённым реестром','Только с подтверждённым реестром'],en:['Sort specialists','By listing count','Registry verified first','Registry verified only'],zh:['经纪人排序','按房源数量','已核实名册优先','仅已核实名册']}[lang]||[];if(!labels.length)return;document.querySelector('[data-registry-sort-label]').textContent=labels[0];Array.from(select.options).forEach((o,i)=>o.textContent=labels[i+1]);}
  document.addEventListener('DOMContentLoaded',translateSort);
  new MutationObserver(translateSort).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
