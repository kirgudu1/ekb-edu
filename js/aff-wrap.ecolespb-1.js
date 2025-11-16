/* /js/aff-wrap.ncpo.js
 * Авто-обёртка всех ссылок на *.ncpo.ru → в трекинговый формат edpmetric.
 * Достаточно положить файл и подключить 1 раз — дальше всё работает само
 * (включая динамически добавленные ссылки).
 */

(function(){
  'use strict';

  // === НАСТРОЙКИ ===
  // База трекинговой ссылки
  const WRAP_BASE   = 'https://view.edpmetric.com/click';

  // Параметры оффера
  const OFFER_ID    = '97';   // o=97
  const AFF_ID      = '913';  // a=913

  // sub_id1 — домен лендинга (можно захардкодить строкой, если нужно строго фиксированное значение)
  const SUB1_STATIC = location.hostname; // пример: ekb-edu.vercel.app

  // Домены для обёртки (если нужны только голый ncpo.ru — можно оставить только === 'ncpo.ru')
  const MATCH_HOST_PART = 'ncpo.ru';

  // атрибут-маркер, чтобы не оборачивать повторно
  const MARK_ATTR = 'data-aff-ncpo';

  // === УТИЛИТЫ ===
  const enc = encodeURIComponent;

  function isWrapped(url){
    if (!url) return false;
    return url.startsWith(WRAP_BASE);
  }

  function isNcpoDomain(hostname){
    if (!hostname) return false;
    // ncpo.ru или любой поддомен *.ncpo.ru
    return hostname === MATCH_HOST_PART || hostname.endsWith('.' + MATCH_HOST_PART);
  }

  function needsWrap(url){
    if (!url) return false;
    try {
      const u = new URL(url, location.href);
      // только http(s)
      if (!/^https?:$/i.test(u.protocol)) return false;
      // уже наш редиректор
      if (isWrapped(u.href)) return false;
      // подходит по домену
      return isNcpoDomain(u.hostname);
    } catch(e){
      return false;
    }
  }

  function buildWrappedHref(originalHref){
    // Пример:
    // https://view.edpmetric.com/click?o=97&a=913&sub_id1=ekb-edu.vercel.app&deep_link=https%3A%2F%2Fncpo.ru%2F...
    const params = [
      'o='         + enc(OFFER_ID),
      'a='         + enc(AFF_ID),
      'sub_id1='   + enc(SUB1_STATIC),
      'deep_link=' + enc(originalHref)
    ];
    return WRAP_BASE + '?' + params.join('&');
  }

  function wrapAnchor(a){
    if (!a || a.hasAttribute(MARK_ATTR)) return;

    const href = a.getAttribute('href');
    if (!href || !needsWrap(href)) return;

    const absoluteHref = new URL(href, location.href).href;
    const wrapped = buildWrappedHref(absoluteHref);
    a.setAttribute('href', wrapped);
    a.setAttribute(MARK_ATTR, '1');

    // Рекомендуемые атрибуты для платных/партнёрских ссылок
    const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    ['nofollow','noopener','noreferrer','sponsored'].forEach(flag=>{
      if (!rel.includes(flag)) rel.push(flag);
    });
    a.setAttribute('rel', rel.join(' '));
  }

  function scan(root){
    const anchors = (root || document).querySelectorAll('a[href]');
    anchors.forEach(wrapAnchor);
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ()=>scan(document));
  } else {
    scan(document);
  }

  // Обработка динамически появляющихся ссылок (SPA, AJAX, виджеты и т.п.)
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(node=>{
        if (node.nodeType !== 1) return;
        if (node.tagName === 'A') {
          wrapAnchor(node);
        } else {
          scan(node);
        }
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

})();
