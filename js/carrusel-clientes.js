/**
 * ============================================================
 * CARRUSEL SOCIAL INFINITO  (filas de clientes y envíos)
 * ============================================================
 * - Auto-avance continuo en loop (sin cortes: el track tiene las
 *   imágenes duplicadas, y al llegar a la mitad se reposiciona).
 * - Arrastrable con el dedo (touch) y con el mouse.
 * - data-dir="derecha"  → las imágenes viajan hacia la derecha.
 *   data-dir="izquierda"→ las imágenes viajan hacia la izquierda.
 *
 * DÓNDE VA: guardá este archivo como js/carrusel-clientes.js
 * (ya está enlazado en index.html antes de </body>).
 * ============================================================
 */
(function () {
  const VELOCIDAD = 0.5; // px por frame (~30px/s). Subilo/bajalo a gusto.

  function initCarrusel(carrusel) {
    const track = carrusel.querySelector(".carrusel-social__track");
    if (!track) return;

    const dir = carrusel.getAttribute("data-dir") === "izquierda" ? 1 : -1;
    let pausado = false;
    let interaccion = false;

    // El ancho de UNA mitad (el set original, sin el duplicado)
    function mitad() {
      return track.scrollWidth / 2;
    }

    // Posición inicial: para dirección "derecha" arrancamos en la mitad,
    // así hay contenido a la izquierda para revelar al movernos.
    function posicionInicial() {
      carrusel.scrollLeft = dir === -1 ? 0 : mitad();
    }

    // Reposicionamiento sin salto visible (loop infinito)
    function normalizar() {
      const m = mitad();
      if (carrusel.scrollLeft >= m * 1.5) {
        carrusel.scrollLeft -= m;
      } else if (carrusel.scrollLeft <= m * 0.5) {
        carrusel.scrollLeft += m;
      }
    }

    function tick() {
      if (!pausado && !interaccion) {
        carrusel.scrollLeft += VELOCIDAD * (dir === -1 ? 1 : -1);
        normalizar();
      }
      requestAnimationFrame(tick);
    }

    // Pausa cuando el usuario interactúa (arrastra/toca), reanuda al soltar
    function pausar() { interaccion = true; }
    function reanudar() {
      // pequeño respiro para no reanudar en pleno gesto de inercia
      setTimeout(function () { interaccion = false; normalizar(); }, 800);
    }

    carrusel.addEventListener("touchstart", pausar, { passive: true });
    carrusel.addEventListener("touchend", reanudar, { passive: true });
    carrusel.addEventListener("mousedown", pausar);
    window.addEventListener("mouseup", reanudar);
    carrusel.addEventListener("scroll", normalizar, { passive: true });

    // Arrastre con mouse (en desktop el overflow no arrastra solo)
    let arrastrando = false, xInicial = 0, scrollInicial = 0;
    carrusel.addEventListener("mousedown", function (e) {
      arrastrando = true;
      xInicial = e.pageX;
      scrollInicial = carrusel.scrollLeft;
    });
    window.addEventListener("mousemove", function (e) {
      if (!arrastrando) return;
      e.preventDefault();
      carrusel.scrollLeft = scrollInicial - (e.pageX - xInicial);
    });
    window.addEventListener("mouseup", function () { arrastrando = false; });

    // Pausa al pasar el mouse por encima (desktop)
    carrusel.addEventListener("mouseenter", function () { pausado = true; });
    carrusel.addEventListener("mouseleave", function () { pausado = false; });

    // Arranque (esperamos a que carguen las imágenes para medir bien)
    function arrancar() {
      posicionInicial();
      requestAnimationFrame(tick);
    }
    if (document.readyState === "complete") {
      arrancar();
    } else {
      window.addEventListener("load", arrancar);
    }
  }

  function init() {
    document.querySelectorAll("[data-carrusel]").forEach(initCarrusel);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();