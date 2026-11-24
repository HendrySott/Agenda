import React, { useState, useRef } from 'react';
import { Employee } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useVocabulary } from '../context/VocabularyContext';

interface EmployeesPageProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => Promise<boolean> | boolean | void;
  onUpdateEmployee: (employee: Employee) => Promise<boolean> | boolean | void;
  onDeleteEmployee: (id: number) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' }
];

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500'
];

export function EmployeesPage({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeesPageProps) {
  const vocab = useVocabulary();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    image: '',
    schedule: '',
    workingDays: [],
    status: 'available',
    color: COLORS[0]
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        image: employee.image || '',
        schedule: employee.schedule,
        workingDays: employee.workingDays,
        status: employee.status,
        color: employee.color
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        image: '',
        schedule: '',
        workingDays: [],
        status: 'available',
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.lastName || !formData.email) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    const ok = editingEmployee
      ? await onUpdateEmployee({ ...formData, id: editingEmployee.id })
      : await onAddEmployee(formData);

    if (ok !== false) setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm(`¿Está seguro de eliminar ${vocab.this(vocab.employee)} ${vocab.employeeLower}? También se eliminarán sus ${vocab.clientsLower} y ${vocab.appointmentsLower}.`)) {
      onDeleteEmployee(id);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const toggleWorkingDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter(d => d !== dayId)
        : [...prev.workingDays, dayId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'partially': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Ocupado';
      case 'partially': return 'Parcialmente disponible';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl text-gray-900 sm:text-3xl">{vocab.employee.many}</h1>
          <p className="text-gray-600">Gestiona tu equipo de {vocab.employeesLower}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agregar {vocab.employee.one}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(employee => (
          <div key={employee.id} className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-lg sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center space-x-3">
                {employee.image ? (
                  <img src={employee.image} alt={employee.name} className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16" />
                ) : (
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16 ${employee.color}`}>
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-lg text-gray-900">{employee.name} {employee.lastName}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(employee.status)} text-white`}>
                    {getStatusText(employee.status)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 self-end sm:self-start">
                <Button size="sm" variant="outline" title="Editar" aria-label="Editar" onClick={() => handleOpenModal(employee)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" title="Eliminar" aria-label="Eliminar" onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex min-w-0 items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex min-w-0 items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{employee.phone}</span>
              </div>
              {employee.address && (
                <div className="flex min-w-0 items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">{employee.address}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              {employee.schedule && <p className="text-xs text-gray-500 mb-2">Horario: {employee.schedule}</p>}
              <div className="flex flex-wrap gap-1">
                {employee.workingDays.map(day => (
                  <span key={day} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {DAYS_OF_WEEK.find(d => d.id === day)?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? `Editar ${vocab.employee.one}` : `Agregar ${vocab.new(vocab.employee)} ${vocab.employee.one}`}
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
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div>
                <Label>Subir imagen local (Opcional)</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar imagen
                    </Button>
                    {formData.image && (
                      <Button type="button" variant="ghost" className="text-red-600" onClick={handleRemoveImage}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                  {formData.image && (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                      <img src={formData.image} alt={`Vista previa ${vocab.employee.gender === 'f' ? 'de la' : 'del'} ${vocab.employeeLower}`} className="h-24 w-full object-cover" />
                    </div>
                  )}
                </div>
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
              <Label>Horario</Label>
              <Input
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Ej: 9:00 AM - 5:00 PM"
              />
            </div>

            <div>
              <Label className="mb-3 block">Días Laborales</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={formData.workingDays.includes(day.id)}
                      onCheckedChange={() => toggleWorkingDay(day.id)}
                    />
                    <label htmlFor={`day-${day.id}`} className="text-sm cursor-pointer">
                      {day.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Estado</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="available">Disponible</option>
                <option value="busy">Ocupado</option>
                <option value="partially">Parcialmente disponible</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingEmployee ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
