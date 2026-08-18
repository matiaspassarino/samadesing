import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Users, Database, Loader2, Save } from 'lucide-react';

export default function DevView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [metrics, setMetrics] = useState({ leads: 0, tareas: 0 });

  const fetchData = async () => {
    setLoading(true);
    // Traer todos los perfiles
    const { data: perfilesData } = await supabase.from('perfiles').select('*').order('email');
    if (perfilesData) setUsers(perfilesData);

    // Traer métricas rápidas
    const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: tareasCount } = await supabase.from('interacciones').select('*', { count: 'exact', head: true });
    
    setMetrics({
      leads: leadsCount || 0,
      tareas: tareasCount || 0
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSavingId(userId);
    const { error } = await supabase.from('perfiles').update({ rol: newRole }).eq('id', userId);
    
    if (error) {
      alert("Error al actualizar rol: " + error.message);
    } else {
      // Actualizar estado local
      setUsers(users.map(u => u.id === userId ? { ...u, rol: newRole } : u));
    }
    setSavingId(null);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
        <div className="p-3 bg-neutral-900 rounded-xl text-white">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800">Panel de Control (Dev)</h2>
          <p className="text-neutral-500">Gestión de roles y estado general de la base de datos.</p>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="bg-primary-50 p-3 rounded-lg text-primary-600"><Users size={24} /></div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Usuarios Registrados</p>
            <p className="text-2xl font-bold text-neutral-800">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="bg-success/10 p-3 rounded-lg text-success-600"><Database size={24} /></div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Leads en el Sistema</p>
            <p className="text-2xl font-bold text-neutral-800">{metrics.leads}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="bg-warning/10 p-3 rounded-lg text-warning-600"><Database size={24} /></div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Interacciones</p>
            <p className="text-2xl font-bold text-neutral-800">{metrics.tareas}</p>
          </div>
        </div>
      </div>

      {/* GESTIÓN DE ROLES */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Shield size={18} className="text-neutral-500" />
            Asignación de Roles
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-white border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-neutral-500">Usuario</th>
                <th className="px-6 py-3 font-semibold text-neutral-500">Correo Electrónico</th>
                <th className="px-6 py-3 font-semibold text-neutral-500">Rol Actual</th>
                <th className="px-6 py-3 font-semibold text-neutral-500 w-48">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3 font-medium text-neutral-800">{user.nombre_completo}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.rol === 'Dev' ? 'bg-neutral-900 text-white' :
                      user.rol === 'Administrador' ? 'bg-primary-100 text-primary-800' :
                      user.rol === 'Supervisor' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.rol}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={savingId === user.id}
                        className="bg-white border border-neutral-300 text-neutral-700 text-sm rounded px-2 py-1 outline-none focus:border-primary-500 w-full"
                      >
                        <option value="Dev">Dev</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Vendedor">Vendedor</option>
                      </select>
                      {savingId === user.id && <Loader2 className="animate-spin text-primary-500" size={16} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
