import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, Save } from 'lucide-react';
import { BusinessInfo as BusinessInfoType } from '../../types';
// @ts-expect-error módulo JS compartido con el servidor
import { BUSINESS_TYPES, getBusinessType } from '../../../../shared/businessTypes.js';

interface BusinessInfoProps {
  businessInfo: BusinessInfoType;
  onUpdate: (info: BusinessInfoType) => Promise<boolean> | boolean | void;
}

export function BusinessInfo({ businessInfo, onUpdate }: BusinessInfoProps) {
  const [formData, setFormData] = useState(businessInfo);
  const [isSaving, setIsSaving] = useState(false);

  // Si la configuración se recarga desde el servidor, el formulario la refleja
  useEffect(() => {
    setFormData(businessInfo);
  }, [businessInfo]);

  const businessType = getBusinessType(formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'other' && !formData.typeLabel.trim()) {
      toast.error('Especifica qué tipo de negocio tienes');
      return;
    }
    setIsSaving(true);
    const ok = await onUpdate(formData);
    setIsSaving(false);
    if (ok !== false) toast.success('Información del negocio guardada');
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center">
        <Building2 className="mr-2 h-5 w-5 text-blue-600" />
        <h2 className="text-xl text-gray-900">Información del Negocio</h2>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Esta información se usa en las notificaciones y adapta la plataforma a tu tipo de negocio.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Tipo de negocio *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de negocio" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Tus {businessType.employee.many.toLowerCase()}, {businessType.client.many.toLowerCase()} y{' '}
              {businessType.appointment.many.toLowerCase()} se mostrarán con estos nombres.
            </p>
          </div>

          {formData.type === 'other' && (
            <div>
              <Label>Especifica tu tipo de negocio *</Label>
              <Input
                value={formData.typeLabel}
                onChange={(e) => setFormData({ ...formData, typeLabel: e.target.value })}
                placeholder="Ej: Estudio de tatuajes"
                maxLength={60}
                required
              />
            </div>
          )}
        </div>

        <div>
          <Label>Nombre del Negocio *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={businessType.placeholderBusiness}
            required
          />
        </div>

        <div>
          <Label>Dirección</Label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Dirección completa del negocio"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Horario Laboral</Label>
            <Input
              value={formData.businessHours}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              placeholder="Ej: Lunes a Viernes: 9:00 AM - 6:00 PM"
            />
          </div>

          <div>
            <Label>RNC (Registro Nacional de Contribuyentes)</Label>
            <Input
              value={formData.rnc}
              onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
              placeholder="Ej: 123-45678-9"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Información'}
          </Button>
        </div>
      </form>
    </div>
  );
}
