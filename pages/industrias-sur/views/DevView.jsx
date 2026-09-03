import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Users, Database, Loader2, Save, Plus, Calendar } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { toast } from 'react-hot-toast';

export default function DevView({ session }) {
  const [users, setUsers] = useState([]);
  const [globalTasks, setGlobalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [metrics, setMetrics] = useState({ leads: 0, tareas: 0 });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Traer todos los perfiles
    const { data: perfilesData } = await supabase.from('perfiles').select('*').order('email');
    if (perfilesData) setUsers(perfilesData);

    // Traer métricas rápidas
    const { count: leadsCount } = await supabase.from('contactos_sandbox').select('*', { count: 'exact', head: true });
    const { count: tareasCount } = await supabase.from('interacciones_contactos_sandbox').select('*', { count: 'exact', head: true });
    
    // Traer tareas globales de agenda sin el JOIN (ya que no hay FK en la tabla sandbox a perfiles)
    const { data: tareasGlobales, error: tareasGlobalesError } = await supabase
      .from('tareas_agenda_sandbox')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (tareasGlobalesError) {
      console.error('Error fetching global tasks:', tareasGlobalesError);
    } else if (tareasGlobales) {
      setGlobalTasks(tareasGlobales);
    }

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
      toast.error("Error al actualizar rol: " + error.message);
    } else {
      // Actualizar estado local
      setUsers(users.map(u => u.id === userId ? { ...u, rol: newRole } : u));
      toast.success("Rol actualizado correctamente.");
    }
    setSavingId(null);
  };

  const handleResetSandbox = async () => {
    toast((t) => (
      <div>
        <p className="mb-3 font-medium text-neutral-800">¿Seguro que quieres vaciar la tabla contactos_sandbox? (Las interacciones se borrarán en cascada)</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-3 py-1.5 text-sm font-semibold rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
          <button 
            className="px-3 py-1.5 text-sm font-semibold rounded bg-danger text-white hover:bg-danger-600"
            onClick={async () => {
              toast.dismiss(t.id);
              const { error } = await supabase.from('contactos_sandbox').delete().not('id', 'is', null);
              if (error) {
                toast.error("Error al limpiar sandbox: " + error.message);
              } else {
                toast.success("Sandbox limpiado con éxito.");
                fetchData();
              }
            }}
          >
            Sí, Vaciar
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleSeedSandbox = async () => {
    const mockLead = {
      razon_social: `Mock Lead ${Math.floor(Math.random() * 10000)}`,
      estado_actual: 'Nuevo',
      telefono: `11${Math.floor(10000000 + Math.random() * 90000000)}`,
      fecha_creacion: new Date().toISOString()
    };
    const { error } = await supabase.from('contactos_sandbox').insert(mockLead);
    if (error) toast.error("Error al crear lead: " + error.message);
    else {
      toast.success("Lead de prueba creado.");
      fetchData();
    }
  };

  const handleSeedFullClient = async () => {
    try {
      const mockClient = {
        razon_social: `Mock Cliente ${Math.floor(Math.random() * 10000)}`,
        estado_actual: 'Venta',
        cuit: `30${Math.floor(100000000 + Math.random() * 90000000)}0`,
        condicion_iva: 'Responsable Inscripto',
        telefono: `11${Math.floor(10000000 + Math.random() * 90000000)}`,
        provincia: 'Buenos Aires',
        localidad: 'CABA',
        codigo_postal: '1000',
        domicilio: 'Av. Corrientes 1234',
        fecha_creacion: new Date().toISOString()
      };
      const res = await supabase.from('contactos_sandbox').insert(mockClient);
      if (res.error) {
        toast.error("Error BD: " + res.error.message);
        console.error(res.error);
      } else {
        toast.success("Cliente de prueba creado (Sin vendedor asignado).");
        fetchData();
      }
    } catch (e) {
      toast.error("Excepción al crear cliente: " + e.message);
      console.error(e);
    }
  };

  const handleSaveGeneralTask = async (formData) => {
    if (!formData.vendedor_id) {
      toast.error('Debes seleccionar un usuario para asignar la tarea.');
      throw new Error('Usuario no seleccionado');
    }
    try {
      const { error } = await supabase.from('tareas_agenda_sandbox').insert({
        vendedor_id: formData.vendedor_id,
        creador_id: session?.user?.id,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_vencimiento: formData.fecha_vencimiento,
        contacto_id: formData.contacto_id || null,
      });
      if (error) throw error;
      
      toast.success('Tarea global asignada exitosamente (Sandbox)');
      fetchData();
    } catch (error) {
      toast.error('Error al guardar: ' + error.message);
      console.error(error);
      throw error;
    }
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
          <div className="bg-success/10 p-3 rounded-lg text-success"><Database size={24} /></div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Leads en el Sistema</p>
            <p className="text-2xl font-bold text-neutral-800">{metrics.leads}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="bg-warning/10 p-3 rounded-lg text-warning"><Database size={24} /></div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Interacciones</p>
            <p className="text-2xl font-bold text-neutral-800">{metrics.tareas}</p>
          </div>
        </div>
      </div>

      {/* SANDBOX TOOLS */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Database size={18} className="text-neutral-500" />
            Herramientas Sandbox
          </h3>
        </div>
        <div className="p-6 flex flex-wrap gap-4">
          <button 
            onClick={handleSeedSandbox}
            className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-lg font-medium transition-colors border border-primary-200"
          >
            + Generar Lead "Nuevo"
          </button>
          <button 
            onClick={handleSeedFullClient}
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-lg font-medium transition-colors border border-purple-200"
          >
            + Generar Cliente Completo (Sin Asignar)
          </button>
          <button 
            onClick={handleResetSandbox}
            className="bg-danger/10 text-danger hover:bg-danger/20 px-4 py-2 rounded-lg font-medium transition-colors border border-danger/20"
          >
            Limpiar Datos Sandbox
          </button>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-secondary-50 text-secondary-700 hover:bg-secondary-100 px-4 py-2 rounded-lg font-medium transition-colors border border-secondary-200 flex items-center gap-2"
          >
            <Calendar size={18} />
            Generar Tarea Global
          </button>
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
                        <option value="Gerente">Gerente</option>
                        <option value="Prospector">Prospector</option>
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

      {/* TAREAS DE AGENDA GLOBALES */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Calendar size={18} className="text-neutral-500" />
            Tareas Globales Asignadas (Sandbox)
          </h3>
        </div>
        <div className="overflow-x-auto">
          {globalTasks.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">No hay tareas globales en sandbox.</div>
          ) : (
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-white border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Título</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Asignado A</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Tipo</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Estado</th>
                  <th className="px-6 py-3 font-semibold text-neutral-500">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {globalTasks.map(task => {
                  const assignedUser = users.find(u => u.id === task.vendedor_id);
                  return (
                    <tr key={task.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-3 font-medium text-neutral-800">{task.titulo}</td>
                      <td className="px-6 py-3">{assignedUser ? assignedUser.nombre_completo : 'Desconocido'}</td>
                      <td className="px-6 py-3">{task.tipo}</td>
                      <td className="px-6 py-3">
                        {task.completada ? (
                          <span className="text-success font-medium">Completada</span>
                        ) : (
                          <span className="text-warning font-medium">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {task.fecha_vencimiento ? new Date(task.fecha_vencimiento).toLocaleString('es-AR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveGeneralTask}
          vendedores={users}
          isDev={true}
          session={session}
        />
      )}
    </div>
  );
}
