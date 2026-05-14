import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">Weekly Schedule Dashboard</h1>
        <p className="text-xl text-blue-100 mb-8">
          La plataforma de gestión de horarios para tu negocio. Organiza citas, empleados y clientes en un solo lugar.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 text-lg rounded-xl"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg rounded-xl"
          >
            Registrarse
          </Button>
        </div>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="font-semibold mb-2">Gestión de Horarios</h3>
          <p className="text-blue-100 text-sm">Visualiza y administra las citas de tu negocio de forma semanal o diaria.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-semibold mb-2">Empleados y Clientes</h3>
          <p className="text-blue-100 text-sm">Administra tu equipo y tus clientes con facilidad.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">🔔</div>
          <h3 className="font-semibold mb-2">Recordatorios</h3>
          <p className="text-blue-100 text-sm">Configura plantillas de correo para recordar a tus clientes sus citas.</p>
        </div>
      </div>
    </div>
  );
}
