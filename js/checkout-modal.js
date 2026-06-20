/**
 * ============================================================
 * MODAL DE CHECKOUT — Lima / Provincia
 * ============================================================
 * Controla la apertura/cierre del modal, el cambio entre las
 * dos variantes de envío, las validaciones de campos, el cálculo
 * del resumen de pedido, el guardado en Supabase y la redirección
 * final a WhatsApp con el mensaje armado.
 * ============================================================
 */

const CheckoutModal = (function () {

  let tipoEnvioActual = "lima";
  let cantidadActual = 1;
  let enviando = false;

  // ----------------------------------------------------------
  // Helpers de DOM
  // ----------------------------------------------------------
  function $(selector, contexto) {
    return (contexto || document).querySelector(selector);
  }
  function $all(selector, contexto) {
    return Array.from((contexto || document).querySelectorAll(selector));
  }

  function formatearMoneda(numero) {
    return "S/ " + numero.toFixed(2);
  }

  function obtenerPrecioUnitarioPorCantidad(cantidad) {
    if (cantidad === 2) return CONFIG.PRECIO_X2_UNIDAD;
    if (cantidad === 3) return CONFIG.PRECIO_X3_UNIDAD;
    return CONFIG.PRECIO_REGULAR;
  }

  // ----------------------------------------------------------
  // Abrir / cerrar modal
  // ----------------------------------------------------------
  function abrir(cantidad) {
    cantidadActual = cantidad || 1;
    const overlay = document.getElementById("modal-checkout-overlay");
    if (!overlay) return;

    overlay.classList.add("abierto");
    document.body.style.overflow = "hidden";

    mostrarFormulario();
    seleccionarTipoEnvio("lima");
    actualizarResumen();

    SupabaseCliente.registrarEvento("abrir_modal_checkout", { cantidad: cantidadActual });
  }

  function cerrar() {
    const overlay = document.getElementById("modal-checkout-overlay");
    if (!overlay) return;
    overlay.classList.remove("abierto");
    document.body.style.overflow = "";
  }

  function mostrarFormulario() {
    $("#modal-checkout-formulario").style.display = "block";
    $("#modal-checkout-exito").classList.remove("visible");
  }

  function mostrarExito() {
    $("#modal-checkout-formulario").style.display = "none";
    $("#modal-checkout-exito").classList.add("visible");
  }

  // ----------------------------------------------------------
  // Cambiar entre envío a Lima / Provincia
  // ----------------------------------------------------------
  function seleccionarTipoEnvio(tipo) {
    tipoEnvioActual = tipo;

    $all(".selector-envio__opcion").forEach(function (boton) {
      boton.classList.toggle("activa", boton.getAttribute("data-tipo-envio") === tipo);
    });

    $all("[data-seccion-envio]").forEach(function (seccion) {
      seccion.classList.toggle("activa", seccion.getAttribute("data-seccion-envio") === tipo);
    });

    $("#modal-checkout-titulo-paso2").textContent =
      tipo === "lima" ? "Ingresa tus datos de entrega" : "Ingresa tus datos para envío a provincia";

    actualizarResumen();

    const nombreEvento = tipo === "lima" ? "seleccion_envio_lima" : "seleccion_envio_provincia";
    SupabaseCliente.registrarEvento(nombreEvento);
  }

  // ----------------------------------------------------------
  // Resumen del pedido (columna derecha del modal)
  // ----------------------------------------------------------
  function actualizarResumen() {
    const precioUnitario = obtenerPrecioUnitarioPorCantidad(cantidadActual);
    const subtotalProducto = precioUnitario * cantidadActual;

    const checkboxInstalacion = $("#campo-agrega-instalacion");
    const quiereInstalacion =
      tipoEnvioActual === "lima" && checkboxInstalacion && checkboxInstalacion.checked;
    const costoInstalacion = quiereInstalacion ? CONFIG.COSTO_INSTALACION_LIMA : 0;

    const total = subtotalProducto + costoInstalacion;

    // Actualizar nombre del producto en la cabecera del resumen
    const nombreResumen = $("#resumen-producto-nombre");
    if (nombreResumen) {
      nombreResumen.textContent = CONFIG.PRODUCTO_NOMBRE;
    }

    // Actualizar precio unitario grande (el que aparece destacado arriba del resumen)
    const precioResumen = $("#resumen-producto-precio-unitario");
    if (precioResumen) {
      if (cantidadActual === 1) {
        precioResumen.textContent = formatearMoneda(precioUnitario);
      } else {
        precioResumen.textContent = formatearMoneda(precioUnitario) + " c/u";
      }
    }

    $("#resumen-linea-producto-cantidad").textContent =
      CONFIG.PRODUCTO_NOMBRE + " (" + cantidadActual + (cantidadActual === 1 ? " unidad)" : " unidades)");
    $("#resumen-linea-producto-precio").textContent = formatearMoneda(subtotalProducto);

    const lineaInstalacion = $("#resumen-linea-instalacion");
    if (tipoEnvioActual === "lima") {
      lineaInstalacion.style.display = "flex";
      $("#resumen-linea-instalacion-precio").textContent = quiereInstalacion
        ? formatearMoneda(CONFIG.COSTO_INSTALACION_LIMA)
        : "No agregado";
    } else {
      lineaInstalacion.style.display = "none";
    }

    const lineaEnvio = $("#resumen-linea-envio-texto");
    lineaEnvio.textContent = tipoEnvioActual === "lima" ? "Gratis" : "Envío por Shalom — Gratis";

    $("#resumen-total-valor").textContent = formatearMoneda(total);

    return { precioUnitario, subtotalProducto, costoInstalacion, total, quiereInstalacion };
  }

  // ----------------------------------------------------------
  // Validación de campos
  // ----------------------------------------------------------
  function marcarError(input, mensaje) {
    input.classList.add("campo--error");
    const errorEl = document.querySelector('[data-error-de="' + input.id + '"]');
    if (errorEl) {
      errorEl.textContent = mensaje;
      errorEl.classList.add("visible");
    }
  }

  function limpiarError(input) {
    input.classList.remove("campo--error");
    const errorEl = document.querySelector('[data-error-de="' + input.id + '"]');
    if (errorEl) {
      errorEl.classList.remove("visible");
    }
  }

  function validarCampoRequerido(id, mensaje) {
    const input = document.getElementById(id);
    if (!input) return true;
    const valor = input.value.trim();
    if (!valor) {
      marcarError(input, mensaje || "Este campo es obligatorio");
      return false;
    }
    limpiarError(input);
    return true;
  }

  function validarWhatsapp(id) {
    const input = document.getElementById(id);
    if (!input) return true;
    const valor = input.value.trim().replace(/\s|-/g, "");
    if (!/^[0-9]{9}$/.test(valor) && !/^[0-9]{9,12}$/.test(valor)) {
      marcarError(input, "Ingresa un número de WhatsApp válido (9 dígitos)");
      return false;
    }
    limpiarError(input);
    return true;
  }

  function validarFormulario() {
    let valido = true;

    if (tipoEnvioActual === "lima") {
      if (!validarCampoRequerido("campo-nombre-lima", "Ingresa tu nombre completo")) valido = false;
      if (!validarWhatsapp("campo-whatsapp-lima")) valido = false;
      if (!validarCampoRequerido("campo-distrito", "Ingresa tu distrito")) valido = false;
      if (!validarCampoRequerido("campo-direccion", "Ingresa tu dirección exacta")) valido = false;
    } else {
      if (!validarCampoRequerido("campo-nombre-provincia", "Ingresa tu nombre completo")) valido = false;
      if (!validarCampoRequerido("campo-dni", "Ingresa tu DNI")) valido = false;
      if (!validarWhatsapp("campo-whatsapp-provincia")) valido = false;
      if (!validarCampoRequerido("campo-departamento", "Selecciona tu departamento")) valido = false;
      if (!validarCampoRequerido("campo-ciudad-destino", "Ingresa tu ciudad de destino")) valido = false;
      if (!validarCampoRequerido("campo-sede-shalom", "Ingresa la sede de Shalom más cercana")) valido = false;
    }

    return valido;
  }

  // ----------------------------------------------------------
  // Mensaje CORTO: es el único texto que se abre en el WhatsApp
  // del cliente. Solo confirma el pedido, sin datos sensibles,
  // porque el detalle completo se lo envías tú desde la app admin.
  // ----------------------------------------------------------
  function armarMensajeConfirmacionCorta(datos) {
    return (
      "¡Hola! Acabo de confirmar mi pedido de *" + CONFIG.PRODUCTO_NOMBRE + "*. " +
      "Quedo atento(a) al detalle de mi compra. ¡Gracias!"
    );
  }

  // ----------------------------------------------------------
  // Mensaje COMPLETO: se guarda en Supabase (mensaje_pedido_completo)
  // para que tú lo copies con un tap desde la app admin y se lo
  // reenvíes al cliente por WhatsApp.
  // ----------------------------------------------------------
  function armarMensajePedidoCompleto(datos, resumen) {
    const lineas = [];
    lineas.push("¡Hola! Aquí el detalle de tu pedido:");
    lineas.push("");
    lineas.push("🧺 *" + CONFIG.PRODUCTO_NOMBRE + "*");
    lineas.push("Cantidad: " + cantidadActual);
    lineas.push("Subtotal: " + formatearMoneda(resumen.subtotalProducto));

    if (tipoEnvioActual === "lima") {
      lineas.push("");
      lineas.push("📍 *Envío a Lima*");
      lineas.push("Nombre: " + datos.nombreCompleto);
      lineas.push("WhatsApp: " + datos.whatsapp);
      lineas.push("Distrito: " + datos.distrito);
      lineas.push("Dirección: " + datos.direccionExacta);
      lineas.push(
        "Instalación: " +
          (resumen.quiereInstalacion
            ? "Sí, agregar (" + formatearMoneda(CONFIG.COSTO_INSTALACION_LIMA) + ")"
            : "No")
      );
    } else {
      lineas.push("");
      lineas.push("📦 *Envío a Provincia (Shalom)*");
      lineas.push("Nombre: " + datos.nombreCompleto);
      lineas.push("DNI: " + datos.dni);
      lineas.push("WhatsApp: " + datos.whatsapp);
      lineas.push("Departamento: " + datos.departamento);
      lineas.push("Ciudad/Destino: " + datos.ciudadDestino);
      lineas.push("Sede Shalom más cercana: " + datos.sedeShalom);
    }

    lineas.push("");
    lineas.push("💰 *Total a pagar: " + formatearMoneda(resumen.total) + "*");
    lineas.push("Modalidad: Pago contra entrega");

    return lineas.join("\n");
  }

  // ----------------------------------------------------------
  // Envío del formulario
  // ----------------------------------------------------------
  function confirmarPedido() {
    if (enviando) return;

    SupabaseCliente.registrarEvento("click_confirmar_pedido", { tipo_envio: tipoEnvioActual });

    if (!validarFormulario()) return;

    enviando = true;
    const boton = $("#btn-confirmar-pedido");
    const textoOriginal = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<span>Procesando tu pedido...</span>';

    const resumen = actualizarResumen();

    let datos;
    if (tipoEnvioActual === "lima") {
      datos = {
        tipoEnvio: "lima",
        nombreCompleto: $("#campo-nombre-lima").value.trim(),
        whatsapp: $("#campo-whatsapp-lima").value.trim(),
        distrito: $("#campo-distrito").value.trim(),
        direccionExacta: $("#campo-direccion").value.trim(),
        agregaInstalacion: resumen.quiereInstalacion,
      };
    } else {
      datos = {
        tipoEnvio: "provincia",
        nombreCompleto: $("#campo-nombre-provincia").value.trim(),
        dni: $("#campo-dni").value.trim(),
        whatsapp: $("#campo-whatsapp-provincia").value.trim(),
        departamento: $("#campo-departamento").value,
        ciudadDestino: $("#campo-ciudad-destino").value.trim(),
        sedeShalom: $("#campo-sede-shalom").value.trim(),
      };
    }

    datos.cantidad = cantidadActual;
    datos.precioUnitario = resumen.precioUnitario;
    datos.costoInstalacion = resumen.costoInstalacion;
    datos.totalPagar = resumen.total;

    const mensajeCorto = armarMensajeConfirmacionCorta(datos);
    const mensajeCompleto = armarMensajePedidoCompleto(datos, resumen);
    datos.mensajeWhatsappCorto = mensajeCorto;
    datos.mensajePedidoCompleto = mensajeCompleto;

    // ── Mostrar pantalla de éxito INMEDIATAMENTE ──
    // Ya NO se abre WhatsApp automáticamente. El pedido queda confirmado
    // en la landing y el vendedor le escribe desde la app admin (usando
    // mensaje_pedido_completo, que se guarda abajo en Supabase).
    mostrarExito();

    // Guardar en Supabase (en segundo plano, no bloquea la UI)
    SupabaseCliente.guardarPedido(datos).then(function (resultado) {
      if (!resultado.ok && !resultado.omitido) {
        console.error("No se pudo guardar el pedido en Supabase.");
      }
    });

    // Disparar evento de conversión en pixels
    Pixels.dispararEvento("Purchase", "CompletePayment", {
      value: resumen.total,
      currency: "PEN",
    });

    enviando = false;
    boton.disabled = false;
    boton.innerHTML = textoOriginal;
  }

  // ----------------------------------------------------------
  // Inicialización de listeners (se llama una sola vez)
  // ----------------------------------------------------------
  function inicializar() {
    const overlay = document.getElementById("modal-checkout-overlay");
    if (!overlay) return;

    // Cerrar con la X
    $all("[data-cerrar-checkout]").forEach(function (el) {
      el.addEventListener("click", cerrar);
    });

    // Cerrar al hacer click fuera del modal
    overlay.addEventListener("click", function (evento) {
      if (evento.target === overlay) cerrar();
    });

    // Cerrar con tecla Escape
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && overlay.classList.contains("abierto")) {
        cerrar();
      }
    });

    // Tabs Lima / Provincia
    $all(".selector-envio__opcion").forEach(function (boton) {
      boton.addEventListener("click", function () {
        seleccionarTipoEnvio(boton.getAttribute("data-tipo-envio"));
      });
    });

    // Checkbox de instalación recalcula el resumen
    const checkboxInstalacion = document.getElementById("campo-agrega-instalacion");
    if (checkboxInstalacion) {
      checkboxInstalacion.addEventListener("change", actualizarResumen);
    }

    // Checkbox "vista" de la tarjeta de instalación (fuera del formulario):
    // se mantiene sincronizado con el checkbox real del formulario en ambas
    // direcciones, para que marcar cualquiera de los dos actualice el otro.
    const checkboxInstalacionVista = document.getElementById("campo-agrega-instalacion-vista");
    if (checkboxInstalacionVista && checkboxInstalacion) {
      checkboxInstalacionVista.addEventListener("change", function () {
        checkboxInstalacion.checked = checkboxInstalacionVista.checked;
        actualizarResumen();
      });
      checkboxInstalacion.addEventListener("change", function () {
        checkboxInstalacionVista.checked = checkboxInstalacion.checked;
      });
    }

    // Botón confirmar
    const botonConfirmar = document.getElementById("btn-confirmar-pedido");
    if (botonConfirmar) {
      botonConfirmar.addEventListener("click", function (evento) {
        evento.preventDefault();
        confirmarPedido();
      });
    }

    // Quitar el error de un campo en cuanto el usuario empieza a corregirlo
    $all(".campo input, .campo select").forEach(function (input) {
      input.addEventListener("input", function () {
        limpiarError(input);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", inicializar);

  return { abrir, cerrar };
})();

window.CheckoutModal = CheckoutModal;
