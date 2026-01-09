import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Person, Warning, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Course, Teacher } from '@/types';
import { teacherService } from '@/services/teacherService';

interface AssignTeacherDialogProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onAssign: (courseId: number, teacherId: number | null) => Promise<void>;
}

export default function AssignTeacherDialog({
  open,
  course,
  onClose,
  onAssign,
}: AssignTeacherDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
    enabled: open,
  });

  useEffect(() => {
    if (course) {
      setSelectedTeacherId(course.teacher_id || null);
      setError(null);
    }
  }, [course]);

  const handleAssign = async () => {
    if (!course) return;

    setIsSaving(true);
    setError(null);

    try {
      await onAssign(course.id, selectedTeacherId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al asignar docente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!course) return;

    setIsSaving(true);
    setError(null);

    try {
      await onAssign(course.id, null);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desasignar docente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          Asignar Docente
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {course && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Curso:
            </Typography>
            <Typography variant="h6" gutterBottom>
              {course.code} - {course.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ciclo {course.cycle} • {course.credits} créditos • {course.theory_hours + course.practice_hours}h semanales
            </Typography>
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <FormControl fullWidth>
              <InputLabel>Docente</InputLabel>
              <Select
                value={selectedTeacherId || ''}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value) || null)}
                label="Docente"
              >
                <MenuItem value="">
                  <em>Sin asignar</em>
                </MenuItem>
                {teachers?.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.employee_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Información sobre el estado actual */}
            <Box sx={{ mt: 2 }}>
              {course?.teacher_id ? (
                <Alert severity="info" icon={<CheckCircle />}>
                  <Typography variant="body2" fontWeight="bold">
                    Docente actualmente asignado
                  </Typography>
                  <Typography variant="body2">
                    El curso ya tiene un docente asignado. Cambiar el docente actualizará el horario automáticamente.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" icon={<Warning />}>
                  <Typography variant="body2" fontWeight="bold">
                    Sin docente asignado
                  </Typography>
                  <Typography variant="body2">
                    Este curso no puede ser incluido en la generación de horarios hasta que se le asigne un docente.
                  </Typography>
                </Alert>
              )}
            </Box>

            {/* Explicación de las consecuencias */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                ¿Qué ocurre al asignar un docente?
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Generación de horarios:</strong> El curso podrá ser incluido en la generación automática de horarios
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Disponibilidad:</strong> El algoritmo respetará la disponibilidad horaria del docente
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Conflictos:</strong> Se evitarán conflictos de horario para el docente
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Horarios existentes:</strong> Los horarios ya generados NO se modifican automáticamente
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        {course?.teacher_id && selectedTeacherId !== course.teacher_id && (
          <Button
            onClick={handleUnassign}
            color="warning"
            disabled={isSaving || isLoading}
          >
            Desasignar Docente
          </Button>
        )}
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={isSaving || isLoading || selectedTeacherId === course?.teacher_id}
        >
          {isSaving ? 'Guardando...' : 'Asignar Docente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
