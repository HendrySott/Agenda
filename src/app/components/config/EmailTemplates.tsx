import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, Mail, AlertCircle } from 'lucide-react';
import { EmailTemplate } from '../../types';

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  onAddTemplate: (template: Omit<EmailTemplate, 'id'>) => void;
  onUpdateTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (id: number) => void;
}

export function EmailTemplates({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }: EmailTemplatesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    triggerType: 'two_days_before' as const,
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
      alert('Por favor complete todos los campos');
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
      case 'two_days_before': return '2 días antes';
      case 'today': return 'El día de la cita';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl text-gray-900">Plantillas de Email</h2>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Configura plantillas de email para notificar a los clientes sobre sus citas
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
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-gray-900">{template.name}</h3>
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
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Asunto:</strong> {template.subject}
                  </p>
                  <p className="text-xs text-blue-600">
                    {getTriggerTypeLabel(template.triggerType)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenModal(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="mb-1">
              <strong>Variables disponibles:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><code>{'{{cliente_nombre}}'}</code> - Nombre del cliente</li>
              <li><code>{'{{empleado_nombre}}'}</code> - Nombre del empleado</li>
              <li><code>{'{{fecha_cita}}'}</code> - Fecha de la cita</li>
              <li><code>{'{{hora_cita}}'}</code> - Hora de la cita</li>
              <li><code>{'{{negocio_nombre}}'}</code> - Nombre del negocio</li>
              <li><code>{'{{negocio_direccion}}'}</code> - Dirección del negocio</li>
            </ul>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Email'}
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
              <Label>Tipo de Envío *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two_days_before">2 días antes de la cita</SelectItem>
                  <SelectItem value="today">El día de la cita</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Asunto del Email *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ej: Recordatorio de tu cita"
                required
              />
            </div>

            <div>
              <Label>Contenido del Email *</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Escribe el contenido del email aquí. Puedes usar variables como {{cliente_nombre}}, {{fecha_cita}}, etc."
                rows={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa las variables mostradas arriba para personalizar el email
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

            <div className="flex space-x-2 pt-4 border-t">
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
