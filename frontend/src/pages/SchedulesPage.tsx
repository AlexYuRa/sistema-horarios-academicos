import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LinearProgress,
} from '@mui/material';
import { Add, Visibility, Delete, Refresh, PlayArrow } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/services/scheduleService';
import { Schedule, ScheduleGenerateRequest, ScheduleStatus } from '@/types';

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

const initialFormData: ScheduleGenerateRequest = {
  name: '',
  semester: '2025-1',
  year: 2025,
  algorithm: 'genetic',
};

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ScheduleGenerateRequest>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch schedules
  const { data: schedules, isLoading, refetch } = useQuery<Schedule[]>({
    queryKey: ['schedules'],
    queryFn: () => scheduleService.getSchedules(),
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: scheduleService.generateSchedule,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      handleClose();
      setGenerating(false);
      setError(null);
      // Navigate to the generated schedule viewer
      navigate(`/schedule-viewer?id=${response.schedule_id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al generar el horario');
      setGenerating(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: scheduleService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Error al eliminar el horario');
    },
  });

  const handleOpen = () => {
    setFormData(initialFormData);
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setError(null);
    setGenerating(false);
  };

  const handleSubmit = () => {
    setGenerating(true);
    generateMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Esta seguro de eliminar este horario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (id: number) => {
    navigate(`/schedule-viewer?id=${id}`);
  };

  const handleChange = (field: keyof ScheduleGenerateRequest, value: any) => {
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
          Gestion de Horarios
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
            startIcon={<PlayArrow />}
            onClick={handleOpen}
          >
            Generar Horario
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
              <TableCell>Nombre</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fitness Score</TableCell>
              <TableCell>Fecha Creacion</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules && schedules.length > 0 ? (
              schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.name}</TableCell>
                  <TableCell>{schedule.semester}</TableCell>
                  <TableCell>{schedule.year}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[schedule.status]}
                      size="small"
                      color={statusColors[schedule.status]}
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.fitness_score
                      ? `${(schedule.fitness_score * 100).toFixed(2)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(schedule.created_at).toLocaleString('es-PE')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleView(schedule.id)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay horarios generados. Haga clic en "Generar Horario" para crear uno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Generate Schedule */}
      <Dialog open={open} onClose={!generating ? handleClose : undefined} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Nuevo Horario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre del Horario"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              fullWidth
              disabled={generating}
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Semestre"
              value={formData.semester}
              onChange={(e) => handleChange('semester', e.target.value)}
              required
              fullWidth
              placeholder="2025-1"
              disabled={generating}
              className="uppercase-input"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Año"
              type="number"
              value={formData.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 2020, max: 2030 }}
              disabled={generating}
            />
            <FormControl fullWidth>
              <InputLabel>Algoritmo</InputLabel>
              <Select
                value={formData.algorithm}
                onChange={(e) => handleChange('algorithm', e.target.value)}
                label="Algoritmo"
                disabled={generating}
              >
                <MenuItem value="genetic">Algoritmo Genetico</MenuItem>
                <MenuItem value="backtracking">Backtracking</MenuItem>
              </Select>
            </FormControl>

            {generating && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Generando horario... Este proceso puede tardar varios minutos.
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={generating}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.semester || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {generating ? 'Generando...' : 'Generar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
