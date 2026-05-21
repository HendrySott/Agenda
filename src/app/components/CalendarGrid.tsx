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
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] border-b border-gray-200 sm:grid-cols-2">
          <div className="bg-gray-50 p-3 sm:p-4">
            <h2 className="text-base text-gray-900 sm:text-lg">{days[currentDay]}</h2>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4">
            <h3 className="text-sm text-gray-600">Citas</h3>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
          {hours.map((hour) => {
            const slotAppointments = getAppointmentsForSlot(currentDay, hour);

            return (
              <div key={hour} className="grid min-h-[4rem] grid-cols-[7rem_minmax(0,1fr)] border-b border-gray-100 sm:grid-cols-2">
                <div className="flex items-center border-r border-gray-200 bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">{formatHour(hour)}</span>
                </div>
                <div className="flex min-w-0 flex-col space-y-1 p-2">
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="border-r border-gray-200 bg-gray-50 p-3 sm:p-4">
              <span className="text-sm text-gray-600">Hora</span>
            </div>
            {days.map((day) => (
              <div key={day} className="border-r border-gray-200 bg-gray-50 p-3 last:border-r-0 sm:p-4">
                <h3 className="text-sm text-gray-900">{day}</h3>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
            {hours.map((hour) => (
              <div key={hour} className="grid min-h-[4rem] grid-cols-8 border-b border-gray-100">
                <div className="flex items-center border-r border-gray-200 bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">{formatHour(hour)}</span>
                </div>
                {days.map((_, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(dayIndex, hour);

                  return (
                    <div
                      key={dayIndex}
                      className="flex min-h-[4rem] min-w-0 flex-col space-y-1 border-r border-gray-200 p-2 last:border-r-0"
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
      </div>
    </div>
  );
}
