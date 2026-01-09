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
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Person } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService, TeacherCreate, TeacherUpdate } from '@/services/teacherService';
import { Teacher, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import TeacherAvailabilityEditor from '@/components/TeacherAvailabilityEditor';
import TeacherSelfAssignCourse from '@/components/TeacherSelfAssignCourse';

const initialFormData: TeacherCreate = {
  email: '',
  username: '',
  full_name: '',
  password: '',
  employee_code: '',
  phone: '',
  max_weekly_hours: 20,
};

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<TeacherCreate>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Verificar si el usuario es teacher
  const isTeacher = user?.role === UserRole.TEACHER;

  // Fetch teachers
  const { data: teachers, isLoading, refetch } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
  });

  // Obtener el teacher_id del usuario actual si es teacher
  const currentTeacher = teachers?.find((t) => t.user_id === user?.id);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: teacherService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al crear el docente');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeacherUpdate }) =>
      teacherService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al actualizar el docente');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: teacherService.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al eliminar el docente');
    },
  });

  const handleOpen = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        email: '',
        username: '',
        full_name: '',
        password: '',
        employee_code: teacher.employee_code,
        phone: teacher.phone || '',
        max_weekly_hours: teacher.max_weekly_hours,
      });
    } else {
      setEditingTeacher(null);
      setFormData(initialFormData);
    }
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTeacher(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingTeacher) {
      const updateData: TeacherUpdate = {
        employee_code: formData.employee_code,
        phone: formData.phone,
        max_weekly_hours: formData.max_weekly_hours,
      };
      updateMutation.mutate({ id: editingTeacher.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Esta seguro de eliminar este docente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (field: keyof TeacherCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAvailability = async (availabilities: any[]) => {
    if (!currentTeacher) return;
    // Por ahora solo mostramos un mensaje, necesitamos el endpoint del backend
    await teacherService.updateAvailability(currentTeacher.id, availabilities);
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Vista para teachers
  if (isTeacher && currentTeacher) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Mi Perfil de Docente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona tu disponibilidad horaria y asignación de cursos
          </Typography>
        </Box>

        {/* Información personal */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Información Personal</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo:
                </Typography>
                <Typography variant="body1">{user?.full_name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email:
                </Typography>
                <Typography variant="body1">{user?.email}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Código de Docente:
                </Typography>
                <Typography variant="body1">{currentTeacher.employee_code}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Teléfono:
                </Typography>
                <Typography variant="body1">{currentTeacher.phone || 'No registrado'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Máx. Horas Semanales:
                </Typography>
                <Typography variant="body1">{currentTeacher.max_weekly_hours}h</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs para disponibilidad y cursos */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
            <Tab label="Disponibilidad Horaria" />
            <Tab label="Mis Cursos" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Paper sx={{ p: 3 }}>
            <TeacherAvailabilityEditor
              teacherId={currentTeacher.id}
              availabilities={currentTeacher.availability || []}
              onSave={handleSaveAvailability}
            />
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <TeacherSelfAssignCourse teacherId={currentTeacher.id} />
          </Paper>
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestion de Docentes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Nuevo Docente
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
              <TableCell>Codigo</TableCell>
              <TableCell>ID Usuario</TableCell>
              <TableCell>Telefono</TableCell>
              <TableCell>Max Horas Semanales</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers && teachers.length > 0 ? (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.employee_code}</TableCell>
                  <TableCell>{teacher.user_id}</TableCell>
                  <TableCell>{teacher.phone || 'N/A'}</TableCell>
                  <TableCell>{teacher.max_weekly_hours}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(teacher)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay docentes registrados. Haga clic en "Nuevo Docente" para agregar uno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {!editingTeacher && (
              <>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Nombre de Usuario"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                  fullWidth
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
                  label="Contrasena"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  fullWidth
                />
              </>
            )}
            <TextField
              label="Codigo de Docente"
              value={formData.employee_code}
              onChange={(e) => handleChange('employee_code', e.target.value)}
              required
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Telefono"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Max Horas Semanales"
              type="number"
              value={formData.max_weekly_hours}
              onChange={(e) => handleChange('max_weekly_hours', parseInt(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 1, max: 40 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.employee_code ||
              (!editingTeacher && (!formData.email || !formData.username || !formData.full_name || !formData.password)) ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : editingTeacher
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
