import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Download, Print } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/services/scheduleService';
import ScheduleGrid from '@/components/ScheduleGrid';
import EditSlotDialog from '@/components/EditSlotDialog';
import { Schedule, ScheduleStatus, ScheduleSlot, UserRole } from '@/types';
import { exportToCSV, exportToExcel, exportToJSON, printSchedule } from '@/utils/exportUtils';
import { useAuthStore } from '@/store/authStore';

const statusLabels: Record<ScheduleStatus, string> = {
  [ScheduleStatus.DRAFT]: 'Borrador',
  [ScheduleStatus.PUBLISHED]: 'Publicado',
  [ScheduleStatus.ARCHIVED]: 'Archivado',
};

const statusColors: Record<ScheduleStatus, 'default' | 'success' | 'error'> = {
  [ScheduleStatus.DRAFT]: 'default',
  [ScheduleStatus.PUBLISHED]: 'success',
  [ScheduleStatus.ARCHIVED]: 'error',
};

export default function ScheduleViewer() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const scheduleIdParam = searchParams.get('id');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    scheduleIdParam ? parseInt(scheduleIdParam) : null
  );
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Verificar permisos de edición
  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.COORDINATOR;

  // Fetch all schedules for dropdown
  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ['schedules'],
    queryFn: () => scheduleService.getSchedules(),
  });

  // Fetch selected schedule with slots
  const {
    data: schedule,
    isLoading,
    error,
  } = useQuery<Schedule>({
    queryKey: ['schedule', selectedScheduleId],
    queryFn: () => scheduleService.getSchedule(selectedScheduleId!),
    enabled: !!selectedScheduleId,
  });

  useEffect(() => {
    if (scheduleIdParam && !selectedScheduleId) {
      setSelectedScheduleId(parseInt(scheduleIdParam));
    }
  }, [scheduleIdParam, selectedScheduleId]);

  useEffect(() => {
    if (schedules && schedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId]);

  // Mutación para actualizar slot
  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: Partial<ScheduleSlot> }) =>
      scheduleService.updateSlot(selectedScheduleId!, slotId, data),
    onSuccess: () => {
      // Refrescar el horario
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedScheduleId] });
    },
  });

  const handleSlotClick = (slot: ScheduleSlot) => {
    if (editMode && canEdit) {
      setEditingSlot(slot);
    }
  };

  const handleSaveSlot = async (slotId: number, data: Partial<ScheduleSlot>) => {
    await updateSlotMutation.mutateAsync({ slotId, data });
  };

  const handleCloseEditDialog = () => {
    setEditingSlot(null);
  };

  const handlePrint = () => {
    printSchedule();
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    if (!schedule) {
      alert('No hay horario seleccionado');
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV(schedule);
        break;
      case 'excel':
        exportToExcel(schedule);
        break;
      case 'json':
        exportToJSON(schedule);
        break;
    }
    handleExportClose();
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Visualizador de Horarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {canEdit && (
            <FormControlLabel
              control={
                <Switch
                  checked={editMode}
                  onChange={(e) => setEditMode(e.target.checked)}
                  color="primary"
                />
              }
              label={editMode ? 'Modo Edición' : 'Solo Lectura'}
            />
          )}
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Exportar
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>Exportar a CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Exportar a Excel</MenuItem>
            <MenuItem onClick={() => handleExport('json')}>Exportar a JSON</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar el horario
        </Alert>
      )}

      {/* Schedule Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Seleccionar Horario</InputLabel>
            <Select
              value={selectedScheduleId || ''}
              onChange={(e) => setSelectedScheduleId(Number(e.target.value))}
              label="Seleccionar Horario"
            >
              {schedules?.map((sch) => (
                <MenuItem key={sch.id} value={sch.id}>
                  {sch.name} - {sch.semester}/{sch.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {schedule && (
            <>
              <Chip
                label={statusLabels[schedule.status]}
                color={statusColors[schedule.status]}
              />
              {schedule.fitness_score && (
                <Chip
                  label={`Fitness: ${(schedule.fitness_score * 100).toFixed(2)}%`}
                  color="primary"
                  variant="outlined"
                />
              )}
              <Chip
                label={`Slots: ${schedule.slots?.length || 0}`}
                variant="outlined"
              />
              <Chip
                label={`Conflictos: ${schedule.hard_constraints_violations}`}
                color={schedule.hard_constraints_violations === 0 ? 'success' : 'error'}
                variant="outlined"
              />
            </>
          )}
        </Box>
      </Paper>

      {/* Schedule Grid */}
      {schedule && schedule.slots && schedule.slots.length > 0 ? (
        <>
          {editMode && canEdit && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Modo edición activado. Haz clic en cualquier clase para editarla.
            </Alert>
          )}
          <ScheduleGrid
            slots={schedule.slots}
            editable={editMode && canEdit}
            onSlotClick={handleSlotClick}
          />
        </>
      ) : selectedScheduleId ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay slots de horario disponibles para mostrar.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Selecciona un horario para visualizar.
          </Typography>
        </Paper>
      )}

      {/* Schedule Details */}
      {schedule && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detalles del Horario
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Nombre:
              </Typography>
              <Typography variant="body1">{schedule.name}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Periodo:
              </Typography>
              <Typography variant="body1">
                {schedule.semester}/{schedule.year}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Fecha de Creacion:
              </Typography>
              <Typography variant="body1">
                {new Date(schedule.created_at).toLocaleString('es-PE')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Violaciones de Restricciones:
              </Typography>
              <Typography variant="body1">
                Duras: {schedule.hard_constraints_violations} | Blandas:{' '}
                {schedule.soft_constraints_violations}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Edit Slot Dialog */}
      {editingSlot && schedule && (
        <EditSlotDialog
          open={!!editingSlot}
          slot={editingSlot}
          scheduleId={selectedScheduleId!}
          allSlots={schedule.slots || []}
          onClose={handleCloseEditDialog}
          onSave={handleSaveSlot}
        />
      )}
    </Container>
  );
}
