import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TaskRow from '../components/TaskRow';
import ResolutionModal from '../components/ResolutionModal';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { Inbox, Users, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'bandeja', label: 'Bandeja', icon: Inbox },
  { id: 'clientes', label: 'Clientes', icon: Users },
];

export default function VendedorView({ session, isDev }) {
  const [activeTab, setActiveTab] = useState('bandeja');
  
  // States to hold the split data for the new layout
  const [tareas, setTareas] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null); // Tarea para completar (ResolutionModal)
  const [viewContact, setViewContact] = useState(null); // Contacto para ver detalles (ContactDetailsModal)

  // Initial Mock Data State
  const [mockData, setMockData] = useState({
    tareas: [
      { id: 'm0', isInteraction: false, lead_id: 'l0', leadName: 'Nuevo Lead SA', status: 'Nuevo Asignado', urgencyText: 'Requiere primer contacto', badgeColor: 'bg-success/20 text-success', isOverdue: false },
      { id: 'm1', isInteraction: true, lead_id: 'l1', leadName: 'Acme Corp', status: 'Rellamar', urgencyText: 'Vencida', badgeColor: 'bg-primary-50 text-primary-900', isOverdue: true },
      { id: 'm2', isInteraction: true, lead_id: 'l2', leadName: 'Global Industries', status: 'Diferido', urgencyText: 'Vence hoy', badgeColor: 'bg-warning/20 text-warning', isOverdue: false }
    ],
    oportunidades: [
      { id: 'm3', isInteraction: true, lead_id: 'l3', leadName: 'Tech Solutions', status: 'Cotizado', urgencyText: 'Vence el 25 ago', badgeColor: 'bg-neutral-200 text-neutral-800', isOverdue: false },
      { id: 'm4', isInteraction: true, lead_id: 'l4', leadName: 'Retail Max', status: 'Rellamar', urgencyText: 'Vence el 26 ago', badgeColor: 'bg-neutral-200 text-neutral-800', isOverdue: false }
    ],
    clientes: [
      { id: 'l5', isInteraction: false, lead_id: 'l5', leadName: 'Industrias Sur', status: 'Venta', urgencyText: 'Actualizado: 10/08/2026', badgeColor: 'bg-primary-900 text-white' },
      { id: 'l6', isInteraction: false, lead_id: 'l6', leadName: 'Mega Distribuidora', status: 'Recompra', urgencyText: 'Actualizado: 15/08/2026', badgeColor: 'bg-primary-900 text-white' }
    ]
  });

  const fetchTabData = async () => {
    setLoading(true);
    
    if (isDev) {
      setTareas(mockData.tareas);
      setOportunidades(mockData.oportunidades);
      setClientes(mockData.clientes);
      setLoading(false);
      return;
    }

    if (activeTab === 'bandeja') {
      let nuevasTareas = [];
      let nuevasOportunidades = [];

      // 1. Fetch nuevos asignados (Tareas para Hoy)
      let queryNuevos = supabase.from('contactos').select('*').eq('estado_actual', 'Asignado');
      if (session?.user?.id) queryNuevos = queryNuevos.eq('vendedor_id', session.user.id);
      
      const { data: nuevosData } = await queryNuevos;
      if (nuevosData) {
        nuevasTareas = nuevosData.map(c => ({
          id: `new-${c.id}`,
          isInteraction: false,
          lead_id: c.id,
          leadName: c.razon_social,
          status: 'Nuevo Asignado',
          urgencyText: 'Requiere primer contacto',
          badgeColor: 'bg-success/20 text-success',
          isOverdue: false
        }));
      }

      // 2. Fetch interacciones pendientes
      let queryInteracciones = supabase
        .from('interacciones_contactos')
        .select(`id, tipo_accion, fecha_vencimiento, completada, contacto_id, contactos!inner(razon_social, estado_actual, vendedor_id)`)
        .eq('completada', false)
        .in('contactos.estado_actual', ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado', 'Asignado']);
        
      if (session?.user?.id) queryInteracciones = queryInteracciones.eq('contactos.vendedor_id', session.user.id);

      const { data: interaccionesData } = await queryInteracciones;
      
      if (interaccionesData) {
        interaccionesData.forEach(t => {
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const today = new Date();
          today.setHours(0,0,0,0);
          const dueDay = new Date(dueDate);
          dueDay.setHours(0,0,0,0);
          
          const isOverdue = dueDay < today;
          const isTodayOrPast = dueDay <= today;

          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
          let badgeColor = 'bg-primary-50 text-primary-900';
          if (t.contactos?.estado_actual === 'Diferido') badgeColor = 'bg-warning/20 text-warning';

          const mapped = {
            id: t.id,
            isInteraction: true,
            lead_id: t.contacto_id,
            leadName: t.contactos?.razon_social || 'Desconocido',
            status: t.contactos?.estado_actual || t.tipo_accion,
            urgencyText: isOverdue ? 'Vencida' : (dueDay.getTime() === today.getTime() ? 'Vence hoy' : `Vence el ${formatter.format(dueDate)}`),
            badgeColor,
            isOverdue
          };

          if (isTodayOrPast) {
            nuevasTareas.push(mapped);
          } else {
            nuevasOportunidades.push(mapped);
          }
        });
      }
      
      setTareas(nuevasTareas);
      setOportunidades(nuevasOportunidades);
      
    } else if (activeTab === 'clientes') {
      let queryClientes = supabase.from('contactos')
        .select('*')
        .in('estado_actual', ['Venta', 'Recompra'])
        .order('fecha_actualizacion', { ascending: false });
      
      if (session?.user?.id) queryClientes = queryClientes.eq('vendedor_id', session.user.id);
      
      const { data: clData, error: errCl } = await queryClientes;
      if (!errCl && clData) {
        const mappedCl = clData.map(l => ({
            id: l.id,
            isInteraction: false,
            lead_id: l.id,
            leadName: l.razon_social,
            status: l.estado_actual,
            urgencyText: `Actualizado: ${new Date(l.fecha_actualizacion).toLocaleDateString('es-AR')}`,
            badgeColor: 'bg-primary-900 text-white'
        }));
        setClientes(mappedCl);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, isDev, mockData]);

  const handleActionClick = (item) => setSelectedTask(item);

  const handleViewDetails = async (item) => {
    if (isDev) {
      setViewContact({
        id: item.lead_id,
        razon_social: item.leadName,
        estado_actual: item.status,
        email: 'contacto@mockup.com',
        telefono: '11 2345-6789',
        notas: 'Esta es una nota de prueba generada en el entorno Dev (Mockup).',
      });
      return;
    }

    const { data: contactoData } = await supabase.from('contactos').select('*').eq('id', item.lead_id).single();
    if (contactoData) {
      setViewContact(contactoData);
    }
  };

  const handleSaveResolution = async (resolutionData) => {
    if (isDev) {
      // Mock Data Update
      let newTareas = [...mockData.tareas];
      let newOps = [...mockData.oportunidades];
      let newClientes = [...mockData.clientes];

      const tIdx = newTareas.findIndex(t => t.id === selectedTask.id);
      if (tIdx >= 0) newTareas.splice(tIdx, 1);

      const oIdx = newOps.findIndex(t => t.id === selectedTask.id);
      if (oIdx >= 0) {
        if (resolutionData.option === 'exit') {
          const toMove = newOps[oIdx];
          newOps.splice(oIdx, 1);
          newClientes.push({ ...toMove, status: 'Venta', badgeColor: 'bg-primary-900 text-white' });
        } else {
           newOps.splice(oIdx, 1);
        }
      }

      setMockData(prev => ({
        ...prev,
        tareas: newTareas,
        oportunidades: newOps,
        clientes: newClientes
      }));

      toast.success("Mockup: Resolución guardada localmente");
      setSelectedTask(null);
      return;
    }

    // DB Update
    if (selectedTask.isInteraction) {
      await supabase.from('interacciones_contactos').update({ completada: true, notas: resolutionData.notes }).eq('id', selectedTask.id);
    } else {
      // Registrar primer contacto si era un Asignado sin interacciones previas
      await supabase.from('interacciones_contactos').insert({
        contacto_id: selectedTask.lead_id,
        tipo_accion: 'Primer Contacto',
        resultado: resolutionData.option,
        notas: resolutionData.notes,
        completada: true
      });
    }

    let nuevoEstado = '';
    let nuevaAccion = '';
    let nuevaFechaVenc = new Date();

    switch(resolutionData.option) {
      case 'exit': nuevoEstado = 'Venta'; break;
      case 'rellamar': nuevoEstado = 'Rellamar'; nuevaAccion = 'Llamada Vendedor'; nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 1); break;
      case 'diferido': nuevoEstado = 'Diferido'; nuevaAccion = 'Seguimiento Vendedor'; nuevaFechaVenc = new Date(resolutionData.deferDate); break;
      case 'fallido': nuevoEstado = 'Descartado'; break; // Admin db perdidos
    }

    if (nuevoEstado) {
      await supabase.from('contactos').update({ estado_actual: nuevoEstado }).eq('id', selectedTask.lead_id);
    }
    if (nuevaAccion) {
      await supabase.from('interacciones_contactos').insert({ 
        contacto_id: selectedTask.lead_id, 
        tipo_accion: nuevaAccion, 
        fecha_vencimiento: nuevaFechaVenc.toISOString(), 
        completada: false 
      });
    }

    setSelectedTask(null);
    fetchTabData();
  };

  return (
    <div>
      {isDev && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 text-warning-800 rounded-lg text-sm font-medium flex items-center justify-center">
          Estás en MODO DEV. Los datos mostrados son de prueba (Mockup) y no afectan a la base de datos real.
        </div>
      )}

      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-neutral-200 mb-6 p-2 gap-2 hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive ? 'bg-primary-50 text-primary-900 shadow-sm' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
      ) : activeTab === 'bandeja' ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Block: Tareas para Hoy */}
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="font-semibold text-neutral-800 mb-2">Tareas para Hoy</h3>
            {tareas.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <p className="text-neutral-500">No hay tareas pendientes para hoy.</p>
              </div>
            ) : (
              tareas.map(item => (
                <TaskRow 
                  key={item.id} 
                  task={item} 
                  onComplete={() => handleActionClick(item)}
                  onViewDetails={() => handleViewDetails(item)}
                />
              ))
            )}
          </div>
          
          {/* Side Column: Oportunidades */}
          <div className="w-full md:w-80 flex flex-col gap-3">
            <h3 className="font-semibold text-neutral-800 mb-2">Oportunidades (Pendientes)</h3>
            {oportunidades.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <p className="text-neutral-500">No hay oportunidades pendientes.</p>
              </div>
            ) : (
              oportunidades.map(item => (
                <TaskRow 
                  key={item.id} 
                  task={item} 
                  compact={true}
                  onComplete={() => handleActionClick(item)}
                  onViewDetails={() => handleViewDetails(item)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* Clientes Tab */
        <div className="flex flex-col gap-3">
          {clientes.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <p className="text-neutral-500">No hay clientes registrados.</p>
            </div>
          ) : (
            clientes.map(item => (
              <TaskRow 
                key={item.id} 
                task={item} 
                onComplete={() => handleActionClick(item)}
                onViewDetails={() => handleViewDetails(item)}
              />
            ))
          )}
        </div>
      )}

      {selectedTask && (
        <ResolutionModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveResolution}
        />
      )}

      {viewContact && (
        <ContactDetailsModal 
          contacto={viewContact} 
          onClose={() => setViewContact(null)} 
          onRefresh={isDev ? () => setViewContact(null) : fetchTabData} 
          userRole="Vendedor"
        />
      )}
    </div>
  );
}
