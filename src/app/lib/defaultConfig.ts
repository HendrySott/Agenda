import { Config } from '../types';

export const DEFAULT_CONFIG: Config = {
  notificationEmail: '',
  notificationSettings: {
    emailEnabled: true,
    emailFromName: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    whatsappEnabled: false,
    whatsappBusinessPhone: '',
    whatsappPhoneNumberId: '',
    whatsappBusinessAccountId: '',
    whatsappAccessToken: '',
    whatsappWebhookVerifyToken: '',
    whatsappTemplateName: '',
    whatsappTemplateLang: 'es',
    phoneCountryCode: '1',
    telegramEnabled: false,
    telegramBotToken: '',
    telegramBotUsername: '',
  },
  emailTemplates: [],
  businessInfo: { name: '', address: '', businessHours: '', rnc: '', type: 'general', typeLabel: '' },
  calendarSync: { googleConnected: false, outlookConnected: false },
};
