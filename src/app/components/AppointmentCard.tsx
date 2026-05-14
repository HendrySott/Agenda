import React from 'react';
import { Clock } from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const timeRange = `${formatTime(appointment.startHour)} - ${formatTime(appointment.endHour)}`;

  return (
    <div
      onClick={onClick}
      className={`${appointment.color} rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity shadow-sm text-white text-xs`}
    >
      <div className="space-y-1">
        <div className="truncate">
          <span className="block truncate">{appointment.employeeName}</span>
        </div>
        <div className="truncate">
          <span className="block truncate opacity-90">{appointment.clientName}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-80">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{timeRange}</span>
        </div>
      </div>
    </div>
  );
}
