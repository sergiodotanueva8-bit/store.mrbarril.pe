/**
 * ============================================================
 * CARRUSEL SOCIAL INFINITO (filas de clientes y envíos)
 * ============================================================
 * El MOVIMIENTO lo hace la animación CSS (ver mejoras_landing.css):
 * el track tiene las imágenes duplicadas y se anima a -50% en loop,
 * así que se mueve siempre, suave y sin cortes.
 *
 * Este JS solo agrega un detalle: PAUSAR la fila mientras el usuario
 * la toca (para que pueda mirar una foto), y reanudar al soltar.
 *
 * DÓNDE VA: js/carrusel-clientes.js  (ya enlazado en index.html)
 * ============================================================
 */
(function () {
  function init() {
    var carruseles = document.querySelectorAll("[data-carrusel]");
    carruseles.forEach(function (c) {
      // Pausa mientras se toca; reanuda un instante después de soltar
      c.addEventListener("touchstart", function () {
        c.classList.add("pausado");
      }, { passive: true });

      c.addEventListener("touchend", function () {
        setTimeout(function () { c.classList.remove("pausado"); }, 1200);
      }, { passive: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();