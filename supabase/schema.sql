-- ============================================================
-- TENDEDERO PLEGABLE 5 LÍNEAS — Schema de Supabase
-- ============================================================
-- Cómo usar este archivo:
-- 1. Entra a tu proyecto en https://supabase.com/dashboard
-- 2. Ve a "SQL Editor" → "New query"
-- 3. Copia y pega TODO este archivo
-- 4. Click en "Run"
-- Esto crea las tablas, los índices, las políticas de seguridad
-- (RLS) y las funciones necesarias para que la landing funcione.
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIÓN: para generar UUIDs automáticamente
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABLA: pedidos
-- Guarda cada pedido que el cliente completa en el formulario
-- de checkout (tanto envío a Lima como a Provincia).
-- ------------------------------------------------------------
create table if not exists public.pedidos (
  id                 uuid primary key default gen_random_uuid(),
  creado_en          timestamptz not null default now(),

  -- Tipo de envío: 'lima' o 'provincia'
  tipo_envio         text not null check (tipo_envio in ('lima', 'provincia')),

  -- Datos comunes
  nombre_completo    text not null,
  whatsapp           text not null,

  -- Datos exclusivos de envío a Lima
  distrito            text,
  direccion_exacta    text,
  agrega_instalacion  boolean not null default false,

  -- Datos exclusivos de envío a Provincia
  dni                 text,
  departamento        text,
  ciudad_destino      text,
  sede_shalom         text,

  -- Datos del pedido
  cantidad            integer not null default 1,
  precio_unitario     numeric(10,2) not null default 89.00,
  costo_instalacion   numeric(10,2) not null default 0,
  total_pagar         numeric(10,2) not null,

  -- Origen del tráfico (para saber qué campaña generó la venta)
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_id               text,
  ttclid               text,

  -- Estado del pedido (lo puedes ir cambiando manualmente desde Supabase
  -- o desde un panel admin a futuro)
  estado               text not null default 'nuevo'
                        check (estado in ('nuevo', 'contactado', 'confirmado', 'enviado', 'entregado', 'cancelado')),

  -- Texto exacto que se mandó a WhatsApp (para auditoría)
  mensaje_whatsapp     text
);

comment on table public.pedidos is 'Pedidos generados desde el formulario de checkout de la landing';

create index if not exists idx_pedidos_creado_en on public.pedidos (creado_en desc);
create index if not exists idx_pedidos_estado on public.pedidos (estado);
create index if not exists idx_pedidos_tipo_envio on public.pedidos (tipo_envio);

-- ------------------------------------------------------------
-- TABLA: eventos_analytics
-- Guarda eventos básicos de comportamiento: visitas a la página
-- y clicks en botones clave (CTA, WhatsApp, abrir modal, etc).
-- Pensada para ser liviana, sin tracking invasivo.
-- ------------------------------------------------------------
create table if not exists public.eventos_analytics (
  id              uuid primary key default gen_random_uuid(),
  creado_en       timestamptz not null default now(),

  -- 'page_view' | 'click_cta_principal' | 'abrir_modal_checkout'
  -- | 'seleccion_envio_lima' | 'seleccion_envio_provincia'
  -- | 'click_confirmar_pedido' | 'click_whatsapp_flotante'
  tipo_evento     text not null,

  -- Identificador anónimo de sesión (generado en el navegador,
  -- no es información personal, solo agrupa eventos de una misma visita)
  session_id      text not null,

  -- Página / sección donde ocurrió el evento
  pagina          text default '/',

  -- UTMs para saber de qué campaña vino el evento
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_id           text,
  ttclid           text,

  -- Datos adicionales libres (referrer, ancho de pantalla, etc.)
  metadata        jsonb default '{}'::jsonb
);

comment on table public.eventos_analytics is 'Eventos básicos de visitas y clicks para medir el funnel de conversión';

create index if not exists idx_eventos_creado_en on public.eventos_analytics (creado_en desc);
create index if not exists idx_eventos_tipo on public.eventos_analytics (tipo_evento);
create index if not exists idx_eventos_session on public.eventos_analytics (session_id);

-- ------------------------------------------------------------
-- TABLA: stock
-- Controla cuántas unidades quedan disponibles, para que el
-- contador "¡Solo quedan X unidades!" sea real y no hardcodeado.
-- Se inicializa con una sola fila (id = 1).
-- ------------------------------------------------------------
create table if not exists public.stock (
  id                  integer primary key default 1,
  unidades_disponibles integer not null default 8,
  actualizado_en       timestamptz not null default now(),
  constraint solo_una_fila check (id = 1)
);

comment on table public.stock is 'Controla el stock mostrado en el contador de urgencia de la landing';

insert into public.stock (id, unidades_disponibles)
values (1, 8)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- FUNCIÓN: descontar_stock
-- Resta 1 unidad del stock cada vez que se confirma un pedido.
-- Nunca baja de 0.
-- ------------------------------------------------------------
create or replace function public.descontar_stock()
returns void
language plpgsql
security definer
as $$
begin
  update public.stock
  set unidades_disponibles = greatest(unidades_disponibles - 1, 0),
      actualizado_en = now()
  where id = 1;
end;
$$;

-- ------------------------------------------------------------
-- TRIGGER: al insertar un pedido nuevo, descuenta stock automáticamente
-- ------------------------------------------------------------
create or replace function public.trigger_descontar_stock()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.descontar_stock();
  return new;
end;
$$;

drop trigger if exists on_pedido_insertado on public.pedidos;
create trigger on_pedido_insertado
  after insert on public.pedidos
  for each row
  execute function public.trigger_descontar_stock();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Habilitamos RLS y permitimos que CUALQUIERA (rol "anon", es decir
-- visitantes de la landing sin login) pueda:
--  - INSERTAR pedidos y eventos (para que el formulario funcione)
--  - LEER el stock (para mostrar el contador)
-- Pero NO puedan leer los pedidos ni los eventos de otros usuarios.
-- Esto protege los datos de tus clientes (nombre, whatsapp, dirección).
-- ------------------------------------------------------------

alter table public.pedidos enable row level security;
alter table public.eventos_analytics enable row level security;
alter table public.stock enable row level security;

-- Cualquiera puede crear un pedido (insertar), pero no leer pedidos ajenos
drop policy if exists "Cualquiera puede crear pedidos" on public.pedidos;
create policy "Cualquiera puede crear pedidos"
  on public.pedidos
  for insert
  to anon
  with check (true);

-- Cualquiera puede registrar eventos de analytics
drop policy if exists "Cualquiera puede crear eventos" on public.eventos_analytics;
create policy "Cualquiera puede crear eventos"
  on public.eventos_analytics
  for insert
  to anon
  with check (true);

-- Cualquiera puede LEER el stock (para mostrar "quedan X unidades")
drop policy if exists "Cualquiera puede leer el stock" on public.stock;
create policy "Cualquiera puede leer el stock"
  on public.stock
  for select
  to anon
  using (true);

-- ------------------------------------------------------------
-- NOTA IMPORTANTE SOBRE SEGURIDAD:
-- Por defecto, con estas políticas, NADIE puede leer los pedidos
-- ni los eventos desde el navegador (ni siquiera tú, con la
-- "anon key"). Esto es intencional y seguro.
--
-- Para VER tus pedidos y analytics, usa el dashboard de Supabase:
-- Table Editor → pedidos / eventos_analytics
--
-- Si en el futuro quieres un panel admin web para ver pedidos,
-- se recomienda usar la "service_role key" SOLO desde un backend
-- seguro (nunca en el navegador), o crear un login de Supabase Auth
-- y una política adicional que solo te dé acceso a tu usuario admin.
-- ------------------------------------------------------------

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
