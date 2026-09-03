-- Migración para Gamificación: Puntos y Logros

-- 1. Tablas de Gamificación para Producción
CREATE TABLE public.gamificacion_puntos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    puntos INT NOT NULL,
    motivo TEXT NOT NULL,
    referencia_id UUID, -- Opcional, ID de la interacción o contacto
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.gamificacion_logros_obtenidos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    logro_id TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(vendedor_id, logro_id)
);

-- Habilitar RLS en Producción
ALTER TABLE public.gamificacion_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacion_logros_obtenidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura gamificacion_puntos" ON public.gamificacion_puntos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion gamificacion_puntos" ON public.gamificacion_puntos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir todo gamificacion_puntos" ON public.gamificacion_puntos FOR ALL USING (true);

CREATE POLICY "Permitir lectura gamificacion_logros_obtenidos" ON public.gamificacion_logros_obtenidos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion gamificacion_logros_obtenidos" ON public.gamificacion_logros_obtenidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir todo gamificacion_logros_obtenidos" ON public.gamificacion_logros_obtenidos FOR ALL USING (true);

-- 2. Tablas de Gamificación para Sandbox (Dev)
CREATE TABLE public.gamificacion_puntos_sandbox (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    puntos INT NOT NULL,
    motivo TEXT NOT NULL,
    referencia_id UUID,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.gamificacion_logros_obtenidos_sandbox (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    logro_id TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(vendedor_id, logro_id)
);

-- Habilitar RLS en Sandbox
ALTER TABLE public.gamificacion_puntos_sandbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacion_logros_obtenidos_sandbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura gamificacion_puntos_sandbox" ON public.gamificacion_puntos_sandbox FOR SELECT USING (true);
CREATE POLICY "Permitir insercion gamificacion_puntos_sandbox" ON public.gamificacion_puntos_sandbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir todo gamificacion_puntos_sandbox" ON public.gamificacion_puntos_sandbox FOR ALL USING (true);

CREATE POLICY "Permitir lectura gamificacion_logros_obtenidos_sandbox" ON public.gamificacion_logros_obtenidos_sandbox FOR SELECT USING (true);
CREATE POLICY "Permitir insercion gamificacion_logros_obtenidos_sandbox" ON public.gamificacion_logros_obtenidos_sandbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir todo gamificacion_logros_obtenidos_sandbox" ON public.gamificacion_logros_obtenidos_sandbox FOR ALL USING (true);

