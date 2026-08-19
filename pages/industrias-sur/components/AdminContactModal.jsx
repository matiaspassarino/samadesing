import React, { useState } from 'react';
import { X, CheckCircle, Clock, Trash2 } from 'lucide-react';

export default function AdminContactModal({ contacto, onClose, onSave }) {
  const [resultado, setResultado] = useState('exitoso');
  const [comentarios, setComentarios] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      contacto_id: contacto.id,
      resultado,
      comentarios
    });
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h3 className="font-heading font-bold text-lg text-neutral-800">
              Registrar Contacto
            </h3>
            <p className="text-sm text-neutral-500 font-medium">{contacto.razon_social}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-3">
              Resultado de la llamada
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`
                flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${resultado === 'exitoso' ? 'border-success-500 bg-success-50 text-success-900' : 'border-neutral-200 hover:border-success-200'}
              `}>
                <input type="radio" name="resultado" value="exitoso" checked={resultado === 'exitoso'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                <CheckCircle size={24} className={resultado === 'exitoso' ? 'text-success-500' : 'text-neutral-400'} />
                <span className="font-semibold text-sm">Exitoso</span>
              </label>

              <label className={`
                flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${resultado === 'rellamar' ? 'border-warning-500 bg-warning-50 text-warning-900' : 'border-neutral-200 hover:border-warning-200'}
              `}>
                <input type="radio" name="resultado" value="rellamar" checked={resultado === 'rellamar'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                <Clock size={24} className={resultado === 'rellamar' ? 'text-warning-500' : 'text-neutral-400'} />
                <span className="font-semibold text-sm text-center leading-tight">No atiende / Rellamar</span>
              </label>

              <label className={`
                flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${resultado === 'descartar' ? 'border-danger-500 bg-danger-50 text-danger-900' : 'border-neutral-200 hover:border-danger-200'}
              `}>
                <input type="radio" name="resultado" value="descartar" checked={resultado === 'descartar'} onChange={(e) => setResultado(e.target.value)} className="hidden" />
                <Trash2 size={24} className={resultado === 'descartar' ? 'text-danger-500' : 'text-neutral-400'} />
                <span className="font-semibold text-sm">Descartar</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Comentarios de la llamada
            </label>
            <textarea 
              rows="4" 
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
              placeholder="Escribe aquí los detalles, qué conversaron o por qué no se pudo contactar..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary-500 hover:bg-primary-900 text-white transition-colors flex items-center gap-2"
            >
              Guardar y Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
