import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TaskRow from '../components/TaskRow';
import ResolutionModal from '../components/ResolutionModal';
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
  const [selectedTask, setSelectedTask] = useState(null); // Para el Modal

  const fetchTabData = async () => {
    setLoading(true);
    
    // Todos los queries de Vendedor estarán filtrados automáticamente por RLS en Supabase
    // gracias a la política: `vendedor_id = auth.uid()`
    
    if (activeTab === 'tareas') {
      // TAREAS: Interacciones pendientes que vencen hoy o ya vencieron
      const hoyISO = new Date().toISOString(); // Para simplificar. Idealmente fecha de hoy a 23:59
      
      const { data: interacciones, error } = await supabase
        .from('interacciones')
        .select(`id, tipo_accion, fecha_vencimiento, completada, lead_id, leads (nombre_empresa, estado_actual)`)
        .eq('completada', false)
        // .lte('fecha_vencimiento', hoyISO) // Filtro real de "Para hoy" (lo quitamos para debug rápido si se quiere ver todo lo pendiente)
        .order('fecha_vencimiento', { ascending: true });

      if (!error && interacciones) {
        const mapped = interacciones.map(t => {
          const dueDate = new Date(t.fecha_vencimiento);
          const isOverdue = dueDate < new Date();
          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
          
          let badgeColor = 'bg-primary-50 text-primary-900';
          if (t.leads.estado_actual === 'Diferido') badgeColor = 'bg-warning/20 text-warning-700';

          return {
            id: t.id,
            isInteraction: true,
            lead_id: t.lead_id,
            leadName: t.leads.nombre_empresa,
            status: t.leads.estado_actual,
            urgencyText: isOverdue ? 'Vencida' : `Vence el ${formatter.format(dueDate)}`,
            badgeColor
          };
        });
        setData(mapped);
      }
    } else {
      // BANDEJA, OPORTUNIDADES, CLIENTES: leemos directamente de la tabla LEADS
      let query = supabase.from('leads').select('*').order('fecha_actualizacion', { ascending: false });
      
      if (activeTab === 'bandeja') {
        query = query.eq('estado_actual', 'Nuevo');
      } else if (activeTab === 'oportunidades') {
        query = query.in('estado_actual', ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado']);
      } else if (activeTab === 'clientes') {
        query = query.in('estado_actual', ['Venta', 'Recompra']);
      }

      const { data: leadsData, error } = await query;
      if (!error && leadsData) {
        const mapped = leadsData.map(l => {
          let badgeColor = 'bg-neutral-200 text-neutral-800';
          if (l.estado_actual === 'Nuevo') badgeColor = 'bg-success/20 text-success-700';
          if (l.estado_actual === 'Venta') badgeColor = 'bg-primary-900 text-white';

          return {
            id: l.id,
            isInteraction: false, // Es un Lead directo
            lead_id: l.id,
            leadName: l.nombre_empresa,
            status: l.estado_actual,
            urgencyText: `Registrado: ${new Date(l.fecha_creacion).toLocaleDateString('es-AR')}`,
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

  const handleActionClick = (item) => {
    // Abrir modal solo para interacciones o leads que queramos trabajar
    setSelectedTask(item);
  };

  const handleSaveResolution = async (resolutionData) => {
    // Lógica similar al App.jsx original pero soportando ambos casos (Interaccion o Lead)
    if (selectedTask.isInteraction) {
      await supabase.from('interacciones').update({ completada: true, notas: resolutionData.notes }).eq('id', selectedTask.id);
    }

    let nuevoEstado = '';
    let nuevaAccion = '';
    let nuevaFechaVenc = new Date();

    switch(resolutionData.option) {
      case 'exit': nuevoEstado = 'Venta'; break;
      case 'rellamar': nuevoEstado = 'Rellamar'; nuevaAccion = 'rellamar'; nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 1); break;
      case 'diferido': nuevoEstado = 'Diferido'; nuevaAccion = 'diferido'; nuevaFechaVenc = new Date(resolutionData.deferDate); break;
      case 'fallido': nuevoEstado = 'Perdido'; break;
    }

    if (nuevoEstado) {
      await supabase.from('leads').update({ estado_actual: nuevoEstado }).eq('id', selectedTask.lead_id);
    }
    if (nuevaAccion) {
      await supabase.from('interacciones').insert({ lead_id: selectedTask.lead_id, tipo_accion: nuevaAccion, fecha_vencimiento: nuevaFechaVenc.toISOString(), completada: false });
    }

    setSelectedTask(null);
    fetchTabData();
  };

  return (
    <div>
      {/* TABS HEADER */}
      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-neutral-200 mb-6 p-2 gap-2 hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive 
                  ? 'bg-primary-50 text-primary-900 shadow-sm' 
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
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
            />
          ))
        )}
      </div>

      {/* MODAL */}
      {selectedTask && (
        <ResolutionModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveResolution}
        />
      )}
    </div>
  );
}
