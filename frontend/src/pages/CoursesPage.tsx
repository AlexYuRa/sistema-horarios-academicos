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
import { Add, Edit, Delete, Refresh, PersonAdd } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '@/services/courseService';
import { Course, CourseCreate, CourseType } from '@/types';
import AssignTeacherDialog from '@/components/AssignTeacherDialog';

const courseTypeLabels: Record<CourseType, string> = {
  [CourseType.THEORY]: 'Teoria',
  [CourseType.PRACTICE]: 'Practica',
  [CourseType.LAB]: 'Laboratorio',
  [CourseType.THEORY_PRACTICE]: 'Teoria-Practica',
};

const initialFormData: CourseCreate = {
  code: '',
  name: '',
  cycle: 1,
  credits: 0,
  theory_hours: 2,
  practice_hours: 0,
  course_type: CourseType.THEORY,
};

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseCreate>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [labHours, setLabHours] = useState<number>(0);

  // Estado para asignar docente
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<Course | null>(null);

  // Fetch courses
  const { data: courses, isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: courseService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al crear el curso');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CourseCreate> }) =>
      courseService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      handleClose();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al actualizar el curso');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: courseService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al eliminar el curso');
    },
  });

  // Assign teacher mutation
  const assignTeacherMutation = useMutation({
    mutationFn: ({ courseId, teacherId }: { courseId: number; teacherId: number | null }) =>
      courseService.updateCourse(courseId, { teacher_id: teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setAssignTeacherOpen(false);
      setCourseToAssign(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al asignar docente');
    },
  });

  const handleOpen = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        code: course.code,
        name: course.name,
        cycle: course.cycle,
        credits: course.credits,
        theory_hours: course.theory_hours,
        practice_hours: course.practice_hours,
        course_type: course.course_type,
        teacher_id: course.teacher_id,
      });
      // Por ahora no tenemos campo de laboratorio en el backend, asi que lo inicializamos en 0
      setLabHours(0);
    } else {
      setEditingCourse(null);
      setFormData(initialFormData);
      setLabHours(0);
    }
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourse(null);
    setFormData(initialFormData);
    setLabHours(0);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Esta seguro de eliminar este curso?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAssignTeacher = (course: Course) => {
    setCourseToAssign(course);
    setAssignTeacherOpen(true);
  };

  const handleCloseAssignTeacher = () => {
    setAssignTeacherOpen(false);
    setCourseToAssign(null);
  };

  const handleAssignTeacher = async (courseId: number, teacherId: number | null) => {
    await assignTeacherMutation.mutateAsync({ courseId, teacherId });
  };

  const handleChange = (field: keyof CourseCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Determinar tipo de curso automaticamente basado en las horas
  const determineCourseType = (theoryHours: number, practiceHours: number, labHours: number): CourseType => {
    const hasPractice = practiceHours > 0;
    const hasLab = labHours > 0;

    if (hasLab && hasPractice) {
      return CourseType.THEORY_PRACTICE; // Teoria + Practica + Lab
    } else if (hasLab) {
      return CourseType.LAB; // Teoria + Lab
    } else if (hasPractice) {
      return CourseType.THEORY_PRACTICE; // Teoria + Practica
    } else {
      return CourseType.THEORY; // Solo Teoria
    }
  };

  const handleHoursChange = (type: 'theory' | 'practice' | 'lab', value: number) => {
    const newTheory = type === 'theory' ? value : formData.theory_hours;
    const newPractice = type === 'practice' ? value : formData.practice_hours;
    const newLab = type === 'lab' ? value : labHours;

    if (type === 'theory') {
      handleChange('theory_hours', value);
    } else if (type === 'practice') {
      handleChange('practice_hours', value);
    } else {
      setLabHours(value);
    }

    // Determinar tipo de curso automaticamente
    const courseType = determineCourseType(newTheory, newPractice, newLab);
    handleChange('course_type', courseType);
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
          Gestion de Cursos
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
            Nuevo Curso
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
              <TableCell>Ciclo</TableCell>
              <TableCell>Creditos</TableCell>
              <TableCell align="center">Horas T</TableCell>
              <TableCell align="center">Horas P</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Docente</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses && courses.length > 0 ? (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell align="center">{course.cycle}</TableCell>
                  <TableCell align="center">{course.credits}</TableCell>
                  <TableCell align="center">{course.theory_hours}h</TableCell>
                  <TableCell align="center">
                    {course.practice_hours > 0 ? `${course.practice_hours}h` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={courseTypeLabels[course.course_type]}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {course.teacher_id ? (
                      <Chip
                        label="Asignado"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Sin asignar"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleOpenAssignTeacher(course)}
                      title="Asignar docente"
                    >
                      <PersonAdd />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(course)}
                      title="Editar"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(course.id)}
                      title="Eliminar"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay cursos registrados. Haga clic en "Nuevo Curso" para agregar uno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            {/* Informacion Basica */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informacion Basica
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Codigo del Curso"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  required
                  fullWidth
                  placeholder="Ej: MAT101"
                  className="uppercase-input"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
                <TextField
                  label="Nombre del Curso"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  fullWidth
                  placeholder="Ej: COMPLEJIDAD Y ALGORITMOS"
                  className="uppercase-input"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Ciclo</InputLabel>
                    <Select
                      value={formData.cycle}
                      onChange={(e) => handleChange('cycle', e.target.value)}
                      label="Ciclo"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cycle) => (
                        <MenuItem key={cycle} value={cycle}>
                          Ciclo {cycle}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Creditos"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleChange('credits', parseFloat(e.target.value))}
                    required
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Distribucion de Horas */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Distribucion de Horas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Horas de Teoria (Obligatorio)"
                  type="number"
                  value={formData.theory_hours}
                  onChange={(e) => handleHoursChange('theory', parseInt(e.target.value) || 0)}
                  required
                  fullWidth
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Todo curso debe tener al menos 1 hora de teoria"
                />
                <TextField
                  label="Horas de Practica (Opcional)"
                  type="number"
                  value={formData.practice_hours}
                  onChange={(e) => handleHoursChange('practice', parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, max: 10 }}
                  helperText="Dejar en 0 si el curso no tiene practica"
                />
                <TextField
                  label="Horas de Laboratorio (Opcional)"
                  type="number"
                  value={labHours}
                  onChange={(e) => handleHoursChange('lab', parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, max: 10 }}
                  helperText="Dejar en 0 si el curso no tiene laboratorio"
                />
              </Box>
            </Box>

            {/* Tipo de Curso (Auto-determinado) */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Tipo de Curso (Determinado automaticamente)
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={courseTypeLabels[formData.course_type]}
                    color="primary"
                    size="medium"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formData.theory_hours > 0 && formData.practice_hours === 0 && labHours === 0 && 'Solo teoria'}
                    {formData.theory_hours > 0 && formData.practice_hours > 0 && labHours === 0 && 'Teoria + Practica'}
                    {formData.theory_hours > 0 && formData.practice_hours === 0 && labHours > 0 && 'Teoria + Laboratorio'}
                    {formData.theory_hours > 0 && formData.practice_hours > 0 && labHours > 0 && 'Teoria + Practica + Laboratorio'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Total de horas semanales: {formData.theory_hours + formData.practice_hours + labHours}h
                </Typography>
              </Paper>
            </Box>
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
              formData.theory_hours < 1 ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : editingCourse
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Assign Teacher */}
      <AssignTeacherDialog
        open={assignTeacherOpen}
        course={courseToAssign}
        onClose={handleCloseAssignTeacher}
        onAssign={handleAssignTeacher}
      />
    </Container>
  );
}
