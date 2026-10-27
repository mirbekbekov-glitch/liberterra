(() => {
  "use strict";
  const text = value => String(value ?? "").trim();

  // Presentation only. Never infer a different currency, amount or price period.
  function price(value) {
    return text(value).replace(/(^|\s)(сом|USD|KGS)(?:\s+\2)+(?=\s|$)/gi, "$1$2").replace(/\$(\d{4,9})(?![\d.,])/g, (_, digits) => `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`);
  }

  function floor(value) {
    if (/^24\s*\/\s*7\s*этаж$/i.test(text(value))) return "";
    // Only collapse an identical repeated total, e.g. 13/14 этаж/14 этаж.
    return text(value).replace(/^(\d+)\s*\/\s*(\d+)\s*этаж(?:\s*\/\s*\2\s*этаж)+$/i, "$1/$2 этаж");
  }

  function period(value) {
    return text(value)
      .replace(/^(?:\s*\/\s*){2,}/, "/ ")
      .replace(/\/\s*м[²2]\s*\/\s*мес(?:\s*\/\s*мес)+$/i, "/ м²/мес")
      .replace(/\/\s*мес(?:\s*\/\s*мес)+$/i, "/ мес");
  }

  function title(value) {
    const source = text(value);
    if (/^0-комн\.,\s*участок$/i.test(source)) return "Участок";
    if (/^офис\s*:\s*(?:любая|офис)$/i.test(source)) return "Офис";
    const parts = source.split(/\s*[:·|]\s*/).filter(Boolean);
    return parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase() ? parts[0] : source;
  }

  // Website submissions historically stored raw form values in the public
  // catalog. Format only those records; legacy listings keep their wording.
  function websiteFields(row) {
    const original = {
      title: title(row.title),
      area: text(row.area),
      floor: floor(row.floor),
      per: period(row.per),
    };
    if (!/^site-[0-9a-f-]+$/i.test(text(row.id))) return original;

    const rooms = text(row.rooms);
    if (/^\d{1,2}$/.test(rooms) && Number(rooms) > 0 && /^(?:Квартира|Дом|Комната)$/i.test(original.title)) {
      original.title = `${rooms}-комн., ${original.title.toLowerCase()}`;
    }
    if (/^\d+(?:[.,]\d+)?$/.test(original.area)) original.area += " м²";

    const total = text(row.total_floors);
    if (/^\d{1,3}$/.test(original.floor)) {
      original.floor += /^\d{1,3}$/.test(total) ? `/${total} этаж` : " этаж";
    } else if (/^\d{1,3}\s*\/\s*\d{1,3}$/.test(original.floor)) {
      original.floor += " этаж";
    }

    const rent = text(row.deal).toLowerCase() === "аренда";
    if (!original.per && rent) original.per = "/ мес";
    else if (/^\/?\s*м[²2]$/i.test(original.per)) original.per = rent ? "/ м²/мес" : "/ м²";
    return original;
  }

  function priceParts(amount, currency, basis, period) {
    const cleanAmount = text(amount).replace(/\s+/g, "").replace(",", ".");
    if (!/^\d+(?:\.\d{1,2})?$/.test(cleanAmount) || Number(cleanAmount) <= 0) return null;
    if (!["сом", "$"].includes(text(currency))) return null;
    if (!["object", "m2"].includes(text(basis))) return null;
    if (!["none", "month"].includes(text(period))) return null;
    return { amount: cleanAmount, currency: text(currency), basis: text(basis), period: text(period) };
  }

  function hasConflictingCurrency(value) {
    const source = text(value);
    return /\$|\bUSD\b/i.test(source) && /сом|\bKGS\b/i.test(source);
  }

  window.LiberterraListingFormat = Object.freeze({ hasConflictingCurrency, price, period, floor, title, websiteFields, priceParts });
})();
