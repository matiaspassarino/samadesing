-- 1. Desactivar RLS en las tablas clonadas del sandbox para evitar error 403
ALTER TABLE public.contactos_sandbox DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_contactos_sandbox DISABLE ROW LEVEL SECURITY;
