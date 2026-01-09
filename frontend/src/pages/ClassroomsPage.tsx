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
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomService } from '@/services/classroomService';
import { Classroom, ClassroomCreate, ClassroomType } from '@/types';

const classroomTypeLabels: Record<ClassroomType, string> = {
  [ClassroomType.THEORY]: 'Teoria',
  [ClassroomType.PRACTICE]: 'Practica',
  [ClassroomType.LAB]: 'Laboratorio',
  [ClassroomType.AUDITORIUM]: 'Auditorio',
};

const initialFormData: ClassroomCreate = {
  code: '',
  name: '',
  building: '',
  floor: 1,
  capacity: 0,
  classroom_type: ClassroomType.THEORY,
  equipment: '',
  is_available: true,
};

export default function ClassroomsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [formData, setFormData] = useState<ClassroomCreate>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  // Fetch classrooms
  const { data: classrooms, isLoading, refetch } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomService.getClassrooms(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: classroomService.createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al crear el aula');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClassroomCreate> }) =>
      classroomService.updateClassroom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al actualizar el aula');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: classroomService.deleteClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al eliminar el aula');
    },
  });

  const handleOpen = (classroom?: Classroom) => {
    if (classroom) {
      setEditingClassroom(classroom);
      setFormData({
        code: classroom.code,
        name: classroom.name,
        building: classroom.building || '',
        floor: classroom.floor || 1,
        capacity: classroom.capacity,
        classroom_type: classroom.classroom_type,
        equipment: classroom.equipment || '',
        is_available: classroom.is_available,
      });
    } else {
      setEditingClassroom(null);
      setFormData(initialFormData);
    }
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingClassroom(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingClassroom) {
      updateMutation.mutate({ id: editingClassroom.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Esta seguro de eliminar esta aula?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (field: keyof ClassroomCreate, value: any) => {
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
          Gestion de Aulas
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
            Nueva Aula
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
              <TableCell>Nombre</TableCell>
              <TableCell>Edificio</TableCell>
              <TableCell>Piso</TableCell>
              <TableCell>Capacidad</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Disponible</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classrooms && classrooms.length > 0 ? (
              classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell>{classroom.code}</TableCell>
                  <TableCell>{classroom.name}</TableCell>
                  <TableCell>{classroom.building || 'N/A'}</TableCell>
                  <TableCell>{classroom.floor || 'N/A'}</TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>
                    <Chip
                      label={classroomTypeLabels[classroom.classroom_type]}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={classroom.is_available ? 'Si' : 'No'}
                      size="small"
                      color={classroom.is_available ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(classroom)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(classroom.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay aulas registradas. Haga clic en "Nueva Aula" para agregar una.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClassroom ? 'Editar Aula' : 'Nueva Aula'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Codigo"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Edificio"
              value={formData.building}
              onChange={(e) => handleChange('building', e.target.value)}
              fullWidth
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Piso"
              type="number"
              value={formData.floor}
              onChange={(e) => handleChange('floor', parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 1, max: 20 }}
            />
            <TextField
              label="Capacidad"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 1 }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Aula</InputLabel>
              <Select
                value={formData.classroom_type}
                onChange={(e) => handleChange('classroom_type', e.target.value)}
                label="Tipo de Aula"
              >
                {Object.entries(classroomTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Equipamiento"
              value={formData.equipment}
              onChange={(e) => handleChange('equipment', e.target.value)}
              fullWidth
              multiline
              rows={2}
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <FormControl fullWidth>
              <InputLabel>Disponible</InputLabel>
              <Select
                value={formData.is_available ? 'true' : 'false'}
                onChange={(e) => handleChange('is_available', e.target.value === 'true')}
                label="Disponible"
              >
                <MenuItem value="true">Si</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.code ||
              !formData.name ||
              !formData.capacity ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : editingClassroom
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
