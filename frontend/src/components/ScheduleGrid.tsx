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
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Info as InfoIcon } from '@mui/icons-material';
import { ScheduleSlot, DAYS_OF_WEEK, TIME_SLOTS } from '@/types';

interface ScheduleGridProps {
  slots: ScheduleSlot[];
  viewMode?: 'cycle' | 'teacher' | 'classroom';
  onSlotClick?: (slot: ScheduleSlot) => void;
  editable?: boolean;
}

export default function ScheduleGrid({
  slots,
  viewMode = 'cycle',
  onSlotClick,
  editable = false,
}: ScheduleGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);

  // Crear una matriz de horarios [día][franja_horaria] = slot
  const scheduleMatrix: (ScheduleSlot | null)[][] = Array(7)
    .fill(null)
    .map(() => Array(TIME_SLOTS.length).fill(null));

  slots.forEach((slot) => {
    const timeSlotIndex = TIME_SLOTS.findIndex(
      (ts) => ts.start === slot.start_time
    );
    if (timeSlotIndex !== -1 && slot.day_of_week < 7) {
      scheduleMatrix[slot.day_of_week][timeSlotIndex] = slot;
    }
  });

  const handleSlotClick = (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    if (onSlotClick) {
      onSlotClick(slot);
    }
  };

  const getSlotColor = (slot: ScheduleSlot): string => {
    // Generar un color consistente basado en el ID del curso
    const colors = [
      '#e3f2fd',
      '#f3e5f5',
      '#e8f5e9',
      '#fff3e0',
      '#fce4ec',
      '#e0f2f1',
      '#f1f8e9',
      '#ede7f6',
    ];
    return colors[slot.course_id % colors.length];
  };

  const renderSlotContent = (slot: ScheduleSlot) => {
    return (
      <Box
        sx={{
          p: 1,
          backgroundColor: getSlotColor(slot),
          borderRadius: 1,
          borderLeft: 4,
          borderColor: editable ? 'warning.main' : 'primary.main',
          cursor: editable ? 'pointer' : 'default',
          height: '100%',
          position: 'relative',
          '&:hover': editable
            ? {
                boxShadow: 3,
                transform: 'scale(1.03)',
                transition: 'all 0.2s',
                borderColor: 'warning.dark',
              }
            : {},
        }}
        onClick={() => editable && handleSlotClick(slot)}
      >
        <Typography variant="caption" fontWeight="bold">
          {slot.course?.code || `Curso ${slot.course_id}`}
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          {slot.course?.name?.substring(0, 20) || ''}
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          {slot.classroom?.code || `Aula ${slot.classroom_id}`}
        </Typography>
        {editable && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'warning.main',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EditIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  width: '100px',
                }}
              >
                Horario
              </TableCell>
              {DAYS_OF_WEEK.slice(0, 6).map((day, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TIME_SLOTS.map((timeSlot, timeIndex) => (
              <TableRow key={timeIndex}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'grey.100',
                  }}
                >
                  <Typography variant="caption">
                    {timeSlot.start}
                    <br />-<br />
                    {timeSlot.end}
                  </Typography>
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    sx={{
                      p: 0.5,
                      minHeight: '80px',
                      verticalAlign: 'top',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {scheduleMatrix[dayIndex][timeIndex] ? (
                      renderSlotContent(scheduleMatrix[dayIndex][timeIndex]!)
                    ) : (
                      <Box
                        sx={{
                          height: '80px',
                          backgroundColor: 'grey.50',
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Leyenda de colores */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ mr: 2 }}>
          Leyenda:
        </Typography>
        <Chip label="Teoría" size="small" color="primary" variant="outlined" />
        <Chip
          label="Práctica"
          size="small"
          color="secondary"
          variant="outlined"
        />
        <Chip label="Laboratorio" size="small" color="success" variant="outlined" />
      </Box>
    </Box>
  );
}
