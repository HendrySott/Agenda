import React from 'react';
import { CalendarDays, ExternalLink, Info, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const APP_VERSION = '0.0.1';

const details = [
  {
    icon: CalendarDays,
    title: 'Panel de agenda',
    text: 'Organiza citas en vistas semanales y diarias para que el equipo pueda ver disponibilidad, clientes y horarios reservados en un solo lugar.',
  },
  {
    icon: Users,
    title: 'Registros de equipo y clientes',
    text: 'Mantiene empleados, clientes y citas conectados bajo la misma cuenta de negocio.',
  },
  {
    icon: ShieldCheck,
    title: 'Acceso compartido',
    text: 'Permite que la cuenta principal agregue usuarios adicionales con acceso a los mismos registros cuando están activos.',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl text-gray-900 sm:text-3xl">Acerca de Admone</h1>
            <p className="text-sm text-gray-500">Versión {APP_VERSION}</p>
          </div>
        </div>

        <p className="max-w-3xl text-gray-600">
          Admone es un panel de agenda y gestión de negocio creado para ayudar a equipos de servicios a administrar
          citas, empleados, clientes, recordatorios y accesos desde un espacio práctico de trabajo.
        </p>

        <div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href="https://hsott.dev" target="_blank" rel="noopener noreferrer">
              Visitar hsott.dev
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creado por HSott</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600">
          <p>
            Este proyecto está creado para equipos pequeños y negocios basados en citas que necesitan una forma simple
            de mantener organizada la agenda, los clientes y la información del personal.
          </p>
          <p>
            Conoce más sobre el creador y otros trabajos en{' '}
            <a
              href="https://hsott.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline-offset-4 hover:underline"
            >
              hsott.dev
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
