import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckSquare, Square, UserPlus, Loader2, Eye } from 'lucide-react';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { toast } from 'react-hot-toast';

export default function SupervisorView({ isDev }) {
  const [contactos, setContactos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedContactos, setSelectedContactos] = useState(new Set());
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  
  // Para el modal
  const [contactoToView, setContactoToView] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    const vendQuery = supabase.from('perfiles').select('*');
    if (isDev) {
      vendQuery.in('rol', ['Vendedor', 'Dev']);
    } else {
      vendQuery.eq('rol', 'Vendedor');
    }

    const [contactosRes, vendRes] = await Promise.all([
      supabase.from(isDev ? 'contactos_sandbox' : 'contactos')
        .select('*')
        .is('vendedor_id', null)
        .eq('estado_actual', 'Supervisor')
        .order('fecha_actualizacion', { ascending: false }),
      vendQuery
    ]);
    
    if (contactosRes.data) setContactos(contactosRes.data);
    if (vendRes.data) setVendedores(vendRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [isDev]);

  const toggleContacto = (id) => {
    const next = new Set(selectedContactos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContactos(next);
  };

  const toggleAll = () => {
    if (selectedContactos.size === contactos.length) {
      setSelectedContactos(new Set());
    } else {
      setSelectedContactos(new Set(contactos.map(c => c.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedContactos.size === 0 || !selectedVendedor) return;
    setAssigning(true);

    const contactosIds = Array.from(selectedContactos);

    const { error } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .update({ 
        vendedor_id: selectedVendedor,
        estado_actual: 'Asignado' // Pasa al vendedor
      })
      .in('id', contactosIds);

    if (error) {
      toast.error("Error al asignar: " + error.message);
    } else {
      toast.success(`${contactosIds.length} contactos asignados exitosamente.`);
      setSelectedContactos(new Set());
      setSelectedVendedor('');
      fetchData();
    }
    setAssigning(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      {isDev && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 text-warning-800 rounded-lg text-sm font-medium flex items-center justify-center">
          Estás conectado a la base de datos SANDBOX. Cambios aquí no afectan Producción.
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <Users className="text-primary-500" />
            Asignación de Contactos (Supervisor)
          </h2>
          <p className="text-neutral-500">Contactos exitosos listos para asignar a un vendedor.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <select 
            className="bg-white border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none flex-1"
            value={selectedVendedor}
            onChange={(e) => setSelectedVendedor(e.target.value)}
          >
            <option value="">Seleccionar Vendedor...</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>
                {v.rol === 'Dev' ? '[Dev] ' : ''}{v.nombre_completo} ({v.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={selectedContactos.size === 0 || !selectedVendedor || assigning}
            className="bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shrink-0"
          >
            {assigning ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
            Asignar ({selectedContactos.size})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
      ) : contactos.length === 0 ? (
        <div className="text-center p-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
          No hay contactos nuevos pendientes de asignación.
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <button onClick={toggleAll} className="text-neutral-500 hover:text-primary-500">
                    {selectedContactos.size === contactos.length ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Razón Social</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">CUIT</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Provincia</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Fecha Ingreso al Sup.</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {contactos.map((contacto) => {
                const isSelected = selectedContactos.has(contacto.id);
                return (
                  <tr key={contacto.id} className={`hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleContacto(contacto.id)} className={`${isSelected ? 'text-primary-500' : 'text-neutral-300'} hover:text-primary-400`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{contacto.razon_social}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{contacto.cuit || '-'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{contacto.provincia || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{new Date(contacto.fecha_actualizacion).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setContactoToView(contacto)}
                        className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 p-2 rounded-lg transition-colors ml-auto"
                        title="Ver y Editar Detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {contactoToView && (
        <ContactDetailsModal 
          contacto={contactoToView} 
          onClose={() => setContactoToView(null)} 
          onRefresh={fetchData} 
          userRole="Supervisor"
          isDev={isDev}
        />
      )}
    </div>
  );
}
