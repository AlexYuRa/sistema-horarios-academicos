import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserCreate, UserUpdate } from '@/services/userService';
import { User, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrador',
  [UserRole.COORDINATOR]: 'Coordinador',
  [UserRole.ASSISTANT]: 'Asistente',
  [UserRole.TEACHER]: 'Docente',
  [UserRole.STUDENT]: 'Estudiante',
};

const roleColors: Record<UserRole, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  [UserRole.SUPER_ADMIN]: 'error',
  [UserRole.COORDINATOR]: 'warning',
  [UserRole.ASSISTANT]: 'info',
  [UserRole.TEACHER]: 'success',
  [UserRole.STUDENT]: 'default',
};

const initialFormData: UserCreate = {
  email: '',
  username: '',
  full_name: '',
  password: '',
  role: UserRole.STUDENT,
  is_active: true,
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserCreate>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [, setShowPassword] = useState(false);

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al crear el usuario');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al actualizar el usuario');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al eliminar el usuario');
    },
  });

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        password: '',
        role: user.role,
        is_active: user.is_active,
      });
      setShowPassword(false);
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
      setShowPassword(false);
    }
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
    setShowPassword(false);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingUser) {
      const updateData: UserUpdate = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        is_active: formData.is_active,
      };
      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (field: keyof UserCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Usuarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[user.role]}
                      size="small"
                      color={roleColors[user.role]}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.is_active ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={user.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay usuarios registrados. Haga clic en "Nuevo Usuario" para agregar uno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre de Usuario"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
              fullWidth
              disabled={!!editingUser}
              helperText={editingUser ? 'El username no se puede cambiar' : ''}
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Nombre Completo"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                label="Rol"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={!editingUser}
              fullWidth
              helperText={
                editingUser
                  ? 'Solo completar si desea cambiar la contraseña'
                  : 'Mínimo 8 caracteres'
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
              }
              label="Usuario Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.username ||
              !formData.email ||
              !formData.full_name ||
              (!editingUser && !formData.password) ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : editingUser
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
