// Разметка нового каталога. Один файл: страница списка и страница объекта.
export const LOGO = `<svg viewBox="0 0 62 72" width="28" height="33" aria-hidden="true"><path fill="currentColor" d="M0 0H62V61.5L51.5 72H0Z"/><path fill="#fff" d="M10.5 10.5h9.6L10.5 20.1zM20.5 10.5h9.6L20.5 20.1zM10.5 20.75h9.6L10.5 30.35zM20.5 20.75h9.6L20.5 30.35zM10.5 31h9.6L10.5 40.6zM20.5 31h9.6L20.5 40.6zM10.5 41.25h9.6L10.5 50.85zM20.5 41.25h9.6L20.5 50.85zM30.5 41.25h9.6L30.5 50.85zM40.5 41.25h9.6L40.5 50.85zM10.5 51.5h9.6L10.5 61.1zM20.5 51.5h9.6L20.5 61.1zM30.5 51.5h9.6L30.5 61.1z"/></svg><b>Liberterra</b>`;

export const CSS = `
:root{--red:#BE2C28;--red-dark:#8F1918;--red-soft:#FBEFEF;--ink:#1F2328;--muted:#6B6560;--line:#E7E2E0;--paper:#fff;--ground:#F7F5F4;--ok:#18794A;--ok-soft:rgba(31,157,97,.13);--radius:14px}
@media (prefers-color-scheme:dark){:root{--ink:#F1F3F5;--muted:#AEB4BC;--line:#333A42;--paper:#20252C;--ground:#15181D;--red-soft:rgba(240,138,130,.14);--red:#E8564F;--red-dark:#F08A82}}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:400 16px/1.5 'Onest',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
header.top{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:1px solid var(--line)}
.top-in{display:flex;align-items:center;gap:16px;min-height:64px}
.brand{display:inline-flex;align-items:center;gap:9px;color:var(--red);text-decoration:none}
.brand b{font:650 21px/1 'Onest',sans-serif;letter-spacing:-.02em}
.top nav{margin-left:auto;display:flex;gap:4px;flex-wrap:wrap}
.top nav a{padding:8px 12px;border-radius:9px;font-size:15px;text-decoration:none;color:var(--muted)}
.top nav a:hover{background:var(--ground);color:var(--ink)}
.top nav a[aria-current]{color:var(--ink);font-weight:600}
h1{margin:26px 0 6px;font:650 clamp(26px,3.4vw,36px)/1.15 'Onest',sans-serif;letter-spacing:-.02em}
.lead{margin:0 0 22px;color:var(--muted);font-size:16px}
.panel{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end;margin-bottom:18px}
.tabs{display:flex;gap:6px;margin-bottom:14px}
.tab{appearance:none;border:1px solid var(--line);background:var(--paper);color:var(--muted);min-height:40px;padding:0 16px;border-radius:999px;font:500 15px 'Onest',sans-serif;cursor:pointer}
.tab[aria-pressed="true"]{background:var(--red);border-color:var(--red);color:#fff}
label.field{display:block;font-size:13px;color:var(--muted)}
label.field span{display:block;margin-bottom:5px}
input,select{width:100%;min-height:44px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);font:400 15px 'Onest',sans-serif}
input:focus-visible,select:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid var(--red-soft);outline-offset:2px}
.count{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:22px 0 12px}
.count b{font:600 18px 'Onest',sans-serif}
.count span{color:var(--muted);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
.card{display:flex;flex-direction:column;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;text-decoration:none;transition:border-color .15s,transform .15s}
.card:hover{border-color:var(--red);transform:translateY(-2px)}
.shot{position:relative;aspect-ratio:4/3;background:var(--ground);display:grid;place-items:center;overflow:hidden}
.shot img{width:100%;height:100%;object-fit:cover;display:block}
.shot .empty{color:var(--muted);font-size:13px;text-align:center;padding:0 16px}
.badge{position:absolute;left:10px;top:10px;padding:4px 10px;border-radius:999px;background:var(--paper);color:var(--ink);font:500 12px 'Onest',sans-serif;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.card-body{padding:14px 15px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.price{font:650 20px/1.1 'Onest',sans-serif;letter-spacing:-.01em}
.per{font-size:13px;color:var(--muted);font-weight:500}
.card h3{margin:0;font:600 15px/1.35 'Onest',sans-serif}
.meta{margin:0;color:var(--muted);font-size:14px}
.where{margin-top:auto;padding-top:10px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
.empty-state{padding:44px 24px;text-align:center;color:var(--muted)}
.empty-state b{display:block;margin-bottom:6px;color:var(--ink);font:600 17px 'Onest',sans-serif}
footer{margin:56px 0 36px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
footer a{color:var(--red)}
/* страница объекта */
.obj{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:24px;align-items:start;margin-top:18px}
.gallery{display:grid;gap:10px}
.gallery .main{aspect-ratio:16/10;border-radius:var(--radius);overflow:hidden;background:var(--paper);border:1px solid var(--line);display:grid;place-items:center}
.gallery .main img{width:100%;height:100%;object-fit:cover}
.thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}
.thumbs button{padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:none;cursor:pointer;aspect-ratio:4/3}
.thumbs button[aria-current="true"]{border-color:var(--red);border-width:2px}
.thumbs img{width:100%;height:100%;object-fit:cover;display:block}
.side{position:sticky;top:84px;display:grid;gap:14px}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:0}
.fact{border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.fact dt{color:var(--muted);font-size:12px;margin-bottom:2px}
.fact dd{margin:0;font:500 15px 'Onest',sans-serif}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 18px;border-radius:11px;border:1px solid var(--red);background:var(--red);color:#fff;font:600 15px 'Onest',sans-serif;text-decoration:none;cursor:pointer}
.btn:hover{background:var(--red-dark);border-color:var(--red-dark)}
.btn.ghost{background:var(--paper);color:var(--ink);border-color:var(--line)}
.btn.ghost:hover{background:var(--ground)}
.note{color:var(--muted);font-size:13px}
.desc{white-space:pre-wrap;line-height:1.6}
@media(max-width:860px){.obj{grid-template-columns:1fr}.side{position:static}}
@media(max-width:560px){.top-in{gap:10px}.brand b{display:none}.top nav{gap:0}.top nav a{padding:8px 9px;font-size:14px}}
`;

export function shell({ title, description, body, canonical }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;650;700&display=swap">
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap top-in">
  <a class="brand" href="/" aria-label="Liberterra, на главную">${LOGO}</a>
  <nav><a href="/?deal=sale">Купить</a><a href="/?deal=rent">Снять</a><a href="/agents">Агенты</a></nav>
</div></header>
<main class="wrap">${body}</main>
<footer class="wrap">Liberterra · Бишкек · <a href="mailto:info@liberterra.kg">info@liberterra.kg</a></footer>
</body></html>`;
}

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
