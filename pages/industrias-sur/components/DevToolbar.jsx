import React from 'react';
import { Settings, Eye } from 'lucide-react';

export default function DevToolbar({ simulatedRole, setSimulatedRole }) {
  const ROLES = ['Dev', 'Administrador', 'Supervisor', 'Vendedor'];

  return (
    <div className="bg-neutral-900 text-neutral-100 px-4 py-2 flex items-center justify-between shadow-inner relative z-[60]">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-primary-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Modo Desarrollador</span>
      </div>
      
      <div className="flex items-center gap-3">
        <label className="text-xs text-neutral-400 flex items-center gap-1">
          <Eye size={14} /> Ver como:
        </label>
        <select
          value={simulatedRole}
          onChange={(e) => setSimulatedRole(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded px-2 py-1 outline-none focus:border-primary-500"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
