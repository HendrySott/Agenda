import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  UserCircle,
  Bell,
  Mail,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppFooter } from '@/components/AppFooter';

const features = [
  {
    icon: Calendar,
    title: 'Calendario Inteligente',
    desc: 'Vista semanal y diaria de todas tus citas con colores y arrastrar y soltar.',
  },
  {
    icon: Users,
    title: 'Gestión de Empleados',
    desc: 'Administra horarios, días laborales y disponibilidad de tu equipo.',
  },
  {
    icon: UserCircle,
    title: 'Gestión de Clientes',
    desc: 'Registra clientes, asígnalos a empleados y guarda su historial.',
  },
  {
    icon: Bell,
    title: 'Recordatorios por Email',
    desc: 'Notifica automáticamente a tus clientes antes de sus citas.',
  },
  {
    icon: MessageSquare,
    title: 'Notificaciones WhatsApp',
    desc: 'Envía recordatorios y confirmaciones directamente a WhatsApp.',
  },
  {
    icon: Mail,
    title: 'Plantillas de Correo',
    desc: 'Personaliza mensajes con tu marca para cada tipo de recordatorio.',
  },
];

const stats = [
  { value: '10k+', label: 'Citas gestionadas' },
  { value: '500+', label: 'Negocios activos' },
  { value: '98%', label: 'Satisfacción' },
  { value: '24/7', label: 'Soporte' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Calendar className="size-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Admone</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} className="px-2 sm:px-4">
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg sm:px-4"
            >
              <span className="hidden sm:inline">Registrarse Gratis</span>
              <span className="sm:hidden">Registro</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 size-[500px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 size-[400px] bg-indigo-400/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Clock className="size-4" />
            La plataforma #1 para gestionar tu negocio
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Tu agenda profesional{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg md:text-xl">
            Organiza citas, empleados y clientes. Envía recordatorios por email y WhatsApp.
            Todo lo que necesitas para hacer crecer tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
            >
              Comenzar Gratis
              <ArrowRight className="size-4" />
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base border-gray-300"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

   

      {/* ─── Features ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Todo lo que tu negocio necesita
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Una plataforma completa para gestionar tu agenda, equipo y clientes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="size-11 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                    <Icon className="size-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            ¿Listo para optimizar tu negocio?
          </h2>
          <p className="text-gray-400 mb-10 max-w-lg mx-auto">
            Regístrate gratis y comienza a gestionar tus citas, empleados y clientes en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-base"
            >
              Crear Cuenta Gratis
              <ArrowRight className="size-4" />
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-8 py-6 text-base"
            >
              Iniciar Sesión
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-green-400" />
              Sin tarjeta de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-green-400" />
              Cancelación gratis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-green-400" />
              Soporte 24/7
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <AppFooter className="border-t border-gray-100 py-8" />
    </div>
  );
}
