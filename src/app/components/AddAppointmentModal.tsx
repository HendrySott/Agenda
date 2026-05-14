import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Plus, Mail } from 'lucide-react';
import { Employee, Client, Appointment, Config } from '../types';

interface AddAppointmentModalProps {
  employees: Employee[];
  clients: Client[];
  isOpen: boolean;
  config: Config;
  onClose: () => void;
  onAdd: (appointment: Omit<Appointment, 'id' | 'color'>) => void;
}

export function AddAppointmentModal({ employees, clients, isOpen, config, onClose, onAdd }: AddAppointmentModalProps) {
  const [newAppointment, setNewAppointment] = useState({
    employeeId: '',
    clientId: '',
    day: '',
    startHour: '',
    endHour: '',
    notes: '',
    zoomLink: '',
    sendNotification: true
  });

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const filteredClients = newAppointment.employeeId
    ? clients.filter(c => c.employeeId === parseInt(newAppointment.employeeId))
    : clients;

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAppointment.employeeId || !newAppointment.clientId || !newAppointment.day ||
        !newAppointment.startHour || !newAppointment.endHour) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (parseInt(newAppointment.startHour) >= parseInt(newAppointment.endHour)) {
      alert('La hora de finalización debe ser posterior a la hora de inicio');
      return;
    }

    const employee = employees.find(e => e.id === parseInt(newAppointment.employeeId));
    const client = clients.find(c => c.id === parseInt(newAppointment.clientId));

    if (newAppointment.sendNotification && config.notificationEmail) {
      // Simulate sending email notification
      console.log(`📧 Enviando notificación a: ${config.notificationEmail}`);
      console.log(`Nueva cita: ${employee?.name} ${employee?.lastName} con ${client?.name} ${client?.lastName}`);
      alert(`✓ Notificación enviada a ${config.notificationEmail}`);
    }

    onAdd({
      employeeId: parseInt(newAppointment.employeeId),
      employeeName: `${employee?.name} ${employee?.lastName}` || '',
      clientId: parseInt(newAppointment.clientId),
      clientName: `${client?.name} ${client?.lastName}` || '',
      day: parseInt(newAppointment.day),
      startHour: parseInt(newAppointment.startHour),
      endHour: parseInt(newAppointment.endHour),
      notes: newAppointment.notes,
      zoomLink: newAppointment.zoomLink
    });

    // Reset form
    setNewAppointment({
      employeeId: '',
      clientId: '',
      day: '',
      startHour: '',
      endHour: '',
      notes: '',
      zoomLink: '',
      sendNotification: true
    });

    onClose();
  };

  const handleCancel = () => {
    setNewAppointment({
      employeeId: '',
      clientId: '',
      day: '',
      startHour: '',
      endHour: '',
      notes: '',
      zoomLink: '',
      sendNotification: true
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar Nueva Cita</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Empleado *</Label>
            <Select
              value={newAppointment.employeeId}
              onValueChange={(value) => setNewAppointment({
                ...newAppointment,
                employeeId: value,
                clientId: ''
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${employee.color} rounded-full`} />
                      <span>{employee.name} {employee.lastName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cliente *</Label>
            <Select
              value={newAppointment.clientId}
              onValueChange={(value) => setNewAppointment({
                ...newAppointment,
                clientId: value
              })}
              disabled={!newAppointment.employeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder={newAppointment.employeeId ? "Seleccionar cliente" : "Primero seleccione un empleado"} />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name} {client.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Día *</Label>
            <Select
              value={newAppointment.day}
              onValueChange={(value) => setNewAppointment({
                ...newAppointment,
                day: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar día" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora de Inicio *</Label>
              <Select
                value={newAppointment.startHour}
                onValueChange={(value) => setNewAppointment({
                  ...newAppointment,
                  startHour: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Inicio" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {formatTime(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hora de Fin *</Label>
              <Select
                value={newAppointment.endHour}
                onValueChange={(value) => setNewAppointment({
                  ...newAppointment,
                  endHour: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fin" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {formatTime(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Enlace de Zoom</Label>
            <Input
              value={newAppointment.zoomLink}
              onChange={(e) => setNewAppointment({
                ...newAppointment,
                zoomLink: e.target.value
              })}
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({
                ...newAppointment,
                notes: e.target.value
              })}
              placeholder="Notas adicionales o detalles del tema..."
              rows={3}
            />
          </div>

          {config.notificationEmail && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="sendNotification"
                checked={newAppointment.sendNotification}
                onCheckedChange={(checked) => setNewAppointment({
                  ...newAppointment,
                  sendNotification: !!checked
                })}
              />
              <label htmlFor="sendNotification" className="flex items-center space-x-2 text-sm cursor-pointer flex-1">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900">Enviar notificación por email a {config.notificationEmail}</span>
              </label>
            </div>
          )}

          <div className="flex space-x-2 pt-4 border-t">
            <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Agregar Cita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}