import React, { useState } from 'react';
import { Input } from './ui/input';
import { Search, User, Plus, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Employee, Client, Appointment } from '../types';
import { AddClientModal } from './AddClientModal';

interface SidebarProps {
  employees: Employee[];
  clients: Client[];
  appointments: Appointment[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedEmployee: number | 'all';
  setSelectedEmployee: (id: number | 'all') => void;
  onAddClient: () => void;
  showAddClientButton: boolean;
}

export function Sidebar({
  employees,
  clients,
  appointments,
  searchQuery,
  setSearchQuery,
  selectedEmployee,
  setSelectedEmployee,
  onAddClient,
  showAddClientButton
}: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'partially':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'partially':
        return 'Parcialmente disponible';
      default:
        return 'Desconocido';
    }
  };

  const selectedEmployeeData = selectedEmployee === 'all'
    ? null
    : employees.find(e => e.id === selectedEmployee);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 block">
            Filtrar por Empleado
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {selectedEmployeeData ? (
                  <>
                    <div className={`w-5 h-5 ${selectedEmployeeData.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-900 truncate">
                      {selectedEmployeeData.name} {selectedEmployeeData.lastName}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-700">Todos los Empleados</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 hover:bg-blue-50 transition-colors ${selectedEmployee === 'all' ? 'bg-blue-50' : ''}`}
                >
                  <span className="text-sm text-gray-900">Todos los Empleados</span>
                </button>
                {employees.map(employee => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmployee(employee.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2.5 hover:bg-blue-50 transition-colors ${selectedEmployee === employee.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`w-6 h-6 ${employee.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {employee.name} {employee.lastName}
                      </p>
                    </div>
                    <div className={`w-2 h-2 ${getStatusColor(employee.status)} rounded-full flex-shrink-0`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar empleados o clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">
            {selectedEmployee === 'all' ? `Empleados (${employees.length})` : 'Empleado Seleccionado'}
          </h3>

          <div className="space-y-2">
            {(selectedEmployee === 'all' ? employees : employees.filter(e => e.id === selectedEmployee)).map((employee) => (
              <div
                key={employee.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <div className={`w-10 h-10 ${employee.color} rounded-full flex items-center justify-center`}>
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(employee.status)} rounded-full border-2 border-white`}
                      title={getStatusText(employee.status)}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {employee.name} {employee.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getStatusText(employee.status)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddClientButton && selectedEmployee !== 'all' && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">
              Clientes Asignados ({clients.length})
            </h3>
            <div className="space-y-2 mb-3">
              {clients.map(client => (
                <div key={client.id} className="flex items-center p-2 bg-gray-50 rounded-lg text-sm">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{client.name} {client.lastName}</span>
                </div>
              ))}
            </div>
            <Button onClick={onAddClient} className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide">
              Leyenda de Estado
            </h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-xs text-gray-600">Parcialmente disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-xs text-gray-600">Ocupado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}