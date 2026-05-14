import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Save, Settings } from 'lucide-react';
import { EmailTemplates } from '../components/config/EmailTemplates';
import { BusinessInfo } from '../components/config/BusinessInfo';
import { CalendarSync } from '../components/config/CalendarSync';
import { Config, EmailTemplate, BusinessInfo as BusinessInfoType, CalendarSync as CalendarSyncType } from '../types';

interface ConfigPageProps {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

export function ConfigPage({ config, onUpdateConfig }: ConfigPageProps) {
  const [email, setEmail] = useState(config.notificationEmail);
  const [isSaving, setIsSaving] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      onUpdateConfig({ ...config, notificationEmail: email });
      setIsSaving(false);
      alert('Email de notificaciones guardado correctamente');
    }, 500);
  };

  const handleAddTemplate = (template: Omit<EmailTemplate, 'id'>) => {
    const newTemplate = { ...template, id: Date.now() };
    onUpdateConfig({
      ...config,
      emailTemplates: [...config.emailTemplates, newTemplate]
    });
  };

  const handleUpdateTemplate = (template: EmailTemplate) => {
    onUpdateConfig({
      ...config,
      emailTemplates: config.emailTemplates.map(t => t.id === template.id ? template : t)
    });
  };

  const handleDeleteTemplate = (id: number) => {
    onUpdateConfig({
      ...config,
      emailTemplates: config.emailTemplates.filter(t => t.id !== id)
    });
  };

  const handleUpdateBusinessInfo = (info: BusinessInfoType) => {
    onUpdateConfig({ ...config, businessInfo: info });
  };

  const handleUpdateCalendarSync = (sync: CalendarSyncType) => {
    onUpdateConfig({ ...config, calendarSync: sync });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Settings className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-3xl text-gray-900">Configuración</h1>
        </div>
        <p className="text-gray-600">Configura las opciones de tu plataforma de gestión de citas</p>
      </div>

      <div className="space-y-6">
        {/* Email de Notificaciones */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl text-gray-900">Email de Notificaciones</h2>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label>Email Principal</Label>
              <p className="text-sm text-gray-500 mb-2">
                Este correo será usado como remitente para enviar notificaciones
              </p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="notificaciones@ejemplo.com"
                required
                className="max-w-md"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Email'}
              </Button>
            </div>
          </form>
        </div>

        {/* Plantillas de Email */}
        <EmailTemplates
          templates={config.emailTemplates}
          onAddTemplate={handleAddTemplate}
          onUpdateTemplate={handleUpdateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />

        {/* Información del Negocio */}
        <BusinessInfo
          businessInfo={config.businessInfo}
          onUpdate={handleUpdateBusinessInfo}
        />

        {/* Sincronización de Calendario */}
        <CalendarSync
          calendarSync={config.calendarSync}
          onUpdate={handleUpdateCalendarSync}
        />
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm text-green-900 mb-2">✓ Configuración Completa</h3>
        <p className="text-sm text-green-800">
          Todos los cambios se guardan automáticamente. Asegúrate de completar toda la configuración
          para aprovechar al máximo las funcionalidades de la plataforma.
        </p>
      </div>
    </div>
  );
}
