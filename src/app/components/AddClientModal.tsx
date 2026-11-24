import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus } from 'lucide-react';
import { Client } from '../types';
import { toast } from 'sonner';
import { useVocabulary } from '../context/VocabularyContext';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (client: Omit<Client, 'id' | 'employeeId'>) => Promise<boolean> | boolean | void;
}

export function AddClientModal({ isOpen, onClose, onAdd }: AddClientModalProps) {
  const vocab = useVocabulary();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    const ok = await onAdd(formData);
    if (ok === false) return;

    // Reset form
    setFormData({
      name: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });

    onClose();
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar {vocab.new(vocab.client)} {vocab.client.one}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre"
                required
              />
            </div>
            <div>
              <Label>Apellido *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div>
            <Label>Correo Electrónico *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <Label>Teléfono *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+18095551234"
              required
            />
          </div>

          <div>
            <Label>Dirección</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Agregar {vocab.client.one}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
