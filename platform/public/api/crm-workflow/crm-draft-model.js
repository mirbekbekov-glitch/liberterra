/* Local validation only. No persistence, identity, approval or signature authority. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LiberterraCrmDraftModel = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const text = value => String(value ?? '').trim();
  function number(value, label, max = Number.MAX_SAFE_INTEGER) {
    if (text(value) === '') throw new Error(`${label}: укажите число`);
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > max) throw new Error(`${label}: недопустимое значение`);
    return n;
  }
  function validateDeal(input) {
    const objectId = text(input.objectId), firstAgent = text(input.firstAgent), secondAgent = text(input.secondAgent);
    if (!objectId || !firstAgent || !secondAgent) throw new Error('Укажите объект и двух агентов');
    if (firstAgent === secondAgent) throw new Error('Агенты должны быть разными');
    const firstRole = text(input.firstRole), secondRole = text(input.secondRole), terms = text(input.terms);
    if (!firstRole || !secondRole || !terms) throw new Error('Укажите роли обоих агентов и условия');
    const firstShare = number(input.firstShare, 'Доля первого агента', 100);
    const secondShare = number(input.secondShare, 'Доля второго агента', 100);
    if (Math.abs(firstShare + secondShare - 100) > 0.000001) throw new Error('Сумма долей должна составлять 100%');
    if (!['percent', 'usd'].includes(input.commissionUnit)) throw new Error('Комиссия должна быть в % или USD');
    const commission = number(input.commission, 'Комиссия', input.commissionUnit === 'percent' ? 100 : Number.MAX_SAFE_INTEGER);
    return Object.freeze({objectId,firstAgent,secondAgent,firstRole,secondRole,firstShare,secondShare,terms,
      commissionUnit:input.commissionUnit,commission,
      approvals:Object.freeze({first:'not_requested',second:'not_requested'}),documentStatus:'not_attached',status:'local_draft'});
  }
  function calendarEvent(input) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text(input.startsAt))) throw new Error('Укажите дату и время');
    const date = new Date(input.startsAt);
    if (Number.isNaN(date.getTime())) throw new Error('Некорректная дата');
    const local = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    if (local !== input.startsAt) throw new Error('Такая дата или местное время не существует');
    if (!text(input.title)) throw new Error('Укажите название события');
    return Object.freeze({title:text(input.title),startsAt:date.toISOString(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,status:'local_draft'});
  }
  function requestDraft(input) {
    const clientId=text(input.clientId),city=text(input.city),district=text(input.district);
    if (!clientId || !city || !district) throw new Error('Укажите клиента, город и район');
    const budget=number(input.budget,'Бюджет');
    if (!['USD','KGS'].includes(input.currency)) throw new Error('Укажите валюту');
    return Object.freeze({clientId,city,district,budget,currency:input.currency,notes:text(input.notes),status:'local_draft'});
  }
  function createDraftSession() {
    const requests = new Map();
    return Object.freeze({
      addRequest(input) {
        const draft=requestDraft(input);
        // Exact draft dedupe only: no claim of cross-device/server idempotency.
        const key=JSON.stringify(draft);
        if(requests.has(key)) return {created:false,draft:requests.get(key)};
        requests.set(key,draft); return {created:true,draft};
      },
      clear(){requests.clear();}
    });
  }
  async function persist() { throw new Error('Серверное сохранение нового CRM не подключено. Данные не отправлены.'); }
  return Object.freeze({validateDeal,calendarEvent,requestDraft,createDraftSession,persist});
});
