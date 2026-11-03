/* V20 body class and optional legacy wordmark. Existing public-v20.js owns theme and language. */
(() => {
  'use strict';
  function init() {
    document.body.classList.add('v20');
    document.querySelectorAll('.brand').forEach(brand => {
      if (brand.querySelector('.brand-wordmark')) return;
      const img = brand.querySelector('.brand-logo');
      if (img) img.style.display = 'none';
      if (!brand.textContent.trim().includes('Liberterra')) {
        const wordmark = document.createElement('span');
        wordmark.className = 'brand-wordmark';
        wordmark.textContent = 'Liberterra';
        brand.prepend(wordmark);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
