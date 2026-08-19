import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TaskRow from '../components/TaskRow';
import ResolutionModal from '../components/ResolutionModal';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { Inbox, Briefcase, Calendar, Users, Loader2 } from 'lucide-react';

const TABS = [
  { id: 'bandeja', label: 'Bandeja', icon: Inbox },
  { id: 'oportunidades', label: 'Oportunidades', icon: Briefcase },
  { id: 'tareas', label: 'Tareas para Hoy', icon: Calendar },
  { id: 'clientes', label: 'Clientes', icon: Users },
];

export default function VendedorView({ session }) {
  const [activeTab, setActiveTab] = useState('tareas');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null); // Tarea para completar (ResolutionModal)
  const [viewContact, setViewContact] = useState(null); // Contacto para ver detalles (ContactDetailsModal)

  const fetchTabData = async () => {
    setLoading(true);
    
    if (activeTab === 'tareas') {
      const { data: interacciones, error } = await supabase
        .from('interacciones_contactos')
        .select(`id, tipo_accion, fecha_vencimiento, completada, contacto_id, contactos (razon_social, estado_actual)`)
        .eq('completada', false)
        .order('fecha_vencimiento', { ascending: true });

      if (!error && interacciones) {
        const mapped = interacciones.map(t => {
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const isOverdue = dueDate < new Date();
          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
          
          let badgeColor = 'bg-primary-50 text-primary-900';
          if (t.contactos?.estado_actual === 'Diferido') badgeColor = 'bg-warning/20 text-warning-700';

          return {
            id: t.id,
            isInteraction: true,
            lead_id: t.contacto_id,
            leadName: t.contactos?.razon_social || 'Desconocido',
            status: t.contactos?.estado_actual,
            urgencyText: isOverdue ? 'Vencida' : `Vence el ${formatter.format(dueDate)}`,
            badgeColor
          };
        });
        setData(mapped);
      }
    } else {
      let query = supabase.from('contactos').select('*').order('fecha_actualizacion', { ascending: false });
      
      if (session?.user?.id) {
         query = query.eq('vendedor_id', session.user.id);
      }

      if (activeTab === 'bandeja') query = query.eq('estado_actual', 'Asignado');
      else if (activeTab === 'oportunidades') query = query.in('estado_actual', ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado']);
      else if (activeTab === 'clientes') query = query.in('estado_actual', ['Venta', 'Recompra']);

      const { data: contactosData, error } = await query;
      if (!error && contactosData) {
        const mapped = contactosData.map(l => {
          let badgeColor = 'bg-neutral-200 text-neutral-800';
          if (l.estado_actual === 'Asignado') badgeColor = 'bg-success/20 text-success-700';
          if (l.estado_actual === 'Venta') badgeColor = 'bg-primary-900 text-white';

          return {
            id: l.id,
            isInteraction: false,
            lead_id: l.id,
            leadName: l.razon_social,
            status: l.estado_actual,
            urgencyText: `Actualizado: ${new Date(l.fecha_actualizacion).toLocaleDateString('es-AR')}`,
            badgeColor
          };
        });
        setData(mapped);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const handleActionClick = (item) => setSelectedTask(item);

  const handleViewDetails = async (item) => {
    // Buscar la data completa del contacto para el Modal
    const { data: contactoData } = await supabase.from('contactos').select('*').eq('id', item.lead_id).single();
    if (contactoData) {
      setViewContact(contactoData);
    }
  };

  const handleSaveResolution = async (resolutionData) => {
    if (selectedTask.isInteraction) {
      await supabase.from('interacciones_contactos').update({ completada: true, notas: resolutionData.notes }).eq('id', selectedTask.id);
    }

    let nuevoEstado = '';
    let nuevaAccion = '';
    let nuevaFechaVenc = new Date();

    switch(resolutionData.option) {
      case 'exit': nuevoEstado = 'Venta'; break;
      case 'rellamar': nuevoEstado = 'Rellamar'; nuevaAccion = 'Llamada Vendedor'; nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 1); break;
      case 'diferido': nuevoEstado = 'Diferido'; nuevaAccion = 'Seguimiento Vendedor'; nuevaFechaVenc = new Date(resolutionData.deferDate); break;
      case 'fallido': nuevoEstado = 'Perdido'; break;
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

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
        ) : data.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
            <p className="text-neutral-500">No hay registros en esta vista.</p>
          </div>
        ) : (
          data.map(item => (
            <TaskRow 
              key={item.id} 
              task={item} 
              onComplete={() => handleActionClick(item)}
              onViewDetails={() => handleViewDetails(item)}
            />
          ))
        )}
      </div>

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
        />
      )}
    </div>
  );
}
