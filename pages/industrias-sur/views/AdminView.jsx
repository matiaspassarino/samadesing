import React, { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Upload, Database, Loader2, FileText } from 'lucide-react';

export default function AdminView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
    // Asumimos que el CSV puede tener columnas llamadas nombre_empresa, empresa, o nombre
    const validLeads = data.map(row => ({
      nombre_empresa: row.nombre_empresa || row.empresa || row.nombre || 'Empresa Desconocida',
      cuit: row.cuit || null,
      estado_actual: 'Nuevo'
    })).filter(lead => lead.nombre_empresa !== 'Empresa Desconocida');

    if (validLeads.length === 0) {
      alert("No se encontraron leads válidos en el CSV. Asegúrate de tener una columna 'nombre_empresa'.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('leads').insert(validLeads);
    
    if (error) {
      alert("Error al importar: " + error.message);
    } else {
      alert(`¡${validLeads.length} leads importados con éxito a la bandeja de entrada global!`);
      setData([]); // Limpiar tras importar
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
          <Database className="text-primary-500" />
          Administración de Datos
        </h2>
        <p className="text-neutral-500">Importa leads masivamente desde un archivo CSV.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:bg-neutral-100 transition-colors">
          <Upload className="mx-auto text-neutral-400 mb-3" size={32} />
          <h3 className="font-semibold text-neutral-700 mb-1">Cargar Archivo CSV</h3>
          <p className="text-sm text-neutral-500 mb-4">El archivo debe contener al menos una columna llamada "nombre_empresa".</p>
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
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">CUIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2">{row.nombre_empresa || row.empresa || row.nombre || '-'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-neutral-500">{row.cuit || '-'}</td>
                </tr>
              ))}
              {data.length > 10 && (
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-center text-neutral-500 italic">
                    ... y {data.length - 10} filas más.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
