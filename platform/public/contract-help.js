(() => {
  const form = document.querySelector('#contractHelpForm');
  const result = document.querySelector('#contractHelpResult');
  const button = form.querySelector('[type="submit"]');
  const t = text => window.LiberterraI18n?.t(text) || text;
  let busy = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true; button.disabled = true; result.hidden = true;
    try {
      if (!window.LiberterraUserAccess) throw new Error('registration_required');
      await window.LiberterraUserAccess.require();
      const data = Object.fromEntries(new FormData(form));
      data.consent = form.elements.consent.checked;
      data.telegram_init_data = window.Telegram?.WebApp?.initData || '';
      button.textContent = t('Отправляем…');
      const response = await fetch('/api/contract-help', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(30000) });
      const payload = await response.json();
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || 'delivery_unconfirmed');
      result.textContent = t('Заявка передана администратору. С вами свяжутся для согласования задачи, стоимости и срока.') + ' № ' + payload.id;
      form.reset();
    } catch (error) {
      result.textContent = t(error.message === 'registration_required' ? 'Откройте сайт через Telegram и завершите регистрацию.' : 'Доставка не подтверждена. Не отправляйте повторно сразу: сначала уточните получение у поддержки.');
    } finally {
      busy = false; button.disabled = false; button.textContent = t('Получить помощь'); result.hidden = false;
    }
  });
})();
