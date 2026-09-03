-- Dar permisos base a los roles de Supabase para las tablas de gamificacion
GRANT ALL ON TABLE public.gamificacion_puntos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.gamificacion_logros_obtenidos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.gamificacion_puntos_sandbox TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.gamificacion_logros_obtenidos_sandbox TO anon, authenticated, service_role;

-- Reasegurar las politicas RLS (por si fallaron antes)
ALTER TABLE public.gamificacion_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacion_logros_obtenidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacion_puntos_sandbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacion_logros_obtenidos_sandbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo gamificacion_puntos" ON public.gamificacion_puntos;
CREATE POLICY "Permitir todo gamificacion_puntos" ON public.gamificacion_puntos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo gamificacion_logros_obtenidos" ON public.gamificacion_logros_obtenidos;
CREATE POLICY "Permitir todo gamificacion_logros_obtenidos" ON public.gamificacion_logros_obtenidos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo gamificacion_puntos_sandbox" ON public.gamificacion_puntos_sandbox;
CREATE POLICY "Permitir todo gamificacion_puntos_sandbox" ON public.gamificacion_puntos_sandbox FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo gamificacion_logros_obtenidos_sandbox" ON public.gamificacion_logros_obtenidos_sandbox;
CREATE POLICY "Permitir todo gamificacion_logros_obtenidos_sandbox" ON public.gamificacion_logros_obtenidos_sandbox FOR ALL USING (true);
