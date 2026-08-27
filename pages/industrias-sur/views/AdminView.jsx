import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, Search, Loader2 } from 'lucide-react';
import ContactDetailsModal from '../components/ContactDetailsModal';

export default function AdminView({ isDev }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacto, setSelectedContacto] = useState(null);

  const fetchClientes = async () => {
    setLoading(true);
    // Asumimos que los clientes son los que ya pasaron por venta
    const { data, error } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .select('*')
      .in('estado_actual', ['Venta', 'Recompra', 'Cliente'])
      .order('fecha_actualizacion', { ascending: false });

    if (!error && data) {
      setClientes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, [isDev]);

  const filteredClientes = clientes.filter(c => 
    (c.razon_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.cuit?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-900 rounded-xl text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-neutral-800">Administración de Clientes</h2>
            <p className="text-neutral-500">Gestión de cartera de clientes consolidados, datos e historial.</p>
          </div>
        </div>
      </div>

      {/* SEARCH Y FILTROS */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por Razón Social o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* LISTADO DE CLIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No se encontraron clientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Razón Social</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">CUIT</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Teléfono</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Unidad de Negocio</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredClientes.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-800">{cliente.razon_social}</div>
                      {cliente.nombre_comercial && (
                        <div className="text-xs text-neutral-500">{cliente.nombre_comercial}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{cliente.cuit || '-'}</td>
                    <td className="px-6 py-4">{cliente.telefono || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium">
                        {cliente.unidad_negocio || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedContacto(cliente)}
                        className="px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold rounded-lg transition-colors"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {selectedContacto && (
        <ContactDetailsModal 
          contacto={selectedContacto} 
          onClose={() => setSelectedContacto(null)} 
          onRefresh={fetchClientes}
          userRole="Admin"
          isDev={isDev}
        />
      )}
    </div>
  );
}
