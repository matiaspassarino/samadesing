import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import AdminView from './views/AdminView';
import ProspectorView from './views/ProspectorView';
import SupervisorView from './views/SupervisorView';
import VendedorView from './views/VendedorView';
import DevView from './views/DevView';
import GerenteView from './views/GerenteView';
import DevToolbar from './components/DevToolbar';
import { Loader2, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // Rol REAL en DB
  const [simulatedRole, setSimulatedRole] = useState(null); // Rol a renderizar (Impersonación)
  const [loading, setLoading] = useState(true);

  // Leer rol directo desde nuestra tabla perfiles, evitando depender de la metadata inyectada.
  const loadRoleFromDB = async (uid) => {
    const { data, error } = await supabase.from('perfiles').select('rol').eq('id', uid).single();
    if (!error && data) {
      setUserRole(data.rol);
      setSimulatedRole(data.rol);
    } else {
      // Fallback a Vendedor por defecto si falla la lectura (aunque por trigger debería existir siempre)
      setUserRole('Vendedor');
      setSimulatedRole('Vendedor');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await loadRoleFromDB(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        await loadRoleFromDB(session.user.id);
        setLoading(false);
      } else {
        setUserRole(null);
        setSimulatedRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-primary-500">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800 flex flex-col">
      {/* Dev Impersonation Toolbar */}
      {userRole === 'Dev' && (
        <DevToolbar simulatedRole={simulatedRole} setSimulatedRole={setSimulatedRole} />
      )}

      {/* Header Global */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading font-bold text-lg text-neutral-800">Industrias Sur CRM</h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5 flex items-center flex-wrap gap-x-1 gap-y-0.5">
              <span className="truncate max-w-[160px] sm:max-w-none">{session.user.email}</span>
              <span className={`px-2 py-0.5 rounded font-bold shrink-0 ${
                simulatedRole === 'Dev' ? 'bg-neutral-900 text-white' : 'bg-primary-50 text-primary-900'
              }`}>
                {simulatedRole}
              </span>
              {userRole === 'Dev' && simulatedRole !== 'Dev' && (
                <span className="text-danger opacity-80 shrink-0">(Impersonando)</span>
              )}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-danger font-medium transition-colors bg-neutral-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-danger/20 shrink-0"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Renderizado condicional basado en el SIMULATED ROLE */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {simulatedRole === 'Dev' && <DevView />}
        {simulatedRole === 'Administrador' && <AdminView isDev={userRole === 'Dev'} />}
        {simulatedRole === 'Prospector' && <ProspectorView isDev={userRole === 'Dev'} />}
        {simulatedRole === 'Supervisor' && <SupervisorView isDev={userRole === 'Dev'} />}
        {simulatedRole === 'Vendedor' && <VendedorView session={session} isDev={userRole === 'Dev'} />}
        {simulatedRole === 'Gerente' && <GerenteView isDev={userRole === 'Dev'} />}
        
        {/* Fallback */}
        {!['Dev', 'Administrador', 'Prospector', 'Supervisor', 'Vendedor', 'Gerente'].includes(simulatedRole) && (
          <div className="p-8 text-center text-danger bg-danger/10 rounded-xl font-medium border border-danger/20">
            Rol no reconocido. Contacta a soporte.
          </div>
        )}
      </main>
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium rounded-xl border border-neutral-200' }} />
    </div>
  );
}
