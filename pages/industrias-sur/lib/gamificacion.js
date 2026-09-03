import { supabase } from './supabase';
import { getTable } from './db';

import { toast } from 'react-hot-toast';

// Reglas de puntos
export const PUNTOS = {
  venta: 50,
  recompra: 50,
  presupuesto: 10,
  catalogo_fisico: 10,
  catalogo_digital: 2,
  exit: 3, // Contacto Exitoso
  rellamar: 3,
  diferido: 3,
  tarea_general: 5
};

export const LOGROS = [
  { id: 'FIRST_SALE', nombre: 'Primera Venta', icono: '🏆', condicion: (stats) => stats.ventas >= 1 },
  { id: 'CLOSER_10', nombre: 'Closer', icono: '🔥', condicion: (stats) => stats.ventas >= 10 },
  { id: 'PERSISTENCE', nombre: 'Persistente', icono: '💪', condicion: (stats) => stats.llamadas >= 50 },
  { id: 'CENTURION', nombre: 'Centurión', icono: '💯', condicion: (stats) => stats.puntos >= 100 }
];

export async function addPuntos(vendedor_id, accion, referencia_id, isDev) {
  if (!vendedor_id) return;
  const puntos = PUNTOS[accion] || 0;
  if (puntos === 0) return;

  const tableName = getTable('gamificacion_puntos', isDev);
  
  const { error } = await supabase.from(tableName).insert({
    vendedor_id,
    puntos,
    motivo: accion,
    referencia_id: referencia_id || null
  });
  
  if (error) {
    console.error('Error sumando puntos:', error);
    toast.error('Gamificación Error: ' + error.message);
  }
}

export async function getPuntos(vendedor_id, isDev) {
  const tableName = getTable('gamificacion_puntos', isDev);
  
  // Hoy
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  
  // Mes
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  const { data, error } = await supabase.from(tableName)
    .select('puntos, motivo, fecha_creacion')
    .eq('vendedor_id', vendedor_id);
    
  if (error || !data) return { hoy: 0, mes: 0, total: 0, insignias: [] };

  let hoy = 0;
  let mes = 0;
  let total = 0;
  let ventas = 0;
  let llamadas = 0;

  data.forEach(d => {
    total += d.puntos;
    const date = new Date(d.fecha_creacion);
    if (date >= startOfDay) hoy += d.puntos;
    if (date >= startOfMonth) mes += d.puntos;
    
    if (d.motivo === 'venta' || d.motivo === 'recompra') ventas++;
    if (['exit', 'rellamar', 'diferido'].includes(d.motivo)) llamadas++;
  });

  const stats = { puntos: total, ventas, llamadas };
  
  // Verificar insignias ganadas localmente
  const insignias = LOGROS.filter(l => l.condicion(stats));

  return { hoy, mes, total, insignias };
}
