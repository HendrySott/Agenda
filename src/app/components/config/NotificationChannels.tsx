import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Bell, Mail, MessageCircle, Save, Send, RefreshCw } from 'lucide-react';
import { NotificationSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

interface NotificationChannelsProps {
  notificationEmail: string;
  settings: NotificationSettings;
  onSave: (notificationEmail: string, settings: NotificationSettings) => Promise<boolean>;
  onTelegramSynced?: () => void;
}

type Channel = 'email' | 'whatsapp' | 'telegram';

function ChannelHeader({ icon, title, description, enabled, onToggle }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4"
        />
        Activo
      </label>
    </div>
  );
}

export function NotificationChannels({ notificationEmail, settings: initialSettings, onSave, onTelegramSynced }: NotificationChannelsProps) {
  const { user } = useAuth();
  const accountId = user?.parentUserId || user?.id;

  const [email, setEmail] = useState(notificationEmail);
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState<Channel | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testTargets, setTestTargets] = useState({ email: '', whatsapp: '', telegram: '' });

  // El @usuario del bot lo detecta el servidor al guardar
  useEffect(() => {
    setSettings(prev => ({ ...prev, telegramBotUsername: initialSettings.telegramBotUsername }));
  }, [initialSettings.telegramBotUsername]);

  const update = (field: keyof NotificationSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const ok = await onSave(email, settings);
    setIsSaving(false);
    if (ok) {
      // Los secretos guardados se muestran enmascarados, igual que al recargar
      setSettings(prev => ({
        ...prev,
        smtpPassword: prev.smtpPassword ? '********' : '',
        whatsappAccessToken: prev.whatsappAccessToken ? '********' : '',
        telegramBotToken: prev.telegramBotToken ? '********' : '',
      }));
      toast.success('Configuración de notificaciones guardada');
    }
  };

  const handleTest = async (channel: Channel) => {
    setTesting(channel);
    try {
      // Se prueba con lo que hay en pantalla, sin necesidad de guardar antes
      const result = await api.testNotificationChannel({
        channel,
        to: testTargets[channel],
        notificationEmail: email,
        notificationSettings: settings,
      });
      toast.success(result.message || 'Prueba enviada correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La prueba falló');
    } finally {
      setTesting(null);
    }
  };

  const handleSyncTelegram = async () => {
    setIsSyncing(true);
    try {
      const { linked } = await api.syncTelegramLinks();
      if (linked > 0) onTelegramSynced?.();
      toast.success(linked > 0 ? `${linked} vínculo(s) de Telegram actualizados` : 'No hay vínculos nuevos pendientes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo sincronizar Telegram');
    } finally {
      setIsSyncing(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/whatsapp/${accountId ?? ''}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center">
        <Bell className="mr-2 h-5 w-5 text-blue-600" />
        <h2 className="text-xl text-gray-900">Canales de Notificación</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Email ── */}
        <div className="rounded-lg border border-gray-200 p-4">
          <ChannelHeader
            icon={<Mail className="h-5 w-5 text-blue-600" />}
            title="Email"
            description="Datos requeridos para enviar recordatorios de citas por correo electrónico."
            enabled={settings.emailEnabled}
            onToggle={(v) => update('emailEnabled', v)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email remitente *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="notificaciones@ejemplo.com"
                required={settings.emailEnabled}
              />
            </div>
            <div>
              <Label>Nombre remitente</Label>
              <Input
                value={settings.emailFromName}
                onChange={(e) => update('emailFromName', e.target.value)}
                placeholder="Nombre de tu negocio"
              />
            </div>
            <div>
              <Label>Servidor SMTP</Label>
              <Input
                value={settings.smtpHost}
                onChange={(e) => update('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label>Puerto SMTP</Label>
              <Input
                value={settings.smtpPort}
                onChange={(e) => update('smtpPort', e.target.value)}
                placeholder="587 (STARTTLS) o 465 (SSL)"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label>Usuario SMTP</Label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => update('smtpUser', e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <Label>Contraseña o app password SMTP</Label>
              <Input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => update('smtpPassword', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Enviar prueba a (opcional)</Label>
              <Input
                type="email"
                value={testTargets.email}
                onChange={(e) => setTestTargets(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Por defecto, el email remitente"
              />
            </div>
            <Button type="button" variant="outline" disabled={testing !== null} onClick={() => handleTest('email')}>
              <Send className="mr-2 h-4 w-4" />
              {testing === 'email' ? 'Probando...' : 'Probar email'}
            </Button>
          </div>
        </div>

        {/* ── WhatsApp ── */}
        <div className="rounded-lg border border-gray-200 p-4">
          <ChannelHeader
            icon={<MessageCircle className="h-5 w-5 text-green-600" />}
            title="WhatsApp Business"
            description="Credenciales de la WhatsApp Cloud API de Meta para enviar notificaciones."
            enabled={settings.whatsappEnabled}
            onToggle={(v) => update('whatsappEnabled', v)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Número de WhatsApp Business *</Label>
              <Input
                value={settings.whatsappBusinessPhone}
                onChange={(e) => update('whatsappBusinessPhone', e.target.value)}
                placeholder="+18095551234"
                required={settings.whatsappEnabled}
              />
            </div>
            <div>
              <Label>ID del número telefónico (Phone Number ID) *</Label>
              <Input
                value={settings.whatsappPhoneNumberId}
                onChange={(e) => update('whatsappPhoneNumberId', e.target.value)}
                placeholder="Phone Number ID de Meta"
                required={settings.whatsappEnabled}
              />
            </div>
            <div>
              <Label>ID de WhatsApp Business Account</Label>
              <Input
                value={settings.whatsappBusinessAccountId}
                onChange={(e) => update('whatsappBusinessAccountId', e.target.value)}
                placeholder="Business Account ID"
              />
            </div>
            <div>
              <Label>Código de país por defecto</Label>
              <Input
                value={settings.phoneCountryCode}
                onChange={(e) => update('phoneCountryCode', e.target.value.replace(/\D/g, ''))}
                placeholder="1"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-gray-500">Se antepone a teléfonos de 10 dígitos (ej. 1 para RD/EE. UU.).</p>
            </div>
            <div className="md:col-span-2">
              <Label>Access Token de Meta *</Label>
              <Input
                type="password"
                value={settings.whatsappAccessToken}
                onChange={(e) => update('whatsappAccessToken', e.target.value)}
                placeholder="Token permanente de WhatsApp Cloud API"
                autoComplete="new-password"
                required={settings.whatsappEnabled}
              />
            </div>
            <div>
              <Label>Plantilla aprobada (opcional)</Label>
              <Input
                value={settings.whatsappTemplateName}
                onChange={(e) => update('whatsappTemplateName', e.target.value)}
                placeholder="nombre_de_la_plantilla"
              />
            </div>
            <div>
              <Label>Idioma de la plantilla</Label>
              <Input
                value={settings.whatsappTemplateLang}
                onChange={(e) => update('whatsappTemplateLang', e.target.value)}
                placeholder="es"
              />
            </div>
            <div className="md:col-span-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900">
              Meta solo permite texto libre a clientes que te escribieron en las últimas 24 h. Para enviar
              recordatorios a cualquier cliente, crea una plantilla aprobada con 5 variables
              (cliente, profesional, día, hora y negocio) e indícala arriba.
            </div>
            <div>
              <Label>Token de verificación del webhook</Label>
              <Input
                value={settings.whatsappWebhookVerifyToken}
                onChange={(e) => update('whatsappWebhookVerifyToken', e.target.value)}
                placeholder="Token para validar webhooks"
              />
            </div>
            <div>
              <Label>URL del webhook (para Meta)</Label>
              <Input value={webhookUrl} readOnly onFocus={(e) => e.currentTarget.select()} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Enviar prueba al número</Label>
              <Input
                value={testTargets.whatsapp}
                onChange={(e) => setTestTargets(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+18095551234"
              />
            </div>
            <Button type="button" variant="outline" disabled={testing !== null} onClick={() => handleTest('whatsapp')}>
              <Send className="mr-2 h-4 w-4" />
              {testing === 'whatsapp' ? 'Probando...' : 'Probar WhatsApp'}
            </Button>
          </div>
        </div>

        {/* ── Telegram ── */}
        <div className="rounded-lg border border-gray-200 p-4">
          <ChannelHeader
            icon={<Send className="h-5 w-5 text-sky-500" />}
            title="Telegram"
            description="Envía recordatorios desde tu propio bot de Telegram."
            enabled={settings.telegramEnabled}
            onToggle={(v) => update('telegramEnabled', v)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Token del bot *</Label>
              <Input
                type="password"
                value={settings.telegramBotToken}
                onChange={(e) => update('telegramBotToken', e.target.value)}
                placeholder="123456789:AAH..."
                autoComplete="new-password"
                required={settings.telegramEnabled}
              />
            </div>
            <div>
              <Label>Bot vinculado</Label>
              <Input value={settings.telegramBotUsername ? `@${settings.telegramBotUsername}` : 'Se detecta al guardar'} readOnly />
            </div>
            <div className="md:col-span-2 rounded-md bg-sky-50 p-3 text-xs text-sky-900">
              <p className="mb-1">1. En Telegram abre <strong>@BotFather</strong>, envía <code>/newbot</code> y copia el token.</p>
              <p className="mb-1">2. Pega el token, guarda y copia el enlace de vinculación de cada cliente desde su ficha.</p>
              <p>3. Cuando el cliente abra el enlace y pulse <strong>Iniciar</strong>, presiona «Sincronizar vínculos» aquí.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Enviar prueba al Chat ID (opcional)</Label>
              <Input
                value={testTargets.telegram}
                onChange={(e) => setTestTargets(prev => ({ ...prev, telegram: e.target.value }))}
                placeholder="Solo valida el token si lo dejas vacío"
              />
            </div>
            <Button type="button" variant="outline" disabled={testing !== null} onClick={() => handleTest('telegram')}>
              <Send className="mr-2 h-4 w-4" />
              {testing === 'telegram' ? 'Probando...' : 'Probar Telegram'}
            </Button>
            <Button type="button" variant="outline" disabled={isSyncing} onClick={handleSyncTelegram}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar vínculos
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Notificaciones'}
          </Button>
        </div>
      </form>
    </div>
  );
}
