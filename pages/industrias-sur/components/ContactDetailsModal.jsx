import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, Clock, Trash2, Save, Building2, Phone, MapPin, Loader2, Mail, Users, FileText, Check, AlertTriangle, ChevronRight, Plus, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calcularEstadoTabs, validarAltaCliente } from '../lib/validarAltaCliente';

const UNIDADES_NEGOCIO = ['Industrias Sur', 'Aries', 'Medús'];

const CONDICIONES_IVA = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'Sujeto No Categorizado'
];

const PROVINCIAS_LOCALIDADES = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'San Nicolás', 'Pergamino', 'Junín', 'Campana', 'Zárate', 'Pilar', 'Tigre'],
  'CABA': ['CABA'],
  'Catamarca': ['Catamarca (Capital)', 'Valle Viejo', 'Andalgalá', 'Tinogasta'],
  'Chaco': ['Resistencia', 'Sáenz Peña', 'Villa Ángela', 'Charata'],
  'Chubut': ['Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel', 'Rawson'],
  'Córdoba': ['Córdoba Capital', 'Villa Carlos Paz', 'Río Cuarto', 'Alta Gracia', 'Villa María', 'San Francisco', 'Jesus María', 'Carlos Paz', 'Río Tercero'],
  'Corrientes': ['Corrientes', 'Goya', 'Paso de los Libres', 'Curuzú Cuatiá', 'Mercedes'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Villaguay'],
  'Formosa': ['Formosa', 'Clorinda', 'Pirané'],
  'Jujuy': ['San Salvador de Jujuy', 'San Pedro', 'Palpalá', 'Libertador Gral. San Martín'],
  'La Pampa': ['Santa Rosa', 'General Pico', 'Toay', 'Victorica'],
  'La Rioja': ['La Rioja', 'Chilecito', 'Chamical'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo', 'Maipú', 'Guaymallén', 'Las Heras'],
  'Misiones': ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú'],
  'Neuquén': ['Neuquén', 'San Martín de los Andes', 'Zapala', 'Cutral Có', 'Centenario'],
  'Río Negro': ['Bariloche', 'Roca', 'Cipolletti', 'Viedma', 'Villa Regina'],
  'Salta': ['Salta', 'Orán', 'Tartagal', 'General Güemes'],
  'San Juan': ['San Juan', 'Rawson', 'Rivadavia', 'Chimbas'],
  'San Luis': ['San Luis', 'Villa Mercedes', 'Merlo', 'Juana Koslay'],
  'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate', 'Pico Truncado'],
  'Santa Fe': ['Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Santo Tomé', 'San Lorenzo'],
  'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Termas de Río Hondo'],
  'Tierra del Fuego': ['Ushuaia', 'Río Grande', 'Tolhuin'],
  'Tucumán': ['San Miguel de Tucumán', 'Tafí Viejo', 'Concepción', 'Yerba Buena', 'Banda del Río Salí']
};

const TabButton = ({ id, label, icon: Icon, status, activeTab, setActiveTab }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); setActiveTab(id); }}
    className={`flex items-center gap-2 p-3 w-full text-left rounded-lg transition-colors ${activeTab === id ? 'bg-primary-50 text-primary-900 font-bold' : 'hover:bg-neutral-100 text-neutral-600 font-medium'}`}
  >
    <Icon size={18} className={activeTab === id ? 'text-primary-600' : 'text-neutral-400'} />
    <span className="flex-1 text-sm">{label}</span>
    {status === 'complete' && <CheckCircle size={16} className="text-green-500" />}
    {status === 'incomplete' && <AlertTriangle size={16} className="text-yellow-500" />}
    {status === 'optional' && <span className="text-xs text-neutral-400 font-normal">Opc.</span>}
  </button>
);

const Input = ({ label, name, required, value, onChange, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-neutral-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
      {...props}
    />
  </div>
);

const Select = ({ label, name, required, value, onChange, options, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-neutral-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
      {...props}
    >
      <option value="">Seleccione...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default function ContactDetailsModal({ contacto, onClose, onRefresh, userRole = 'Admin', isDev = false }) {
  const FORM_TABS_ORDER = ['Empresa', 'Contactos', 'Condiciones', 'Socios', 'Referencias'];
  const [activeTab, setActiveTab] = useState('Empresa');
  
  // Estado general
  const [formData, setFormData] = useState({
    // Empresa
    razon_social: contacto.razon_social || '',
    nombre_comercial: contacto.nombre_comercial || '',
    pais: contacto.pais || 'Argentina',
    domicilio: contacto.domicilio || '',
    localidad: contacto.localidad || '',
    provincia: contacto.provincia || '',
    codigo_postal: contacto.codigo_postal || '',
    cuit: contacto.cuit || '',
    condicion_iva: contacto.condicion_iva || '',
    ingresos_brutos: contacto.ingresos_brutos || '',
    telefono: contacto.telefono || '',
    telefono_whatsapp: contacto.telefono_whatsapp || false,
    email: contacto.email || '',
    // Contactos
    resp_compras_nombre: contacto.resp_compras_nombre || '',
    resp_compras_telefono: contacto.resp_compras_telefono || '',
    resp_compras_email: contacto.resp_compras_email || '',
    resp_pagos_nombre: contacto.resp_pagos_nombre || '',
    resp_pagos_telefono: contacto.resp_pagos_telefono || '',
    resp_pagos_email: contacto.resp_pagos_email || '',
    // Condiciones Comerciales
    nombre_facturacion: contacto.nombre_facturacion || '',
    domicilio_entrega: contacto.domicilio_entrega || '',
    localidad_entrega: contacto.localidad_entrega || '',
    provincia_entrega: contacto.provincia_entrega || '',
    horario_atencion: contacto.horario_atencion || '',
    transporte_entrega: contacto.transporte_entrega || '',
    condiciones_pago: contacto.condiciones_pago || '',
    limite_crediticio: contacto.limite_crediticio || '',
    observaciones_comerciales: contacto.observaciones_comerciales || ''
  });

  const [unidades, setUnidades] = useState(() => {
    if (!contacto.unidad_negocio) return [];
    return contacto.unidad_negocio.split(',').map(s => s.trim()).filter(Boolean);
  });

  const [socios, setSocios] = useState(() => {
    try { return typeof contacto.socios === 'string' ? JSON.parse(contacto.socios) : (contacto.socios || []); } catch(e) { return []; }
  });
  
  const [refBancarias, setRefBancarias] = useState(() => {
    try { return typeof contacto.referencias_bancarias === 'string' ? JSON.parse(contacto.referencias_bancarias) : (contacto.referencias_bancarias || []); } catch(e) { return []; }
  });

  const [refComerciales, setRefComerciales] = useState(() => {
    try { return typeof contacto.referencias_comerciales === 'string' ? JSON.parse(contacto.referencias_comerciales) : (contacto.referencias_comerciales || []); } catch(e) { return []; }
  });

  const [savingInfo, setSavingInfo] = useState(false);
  
  // Interacción / Historial
  const [resultado, setResultado] = useState('exitoso');
  const [comentarios, setComentarios] = useState('');
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  // Estados visuales de completitud
  const [tabStatus, setTabStatus] = useState(calcularEstadoTabs(formData, userRole));

  useEffect(() => {
    fetchHistorial();
  }, [contacto.id]);

  useEffect(() => {
    setTabStatus(calcularEstadoTabs(formData, userRole));
  }, [formData, userRole]);

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    
    // Fetch interacciones
    const { data: intData, error: intError } = await supabase
      .from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos')
      .select('*')
      .eq('contacto_id', contacto.id);
      
    // Fetch tareas asociadas al contacto
    const { data: tareasData, error: tareasError } = await supabase
      .from(isDev ? 'tareas_agenda_sandbox' : 'tareas_agenda')
      .select('*')
      .eq('contacto_id', contacto.id);

    let combinado = [];
    if (!intError && intData) {
      combinado = [...combinado, ...intData.map(item => ({...item, _isTarea: false}))];
    }
    if (!tareasError && tareasData) {
      combinado = [...combinado, ...tareasData.map(item => ({...item, _isTarea: true}))];
    }
    
    // Ordenar descendente por fecha_creacion
    combinado.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    
    setHistorial(combinado);
    setLoadingHistorial(false);
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      value = checked;
    } else {
      if (name === 'cuit') {
        value = value.replace(/\D/g, '').slice(0, 11);
      }
      if (name === 'telefono' || name === 'resp_compras_telefono' || name === 'resp_pagos_telefono') {
        value = value.replace(/\D/g, '');
      }
      if (name === 'provincia') {
        // Reset localidad if provincia changes
        setFormData(prev => ({ ...prev, [name]: value, localidad: '' }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleUnidad = (u) => {
    setUnidades(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  };

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) return 'El Email Principal no es válido (falta @ o dominio).';
    if (formData.resp_compras_email && !emailRegex.test(formData.resp_compras_email)) return 'El Email de Compras no es válido.';
    if (formData.resp_pagos_email && !emailRegex.test(formData.resp_pagos_email)) return 'El Email de Pagos no es válido.';
    return null;
  };

  const handleConvertToClient = async () => {
    const validacion = validarAltaCliente({
      ...formData,
      unidad_negocio: unidades.join(' , '),
      socios: socios,
      referencias_bancarias: refBancarias,
      referencias_comerciales: refComerciales
    });
    
    if (!validacion.esValido) {
      const tabs = Object.keys(validacion.porTab).join(', ');
      toast.error(`Faltan completar campos obligatorios en: ${tabs}.`, { duration: 5000 });
      return;
    }

    const emailError = validateEmails();
    if (emailError) {
      toast.error(emailError, { duration: 5000 });
      return;
    }

    setSavingInfo(true);
    const updateData = {
      ...formData,
      unidad_negocio: unidades.join(' , '),
      socios: socios,
      referencias_bancarias: refBancarias,
      referencias_comerciales: refComerciales,
      estado_actual: 'Venta'
    };

    const { error } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .update(updateData)
      .eq('id', contacto.id);
      
    if (error) {
      toast.error('Error al convertir a cliente.');
    } else {
      toast.success('¡Contacto convertido a Cliente exitosamente!');
      
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert({
        contacto_id: contacto.id,
        tipo_accion: 'Alta de Cliente',
        resultado: 'Exitoso',
        notas: 'Se completaron todos los datos y se convirtió a cliente.',
        completada: true
      });
      
      if(onRefresh) onRefresh();
      onClose();
    }
    setSavingInfo(false);
  };

  const handleSaveContactInfo = async (e) => {
    if (e) e.preventDefault();
    
    const emailError = validateEmails();
    if (emailError) {
      toast.error(emailError, { duration: 5000 });
      return;
    }

    setSavingInfo(true);
    
    const updateData = {
      ...formData,
      unidad_negocio: unidades.join(' , '),
      socios: socios,
      referencias_bancarias: refBancarias,
      referencias_comerciales: refComerciales
    };

    const { error } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .update(updateData)
      .eq('id', contacto.id);
      
    if (error) {
      toast.error('Error al actualizar la información.');
    } else {
      toast.success('Información guardada correctamente.');
      if(onRefresh) onRefresh();
    }
    setSavingInfo(false);
  };

  const handleSubmitInteraction = async (e) => {
    e.preventDefault();
    if (!comentarios.trim()) return;
    
    setSavingInteraction(true);
    const interaction = {
      contacto_id: contacto.id,
      tipo_accion: 'Registro Directo',
      resultado,
      notas: comentarios,
      fecha_creacion: new Date().toISOString()
    };
    
    const { error } = await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert(interaction);
    if (error) {
      toast.error('Error al guardar interacción: ' + error.message);
    } else {
      toast.success('Interacción guardada');
      setComentarios('');
      fetchHistorial();
    }
    setSavingInteraction(false);
  };

  const handleArrayAdd = (setter, emptyObj) => {
    setter(prev => [...prev, { ...emptyObj, id: Date.now() }]);
  };
  
  const handleArrayRemove = (setter, id) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const handleArrayChange = (setter, id, field, value) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };



  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-6xl h-[95vh] shadow-2xl flex flex-col overflow-hidden rounded-t-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-lg text-neutral-800">
              {['Nuevo', 'Asignado'].includes(contacto.estado_actual) ? 'Alta de Prospecto' : 'Ficha del Cliente'}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm text-neutral-600 font-medium truncate">{contacto.razon_social}</p>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs font-bold shrink-0">{contacto.estado_actual}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-xl transition-colors ml-2 shrink-0"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="lg:w-64 border-r border-neutral-200 bg-white flex flex-col shrink-0 overflow-y-auto hidden lg:flex p-4 gap-1">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-3">Formulario</h4>
            <TabButton id="Empresa" label="Empresa" icon={Building2} status={tabStatus.empresa} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="Contactos" label="Contactos" icon={Users} status={tabStatus.contactos} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="Condiciones" label="Condiciones Comerciales" icon={FileText} status={tabStatus.condiciones} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="Socios" label="Socios de la firma" icon={Users} status={tabStatus.socios} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="Referencias" label="Referencias" icon={FileText} status={tabStatus.referencias} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="h-px bg-neutral-200 my-2"></div>
            <TabButton id="Historial" label="Historial e Interacción" icon={History} status="neutral" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Mobile Select Tab (Solo visible en pantallas pequeñas) */}
          <div className="lg:hidden p-3 border-b border-neutral-200 bg-neutral-50">
             <select 
               value={activeTab} 
               onChange={(e) => setActiveTab(e.target.value)}
               className="w-full bg-white border border-neutral-300 text-neutral-800 rounded-lg px-4 py-2 font-semibold shadow-sm focus:ring-2 focus:ring-primary-500"
             >
               <option value="Empresa">1. Empresa {tabStatus.empresa === 'complete' ? '✓' : '⚠'}</option>
               <option value="Contactos">2. Contactos {tabStatus.contactos === 'complete' ? '✓' : '⚠'}</option>
               <option value="Condiciones">3. Condiciones Comerciales {tabStatus.condiciones === 'complete' ? '✓' : '⚠'}</option>
               <option value="Socios">4. Socios (Opcional)</option>
               <option value="Referencias">5. Referencias (Opcional)</option>
               <option value="Historial">6. Historial e Interacción</option>
             </select>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white relative">
            <form onSubmit={handleSaveContactInfo} className={activeTab === 'Historial' ? 'hidden' : 'p-5 lg:p-8 max-w-3xl w-full mx-auto'}>
              
              {activeTab === 'Empresa' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2"><Building2 className="text-primary-500" /> Información de la Empresa</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2"><Input label="Razón Social" name="razon_social" required value={formData.razon_social} onChange={handleChange} /></div>
                    <Input label="Nombre Comercial (Si aplica)" name="nombre_comercial" required value={formData.nombre_comercial} onChange={handleChange} />
                    <Input label="CUIT (Solo números)" name="cuit" required value={formData.cuit} onChange={handleChange} placeholder="Ej: 30111111118" />
                    <Select label="Condición de IVA" name="condicion_iva" required options={CONDICIONES_IVA} value={formData.condicion_iva} onChange={handleChange} />
                    <Input label="Ingresos Brutos" name="ingresos_brutos" value={formData.ingresos_brutos} onChange={handleChange} />
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 mt-2">
                      <Input label="Email Principal" name="email" type="email" required value={formData.email} onChange={handleChange} />
                      <div>
                        <Input label="Teléfono (Sin 0 ni 15, solo números)" name="telefono" type="tel" required value={formData.telefono} onChange={handleChange} placeholder="Ej: 3515555555" />
                        <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm font-medium text-neutral-600">
                          <input type="checkbox" name="telefono_whatsapp" checked={formData.telefono_whatsapp} onChange={handleChange} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                          <span>Es número de WhatsApp</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <h5 className="font-semibold text-neutral-700 text-sm mb-3">Dirección</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Input label="País" name="pais" required value={formData.pais} onChange={handleChange} />
                    <Select 
                      label="Provincia/Estado" 
                      name="provincia" 
                      required 
                      options={Object.keys(PROVINCIAS_LOCALIDADES)} 
                      value={formData.provincia} 
                      onChange={handleChange} 
                    />
                    <Select 
                      label="Localidad" 
                      name="localidad" 
                      required 
                      options={formData.provincia ? (PROVINCIAS_LOCALIDADES[formData.provincia] || []) : []} 
                      value={formData.localidad} 
                      onChange={handleChange} 
                      disabled={!formData.provincia}
                    />
                    <Input label="Código Postal" name="codigo_postal" required value={formData.codigo_postal} onChange={handleChange} />
                    <div className="md:col-span-2"><Input label="Dirección Legal" name="domicilio" required value={formData.domicilio} onChange={handleChange} /></div>
                  </div>

                  <h5 className="font-semibold text-neutral-700 text-sm mb-3">Unidades de Negocio Interesadas</h5>
                  <div className="flex flex-wrap gap-3">
                    {UNIDADES_NEGOCIO.map(u => (
                      <label key={u} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${unidades.includes(u) ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-white hover:border-primary-300'}`}>
                        <input type="checkbox" checked={unidades.includes(u)} onChange={() => handleToggleUnidad(u)} className="hidden" />
                        <span className="font-semibold text-sm">{u}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Contactos' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2"><Users className="text-primary-500" /> Contactos Responsables</h4>
                  
                  <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 mb-6">
                    <h5 className="font-bold text-neutral-700 mb-4 flex items-center gap-2">Responsable de Compras</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><Input label="Nombre y Apellido" name="resp_compras_nombre" required value={formData.resp_compras_nombre} onChange={handleChange} /></div>
                      <Input label="Teléfono" name="resp_compras_telefono" type="tel" required value={formData.resp_compras_telefono} onChange={handleChange} />
                      <Input label="Email" name="resp_compras_email" type="email" required value={formData.resp_compras_email} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 mb-6">
                    <h5 className="font-bold text-neutral-700 mb-4 flex items-center gap-2">Responsable de Pagos</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><Input label="Nombre y Apellido" name="resp_pagos_nombre" required value={formData.resp_pagos_nombre} onChange={handleChange} /></div>
                      <Input label="Teléfono" name="resp_pagos_telefono" type="tel" required value={formData.resp_pagos_telefono} onChange={handleChange} />
                      <Input label="Email" name="resp_pagos_email" type="email" required value={formData.resp_pagos_email} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Condiciones' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2"><FileText className="text-primary-500" /> Condiciones Comerciales</h4>
                  
                  <div className="mb-8">
                    <h5 className="font-bold text-neutral-700 mb-4">Logística y Facturación (Carga Vendedor)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><Input label="Nombre de la empresa (Facturación)" name="nombre_facturacion" required value={formData.nombre_facturacion} onChange={handleChange} /></div>
                      <div className="md:col-span-2"><Input label="Domicilio de Entrega" name="domicilio_entrega" required value={formData.domicilio_entrega} onChange={handleChange} /></div>
                      <Input label="Localidad de Entrega" name="localidad_entrega" required value={formData.localidad_entrega} onChange={handleChange} />
                      <Input label="Provincia de Entrega" name="provincia_entrega" required value={formData.provincia_entrega} onChange={handleChange} />
                      <Input label="Horario de Atención" name="horario_atencion" placeholder="Ej: Lun a Vie 9 a 18hs" required value={formData.horario_atencion} onChange={handleChange} />
                      <Input label="Transporte / Condiciones de entrega" name="transporte_entrega" required value={formData.transporte_entrega} onChange={handleChange} />
                    </div>
                  </div>

                  {(userRole === 'Admin' || userRole === 'Dev') && (
                    <div className="bg-primary-50 p-5 rounded-xl border border-primary-200">
                      <h5 className="font-bold text-primary-900 mb-4 flex items-center gap-2">🛡️ Autorización Crediticia (Solo Admin)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Condiciones de pago (plazo)" name="condiciones_pago" required={userRole === 'Admin'} value={formData.condiciones_pago} onChange={handleChange} />
                        <Input label="Límites crediticios" name="limite_crediticio" required={userRole === 'Admin'} value={formData.limite_crediticio} onChange={handleChange} />
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-primary-900 mb-1">Observaciones comerciales</label>
                          <textarea
                            name="observaciones_comerciales"
                            value={formData.observaciones_comerciales}
                            onChange={handleChange}
                            required={userRole === 'Admin'}
                            className="w-full bg-white border border-primary-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {userRole !== 'Admin' && userRole !== 'Dev' && (
                     <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-sm text-neutral-600 flex items-start gap-2 mt-4">
                        <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                        Las condiciones de pago y límite crediticio serán completadas por Administración.
                     </div>
                  )}
                </div>
              )}

              {activeTab === 'Socios' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-neutral-800 flex items-center gap-2"><Users className="text-primary-500" /> Socios de la Firma</h4>
                    <button type="button" onClick={() => handleArrayAdd(setSocios, {nombre: '', telefono: '', cargo: ''})} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors">
                      <Plus size={16} /> Agregar Socio
                    </button>
                  </div>
                  
                  {socios.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">No hay socios cargados. Es un campo opcional.</div>
                  ) : (
                    <div className="space-y-4">
                      {socios.map((socio, idx) => (
                        <div key={socio.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl relative group">
                          <button type="button" onClick={() => handleArrayRemove(setSocios, socio.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Trash2 size={16} /></button>
                          <h6 className="text-xs font-bold text-neutral-500 mb-3">Socio #{idx + 1}</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 mb-1">Nombre</label>
                              <input value={socio.nombre} onChange={(e) => handleArrayChange(setSocios, socio.id, 'nombre', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 mb-1">Teléfono</label>
                              <input value={socio.telefono} onChange={(e) => handleArrayChange(setSocios, socio.id, 'telefono', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 mb-1">Cargo</label>
                              <input value={socio.cargo} onChange={(e) => handleArrayChange(setSocios, socio.id, 'cargo', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Referencias' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* Bancarias */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-neutral-800 flex items-center gap-2"><Building2 className="text-primary-500" /> Referencias Bancarias</h4>
                      <button type="button" onClick={() => handleArrayAdd(setRefBancarias, {banco: '', tipo_cuenta: '', domicilio: '', telefono: '', nombre_cuenta: ''})} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={16} /> Agregar
                      </button>
                    </div>
                    {refBancarias.length === 0 ? (
                      <p className="text-sm text-neutral-400 italic">No hay referencias bancarias cargadas (Opcional).</p>
                    ) : (
                      <div className="space-y-4">
                        {refBancarias.map((ref, idx) => (
                          <div key={ref.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl relative group">
                            <button type="button" onClick={() => handleArrayRemove(setRefBancarias, ref.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Trash2 size={16} /></button>
                            <h6 className="text-xs font-bold text-neutral-500 mb-3">Banco #{idx + 1}</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input placeholder="Banco" value={ref.banco} onChange={(e) => handleArrayChange(setRefBancarias, ref.id, 'banco', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                              <input placeholder="Tipo y N° Cuenta" value={ref.tipo_cuenta} onChange={(e) => handleArrayChange(setRefBancarias, ref.id, 'tipo_cuenta', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                              <input placeholder="Domicilio" value={ref.domicilio} onChange={(e) => handleArrayChange(setRefBancarias, ref.id, 'domicilio', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                              <input placeholder="Teléfono" value={ref.telefono} onChange={(e) => handleArrayChange(setRefBancarias, ref.id, 'telefono', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                              <input placeholder="Nombre oficial de Cuenta" value={ref.nombre_cuenta} onChange={(e) => handleArrayChange(setRefBancarias, ref.id, 'nombre_cuenta', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comerciales */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-neutral-800 flex items-center gap-2"><MapPin className="text-primary-500" /> Referencias Comerciales</h4>
                      <button type="button" onClick={() => handleArrayAdd(setRefComerciales, {empresa_cuit: '', nombre_contacto: '', telefono: ''})} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={16} /> Agregar
                      </button>
                    </div>
                    {refComerciales.length === 0 ? (
                      <p className="text-sm text-neutral-400 italic">No hay referencias comerciales cargadas (Opcional).</p>
                    ) : (
                      <div className="space-y-4">
                        {refComerciales.map((ref, idx) => (
                          <div key={ref.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl relative group">
                            <button type="button" onClick={() => handleArrayRemove(setRefComerciales, ref.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Trash2 size={16} /></button>
                            <h6 className="text-xs font-bold text-neutral-500 mb-3">Referencia Comercial #{idx + 1}</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input placeholder="Empresa y CUIT" value={ref.empresa_cuit} onChange={(e) => handleArrayChange(setRefComerciales, ref.id, 'empresa_cuit', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                              <input placeholder="Nombre de Contacto" value={ref.nombre_contacto} onChange={(e) => handleArrayChange(setRefComerciales, ref.id, 'nombre_contacto', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                              <input placeholder="Teléfono" value={ref.telefono} onChange={(e) => handleArrayChange(setRefComerciales, ref.id, 'telefono', e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botón Flotante de Guardado para pestañas de formulario */}
              {activeTab !== 'Historial' && (
                <div className="sticky bottom-0 mt-8 pt-4 pb-2 bg-white border-t border-neutral-100 flex items-center justify-between gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] px-2">
                  <div>
                    {FORM_TABS_ORDER.indexOf(activeTab) > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setActiveTab(FORM_TABS_ORDER[FORM_TABS_ORDER.indexOf(activeTab) - 1])}
                        className="px-4 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        Anterior
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button type="submit" disabled={savingInfo} className="px-4 py-2.5 rounded-xl font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                      {savingInfo ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                      Guardar
                    </button>
                    
                    {FORM_TABS_ORDER.indexOf(activeTab) < FORM_TABS_ORDER.length - 1 ? (
                      <button 
                        type="button" 
                        onClick={async (e) => {
                          await handleSaveContactInfo(e);
                          setActiveTab(FORM_TABS_ORDER[FORM_TABS_ORDER.indexOf(activeTab) + 1]);
                        }}
                        className="px-5 py-2.5 rounded-xl font-bold bg-primary-500 hover:bg-primary-600 text-white transition-colors flex items-center gap-2 shadow-md"
                      >
                        Siguiente <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleConvertToClient}
                        disabled={savingInfo}
                        className="px-5 py-2.5 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-2 shadow-md"
                      >
                        <Check size={18} /> Convertir a Cliente
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
            
            {/* Tab Historial (Completamente distinto, no es form) */}
            {activeTab === 'Historial' && (
               <div className="flex flex-col lg:flex-row flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Lista de Historial */}
                  <div className="flex-1 p-5 lg:p-8 overflow-y-auto bg-neutral-50/50">
                    <h4 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2"><History className="text-primary-500" /> Trazabilidad y Movimientos</h4>
                    
                    {loadingHistorial ? (
                      <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                    ) : historial.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3"><History className="text-neutral-300" size={32} /></div>
                        <h4 className="font-semibold text-neutral-700">Aún no hay interacciones</h4>
                        <p className="text-sm text-neutral-500 mt-1">Registra la primera interacción en el panel derecho.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historial.map((item) => (
                          <div key={item.id} className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-sm text-neutral-800 flex items-center gap-2 flex-wrap">
                                {item._isTarea ? `Tarea: ${item.titulo}` : item.tipo_accion}
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                                  item._isTarea
                                    ? item.completada ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    : item.resultado?.toLowerCase() === 'exitoso' ? 'bg-green-100 text-green-700' : item.resultado?.toLowerCase() === 'descartar' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item._isTarea ? (item.completada ? 'Completada' : 'Pendiente') : (item.resultado || 'Registro')}
                                </span>
                              </span>
                              <span className="text-xs text-neutral-500 shrink-0 ml-2">{new Date(item.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-neutral-600">{item._isTarea ? item.descripcion || 'Sin descripción adicional.' : item.notas || 'Sin comentarios.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Panel: Registrar Interacción */}
                  <div className="w-full lg:w-80 bg-neutral-50 border-t lg:border-t-0 lg:border-l border-neutral-200 p-5 lg:p-6 shrink-0 flex flex-col">
                    <h4 className="font-bold text-neutral-800 flex items-center gap-2 mb-6"><Phone className="text-primary-500" size={18} />Registrar Interacción</h4>
                    <form onSubmit={handleSubmitInteraction} className="flex flex-col flex-1">
                      <div className="mb-6 flex-1 flex flex-col">
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Comentarios de la gestión</label>
                        <textarea className="w-full flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none min-h-[120px]" placeholder="Detalles de la charla..." value={comentarios} onChange={(e) => setComentarios(e.target.value)} required></textarea>
                      </div>
                      <button type="submit" disabled={savingInteraction || !comentarios.trim()} className="w-full py-3 rounded-xl font-bold bg-primary-500 hover:bg-primary-900 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {savingInteraction ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Guardar Interacción
                      </button>
                    </form>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
