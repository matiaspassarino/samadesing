import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getTable } from '../lib/db';
import { Loader2, TrendingUp, Users, Target, Clock, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function GerenteView({ isDev }) {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', '30days'
  
  const [rawData, setRawData] = useState({
    contactos: [],
    interacciones: [],
    perfiles: []
  });

  const fetchData = async () => {
    setLoading(true);

    // REAL DB FETCH
    try {
      const [contRes, intRes, perfRes] = await Promise.all([
        supabase.from(getTable('contactos', isDev)).select('id, estado_actual, unidad_negocio, provincia, vendedor_id, fecha_creacion'),
        supabase.from(getTable('interacciones_contactos', isDev)).select('id, contacto_id, completada, fecha_creacion, fecha_vencimiento'),
        supabase.from('perfiles').select('id, nombre_completo, rol')
      ]);

      setRawData({
        contactos: contRes.data || [],
        interacciones: intRes.data || [],
        perfiles: perfRes.data || []
      });
    } catch (e) {
      // Manejado silenciosamente o enviar a logger
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDev]);

  // CALCULO DE METRICAS
  const metrics = useMemo(() => {
    let { contactos, interacciones, perfiles } = rawData;

    // Filter by date
    if (timeFilter !== 'all') {
      const now = new Date();
      let limitDate = new Date();
      if (timeFilter === '30days') limitDate.setDate(now.getDate() - 30);
      if (timeFilter === 'month') limitDate = new Date(now.getFullYear(), now.getMonth(), 1);
      
      contactos = contactos.filter(c => new Date(c.fecha_creacion) >= limitDate);
      interacciones = interacciones.filter(i => new Date(i.fecha_creacion) >= limitDate);
    }

    // 1. KPIs Globales
    const totalLeads = contactos.length;
    const leadsVenta = contactos.filter(c => c.estado_actual === 'Venta' || c.estado_actual === 'Recompra').length;
    const conversionRate = totalLeads ? ((leadsVenta / totalLeads) * 100).toFixed(1) : 0;
    const leadsEnProceso = contactos.filter(c => ['Rellamar', 'Diferido', 'Cotizado', 'Asignado'].includes(c.estado_actual)).length;
    
    const now = new Date();
    const tareasVencidas = interacciones.filter(i => !i.completada && new Date(i.fecha_vencimiento) < now).length;

    // 2. Funnel Data
    const funnel = {
      'Ingresados': totalLeads,
      'Prospector (Filtro)': contactos.filter(c => c.estado_actual === 'Nuevo').length,
      'En Proceso (Vendedor)': leadsEnProceso,
      'Ganados (Venta/Recompra)': leadsVenta,
      'Perdidos': contactos.filter(c => c.estado_actual === 'Descartado').length
    };

    // 3. Rendimiento por Vendedor
    const vendedores = perfiles.filter(p => p.rol === 'Vendedor');
    const performanceVendedores = vendedores.map(v => {
      const assigned = contactos.filter(c => c.vendedor_id === v.id);
      const wins = assigned.filter(c => c.estado_actual === 'Venta' || c.estado_actual === 'Recompra').length;
      
      const assignedContactIds = new Set(assigned.map(c => c.id));
      const interactions = interacciones.filter(i => assignedContactIds.has(i.contacto_id) && i.completada).length;

      return {
        nombre: v.nombre_completo,
        ventas: wins,
        interacciones: interactions
      };
    }).sort((a, b) => b.ventas - a.ventas);

    // 4. UEN y Provincias
    const uenCount = {};
    const provCount = {};
    contactos.forEach(c => {
      if (c.unidad_negocio) {
        c.unidad_negocio.split(',').map(s => s.trim()).forEach(u => {
          if (u) uenCount[u] = (uenCount[u] || 0) + 1;
        });
      }
      if (c.provincia) {
        provCount[c.provincia] = (provCount[c.provincia] || 0) + 1;
      }
    });

    return {
      totalLeads, leadsVenta, conversionRate, leadsEnProceso, tareasVencidas,
      funnel, performanceVendedores, uenCount, provCount
    };
  }, [rawData, timeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  // CONFIGURACIÓN DE GRÁFICOS
  const funnelChartData = {
    labels: Object.keys(metrics.funnel),
    datasets: [{
      label: 'Cantidad de Leads',
      data: Object.values(metrics.funnel),
      backgroundColor: ['#e5e5e5', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
      borderRadius: 6
    }]
  };

  const sellerChartData = {
    labels: metrics.performanceVendedores.map(v => v.nombre),
    datasets: [
      {
        label: 'Ventas Cerradas',
        data: metrics.performanceVendedores.map(v => v.ventas),
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Interacciones Realizadas',
        data: metrics.performanceVendedores.map(v => v.interacciones),
        backgroundColor: '#94a3b8',
        borderRadius: 4
      }
    ]
  };

  const uenChartData = {
    labels: Object.keys(metrics.uenCount),
    datasets: [{
      data: Object.values(metrics.uenCount),
      backgroundColor: ['#0f172a', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {isDev && (
        <div className="p-3 bg-warning/10 border border-warning/20 text-warning-800 rounded-lg text-sm font-medium flex items-center justify-center">
          Estás conectado a la base de datos SANDBOX. Cambios aquí no afectan Producción.
        </div>
      )}

      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
        <div>
          <h2 className="font-heading font-bold text-2xl text-neutral-800 flex items-center gap-2">
            <TrendingUp className="text-primary-500" />
            Dashboard Gerencial
          </h2>
          <p className="text-sm text-neutral-500">Métricas de rendimiento y conversión globales.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
          <Calendar size={16} className="text-neutral-400 ml-2" />
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-neutral-700 py-1.5 pr-8 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="all">Histórico Completo</option>
            <option value="30days">Últimos 30 días</option>
            <option value="month">Mes Actual</option>
          </select>
        </div>
      </div>

      {/* KPIs ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-neutral-500">Total Leads</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
          </div>
          <div>
            <p className="text-3xl font-bold text-neutral-800">{metrics.totalLeads}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-neutral-500">Conversión (Ventas)</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Target size={18} /></div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-neutral-800">{metrics.leadsVenta}</p>
            <span className="text-sm font-bold text-green-600 mb-1">({metrics.conversionRate}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-neutral-500">En Gestión (Vendedores)</h3>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><TrendingUp size={18} /></div>
          </div>
          <div>
            <p className="text-3xl font-bold text-neutral-800">{metrics.leadsEnProceso}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-neutral-500">Tareas Vencidas</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Clock size={18} /></div>
          </div>
          <div>
            <p className="text-3xl font-bold text-neutral-800">{metrics.tareasVencidas}</p>
            {metrics.tareasVencidas > 0 && <p className="text-xs text-red-500 font-medium mt-1">Requiere atención</p>}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="font-bold text-neutral-800 mb-6">Embudo de Ventas (Funnel)</h3>
          <div className="h-72">
            <Bar 
              data={funnelChartData} 
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
            />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="font-bold text-neutral-800 mb-6">Rendimiento por Vendedor</h3>
          <div className="h-72">
            <Bar 
              data={sellerChartData} 
              options={{ maintainAspectRatio: false }} 
            />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 md:col-span-1">
          <h3 className="font-bold text-neutral-800 mb-6">Unidades de Negocio</h3>
          <div className="h-48 flex justify-center">
             {Object.keys(metrics.uenCount).length > 0 ? (
                <Doughnut 
                  data={uenChartData} 
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} 
                />
             ) : (
                <p className="text-neutral-400 text-sm italic self-center">Sin datos</p>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 md:col-span-2">
          <h3 className="font-bold text-neutral-800 mb-6">Top Provincias</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="border-b border-neutral-200">
                <tr>
                  <th className="pb-3 font-semibold">Provincia</th>
                  <th className="pb-3 font-semibold text-right">Cantidad</th>
                  <th className="pb-3 font-semibold text-right hidden sm:table-cell">% del Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {Object.entries(metrics.provCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([prov, count]) => (
                  <tr key={prov}>
                    <td className="py-3 font-medium text-neutral-800">{prov}</td>
                    <td className="py-3 text-right">{count}</td>
                    <td className="py-3 text-right hidden sm:table-cell">
                      {((count / metrics.totalLeads) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
