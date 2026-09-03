import React from 'react';
import { Eye, Flag, Clock } from 'lucide-react';

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function TaskRow({ task, onComplete, onViewDetails, compact = false, actionText = "COMPLETAR" }) {
  const bgClass = task.isOverdue ? 'bg-warning/5 border-warning/30' : 'bg-white border-neutral-200';
  
  const prioColors = {
    Alta: 'text-danger bg-danger/10 border border-danger/20',
    Media: 'text-neutral-600 bg-neutral-100 border border-neutral-200',
    Baja: 'text-neutral-400 bg-neutral-50 border border-neutral-100'
  };

  return (
    <div className={`${bgClass} p-4 rounded-xl border hover:shadow-sm transition-shadow ${compact ? 'flex flex-col gap-3 items-start' : 'flex flex-col sm:flex-row sm:items-center items-start gap-3 sm:gap-4'}`}>
      
      {/* Info Central */}
      <div className={`flex-1 min-w-0 w-full flex flex-col gap-1`}>
        <h3 className="font-semibold text-neutral-800 truncate" title={task.leadName}>
          {task.leadName}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {task.prioridad && (
            <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold flex items-center gap-1 ${prioColors[task.prioridad] || prioColors.Media}`}>
              <Flag size={10} />
              {toTitleCase(task.prioridad)}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold whitespace-nowrap ${task.badgeColor}`}>
            {toTitleCase(task.status)}
          </span>
          {task.contactStatus && (
            <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold whitespace-nowrap border ${
              ['Venta', 'Recompra', 'CLIENTE REACTIVADO', 'Cliente'].includes(task.contactStatus) 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {['Venta', 'Recompra', 'CLIENTE REACTIVADO', 'Cliente'].includes(task.contactStatus) ? 'Cliente' : 'Lead'}
            </span>
          )}
          {task.urgencyText && (
            <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold flex items-center gap-1 border ${
              task.isOverdue 
                ? 'bg-danger/10 text-danger border-danger/20' 
                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
            }`}>
              <Clock size={10} />
              {task.urgencyText}
            </span>
          )}
        </div>
        {task.clientName && (
          <p className="text-xs font-medium text-neutral-600 truncate flex items-center gap-1">
            <span className="opacity-70">Cliente:</span> {task.clientName}
          </p>
        )}
        {(task.contactName || task.phone || task.email) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-neutral-600">
            {task.contactName && <span className="font-medium text-neutral-800"><span className="opacity-70 font-normal">Contacto:</span> {task.contactName}</span>}
            {task.phone && <span><span className="opacity-70">Tel:</span> {task.phone}</span>}
            {task.email && <span className="truncate max-w-[200px]"><span className="opacity-70">Email:</span> {task.email}</span>}
          </div>
        )}
        {task.descripcion && (
          <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-snug" title={task.descripcion}>
            {task.descripcion}
          </p>
        )}
      </div>

      {/* Acción Derecha */}
      <div className={`flex items-center gap-2 ${compact ? 'w-full' : 'w-full sm:w-auto mt-2 sm:mt-0 justify-end'}`}>
        {onViewDetails && (
          <button 
            onClick={onViewDetails}
            className="flex-shrink-0 p-2 text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            title="Ver y Editar Detalles"
          >
            <Eye size={20} />
          </button>
        )}
        <button 
          onClick={onComplete}
          className={`bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex-1 sm:flex-none`}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
