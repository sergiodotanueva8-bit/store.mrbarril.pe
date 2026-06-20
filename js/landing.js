/**
 * ============================================================
 * LANDING — lógica principal de la página
 * ============================================================
 * Maneja: galería de imágenes/video, selección de cantidad,
 * contador de stock dinámico, barra fija inferior, y registro
 * de eventos de analytics básicos.
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", function () {

  Pixels.inicializar();
  SupabaseCliente.registrarEvento("page_view");

  // ----------------------------------------------------------
  // GALERÍA: carrusel táctil (scroll-snap) con dots + miniaturas
  // ----------------------------------------------------------
  const carrusel = document.getElementById("galeria-carrusel");
  const slides = document.querySelectorAll(".galeria__slide");
  const dots = document.querySelectorAll(".galeria__dot");
  const miniaturas = document.querySelectorAll(".miniatura[data-indice]");

  function irASlide(indice) {
    if (!carrusel || !slides[indice]) return;
    carrusel.scrollTo({ left: slides[indice].offsetLeft, behavior: "smooth" });
    marcarActivo(indice);
  }

  function marcarActivo(indice) {
    dots.forEach(function (dot) {
      dot.classList.toggle("activo", parseInt(dot.getAttribute("data-indice"), 10) === indice);
    });
    miniaturas.forEach(function (m) {
      m.classList.toggle("activa", parseInt(m.getAttribute("data-indice"), 10) === indice);
    });
  }

  // Clicks en dots y miniaturas mueven el carrusel
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      irASlide(parseInt(dot.getAttribute("data-indice"), 10));
    });
  });

  miniaturas.forEach(function (miniatura) {
    miniatura.addEventListener("click", function () {
      irASlide(parseInt(miniatura.getAttribute("data-indice"), 10));
    });
  });

  // Al deslizar con el dedo, detecta en qué slide quedó y actualiza dots/miniaturas
  if (carrusel) {
    let timeoutScroll;
    carrusel.addEventListener("scroll", function () {
      clearTimeout(timeoutScroll);
      timeoutScroll = setTimeout(function () {
        const indiceActual = Math.round(carrusel.scrollLeft / carrusel.clientWidth);
        marcarActivo(indiceActual);
      }, 80);
    });
  }

  // ----------------------------------------------------------
  // SELECCIÓN DE CANTIDAD (1, 2 o 3 unidades) y cálculo de precio
  // ----------------------------------------------------------
  const opcionesCantidad = document.querySelectorAll(".opcion-cantidad[data-cantidad]");
  let cantidadSeleccionada = 1;

  function obtenerPrecioUnitarioPorCantidad(cantidad) {
    if (cantidad === 2) return CONFIG.PRECIO_X2_UNIDAD;
    if (cantidad === 3) return CONFIG.PRECIO_X3_UNIDAD;
    return CONFIG.PRECIO_REGULAR;
  }

  opcionesCantidad.forEach(function (opcion) {
    opcion.addEventListener("click", function () {
      opcionesCantidad.forEach(function (o) { o.classList.remove("seleccionada"); });
      opcion.classList.add("seleccionada");
      cantidadSeleccionada = parseInt(opcion.getAttribute("data-cantidad"), 10) || 1;
      window.cantidadSeleccionadaGlobal = cantidadSeleccionada;

      // ---- Sincronizar barra fija inferior ----
      actualizarBarraFija(cantidadSeleccionada);
    });
  });

  window.cantidadSeleccionadaGlobal = cantidadSeleccionada;

  // ----------------------------------------------------------
  // BARRA FIJA: actualiza precio y nombre según cantidad
  // ----------------------------------------------------------
  function actualizarBarraFija(cantidad) {
    var precioUnit = obtenerPrecioUnitarioPorCantidad(cantidad);
    var total = precioUnit * cantidad;

    // Nombre del producto
    var nombreEl = document.getElementById("barra-fija-nombre");
    if (nombreEl) {
      if (cantidad === 1) {
        nombreEl.textContent = CONFIG.PRODUCTO_NOMBRE;
      } else {
        nombreEl.textContent = CONFIG.PRODUCTO_NOMBRE + " x" + cantidad;
      }
    }

    // Precio
    var precioEl = document.getElementById("barra-fija-precio");
    if (precioEl) {
      precioEl.textContent = "S/ " + total.toFixed(2);
    }

    // Badge descuento
    var badgeEl = document.getElementById("barra-fija-badge");
    if (badgeEl) {
      if (cantidad === 2) {
        badgeEl.textContent = "-20 SOLES";
        badgeEl.style.display = "inline";
      } else if (cantidad === 3) {
        badgeEl.textContent = "-30 SOLES";
        badgeEl.style.display = "inline";
      } else {
        badgeEl.textContent = "-25%";
        badgeEl.style.display = "inline";
      }
    }
  }

  // Inicializar barra fija con valores por defecto
  actualizarBarraFija(cantidadSeleccionada);

  // ----------------------------------------------------------
  // CONTADOR DE STOCK — 100% SIMULADO (decorativo, genera urgencia)
  // ----------------------------------------------------------
  // Ya NO se lee de Supabase. Arranca en STOCK_SIMULADO_INICIAL y
  // va variando solo de a poquitos (nunca saltos bruscos, nunca
  // llega a 0). Cada visitante ve su propia simulación independiente.
  // ----------------------------------------------------------
  const STOCK_SIMULADO_INICIAL = 32;
  const STOCK_SIMULADO_MINIMO = 6;   // nunca baja de aquí (genera urgencia sin asustar)
  const STOCK_SIMULADO_MAXIMO = 32;  // nunca sube más que el inicial
  const STOCK_MAXIMO_VISUAL = STOCK_SIMULADO_MAXIMO; // referencia para el ancho de la barra

  let stockSimuladoActual = STOCK_SIMULADO_INICIAL;
  // Sesgo hacia abajo: la mayoría de los movimientos restan, generando
  // la sensación de "se está agotando", pero a veces sube un poco
  // (simulando que llegó reposición o que alguien canceló).
  let tendenciaBajando = true;

  function pintarStock(unidades) {
    const porcentaje = Math.max(5, Math.min(100, (unidades / STOCK_MAXIMO_VISUAL) * 100));

    document.querySelectorAll("[data-stock-texto]").forEach(function (el) {
      el.textContent = "¡SOLO QUEDAN " + unidades + " UNIDADES!";
    });

    document.querySelectorAll("[data-stock-numero]").forEach(function (el) {
      el.textContent = unidades;
    });

    document.querySelectorAll("[data-stock-barra]").forEach(function (el) {
      el.style.width = porcentaje + "%";
    });
  }

  function siguientePasoStock() {
    // Si toca el piso o el techo, invierte la tendencia.
    if (stockSimuladoActual <= STOCK_SIMULADO_MINIMO) tendenciaBajando = false;
    if (stockSimuladoActual >= STOCK_SIMULADO_MAXIMO) tendenciaBajando = true;

    // 75% de probabilidad de seguir la tendencia actual, 25% de
    // quedarse igual ese tick (para que no se sienta mecánico).
    const azar = Math.random();
    let delta = 0;
    if (azar < 0.75) {
      delta = tendenciaBajando ? -1 : 1;
    }
    // Pequeña chance de revertir la tendencia incluso sin tocar los límites,
    // simulando variación natural (alguien compró, llegó reposición, etc.)
    if (Math.random() < 0.08) tendenciaBajando = !tendenciaBajando;

    stockSimuladoActual = Math.max(
      STOCK_SIMULADO_MINIMO,
      Math.min(STOCK_SIMULADO_MAXIMO, stockSimuladoActual + delta)
    );

    pintarStock(stockSimuladoActual);
  }

  function iniciarContadorStockSimulado() {
    pintarStock(stockSimuladoActual);
    // Cambia cada 7-15 segundos (aleatorio), para que no se sienta
    // como un timer mecánico de intervalo fijo.
    function programarSiguiente() {
      const espera = 7000 + Math.random() * 8000;
      setTimeout(function () {
        siguientePasoStock();
        programarSiguiente();
      }, espera);
    }
    programarSiguiente();
  }

  iniciarContadorStockSimulado();

  // ----------------------------------------------------------
  // BARRA FIJA INFERIOR: aparece después de hacer scroll
  // ----------------------------------------------------------
  const barraFija = document.getElementById("barra-fija-inferior");
  const seccionProducto = document.getElementById("seccion-producto");

  if (barraFija && seccionProducto) {
    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) {
            barraFija.classList.add("visible");
          } else {
            barraFija.classList.remove("visible");
          }
        });
      },
      { threshold: 0 }
    );
    observador.observe(seccionProducto);
  }

  // ----------------------------------------------------------
  // CONTADOR "X personas están viendo este producto" (variación leve)
  // ----------------------------------------------------------
  const elementoViendo = document.querySelector("[data-personas-viendo]");
  if (elementoViendo) {
    setInterval(function () {
      const base = 18;
      const variacion = Math.floor(Math.random() * 8); // entre 0 y 7
      elementoViendo.textContent = (base + variacion) + " personas están viendo este producto";
    }, 8000);
  }

  // ----------------------------------------------------------
  // BOTONES QUE ABREN EL MODAL DE CHECKOUT
  // ----------------------------------------------------------
  document.querySelectorAll("[data-abrir-checkout]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      SupabaseCliente.registrarEvento("click_cta_principal");
      Pixels.dispararEvento("InitiateCheckout", "InitiateCheckout");
      if (window.CheckoutModal) {
        window.CheckoutModal.abrir(cantidadSeleccionada);
      }
    });
  });

  // ----------------------------------------------------------
  // BOTÓN FLOTANTE DE WHATSAPP (contacto directo, fuera del checkout)
  // ----------------------------------------------------------
  const whatsappFlotante = document.getElementById("whatsapp-flotante");
  if (whatsappFlotante) {
    whatsappFlotante.addEventListener("click", function () {
      SupabaseCliente.registrarEvento("click_whatsapp_flotante");
    });
  }

});
