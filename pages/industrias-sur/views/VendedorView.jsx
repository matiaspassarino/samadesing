import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { validarAltaCliente } from '../lib/validarAltaCliente';
import TaskRow from '../components/TaskRow';
import ResolutionModal from '../components/ResolutionModal';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { Inbox, Users, Loader2 } from 'lucide-react';

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

  const fetchTabData = async () => {
    setLoading(true);

    if (activeTab === 'bandeja') {
      let nuevasTareas = [];
      let nuevasOportunidades = [];

      // 1. Fetch nuevos asignados (Tareas para Hoy)
      let queryNuevos = supabase.from(isDev ? 'contactos_sandbox' : 'contactos').select('*').eq('estado_actual', 'Asignado');
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
        .from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos')
        .select(`id, tipo_accion, fecha_vencimiento, completada, contacto_id, contactos!inner(razon_social, estado_actual, vendedor_id)`)
        .eq('completada', false)
        .in('contactos.estado_actual', ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado', 'Asignado', 'Venta', 'Recompra']);
        
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
      let queryClientes = supabase.from(isDev ? 'contactos_sandbox' : 'contactos')
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
  }, [activeTab, isDev]);

  const handleActionClick = (item) => setSelectedTask(item);

  const handleViewDetails = async (item) => {

    const { data: contactoData } = await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').select('*').eq('id', item.lead_id).single();
    if (contactoData) {
      setViewContact(contactoData);
    }
  };

  const handleSaveResolution = async (resolutionData) => {
    // Validación de Alta de Cliente
    if (resolutionData.option === 'exit' && selectedTask) {
      const { data: currentContact } = await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').select('*').eq('id', selectedTask.lead_id).single();
      if (currentContact) {
        const validacion = validarAltaCliente(currentContact);
        if (!validacion.esValido) {
          const tabs = Object.keys(validacion.porTab).join(', ');
          toast.error(`No puedes marcar como Exitoso. Faltan completar campos obligatorios en: ${tabs}. Por favor, edita los detalles del contacto primero.`, { duration: 6000 });
          return;
        }
      }
    }

    // DB Update
    if (selectedTask.isInteraction) {
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').update({ completada: true, notas: resolutionData.notes }).eq('id', selectedTask.id);
    } else {
      // Registrar primer contacto si era un Asignado sin interacciones previas
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert({
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

    const isClient = selectedTask.status === 'Venta' || selectedTask.status === 'Recompra';
    if (isClient) {
      if (nuevoEstado === 'Diferido' || nuevoEstado === 'Rellamar') {
        nuevoEstado = selectedTask.status; // Keep it as Venta or Recompra
      }
      if (nuevoEstado === 'Venta') {
        nuevoEstado = 'Recompra';
      }
    }

    if (nuevoEstado) {
      await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').update({ estado_actual: nuevoEstado }).eq('id', selectedTask.lead_id);
    }
    if (nuevaAccion) {
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert({ 
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
          Estás en MODO DEV. Estás conectado a la base de datos SANDBOX. Cambios aquí no afectan Producción.
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
        <div className="flex flex-col lg:flex-row gap-6">
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
          <div className="w-full lg:w-80 flex flex-col gap-3">
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
                actionText="CONTACTAR"
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
          onRefresh={fetchTabData} 
          userRole="Vendedor"
          isDev={isDev}
        />
      )}
    </div>
  );
}
