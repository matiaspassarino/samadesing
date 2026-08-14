import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckSquare, Square, UserPlus, Loader2 } from 'lucide-react';

export default function SupervisorView() {
  const [leads, setLeads] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [leadsRes, vendRes] = await Promise.all([
      supabase.from('leads').select('*').is('vendedor_id', null).eq('estado_actual', 'Nuevo').order('fecha_creacion', { ascending: false }),
      supabase.from('perfiles').select('*').eq('rol', 'Vendedor')
    ]);
    
    if (leadsRes.data) setLeads(leadsRes.data);
    if (vendRes.data) setVendedores(vendRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleLead = (id) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const toggleAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedLeads.size === 0 || !selectedVendedor) return;
    setAssigning(true);

    const leadIds = Array.from(selectedLeads);
    
    const { error } = await supabase
      .from('leads')
      .update({ vendedor_id: selectedVendedor })
      .in('id', leadIds);

    if (error) {
      alert("Error al asignar: " + error.message);
    } else {
      // Limpiar selección y refrescar lista
      setSelectedLeads(new Set());
      setSelectedVendedor('');
      fetchData();
    }
    setAssigning(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <Users className="text-primary-500" />
            Asignación de Leads (Supervisor)
          </h2>
          <p className="text-neutral-500">Leads nuevos que aún no tienen un vendedor asignado.</p>
        </div>

        <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-lg border border-neutral-200 w-full md:w-auto">
          <select 
            className="bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none flex-1"
            value={selectedVendedor}
            onChange={(e) => setSelectedVendedor(e.target.value)}
          >
            <option value="">Seleccionar Vendedor...</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre_completo} ({v.email})</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={selectedLeads.size === 0 || !selectedVendedor || assigning}
            className="bg-primary-900 hover:bg-primary-500 text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {assigning ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
            Asignar ({selectedLeads.size})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
      ) : leads.length === 0 ? (
        <div className="text-center p-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
          No hay leads nuevos pendientes de asignación.
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <button onClick={toggleAll} className="text-neutral-500 hover:text-primary-500">
                    {selectedLeads.size === leads.length ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">CUIT</th>
                <th className="px-4 py-3 font-semibold">Fecha Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {leads.map((lead) => {
                const isSelected = selectedLeads.has(lead.id);
                return (
                  <tr key={lead.id} className={`hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleLead(lead.id)} className={`${isSelected ? 'text-primary-500' : 'text-neutral-300'} hover:text-primary-400`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{lead.nombre_empresa}</td>
                    <td className="px-4 py-3">{lead.cuit || '-'}</td>
                    <td className="px-4 py-3">{new Date(lead.fecha_creacion).toLocaleDateString('es-AR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
