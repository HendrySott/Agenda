import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Plus, Mail, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useVocabulary } from '../context/VocabularyContext';
import { Employee, Client, Appointment, Config } from '../types';

interface AddAppointmentModalProps {
  employees: Employee[];
  clients: Client[];
  isOpen: boolean;
  config: Config;
  onClose: () => void;
  onAdd: (appointment: Omit<Appointment, 'id' | 'color'> & {
    sendEmailNotification: boolean;
    sendWhatsappNotification: boolean;
    sendTelegramNotification: boolean;
  }) => Promise<boolean> | boolean | void;
}

export function AddAppointmentModal({ employees, clients, isOpen, config, onClose, onAdd }: AddAppointmentModalProps) {
  const vocab = useVocabulary();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    employeeId: '',
    clientId: '',
    day: '',
    startHour: '',
    endHour: '',
    notes: '',
    zoomLink: '',
    sendEmailNotification: true,
    sendWhatsappNotification: true,
    sendTelegramNotification: true
  });

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  const endHours = Array.from({ length: 14 }, (_, i) => i + 9);

  const filteredClients = newAppointment.employeeId
    ? clients.filter(c => c.employeeId === parseInt(newAppointment.employeeId))
    : clients;

  const selectedClient = clients.find(c => c.id === parseInt(newAppointment.clientId));
  const ns = config.notificationSettings;
  const canEmail = !!(ns.emailEnabled && config.notificationEmail && selectedClient?.email);
  const canWhatsapp = !!(ns.whatsappEnabled && ns.whatsappPhoneNumberId && selectedClient?.phone);
  const canTelegram = !!(ns.telegramEnabled && ns.telegramBotUsername && selectedClient?.telegramChatId);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAppointment.employeeId || !newAppointment.clientId || !newAppointment.day ||
        !newAppointment.startHour || !newAppointment.endHour) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (parseInt(newAppointment.startHour) >= parseInt(newAppointment.endHour)) {
      toast.error('La hora de finalización debe ser posterior a la hora de inicio');
      return;
    }

    const employee = employees.find(e => e.id === parseInt(newAppointment.employeeId));
    const client = clients.find(c => c.id === parseInt(newAppointment.clientId));

    setIsSubmitting(true);
    const ok = await onAdd({
      employeeId: parseInt(newAppointment.employeeId),
      employeeName: employee ? `${employee.name} ${employee.lastName}` : '',
      clientId: parseInt(newAppointment.clientId),
      clientName: client ? `${client.name} ${client.lastName}` : '',
      day: parseInt(newAppointment.day),
      startHour: parseInt(newAppointment.startHour),
      endHour: parseInt(newAppointment.endHour),
      notes: newAppointment.notes,
      zoomLink: newAppointment.zoomLink,
      sendEmailNotification: canEmail && newAppointment.sendEmailNotification,
      sendWhatsappNotification: canWhatsapp && newAppointment.sendWhatsappNotification,
      sendTelegramNotification: canTelegram && newAppointment.sendTelegramNotification,
    });
    setIsSubmitting(false);
    if (ok === false) return; // se conserva el formulario para corregir el error

    // Reset form
    setNewAppointment({
      employeeId: '',
      clientId: '',
      day: '',
      startHour: '',
      endHour: '',
      notes: '',
      zoomLink: '',
      sendEmailNotification: true,
      sendWhatsappNotification: true,
      sendTelegramNotification: true
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
      sendEmailNotification: true,
      sendWhatsappNotification: true,
      sendTelegramNotification: true
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar {vocab.new(vocab.appointment)} {vocab.appointment.one}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{vocab.employee.one} *</Label>
            <Select
              value={newAppointment.employeeId}
              onValueChange={(value) => setNewAppointment({
                ...newAppointment,
                employeeId: value,
                clientId: ''
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Seleccionar ${vocab.employeeLower}`} />
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
            <Label>{vocab.client.one} *</Label>
            <Select
              value={newAppointment.clientId}
              onValueChange={(value) => setNewAppointment({
                ...newAppointment,
                clientId: value
              })}
              disabled={!newAppointment.employeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder={newAppointment.employeeId ? `Seleccionar ${vocab.clientLower}` : `Primero seleccione ${vocab.employee.gender === 'f' ? 'una' : 'un'} ${vocab.employeeLower}`} />
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                  {endHours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {formatTime(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Enlace de videollamada (opcional)</Label>
            <Input
              type="url"
              value={newAppointment.zoomLink}
              onChange={(e) => setNewAppointment({ ...newAppointment, zoomLink: e.target.value })}
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
              placeholder={`Notas o detalles ${vocab.appointment.gender === 'f' ? 'de la' : 'del'} ${vocab.appointmentLower}...`}
              rows={3}
            />
          </div>

          {canEmail && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="sendEmailNotification"
                checked={newAppointment.sendEmailNotification}
                onCheckedChange={(checked) => setNewAppointment({
                  ...newAppointment,
                  sendEmailNotification: !!checked
                })}
              />
              <label htmlFor="sendEmailNotification" className="flex items-center space-x-2 text-sm cursor-pointer flex-1">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900">Enviar notificación por email</span>
              </label>
            </div>
          )}

          {canWhatsapp && (
            <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <Checkbox
                id="sendWhatsappNotification"
                checked={newAppointment.sendWhatsappNotification}
                onCheckedChange={(checked) => setNewAppointment({
                  ...newAppointment,
                  sendWhatsappNotification: !!checked
                })}
              />
              <label htmlFor="sendWhatsappNotification" className="flex flex-1 cursor-pointer items-center space-x-2 text-sm">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-900">
                  Enviar notificación por WhatsApp{config.notificationSettings.whatsappBusinessPhone ? ` desde ${config.notificationSettings.whatsappBusinessPhone}` : ''}
                </span>
              </label>
            </div>
          )}

          {canTelegram && (
            <div className="flex items-center space-x-2 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <Checkbox
                id="sendTelegramNotification"
                checked={newAppointment.sendTelegramNotification}
                onCheckedChange={(checked) => setNewAppointment({
                  ...newAppointment,
                  sendTelegramNotification: !!checked
                })}
              />
              <label htmlFor="sendTelegramNotification" className="flex flex-1 cursor-pointer items-center space-x-2 text-sm">
                <Send className="h-4 w-4 text-sky-600" />
                <span className="text-sky-900">Enviar notificación por Telegram</span>
              </label>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Guardando...' : `Agregar ${vocab.appointment.one}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
