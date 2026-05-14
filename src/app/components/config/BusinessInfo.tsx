import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Save } from 'lucide-react';
import { BusinessInfo as BusinessInfoType } from '../../types';

interface BusinessInfoProps {
  businessInfo: BusinessInfoType;
  onUpdate: (info: BusinessInfoType) => void;
}

export function BusinessInfo({ businessInfo, onUpdate }: BusinessInfoProps) {
  const [formData, setFormData] = useState(businessInfo);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      onUpdate(formData);
      setIsSaving(false);
      alert('Información del negocio guardada correctamente');
    }, 500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Building2 className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl text-gray-900">Información del Negocio</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Configura la información básica de tu negocio que se usará en las notificaciones y documentos
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nombre del Negocio *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Centro de Tutoría Académica"
            required
          />
        </div>

        <div>
          <Label>Dirección *</Label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Dirección completa del negocio"
            rows={3}
            required
          />
        </div>

        <div>
          <Label>Horario Laboral *</Label>
          <Input
            value={formData.businessHours}
            onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
            placeholder="Ej: Lunes a Viernes: 9:00 AM - 6:00 PM"
            required
          />
        </div>

        <div>
          <Label>RNC (Registro Nacional de Contribuyentes) *</Label>
          <Input
            value={formData.rnc}
            onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
            placeholder="Ej: 123-45678-9"
            required
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Información'}
          </Button>
        </div>
      </form>
    </div>
  );
}
