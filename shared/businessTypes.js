// Catálogo de tipos de negocio compartido entre servidor y frontend.
// Cada tipo define el vocabulario que se usa en toda la aplicación
// (empleado, cliente, cita) y las plantillas de recordatorio por defecto.
//
// gender: 'm' | 'f'  -> permite concordar artículos ("Nuevo paciente", "Nueva clase").

const noun = (one, many, gender) => ({ one, many, gender });

export const BUSINESS_TYPES = [
  {
    id: 'general',
    label: 'Servicios generales',
    description: 'Cualquier negocio que trabaja con citas',
    employee: noun('Empleado', 'Empleados', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Cita', 'Citas', 'f'),
    placeholderBusiness: 'Ej: Mi Negocio SRL',
  },
  {
    id: 'salon',
    label: 'Salón de belleza / Barbería',
    description: 'Cortes, peinados, uñas y estética',
    employee: noun('Estilista', 'Estilistas', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Cita', 'Citas', 'f'),
    placeholderBusiness: 'Ej: Salón Bella Vista',
  },
  {
    id: 'spa',
    label: 'Spa / Estética y masajes',
    description: 'Masajes, tratamientos y bienestar',
    employee: noun('Terapeuta', 'Terapeutas', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Cita', 'Citas', 'f'),
    placeholderBusiness: 'Ej: Spa Armonía',
  },
  {
    id: 'clinic',
    label: 'Clínica / Consultorio médico',
    description: 'Consultas médicas y especialidades',
    employee: noun('Doctor', 'Doctores', 'm'),
    client: noun('Paciente', 'Pacientes', 'm'),
    appointment: noun('Consulta', 'Consultas', 'f'),
    placeholderBusiness: 'Ej: Centro Médico Salud',
  },
  {
    id: 'dental',
    label: 'Clínica dental',
    description: 'Odontología y ortodoncia',
    employee: noun('Odontólogo', 'Odontólogos', 'm'),
    client: noun('Paciente', 'Pacientes', 'm'),
    appointment: noun('Cita', 'Citas', 'f'),
    placeholderBusiness: 'Ej: Clínica Dental Sonrisa',
  },
  {
    id: 'psychology',
    label: 'Psicología / Terapia',
    description: 'Sesiones de terapia y acompañamiento',
    employee: noun('Terapeuta', 'Terapeutas', 'm'),
    client: noun('Paciente', 'Pacientes', 'm'),
    appointment: noun('Sesión', 'Sesiones', 'f'),
    placeholderBusiness: 'Ej: Centro de Psicología Equilibrio',
  },
  {
    id: 'veterinary',
    label: 'Veterinaria',
    description: 'Consultas y cuidado de mascotas',
    employee: noun('Veterinario', 'Veterinarios', 'm'),
    client: noun('Paciente', 'Pacientes', 'm'),
    appointment: noun('Consulta', 'Consultas', 'f'),
    placeholderBusiness: 'Ej: Veterinaria Patitas',
  },
  {
    id: 'education',
    label: 'Centro educativo / Tutorías',
    description: 'Clases, tutorías y academias',
    employee: noun('Tutor', 'Tutores', 'm'),
    client: noun('Estudiante', 'Estudiantes', 'm'),
    appointment: noun('Clase', 'Clases', 'f'),
    placeholderBusiness: 'Ej: Centro de Tutoría Académica',
  },
  {
    id: 'fitness',
    label: 'Gimnasio / Entrenamiento',
    description: 'Entrenamiento personal y clases deportivas',
    employee: noun('Entrenador', 'Entrenadores', 'm'),
    client: noun('Miembro', 'Miembros', 'm'),
    appointment: noun('Sesión', 'Sesiones', 'f'),
    placeholderBusiness: 'Ej: Gimnasio Fuerza Total',
  },
  {
    id: 'legal',
    label: 'Bufete / Asesoría legal',
    description: 'Consultas legales y reuniones con clientes',
    employee: noun('Abogado', 'Abogados', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Reunión', 'Reuniones', 'f'),
    placeholderBusiness: 'Ej: Bufete Pérez & Asociados',
  },
  {
    id: 'consulting',
    label: 'Consultoría / Servicios profesionales',
    description: 'Contabilidad, consultoría y asesoría',
    employee: noun('Consultor', 'Consultores', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Reunión', 'Reuniones', 'f'),
    placeholderBusiness: 'Ej: Consultores Asociados SRL',
  },
  {
    id: 'automotive',
    label: 'Taller mecánico / Automotriz',
    description: 'Servicio, mantenimiento y reparación',
    employee: noun('Técnico', 'Técnicos', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Servicio', 'Servicios', 'm'),
    placeholderBusiness: 'Ej: Taller AutoServicio',
  },
  {
    id: 'other',
    label: 'Otro (especificar)',
    description: 'Indica tú mismo el tipo de negocio',
    employee: noun('Empleado', 'Empleados', 'm'),
    client: noun('Cliente', 'Clientes', 'm'),
    appointment: noun('Cita', 'Citas', 'f'),
    placeholderBusiness: 'Ej: Mi Negocio SRL',
  },
];

export const DEFAULT_BUSINESS_TYPE = 'general';

export function isValidBusinessType(id) {
  return BUSINESS_TYPES.some(t => t.id === id);
}

export function getBusinessType(id) {
  return BUSINESS_TYPES.find(t => t.id === id) || BUSINESS_TYPES.find(t => t.id === DEFAULT_BUSINESS_TYPE);
}

/** Nombre legible del tipo ("Otro" usa el texto que escribió el usuario). */
export function getBusinessTypeLabel(id, customLabel) {
  if (id === 'other' && customLabel && customLabel.trim()) return customLabel.trim();
  return getBusinessType(id).label;
}

const lower = (s) => s.toLowerCase();

/**
 * Vocabulario listo para usar en textos de interfaz y mensajes.
 * Ej.: vocab.new(vocab.client) -> "Nuevo paciente" / vocab.all(vocab.appointment) -> "Todas las citas"
 */
export function buildVocabulary(typeId) {
  const type = getBusinessType(typeId);
  const { employee, client, appointment } = type;
  const isF = (n) => n.gender === 'f';
  return {
    typeId: type.id,
    employee,
    client,
    appointment,
    // Formas en minúscula para usar dentro de frases
    employeeLower: lower(employee.one),
    employeesLower: lower(employee.many),
    clientLower: lower(client.one),
    clientsLower: lower(client.many),
    appointmentLower: lower(appointment.one),
    appointmentsLower: lower(appointment.many),
    // Concordancia de género
    new: (n) => (isF(n) ? 'Nueva' : 'Nuevo'),
    all: (n) => (isF(n) ? 'Todas las' : 'Todos los'),
    this: (n) => (isF(n) ? 'esta' : 'este'),
    the: (n) => (isF(n) ? 'la' : 'el'),
    assigned: (n) => (isF(n) ? 'asignada' : 'asignado'),
    selected: (n) => (isF(n) ? 'Seleccionada' : 'Seleccionado'),
  };
}

/** Plantillas de recordatorio por defecto, adaptadas al tipo de negocio. */
export function buildDefaultTemplates(typeId) {
  const v = buildVocabulary(typeId);
  const cita = v.appointmentLower;
  const the = v.the(v.appointment);
  const sinceTitle = cita.charAt(0).toUpperCase() + cita.slice(1);
  return [
    {
      name: `Recordatorio 2 días antes`,
      triggerType: 'two_days_before',
      isActive: true,
      subject: `Recordatorio de tu ${cita} en {{negocio_nombre}}`,
      body:
        `Hola {{cliente_nombre}},\n\n` +
        `Te recordamos que tienes ${v.appointment.gender === 'f' ? 'una' : 'un'} ${cita} programad${v.appointment.gender === 'f' ? 'a' : 'o'} ` +
        `para el {{fecha_cita}} a las {{hora_cita}} con {{empleado_nombre}}.\n\n` +
        `Dirección: {{negocio_direccion}}\n\n` +
        `Si necesitas reprogramar ${the} ${cita}, respóndenos con anticipación.\n\n` +
        `Saludos,\n{{negocio_nombre}}`,
    },
    {
      name: `Recordatorio el mismo día`,
      triggerType: 'today',
      isActive: true,
      subject: `${sinceTitle} de hoy en {{negocio_nombre}}`,
      body:
        `Hola {{cliente_nombre}},\n\n` +
        `Hoy tienes ${v.appointment.gender === 'f' ? 'una' : 'un'} ${cita} a las {{hora_cita}} con {{empleado_nombre}}.\n\n` +
        `Dirección: {{negocio_direccion}}\n\n` +
        `¡Te esperamos!\n{{negocio_nombre}}`,
    },
  ];
}
