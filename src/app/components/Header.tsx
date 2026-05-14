import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, UserCircle, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  currentWeek: Date;
  setCurrentWeek: (date: Date) => void;
  onAddAppointment: () => void;
  userName?: string;
  onLogout?: () => void;
}

export function Header({
  viewMode,
  setViewMode,
  currentWeek,
  setCurrentWeek,
  onAddAppointment,
  userName,
  onLogout,
}: HeaderProps) {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };

    return `${startOfWeek.toLocaleDateString('es-ES', options)} - ${endOfWeek.toLocaleDateString('es-ES', options)}, ${endOfWeek.getFullYear()}`;
  };

  const navItems = [
    { path: '/', label: 'Calendario', icon: Calendar },
    { path: '/employees', label: 'Empleados', icon: Users },
    { path: '/clients', label: 'Clientes', icon: UserCircle },
    { path: '/config', label: 'Configuración', icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl text-gray-900">Horario Semanal</h1>

            {isDashboard && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600 min-w-[200px] text-center">
                  {formatWeekRange(currentWeek)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isDashboard && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                  className="text-sm"
                >
                  Semanal
                </Button>
                <Button
                  variant={viewMode === 'daily' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('daily')}
                  className="text-sm"
                >
                  Diario
                </Button>
              </div>
            )}

            {isDashboard && (
              <Button
                onClick={onAddAppointment}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nueva Cita
              </Button>
            )}

            {userName && (
              <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
                <span className="text-sm text-gray-600">{userName}</span>
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-500 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 border-t border-gray-200">
        <nav className="flex space-x-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
