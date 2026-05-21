export interface Employee {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  image?: string;
  schedule: string;
  workingDays: number[];
  status: 'available' | 'busy' | 'partially';
  color: string;
}

export interface Client {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  employeeId: number;
  notes?: string;
}

export interface Appointment {
  id: number;
  employeeId: number;
  employeeName: string;
  clientName: string;
  clientId: number;
  day: number;
  startHour: number;
  endHour: number;
  notes: string;
  zoomLink: string;
  color: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  triggerType: 'two_days_before' | 'today' | 'custom';
  isActive: boolean;
}

export interface BusinessInfo {
  name: string;
  address: string;
  businessHours: string;
  rnc: string;
}

export interface CalendarSync {
  googleConnected: boolean;
  googleEmail?: string;
  outlookConnected: boolean;
  outlookEmail?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailFromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  whatsappEnabled: boolean;
  whatsappBusinessPhone: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappAccessToken: string;
  whatsappWebhookVerifyToken: string;
}

export interface Config {
  notificationEmail: string;
  notificationSettings: NotificationSettings;
  emailTemplates: EmailTemplate[];
  businessInfo: BusinessInfo;
  calendarSync: CalendarSync;
}
