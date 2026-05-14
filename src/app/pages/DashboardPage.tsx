import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CalendarGrid } from '../components/CalendarGrid';
import { AppointmentModal } from '../components/AppointmentModal';
import { AddAppointmentModal } from '../components/AddAppointmentModal';
import { AddClientModal } from '../components/AddClientModal';
import { Employee, Appointment, Client, Config } from '../types';

interface DashboardPageProps {
  employees: Employee[];
  appointments: Appointment[];
  clients: Client[];
  config: Config;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'color'>) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: number) => void;
  onAddClient: (client: Omit<Client, 'id'>) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  currentWeek: Date;
  setCurrentWeek: (date: Date) => void;
}

export function DashboardPage({
  employees,
  appointments,
  clients,
  config,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onAddClient,
  viewMode,
  setViewMode,
  currentWeek,
  setCurrentWeek
}: DashboardPageProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | 'all'>('all');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentModalOpen(true);
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.name} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = selectedEmployee === 'all'
    ? clients
    : clients.filter(client => client.employeeId === selectedEmployee);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedEmployee === 'all') {
      return matchesSearch;
    }

    return matchesSearch && appointment.employeeId === selectedEmployee;
  });

  const handleAddClientSubmit = (client: Omit<Client, 'id' | 'employeeId'>) => {
    if (selectedEmployee !== 'all') {
      onAddClient({ ...client, employeeId: selectedEmployee as number });
      setIsAddClientModalOpen(false);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar
        employees={filteredEmployees}
        clients={filteredClients}
        appointments={appointments}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        onAddClient={() => setIsAddClientModalOpen(true)}
        showAddClientButton={selectedEmployee !== 'all'}
      />

      <div className="flex-1 p-6">
        <CalendarGrid
          appointments={filteredAppointments}
          viewMode={viewMode}
          currentWeek={currentWeek}
          onAppointmentClick={handleAppointmentClick}
        />
      </div>

      {isAppointmentModalOpen && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          employees={employees}
          clients={clients}
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onUpdate={onUpdateAppointment}
          onDelete={onDeleteAppointment}
        />
      )}

      {isAddClientModalOpen && (
        <AddClientModal
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onAdd={handleAddClientSubmit}
        />
      )}
    </div>
  );
}
