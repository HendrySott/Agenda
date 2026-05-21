import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, MessageCircle, Save, Settings } from 'lucide-react';
import { EmailTemplates } from '../components/config/EmailTemplates';
import { BusinessInfo } from '../components/config/BusinessInfo';
import { CalendarSync } from '../components/config/CalendarSync';
import { Config, EmailTemplate, BusinessInfo as BusinessInfoType, CalendarSync as CalendarSyncType, NotificationSettings } from '../types';

interface ConfigPageProps {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

export function ConfigPage({ config, onUpdateConfig }: ConfigPageProps) {
  const [email, setEmail] = useState(config.notificationEmail);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(config.notificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      onUpdateConfig({ ...config, notificationEmail: email, notificationSettings });
      setIsSaving(false);
      alert('Configuración de notificaciones guardada correctamente');
    }, 500);
  };

  const updateNotificationSetting = (field: keyof NotificationSettings, value: string | boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
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
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Settings className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl text-gray-900 sm:text-3xl">Configuración</h1>
        </div>
        <p className="text-gray-600">Configura las opciones de tu plataforma de gestión de citas</p>
      </div>

      <div className="space-y-6">
        {/* Canales de Notificación */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl text-gray-900">Canales de Notificación</h2>
          </div>

          <form onSubmit={handleNotificationSubmit} className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg text-gray-900">Email</h3>
                  <p className="text-sm text-gray-500">
                    Datos requeridos para enviar recordatorios de citas por correo electrónico.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailEnabled}
                    onChange={(e) => updateNotificationSetting('emailEnabled', e.target.checked)}
                    className="h-4 w-4"
                  />
                  Activo
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email remitente *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="notificaciones@ejemplo.com"
                    required={notificationSettings.emailEnabled}
                  />
                </div>
                <div>
                  <Label>Nombre remitente</Label>
                  <Input
                    value={notificationSettings.emailFromName}
                    onChange={(e) => updateNotificationSetting('emailFromName', e.target.value)}
                    placeholder="Nombre de tu negocio"
                  />
                </div>
                <div>
                  <Label>Servidor SMTP</Label>
                  <Input
                    value={notificationSettings.smtpHost}
                    onChange={(e) => updateNotificationSetting('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label>Puerto SMTP</Label>
                  <Input
                    value={notificationSettings.smtpPort}
                    onChange={(e) => updateNotificationSetting('smtpPort', e.target.value)}
                    placeholder="587"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label>Usuario SMTP</Label>
                  <Input
                    value={notificationSettings.smtpUser}
                    onChange={(e) => updateNotificationSetting('smtpUser', e.target.value)}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Contraseña o app password SMTP</Label>
                  <Input
                    type="password"
                    value={notificationSettings.smtpPassword}
                    onChange={(e) => updateNotificationSetting('smtpPassword', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg text-gray-900">WhatsApp Business</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Este será el número y las credenciales usadas para enviar notificaciones por WhatsApp.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notificationSettings.whatsappEnabled}
                    onChange={(e) => updateNotificationSetting('whatsappEnabled', e.target.checked)}
                    className="h-4 w-4"
                  />
                  Activo
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Número de WhatsApp Business *</Label>
                  <Input
                    value={notificationSettings.whatsappBusinessPhone}
                    onChange={(e) => updateNotificationSetting('whatsappBusinessPhone', e.target.value)}
                    placeholder="+18095551234"
                    required={notificationSettings.whatsappEnabled}
                  />
                </div>
                <div>
                  <Label>ID del número telefónico</Label>
                  <Input
                    value={notificationSettings.whatsappPhoneNumberId}
                    onChange={(e) => updateNotificationSetting('whatsappPhoneNumberId', e.target.value)}
                    placeholder="Phone Number ID de Meta"
                  />
                </div>
                <div>
                  <Label>ID de WhatsApp Business Account</Label>
                  <Input
                    value={notificationSettings.whatsappBusinessAccountId}
                    onChange={(e) => updateNotificationSetting('whatsappBusinessAccountId', e.target.value)}
                    placeholder="Business Account ID"
                  />
                </div>
                <div>
                  <Label>Token de verificación webhook</Label>
                  <Input
                    value={notificationSettings.whatsappWebhookVerifyToken}
                    onChange={(e) => updateNotificationSetting('whatsappWebhookVerifyToken', e.target.value)}
                    placeholder="Token para validar webhooks"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Access Token de Meta</Label>
                  <Input
                    type="password"
                    value={notificationSettings.whatsappAccessToken}
                    onChange={(e) => updateNotificationSetting('whatsappAccessToken', e.target.value)}
                    placeholder="Token permanente o temporal de WhatsApp Cloud API"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Notificaciones'}
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
