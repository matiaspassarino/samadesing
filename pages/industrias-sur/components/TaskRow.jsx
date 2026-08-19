import React from 'react';
import { Circle, Eye } from 'lucide-react';

export default function TaskRow({ task, onComplete, onViewDetails }) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200 hover:shadow-sm transition-shadow">
      {/* Botón Circular Falso (Check) */}
      <button 
        className="text-neutral-400 hover:text-primary-500 transition-colors flex-shrink-0"
        aria-label="Marcar como completada (abre modal)"
        onClick={onComplete}
      >
        <Circle size={24} strokeWidth={1.5} />
      </button>

      {/* Info Central */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-neutral-800 truncate">
            {task.leadName}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${task.badgeColor}`}>
            {task.status}
          </span>
        </div>
        <p className="text-sm text-danger font-medium flex items-center gap-1">
          {task.urgencyText}
        </p>
      </div>

      {/* Acción Derecha */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onViewDetails}
          className="flex-shrink-0 p-2 text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          title="Ver y Editar Detalles"
        >
          <Eye size={20} />
        </button>
        <button 
          onClick={onComplete}
          className="flex-shrink-0 bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          COMPLETAR
        </button>
      </div>
    </div>
  );
}
