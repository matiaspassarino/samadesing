import React, { useState } from 'react';
import { X, CheckCircle, PhoneCall, CalendarClock, ThumbsDown } from 'lucide-react';

const OPTIONS = [
  { id: 'exit', label: 'Contacto Exitoso', desc: 'Avanza a oportunidad', icon: CheckCircle, bgActive: 'bg-green-500 border-green-500 text-white', hoverClass: 'hover:bg-green-500 hover:border-green-500 hover:text-white' },
  { id: 'rellamar', label: 'Rellamar', desc: 'Mantiene como lead', icon: PhoneCall, bgActive: 'bg-primary-500 border-primary-500 text-white', hoverClass: 'hover:bg-primary-500 hover:border-primary-500 hover:text-white' },
  { id: 'diferido', label: 'Diferido', desc: 'Reprogramar contacto', icon: CalendarClock, bgActive: 'bg-yellow-500 border-yellow-500 text-white', hoverClass: 'hover:bg-yellow-500 hover:border-yellow-500 hover:text-white' },
  { id: 'fallido', label: 'Fallido / Negativo', desc: 'Marcar como perdido', icon: ThumbsDown, bgActive: 'bg-red-500 border-red-500 text-white', hoverClass: 'hover:bg-red-500 hover:border-red-500 hover:text-white' },
];

export default function ResolutionModal({ task, onClose, onSave }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [deferDate, setDeferDate] = useState('');
  const [notes, setNotes] = useState('');

  const isFailed = selectedOption === 'fallido';
  const isDeferred = selectedOption === 'diferido';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOption) return;
    
    // Validación de fecha si es diferido
    if (isDeferred && !deferDate) {
      alert('Por favor selecciona una fecha para diferir.');
      return;
    }

    onSave({
      option: selectedOption,
      deferDate: isDeferred ? deferDate : null,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-800/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-800">Registrar Contacto</h2>
            <p className="text-sm text-neutral-500 font-medium">{task?.leadName}</p>
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
          
          <div className="grid grid-cols-2 gap-3">
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
                  <span className="font-semibold">
                    {opt.label}
                  </span>
                  <span className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-neutral-500 group-hover:text-white/80'}`}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional inputs */}
          {isDeferred && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-sm font-semibold text-neutral-800 mb-2">
                Reprogramar para el día
              </label>
              <input 
                type="date" 
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                required
                className="w-full border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Notas del contacto {isFailed && <span className="text-danger">*</span>}
            </label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={isFailed}
              placeholder={isFailed ? "Explica el motivo del rechazo..." : "Opcional. Detalles de la llamada..."}
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

      </div>
    </div>
  );
}
