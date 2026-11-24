import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, UserCircle, Settings, LogOut, User, ChevronDown, Info } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVocabulary } from '../context/VocabularyContext';

interface HeaderProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  currentWeek: Date;
  setCurrentWeek: (date: Date) => void;
  onAddAppointment: () => void;
  userName?: string;
  userAvatar?: string;
  companyName?: string;
  onLogout?: () => void;
}

export function Header({
  viewMode,
  setViewMode,
  currentWeek,
  setCurrentWeek,
  onAddAppointment,
  userName,
  userAvatar,
  companyName,
  onLogout,
}: HeaderProps) {
  const vocab = useVocabulary();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * (viewMode === 'daily' ? 1 : 7)));
    setCurrentWeek(newDate);
  };

  const formatRange = (date: Date) => {
    if (viewMode === 'daily') {
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    }
    return formatWeekRange(date);
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
    { path: '/employees', label: vocab.employee.many, icon: Users },
    { path: '/clients', label: vocab.client.many, icon: UserCircle },
    { path: '/config', label: 'Configuración', icon: Settings },
    { path: '/about', label: 'Acerca de', icon: Info }
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="border-b border-gray-200 bg-slate-50 px-4 py-2 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <p className="font-medium">{companyName || 'Mi negocio'}</p>
          </div>
          
            {userName && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex max-w-[12rem] items-center space-x-2 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:max-w-none"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={`${userName} avatar`}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="truncate">{userName}</span>
                  <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/account'); setMenuOpen(false); }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Administrar cuenta
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => { onLogout?.(); setMenuOpen(false); }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      {isDashboard && (
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-6">

            {isDashboard && (
              <h1 className="text-xl text-gray-900 sm:text-2xl">
                {viewMode === 'daily' ? 'Horario Diario' : 'Horario Semanal'}
              </h1>
            )}

              

            {isDashboard && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={viewMode === 'daily' ? 'Día anterior' : 'Semana anterior'}
                  onClick={() => navigateWeek(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="min-w-0 flex-1 text-center text-sm text-gray-600 sm:min-w-[200px]">
                  {formatRange(currentWeek)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  aria-label={viewMode === 'daily' ? 'Día siguiente' : 'Semana siguiente'}
                  onClick={() => navigateWeek(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
            {isDashboard && (
              <div className="flex rounded-lg bg-gray-100 p-1">
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
                <span className="hidden sm:inline">Agregar {vocab.new(vocab.appointment)} {vocab.appointment.one}</span>
                <span className="sm:hidden">{vocab.appointment.one}</span>
              </Button>
            )}

           

          </div>
        </div>
      </div>
      )}

      <div className="border-t border-gray-200 px-2 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center space-x-2 border-b-2 px-3 py-3 transition-colors sm:px-4 ${
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
