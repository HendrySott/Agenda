import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, Mail, AlertCircle } from 'lucide-react';
import { EmailTemplate } from '../../types';
import { toast } from 'sonner';
import { useVocabulary } from '../../context/VocabularyContext';

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  onAddTemplate: (template: Omit<EmailTemplate, 'id'>) => void;
  onUpdateTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (id: number) => void;
}

export function EmailTemplates({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }: EmailTemplatesProps) {
  const vocab = useVocabulary();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    triggerType: 'two_days_before' as EmailTemplate['triggerType'],
    isActive: true
  });

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        triggerType: template.triggerType,
        isActive: template.isActive
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        body: '',
        triggerType: 'two_days_before',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.body) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    if (editingTemplate) {
      onUpdateTemplate({ ...formData, id: editingTemplate.id });
    } else {
      onAddTemplate(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta plantilla?')) {
      onDeleteTemplate(id);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'two_days_before': return `2 días antes de ${vocab.the(vocab.appointment)} ${vocab.appointmentLower}`;
      case 'today': return `El día de ${vocab.the(vocab.appointment)} ${vocab.appointmentLower}`;
      case 'custom': return 'Manual (no se envía automáticamente)';
      default: return type;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl text-gray-900">Plantillas de Recordatorio</h2>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Mensajes automáticos de recordatorio. Se envían por los canales activos (email, WhatsApp y Telegram) según el tipo de envío; si hay varias plantillas activas del mismo tipo se usa la primera.
      </p>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">No hay plantillas configuradas</p>
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear primera plantilla
            </Button>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-gray-900">{template.name}</h3>
                    {template.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="mb-2 break-words text-sm text-gray-600">
                    <strong>Asunto:</strong> {template.subject}
                  </p>
                  <p className="text-xs text-blue-600">
                    {getTriggerTypeLabel(template.triggerType)}
                  </p>
                </div>
                <div className="flex space-x-2 self-end sm:self-start">
                  <Button size="sm" variant="outline" title="Editar" aria-label="Editar plantilla" onClick={() => handleOpenModal(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" title="Eliminar" aria-label="Eliminar plantilla" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="mb-1">
              <strong>Variables disponibles:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><code>{'{{cliente_nombre}}'}</code> - Nombre {vocab.client.gender === 'f' ? 'de la' : 'del'} {vocab.clientLower}</li>
              <li><code>{'{{empleado_nombre}}'}</code> - Nombre {vocab.employee.gender === 'f' ? 'de la' : 'del'} {vocab.employeeLower}</li>
              <li><code>{'{{fecha_cita}}'}</code> - Día {vocab.appointment.gender === 'f' ? 'de la' : 'del'} {vocab.appointmentLower}</li>
              <li><code>{'{{hora_cita}}'}</code> - Horario {vocab.appointment.gender === 'f' ? 'de la' : 'del'} {vocab.appointmentLower}</li>
              <li><code>{'{{enlace_reunion}}'}</code> - Enlace de videollamada (si existe)</li>
              <li><code>{'{{negocio_nombre}}'}</code> - Nombre del negocio</li>
              <li><code>{'{{negocio_direccion}}'}</code> - Dirección del negocio</li>
            </ul>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre de la Plantilla *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Recordatorio 2 días antes"
                required
              />
            </div>

            <div>
              <Label>Momento de envío *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two_days_before">2 días antes</SelectItem>
                  <SelectItem value="today">El mismo día</SelectItem>
                  <SelectItem value="custom">Manual (no se envía automáticamente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Asunto (email) *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={`Ej: Recordatorio de tu ${vocab.appointmentLower}`}
                required
              />
            </div>

            <div>
              <Label>Contenido del mensaje *</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Escribe el mensaje aquí. Puedes usar variables como {{cliente_nombre}}, {{fecha_cita}}, etc."
                rows={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa las variables mostradas arriba para personalizar el mensaje
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Plantilla activa
              </Label>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingTemplate ? 'Actualizar' : 'Crear Plantilla'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
