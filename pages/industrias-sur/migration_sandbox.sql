-- 1. CLONAR LA ESTRUCTURA DE CONTACTOS PARA EL SANDBOX
CREATE TABLE IF NOT EXISTS public.contactos_sandbox (LIKE public.contactos INCLUDING ALL);

-- 2. CLONAR LA ESTRUCTURA DE INTERACCIONES PARA EL SANDBOX
CREATE TABLE IF NOT EXISTS public.interacciones_contactos_sandbox (LIKE public.interacciones_contactos INCLUDING ALL);

-- 3. AJUSTAR LA LLAVE FORÁNEA (Para que las interacciones del sandbox apunten a los contactos del sandbox y no a los de producción)
ALTER TABLE public.interacciones_contactos_sandbox
  DROP CONSTRAINT IF EXISTS interacciones_contactos_contacto_id_fkey; -- Quitamos la FK heredada

ALTER TABLE public.interacciones_contactos_sandbox
  ADD CONSTRAINT interacciones_contactos_sandbox_contacto_id_fkey
  FOREIGN KEY (contacto_id) REFERENCES public.contactos_sandbox(id) ON DELETE CASCADE;

-- 4. INSERTAR UN PAR DE CONTACTOS DE PRUEBA (MOCKS) EN EL SANDBOX PARA QUE EL DEV TENGA ALGO CON QUÉ TRABAJAR
INSERT INTO public.contactos_sandbox (
  razon_social, nombre_comercial, cuit, condicion_iva, pais, domicilio, localidad, provincia, codigo_postal,
  resp_compras_nombre, resp_compras_telefono, resp_compras_email, resp_pagos_nombre, resp_pagos_telefono, resp_pagos_email,
  estado_actual, unidad_negocio, vendedor_id
)
VALUES 
(
  'Mock Empresa S.A.', 'MockingBird', '30-12345678-9', 'Responsable Inscripto', 'Argentina', 'Calle Falsa 123', 'Mock City', 'Buenos Aires', '1234',
  'Juan Compras', '1122334455', 'compras@mock.com', 'Maria Pagos', '1122334466', 'pagos@mock.com',
  'Nuevo', 'Industrias Sur', null
),
(
  'Testing SRL', 'Test Corp', '30-98765432-1', 'Monotributo', 'Argentina', 'Avenida Siempreviva 742', 'Springfield', 'Buenos Aires', '7420',
  'Homero Compras', '1133224455', 'h.compras@test.com', 'Marge Pagos', '1133224466', 'm.pagos@test.com',
  'Asignado', 'Aries', null
);