import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CalendarSync as CalendarSyncType } from '../../types';

interface CalendarSyncProps {
  calendarSync: CalendarSyncType;
  onUpdate: (sync: CalendarSyncType) => void;
}

export function CalendarSync({ calendarSync, onUpdate }: CalendarSyncProps) {
  const [isConnecting, setIsConnecting] = useState<'google' | 'outlook' | null>(null);

  const handleConnectGoogle = () => {
    setIsConnecting('google');

    // Simular conexión con Google Calendar
    setTimeout(() => {
      const email = prompt('Ingrese su email de Google:');
      if (email) {
        onUpdate({
          ...calendarSync,
          googleConnected: true,
          googleEmail: email
        });
        alert('✓ Google Calendar conectado correctamente');
      }
      setIsConnecting(null);
    }, 500);
  };

  const handleDisconnectGoogle = () => {
    if (confirm('¿Está seguro de desconectar Google Calendar?')) {
      onUpdate({
        ...calendarSync,
        googleConnected: false,
        googleEmail: undefined
      });
      alert('Google Calendar desconectado');
    }
  };

  const handleConnectOutlook = () => {
    setIsConnecting('outlook');

    // Simular conexión con Outlook Calendar
    setTimeout(() => {
      const email = prompt('Ingrese su email de Outlook:');
      if (email) {
        onUpdate({
          ...calendarSync,
          outlookConnected: true,
          outlookEmail: email
        });
        alert('✓ Outlook Calendar conectado correctamente');
      }
      setIsConnecting(null);
    }, 500);
  };

  const handleDisconnectOutlook = () => {
    if (confirm('¿Está seguro de desconectar Outlook Calendar?')) {
      onUpdate({
        ...calendarSync,
        outlookConnected: false,
        outlookEmail: undefined
      });
      alert('Outlook Calendar desconectado');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl text-gray-900">Sincronización de Calendario</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Conecta tu cuenta de Google o Outlook para sincronizar automáticamente las citas con tu calendario
      </p>

      <div className="space-y-4">
        {/* Google Calendar */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900">Google Calendar</h3>
                {calendarSync.googleConnected ? (
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Conectado: {calendarSync.googleEmail}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>No conectado</span>
                  </div>
                )}
              </div>
            </div>
            {calendarSync.googleConnected ? (
              <Button
                onClick={handleDisconnectGoogle}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isConnecting === 'google'}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting === 'google' ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M23 7.5V16c0 1.38-1.12 2.5-2.5 2.5h-17C2.12 18.5 1 17.38 1 16V7.5L12 13l11-5.5z"/>
                  <path fill="#0078D4" d="M1 7.5V8c0-1.38 1.12-2.5 2.5-2.5h17C21.88 5.5 23 6.62 23 8v-.5L12 2 1 7.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900">Outlook Calendar</h3>
                {calendarSync.outlookConnected ? (
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Conectado: {calendarSync.outlookEmail}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>No conectado</span>
                  </div>
                )}
              </div>
            </div>
            {calendarSync.outlookConnected ? (
              <Button
                onClick={handleDisconnectOutlook}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={handleConnectOutlook}
                disabled={isConnecting === 'outlook'}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting === 'outlook' ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="mb-2">
              <strong>Beneficios de la sincronización:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Las citas se agregan automáticamente a tu calendario</li>
              <li>Recibe recordatorios en tu dispositivo móvil</li>
              <li>Visualiza todas tus citas en un solo lugar</li>
              <li>Evita conflictos de horario</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
