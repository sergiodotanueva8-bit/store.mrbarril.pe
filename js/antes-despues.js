/**
 * ============================================================
 * SLIDER ANTES / DESPUÉS — lógica de arrastre
 * ============================================================
 * Funciona con dedo (touch) y con mouse. Al mover, recorta la
 * imagen "antes" y mueve el divisor. Sin librerías externas.
 *
 * DÓNDE VA: pegá este archivo como js/antes-despues.js y enlazalo
 * en el HTML antes de cerrar </body>:
 *   <script src="js/antes-despues.js"></script>
 * (o pegá el contenido dentro de landing.js).
 * ============================================================
 */
(function () {
  function initBA() {
    const slider = document.getElementById("ba-slider");
    const antes = document.getElementById("ba-antes");
    const divisor = document.getElementById("ba-divisor");
    if (!slider || !antes || !divisor) return;

    let arrastrando = false;

    function fijarPorcentaje(pct) {
      // Limitar entre 2% y 98% para que siempre se vea algo de ambas
      const p = Math.max(2, Math.min(98, pct));
      antes.style.clipPath = "inset(0 " + (100 - p) + "% 0 0)";
      divisor.style.left = p + "%";
    }

    function posicionDesdeEvento(clientX) {
      const rect = slider.getBoundingClientRect();
      const x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function alMover(clientX) {
      if (!arrastrando) return;
      fijarPorcentaje(posicionDesdeEvento(clientX));
    }

    // ── Mouse ──
    slider.addEventListener("mousedown", function (e) {
      arrastrando = true;
      slider.classList.remove("ba--hint");
      fijarPorcentaje(posicionDesdeEvento(e.clientX));
    });
    window.addEventListener("mousemove", function (e) {
      alMover(e.clientX);
    });
    window.addEventListener("mouseup", function () {
      arrastrando = false;
    });

    // ── Touch ──
    slider.addEventListener("touchstart", function (e) {
      arrastrando = true;
      slider.classList.remove("ba--hint");
      fijarPorcentaje(posicionDesdeEvento(e.touches[0].clientX));
    }, { passive: true });
    slider.addEventListener("touchmove", function (e) {
      if (!arrastrando) return;
      fijarPorcentaje(posicionDesdeEvento(e.touches[0].clientX));
    }, { passive: true });
    slider.addEventListener("touchend", function () {
      arrastrando = false;
    });

    // Posición inicial + animación de pista cuando entra en pantalla
    fijarPorcentaje(50);
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            slider.classList.add("ba--hint");
            obs.unobserve(slider);
          }
        });
      }, { threshold: 0.4 });
      obs.observe(slider);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBA);
  } else {
    initBA();
  }
})();