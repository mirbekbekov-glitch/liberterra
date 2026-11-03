(() => {
  "use strict";
  const validUrl = (value) => /^https:\/\/drive\.google\.com\/thumbnail\?id=[A-Za-z0-9_-]{20,100}&sz=w512$/.test(String(value || ""));
  function show(node, url, name) {
    if (!node) return;
    node.textContent = String(name || "L").trim().slice(0, 1).toUpperCase();
    node.classList.add("agent-photo-avatar");
    if (!validUrl(url)) return;
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Фото агента";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => img.remove(), { once: true });
    node.append(img);
  }
  async function prepare(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      throw new Error("Выберите JPG, PNG или WebP размером до 10 МБ.");
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      image.src = url;
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("Фото слишком большое. Выберите уменьшенную копию.");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 512, 512);
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
      for (const quality of [0.85, 0.7, 0.5, 0.3]) {
        const result = canvas.toDataURL("image/jpeg", quality);
        if (result.split(",")[1].length <= 200000) return result;
      }
      throw new Error("Не удалось сжать фото. Выберите другое изображение.");
    } finally { URL.revokeObjectURL(url); }
  }
  function editor(container, user, onSaved) {
    if (!user.can_edit_photo) return;
    const panel = document.createElement("section");
    panel.className = "agent-photo-editor";
    panel.innerHTML = '<p>Фото будет видно всем посетителям сайта. JPG, PNG или WebP до 10 МБ.</p><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Выбрать фото агента"><div class="agent-photo-preview" hidden><img alt="Предпросмотр квадратного фото"><p>Будет опубликована эта квадратная обрезка.</p></div><button type="button" data-save hidden>Сохранить фото</button><button type="button" data-cancel hidden>Отмена</button><button type="button" data-remove>Удалить фото</button><p role="status" aria-live="polite"></p>';
    container.append(panel);
    const input = panel.querySelector("input");
    const preview = panel.querySelector(".agent-photo-preview");
    const save = panel.querySelector("[data-save]");
    const cancel = panel.querySelector("[data-cancel]");
    const remove = panel.querySelector("[data-remove]");
    const status = panel.querySelector('[role="status"]');
    remove.hidden = !user.avatar_url;
    let prepared = "", busy = false, selection = 0;
    function reset() { prepared = ""; input.value = ""; preview.hidden = save.hidden = cancel.hidden = true; }
    function disable(value) { busy = value; panel.querySelectorAll("button,input").forEach(n => { n.disabled = value; }); }
    input.addEventListener("change", async () => {
      const version = ++selection;
      prepared = ""; save.hidden = true;
      if (!input.files[0]) return reset();
      disable(true); status.textContent = "Подготавливаем фото…";
      try {
        const result = await prepare(input.files[0]);
        if (version !== selection) return;
        prepared = result;
        preview.querySelector("img").src = prepared;
        preview.hidden = save.hidden = cancel.hidden = false;
        status.textContent = "Проверьте обрезку и нажмите «Сохранить фото».";
      } catch (error) { reset(); status.textContent = error.message; }
      finally { disable(false); }
    });
    cancel.addEventListener("click", () => { reset(); status.textContent = "Изменения отменены."; });
    async function send(deleting) {
      if (busy || (!deleting && !prepared)) return;
      if (deleting && !window.confirm("Удалить публичное фото агента?")) return;
      disable(true); status.textContent = "⏳ Сохраняем…";
      try {
        const result = await window.LiberterraAgentAccess.request("set_agent_photo", deleting ? { remove: true } : { photo_base64: prepared.split(",")[1] });
        user.avatar_url = result.avatar_url || "";
        reset(); remove.hidden = !user.avatar_url;
        try { sessionStorage.removeItem("liberterra-profile-view"); } catch (_) {}
        onSaved(user.avatar_url);
        status.textContent = deleting ? "Фото удалено." : "Фото сохранено.";
      } catch (_) {
        status.textContent = "Не удалось подтвердить сохранение. Обновите профиль и проверьте фото перед повторной попыткой.";
      } finally { disable(false); }
    }
    save.addEventListener("click", () => send(false));
    remove.addEventListener("click", () => send(true));
  }
  window.LiberterraAgentPhoto = { show, editor, prepare, validUrl };
})();
