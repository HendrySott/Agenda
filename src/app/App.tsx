import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ClientsPage } from './pages/ClientsPage';
import { ConfigPage } from './pages/ConfigPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage } from './pages/AboutPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { AppFooter } from './components/AppFooter';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { VocabularyProvider, useVocabulary } from './context/VocabularyContext';
import { DEFAULT_CONFIG } from './lib/defaultConfig';
import { Employee, Client, Appointment, Config, NotificationResult } from './types';
import * as api from './services/api';

function DashboardAppContent({ config, setConfig }: { config: Config | null; setConfig: (c: Config) => void }) {
  const { user, logout } = useAuth();
  const vocab = useVocabulary();
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState('weekly');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getEmployees(),
      api.getClients(),
      api.getAppointments(),
      api.getConfig(),
    ]).then(([emps, cls, apps, cfg]) => {
      setEmployees(emps);
      setClients(cls);
      setAppointments(apps);
      setConfig(cfg);
    }).catch(error => toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos')).finally(() => setLoading(false));
  }, []);

  // Ejecuta una acción de la API mostrando el error al usuario en vez de dejarlo sin respuesta
  const run = useCallback(async <T,>(action: () => Promise<T>, errorMessage: string): Promise<T | undefined> => {
    try {
      return await action();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : errorMessage);
      return undefined;
    }
  }, []);

  const done = (noun: { one: string; gender: 'm' | 'f' }, action: 'created' | 'updated' | 'deleted') => {
    const f = noun.gender === 'f';
    const word = { created: f ? 'creada' : 'creado', updated: f ? 'actualizada' : 'actualizado', deleted: f ? 'eliminada' : 'eliminado' }[action];
    toast.success(`${noun.one} ${word} correctamente`);
  };

  const handleAddEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    const created = await run(() => api.createEmployee(employee), 'No se pudo crear el registro');
    if (created) {
      setEmployees(prev => [...prev, created]);
      done(vocab.employee, 'created');
    }
    return !!created;
  }, [run, vocab]);

  const handleUpdateEmployee = useCallback(async (employee: Employee) => {
    const updated = await run(() => api.updateEmployee(employee.id, employee), 'No se pudo actualizar el registro');
    if (updated) {
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
      // El servidor mantiene sincronizados nombre y color en las citas
      setAppointments(prev => prev.map(a => a.employeeId === updated.id
        ? { ...a, employeeName: `${updated.name} ${updated.lastName}`.trim(), color: updated.color }
        : a));
      done(vocab.employee, 'updated');
    }
    return !!updated;
  }, [run, vocab]);

  const handleDeleteEmployee = useCallback(async (id: number) => {
    const ok = await run(() => api.deleteEmployee(id), 'No se pudo eliminar el registro');
    if (ok) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      setClients(prev => prev.filter(c => c.employeeId !== id));
      setAppointments(prev => prev.filter(a => a.employeeId !== id));
      done(vocab.employee, 'deleted');
    }
  }, [run, vocab]);

  const handleAddClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const created = await run(() => api.createClient(client), 'No se pudo crear el registro');
    if (created) {
      setClients(prev => [...prev, created]);
      done(vocab.client, 'created');
    }
    return !!created;
  }, [run, vocab]);

  const handleUpdateClient = useCallback(async (client: Client) => {
    const updated = await run(() => api.updateClient(client.id, client), 'No se pudo actualizar el registro');
    if (updated) {
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      setAppointments(prev => prev.map(a => a.clientId === updated.id
        ? { ...a, clientName: `${updated.name} ${updated.lastName}`.trim() }
        : a));
      done(vocab.client, 'updated');
    }
    return !!updated;
  }, [run, vocab]);

  const handleDeleteClient = useCallback(async (id: number) => {
    const ok = await run(() => api.deleteClient(id), 'No se pudo eliminar el registro');
    if (ok) {
      setClients(prev => prev.filter(c => c.id !== id));
      setAppointments(prev => prev.filter(a => a.clientId !== id));
      done(vocab.client, 'deleted');
    }
  }, [run, vocab]);

  const handleAddAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'color'> & {
    sendEmailNotification: boolean;
    sendWhatsappNotification: boolean;
    sendTelegramNotification: boolean;
  }) => {
    const employee = employees.find(e => e.id === appointment.employeeId);
    const created = await run(
      () => api.createAppointment({ ...appointment, color: employee?.color || 'bg-gray-500' }),
      `No se pudo crear ${vocab.the(vocab.appointment)} ${vocab.appointmentLower}`
    );
    if (!created) return false;

    const { notifications = [], ...saved } = created as Appointment & { notifications?: NotificationResult[] };
    setAppointments(prev => [...prev, saved]);
    toast.success(`${vocab.appointment.one} ${vocab.appointment.gender === 'f' ? 'creada' : 'creado'} correctamente`);

    const labels: Record<string, string> = { email: 'Email', whatsapp: 'WhatsApp', telegram: 'Telegram', general: 'Notificación' };
    notifications.forEach((n: NotificationResult) => {
      if (n.status === 'sent') toast.success(`${labels[n.channel]}: ${n.message}`);
      else if (n.status === 'failed') toast.error(`${labels[n.channel]}: ${n.message}`);
      else toast.warning(`${labels[n.channel]}: ${n.message}`);
    });
    return true;
  }, [employees, run, vocab]);

  const handleUpdateAppointment = useCallback(async (appointment: Appointment) => {
    const updated = await run(() => api.updateAppointment(appointment.id, appointment), 'No se pudo actualizar el registro');
    if (updated) {
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      done(vocab.appointment, 'updated');
    }
    return !!updated;
  }, [run, vocab]);

  const handleDeleteAppointment = useCallback(async (id: number) => {
    const ok = await run(() => api.deleteAppointment(id), 'No se pudo eliminar el registro');
    if (ok) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      done(vocab.appointment, 'deleted');
    }
  }, [run, vocab]);

  const refreshClients = useCallback(async () => {
    const fresh = await run(() => api.getClients(), 'No se pudo actualizar la lista');
    if (fresh) setClients(fresh);
  }, [run]);

  const handleUpdateConfig = useCallback(async (newConfig: Config) => {
    const updated = await run(() => api.updateConfig(newConfig), 'No se pudo guardar la configuración');
    if (updated) setConfig(updated);
    return !!updated;
  }, [run]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentWeek={currentWeek}
        setCurrentWeek={setCurrentWeek}
        onAddAppointment={() => setIsAddModalOpen(true)}
        userName={user?.name}
        userAvatar={user?.image ?? undefined}
        companyName={config?.businessInfo?.name || user?.companyName}
        onLogout={logout}
      />

      <div className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={
            <DashboardPage
              employees={employees}
              appointments={appointments}
              clients={clients}
              config={config || DEFAULT_CONFIG}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onAddClient={handleAddClient}
              viewMode={viewMode}
              setViewMode={setViewMode}
              currentWeek={currentWeek}
              setCurrentWeek={setCurrentWeek}
            />
          } />
          <Route path="/employees" element={
            <EmployeesPage
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          } />
          <Route path="/clients" element={
            <ClientsPage
              clients={clients}
              employees={employees}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
            />
          } />
          <Route path="/config" element={
            <ConfigPage
              config={config || DEFAULT_CONFIG}
              onUpdateConfig={handleUpdateConfig}
              onClientsChanged={refreshClients}
            />
          } />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <AppFooter className="border-t border-gray-200 bg-white px-4 py-4" />

      {isDashboard && isAddModalOpen && (
        <AddAppointmentModal
          employees={employees}
          clients={clients}
          isOpen={isAddModalOpen}
          config={config || DEFAULT_CONFIG}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddAppointment}
        />
      )}
    </div>
  );
}

function DashboardApp() {
  const [config, setConfig] = useState<Config | null>(null);
  return (
    <VocabularyProvider typeId={config?.businessInfo?.type}>
      <DashboardAppContent config={config} setConfig={setConfig} />
    </VocabularyProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/landing" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/landing" element={user ? <Navigate to="/" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <DashboardApp />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}
