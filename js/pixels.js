/**
 * ============================================================
 * PIXELS DE META Y TIKTOK (opcional)
 * ============================================================
 * Si configuraste META_PIXEL_ID o TIKTOK_PIXEL_ID en config.js,
 * este archivo inyecta el código oficial de cada pixel y expone
 * una función `dispararEvento()` para mandar eventos estándar
 * (PageView, AddToCart, InitiateCheckout, Purchase, etc.)
 *
 * Si dejaste esos campos vacíos, este archivo simplemente no
 * hace nada: no rompe ni ensucia la consola.
 * ============================================================
 */

const Pixels = (function () {

  function inicializarMeta() {
    if (!CONFIG.META_PIXEL_ID) return;

    /* eslint-disable */
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq("init", CONFIG.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function inicializarTikTok() {
    if (!CONFIG.TIKTOK_PIXEL_ID) return;

    /* eslint-disable */
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { var e = ttq._i[t] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
      ttq.load = function (e, n) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var o = document.createElement("script");
        o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=" + t;
        var a = document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(o, a)
      };
      ttq.load(CONFIG.TIKTOK_PIXEL_ID);
      ttq.page();
    }(window, document, "ttq");
    /* eslint-enable */
  }

  function inicializar() {
    inicializarMeta();
    inicializarTikTok();
  }

  /**
   * Dispara un evento estándar en los pixels configurados.
   * nombreMeta y nombreTikTok pueden ser distintos porque cada
   * plataforma nombra sus eventos estándar de forma diferente.
   */
  function identificarUsuario(datos) {
    try {
      if (CONFIG.TIKTOK_PIXEL_ID && window.ttq && datos && datos.telefono) {
        window.ttq.identify({
          phone_number: datos.telefono,
        });
      }
    } catch (e) {
      console.warn("[Pixel TikTok] No se pudo identificar usuario:", e);
    }
  }

  function dispararEvento(nombreMeta, nombreTikTok, datos) {
    try {
      if (CONFIG.META_PIXEL_ID && window.fbq) {
        window.fbq("track", nombreMeta, datos || {});
      }
    } catch (e) {
      console.warn("[Pixel Meta] No se pudo disparar evento:", nombreMeta, e);
    }

    try {
      if (CONFIG.TIKTOK_PIXEL_ID && window.ttq) {
        window.ttq.track(nombreTikTok, datos || {});
      }
    } catch (e) {
      console.warn("[Pixel TikTok] No se pudo disparar evento:", nombreTikTok, e);
    }
  }

  return {
    inicializar,
    dispararEvento,
    identificarUsuario,
  };
})();