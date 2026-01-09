import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  Chip,
} from '@mui/material';
import { Save, Schedule } from '@mui/icons-material';
import { TeacherAvailability, DAYS_OF_WEEK } from '@/types';

interface TeacherAvailabilityEditorProps {
  teacherId: number;
  availabilities: TeacherAvailability[];
  onSave: (availabilities: TeacherAvailability[]) => Promise<void>;
}

// Franjas horarias disponibles (7:00 - 21:00, cada 2 horas)
const TIME_SLOTS = [
  { start: '07:00', end: '09:00', label: '7:00 - 9:00' },
  { start: '09:00', end: '11:00', label: '9:00 - 11:00' },
  { start: '11:00', end: '13:00', label: '11:00 - 13:00' },
  { start: '13:00', end: '15:00', label: '13:00 - 15:00' },
  { start: '15:00', end: '17:00', label: '15:00 - 17:00' },
  { start: '17:00', end: '19:00', label: '17:00 - 19:00' },
  { start: '19:00', end: '21:00', label: '19:00 - 21:00' },
];

export default function TeacherAvailabilityEditor({
  teacherId,
  availabilities,
  onSave,
}: TeacherAvailabilityEditorProps) {
  const [availability, setAvailability] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(TIME_SLOTS.length).fill(false))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar matriz de disponibilidad desde los datos existentes
    const matrix = Array(5).fill(null).map(() => Array(TIME_SLOTS.length).fill(false));

    availabilities.forEach((avail) => {
      if (avail.day_of_week < 5) { // Solo Lunes-Viernes
        const slotIndex = TIME_SLOTS.findIndex(
          (slot) => slot.start === avail.start_time && slot.end === avail.end_time
        );
        if (slotIndex !== -1 && avail.is_available) {
          matrix[avail.day_of_week][slotIndex] = true;
        }
      }
    });

    setAvailability(matrix);
    setHasChanges(false);
  }, [availabilities]);

  const handleToggle = (dayIndex: number, slotIndex: number) => {
    const newAvailability = availability.map((row, dIndex) =>
      dIndex === dayIndex
        ? row.map((val, sIndex) => (sIndex === slotIndex ? !val : val))
        : row
    );
    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const handleSelectAll = (dayIndex: number) => {
    const allSelected = availability[dayIndex].every((val) => val);
    const newAvailability = availability.map((row, dIndex) =>
      dIndex === dayIndex ? row.map(() => !allSelected) : row
    );
    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Convertir matriz a array de TeacherAvailability
      const newAvailabilities: TeacherAvailability[] = [];

      availability.forEach((daySlots, dayIndex) => {
        daySlots.forEach((isAvailable, slotIndex) => {
          if (isAvailable) {
            newAvailabilities.push({
              id: 0, // Se generará en backend
              teacher_id: teacherId,
              day_of_week: dayIndex,
              start_time: TIME_SLOTS[slotIndex].start,
              end_time: TIME_SLOTS[slotIndex].end,
              is_available: true,
            });
          }
        });
      });

      await onSave(newAvailabilities);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar disponibilidad');
    } finally {
      setIsSaving(false);
    }
  };

  const totalHoursAvailable = availability.flat().filter(Boolean).length * 2;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
            Disponibilidad Horaria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona los horarios en los que estás disponible para dictar clases
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={`${totalHoursAvailable}h disponibles`}
            color="primary"
            variant="outlined"
          />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                Horario
              </TableCell>
              {DAYS_OF_WEEK.slice(0, 5).map((day, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}
                >
                  <Box>
                    {day}
                    <Button
                      size="small"
                      sx={{ display: 'block', mt: 0.5, color: 'white', fontSize: '0.7rem' }}
                      onClick={() => handleSelectAll(index)}
                    >
                      {availability[index].every((val) => val) ? 'Desmarcar' : 'Todo'}
                    </Button>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TIME_SLOTS.map((slot, slotIndex) => (
              <TableRow key={slotIndex}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  {slot.label}
                </TableCell>
                {[0, 1, 2, 3, 4].map((dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
                      bgcolor: availability[dayIndex][slotIndex] ? 'success.light' : 'grey.50',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: availability[dayIndex][slotIndex] ? 'success.main' : 'grey.200',
                      },
                    }}
                    onClick={() => handleToggle(dayIndex, slotIndex)}
                  >
                    <Checkbox
                      checked={availability[dayIndex][slotIndex]}
                      onChange={() => handleToggle(dayIndex, slotIndex)}
                      sx={{ p: 0 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          💡 Consejos:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
          <li>Selecciona todos los horarios en los que puedes dictar clases</li>
          <li>El sistema usará esta información para generar los horarios automáticamente</li>
          <li>Puedes usar el botón "Todo" en cada día para seleccionar/deseleccionar todas las franjas</li>
          <li>Recuerda guardar tus cambios antes de salir</li>
        </Typography>
      </Box>
    </Box>
  );
}
