-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Tabla de Contactos
CREATE TABLE public.contactos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    codigo TEXT,
    razon_social TEXT NOT NULL,
    cuit TEXT,
    telefono TEXT,
    fecha_alta TEXT,
    provincia TEXT,
    domicilio TEXT,
    condicion_iva TEXT,
    unidad_negocio TEXT,
    estado_actual TEXT DEFAULT 'Nuevo', -- Estados posibles: 'Nuevo', 'Admin_Rellamar', 'Supervisor', 'Asignado', 'Rellamar', 'Diferido', 'Venta', 'Perdido', 'Descartado'
    vendedor_id UUID REFERENCES public.perfiles(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Interacciones de Contactos
CREATE TABLE public.interacciones_contactos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    contacto_id UUID REFERENCES public.contactos(id) ON DELETE CASCADE,
    tipo_accion TEXT NOT NULL, -- ej: 'Llamada Admin', 'Llamada Vendedor', 'diferido'
    resultado TEXT, -- ej: 'Exitoso', 'No Responde', 'Descartado'
    notas TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    completada BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en contactos" ON public.contactos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en interacciones_contactos" ON public.interacciones_contactos FOR ALL USING (true) WITH CHECK (true);

-- Trigger para actualizar fecha_actualizacion en contactos
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_contactos_updated
  BEFORE UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
