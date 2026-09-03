import React, { useState, useEffect } from 'react';
import { X, Calendar, Type, AlignLeft, Users, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getTable } from '../lib/db';

export default function TaskModal({ onClose, onSave, vendedores, isDev, session }) {
  const [loading, setLoading] = useState(false);
  const [contactosList, setContactosList] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Otra',
    fecha_inicio: '',
    fecha_vencimiento: '',
    vendedor_id: '',
    contacto_id: ''
  });

  const TIPOS = ['Viaje', 'Visita', 'Reunión Interna', 'Llamada', 'Otra'];

  // Determinar el vendedor objetivo (el seleccionado o el propio usuario si no hay selector)
  const targetVendedorId = formData.vendedor_id || session?.user?.id;

  // Cargar contactos cuando cambia el vendedor objetivo
  useEffect(() => {
    if (!targetVendedorId) return;
    
    const fetchContactos = async () => {
      const { data, error } = await supabase
        .from(getTable('contactos', isDev))
        .select('id, razon_social')
        .eq('vendedor_id', targetVendedorId)
        .order('razon_social');
        
      if (!error && data) {
        setContactosList(data);
      }
    };
    fetchContactos();
  }, [targetVendedorId, isDev]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.fecha_vencimiento) {
      toast.error('Por favor, completa el título y la fecha.');
      return;
    }
    if (formData.tipo === 'Viaje' && !formData.fecha_inicio) {
      toast.error('Los viajes deben tener fecha de inicio.');
      return;
    }
    
    setLoading(true);
    try {
      await onSave({
        ...formData,
        fecha_inicio: formData.tipo === 'Viaje' ? formData.fecha_inicio : null,
        contacto_id: formData.contacto_id || null
      });
      onClose();
    } catch (err) {
      toast.error('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-xl font-bold text-neutral-800">Nueva Tarea</h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 bg-white rounded-full shadow-sm hover:shadow transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Type size={16} className="text-primary-600" />
                Título
              </label>
              <input 
                type="text" 
                autoFocus
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                placeholder="Ej. Viaje a Neuquén..."
                value={formData.titulo}
                onChange={e => setFormData({...formData, titulo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Tipo de Actividad</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TIPOS.map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFormData({...formData, tipo})}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      formData.tipo === tipo 
                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm' 
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {vendedores && vendedores.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Users size={16} className="text-primary-600" />
                  Asignar a
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                  value={formData.vendedor_id}
                  onChange={e => setFormData({...formData, vendedor_id: e.target.value, contacto_id: ''})}
                >
                  <option value="">Seleccionar Vendedor...</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_completo}</option>
                  ))}
                </select>
              </div>
            )}

            {contactosList.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Briefcase size={16} className="text-primary-600" />
                  Vincular a Cliente (Opcional)
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                  value={formData.contacto_id}
                  onChange={e => setFormData({...formData, contacto_id: e.target.value})}
                >
                  <option value="">Ninguno</option>
                  {contactosList.map(c => (
                    <option key={c.id} value={c.id}>{c.razon_social}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.tipo === 'Viaje' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Calendar size={16} className="text-primary-600" />
                    Inicio
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 text-sm"
                    value={formData.fecha_inicio}
                    onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Calendar size={16} className="text-primary-600" />
                    Fin
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 text-sm"
                    value={formData.fecha_vencimiento}
                    onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-600" />
                  Fecha y Hora
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                  value={formData.fecha_vencimiento}
                  onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <AlignLeft size={16} className="text-primary-600" />
                Descripción (Opcional)
              </label>
              <textarea 
                rows="3"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 resize-none"
                placeholder="Detalles adicionales..."
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200/50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="task-form"
            className="px-6 py-2.5 bg-primary-900 hover:bg-primary-500 text-white rounded-xl font-semibold shadow-sm hover:shadow transition-all disabled:opacity-70 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Tarea'}
          </button>
        </div>

      </div>
    </div>
  );
}
