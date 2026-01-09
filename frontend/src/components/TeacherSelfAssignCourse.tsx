import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Remove, School } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Course, CourseType } from '@/types';
import { courseService } from '@/services/courseService';

interface TeacherSelfAssignCourseProps {
  teacherId: number;
}

const courseTypeLabels: Record<CourseType, string> = {
  [CourseType.THEORY]: 'Teoría',
  [CourseType.PRACTICE]: 'Práctica',
  [CourseType.LAB]: 'Laboratorio',
  [CourseType.THEORY_PRACTICE]: 'Teoría-Práctica',
};

export default function TeacherSelfAssignCourse({ teacherId }: TeacherSelfAssignCourseProps) {
  const queryClient = useQueryClient();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [action, setAction] = useState<'assign' | 'unassign'>('assign');
  const [error, setError] = useState<string | null>(null);

  // Fetch all courses
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(),
  });

  // Mutation para asignar/desasignar
  const assignMutation = useMutation({
    mutationFn: ({ courseId, assign }: { courseId: number; assign: boolean }) =>
      courseService.teacherSelfAssign(courseId, assign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setConfirmDialogOpen(false);
      setSelectedCourse(null);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al procesar la solicitud');
    },
  });

  const handleOpenDialog = (course: Course, actionType: 'assign' | 'unassign') => {
    setSelectedCourse(course);
    setAction(actionType);
    setConfirmDialogOpen(true);
    setError(null);
  };

  const handleConfirm = () => {
    if (!selectedCourse) return;

    const isAssigning = action === 'assign';
    assignMutation.mutate({ courseId: selectedCourse.id, assign: isAssigning });
  };

  const myCourses = courses?.filter((c) => c.teacher_id === teacherId) || [];
  const availableCourses = courses?.filter((c) => !c.teacher_id) || [];
  const otherCourses = courses?.filter((c) => c.teacher_id && c.teacher_id !== teacherId) || [];

  const totalWeeklyHours = myCourses.reduce(
    (sum, course) => sum + course.theory_hours + course.practice_hours,
    0
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <School sx={{ verticalAlign: 'middle', mr: 1 }} />
          Mis Cursos Asignados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cursos que actualmente dictas • Total: {totalWeeklyHours} horas semanales
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mis Cursos */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>Nombre</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>
                Ciclo
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>
                Créditos
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>
                Horas/Sem
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>Tipo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light' }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {myCourses.length > 0 ? (
              myCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell align="center">{course.cycle}</TableCell>
                  <TableCell align="center">{course.credits}</TableCell>
                  <TableCell align="center">
                    {course.theory_hours + course.practice_hours}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={courseTypeLabels[course.course_type]}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Remove />}
                      onClick={() => handleOpenDialog(course, 'unassign')}
                    >
                      Desasignarme
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tienes cursos asignados. Puedes asignarte a cursos disponibles abajo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cursos Disponibles */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cursos Disponibles para Asignación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estos cursos no tienen docente asignado. Puedes asignarte a cualquiera de ellos.
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>Nombre</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>
                Ciclo
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>
                Créditos
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>
                Horas/Sem
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>Tipo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light' }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableCourses.length > 0 ? (
              availableCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell align="center">{course.cycle}</TableCell>
                  <TableCell align="center">{course.credits}</TableCell>
                  <TableCell align="center">
                    {course.theory_hours + course.practice_hours}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={courseTypeLabels[course.course_type]}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog(course, 'assign')}
                    >
                      Asignarme
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay cursos disponibles en este momento. Todos los cursos ya tienen docente
                  asignado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'assign' ? 'Asignarme a Curso' : 'Desasignarme de Curso'}
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>Curso:</strong> {selectedCourse.code} - {selectedCourse.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ciclo {selectedCourse.cycle} • {selectedCourse.credits} créditos •{' '}
                {selectedCourse.theory_hours + selectedCourse.practice_hours}h semanales
              </Typography>

              <Alert severity={action === 'assign' ? 'info' : 'warning'} sx={{ mt: 2 }}>
                {action === 'assign' ? (
                  <>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      ¿Confirmas que deseas asignarte a este curso?
                    </Typography>
                    <Typography variant="body2">
                      • Este curso se agregará a tu carga académica
                      <br />
                      • Serás responsable de dictarlo en los horarios generados
                      <br />
                      • Tu disponibilidad horaria será considerada al generar horarios
                      <br />• Total de horas: {totalWeeklyHours + selectedCourse.theory_hours + selectedCourse.practice_hours}h semanales
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      ¿Confirmas que deseas desasignarte de este curso?
                    </Typography>
                    <Typography variant="body2">
                      • El curso quedará sin docente asignado
                      <br />
                      • No podrá ser incluido en nuevos horarios hasta que se asigne otro docente
                      <br />• Los horarios ya generados NO se modificarán automáticamente
                    </Typography>
                  </>
                )}
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={assignMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={action === 'assign' ? 'success' : 'error'}
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending ? 'Procesando...' : action === 'assign' ? 'Sí, Asignarme' : 'Sí, Desasignarme'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
