import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Upload, Database, Loader2, FileText, PhoneCall, RefreshCw, Sparkles, Clock, Trash2, Users, Eye, Filter, X, ChevronDown } from 'lucide-react';
import ResolutionModal from '../components/ResolutionModal';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { toast } from 'react-hot-toast';

export default function ProspectorView({ isDev }) {
  const [activeTab, setActiveTab] = useState('nuevos'); // 'nuevos', 'recontactos', 'perdidos', 'importar'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para la gestión de contactos
  const [contactos, setContactos] = useState([]);
  const [loadingContactos, setLoadingContactos] = useState(true);
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [viewContact, setViewContact] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignVendedorId, setAssignVendedorId] = useState("");
  const [assignPrioridad, setAssignPrioridad] = useState("Media");
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [isReactivacion, setIsReactivacion] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- NUEVOS ESTADOS PARA FILTROS ---
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    provincia: '',
    condicion_iva: '',
    unidad_negocio: '',
    estado_actual: '',
    vendedor_id: '',
    tiene_email: '',
    tiene_telefono: '',
    tiene_whatsapp: ''
  });

  // --- LÓGICA DE IMPORTACIÓN CSV ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      }
    });
  };

  const handleImport = async () => {
    setLoading(true);
    if (isDev) {
      toast.success(`Mockup: ¡${data.length} importados localmente!`);
      setData([]);
      setActiveTab('nuevos');
      setLoading(false);
      return;
    }
    
    // 1. Parsear y limpiar datos del CSV
    let validContactos = [];
    let invalidosCount = 0;
    
    const telefonosVistos = new Set();
    const emailsVistos = new Set();
    
    data.forEach(row => {
      const razonSocial = row['Razón Social'] || row['Razon Social'];
      if (!razonSocial || razonSocial === 'Empresa Desconocida') return;

      const rawTelefono = row['Telefono'] || row['Teléfono'] || '';
      const telefonoLimpio = rawTelefono.replace(/\D/g, ''); // Deja solo los dígitos
      
      const email = row['Email'] || row['Mail'] || row['Correo'] || null;

      // Validación 1: Teléfono debe tener exactamente 10 dígitos
      if (telefonoLimpio.length !== 10) {
        invalidosCount++;
        return;
      }

      // Validación 2: Duplicados dentro del mismo archivo
      if (telefonosVistos.has(telefonoLimpio)) {
        invalidosCount++;
        return;
      }
      
      if (email && emailsVistos.has(email)) {
        invalidosCount++;
        return;
      }

      telefonosVistos.add(telefonoLimpio);
      if (email) emailsVistos.add(email);

      validContactos.push({
        codigo: row['Código'] || null,
        razon_social: razonSocial,
        cuit: row['C.U.I.T.'] || row['CUIT'] || null,
        telefono: telefonoLimpio,
        email: email,
        fecha_alta: row['Fecha Alta'] || null,
        provincia: row['Provincia'] || null,
        domicilio: row['Domicilio'] || null,
        condicion_iva: row['Condicion IVA'] || null,
        unidad_negocio: row['UNIDADE DE NEGOCIO'] || row['Unidad de Negocio'] || null,
        estado_actual: 'Nuevo'
      });
    });

    if (validContactos.length === 0) {
      toast.error(`No se encontraron contactos válidos.\nSe omitieron ${invalidosCount} registros por datos inválidos o repetidos.`, { duration: 5000 });
      setLoading(false);
      return;
    }

    // 2. Controlar duplicados con la base de datos
    const telefonos = validContactos.map(c => c.telefono);
    const emails = validContactos.map(c => c.email).filter(Boolean);
    
    let orQuery = `telefono.in.(${telefonos.join(',')})`;
    if (emails.length > 0) {
      orQuery += `,email.in.(${emails.map(e => `"${e}"`).join(',')})`;
    }

    const { data: existentesDb, error: errFetch } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .select('telefono, email')
      .or(orQuery);

    if (errFetch) {
      toast.error("Error al verificar duplicados: " + errFetch.message);
      setLoading(false);
      return;
    }

    const setTelefonosDb = new Set(existentesDb.map(c => c.telefono).filter(Boolean));
    const setEmailsDb = new Set(existentesDb.map(c => c.email).filter(Boolean));

    const finalContactos = [];
    let dbDuplicadosCount = 0;

    validContactos.forEach(c => {
      if (setTelefonosDb.has(c.telefono) || (c.email && setEmailsDb.has(c.email))) {
        dbDuplicadosCount++;
      } else {
        finalContactos.push(c);
      }
    });

    if (finalContactos.length === 0) {
       toast.error(`No se importó nada.\nLos ${validContactos.length} contactos válidos ya existían en la DB.`, { duration: 5000 });
       setLoading(false);
       return;
    }

    // 3. Insertar los realmente nuevos
    const { error } = await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').insert(finalContactos);
    
    if (error) {
      toast.error("Error al importar: " + error.message);
    } else {
      let msg = `¡${finalContactos.length} importados!`;
      if (invalidosCount > 0) msg += `\n${invalidosCount} omitidos (inválidos/repetidos).`;
      if (dbDuplicadosCount > 0) msg += `\n${dbDuplicadosCount} omitidos (ya existían).`;
      
      toast.success(msg, { duration: 6000 });
      setData([]);
      setActiveTab('nuevos');
    }
    setLoading(false);
  };

  // --- LÓGICA DE GESTIÓN DE CONTACTOS ---
  const fetchVendedores = async () => {
    const { data } = await supabase.from("perfiles").select("id, nombre_completo, email").in("rol", ["Vendedor", "Dev"]);
    if (data) setVendedores(data);
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const fetchContactos = async () => {
    setLoadingContactos(true);

    let estadoQuery = [];
    if (activeTab === 'nuevos') estadoQuery = ['Nuevo'];
    else if (activeTab === 'recontactos') estadoQuery = ['Admin_Rellamar'];
    else if (activeTab === 'perdidos') estadoQuery = ['Descartado'];
    // if activeTab === 'todos', fetch all

    if (estadoQuery.length > 0) {
      const { data: contactosData, error } = await supabase
        .from(isDev ? 'contactos_sandbox' : 'contactos')
        .select('*')
        .in('estado_actual', estadoQuery)
        .order('fecha_creacion', { ascending: false });
      if (!error && contactosData) setContactos(contactosData);
    } else {
      const { data: contactosData, error } = await supabase
        .from(isDev ? 'contactos_sandbox' : 'contactos')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      if (!error && contactosData) setContactos(contactosData);
    }

    setLoadingContactos(false);
  };

  useEffect(() => {
    fetchContactos();
  }, [activeTab, isDev]);

  const handleSaveResolution = async (resolutionData) => {
    if (!selectedContacto) return;
    
    const interaction = {
      contacto_id: selectedContacto.id,
      tipo_accion: 'Llamada de Prospector',
      resultado: resolutionData.option,
      notas: resolutionData.notes,
      fecha_creacion: new Date().toISOString()
    };
    
    await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert(interaction);
    
    let nuevoEstado = selectedContacto.estado_actual;
    
    if (resolutionData.option === 'exit') {
      setSelectedClientes([selectedContacto.id]);
      setIsAssignModalOpen(true);
      toast.success('Llamada registrada. Por favor, asigna este cliente a un vendedor.');
      setSelectedContacto(null);
      return;
    } else if (resolutionData.option === 'fallido') {
      nuevoEstado = 'Descartado';
      toast.success('Lead descartado');
    } else if (resolutionData.option === 'rellamar' || resolutionData.option === 'diferido') {
      nuevoEstado = 'Admin_Rellamar';
      toast.success('Recontacto registrado');
    }
    
    if (nuevoEstado !== selectedContacto.estado_actual) {
      await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').update({ estado_actual: nuevoEstado }).eq('id', selectedContacto.id);
    }
    
    setSelectedContacto(null);
    fetchContactos();
  };

  const handleReingresar = async (contacto) => {
    // Un lead perdido vuelve a ser "Nuevo"
    const { error } = await supabase.from(isDev ? 'contactos_sandbox' : 'contactos').update({ estado_actual: 'Nuevo' }).eq('id', contacto.id);
    if (!error) {
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert({
        contacto_id: contacto.id,
        tipo_accion: 'Reingreso',
        resultado: 'Reactivado por Prospector',
        fecha_creacion: new Date().toISOString()
      });
      toast.success("Prospecto reingresado");
      fetchContactos();
    }
  };


  const handleMassAssign = async () => {
    if (!assignVendedorId || selectedClientes.length === 0) {
      toast.error('Selecciona un vendedor y al menos un cliente.');
      return;
    }
    setLoading(true);
    
    const estadoAsignacion = isReactivacion ? 'CLIENTE REACTIVADO' : 'Asignado';
    
    const { error } = await supabase
      .from(isDev ? 'contactos_sandbox' : 'contactos')
      .update({ vendedor_id: assignVendedorId, estado_actual: estadoAsignacion, prioridad: assignPrioridad })
      .in('id', selectedClientes);
    
    if (!error) {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const tasksToInsert = selectedClientes.map(clientId => ({
        contacto_id: clientId,
        tipo_accion: isReactivacion ? 'Reactivación de Cliente' : 'Primer Contacto',
        completada: false,
        fecha_vencimiento: endOfDay.toISOString()
      }));
      
      await supabase.from(isDev ? 'interacciones_contactos_sandbox' : 'interacciones_contactos').insert(tasksToInsert);
    }

    setLoading(false);
    if (error) {
      toast.error('Error al asignar vendedores.');
    } else {
      toast.success('Vendedor asignado a contactos.');
      setIsAssignModalOpen(false);
      setAssignVendedorId('');
      setAssignPrioridad('Media');
      setIsReactivacion(false);
      setSelectedClientes([]);
      fetchContactos();
    }
  };

  const renderTable = () => {
    if (loadingContactos) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
    
    const filteredContactos = contactos.filter(c => {
      const matchSearch = c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cuit?.includes(searchTerm) || 
                          c.telefono?.includes(searchTerm);
      
      const matchProvincia = filters.provincia ? c.provincia === filters.provincia : true;
      const matchCondicionIva = filters.condicion_iva ? c.condicion_iva === filters.condicion_iva : true;
      const matchUnidadNegocio = filters.unidad_negocio ? c.unidad_negocio === filters.unidad_negocio : true;
      const matchEstado = filters.estado_actual ? c.estado_actual === filters.estado_actual : true;
      const matchVendedor = filters.vendedor_id ? c.vendedor_id === filters.vendedor_id : true;
      const matchEmail = filters.tiene_email === 'si' ? !!c.email : (filters.tiene_email === 'no' ? !c.email : true);
      const matchTelefono = filters.tiene_telefono === 'si' ? !!c.telefono : (filters.tiene_telefono === 'no' ? !c.telefono : true);
      const matchWhatsapp = filters.tiene_whatsapp === 'si' ? c.telefono_whatsapp === true : (filters.tiene_whatsapp === 'no' ? c.telefono_whatsapp === false : true);

      return matchSearch && matchProvincia && matchCondicionIva && matchUnidadNegocio && matchEstado && matchVendedor && matchEmail && matchTelefono && matchWhatsapp;
    });

    const opcionesProvincia = [...new Set(contactos.map(c => c.provincia).filter(Boolean))].sort();
    const opcionesCondicionIva = [...new Set(contactos.map(c => c.condicion_iva).filter(Boolean))].sort();
    const opcionesUnidadNegocio = [...new Set(contactos.map(c => c.unidad_negocio).filter(Boolean))].sort();
    const opcionesEstado = [...new Set(contactos.map(c => c.estado_actual).filter(Boolean))].sort();

    return (
      <div className="flex flex-col gap-4">
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
                  {opcionesProvincia.map(p => <option key={p} value={p}>{p}</option>)}
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
                  {opcionesCondicionIva.map(o => <option key={o} value={o}>{o}</option>)}
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
                  {opcionesUnidadNegocio.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {activeTab === 'todos' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Estado Actual</label>
                <div className="relative">
                  <select 
                    value={filters.estado_actual}
                    onChange={(e) => setFilters({...filters, estado_actual: e.target.value})}
                    className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Todos</option>
                    {opcionesEstado.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Vendedor</label>
              <div className="relative">
                <select 
                  value={filters.vendedor_id}
                  onChange={(e) => setFilters({...filters, vendedor_id: e.target.value})}
                  className="w-full appearance-none bg-white border border-neutral-300 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">Todos</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre_completo || v.email}</option>)}
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
                    provincia: '', condicion_iva: '', unidad_negocio: '', estado_actual: '', vendedor_id: '', tiene_email: '', tiene_telefono: '', tiene_whatsapp: ''
                  })}
                  className="text-sm text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1 transition-colors"
               >
                 <X size={16} /> Limpiar filtros
               </button>
            </div>
          </div>
        )}

        {filteredContactos.length === 0 ? (
          <div className="text-center p-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
            No hay contactos que coincidan.
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-white">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedClientes(e.target.checked ? filteredContactos.map(c => c.id) : [])} 
                      checked={filteredContactos.length > 0 && selectedClientes.length === filteredContactos.length} 
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" 
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Razón Social</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Provincia</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Fecha Ingreso</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredContactos.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedClientes.includes(c.id)} 
                        onChange={(e) => setSelectedClientes(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} 
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" 
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{c.razon_social}</td>
                    <td className="px-4 py-3">{c.telefono || '-'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{c.provincia || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{new Date(c.fecha_creacion).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 flex justify-end gap-2">
                      <button 
                        onClick={() => setViewContact(c)}
                        className="text-neutral-400 hover:text-primary-600 p-1.5 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                      {activeTab === 'perdidos' ? (
                        <button 
                          onClick={() => handleReingresar(c)}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw size={16} /> Reingresar
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedContacto(c)}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                          <PhoneCall size={16} /> Contactar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      {isDev && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 text-warning-800 rounded-lg text-sm font-medium flex items-center justify-center">
          Estás conectado a la base de datos SANDBOX. Cambios aquí no afectan Producción.
        </div>
      )}

      <div className="mb-6 border-b border-neutral-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <Database className="text-primary-500" />
            Administración de Contactos
          </h2>
          <p className="text-neutral-500">Gestiona los ingresos en frío y derívalos al equipo.</p>
        </div>
        
        {/* TABS PRINCIPALES Y SUB-TABS */}
        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('nuevos')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'nuevos' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Sparkles size={16} /> Nuevos
          </button>
          <button 
            onClick={() => setActiveTab('recontactos')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'recontactos' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Clock size={16} /> Recontactos
          </button>
          <button 
            onClick={() => setActiveTab('perdidos')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'perdidos' ? 'bg-white text-danger shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Trash2 size={16} /> Perdidos
          </button>
          
          <div className="w-px bg-neutral-300 mx-1 self-stretch hidden sm:block"></div>
          <div className="w-full sm:hidden h-px bg-neutral-300 my-0.5"></div>

          <button 
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'todos' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Database size={16} /> Base General
          </button>
          
          <button 
            onClick={() => setActiveTab('importar')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'importar' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Upload size={16} /> Importar CSV
          </button>
        </div>
      </div>

      {activeTab === 'importar' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:bg-neutral-100 transition-colors">
              <Upload className="mx-auto text-neutral-400 mb-3" size={32} />
              <h3 className="font-semibold text-neutral-700 mb-1">Cargar Archivo CSV</h3>
              <p className="text-sm text-neutral-500 mb-4">El archivo debe contener la columna "Razón Social".</p>
              <label className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-neutral-50 font-medium inline-flex items-center gap-2">
                <FileText size={18} />
                Seleccionar archivo
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {data.length > 0 && (
              <div className="flex-1 flex flex-col justify-center items-start bg-primary-50/50 p-6 rounded-xl border border-primary-100">
                <h3 className="font-semibold text-primary-900 mb-2">Archivo procesado</h3>
                <p className="text-neutral-700 mb-4">Se han encontrado <strong>{data.length}</strong> filas en el archivo. Verifica la tabla de abajo antes de confirmar.</p>
                <button 
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-primary-500 hover:bg-primary-900 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                  Confirmar Importación Masiva
                </button>
              </div>
            )}
          </div>

          {data.length > 0 && (
            <div className="overflow-x-auto border border-neutral-200 rounded-lg">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fila</th>
                    <th className="px-4 py-3 font-semibold">Razón Social</th>
                    <th className="px-4 py-3 font-semibold">CUIT</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {data.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="px-4 py-2 font-medium">{idx + 1}</td>
                      <td className="px-4 py-2">{row['Razón Social'] || row['Razon Social'] || '-'}</td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">{row['C.U.I.T.'] || row['CUIT'] || '-'}</td>
                      <td className="px-4 py-2 text-xs">{row['Telefono'] || row['Teléfono'] || '-'}</td>
                    </tr>
                  ))}
                  {data.length > 10 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-center text-neutral-500 italic">
                        ... y {data.length - 10} filas más.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-700 flex items-center gap-2">
              <Users size={18} /> 
              {activeTab === 'nuevos' && 'Contactos Recientes'}
              {activeTab === 'recontactos' && 'Pendientes de Rellamada'}
              {activeTab === 'perdidos' && 'Contactos Descartados'}
              {activeTab === 'todos' && 'Base General'}
            </h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">
              {contactos.length} Totales
            </span>
          </div>

          {selectedClientes.length > 0 && (activeTab === 'nuevos' || activeTab === 'todos') && (
            <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl mb-4 flex items-center justify-between">
              <span className="font-semibold text-primary-900">{selectedClientes.length} contactos seleccionados</span>
              <button onClick={() => setIsAssignModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
                Asignar a Vendedor
              </button>
            </div>
          )}
          {renderTable()}
        </div>
      )}

      {selectedContacto && (
        <ResolutionModal
          task={{ leadName: selectedContacto.razon_social }}
          onClose={() => setSelectedContacto(null)}
          onSave={handleSaveResolution}
          onEditLead={() => setViewContact(selectedContacto)}
        />
      )}

      {viewContact && (
        <ContactDetailsModal 
          contacto={viewContact}
          isDev={isDev}
          onClose={() => setViewContact(null)}
          onRefresh={fetchContactos}
          userRole="Prospector"
        />
      )}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg text-neutral-800 mb-2">Asignar Contactos</h3>
              <p className="text-sm text-neutral-600 mb-6">Selecciona a qué vendedor quieres asignar los <strong>{selectedClientes.length}</strong> clientes seleccionados.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Vendedor</label>
                <select
                  value={assignVendedorId}
                  onChange={(e) => setAssignVendedorId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Seleccione vendedor...</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_completo || v.email}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Prioridad Inicial</label>
                <select
                  value={assignPrioridad}
                  onChange={(e) => setAssignPrioridad(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <label className="flex items-center gap-2 mt-4 cursor-pointer p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors">
                <input type="checkbox" checked={isReactivacion} onChange={(e) => setIsReactivacion(e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-800">Cliente Reactivado</span>
                  <span className="text-xs text-neutral-500">Marcar si son clientes de la base histórica</span>
                </div>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-5 py-2.5 text-neutral-600 hover:bg-neutral-200 rounded-lg font-semibold transition-colors">Cancelar</button>
              <button onClick={handleMassAssign} disabled={loading || !assignVendedorId} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50">
                {loading ? 'Asignando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
