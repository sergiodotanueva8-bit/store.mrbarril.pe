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
  // CONTADOR DE STOCK DINÁMICO (lee de Supabase si está activado)
  // ----------------------------------------------------------
  async function actualizarContadorStock() {
    let unidades = CONFIG.STOCK_FIJO_RESPALDO;

    if (CONFIG.STOCK_DESDE_SUPABASE) {
      const stockReal = await SupabaseCliente.obtenerStockActual();
      if (typeof stockReal === "number") {
        unidades = stockReal;
      }
    }

    const elementosTexto = document.querySelectorAll("[data-stock-texto]");
    const elementosBarra = document.querySelectorAll("[data-stock-barra]");
    const STOCK_MAXIMO_VISUAL = 12;
    const porcentaje = Math.max(5, Math.min(100, (unidades / STOCK_MAXIMO_VISUAL) * 100));

    elementosTexto.forEach(function (el) {
      el.textContent = "¡SOLO QUEDAN " + unidades + " UNIDADES!";
    });

    document.querySelectorAll("[data-stock-numero]").forEach(function (el) {
      el.textContent = unidades;
    });

    elementosBarra.forEach(function (el) {
      el.style.width = porcentaje + "%";
    });
  }

  actualizarContadorStock();

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
