import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTable } from '../lib/db';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { validarAltaCliente } from '../lib/validarAltaCliente';
import { addPuntos } from '../lib/gamificacion';
import TaskRow from '../components/TaskRow';
import ResolutionModal from '../components/ResolutionModal';
import ContactDetailsModal from '../components/ContactDetailsModal';
import TaskModal from '../components/TaskModal';
import GamificationWidget from '../components/GamificationWidget';
import { Inbox, Users, Loader2, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, X, Database, Filter, ChevronDown } from 'lucide-react';

const TABS = [
  { id: 'bandeja', label: 'Bandeja', icon: Inbox, color: 'text-blue-500' },
  { id: 'agenda', label: 'Agenda', icon: CalendarIcon, color: 'text-orange-500' },
  { id: 'clientes', label: 'Clientes', icon: Users, color: 'text-emerald-500' },
];

export default function VendedorView({ session, isDev }) {
  const [activeTab, setActiveTab] = useState('bandeja');
  
  // States to hold the split data for the new layout
  const [tareas, setTareas] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null); // Tarea para completar (ResolutionModal)
  const [viewContact, setViewContact] = useState(null); // Contacto para ver detalles (ContactDetailsModal)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // Modal para nueva tarea
  const [gamificationTrigger, setGamificationTrigger] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    provincia: '',
    condicion_iva: '',
    unidad_negocio: '',
    estado_actual: '',
    tiene_email: '',
    tiene_telefono: '',
    tiene_whatsapp: ''
  });

  const [bandejaSearch, setBandejaSearch] = useState("");
  const [bandejaTagFilter, setBandejaTagFilter] = useState("");
  const [bandejaPriorityFilter, setBandejaPriorityFilter] = useState("");
  const [bandejaTypeFilter, setBandejaTypeFilter] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(null);

  const fetchTabData = async () => {
    setLoading(true);

    if (activeTab === 'bandeja') {
      let nuevasTareas = [];
      let nuevasOportunidades = [];

      // 1. Fetch nuevos asignados (Tareas para Hoy)
      let queryNuevos = supabase.from(getTable('contactos', isDev)).select('*').eq('estado_actual', 'Asignado');
      if (session?.user?.id) queryNuevos = queryNuevos.eq('vendedor_id', session.user.id);
      
      const { data: nuevosData } = await queryNuevos;
      if (nuevosData) {
        nuevasTareas = nuevosData.map(c => ({
          id: `new-${c.id}`,
          isInteraction: false,
          lead_id: c.id,
          leadName: c.razon_social,
            contactName: c.resp_compras_nombre || '',
            prioridad: c.prioridad || 'Media',
            phone: c.resp_compras_telefono || c.telefono || '',
          email: c.resp_compras_email || c.email || '',
          status: 'Nuevo Asignado',
          contactStatus: c.estado_actual,
          urgencyText: 'Requiere primer contacto',
          badgeColor: 'bg-success/20 text-success',
          isOverdue: false,
          dateValue: new Date(c.fecha_actualizacion || c.fecha_creacion).getTime()
        }));
      }

      // 2. Fetch interacciones pendientes
      const contactosTableName = getTable('contactos', isDev);
      let queryInteracciones = supabase
        .from(getTable('interacciones_contactos', isDev))
        .select(`id, tipo_accion, fecha_vencimiento, completada, contacto_id, ${contactosTableName}!inner(razon_social, estado_actual, vendedor_id, resp_compras_nombre, resp_compras_telefono, resp_compras_email, telefono, email, prioridad)`)
        .eq('completada', false)
        .in(`${contactosTableName}.estado_actual`, ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado', 'Asignado', 'Venta', 'Recompra', 'CLIENTE REACTIVADO']);
        
      if (session?.user?.id) queryInteracciones = queryInteracciones.eq(`${contactosTableName}.vendedor_id`, session.user.id);

      const { data: interaccionesData } = await queryInteracciones;
      
      const leadsWithPendingInteractions = new Set();

      if (interaccionesData) {
        interaccionesData.forEach(t => {
          leadsWithPendingInteractions.add(t.contacto_id);
          
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const today = new Date();
          today.setHours(0,0,0,0);
          const dueDay = new Date(dueDate);
          dueDay.setHours(0,0,0,0);
          
          const isOverdue = dueDay < today;
          const isTodayOrPast = dueDay <= today;

          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
          let badgeColor = 'bg-primary-50 text-primary-900';
          if (t[contactosTableName]?.estado_actual === 'Diferido') badgeColor = 'bg-warning/20 text-warning';
          if (t[contactosTableName]?.estado_actual === 'CLIENTE REACTIVADO') badgeColor = 'bg-purple-100 text-purple-800 font-bold';

          const mapped = {
            id: t.id,
            isInteraction: true,
            isAgendaTask: false,
            lead_id: t.contacto_id,
            leadName: t[contactosTableName]?.razon_social || 'Desconocido',
            contactName: t[contactosTableName]?.resp_compras_nombre || '',
            prioridad: t[contactosTableName]?.prioridad || 'Media',
            phone: t[contactosTableName]?.resp_compras_telefono || t[contactosTableName]?.telefono || '',
            email: t[contactosTableName]?.resp_compras_email || t[contactosTableName]?.email || '',
            status: t[contactosTableName]?.estado_actual || t.tipo_accion,
            contactStatus: t[contactosTableName]?.estado_actual,
            urgencyText: isOverdue ? 'Vencida' : (dueDay.getTime() === today.getTime() ? 'Vence hoy' : `Vence el ${formatter.format(dueDate)}`),
            badgeColor,
            isOverdue,
            dateValue: dueDate.getTime()
          };

          if (isTodayOrPast) {
            nuevasTareas.push(mapped);
          } else {
            nuevasOportunidades.push(mapped);
          }
        });
      }

      // Filtrar los nuevos asignados que ya tienen interacciones pendientes para evitar duplicados
      nuevasTareas = nuevasTareas.filter(t => {
         if (!t.isInteraction && t.id.startsWith('new-')) {
            return !leadsWithPendingInteractions.has(t.lead_id);
         }
         return true;
      });

      // 2.5 Fetch all contactos for this vendor to cross-reference names for agenda tasks in bandeja
      let allContactosMap = {};
      if (session?.user?.id) {
        const { data: allCData } = await supabase
          .from(getTable('contactos', isDev))
          .select('id, razon_social, resp_compras_nombre, resp_compras_telefono, resp_compras_email, telefono, email, prioridad, estado_actual')
          .eq('vendedor_id', session.user.id);
        if (allCData) {
          allCData.forEach(c => allContactosMap[c.id] = c);
        }
      }

      // 3. Fetch tareas generales de agenda para combinarlas en la bandeja
      let queryTareasAgenda = supabase
        .from(getTable('tareas_agenda', isDev))
        .select('*')
        .eq('completada', false);
        
      if (session?.user?.id) queryTareasAgenda = queryTareasAgenda.eq('vendedor_id', session.user.id);

      const { data: agendaData } = await queryTareasAgenda;
      
      if (agendaData) {
        agendaData.forEach(t => {
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const today = new Date();
          today.setHours(0,0,0,0);
          const dueDay = new Date(dueDate);
          dueDay.setHours(0,0,0,0);
          
          const isOverdue = dueDay < today;
          const isTodayOrPast = dueDay <= today;

          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
          
          const contactoRel = t.contacto_id ? allContactosMap[t.contacto_id] : null;

          const mapped = {
            id: t.id,
            isInteraction: false,
            isAgendaTask: true,
            lead_id: t.contacto_id,
            clientName: contactoRel ? contactoRel.razon_social : null,
            contactName: contactoRel ? contactoRel.resp_compras_nombre : '',
            prioridad: contactoRel ? (contactoRel.prioridad || 'Media') : 'Media',
            phone: contactoRel ? (contactoRel.resp_compras_telefono || contactoRel.telefono) : '',
            email: contactoRel ? (contactoRel.resp_compras_email || contactoRel.email) : '',
            leadName: t.titulo,
            status: t.tipo,
            contactStatus: contactoRel ? contactoRel.estado_actual : null,
            urgencyText: isOverdue ? 'Vencida' : (dueDay.getTime() === today.getTime() ? 'Vence hoy' : `Vence el ${formatter.format(dueDate)}`),
            badgeColor: 'bg-secondary-50 text-secondary-900',
            isOverdue,
            dateValue: dueDate.getTime(),
            rawTask: t
          };

          if (isTodayOrPast) {
            nuevasTareas.push(mapped);
          } else {
            nuevasOportunidades.push(mapped);
          }
        });
      }
      
      // Sort by priority first, then chronologically
      const prioWeight = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
      const sortFn = (a, b) => {
        const wA = prioWeight[a.prioridad] || 2;
        const wB = prioWeight[b.prioridad] || 2;
        if (wA !== wB) return wA - wB;
        return a.dateValue - b.dateValue;
      };
      
      nuevasTareas.sort(sortFn);
      nuevasOportunidades.sort(sortFn);
      
      setTareas(nuevasTareas);
      setOportunidades(nuevasOportunidades);
      
    } else if (activeTab === 'clientes') {
      let queryClientes = supabase.from(getTable('contactos', isDev))
        .select('*')
        .in('estado_actual', ['Venta', 'Recompra', 'CLIENTE REACTIVADO'])
        .order('fecha_actualizacion', { ascending: false });
      
      if (session?.user?.id) queryClientes = queryClientes.eq('vendedor_id', session.user.id);
      
      const { data: clData, error: errCl } = await queryClientes;
      if (!errCl && clData) {
        const mappedCl = clData.map(l => ({
            ...l,
            id: l.id,
            isInteraction: false,
            lead_id: l.id,
            leadName: l.razon_social,
            contactName: l.resp_compras_nombre || '',
            prioridad: l.prioridad || 'Media',
            phone: l.resp_compras_telefono || l.telefono || '',
            email: l.resp_compras_email || l.email || '',
            status: l.estado_actual,
            urgencyText: `Actualizado: ${new Date(l.fecha_actualizacion).toLocaleDateString('es-AR')}`,
            badgeColor: 'bg-primary-900 text-white'
        }));
        setClientes(mappedCl);
      }
    } else if (activeTab === 'agenda') {
      let nuevasAgenda = [];
      
      // 1. Fetch interacciones pendientes (leads)
      const contactosTableName = getTable('contactos', isDev);
      let queryInteracciones = supabase
        .from(getTable('interacciones_contactos', isDev))
        .select(`id, tipo_accion, fecha_vencimiento, completada, contacto_id, ${contactosTableName}!inner(razon_social, estado_actual, vendedor_id, resp_compras_nombre, resp_compras_telefono, resp_compras_email, telefono, email, prioridad)`)
        .eq('completada', false)
        .in(`${contactosTableName}.estado_actual`, ['Rellamar', 'Recontacto', 'Diferido', 'Cotizado', 'Asignado', 'Venta', 'Recompra', 'CLIENTE REACTIVADO']);
        
      if (session?.user?.id) queryInteracciones = queryInteracciones.eq(`${contactosTableName}.vendedor_id`, session.user.id);
      
      const { data: interaccionesData } = await queryInteracciones;
      
      if (interaccionesData) {
        interaccionesData.forEach(t => {
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          
          nuevasAgenda.push({
            id: t.id,
            isInteraction: true,
            isAgendaTask: false,
            lead_id: t.contacto_id,
            leadName: `Llamar: ${t[contactosTableName]?.razon_social || 'Desconocido'}`,
            contactName: t[contactosTableName]?.resp_compras_nombre || '',
            prioridad: t[contactosTableName]?.prioridad || 'Media',
            phone: t[contactosTableName]?.resp_compras_telefono || t[contactosTableName]?.telefono || '',
            email: t[contactosTableName]?.resp_compras_email || t[contactosTableName]?.email || '',
            status: t[contactosTableName]?.estado_actual || t.tipo_accion,
            contactStatus: t[contactosTableName]?.estado_actual,
            urgencyText: formatter.format(dueDate),
            badgeColor: 'bg-primary-50 text-primary-900',
            dateValue: dueDate.getTime()
          });
        });
      }

      // 1.5 Fetch all contactos for this vendor to cross-reference names for agenda tasks
      let allContactosMap = {};
      if (session?.user?.id) {
        const { data: allCData } = await supabase
          .from(getTable('contactos', isDev))
          .select('id, razon_social, resp_compras_nombre, resp_compras_telefono, resp_compras_email, telefono, email, prioridad, estado_actual')
          .eq('vendedor_id', session.user.id);
        if (allCData) {
          allCData.forEach(c => allContactosMap[c.id] = c);
        }
      }

      // 2. Fetch tareas generales de agenda
      let queryTareasAgenda = supabase
        .from(getTable('tareas_agenda', isDev))
        .select('*')
        .eq('completada', false);
        
      if (session?.user?.id) queryTareasAgenda = queryTareasAgenda.eq('vendedor_id', session.user.id);
      
      const { data: agendaData } = await queryTareasAgenda;
      
      if (agendaData) {
        agendaData.forEach(t => {
          const dueDate = t.fecha_vencimiento ? new Date(t.fecha_vencimiento) : new Date();
          const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          
          const contactoRel = t.contacto_id ? allContactosMap[t.contacto_id] : null;

          nuevasAgenda.push({
            id: t.id,
            isInteraction: false,
            isAgendaTask: true,
            lead_id: t.contacto_id, // Puede ser null
            clientName: contactoRel ? contactoRel.razon_social : null,
            contactName: contactoRel ? contactoRel.resp_compras_nombre : '',
            prioridad: contactoRel ? (contactoRel.prioridad || 'Media') : 'Media',
            phone: contactoRel ? (contactoRel.resp_compras_telefono || contactoRel.telefono) : '',
            email: contactoRel ? (contactoRel.resp_compras_email || contactoRel.email) : '',
            descripcion: t.descripcion,
            leadName: t.titulo,
            status: t.tipo,
            contactStatus: contactoRel ? contactoRel.estado_actual : null,
            urgencyText: formatter.format(dueDate),
            badgeColor: 'bg-secondary-50 text-secondary-900',
            dateValue: dueDate.getTime(),
            rawTask: t
          });
        });
      }
      
      // Ordenar cronológicamente
      nuevasAgenda.sort((a, b) => a.dateValue - b.dateValue);
      setAgendaItems(nuevasAgenda);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, isDev]);

  const handleActionClick = async (item) => {
    setSelectedTask(item);
  };

  const handleSaveGeneralTask = async (formData) => {
    try {
      const { error } = await supabase.from(getTable('tareas_agenda', isDev)).insert({
        vendedor_id: session?.user?.id,
        creador_id: session?.user?.id,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        fecha_vencimiento: formData.fecha_vencimiento,
        contacto_id: formData.contacto_id || null,
      });
      if (error) throw error;
      
      toast.success('Tarea creada exitosamente');
      fetchTabData();
    } catch (error) {
      toast.error('Error al crear tarea: ' + error.message);
      throw error;
    }
  };

  const handleViewDetails = async (item) => {
    if (item.isAgendaTask) {
      if (!item.lead_id) {
        toast('Esta tarea genérica no está vinculada a ningún cliente. Puedes leer los detalles directamente en la tarjeta.', { icon: 'ℹ️' });
        return;
      }
    }

    const { data: contactoData } = await supabase.from(getTable('contactos', isDev)).select('*').eq('id', item.lead_id).single();
    if (contactoData) {
      setViewContact(contactoData);
    }
  };

  const handleSaveResolution = async (resolutionData) => {
    // Si es Tarea de Agenda
    if (selectedTask.isAgendaTask) {
      if (resolutionData.option === 'diferido') {
        // Reprogramar
        await supabase
          .from(getTable('tareas_agenda', isDev))
          .update({ 
            fecha_vencimiento: new Date(resolutionData.deferDate).toISOString(),
            descripcion: resolutionData.notes ? selectedTask.descripcion + '\n\n[Reprogramada] ' + resolutionData.notes : selectedTask.descripcion
          })
          .eq('id', selectedTask.id);
        toast.success('Tarea reprogramada');
      } else {
        // Completar ('exit' u otra)
        await supabase
          .from(getTable('tareas_agenda', isDev))
          .update({ 
            completada: true,
            descripcion: resolutionData.notes ? selectedTask.descripcion + '\n\n[Completada] ' + resolutionData.notes : selectedTask.descripcion
          })
          .eq('id', selectedTask.id);
        toast.success('Tarea completada');
        await addPuntos(session?.user?.id, 'tarea_general', selectedTask.id, isDev);
      }
      setSelectedTask(null);
      fetchTabData();
      setGamificationTrigger(prev => prev + 1);
      return;
    }

    // Validación de Alta de Cliente
    if (resolutionData.option === 'venta' && selectedTask) {
      const { data: currentContact } = await supabase.from(getTable('contactos', isDev)).select('*').eq('id', selectedTask.lead_id).single();
      if (currentContact) {
        const validacion = validarAltaCliente(currentContact);
        if (!validacion.esValido) {
          const tabs = Object.keys(validacion.porTab).join(', ');
          toast.error(`No puedes marcar como Exitoso. Faltan completar campos obligatorios en: ${tabs}. Por favor, edita los detalles del contacto primero.`, { duration: 6000 });
          return;
        }
      }
    }

    // DB Update: Clear priority from the contact as it's transient
    if (selectedTask.lead_id) {
      await supabase.from(getTable('contactos', isDev)).update({ prioridad: null }).eq('id', selectedTask.lead_id);
    }

    // Flujo normal para leads (interacciones_contactos)
    if (selectedTask.isInteraction) {
      const { error: errIntUpd } = await supabase.from(getTable('interacciones_contactos', isDev)).update({ 
        completada: true, 
        notas: resolutionData.notes,
        resultado: resolutionData.option
      }).eq('id', selectedTask.id);
      if (errIntUpd) toast.error("Error al actualizar la interacción: " + errIntUpd.message);
    } else {
      // Registrar primer contacto si era un Asignado sin interacciones previas
      const { error: errIntIns } = await supabase.from(getTable('interacciones_contactos', isDev)).insert({
        contacto_id: selectedTask.lead_id,
        tipo_accion: 'Primer Contacto',
        resultado: resolutionData.option,
        notas: resolutionData.notes,
        completada: true
      });
      if (errIntIns) toast.error("Error al registrar primer contacto: " + errIntIns.message);
    }

    let nuevoEstado = selectedTask.contactStatus || selectedTask.status;
    let nuevaAccion = '';
    let nuevaFechaVenc = new Date();

    switch(resolutionData.option) {
      case 'venta': nuevoEstado = 'Venta'; break;
      case 'exit': 
        nuevoEstado = 'Recontacto'; 
        nuevaAccion = 'Seguimiento Vendedor'; 
        nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 3); 
        nuevaFechaVenc.setHours(12,0,0); 
        break;
      case 'rellamar': 
        nuevoEstado = 'Rellamar'; 
        nuevaAccion = 'Llamada Vendedor'; 
        nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 1); 
        nuevaFechaVenc.setHours(12,0,0); 
        break;
      case 'diferido': 
        nuevoEstado = 'Diferido'; 
        nuevaAccion = 'Seguimiento Vendedor'; 
        nuevaFechaVenc = new Date(resolutionData.deferDate);
        break;
      case 'fallido': nuevoEstado = 'Descartado'; break;
      case 'catalogo_digital':
      case 'catalogo_fisico':
        nuevoEstado = 'Recontacto'; // Avanza el lead a Recontacto
        break;
      case 'presupuesto':
        nuevoEstado = 'Cotizado';
        nuevaAccion = 'Seguimiento Presupuesto';
        nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 2);
        nuevaFechaVenc.setHours(12,0,0);
        break;
      case 'no_contesta':
        nuevoEstado = 'Rellamar';
        nuevaAccion = 'Llamada Vendedor';
        nuevaFechaVenc.setDate(nuevaFechaVenc.getDate() + 1);
        nuevaFechaVenc.setHours(12,0,0);
        break;
      case 'recompra':
        nuevoEstado = 'Recompra';
        break;
    }

    const isClient = selectedTask.status === 'Venta' || selectedTask.status === 'Recompra' || selectedTask.status === 'CLIENTE REACTIVADO';
    if (isClient) {
      if (!nuevoEstado || nuevoEstado === 'Diferido' || nuevoEstado === 'Rellamar') {
        nuevoEstado = selectedTask.status; // Keep current client status if no specific state change
      }
      if (resolutionData.option === 'recompra') {
        nuevoEstado = 'Recompra';
      }
    }

    let updateFields = {};
    if (nuevoEstado !== selectedTask.status) {
      updateFields.estado_actual = nuevoEstado;
    }

    if (resolutionData.option === 'catalogo_digital') updateFields.catalogo_digital = true;
    if (resolutionData.option === 'catalogo_fisico') updateFields.catalogo_fisico = true;
    if (resolutionData.option === 'presupuesto') updateFields.presupuesto_enviado = true;

    if (Object.keys(updateFields).length > 0) {
      const { error: errUpdateLead } = await supabase.from(getTable('contactos', isDev)).update(updateFields).eq('id', selectedTask.lead_id);
      if (errUpdateLead) {
        toast.error('Error al actualizar estado del cliente');
      }
    }

    if (nuevaAccion) {
      const payload = { 
        contacto_id: selectedTask.lead_id, 
        tipo_accion: nuevaAccion, 
        fecha_vencimiento: nuevaFechaVenc.toISOString(), 
        completada: false 
      };
      console.log("Inserting interaccion:", payload);
      const { error: errInsert } = await supabase.from(getTable('interacciones_contactos', isDev)).insert(payload);
      if (errInsert) {
        console.error("Error inserting interaccion:", errInsert);
        toast.error("Error al guardar la tarea en base de datos: " + errInsert.message);
      } else {
        toast.success("Tarea actualizada correctamente");
      }
    } else {
      toast.success("Contacto actualizado correctamente");
    }

    if (resolutionData.option !== 'fallido' && resolutionData.option !== 'no_contesta') {
      const validRefId = typeof selectedTask.id === 'string' && selectedTask.id.startsWith('new-') ? selectedTask.lead_id : selectedTask.id;
      await addPuntos(session?.user?.id, resolutionData.option, validRefId, isDev);

      if (resolutionData.option === 'venta' || resolutionData.option === 'recompra') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#16a34a', '#fde047', '#eab308', '#ffffff'],
          zIndex: 9999
        });
      }
    }

    setSelectedTask(null);
    fetchTabData();
    setGamificationTrigger(prev => prev + 1);
  };
  const Pagination = ({ total, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-4 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg disabled:opacity-50 text-sm font-semibold transition-colors">Anterior</button>
        <span className="text-sm font-medium text-neutral-600">Página {currentPage} de {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg disabled:opacity-50 text-sm font-semibold transition-colors">Siguiente</button>
      </div>
    );
  };

  // Helper properties to paginate the different lists based on standard variables
  // Since activeTab resets currentPage to 1, we can reuse currentPage for the main list of each tab.
  // For 'bandeja', we'll paginate 'tareas'. For 'oportunidades' we'll just slice the top 15 or let it be.
  // Wait, let's just paginate them correctly.
  
  return (
    <div>
      {isDev && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 text-warning-800 rounded-lg text-sm font-medium flex items-center justify-center">
          Estás en MODO DEV. Estás conectado a la base de datos SANDBOX. Cambios aquí no afectan Producción.
        </div>
      )}

      <GamificationWidget session={session} isDev={isDev} refreshTrigger={gamificationTrigger} />

      <div className="flex overflow-x-auto bg-white rounded-xl shadow-sm border border-neutral-200 mb-6 p-2 gap-2 hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              title={tab.label}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive ? 'bg-primary-50 text-primary-900 shadow-sm' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
            >
              <Icon size={18} className={tab.color} />
              <span className="hidden sm:inline">{tab.label}</span>
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-neutral-800">Tareas para Hoy</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTaskModalOpen(true)}
                  className="bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Agregar Tarea</span>
                </button>
              </div>
            </div>

            {/* FILTROS DE BANDEJA */}
            <div className="flex flex-col gap-3 mb-2">
              <div className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-sm flex items-center gap-2 flex-1">
                <Database className="text-neutral-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar tarea o cliente..."
                  value={bandejaSearch}
                  onChange={(e) => setBandejaSearch(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm text-neutral-700"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-lg border border-neutral-200 shadow-sm flex items-center flex-1 min-w-[130px] relative">
                  <select
                    value={bandejaTypeFilter}
                    onChange={(e) => setBandejaTypeFilter(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm text-neutral-700 py-2 pl-3 pr-8 appearance-none"
                  >
                    <option value="">Tipo (Todos)</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Lead">Lead</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 text-neutral-400 pointer-events-none" />
                </div>
                
                <div className="bg-white rounded-lg border border-neutral-200 shadow-sm flex items-center flex-1 min-w-[130px] relative">
                  <select
                    value={bandejaPriorityFilter}
                    onChange={(e) => setBandejaPriorityFilter(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm text-neutral-700 py-2 pl-3 pr-8 appearance-none"
                  >
                    <option value="">Prioridad (Todas)</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 text-neutral-400 pointer-events-none" />
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 shadow-sm flex items-center flex-1 min-w-[130px] relative">
                  <select
                    value={bandejaTagFilter}
                    onChange={(e) => setBandejaTagFilter(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm text-neutral-700 py-2 pl-3 pr-8 appearance-none"
                  >
                    <option value="">Etiquetas (Todas)</option>
                    {[...new Set([...tareas, ...oportunidades].map(t => t.status).filter(Boolean))].sort().map(status => (
                      <option key={status} value={status}>
                        {status.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {(() => {
              const filteredTareas = tareas.filter(t => {
                const matchSearch = t.leadName?.toLowerCase().includes(bandejaSearch.toLowerCase()) || 
                                    t.clientName?.toLowerCase().includes(bandejaSearch.toLowerCase()) ||
                                    t.status?.toLowerCase().includes(bandejaSearch.toLowerCase());
                const matchTag = bandejaTagFilter ? t.status === bandejaTagFilter : true;
                
                const isClient = ['Venta', 'Recompra', 'CLIENTE REACTIVADO', 'Cliente'].includes(t.contactStatus);
                const matchType = bandejaTypeFilter ? (bandejaTypeFilter === 'Cliente' ? isClient : !isClient) : true;
                
                const matchPriority = bandejaPriorityFilter ? t.prioridad === bandejaPriorityFilter : true;
                
                return matchSearch && matchTag && matchType && matchPriority;
              });

              return filteredTareas.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl border border-neutral-200 shadow-sm">
                  <p className="text-neutral-500">No hay tareas pendientes para hoy con estos filtros.</p>
                </div>
              ) : (
                <>
                  {filteredTareas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                    <TaskRow 
                      key={item.id} 
                      task={item} 
                      onComplete={() => handleActionClick(item)}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  <Pagination total={filteredTareas.length} currentPage={currentPage} onPageChange={setCurrentPage} />
                </>
              );
            })()}
          </div>
          
          {/* Side Column: Oportunidades */}
          <div className="w-full lg:w-80 flex flex-col gap-3">
            <h3 className="font-semibold text-neutral-800 mb-2">Oportunidades (Pendientes)</h3>
            {(() => {
              const filteredOportunidades = oportunidades.filter(t => {
                const matchSearch = t.leadName?.toLowerCase().includes(bandejaSearch.toLowerCase()) || 
                                    t.clientName?.toLowerCase().includes(bandejaSearch.toLowerCase()) ||
                                    t.status?.toLowerCase().includes(bandejaSearch.toLowerCase());
                const matchTag = bandejaTagFilter ? t.status === bandejaTagFilter : true;
                
                const isClient = ['Venta', 'Recompra', 'CLIENTE REACTIVADO', 'Cliente'].includes(t.contactStatus);
                const matchType = bandejaTypeFilter ? (bandejaTypeFilter === 'Cliente' ? isClient : !isClient) : true;
                
                const matchPriority = bandejaPriorityFilter ? t.prioridad === bandejaPriorityFilter : true;
                
                return matchSearch && matchTag && matchType && matchPriority;
              });

              return filteredOportunidades.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl border border-neutral-200 shadow-sm">
                  <p className="text-neutral-500">No hay oportunidades con estos filtros.</p>
                </div>
              ) : (
                filteredOportunidades.slice(0, 5).map(item => (
                  <TaskRow 
                    key={item.id} 
                    task={item} 
                    compact={true}
                    onComplete={() => handleActionClick(item)}
                    onViewDetails={() => handleViewDetails(item)}
                  />
                ))
              );
            })()}
          </div>
        </div>
      ) : activeTab === 'agenda' ? (() => {
        // Agrupar por día TODA la agenda
        const grouped = agendaItems.reduce((acc, item) => {
          const date = new Date(item.dateValue);
          date.setHours(0,0,0,0);
          const time = date.getTime();
          if (!acc[time]) acc[time] = [];
          acc[time].push(item);
          return acc;
        }, {});

        // Build calendar days
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1)); // start on Monday

        const endDate = new Date(lastDayOfMonth);
        if (endDate.getDay() !== 0) {
          endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
        }

        const calendarDays = [];
        let d = new Date(startDate);
        while (d <= endDate) {
          calendarDays.push(new Date(d));
          d.setDate(d.getDate() + 1);
        }

        const handlePrevMonth = () => {
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
        };
        const handleNextMonth = () => {
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        };
        const today = new Date();
        today.setHours(0,0,0,0);

        return (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="font-semibold text-neutral-800">Mi Agenda</h3>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-neutral-100 rounded-md transition-colors"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium w-36 text-center capitalize">
                    {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-neutral-100 rounded-md transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-primary-900 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 shrink-0"
              >
                <Plus size={16} />
                Agregar Tarea
              </button>
            </div>
            
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-neutral-200 text-xs font-bold text-white text-center">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => (
                  <div key={day} className={`py-2 border-r border-neutral-200/20 last:border-r-0 ${idx === 6 ? 'bg-danger' : 'bg-primary-900'}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-neutral-200 gap-[1px]">
                {calendarDays.map(dayDate => {
                  const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
                  const isToday = dayDate.getTime() === today.getTime();
                  const time = dayDate.getTime();
                  const dayItems = grouped[time] || [];
                  const hasItems = dayItems.length > 0;
                  const isPast = dayDate < today;
                  const isSunday = dayDate.getDay() === 0;

                  let heatmapClass = 'bg-white';
                  if (hasItems) {
                    if (dayItems.length <= 2) heatmapClass = 'bg-primary-500/10';
                    else if (dayItems.length <= 5) heatmapClass = 'bg-primary-500/20';
                    else if (dayItems.length <= 8) heatmapClass = 'bg-primary-500/40';
                    else heatmapClass = 'bg-primary-500/60';
                  } else if (isSunday) {
                    heatmapClass = 'bg-danger/10';
                  }
                  
                  return (
                    <div 
                      key={time} 
                      onClick={() => { if (hasItems) setSelectedAgendaDate(time) }}
                      className={`aspect-square p-1.5 sm:p-2 transition-colors flex flex-col items-center sm:items-start justify-start gap-1 
                        ${!isCurrentMonth ? 'opacity-40 bg-neutral-100' : heatmapClass} 
                        ${hasItems ? 'cursor-pointer ring-inset ring-1 ring-primary-500/30 hover:brightness-95' : 'hover:bg-neutral-50'}`}
                    >
                      <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full 
                        ${isToday ? 'bg-primary-500 text-white shadow-sm' : (hasItems ? 'bg-white/80 text-primary-900 shadow-sm' : (isSunday ? 'text-danger' : 'text-neutral-700'))}`}>
                        {dayDate.getDate()}
                      </span>
                      {hasItems && (
                        <div className="flex flex-col gap-1 w-full mt-auto sm:mt-1">
                          <div className={`text-[10px] sm:text-xs font-bold px-1 py-0.5 sm:py-1 rounded-md w-full truncate text-center ${isPast ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-primary-50 text-primary-900 border border-primary-500/30'}`}>
                            {dayItems.length} <span className="hidden sm:inline">{dayItems.length === 1 ? 'tarea' : 'tareas'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })() : (
        /* Clientes Tab */
        <div className="flex flex-col gap-3">
          {/* SEARCH AND FILTERS */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex items-center gap-2 flex-1 max-w-md">
                <Database className="text-neutral-400" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar por nombre, CUIT o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm text-neutral-700"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  showFilters || Object.values(filters).some(v => v !== '') 
                    ? 'bg-primary-50 border-primary-200 text-primary-700' 
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Filter size={18} />
                Filtros
                {Object.values(filters).some(v => v !== '') && (
                  <span className="bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ml-1">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>
            </div>

            {/* PANEL DE FILTROS */}
            {showFilters && (
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Provincia</label>
                  <div className="relative">
                    <select 
                      value={filters.provincia}
                      onChange={(e) => setFilters({...filters, provincia: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Todas</option>
                      {[...new Set(clientes.map(c => c.provincia).filter(Boolean))].sort().map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Condición IVA</label>
                  <div className="relative">
                    <select 
                      value={filters.condicion_iva}
                      onChange={(e) => setFilters({...filters, condicion_iva: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Todas</option>
                      {[...new Set(clientes.map(c => c.condicion_iva).filter(Boolean))].sort().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Unidad Negocio</label>
                  <div className="relative">
                    <select 
                      value={filters.unidad_negocio}
                      onChange={(e) => setFilters({...filters, unidad_negocio: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Todas</option>
                      {[...new Set(clientes.map(c => c.unidad_negocio).filter(Boolean))].sort().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Estado Actual</label>
                  <div className="relative">
                    <select 
                      value={filters.estado_actual}
                      onChange={(e) => setFilters({...filters, estado_actual: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Todos</option>
                      {[...new Set(clientes.map(c => c.estado_actual).filter(Boolean))].sort().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <select 
                      value={filters.tiene_email}
                      onChange={(e) => setFilters({...filters, tiene_email: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Indistinto</option>
                      <option value="si">Con Email</option>
                      <option value="no">Sin Email</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Teléfono</label>
                  <div className="relative">
                    <select 
                      value={filters.tiene_telefono}
                      onChange={(e) => setFilters({...filters, tiene_telefono: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Indistinto</option>
                      <option value="si">Con Teléfono</option>
                      <option value="no">Sin Teléfono</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">WhatsApp</label>
                  <div className="relative">
                    <select 
                      value={filters.tiene_whatsapp}
                      onChange={(e) => setFilters({...filters, tiene_whatsapp: e.target.value})}
                      className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Indistinto</option>
                      <option value="si">Con WhatsApp</option>
                      <option value="no">Sin WhatsApp</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 flex justify-end">
                   <button 
                      onClick={() => setFilters({
                        provincia: '', condicion_iva: '', unidad_negocio: '', estado_actual: '', tiene_email: '', tiene_telefono: '', tiene_whatsapp: ''
                      })}
                      className="text-sm text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1 transition-colors"
                   >
                     <X size={16} /> Limpiar filtros
                   </button>
                </div>
              </div>
            )}
          </div>

          {(() => {
            const filteredClientes = clientes.filter(c => {
              const matchSearch = c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  c.cuit?.includes(searchTerm) || 
                                  c.telefono?.includes(searchTerm) ||
                                  c.resp_compras_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
              
              const matchProvincia = filters.provincia ? c.provincia === filters.provincia : true;
              const matchCondicionIva = filters.condicion_iva ? c.condicion_iva === filters.condicion_iva : true;
              const matchUnidadNegocio = filters.unidad_negocio ? c.unidad_negocio === filters.unidad_negocio : true;
              const matchEstado = filters.estado_actual ? c.estado_actual === filters.estado_actual : true;
              const matchEmail = filters.tiene_email === 'si' ? !!c.email : (filters.tiene_email === 'no' ? !c.email : true);
              const matchTelefono = filters.tiene_telefono === 'si' ? !!c.telefono : (filters.tiene_telefono === 'no' ? !c.telefono : true);
              const matchWhatsapp = filters.tiene_whatsapp === 'si' ? c.telefono_whatsapp === true : (filters.tiene_whatsapp === 'no' ? c.telefono_whatsapp === false : true);

              return matchSearch && matchProvincia && matchCondicionIva && matchUnidadNegocio && matchEstado && matchEmail && matchTelefono && matchWhatsapp;
            });

            return filteredClientes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <p className="text-neutral-500">No hay clientes que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <>
                {filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                  <TaskRow 
                    key={item.id} 
                    task={item} 
                    actionText="CONTACTAR"
                    onComplete={() => handleActionClick(item)}
                    onViewDetails={() => handleViewDetails(item)}
                  />
                ))}
                <Pagination total={filteredClientes.length} currentPage={currentPage} onPageChange={setCurrentPage} />
              </>
            );
          })()}
        </div>
      )}
      {selectedAgendaDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
              <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                <CalendarIcon size={20} className="text-primary-600" />
                Agenda: {new Date(selectedAgendaDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </h3>
              <button onClick={() => setSelectedAgendaDate(null)} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
              {agendaItems
                .filter(t => {
                  const d = new Date(t.dateValue);
                  d.setHours(0,0,0,0);
                  return d.getTime() === selectedAgendaDate;
                })
                .sort((a, b) => {
                  const prioWeight = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
                  const wA = prioWeight[a.prioridad] || 2;
                  const wB = prioWeight[b.prioridad] || 2;
                  if (wA !== wB) return wA - wB;
                  return a.dateValue - b.dateValue;
                })
                .map(item => (
                  <TaskRow 
                    key={item.id} 
                    task={item} 
                    onComplete={() => { setSelectedAgendaDate(null); handleActionClick(item); }}
                    onViewDetails={() => { setSelectedAgendaDate(null); handleViewDetails(item); }}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <ResolutionModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveResolution}
          onEditLead={() => handleViewDetails(selectedTask)}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveGeneralTask}
          isDev={isDev}
          session={session}
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
