import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import AdminView from './views/AdminView';
import SupervisorView from './views/SupervisorView';
import VendedorView from './views/VendedorView';
import { Loader2, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.rol || 'Vendedor');
      setLoading(false);
    });

    // Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.rol || 'Vendedor');
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
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      {/* Header Global */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-lg text-neutral-800">Industrias Sur CRM</h1>
            <p className="text-xs text-neutral-500 font-medium">Conectado como: {session.user.email} <span className="bg-primary-50 text-primary-900 px-2 py-0.5 rounded ml-1">{userRole}</span></p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-danger transition-colors"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Renderizado condicional por Rol */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {userRole === 'Administrador' && <AdminView />}
        {userRole === 'Supervisor' && <SupervisorView />}
        {userRole === 'Vendedor' && <VendedorView session={session} />}
        {/* Fallback si el rol no coincide */}
        {!['Administrador', 'Supervisor', 'Vendedor'].includes(userRole) && (
          <div className="p-8 text-center text-danger bg-danger/10 rounded-xl">
            Rol no reconocido. Contacta a soporte.
          </div>
        )}
      </div>
    </div>
  );
}
