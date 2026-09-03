-- Agregar columnas faltantes al sandbox si el cliente no lo reconstruyó
ALTER TABLE public.contactos_sandbox
  ADD COLUMN IF NOT EXISTS nombre_comercial TEXT,
  ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Argentina',
  ADD COLUMN IF NOT EXISTS localidad TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS ingresos_brutos TEXT,
  ADD COLUMN IF NOT EXISTS resp_compras_nombre TEXT,
  ADD COLUMN IF NOT EXISTS resp_compras_telefono TEXT,
  ADD COLUMN IF NOT EXISTS resp_compras_email TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_nombre TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_telefono TEXT,
  ADD COLUMN IF NOT EXISTS resp_pagos_email TEXT,
  ADD COLUMN IF NOT EXISTS nombre_facturacion TEXT,
  ADD COLUMN IF NOT EXISTS domicilio_entrega TEXT,
  ADD COLUMN IF NOT EXISTS localidad_entrega TEXT,
  ADD COLUMN IF NOT EXISTS provincia_entrega TEXT,
  ADD COLUMN IF NOT EXISTS horario_atencion TEXT,
  ADD COLUMN IF NOT EXISTS transporte_entrega TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_pago TEXT,
  ADD COLUMN IF NOT EXISTS limite_crediticio TEXT,
  ADD COLUMN IF NOT EXISTS observaciones_comerciales TEXT,
  ADD COLUMN IF NOT EXISTS socios JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referencias_bancarias JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referencias_comerciales JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catalogo_digital BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalogo_fisico BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS presupuesto_enviado BOOLEAN DEFAULT false;

-- Tambien asegurar que existen en produccion las de gamificacion (catalogo)
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS catalogo_digital BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalogo_fisico BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS presupuesto_enviado BOOLEAN DEFAULT false;
