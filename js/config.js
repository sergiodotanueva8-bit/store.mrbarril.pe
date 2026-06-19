/**
 * ============================================================
 * CONFIGURACIÓN DEL PROYECTO — RELLENA ESTOS CAMPOS
 * ============================================================
 * Este es el ÚNICO archivo que necesitas editar para conectar
 * la landing a tu Supabase y a tu WhatsApp de ventas.
 * No necesitas tocar ningún otro archivo .js para que funcione.
 * ============================================================
 */

const CONFIG = {

  // ----------------------------------------------------------
  // 1. SUPABASE
  // ----------------------------------------------------------
  // Cómo obtenerlos:
  //   1. Entra a https://supabase.com/dashboard
  //   2. Abre tu proyecto (o crea uno nuevo, es gratis)
  //   3. Ve a "Project Settings" (ícono de engranaje) → "API"
  //   4. Copia "Project URL" y pégalo abajo en SUPABASE_URL
  //   5. Copia la clave "anon public" y pégala en SUPABASE_ANON_KEY
  //
  // IMPORTANTE: usa siempre la clave "anon public", NUNCA la
  // "service_role" (esa es secreta y no debe ir en el navegador).
  // ----------------------------------------------------------
  SUPABASE_URL: "https://czgenwnmyzjqyjkvvjrr.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Z2Vud25teXpqcXlqa3Z2anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcwOTUsImV4cCI6MjA5NzM5MzA5NX0.pVfbYZSELN1KfhpxikAwk8vNUFA-cP4_lQm0eMm14-M",

  // ----------------------------------------------------------
  // 2. WHATSAPP DE VENTAS
  // ----------------------------------------------------------
  // Número de WhatsApp donde llegarán los pedidos confirmados.
  // Formato: código de país + número, SIN signos "+", espacios
  // ni guiones. Ejemplo para Perú: 51987654321
  // ----------------------------------------------------------
  WHATSAPP_NUMERO: "51923757221",

  // ----------------------------------------------------------
  // 3. DATOS DEL PRODUCTO Y PRECIOS
  // ----------------------------------------------------------
  PRODUCTO_NOMBRE: "Tendedero Plegable 5 Líneas",
  PRECIO_REGULAR: 150.00,
  PRECIO_TACHADO: 200.00,
  COSTO_INSTALACION_LIMA: 50.00,

  // Precios por cantidad (usado en la sección de descuentos por volumen)
  PRECIO_X2_UNIDAD: 280,   // -20% dscto. (precio por unidad llevando 2)
  PRECIO_X3_UNIDAD: 420,   // -25% dscto. (precio por unidad llevando 3)

  // ----------------------------------------------------------
  // 4. STOCK / URGENCIA
  // ----------------------------------------------------------
  // Si STOCK_DESDE_SUPABASE es true, el número de "unidades
  // restantes" se lee en vivo desde la tabla `stock` de Supabase
  // y se descuenta automáticamente con cada pedido confirmado.
  // Si lo pones en false, se usa el número fijo de abajo.
  STOCK_DESDE_SUPABASE: true,
  STOCK_FIJO_RESPALDO: 12,

  // ----------------------------------------------------------
  // 5. ANALYTICS / TRACKING (opcional)
  // ----------------------------------------------------------
  // Si tienes Pixel de Meta o de TikTok, pégalos aquí y se
  // dispararán automáticamente en los eventos clave (vista de
  // página, click en CTA, pedido confirmado). Déjalos vacíos
  // ("") si no los vas a usar todavía.
  META_PIXEL_ID: "",       // Ejemplo: "1234567890123456"
  TIKTOK_PIXEL_ID: "",     // Ejemplo: "CXXXXXXXXXXXXXXXXXXX"

};
