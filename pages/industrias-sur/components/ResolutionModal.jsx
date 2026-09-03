import React, { useState } from 'react';
import { X, CheckCircle, PhoneCall, CalendarClock, ThumbsDown, BookOpen, FileText, PhoneOff, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const LEAD_OPTIONS = [
  { id: 'venta', label: 'Venta', desc: 'Convierte en cliente', icon: ShoppingBag, bgActive: 'bg-emerald-500 border-emerald-500 text-white', hoverClass: 'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white' },
  { id: 'exit', label: 'Contacto Exitoso', desc: 'Atendió la llamada', icon: CheckCircle, bgActive: 'bg-green-500 border-green-500 text-white', hoverClass: 'hover:bg-green-500 hover:border-green-500 hover:text-white' },
  { id: 'catalogo_digital', label: 'Catálogo Digital', desc: 'Registra envío', icon: BookOpen, bgActive: 'bg-blue-500 border-blue-500 text-white', hoverClass: 'hover:bg-blue-500 hover:border-blue-500 hover:text-white' },
  { id: 'presupuesto', label: 'Presupuesto', desc: 'Seguimiento a 48hs', icon: FileText, bgActive: 'bg-indigo-500 border-indigo-500 text-white', hoverClass: 'hover:bg-indigo-500 hover:border-indigo-500 hover:text-white' },
  { id: 'diferido', label: 'Diferido', desc: 'Reprogramar llamada', icon: CalendarClock, bgActive: 'bg-yellow-500 border-yellow-500 text-white', hoverClass: 'hover:bg-yellow-500 hover:border-yellow-500 hover:text-white' },
  { id: 'rellamar', label: 'No Contesta', desc: 'Rellamar mañana', icon: PhoneCall, bgActive: 'bg-orange-500 border-orange-500 text-white', hoverClass: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  { id: 'fallido', label: 'Fallido / Negativo', desc: 'Descartar lead', icon: ThumbsDown, bgActive: 'bg-red-500 border-red-500 text-white', hoverClass: 'hover:bg-red-500 hover:border-red-500 hover:text-white' },
];

const TASK_OPTIONS = [
  { id: 'exit', label: 'Completar Tarea', desc: 'Marcar como finalizada', icon: CheckCircle, bgActive: 'bg-green-500 border-green-500 text-white', hoverClass: 'hover:bg-green-500 hover:border-green-500 hover:text-white' },
  { id: 'diferido', label: 'Reprogramar', desc: 'Posponer tarea', icon: CalendarClock, bgActive: 'bg-yellow-500 border-yellow-500 text-white', hoverClass: 'hover:bg-yellow-500 hover:border-yellow-500 hover:text-white' },
];

const CLIENT_OPTIONS = [
  { id: 'catalogo_digital', label: 'Envió Catálogo (Digital)', desc: 'Registra envío', icon: BookOpen, bgActive: 'bg-blue-500 border-blue-500 text-white', hoverClass: 'hover:bg-blue-500 hover:border-blue-500 hover:text-white' },
  { id: 'catalogo_fisico', label: 'Envió Catálogo (Físico)', desc: 'Registra envío', icon: BookOpen, bgActive: 'bg-indigo-500 border-indigo-500 text-white', hoverClass: 'hover:bg-indigo-500 hover:border-indigo-500 hover:text-white' },
  { id: 'presupuesto', label: 'Envió Presupuesto', desc: 'Seguimiento a 48hs', icon: FileText, bgActive: 'bg-emerald-500 border-emerald-500 text-white', hoverClass: 'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white' },
  { id: 'no_contesta', label: 'No Contesta', desc: 'Llamar mañana', icon: PhoneOff, bgActive: 'bg-orange-500 border-orange-500 text-white', hoverClass: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  { id: 'recompra', label: 'Nueva Venta', desc: 'Recompra generada', icon: ShoppingBag, bgActive: 'bg-green-500 border-green-500 text-white', hoverClass: 'hover:bg-green-500 hover:border-green-500 hover:text-white' }
];

export default function ResolutionModal({ task, onClose, onSave, onEditLead }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [deferDate, setDeferDate] = useState('');
  const [notes, setNotes] = useState('');

  const [vendedorId, setVendedorId] = useState('');

  const isAgendaTask = task?.isAgendaTask;
  const isClientTask = task?.status === 'Venta' || task?.status === 'Recompra' || task?.status === 'CLIENTE REACTIVADO';
  const OPTIONS = isAgendaTask ? TASK_OPTIONS : (isClientTask ? CLIENT_OPTIONS : LEAD_OPTIONS);
  
  const isFailed = selectedOption === 'fallido';
  const isDeferred = selectedOption === 'diferido';
  const isExit = selectedOption === 'exit' || selectedOption === 'venta';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOption) return;
    
    // Validación de fecha si es diferido
    if (isDeferred && !deferDate) {
      toast.error('Por favor selecciona una fecha para diferir.');
      return;
    }

    if (isExit && !isAgendaTask && task?.vendedores && task.vendedores.length > 0 && !vendedorId) {
      toast.error('Por favor selecciona un vendedor.');
      return;
    }

    onSave({
      option: selectedOption,
      deferDate: isDeferred ? deferDate : null,
      vendedorId: isExit ? vendedorId : null,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-800/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div className="flex-1">
            <h2 className="font-heading font-bold text-xl text-neutral-800">{isAgendaTask ? 'Resolver Tarea' : 'Registrar Contacto'}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-neutral-500 font-medium truncate max-w-[200px] sm:max-w-xs">{task?.leadName}</p>
              {!isAgendaTask && onEditLead && (
                <button 
                  type="button" 
                  onClick={onEditLead} 
                  className="text-[10px] sm:text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-1 rounded-md hover:bg-neutral-200 hover:text-neutral-900 transition-colors shadow-sm shrink-0"
                >
                  ✏️ Actualizar Datos
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 flex flex-col gap-6">
          
          <div className={`grid gap-3 ${isAgendaTask ? 'grid-cols-2' : 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2'}`}>
            {OPTIONS.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all group ${
                    isSelected 
                      ? opt.bgActive
                      : `border-neutral-200 bg-white text-neutral-700 ${opt.hoverClass}`
                  }`}
                >
                  <Icon className={`mb-2 ${isSelected ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} size={24} />
                  <span className="font-semibold text-sm leading-tight">
                    {opt.label}
                  </span>
                  <span className={`text-xs mt-1 leading-tight ${isSelected ? 'text-white/80' : 'text-neutral-500 group-hover:text-white/80'}`}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional inputs */}
          {isExit && !isAgendaTask && task?.vendedores && task.vendedores.length > 0 && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-sm font-semibold text-neutral-800 mb-2">
                Asignar al Vendedor
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                required
                className="w-full border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Seleccione vendedor...</option>
                {task.vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre_completo || v.email}</option>
                ))}
              </select>
            </div>
          )}

          {isDeferred && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-sm font-semibold text-neutral-800 mb-2">
                Reprogramar para el día y hora
              </label>
              <input 
                type="datetime-local" 
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                required
                className="w-full border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {isAgendaTask ? 'Notas de la tarea' : `Notas del contacto ${isFailed ? '*' : ''}`}
            </label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={isFailed}
              placeholder={isFailed ? "Explica el motivo del rechazo..." : (isAgendaTask ? "Detalles sobre la resolución de la tarea..." : "Opcional. Detalles de la llamada...")}
              className={`w-full border rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isFailed && !notes ? 'border-danger/50' : 'border-neutral-200'
              }`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="px-5 py-2.5 rounded-lg font-semibold text-white bg-primary-500 hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Guardar y Avanzar
          </button>
        </div>

      </motion.div>
    </div>
  );
}
