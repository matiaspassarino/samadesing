// Campos obligatorios del proceso de Alta de Cliente
// Quien los carga y en qué tab del formulario se encuentran

export const CAMPOS_OBLIGATORIOS_VENDEDOR = [
  // ── Empresa
  { campo: 'razon_social',      label: 'Razón Social',           tab: 'Empresa' },
  { campo: 'nombre_comercial',  label: 'Nombre Comercial',       tab: 'Empresa' },
  { campo: 'pais',              label: 'País',                   tab: 'Empresa' },
  { campo: 'domicilio',         label: 'Dirección Legal',        tab: 'Empresa' },
  { campo: 'localidad',         label: 'Localidad',              tab: 'Empresa' },
  { campo: 'provincia',         label: 'Provincia/Estado',       tab: 'Empresa' },
  { campo: 'codigo_postal',     label: 'Código Postal',          tab: 'Empresa' },
  { campo: 'cuit',              label: 'CUIT',                   tab: 'Empresa' },
  { campo: 'condicion_iva',     label: 'Condición de IVA',       tab: 'Empresa' },
  // ── Contactos
  { campo: 'resp_compras_nombre',   label: 'Resp. Compras — Nombre',   tab: 'Contactos' },
  { campo: 'resp_compras_telefono', label: 'Resp. Compras — Teléfono', tab: 'Contactos' },
  { campo: 'resp_compras_email',    label: 'Resp. Compras — Email',    tab: 'Contactos' },
  { campo: 'resp_pagos_nombre',     label: 'Resp. Pagos — Nombre',     tab: 'Contactos' },
  { campo: 'resp_pagos_telefono',   label: 'Resp. Pagos — Teléfono',   tab: 'Contactos' },
  { campo: 'resp_pagos_email',      label: 'Resp. Pagos — Email',      tab: 'Contactos' },
  // ── Condiciones Comerciales (Vendedor)
  { campo: 'nombre_facturacion',   label: 'Nombre de Facturación',              tab: 'Condiciones' },
  { campo: 'domicilio_entrega',    label: 'Domicilio de Entrega',               tab: 'Condiciones' },
  { campo: 'localidad_entrega',    label: 'Localidad de Entrega',               tab: 'Condiciones' },
  { campo: 'provincia_entrega',    label: 'Provincia de Entrega',               tab: 'Condiciones' },
  { campo: 'horario_atencion',     label: 'Horario de Atención',                tab: 'Condiciones' },
  { campo: 'transporte_entrega',   label: 'Transporte/Condiciones de Entrega',  tab: 'Condiciones' },
];

// Campos que solo puede cargar el Admin
export const CAMPOS_OBLIGATORIOS_ADMIN = [
  { campo: 'condiciones_pago',          label: 'Condiciones de Pago',      tab: 'Condiciones' },
  { campo: 'limite_crediticio',         label: 'Límite Crediticio',        tab: 'Condiciones' },
  { campo: 'observaciones_comerciales', label: 'Observaciones Comerciales', tab: 'Condiciones' },
];

/**
 * Valida si un contacto tiene todos los campos obligatorios del Vendedor completos.
 * @param {Object} contacto — objeto contacto de Supabase
 * @returns {{ esValido: boolean, faltantes: Array<{campo, label, tab}>, porTab: Object }}
 */
export function validarAltaCliente(contacto) {
  const faltantes = CAMPOS_OBLIGATORIOS_VENDEDOR.filter(
    ({ campo }) => !contacto[campo]?.toString().trim()
  );

  // Agrupar por tab para el mensaje de error
  const porTab = faltantes.reduce((acc, item) => {
    if (!acc[item.tab]) acc[item.tab] = [];
    acc[item.tab].push(item.label);
    return acc;
  }, {});

  return {
    esValido: faltantes.length === 0,
    faltantes,
    porTab,
  };
}

/**
 * Calcula el estado de completitud de cada tab del formulario.
 * @param {Object} formData — estado del formulario local
 * @returns {Object} — { empresa: 'complete'|'incomplete', contactos: ..., condiciones: ..., socios: 'optional', referencias: 'optional' }
 */
export function calcularEstadoTabs(formData, userRole = 'Vendedor') {
  const camposEmpresa = ['razon_social', 'nombre_comercial', 'pais', 'domicilio', 'localidad', 'provincia', 'codigo_postal', 'cuit', 'condicion_iva'];
  const camposContactos = ['resp_compras_nombre', 'resp_compras_telefono', 'resp_compras_email', 'resp_pagos_nombre', 'resp_pagos_telefono', 'resp_pagos_email'];
  const camposCondicionesVendedor = ['nombre_facturacion', 'domicilio_entrega', 'localidad_entrega', 'provincia_entrega', 'horario_atencion', 'transporte_entrega'];
  const camposCondicionesAdmin = ['condiciones_pago', 'limite_crediticio', 'observaciones_comerciales'];

  const isComplete = (campos) => campos.every(c => formData[c]?.toString().trim());

  const camposCondicionesTotales = userRole === 'Admin' || userRole === 'Dev'
    ? [...camposCondicionesVendedor, ...camposCondicionesAdmin]
    : camposCondicionesVendedor;

  return {
    empresa:     isComplete(camposEmpresa) ? 'complete' : 'incomplete',
    contactos:   isComplete(camposContactos) ? 'complete' : 'incomplete',
    condiciones: isComplete(camposCondicionesTotales) ? 'complete' : 'incomplete',
    socios:      'optional',
    referencias: 'optional',
    historial:   'neutral',
  };
}
