import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ClientsPage } from './pages/ClientsPage';
import { ConfigPage } from './pages/ConfigPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { Employee, Client, Appointment, Config } from './types';
import * as api from './services/api';

function DashboardApp() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
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
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAddEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    const created = await api.createEmployee(employee);
    setEmployees(prev => [...prev, created]);
  }, []);

  const handleUpdateEmployee = useCallback(async (employee: Employee) => {
    const updated = await api.updateEmployee(employee.id, employee);
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const handleDeleteEmployee = useCallback(async (id: number) => {
    await api.deleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    setClients(prev => prev.filter(c => c.employeeId !== id));
    setAppointments(prev => prev.filter(a => a.employeeId !== id));
  }, []);

  const handleAddClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const created = await api.createClient(client);
    setClients(prev => [...prev, created]);
  }, []);

  const handleUpdateClient = useCallback(async (client: Client) => {
    const updated = await api.updateClient(client.id, client);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  const handleDeleteClient = useCallback(async (id: number) => {
    await api.deleteClient(id);
    setClients(prev => prev.filter(c => c.id !== id));
    setAppointments(prev => prev.filter(a => a.clientId !== id));
  }, []);

  const handleAddAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'color'>) => {
    const employee = employees.find(e => e.id === appointment.employeeId);
    const created = await api.createAppointment({
      ...appointment,
      color: employee?.color || 'bg-gray-500',
    });
    setAppointments(prev => [...prev, created]);
  }, [employees]);

  const handleUpdateAppointment = useCallback(async (appointment: Appointment) => {
    const updated = await api.updateAppointment(appointment.id, appointment);
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const handleDeleteAppointment = useCallback(async (id: number) => {
    await api.deleteAppointment(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleUpdateConfig = useCallback(async (newConfig: Config) => {
    const updated = await api.updateConfig(newConfig);
    setConfig(updated);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentWeek={currentWeek}
        setCurrentWeek={setCurrentWeek}
        onAddAppointment={() => setIsAddModalOpen(true)}
        userName={user?.name}
        onLogout={logout}
      />

      <div className="h-[calc(100vh-8.5rem)]">
        <Routes>
          <Route path="/" element={
            <DashboardPage
              employees={employees}
              appointments={appointments}
              clients={clients}
              config={config || {
                notificationEmail: '',
                emailTemplates: [],
                businessInfo: { name: '', address: '', businessHours: '', rnc: '' },
                calendarSync: { googleConnected: false, outlookConnected: false },
              }}
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
              config={config || {
                notificationEmail: '',
                emailTemplates: [],
                businessInfo: { name: '', address: '', businessHours: '', rnc: '' },
                calendarSync: { googleConnected: false, outlookConnected: false },
              }}
              onUpdateConfig={handleUpdateConfig}
            />
          } />
        </Routes>
      </div>

      {isDashboard && isAddModalOpen && (
        <AddAppointmentModal
          employees={employees}
          clients={clients}
          isOpen={isAddModalOpen}
          config={config || {
            notificationEmail: '',
            emailTemplates: [],
            businessInfo: { name: '', address: '', businessHours: '', rnc: '' },
            calendarSync: { googleConnected: false, outlookConnected: false },
          }}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddAppointment}
        />
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
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
      </AuthProvider>
    </BrowserRouter>
  );
}
