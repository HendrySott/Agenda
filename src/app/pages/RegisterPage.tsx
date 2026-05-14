import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', lastName: '', companyName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>Registra tu negocio para comenzar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="Juan" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellido</label>
                <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Pérez" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
              <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Mi Empresa SRL" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
