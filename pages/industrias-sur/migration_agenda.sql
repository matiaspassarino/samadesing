-- Tabla para Tareas Generales (Agenda)
CREATE TABLE public.tareas_agenda (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    creador_id UUID REFERENCES public.perfiles(id),
    contacto_id UUID REFERENCES public.contactos(id) ON DELETE SET NULL, -- Opcional, si está ligada a un lead
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL DEFAULT 'Otra', -- ej: 'Viaje', 'Visita', 'Llamada', 'Otra'
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    completada BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tareas_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en tareas_agenda" ON public.tareas_agenda FOR ALL USING (true) WITH CHECK (true);

-- Tabla para Sandbox
CREATE TABLE public.tareas_agenda_sandbox (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    vendedor_id UUID,
    creador_id UUID,
    contacto_id UUID,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL DEFAULT 'Otra',
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    completada BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tareas_agenda_sandbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en tareas_agenda_sandbox" ON public.tareas_agenda_sandbox FOR ALL USING (true) WITH CHECK (true);
