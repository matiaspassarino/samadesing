import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, Clock, Trash2, Save, History, Building2, Phone, MapPin, FileText, Loader2 } from 'lucide-react';

const UNIDADES_NEGOCIO = ['Industrias Sur', 'Aries', 'Medús'];

export default function ContactDetailsModal({ contacto, onClose, onRefresh }) {
  // Estados para la info del contacto
  const [formData, setFormData] = useState({
    razon_social: contacto.razon_social || '',
    cuit: contacto.cuit || '',
    telefono: contacto.telefono || '',
    provincia: contacto.provincia || '',
    domicilio: contacto.domicilio || '',
    condicion_iva: contacto.condicion_iva || ''
  });
  
  // Unidades de negocio (Checkbox array)
  const [unidades, setUnidades] = useState(() => {
    if (!contacto.unidad_negocio) return [];
    return contacto.unidad_negocio.split(',').map(s => s.trim()).filter(Boolean);
  });

  const [savingInfo, setSavingInfo] = useState(false);

  // Estados para la Interacción
  const [resultado, setResultado] = useState('exitoso');
  const [comentarios, setComentarios] = useState('');
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Estado para el historial
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, [contacto.id]);

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    const { data, error } = await supabase
      .from('interacciones_contactos')
      .select('*')
      .eq('contacto_id', contacto.id)
      .order('fecha_creacion', { ascending: false });
    
    if (!error && data) {
      setHistorial(data);
    }
    setLoadingHistorial(false);
  };

  const handleInfoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUnidadToggle = (unidad) => {
    setUnidades(prev => 
      prev.includes(unidad) 
        ? prev.filter(u => u !== unidad)
        : [...prev, unidad]
    );
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    const unidadesString = unidades.join(', ');
    
    const { error } = await supabase
      .from('contactos')
      .update({
        ...formData,
        unidad_negocio: unidadesString
      })
      .eq('id', contacto.id);
      
    if (error) {
      alert("Error al actualizar la información: " + error.message);
    } else {
      onRefresh(); // Refrescar vista padre por si cambiaron datos listados
    }
    setSavingInfo(false);
  };

  const handleSubmitInteraction = async (e) => {
    e.preventDefault();
    if (!comentarios.trim()) return;

    setSavingInteraction(true);

    let nuevoEstado = contacto.estado_actual;
    
    if (resultado === 'exitoso') nuevoEstado = 'Supervisor';
    else if (resultado === 'rellamar') nuevoEstado = 'Admin_Rellamar';
    else if (resultado === 'descartar') nuevoEstado = 'Descartado';

    // 1. Guardar interacción
    await supabase.from('interacciones_contactos').insert({
      contacto_id: contacto.id,
      tipo_accion: 'Gestión Admin',
      resultado,
      notas: comentarios,
      completada: true
    });

    // 2. Actualizar estado del contacto
    await supabase.from('contactos').update({ estado_actual: nuevoEstado }).eq('id', contacto.id);

    setSavingInteraction(false);
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div>
            <h3 className="font-heading font-bold text-xl text-neutral-800">
              Detalles del Contacto
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-neutral-600 font-medium">{contacto.razon_social}</p>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs font-bold">
                {contacto.estado_actual}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: INFO & HISTORIAL */}
          <div className="lg:w-3/5 border-r border-neutral-200 flex flex-col overflow-y-auto bg-white p-6">
            
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-neutral-800 flex items-center gap-2">
                <FileText className="text-primary-500" size={18} />
                Información del Contacto
              </h4>
              <button 
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {savingInfo ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Actualizar Info
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Razón Social</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="text" name="razon_social" value={formData.razon_social} onChange={handleInfoChange} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">CUIT</label>
                <input type="text" name="cuit" value={formData.cuit} onChange={handleInfoChange} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleInfoChange} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Condición IVA</label>
                <input type="text" name="condicion_iva" value={formData.condicion_iva} onChange={handleInfoChange} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Provincia</label>
                  <input type="text" name="provincia" value={formData.provincia} onChange={handleInfoChange} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Domicilio</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="text" name="domicilio" value={formData.domicilio} onChange={handleInfoChange} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* UNIDADES DE NEGOCIO (CHECKBOXES) */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-neutral-500 mb-2">Unidad de Negocio</label>
              <div className="flex flex-wrap gap-3">
                {UNIDADES_NEGOCIO.map(unidad => (
                  <label key={unidad} className="flex items-center gap-2 cursor-pointer bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-primary-500 focus:ring-primary-500"
                      checked={unidades.includes(unidad)}
                      onChange={() => handleUnidadToggle(unidad)}
                    />
                    <span className="text-sm font-medium text-neutral-700">{unidad}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* HISTORIAL / TRAZABILIDAD */}
            <div className="mt-auto">
              <div className="flex justify-between items-end mb-4 border-t border-neutral-200 pt-6">
                <h4 className="font-bold text-neutral-800 flex items-center gap-2">
                  <History className="text-primary-500" size={18} />
                  Trazabilidad y Movimientos
                </h4>
                {!loadingHistorial && (
                  <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                    {historial.length} interacciones
                  </span>
                )}
              </div>
              
              {loadingHistorial ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={24} /></div>
              ) : historial.length === 0 ? (
                <div className="text-sm text-neutral-500 bg-neutral-50 p-4 rounded-xl border border-dashed border-neutral-200 text-center">
                  Aún no hay interacciones registradas.
                </div>
              ) : (
                <div className="space-y-4">
                  {historial.map((item) => (
                    <div key={item.id} className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-neutral-800 flex items-center gap-2">
                          {item.tipo_accion}
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide
                            ${item.resultado?.toLowerCase() === 'exitoso' ? 'bg-success/20 text-success' : 
                              item.resultado?.toLowerCase() === 'descartar' ? 'bg-danger/20 text-danger' : 
                              'bg-warning/20 text-warning'}`}>
                            {item.resultado || 'Registro'}
                          </span>
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(item.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{item.notas || 'Sin comentarios.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTION FORM */}
          <div className="lg:w-2/5 bg-neutral-50 p-6 flex flex-col">
            <h4 className="font-bold text-neutral-800 flex items-center gap-2 mb-6">
              <Phone className="text-primary-500" size={18} />
              Registrar Interacción
            </h4>
            
            <form onSubmit={handleSubmitInteraction} className="flex flex-col flex-1">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-3">
                  Resultado
                </label>
                <div className="flex flex-col gap-3">
                  <label className={`
                    group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${resultado === 'exitoso' ? 'border-success bg-success text-white' : 'border-neutral-200 bg-white hover:bg-success hover:border-success hover:text-white text-neutral-700'}
                  `}>
                    <input type="radio" name="resultado" value="exitoso" checked={resultado === 'exitoso'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                    <CheckCircle size={20} className={resultado === 'exitoso' ? 'text-white' : 'text-neutral-400 group-hover:text-white'} />
                    <span className="font-semibold text-sm">Contacto Exitoso (Pasar a Sup.)</span>
                  </label>

                  <label className={`
                    group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${resultado === 'rellamar' ? 'border-warning bg-warning text-white' : 'border-neutral-200 bg-white hover:bg-warning hover:border-warning hover:text-white text-neutral-700'}
                  `}>
                    <input type="radio" name="resultado" value="rellamar" checked={resultado === 'rellamar'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                    <Clock size={20} className={resultado === 'rellamar' ? 'text-white' : 'text-neutral-400 group-hover:text-white'} />
                    <span className="font-semibold text-sm">No Atiende / Rellamar</span>
                  </label>

                  <label className={`
                    group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${resultado === 'descartar' ? 'border-danger bg-danger text-white' : 'border-neutral-200 bg-white hover:bg-danger hover:border-danger hover:text-white text-neutral-700'}
                  `}>
                    <input type="radio" name="resultado" value="descartar" checked={resultado === 'descartar'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                    <Trash2 size={20} className={resultado === 'descartar' ? 'text-white' : 'text-neutral-400 group-hover:text-white'} />
                    <span className="font-semibold text-sm">Descartar (Perdido)</span>
                  </label>
                </div>
              </div>

              <div className="mb-6 flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Comentarios de la gestión
                </label>
                <textarea 
                  className="w-full flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none min-h-[120px]"
                  placeholder="Detalles de la charla, por qué no contestó o razones del descarte..."
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  required
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={savingInteraction || !comentarios.trim()}
                className="w-full py-3.5 rounded-xl font-bold bg-primary-500 hover:bg-primary-900 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingInteraction ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Guardar Interacción
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
