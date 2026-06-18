# Tendedero Plegable 5 Líneas — Landing de Ventas

Landing page de un solo producto, lista para producción, pensada para
correr campañas de **TikTok Ads** y **Meta Ads** con pago contra
entrega. Incluye formulario de checkout con dos flujos (Lima /
Provincia), guardado de pedidos y analytics básicos en **Supabase**, y
redirección automática a **WhatsApp** con el resumen del pedido.

> 📱 **Diseñada mobile-first.** Como la mayoría del tráfico de TikTok
> y Meta Ads llega desde el celular, todo el CSS está construido
> empezando por la versión mobile (galería en carrusel deslizable con
> puntos, botones grandes y fáciles de tocar con el pulgar, checkout
> en pantalla completa) y luego se "estira" para verse bien en
> tablets y desktop — no al revés.

No requiere backend propio ni build: es HTML, CSS y JavaScript puro,
ideal para desplegar como **Static Site en Render**.

---

## 0. Qué cambia respecto a un diseño "desktop-first"

| Elemento | Mobile (< 760px) | Desktop (≥ 900px) |
|---|---|---|
| Galería de fotos | Carrusel horizontal deslizable + puntos (dots) | Miniaturas verticales + imagen grande |
| Checkout | Pantalla completa, un solo flujo vertical (formulario → resumen) | Modal centrado, dos columnas lado a lado |
| Botones principales | Mínimo 48-56px de alto (fácil de tocar con el pulgar) | Tamaño estándar con hover |
| Inputs del formulario | Fuente de 16px (evita zoom automático de iOS) | Igual, con más espacio |
| Imágenes secundarias | `loading="lazy"` (cargan solo cuando se necesitan, más rápido en 4G) | Igual |
| Filas de logos/clientes/envíos | Scroll horizontal | Grid fijo |



## 1. Estructura del proyecto

```
tendedero-landing/
├── index.html                  ← Página principal (todo el HTML vive aquí)
├── render.yaml                 ← Configuración de despliegue para Render
├── css/
│   ├── variables.css           ← Colores, tipografía, reset
│   ├── landing.css             ← Estilos de la landing
│   └── checkout-modal.css      ← Estilos del formulario/modal de checkout
├── js/
│   ├── config.js               ← ⚠️ AQUÍ VAN TUS CREDENCIALES (Supabase, WhatsApp, precios)
│   ├── supabase-client.js      ← Funciones para guardar pedidos y eventos
│   ├── pixels.js                ← Integración opcional con Meta Pixel / TikTok Pixel
│   ├── landing.js              ← Lógica de la página (galería, stock, cantidades)
│   └── checkout-modal.js       ← Lógica del formulario Lima/Provincia
├── supabase/
│   └── schema.sql               ← Script SQL para crear las tablas en Supabase
├── assets/
│   ├── images/                 ← Todas las imágenes (con placeholders ya generados)
│   └── videos/
│       └── ESPECIFICACIONES-VIDEO.txt
└── generar_placeholders.py     ← Script que generó las imágenes de marcador de posición
```

---

## 2. Cómo reemplazar las imágenes

Todas las imágenes ya están en `assets/images/` como **placeholders**
(rectángulos grises con el nombre y tamaño exacto escrito encima), para
que el sitio se vea completo desde el primer momento. Tu trabajo es
reemplazar cada archivo por tu imagen real, **manteniendo el mismo
nombre de archivo** (o actualizando la referencia en `index.html` si
usas otro nombre).

Dentro de `index.html`, justo arriba de cada `<img>`, hay un comentario
como este indicando el tamaño exacto recomendado:

```html
<!--
  IMAGEN PRINCIPAL (HERO): producto-hero-principal.jpg
  Tamaño recomendado: 1200x1500 px (relación 4:5, vertical)
  Formato: JPG optimizado para web (calidad 80-85%), peso ideal < 300KB
-->
```

### Resumen de todas las imágenes y tamaños

| Archivo | Tamaño (px) | Uso |
|---|---|---|
| `producto-hero-principal.jpg` | 1200×1500 | Imagen principal del producto |
| `miniatura-1-logo.jpg` a `miniatura-4-detalle-lineas.jpg` | 64×64 | Miniaturas de la galería |
| `foto-2-instalado-pared.jpg`, `foto-3-plegado.jpg`, `foto-4-detalle-lineas.jpg` | 1200×1500 | Fotos alternas del producto (al hacer click en cada miniatura) |
| `icono-tecnico-instalador.png` | 240×240 | Ícono del técnico en la sección de instalación |
| `icono-tecnico-instalador-pequeno.png` | 64×64 | Mismo ícono, versión chica dentro del checkout |
| `tornillos-tarugos-incluidos.png` | 180×180 | Foto de accesorios incluidos |
| `logo-courier-*.png` (4 archivos) | 160×60 | Logos de empresas de transporte |
| `logo-pago-*.png` (9 archivos) | 100×40 | Logos de métodos de pago |
| `cliente-testimonio-1.jpg` a `-6.jpg` | 300×330 | Fotos de clientes reales con su pedido |
| `envio-paquete-1.jpg` a `-8.jpg` | 200×200 | Fotos de paquetes/envíos despachados |

### Video del producto (opcional)

Revisa `assets/videos/ESPECIFICACIONES-VIDEO.txt` para la resolución
exacta recomendada (1080×1920 vertical) y los pasos para activarlo en
`index.html`.

---

## 3. Conectar tu Supabase (paso a paso)

### 3.1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Click en **"New Project"**.
3. Ponle un nombre (ej: `tendedero-landing`) y una contraseña de base de datos (guárdala, no la necesitarás para esta landing pero es buena práctica).
4. Espera 1-2 minutos a que el proyecto se aprovisione.

### 3.2. Crear las tablas

1. En el panel izquierdo, ve a **"SQL Editor"**.
2. Click en **"New query"**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia **todo** su contenido y pégalo en el editor.
4. Click en **"Run"** (o `Ctrl+Enter`).
5. Deberías ver el mensaje "Success. No rows returned". Esto creó:
   - La tabla `pedidos` (guarda cada pedido del formulario)
   - La tabla `eventos_analytics` (guarda vistas de página y clicks)
   - La tabla `stock` (controla el contador de "unidades restantes")
   - Las políticas de seguridad (RLS) para que solo tú puedas leer los datos

### 3.3. Obtener tus credenciales

1. Ve a **"Project Settings"** (ícono de engranaje, abajo a la izquierda) → **"API"**.
2. Copia el valor de **"Project URL"**.
3. Copia el valor de **"anon public"** (en la sección "Project API keys"). **No copies la clave "service_role"**, esa es secreta.

### 3.4. Pegar las credenciales en el proyecto

Abre `js/config.js` y reemplaza:

```javascript
SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
SUPABASE_ANON_KEY: "TU-ANON-KEY-AQUI",
```

con tus valores reales.

### 3.5. Ver tus pedidos y analytics

Ve a **"Table Editor"** en el panel izquierdo de Supabase:
- **`pedidos`**: cada fila es un pedido confirmado, con todos los datos del cliente.
- **`eventos_analytics`**: cada fila es un evento (vista de página, click en CTA, etc.), útil para armar un funnel de conversión.
- **`stock`**: el número de unidades restantes, que se descuenta automáticamente con cada pedido nuevo.

> 🔒 **Nota de seguridad:** por diseño, nadie puede leer estos datos desde el navegador (ni con la clave "anon"), solo tú desde el dashboard de Supabase. Esto protege los datos personales de tus clientes.

---

## 4. Configurar tu número de WhatsApp

En `js/config.js`:

```javascript
WHATSAPP_NUMERO: "51987654321",
```

Reemplaza por tu número con código de país, sin signos `+`, espacios ni
guiones (ejemplo de Perú: `51` + tu número de 9 dígitos).

También debes actualizar el botón flotante de WhatsApp en `index.html`
(busca `href="https://wa.me/51987654321"`) con el mismo número.

---

## 5. Configurar Meta Pixel y TikTok Pixel (opcional)

Si vas a correr campañas pagadas, en `js/config.js`:

```javascript
META_PIXEL_ID: "1234567890123456",     // tu Pixel ID de Meta
TIKTOK_PIXEL_ID: "CXXXXXXXXXXXXXXXXXXX", // tu Pixel ID de TikTok
```

Con esto, automáticamente se dispararán los eventos estándar:
- `PageView` al cargar la landing
- `InitiateCheckout` al abrir el formulario
- `Purchase` / `CompletePayment` al confirmar un pedido

Si los dejas vacíos (`""`), simplemente no se cargan los pixels, sin errores.

---

## 6. Ajustar precios, stock y textos

Todo lo que cambia seguido (precios, costo de instalación, stock de
respaldo) está centralizado en `js/config.js`. No necesitas tocar el
HTML ni el CSS para estos cambios.

Si quieres que el contador de **"¡Solo quedan X unidades!"** sea fijo
en vez de leerse de Supabase, cambia:

```javascript
STOCK_DESDE_SUPABASE: false,
STOCK_FIJO_RESPALDO: 8,
```

---

## 7. Desplegar en Render

### Opción A: Static Site manual (recomendado, más simple)

1. Sube este proyecto a un repositorio de GitHub (puede ser privado).
2. Entra a [render.com](https://render.com) → **"New +"** → **"Static Site"**.
3. Conecta tu repositorio de GitHub.
4. En la configuración:
   - **Build Command:** déjalo vacío (no se necesita build)
   - **Publish directory:** `.` (la raíz del proyecto)
5. Click en **"Create Static Site"**.
6. En 1-2 minutos tendrás tu URL pública (ej: `tendedero-landing.onrender.com`).

### Opción B: Usando el archivo render.yaml (Blueprint)

1. Sube el proyecto a GitHub (este repo ya incluye `render.yaml`).
2. En Render, ve a **"New +"** → **"Blueprint"**.
3. Conecta el repositorio; Render detectará `render.yaml` automáticamente y configurará todo.

### Dominio propio (opcional)

Una vez desplegado, en Render ve a tu servicio → **"Settings"** →
**"Custom Domains"** para conectar tu propio dominio (ej:
`tendederoplegable.com`).

---

## 8. Probar antes de lanzar campañas

Antes de invertir en ads, verifica:

1. Abre la landing en tu navegador y en el celular (responsive).
2. Haz click en **"PEDIR Y PAGAR AL RECIBIR"**, completa el formulario en ambas variantes (Lima y Provincia), y confirma que te redirige correctamente a WhatsApp con el mensaje armado.
3. Revisa en Supabase (Table Editor → `pedidos`) que el pedido de prueba se guardó.
4. Revisa en Supabase (Table Editor → `eventos_analytics`) que se registraron los eventos (`page_view`, `click_cta_principal`, etc.).
5. Reemplaza todas las imágenes placeholder por tus fotos reales.
6. Actualiza tu número de WhatsApp en `js/config.js` y en el botón flotante de `index.html`.

---

## 9. Preguntas frecuentes

**¿Necesito saber programar para usar esto?**
Para cambios de precios, textos o imágenes, no. Para cambios de
estructura o diseño, ayuda tener conocimientos básicos de HTML/CSS.

**¿Puedo agregar más productos?**
Esta landing está pensada para un solo producto (estilo "advertorial"
de TikTok/Meta Ads). Si quieres varios productos, lo ideal es duplicar
esta carpeta por cada producto y desplegar cada una como un sitio
independiente en Render.

**¿Cómo cambio el color naranja/verde por el de mi marca?**
Edita las variables en `css/variables.css`, en la sección `:root`
(por ejemplo `--color-naranja` y `--color-verde`).

**¿Qué pasa si no configuro Supabase?**
La landing sigue funcionando: el formulario seguirá redirigiendo a
WhatsApp con normalidad, simplemente no se guardará el historial de
pedidos ni los analytics en una base de datos.
