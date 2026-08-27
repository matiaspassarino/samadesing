-- ============================================================
-- MIGRACIÓN: Alta de Cliente
-- Ejecutar en el SQL Editor de Supabase
-- Agrega todos los campos del formulario formal de Alta de Cliente
-- ============================================================

-- ── SECCIÓN 1: Información de la Empresa ──────────────────────
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS nombre_comercial TEXT,
  ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Argentina',
  ADD COLUMN IF NOT EXISTS localidad TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS ingresos_brutos TEXT;
-- (razon_social, cuit, domicilio, provincia, condicion_iva ya existían)

-- ── SECCIÓN 2: Contactos (Responsables) ───────────────────────
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS resp_compras_nombre TEXT,
  ADD COLUMN IF NOT EXISTS resp_compras_telefono TEXT,
  ADD COLUMN IF NOT EXISTS resp_compras_email TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_nombre TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_telefono TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_email TEXT;

-- ── SECCIÓN 3: Condiciones Comerciales ────────────────────────
-- Vendedor carga:
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS nombre_facturacion TEXT,
  ADD COLUMN IF NOT EXISTS domicilio_entrega TEXT,
  ADD COLUMN IF NOT EXISTS localidad_entrega TEXT,
  ADD COLUMN IF NOT EXISTS provincia_entrega TEXT,
  ADD COLUMN IF NOT EXISTS horario_atencion TEXT,
  ADD COLUMN IF NOT EXISTS transporte_entrega TEXT;

-- Admin carga:
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS condiciones_pago TEXT,
  ADD COLUMN IF NOT EXISTS limite_crediticio TEXT,
  ADD COLUMN IF NOT EXISTS observaciones_comerciales TEXT;

-- ── SECCIÓN 4: Socios (JSONB — array de hasta N socios) ───────
-- Estructura de cada item: { nombre, telefono, cargo }
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS socios JSONB DEFAULT '[]'::jsonb;

-- ── SECCIÓN 5: Referencias Bancarias ──────────────────────────
-- Estructura de cada item: { banco, tipo_cuenta, domicilio, telefono, nombre_cuenta }
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS referencias_bancarias JSONB DEFAULT '[]'::jsonb;

-- ── SECCIÓN 6: Referencias Comerciales ───────────────────────
-- Estructura de cada item: { empresa_cuit, nombre_contacto, telefono }
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS referencias_comerciales JSONB DEFAULT '[]'::jsonb;

-- ── ÍNDICE para búsqueda por completitud ─────────────────────
-- Permite filtrar fácilmente contactos con alta completa
CREATE INDEX IF NOT EXISTS idx_contactos_alta_completa
  ON public.contactos (razon_social, nombre_comercial, cuit)
  WHERE razon_social IS NOT NULL
    AND nombre_comercial IS NOT NULL
    AND cuit IS NOT NULL;
