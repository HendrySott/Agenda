import { toast } from 'sonner';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Save, ArrowLeft, Camera, Eye, EyeOff, Loader2, UserPlus, Trash2, Power, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountAccessUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
}

export function AccountPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    companyName: user?.companyName || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.image || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [accessUsers, setAccessUsers] = useState<AccountAccessUser[]>([]);
  const [accessForm, setAccessForm] = useState({ name: '', lastName: '', email: '' });
  const [loadingAccessUsers, setLoadingAccessUsers] = useState(false);
  const [savingAccessUser, setSavingAccessUser] = useState(false);
  const [lastDefaultPassword, setLastDefaultPassword] = useState('');
  const canManageAccessUsers = !!user?.isMainAccount;

  useEffect(() => {
    if (!canManageAccessUsers) return;

    setLoadingAccessUsers(true);
    api.getAccountUsers()
      .then(setAccessUsers)
      .catch((err: any) => showMessage(err.message, 'error'))
      .finally(() => setLoadingAccessUsers(false));
  }, [canManageAccessUsers]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(text);
    else toast.error(text);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('Solo se permiten archivos de imagen', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('La imagen no debe superar los 2MB', 'error');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = async () => {
    if (!avatar) return;
    setSavingAvatar(true);
    try {
      const { user: updatedUser, token } = await api.updateAvatar(avatar);
      updateUser(updatedUser, token);
      setAvatarFile(null);
      showMessage('Foto de perfil actualizada', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user: updatedUser, token } = await api.updateAccount(form);
      updateUser(updatedUser, token);
      showMessage('Cuenta actualizada correctamente', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showMessage('Debes ingresar tu contraseña actual', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const { user: updatedUser, token } = await api.updateAccount({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      updateUser(updatedUser, token);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('Contraseña actualizada correctamente', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAccessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessForm({ ...accessForm, [e.target.name]: e.target.value });
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccessUser(true);
    setLastDefaultPassword('');

    try {
      const { user: createdUser, defaultPassword } = await api.createAccountUser(accessForm);
      setAccessUsers(prev => [...prev, createdUser]);
      setAccessForm({ name: '', lastName: '', email: '' });
      setLastDefaultPassword(defaultPassword);
      showMessage('Usuario agregado correctamente', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSavingAccessUser(false);
    }
  };

  const handleToggleAccessUser = async (accessUser: AccountAccessUser) => {
    try {
      const updated = await api.updateAccountUserStatus(accessUser.id, !accessUser.isActive);
      setAccessUsers(prev => prev.map(item => item.id === updated.id ? updated : item));
      showMessage(updated.isActive ? 'Usuario activado' : 'Usuario deshabilitado', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteAccessUser = async (accessUser: AccountAccessUser) => {
    if (!confirm(`¿Eliminar el acceso de ${accessUser.name} ${accessUser.lastName}?`)) return;

    try {
      await api.deleteAccountUser(accessUser.id);
      setAccessUsers(prev => prev.filter(item => item.id !== accessUser.id));
      showMessage('Usuario eliminado', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-3 sm:p-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center mb-2">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl text-gray-900 sm:text-3xl">Administrar Cuenta</h1>
        </div>
        <p className="text-gray-600">Actualiza tus datos personales, foto de perfil y contraseña</p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            {avatar ? (
              <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-100 border-2 border-gray-200 flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-700">
                  {(user?.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow hover:bg-blue-700"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || ''} {user?.lastName || ''}
            </p>
            <p className="text-xs text-gray-500">JPG, PNG o GIF. Máximo 2MB.</p>
            {avatarFile && (
              <Button
                size="sm"
                onClick={handleAvatarSave}
                disabled={savingAvatar}
                className="mt-1"
              >
                {savingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Guardar foto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
          <CardDescription>Actualiza tus datos personales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellido</label>
                <Input name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
              <Input name="companyName" value={form.companyName} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Ingresa tu contraseña actual y una nueva</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña actual</label>
              <div className="relative">
                <Input
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
              <div className="relative">
                <Input
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

            {canManageAccessUsers && (
        <Card>
          <CardHeader>
            <CardTitle>Usuarios con acceso</CardTitle>
            <CardDescription>
              Agrega usuarios que podrán entrar y trabajar con todos los registros de esta cuenta principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <Input name="name" value={accessForm.name} onChange={handleAccessChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido</label>
                  <Input name="lastName" value={accessForm.lastName} onChange={handleAccessChange} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input name="email" type="email" value={accessForm.email} onChange={handleAccessChange} required />
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                Se generará una contraseña temporal aleatoria. Se mostrará una sola vez al crear el acceso: cópiala y compártela con la persona.
              </div>
              {lastDefaultPassword && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  Contraseña temporal del último acceso creado (cópiala ahora): <span className="font-medium">{lastDefaultPassword}</span>
                </div>
              )}
              <Button type="submit" disabled={savingAccessUser} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
                {savingAccessUser ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Agregar usuario
              </Button>
            </form>

            <div className="space-y-3 border-t pt-5">
              {loadingAccessUsers ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando usuarios...
                </div>
              ) : accessUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                  No hay usuarios adicionales agregados.
                </div>
              ) : (
                accessUsers.map(accessUser => (
                  <div key={accessUser.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {accessUser.name} {accessUser.lastName}
                        </p>
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          accessUser.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {accessUser.isActive ? 'Activo' : 'Deshabilitado'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-500">{accessUser.email}</p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAccessUser(accessUser)}
                      >
                        {accessUser.isActive ? (
                          <PowerOff className="h-4 w-4 mr-2" />
                        ) : (
                          <Power className="h-4 w-4 mr-2" />
                        )}
                        {accessUser.isActive ? 'Deshabilitar' : 'Activar'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        title="Eliminar acceso" aria-label="Eliminar acceso"
                        onClick={() => handleDeleteAccessUser(accessUser)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
