import React from 'react';
import { Eye } from 'lucide-react';

export default function TaskRow({ task, onComplete, onViewDetails, compact = false }) {
  return (
    <div className={`bg-white p-4 rounded-xl border border-neutral-200 hover:shadow-sm transition-shadow ${compact ? 'flex flex-col gap-3 items-start' : 'flex items-center gap-4'}`}>
      
      {/* Info Central */}
      <div className={`flex-1 min-w-0 ${compact ? 'w-full' : ''}`}>
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
      <div className={`flex items-center gap-2 ${compact ? 'w-full' : ''}`}>
        <button 
          onClick={onViewDetails}
          className="flex-shrink-0 p-2 text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          title="Ver y Editar Detalles"
        >
          <Eye size={20} />
        </button>
        <button 
          onClick={onComplete}
          className={`bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${compact ? 'flex-1' : 'flex-shrink-0'}`}
        >
          COMPLETAR
        </button>
      </div>
    </div>
  );
}
