import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ScheduleSlot, Course, Teacher, Classroom, DAYS_OF_WEEK } from '@/types';
import { courseService } from '@/services/courseService';
import { teacherService } from '@/services/teacherService';
import { classroomService } from '@/services/classroomService';

interface EditSlotDialogProps {
  open: boolean;
  slot: ScheduleSlot | null;
  scheduleId: number;
  allSlots: ScheduleSlot[];
  onClose: () => void;
  onSave: (slotId: number, updatedData: Partial<ScheduleSlot>) => Promise<void>;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function EditSlotDialog({
  open,
  slot,
  scheduleId,
  allSlots,
  onClose,
  onSave,
}: EditSlotDialogProps) {
  const [formData, setFormData] = useState<Partial<ScheduleSlot>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data for dropdowns
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(),
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
  });

  const { data: classrooms, isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomService.getClassrooms(),
  });

  useEffect(() => {
    if (slot) {
      setFormData({
        course_id: slot.course_id,
        teacher_id: slot.teacher_id,
        classroom_id: slot.classroom_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        session_type: slot.session_type || '',
        group: slot.group || '',
      });
      setValidationErrors([]);
    }
  }, [slot]);

  const handleChange = (field: keyof ScheduleSlot, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation errors for this field
    setValidationErrors(validationErrors.filter((err) => err.field !== field));
  };

  const validateSlot = (): boolean => {
    const errors: ValidationError[] = [];

    // Validar que todos los campos requeridos estén llenos
    if (!formData.course_id) {
      errors.push({ field: 'course_id', message: 'El curso es requerido' });
    }
    if (!formData.teacher_id) {
      errors.push({ field: 'teacher_id', message: 'El docente es requerido' });
    }
    if (!formData.classroom_id) {
      errors.push({ field: 'classroom_id', message: 'El aula es requerida' });
    }
    if (formData.day_of_week === undefined) {
      errors.push({ field: 'day_of_week', message: 'El día es requerido' });
    }
    if (!formData.start_time) {
      errors.push({ field: 'start_time', message: 'La hora de inicio es requerida' });
    }
    if (!formData.end_time) {
      errors.push({ field: 'end_time', message: 'La hora de fin es requerida' });
    }

    // Validar que la hora de fin sea después de la hora de inicio
    if (formData.start_time && formData.end_time) {
      const startMinutes = timeToMinutes(formData.start_time);
      const endMinutes = timeToMinutes(formData.end_time);
      if (endMinutes <= startMinutes) {
        errors.push({
          field: 'end_time',
          message: 'La hora de fin debe ser después de la hora de inicio',
        });
      }
    }

    // Validar conflicto de docente
    const teacherConflict = allSlots.find(
      (s) =>
        s.id !== slot?.id &&
        s.teacher_id === formData.teacher_id &&
        s.day_of_week === formData.day_of_week &&
        timeSlotsOverlap(s.start_time, s.end_time, formData.start_time!, formData.end_time!)
    );
    if (teacherConflict) {
      const teacher = teachers?.find((t) => t.id === formData.teacher_id);
      errors.push({
        field: 'teacher_id',
        message: `El docente ya tiene otra clase el ${DAYS_OF_WEEK[formData.day_of_week!]} de ${formData.start_time} a ${formData.end_time}`,
      });
    }

    // Validar conflicto de aula
    const classroomConflict = allSlots.find(
      (s) =>
        s.id !== slot?.id &&
        s.classroom_id === formData.classroom_id &&
        s.day_of_week === formData.day_of_week &&
        timeSlotsOverlap(s.start_time, s.end_time, formData.start_time!, formData.end_time!)
    );
    if (classroomConflict) {
      errors.push({
        field: 'classroom_id',
        message: `El aula ya está ocupada el ${DAYS_OF_WEEK[formData.day_of_week!]} de ${formData.start_time} a ${formData.end_time}`,
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateSlot() || !slot) return;

    setIsSaving(true);
    try {
      await onSave(slot.id, formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      setValidationErrors([
        {
          field: 'general',
          message: 'Error al guardar los cambios. Por favor, intente nuevamente.',
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find((err) => err.field === field)?.message;
  };

  const generalError = validationErrors.find((err) => err.field === 'general');

  const isLoading = coursesLoading || teachersLoading || classroomsLoading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Clase</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {generalError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generalError.message}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Curso */}
              <Grid item xs={12}>
                <FormControl fullWidth error={!!getFieldError('course_id')}>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={formData.course_id || ''}
                    onChange={(e) => handleChange('course_id', e.target.value)}
                    label="Curso"
                  >
                    {courses?.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.code} - {course.name} (Ciclo {course.cycle})
                      </MenuItem>
                    ))}
                  </Select>
                  {getFieldError('course_id') && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {getFieldError('course_id')}
                    </Alert>
                  )}
                </FormControl>
              </Grid>

              {/* Docente */}
              <Grid item xs={12}>
                <FormControl fullWidth error={!!getFieldError('teacher_id')}>
                  <InputLabel>Docente</InputLabel>
                  <Select
                    value={formData.teacher_id || ''}
                    onChange={(e) => handleChange('teacher_id', e.target.value)}
                    label="Docente"
                  >
                    {teachers?.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.employee_code}
                      </MenuItem>
                    ))}
                  </Select>
                  {getFieldError('teacher_id') && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {getFieldError('teacher_id')}
                    </Alert>
                  )}
                </FormControl>
              </Grid>

              {/* Aula */}
              <Grid item xs={12}>
                <FormControl fullWidth error={!!getFieldError('classroom_id')}>
                  <InputLabel>Aula</InputLabel>
                  <Select
                    value={formData.classroom_id || ''}
                    onChange={(e) => handleChange('classroom_id', e.target.value)}
                    label="Aula"
                  >
                    {classrooms
                      ?.filter((c) => c.is_available)
                      .map((classroom) => (
                        <MenuItem key={classroom.id} value={classroom.id}>
                          {classroom.code} - {classroom.name} (Capacidad: {classroom.capacity}) -{' '}
                          {classroom.classroom_type}
                        </MenuItem>
                      ))}
                  </Select>
                  {getFieldError('classroom_id') && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {getFieldError('classroom_id')}
                    </Alert>
                  )}
                </FormControl>
              </Grid>

              {/* Día de la semana */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!getFieldError('day_of_week')}>
                  <InputLabel>Día</InputLabel>
                  <Select
                    value={formData.day_of_week !== undefined ? formData.day_of_week : ''}
                    onChange={(e) => handleChange('day_of_week', e.target.value)}
                    label="Día"
                  >
                    {DAYS_OF_WEEK.slice(0, 6).map((day, index) => (
                      <MenuItem key={index} value={index}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                  {getFieldError('day_of_week') && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {getFieldError('day_of_week')}
                    </Alert>
                  )}
                </FormControl>
              </Grid>

              {/* Tipo de sesión */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Sesión (Opcional)</InputLabel>
                  <Select
                    value={formData.session_type || ''}
                    onChange={(e) => handleChange('session_type', e.target.value)}
                    label="Tipo de Sesión (Opcional)"
                  >
                    <MenuItem value="">Ninguno</MenuItem>
                    <MenuItem value="theory">Teoría</MenuItem>
                    <MenuItem value="practice">Práctica</MenuItem>
                    <MenuItem value="lab">Laboratorio</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Hora de inicio */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hora de Inicio"
                  type="time"
                  value={formData.start_time || ''}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  error={!!getFieldError('start_time')}
                  helperText={getFieldError('start_time')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>

              {/* Hora de fin */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hora de Fin"
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  error={!!getFieldError('end_time')}
                  helperText={getFieldError('end_time')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>

              {/* Grupo */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Grupo (Opcional)"
                  value={formData.group || ''}
                  onChange={(e) => handleChange('group', e.target.value)}
                  placeholder="Ej: A, B, GRUPO 1"
                  helperText="Identifica la sección o grupo del curso"
                  className="uppercase-input"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving || isLoading}>
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Utilidades
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeSlotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}
