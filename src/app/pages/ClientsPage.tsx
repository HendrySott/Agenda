import React, { useState } from 'react';
import { Client, Employee } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, User, Mail, Phone, MapPin, UserCircle, Send, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVocabulary } from '../context/VocabularyContext';
import * as api from '../services/api';

interface ClientsPageProps {
  clients: Client[];
  employees: Employee[];
  onAddClient: (client: Omit<Client, 'id'>) => Promise<boolean> | boolean | void;
  onUpdateClient: (client: Client) => Promise<boolean> | boolean | void;
  onDeleteClient: (id: number) => void;
}

export function ClientsPage({ clients, employees, onAddClient, onUpdateClient, onDeleteClient }: ClientsPageProps) {
  const vocab = useVocabulary();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    employeeId: 0,
    notes: '',
    telegramChatId: ''
  });

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        employeeId: client.employeeId,
        notes: client.notes || '',
        telegramChatId: client.telegramChatId || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        employeeId: employees[0]?.id || 0,
        notes: '',
        telegramChatId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.lastName || !formData.email || !formData.phone || !formData.employeeId) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    const payload = { ...formData, telegramChatId: formData.telegramChatId.trim() || null };
    const ok = editingClient
      ? await onUpdateClient({ ...payload, id: editingClient.id })
      : await onAddClient(payload);

    if (ok !== false) setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm(`¿Está seguro de eliminar ${vocab.this(vocab.client)} ${vocab.clientLower}? También se eliminarán sus ${vocab.appointmentsLower}.`)) {
      onDeleteClient(id);
    }
  };

  const handleCopyTelegramLink = async (client: Client) => {
    try {
      const { url } = await api.getClientTelegramLink(client.id);
      await navigator.clipboard.writeText(url);
      toast.success(`Enlace copiado. Envíaselo a ${client.name} para vincular su Telegram.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el enlace');
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} ${employee.lastName}` : 'Sin asignar';
  };

  const getEmployeeColor = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.color || 'bg-gray-500';
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl text-gray-900 sm:text-3xl">{vocab.client.many}</h1>
          <p className="text-gray-600">Gestiona tus {vocab.clientsLower}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agregar {vocab.client.one}
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">{vocab.client.one}</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">{vocab.employee.one} {vocab.assigned(vocab.employee)}</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Notas</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getEmployeeColor(client.employeeId)}`}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">{client.name} {client.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center mb-1">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {client.email}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mb-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {client.phone}
                    </div>
                    <div className="text-xs flex items-center">
                      <Send className="h-4 w-4 mr-2 text-gray-400" />
                      {client.telegramChatId
                        ? <span className="text-sky-700">Telegram vinculado</span>
                        : <span className="text-gray-400">Telegram sin vincular</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {client.address ? (
                      <div className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {client.address}
                      </div>
                    ) : <span className="text-sm text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{getEmployeeName(client.employeeId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {client.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline" title="Copiar enlace de vinculación de Telegram" aria-label="Copiar enlace de Telegram" onClick={() => handleCopyTelegramLink(client)}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" title="Editar" aria-label="Editar" onClick={() => handleOpenModal(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" title="Eliminar" aria-label="Eliminar" onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay {vocab.clientsLower} registrados</p>
            <Button onClick={() => handleOpenModal()} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Agregar tu primer {vocab.clientLower}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? `Editar ${vocab.client.one}` : `Agregar ${vocab.new(vocab.client)} ${vocab.client.one}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Correo Electrónico *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+18095551234"
                  required
                />
              </div>
              <div>
                <Label>{vocab.employee.one} {vocab.assigned(vocab.employee)} *</Label>
                <Select
                  value={formData.employeeId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Seleccionar ${vocab.employeeLower}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
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
            </div>

            <div>
              <Label>Dirección</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
                rows={2}
              />
            </div>

            <div>
              <Label>Telegram Chat ID (opcional)</Label>
              <Input
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                placeholder="Se completa solo al vincular con el enlace de Telegram"
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={`Notas adicionales sobre ${vocab.the(vocab.client)} ${vocab.clientLower}...`}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingClient ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
