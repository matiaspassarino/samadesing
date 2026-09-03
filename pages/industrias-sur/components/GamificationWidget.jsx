import React, { useEffect, useState } from 'react';
import { getPuntos } from '../lib/gamificacion';
import { Trophy, Star, TrendingUp, Medal } from 'lucide-react';

export default function GamificationWidget({ session, isDev, refreshTrigger }) {
  const [stats, setStats] = useState({ hoy: 0, mes: 0, total: 0, insignias: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      getPuntos(session.user.id, isDev).then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [session, isDev, refreshTrigger]);

  if (loading) return <div className="h-20 animate-pulse bg-white rounded-xl mb-6"></div>;

  return (
    <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl shadow-md p-4 text-white mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
          <Trophy size={28} className="text-yellow-300" />
        </div>
        <div>
          <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider">Tus Puntos</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold font-heading">{stats.hoy} <span className="text-base font-normal text-primary-200">hoy</span></h3>
            <span className="text-xl font-medium text-primary-100 mb-1 border-l border-primary-400/50 pl-3">
              {stats.mes} <span className="text-sm font-normal text-primary-200">este mes</span>
            </span>
          </div>
        </div>
      </div>
      
      {stats.insignias.length > 0 && (
        <div className="flex flex-col sm:items-end">
          <p className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-2">Tus Insignias</p>
          <div className="flex gap-2">
            {stats.insignias.map(logro => (
              <div key={logro.id} title={logro.nombre} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20 shadow-sm cursor-help relative group">
                <span className="text-xl">{logro.icono}</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {logro.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
