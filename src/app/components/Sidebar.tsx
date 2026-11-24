import React, { useState } from 'react';
import { Input } from './ui/input';
import { Search, User, Plus, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Employee, Client, Appointment } from '../types';
import { AddClientModal } from './AddClientModal';
import { useVocabulary } from '../context/VocabularyContext';

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
  const vocab = useVocabulary();
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
    <div className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
      <div className="space-y-3 border-b border-gray-200 p-3 sm:p-4">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 block">
            Filtrar por {vocab.employee.one}
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
                    {selectedEmployeeData.image ? (
                      <img
                        src={selectedEmployeeData.image}
                        alt={`${selectedEmployeeData.name} ${selectedEmployeeData.lastName}`}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-5 h-5 ${selectedEmployeeData.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <User className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <span className="text-sm text-gray-900 truncate">
                      {selectedEmployeeData.name} {selectedEmployeeData.lastName}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-700">{vocab.all(vocab.employee)} {vocab.employee.many}</span>
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
                  <span className="text-sm text-gray-900">{vocab.all(vocab.employee)} {vocab.employee.many}</span>
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
                    {employee.image ? (
                      <img
                        src={employee.image}
                        alt={`${employee.name} ${employee.lastName}`}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-6 h-6 ${employee.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <User className="h-3 w-3 text-white" />
                      </div>
                    )}
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
            placeholder={`Buscar ${vocab.employeesLower} o ${vocab.clientsLower}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="max-h-[18rem] flex-1 overflow-y-auto lg:max-h-none">
        <div className="p-3 sm:p-4">
          <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">
            {selectedEmployee === 'all' ? `${vocab.employee.many} (${employees.length})` : `${vocab.employee.one} ${vocab.selected(vocab.employee)}`}
          </h3>

          <div className="grid gap-2 sm:grid-cols-2 lg:block lg:space-y-2">
            {(selectedEmployee === 'all' ? employees : employees.filter(e => e.id === selectedEmployee)).map((employee) => (
              <div
                key={employee.id}
                className="flex items-center rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    {employee.image ? (
                      <img
                        src={employee.image}
                        alt={`${employee.name} ${employee.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 ${employee.color} rounded-full flex items-center justify-center`}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
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
          <div className="border-t border-gray-200 p-3 sm:p-4">
            <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">
              {vocab.client.many} {vocab.client.gender === 'f' ? 'Asignadas' : 'Asignados'} ({clients.length})
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
              Agregar {vocab.client.one}
            </Button>
          </div>
        )}

        <div className="border-t border-gray-200 bg-gray-50 p-3 sm:p-4">
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
