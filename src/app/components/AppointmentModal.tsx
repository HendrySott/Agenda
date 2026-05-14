import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Calendar, Clock, User, Link, Trash2, Edit } from 'lucide-react';
import { Appointment, Employee, Client } from '../types';

interface AppointmentModalProps {
  appointment: Appointment;
  employees: Employee[];
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (appointment: Appointment) => void;
  onDelete: (id: number) => void;
}

export function AppointmentModal({
  appointment,
  employees,
  clients,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: AppointmentModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState(appointment);

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const filteredClients = editedAppointment.employeeId
    ? clients.filter(c => c.employeeId === editedAppointment.employeeId)
    : clients;

  const handleSave = () => {
    const employee = employees.find(e => e.id === editedAppointment.employeeId);
    const client = clients.find(c => c.id === editedAppointment.clientId);
    const updatedAppointment = {
      ...editedAppointment,
      employeeName: employee ? `${employee.name} ${employee.lastName}` : editedAppointment.employeeName,
      clientName: client ? `${client.name} ${client.lastName}` : editedAppointment.clientName,
      color: employee?.color || editedAppointment.color
    };
    onUpdate(updatedAppointment);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAppointment(appointment);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar esta cita?')) {
      onDelete(appointment.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Detalles de la Cita</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing ? (
            // View mode
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${appointment.color} rounded-full`} />
                  <div>
                    <p className="text-sm text-gray-600">Empleado</p>
                    <p className="text-gray-900">{appointment.employeeName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="text-gray-900">{appointment.clientName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Día</p>
                    <p className="text-gray-900">{days[appointment.day]}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Horario</p>
                    <p className="text-gray-900">
                      {formatTime(appointment.startHour)} - {formatTime(appointment.endHour)}
                    </p>
                  </div>
                </div>

                {appointment.zoomLink && (
                  <div className="flex items-start space-x-3">
                    <Link className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Enlace de Zoom</p>
                      <a
                        href={appointment.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Unirse a la reunión
                      </a>
                    </div>
                  </div>
                )}

                {appointment.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Notas</p>
                    <p className="text-gray-900">{appointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </>
          ) : (
            // Edit mode
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div>
                <Label>Empleado *</Label>
                <Select
                  value={editedAppointment.employeeId.toString()}
                  onValueChange={(value) => setEditedAppointment({
                    ...editedAppointment,
                    employeeId: parseInt(value),
                    clientId: 0
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
                  value={editedAppointment.clientId.toString()}
                  onValueChange={(value) => setEditedAppointment({
                    ...editedAppointment,
                    clientId: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
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
                  value={editedAppointment.day.toString()}
                  onValueChange={(value) => setEditedAppointment({
                    ...editedAppointment,
                    day: parseInt(value)
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
                    value={editedAppointment.startHour.toString()}
                    onValueChange={(value) => setEditedAppointment({
                      ...editedAppointment,
                      startHour: parseInt(value)
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
                    value={editedAppointment.endHour.toString()}
                    onValueChange={(value) => setEditedAppointment({
                      ...editedAppointment,
                      endHour: parseInt(value)
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
                  value={editedAppointment.zoomLink}
                  onChange={(e) => setEditedAppointment({
                    ...editedAppointment,
                    zoomLink: e.target.value
                  })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={editedAppointment.notes}
                  onChange={(e) => setEditedAppointment({
                    ...editedAppointment,
                    notes: e.target.value
                  })}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
