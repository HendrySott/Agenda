import React from 'react';
import { AppointmentCard } from './AppointmentCard';
import { Appointment } from '../types';

interface CalendarGridProps {
  appointments: Appointment[];
  viewMode: string;
  currentWeek: Date;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function CalendarGrid({
  appointments,
  viewMode,
  currentWeek,
  onAppointmentClick
}: CalendarGridProps) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
  };

  const getAppointmentsForSlot = (day: number, hour: number) => {
    return appointments.filter(apt =>
      apt.day === day &&
      hour >= apt.startHour &&
      hour < apt.endHour
    );
  };

  if (viewMode === 'daily') {
    // For daily view, show only the current day
    const currentDay = new Date(currentWeek).getDay();

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 border-b border-gray-200">
          <div className="p-4 bg-gray-50">
            <h2 className="text-lg text-gray-900">{days[currentDay]}</h2>
          </div>
          <div className="p-4 bg-gray-50">
            <h3 className="text-sm text-gray-600">Citas</h3>
          </div>
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {hours.map((hour) => {
            const slotAppointments = getAppointmentsForSlot(currentDay, hour);

            return (
              <div key={hour} className="grid grid-cols-2 border-b border-gray-100 min-h-[4rem]">
                <div className="p-3 bg-gray-50 border-r border-gray-200 flex items-center">
                  <span className="text-sm text-gray-600">{formatHour(hour)}</span>
                </div>
                <div className="p-2 flex flex-col space-y-1">
                  {slotAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Weekly view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-4 bg-gray-50 border-r border-gray-200">
          <span className="text-sm text-gray-600">Hora</span>
        </div>
        {days.map((day, index) => (
          <div key={day} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0">
            <h3 className="text-sm text-gray-900">{day}</h3>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[4rem]">
            <div className="p-3 bg-gray-50 border-r border-gray-200 flex items-center">
              <span className="text-sm text-gray-600">{formatHour(hour)}</span>
            </div>
            {days.map((_, dayIndex) => {
              const slotAppointments = getAppointmentsForSlot(dayIndex, hour);

              return (
                <div
                  key={dayIndex}
                  className="p-2 border-r border-gray-200 last:border-r-0 min-h-[4rem] flex flex-col space-y-1"
                >
                  {slotAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
