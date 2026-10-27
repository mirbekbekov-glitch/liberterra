/* Informational conversion only. Never changes stored prices or filters. */
(() => {
  function parsePrice(raw) {
    const text = String(raw || "").trim();
    const usd = /\$|\bUSD\b/i.test(text);
    const kgs = /сом|\bKGS\b/i.test(text);
    if (usd === kgs) return null;
    const cleaned = text.replace(/\$|\bUSD\b|сом|\bKGS\b/gi, "").trim();
    const parts = cleaned.split(/\s*[–—-]\s*/);
    if (!parts.length || parts.length > 2) return null;
    const values = parts.map(part => {
      // Three digits after a dot/comma are ambiguous: do not guess thousands.
      if (!/^(?:\d+|\d{1,3}(?:[\s\u00a0]\d{3})+)(?:[.,]\d{1,2})?$/.test(part.trim())) return NaN;
      return Number(part.replace(/\s/g, "").replace(",", "."));
    });
    if (values.some(value => !Number.isFinite(value) || value <= 0) || values[1] < values[0]) return null;
    // A shorthand like 20–30 000 may mean 20 000–30 000. Do not guess.
    if (values.length === 2 && values[0] < 1000 && values[1] / values[0] >= 100) return null;
    return { currency: usd ? "USD" : "KGS", values };
  }
  function convertedPrice(raw, rate) {
    const parsed = parsePrice(raw);
    if (!parsed || !Number.isFinite(rate) || rate <= 0) return "";
    const format = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
    const values = [...new Set(parsed.values.map(value => format.format(parsed.currency === "USD" ? value * rate : value / rate)))];
    return `≈ ${parsed.currency === "KGS" ? "$" : ""}${values.join("–")}${parsed.currency === "USD" ? " сом" : ""}`;
  }
  if (typeof module !== "undefined") module.exports = { parsePrice, convertedPrice };
  if (typeof document === "undefined") return;
  let rateData;
  let pending;
  function update() {
    if (!rateData) return;
    document.querySelectorAll("[data-fx-price]:not([data-fx-done])").forEach(node => {
      node.dataset.fxDone = "1";
      const text = convertedPrice(node.dataset.fxPrice, rateData.rate);
      if (!text) return;
      const line = document.createElement("details");
      line.className = "dual-price";
      const summary = document.createElement("summary");
      summary.textContent = `${text}${node.dataset.fxPer ? ` ${node.dataset.fxPer}` : ""} ⓘ`;
      const explanation = document.createElement("span");
      explanation.className = "dual-price-note";
      const lang = document.documentElement.lang;
      explanation.textContent = lang === "en" ? `Indicative · NBKR · ${rateData.date} · 1 USD = ${rateData.rate} KGS` : lang === "zh" ? `参考汇率 · NBKR · ${rateData.date} · 1 USD = ${rateData.rate} KGS` : `Справочно · НБКР · ${rateData.date} · 1 USD = ${rateData.rate} сом`;
      line.append(summary, explanation);
      line.addEventListener("click", event => event.stopPropagation());
      line.addEventListener("keydown", event => event.stopPropagation());
      node.append(line);
    });
  }
  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = null; update(); });
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  fetch("/api/exchange-rate", { signal: AbortSignal.timeout(8000) })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if (data?.ok && Number.isFinite(data.rate) && data.rate > 0) { rateData = data; update(); } })
    .catch(() => {});
})();
