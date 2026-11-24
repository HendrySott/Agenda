import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';
import { EmailTemplates } from '../components/config/EmailTemplates';
import { BusinessInfo } from '../components/config/BusinessInfo';
import { CalendarSync } from '../components/config/CalendarSync';
import { NotificationChannels } from '../components/config/NotificationChannels';
import { Config, EmailTemplate, BusinessInfo as BusinessInfoType, CalendarSync as CalendarSyncType, NotificationSettings } from '../types';
import { useVocabulary } from '../context/VocabularyContext';

interface ConfigPageProps {
  config: Config;
  onUpdateConfig: (config: Config) => Promise<boolean> | boolean | void;
  onClientsChanged?: () => void;
}

export function ConfigPage({ config, onUpdateConfig, onClientsChanged }: ConfigPageProps) {
  const vocab = useVocabulary();

  // Resultado del flujo OAuth de calendario (el servidor redirige con ?connected=… o ?error=…)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) toast.success(`${connected === 'google' ? 'Google' : 'Outlook'} Calendar conectado correctamente`);
    if (error) toast.error(`No se pudo conectar ${error === 'google' ? 'Google' : 'Outlook'} Calendar`);
    if (connected || error) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleSaveNotifications = async (notificationEmail: string, notificationSettings: NotificationSettings) => {
    const result = await onUpdateConfig({ ...config, notificationEmail, notificationSettings });
    return result !== false;
  };

  const handleAddTemplate = (template: Omit<EmailTemplate, 'id'>) => {
    onUpdateConfig({ ...config, emailTemplates: [...config.emailTemplates, { ...template, id: Date.now() }] });
  };

  const handleUpdateTemplate = (template: EmailTemplate) => {
    onUpdateConfig({ ...config, emailTemplates: config.emailTemplates.map(t => t.id === template.id ? template : t) });
  };

  const handleDeleteTemplate = (id: number) => {
    onUpdateConfig({ ...config, emailTemplates: config.emailTemplates.filter(t => t.id !== id) });
  };

  const handleUpdateBusinessInfo = async (info: BusinessInfoType) => {
    const result = await onUpdateConfig({ ...config, businessInfo: info });
    return result !== false;
  };

  const handleUpdateCalendarSync = (sync: CalendarSyncType) => {
    onUpdateConfig({ ...config, calendarSync: sync });
  };

  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center">
          <Settings className="mr-2 h-6 w-6 text-blue-600" />
          <h1 className="text-2xl text-gray-900 sm:text-3xl">Configuración</h1>
        </div>
        <p className="text-gray-600">
          Configura tu plataforma de gestión de {vocab.appointmentsLower}
        </p>
      </div>

      <div className="space-y-6">
        <BusinessInfo businessInfo={config.businessInfo} onUpdate={handleUpdateBusinessInfo} />

        <NotificationChannels
          notificationEmail={config.notificationEmail}
          settings={config.notificationSettings}
          onSave={handleSaveNotifications}
          onTelegramSynced={onClientsChanged}
        />

        <EmailTemplates
          templates={config.emailTemplates}
          onAddTemplate={handleAddTemplate}
          onUpdateTemplate={handleUpdateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />

        <CalendarSync calendarSync={config.calendarSync} onUpdate={handleUpdateCalendarSync} />
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-1 text-sm text-blue-900">Cómo se guardan los cambios</h3>
        <p className="text-sm text-blue-800">
          Las plantillas y la sincronización de calendario se guardan al instante. La información del negocio
          y los canales de notificación se guardan con su botón «Guardar».
        </p>
      </div>
    </div>
  );
}
