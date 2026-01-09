import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  School,
  Person,
  Room,
  CalendarMonth,
  TrendingUp,
  PlayArrow,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '@/types';
import { courseService } from '@/services/courseService';
import { teacherService } from '@/services/teacherService';
import { classroomService } from '@/services/classroomService';
import { scheduleService } from '@/services/scheduleService';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Verificar si el usuario puede navegar a páginas de administración
  const canNavigateToAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.COORDINATOR;

  // Fetch statistics
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(),
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
  });

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => classroomService.getClassrooms(),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleService.getSchedules(),
  });

  const isLoading =
    coursesLoading || teachersLoading || classroomsLoading || schedulesLoading;

  const stats = [
    {
      title: 'Cursos',
      value: courses?.length || 0,
      icon: <School sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      route: '/courses',
    },
    {
      title: 'Docentes',
      value: teachers?.length || 0,
      icon: <Person sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      route: '/teachers',
    },
    {
      title: 'Aulas',
      value: classrooms?.length || 0,
      icon: <Room sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      route: '/classrooms',
    },
    {
      title: 'Horarios',
      value: schedules?.length || 0,
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      route: '/schedules',
    },
  ];

  const latestSchedule = schedules?.[0];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {user?.full_name}
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: canNavigateToAdmin ? 'pointer' : 'default',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': canNavigateToAdmin ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    } : {},
                  }}
                  onClick={() => canNavigateToAdmin && navigate(stat.route)}
                >
                  <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="h4" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Grid container spacing={3}>
            {canNavigateToAdmin && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PlayArrow sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Accion Rapida</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Genera un nuevo horario academico utilizando el algoritmo genetico.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/schedules')}
                    >
                      Generar Horario
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            <Grid item xs={12} md={canNavigateToAdmin ? 6 : 12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Ultimo Horario</Typography>
                  </Box>
                  {latestSchedule ? (
                    <>
                      <Typography variant="body1" gutterBottom>
                        {latestSchedule.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Periodo: {latestSchedule.semester}/{latestSchedule.year}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fitness:{' '}
                        {latestSchedule.fitness_score
                          ? `${(latestSchedule.fitness_score * 100).toFixed(2)}%`
                          : 'N/A'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay horarios generados aun.
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() =>
                      latestSchedule
                        ? navigate(`/schedule-viewer?id=${latestSchedule.id}`)
                        : navigate('/schedules')
                    }
                    disabled={!latestSchedule}
                  >
                    {latestSchedule ? 'Ver Horario' : 'Crear Horario'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>

          {/* System Information */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informacion del Sistema
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Usuario:
                </Typography>
                <Typography variant="body1">{user?.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Rol:
                </Typography>
                <Typography variant="body1">{user?.role}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Estado:
                </Typography>
                <Typography variant="body1" color="success.main">
                  {user?.is_active ? 'Activo' : 'Inactivo'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Version:
                </Typography>
                <Typography variant="body1">1.0.0</Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}
