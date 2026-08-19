import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Upload, Database, Loader2, FileText, Users, PhoneCall, Filter } from 'lucide-react';
import AdminContactModal from '../components/AdminContactModal';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('gestionar');
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
    // Mapeamos a las columnas de la BD 'contactos'
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
      alert("No se encontraron contactos válidos en el CSV. Asegúrate de tener la columna 'Razón Social'.");
      setLoading(false);
      return;
    }

    // Para evitar cargar de a uno, enviamos todo el array
    const { error } = await supabase.from('contactos').insert(validContactos);
    
    if (error) {
      alert("Error al importar: " + error.message);
    } else {
      alert(`¡${validContactos.length} contactos importados con éxito!`);
      setData([]);
      fetchContactos(); // Actualizar lista
      setActiveTab('gestionar');
    }
    setLoading(false);
  };

  // --- LÓGICA DE GESTIÓN DE CONTACTOS ---
  const fetchContactos = async () => {
    setLoadingContactos(true);
    const { data: contactosData, error } = await supabase
      .from('contactos')
      .select('*')
      .in('estado_actual', ['Nuevo', 'Admin_Rellamar'])
      .order('fecha_actualizacion', { ascending: false });

    if (!error && contactosData) {
      setContactos(contactosData);
    }
    setLoadingContactos(false);
  };

  useEffect(() => {
    if (activeTab === 'gestionar') {
      fetchContactos();
    }
  }, [activeTab]);

  const handleSaveInteraction = async (interactionData) => {
    const { contacto_id, resultado, comentarios } = interactionData;
    
    let nuevoEstado = 'Nuevo';
    
    if (resultado === 'exitoso') {
      nuevoEstado = 'Supervisor'; // Pasa al supervisor para asignar
    } else if (resultado === 'rellamar') {
      nuevoEstado = 'Admin_Rellamar'; // Se queda en el admin para reintento
    } else if (resultado === 'descartar') {
      nuevoEstado = 'Descartado'; // Va al archivo muerto
    }

    // 1. Guardar interaccion
    await supabase.from('interacciones_contactos').insert({
      contacto_id,
      tipo_accion: 'Llamada Admin',
      resultado,
      notas: comentarios,
      completada: true
    });

    // 2. Actualizar contacto
    await supabase.from('contactos').update({ estado_actual: nuevoEstado }).eq('id', contacto_id);

    setSelectedContacto(null);
    fetchContactos();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      <div className="mb-6 border-b border-neutral-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <Database className="text-primary-500" />
            Administración de Datos
          </h2>
          <p className="text-neutral-500">Importa contactos o realiza el primer contacto.</p>
        </div>
        
        {/* TABS */}
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('gestionar')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'gestionar' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <PhoneCall size={16} /> Gestionar
          </button>
          <button 
            onClick={() => setActiveTab('importar')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'importar' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Upload size={16} /> Importar CSV
          </button>
        </div>
      </div>

      {activeTab === 'importar' && (
        <div>
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
      )}

      {activeTab === 'gestionar' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-700 flex items-center gap-2">
              <Users size={18} /> Contactos Pendientes
            </h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">
              {contactos.length} Totales
            </span>
          </div>

          {loadingContactos ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
          ) : contactos.length === 0 ? (
            <div className="text-center p-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
              No hay contactos nuevos pendientes de llamar.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-lg">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50 text-neutral-800 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Razón Social</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Provincia</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {contactos.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{c.razon_social}</td>
                      <td className="px-4 py-3">{c.telefono || '-'}</td>
                      <td className="px-4 py-3">{c.provincia || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          c.estado_actual === 'Admin_Rellamar' ? 'bg-warning-100 text-warning-800' : 'bg-success-100 text-success-800'
                        }`}>
                          {c.estado_actual === 'Admin_Rellamar' ? 'Reintento' : 'Nuevo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setSelectedContacto(c)}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 ml-auto transition-colors"
                        >
                          <PhoneCall size={16} /> Contactar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedContacto && (
        <AdminContactModal 
          contacto={selectedContacto} 
          onClose={() => setSelectedContacto(null)} 
          onSave={handleSaveInteraction} 
        />
      )}
    </div>
  );
}
