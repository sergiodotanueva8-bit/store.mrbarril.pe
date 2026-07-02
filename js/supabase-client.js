/**
 * ============================================================
 * CLIENTE DE SUPABASE
 * ============================================================
 * Este archivo se conecta a Supabase usando los datos puestos
 * en config.js y expone funciones simples para:
 *   - guardarPedido()
 *   - registrarEvento()
 *   - obtenerStockActual()
 *
 * No necesitas modificar nada aquí. Si quieres conectar tu
 * propio Supabase, edita SOLO js/config.js
 * ============================================================
 */

const SupabaseCliente = (function () {

  let cliente = null;
  let inicializado = false;
  let tiendaIdCache = null;

  function estaConfigurado() {
    return (
      CONFIG.SUPABASE_URL &&
      CONFIG.SUPABASE_ANON_KEY &&
      !CONFIG.SUPABASE_URL.includes("TU-PROYECTO") &&
      !CONFIG.SUPABASE_ANON_KEY.includes("TU-ANON-KEY")
    );
  }

  function inicializar() {
    if (inicializado) return cliente;
    inicializado = true;

    if (!estaConfigurado()) {
      console.warn(
        "[Supabase] No se han configurado las credenciales en js/config.js. " +
        "Los pedidos y analytics no se guardarán en la base de datos, " +
        "pero el formulario seguirá redirigiendo a WhatsApp con normalidad."
      );
      return null;
    }

    try {
      // window.supabase viene de la librería cargada por CDN en el HTML
      cliente = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error("[Supabase] Error al inicializar el cliente:", error);
      cliente = null;
    }

    return cliente;
  }

  /**
   * Genera (o recupera) un ID anónimo de sesión, guardado en memoria
   * durante la visita actual. No usamos localStorage para mantener
   * el tracking lo más simple y liviano posible.
   */
  let sessionIdMemoria = null;
  function obtenerSessionId() {
    if (!sessionIdMemoria) {
      sessionIdMemoria =
        "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    }
    return sessionIdMemoria;
  }

  function obtenerUTMs() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
      utm_id: params.get("utm_id") || null,
      ttclid: params.get("ttclid") || null,
    };
  }

  /**
   * Resuelve el UUID de la tienda actual a partir de CONFIG.TIENDA_SLUG,
   * consultando la tabla `tiendas`. Se cachea en memoria durante la
   * visita para no repetir la consulta en cada evento/pedido.
   */
  async function resolverTiendaId() {
    if (tiendaIdCache) return tiendaIdCache;

    const db = inicializar();
    if (!db) return null;

    try {
      const { data, error } = await db
        .from("tiendas")
        .select("id")
        .eq("slug", CONFIG.TIENDA_SLUG)
        .single();

      if (error || !data) {
        console.error(
          "[Supabase] No se encontró la tienda con slug '" + CONFIG.TIENDA_SLUG +
          "'. Verifica que exista una fila en la tabla `tiendas` con ese slug."
        );
        return null;
      }

      tiendaIdCache = data.id;
      return tiendaIdCache;
    } catch (error) {
      console.error("[Supabase] Error resolviendo tienda_id:", error);
      return null;
    }
  }

  /**
   * Guarda un pedido en la tabla `pedidos`.
   * Devuelve { ok: true } o { ok: false, error }
   */
  async function guardarPedido(datosPedido) {
    const db = inicializar();
    if (!db) {
      return { ok: false, error: "Supabase no configurado", omitido: true };
    }

    const tiendaId = await resolverTiendaId();
    if (!tiendaId) {
      return { ok: false, error: "No se pudo resolver tienda_id" };
    }

    try {
      const utms = obtenerUTMs();
      const { error } = await db.from("pedidos").insert([
        {
          tienda_id: tiendaId,
          tipo_envio: datosPedido.tipoEnvio,
          nombre_completo: datosPedido.nombreCompleto,
          whatsapp: datosPedido.whatsapp,
          color: datosPedido.color || null,
          distrito: datosPedido.distrito || null,
          direccion_exacta: datosPedido.direccionExacta || null,
          agrega_instalacion: !!datosPedido.agregaInstalacion,
          dni: datosPedido.dni || null,
          departamento: datosPedido.departamento || null,
          ciudad_destino: datosPedido.ciudadDestino || null,
          sede_shalom: datosPedido.sedeShalom || null,
          cantidad: datosPedido.cantidad || 1,
          precio_unitario: datosPedido.precioUnitario,
          costo_instalacion: datosPedido.costoInstalacion || 0,
          total_pagar: datosPedido.totalPagar,
          mensaje_whatsapp_corto: datosPedido.mensajeWhatsappCorto || null,
          mensaje_pedido_completo: datosPedido.mensajePedidoCompleto || null,
          ...utms,
        },
      ]);

      if (error) {
        console.error("[Supabase] Error guardando pedido:", error);
        return { ok: false, error };
      }

      return { ok: true };
    } catch (error) {
      console.error("[Supabase] Excepción guardando pedido:", error);
      return { ok: false, error };
    }
  }

  /**
   * Registra un evento simple de analytics (vista de página, click, etc).
   * Es "fire and forget": si falla, no interrumpe la experiencia del usuario.
   */
  async function registrarEvento(tipoEvento, metadata) {
    const db = inicializar();
    if (!db) return;

    try {
      const utms = obtenerUTMs();
      await db.from("eventos_analytics").insert([
        {
          tipo_evento: tipoEvento,
          session_id: obtenerSessionId(),
          pagina: window.location.pathname,
          metadata: metadata || {},
          ...utms,
        },
      ]);
    } catch (error) {
      // Los analytics nunca deben romper la experiencia del usuario
      console.warn("[Supabase] No se pudo registrar el evento:", tipoEvento, error);
    }
  }

  /**
   * Obtiene el stock actual desde la tabla `stock`.
   * Devuelve un número, o null si no se pudo obtener.
   */
  async function obtenerStockActual() {
    const db = inicializar();
    if (!db) return null;

    try {
      const { data, error } = await db
        .from("stock")
        .select("unidades_disponibles")
        .eq("id", 1)
        .single();

      if (error || !data) return null;
      return data.unidades_disponibles;
    } catch (error) {
      console.warn("[Supabase] No se pudo obtener el stock:", error);
      return null;
    }
  }

  return {
    estaConfigurado,
    guardarPedido,
    registrarEvento,
    obtenerStockActual,
    obtenerSessionId,
    obtenerUTMs,
  };
})();