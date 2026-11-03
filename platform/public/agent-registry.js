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
    return Boolean(record?.status==='verified' && record.certificate && Number.isFinite(age) && age>=0 && age<=90*86400000 && /^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(record.source));
  }
  function badge(parent, record) {
    parent.querySelector('[data-registry-badge]')?.remove();
    if (!record || record.status !== 'verified' || !record.certificate) return;
    const age = Date.now()-Date.parse(record.checked_at);
    if (!Number.isFinite(age) || age<0 || age>90*86400000) return;
    if (!/^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(record.source)) return;
    const box=element('details'); box.className='registry-badge'; box.dataset.registryBadge='';
    box.append(element('summary','✓ '+t(0)),element('p',t(1)+': '+record.certificate),element('p',t(2)+': '+new Date(record.checked_at).toLocaleDateString(document.documentElement.lang)));
    const link=element('a',t(3)); link.href=record.source; link.target='_blank'; link.rel='noopener noreferrer'; box.append(link,element('p',t(4))); parent.append(box);
  }
  async function editor(parent) {
    parent.querySelector('[data-registry-editor]')?.remove();
    const box=element('section'); box.dataset.registryEditor=''; box.className='registry-editor'; parent.append(box);
    const status=element('p'); status.setAttribute('role','status');
    try {
      const initial=await window.LiberterraAgentAccess.request('get_agent_registry',{});
      if (!box.isConnected) return;
      box.append(element('h3',t(5)));
      const form=element('form'); box.append(form);
      function field(title,name,type='text') { const label=element('label',title),input=element('input'); input.name=name;input.type=type;label.append(input);form.append(label);return input; }
      const target=initial.is_admin?field(t(15),'agent_id'):null;
      if(target) { target.pattern='[0-9]+'; const load=element('button',t(16));load.type='button';form.append(load);load.onclick=async()=>{load.disabled=true;try{const r=await window.LiberterraAgentAccess.request('get_agent_registry',{agent_id:target.value});fill(r.registry);status.textContent='';}catch(_){status.textContent=t(20);}finally{load.disabled=false;}}; }
      const full=field(t(6),'full_name');full.required=true;full.minLength=5;full.maxLength=160;
      const cert=field(t(7),'certificate');cert.required=true;cert.maxLength=40;
      const url=field(t(8),'source','url');url.required=true;
      let state,confirm;
      if(initial.is_admin){const label=element('label',t(17));state=element('select');['pending','verified','rejected'].forEach((v,i)=>{const o=element('option',t(12+i));o.value=v;state.append(o);});label.append(state);form.append(label);confirm=field(t(18),'checked_valid','checkbox');confirm.parentElement.className='registry-confirm';}
      const save=element('button',t(initial.is_admin?19:9));save.type='submit';form.append(element('p',t(21)),save,status);
      function fill(r){full.value=r?.full_name||'';cert.value=r?.certificate||'';url.value=r?.source||source;if(state)state.value=r?.status||'pending';if(confirm)confirm.checked=false;status.textContent=r?t(12+['pending','verified','rejected'].indexOf(r.status)):'';}
      fill(initial.registry);
      form.addEventListener('input',e=>{if(confirm && e.target!==confirm)confirm.checked=false;});
      form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await window.LiberterraAgentAccess.request('set_agent_registry',{agent_id:target?.value||'',full_name:full.value,certificate:cert.value,source:url.value,status:state?.value||'pending',checked_valid:confirm?.checked===true});status.textContent=t(10);}catch(_){status.textContent=t(11);}finally{save.disabled=false;}};
    } catch(e) {
      if (!box.isConnected) return;
      if(e.code==='agent_not_found'){box.remove();return;}
      box.append(element('h3',t(5)));
      const lang=(document.documentElement.lang||'ru').split('-')[0];
      if(e.code==='unsupported_action'){
        const messages={ru:'Проверка реестра пока не подключена к этому способу входа. Статус сертификата не подтверждён.',en:'Registry verification is not yet available for this sign-in method. Certificate status is unconfirmed.',zh:'此登录方式暂不支持名册核验。证书状态尚未确认。'};
        status.textContent=messages[lang]||messages.ru;box.append(status);
        const link=element('a',t(3));link.href=source;link.target='_blank';link.rel='noopener noreferrer';box.append(link);
      }else{
        status.textContent=t(20);box.append(status);
        const retry=element('button',({ru:'Повторить загрузку',en:'Retry',zh:'重试'})[lang]||'Повторить загрузку');retry.type='button';
        retry.onclick=()=>{retry.disabled=true;editor(parent);};box.append(retry);
      }
    }
  }
  window.LiberterraRegistry={badge,editor,valid};
  function translateSort(){const select=document.querySelector('#agentRegistrySort');if(!select)return;const lang=(document.documentElement.lang||'ru').split('-')[0];const labels={ru:['Порядок специалистов','По количеству объявлений','Сначала с подтверждённым реестром','Только с подтверждённым реестром'],en:['Sort specialists','By listing count','Registry verified first','Registry verified only'],zh:['经纪人排序','按房源数量','已核实名册优先','仅已核实名册']}[lang]||[];if(!labels.length)return;document.querySelector('[data-registry-sort-label]').textContent=labels[0];Array.from(select.options).forEach((o,i)=>o.textContent=labels[i+1]);}
  document.addEventListener('DOMContentLoaded',translateSort);
  new MutationObserver(translateSort).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
