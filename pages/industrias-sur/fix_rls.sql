-- 1. Desactivar RLS en las tablas clonadas del sandbox para evitar error 403
ALTER TABLE public.contactos_sandbox DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_contactos_sandbox DISABLE ROW LEVEL SECURITY;

-- 2. Otorgar permisos (Grants) a los roles autenticados, ya que CREATE TABLE LIKE no copia los permisos
GRANT ALL ON public.contactos_sandbox TO authenticated;
GRANT ALL ON public.interacciones_contactos_sandbox TO authenticated;
GRANT ALL ON public.contactos_sandbox TO anon;
GRANT ALL ON public.interacciones_contactos_sandbox TO anon;
