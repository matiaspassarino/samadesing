import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Upload, Database, Loader2, FileText, PhoneCall, RefreshCw, Sparkles, Clock, Trash2, Users } from 'lucide-react';
import ContactDetailsModal from '../components/ContactDetailsModal';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('nuevos'); // 'nuevos', 'recontactos', 'perdidos', 'importar'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para la gestión de contactos
  const [contactos, setContactos] = useState([]);
  const [loadingContactos, setLoadingContactos] = useState(true);
  const [selectedContacto, setSelectedContacto] = useState(null);

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
    const validContactos = data.map(row => ({
      codigo: row['Código'] || null,
      razon_social: row['Razón Social'] || row['Razon Social'] || 'Empresa Desconocida',
      cuit: row['C.U.I.T.'] || row['CUIT'] || null,
      telefono: row['Telefono'] || row['Teléfono'] || null,
      fecha_alta: row['Fecha Alta'] || null,
      provincia: row['Provincia'] || null,
      domicilio: row['Domicilio'] || null,
      condicion_iva: row['Condicion IVA'] || null,
      unidad_negocio: row['UNIDADE DE NEGOCIO'] || row['Unidad de Negocio'] || null,
      estado_actual: 'Nuevo'
    })).filter(c => c.razon_social !== 'Empresa Desconocida' && c.razon_social !== '');

    if (validContactos.length === 0) {
      alert("No se encontraron contactos válidos en el CSV.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('contactos').insert(validContactos);
    
    if (error) {
      alert("Error al importar: " + error.message);
    } else {
      alert(`¡${validContactos.length} contactos importados con éxito!`);
      setData([]);
      setActiveTab('nuevos');
    }
    setLoading(false);
  };

  // --- LÓGICA DE GESTIÓN DE CONTACTOS ---
  const fetchContactos = async () => {
    setLoadingContactos(true);
    let estadoQuery = [];
    if (activeTab === 'nuevos') estadoQuery = ['Nuevo'];
    else if (activeTab === 'recontactos') estadoQuery = ['Admin_Rellamar'];
    else if (activeTab === 'perdidos') estadoQuery = ['Descartado'];

    if (estadoQuery.length > 0) {
      const { data: contactosData, error } = await supabase
        .from('contactos')
        .select('*')
        .in('estado_actual', estadoQuery)
        .order('fecha_creacion', { ascending: false });

      if (!error && contactosData) {
        setContactos(contactosData);
      }
    }
    setLoadingContactos(false);
  };

  useEffect(() => {
    if (activeTab !== 'importar') {
      fetchContactos();
    }
  }, [activeTab]);

  const handleReingresar = async (contacto) => {
    const { error } = await supabase.from('contactos').update({ estado_actual: 'Nuevo' }).eq('id', contacto.id);
    if (!error) {
      await supabase.from('interacciones_contactos').insert({
        contacto_id: contacto.id,
        tipo_accion: 'Reingreso al Circuito',
        resultado: 'Reingresado',
        notas: 'Contacto devuelto a la bandeja de Nuevos por el Administrador.',
        completada: true
      });
      fetchContactos();
    }
  };

  const renderTable = () => {
    if (loadingContactos) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
    
    if (contactos.length === 0) {
      return (
        <div className="text-center p-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
          No hay contactos en esta vista.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-white">
        <table className="w-full text-left text-sm text-neutral-600">
          <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Razón Social</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Provincia</th>
              <th className="px-4 py-3 font-semibold">Fecha Ingreso</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {contactos.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-800">{c.razon_social}</td>
                <td className="px-4 py-3">{c.telefono || '-'}</td>
                <td className="px-4 py-3">{c.provincia || '-'}</td>
                <td className="px-4 py-3">{new Date(c.fecha_creacion).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 flex justify-end gap-2">
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
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      <div className="mb-6 border-b border-neutral-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <Database className="text-primary-500" />
            Administración de Contactos
          </h2>
          <p className="text-neutral-500">Gestiona los ingresos en frío y derívalos al equipo.</p>
        </div>
        
        {/* TABS PRINCIPALES Y SUB-TABS */}
        <div className="flex bg-neutral-100 p-1 rounded-lg gap-1 overflow-x-auto max-w-full">
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
          
          <div className="w-px bg-neutral-300 mx-1"></div>

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
            </h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">
              {contactos.length} Totales
            </span>
          </div>

          {renderTable()}
        </div>
      )}

      {selectedContacto && (
        <ContactDetailsModal 
          contacto={selectedContacto} 
          onClose={() => setSelectedContacto(null)} 
          onRefresh={fetchContactos} 
        />
      )}
    </div>
  );
}
