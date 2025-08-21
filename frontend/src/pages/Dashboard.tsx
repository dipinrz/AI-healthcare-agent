import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Container,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Paper,
} from "@mui/material";
import {
  Event as CalendarIcon,
  Schedule as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Add as PlusIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import appointmentService from "../services/appointmentService";
import BookingModal from "../components/appointments/BookingModal";
import NotificationSettingsComponent from "../components/notifications/NotificationSettings";
import {Grid} from "@mui/system";

// Define interfaces locally
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  department: string;
  phone: string;
  email: string;
}

interface Appointment {
  id: string;
  appointmentDate: Date;
  duration: number;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  type: "consultation" | "follow_up" | "emergency" | "routine_checkup";
  reason: string;
  doctor: Doctor;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Loading dashboard data...");
      const [statsResponse, appointmentsResponse, doctorsResponse] =
        await Promise.all([
          appointmentService.getAppointmentStats(),
          appointmentService.getAppointments(),
          appointmentService.getDoctors(),
        ]);

      console.log("Stats response:", statsResponse);
      console.log("Appointments response:", appointmentsResponse);
      console.log("Doctors response:", doctorsResponse);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
        console.log("Stats set:", statsResponse.data);
      } else {
        console.error("Stats API failed:", statsResponse);
      }

      if (appointmentsResponse.success && appointmentsResponse.data) {
        const allAppointments = Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : [appointmentsResponse.data];
        
        // Filter for upcoming appointments (future dates with scheduled/confirmed status)
        const now = new Date();
        const upcoming = allAppointments.filter(apt => 
          new Date(apt.appointmentDate) > now && 
          (apt.status === 'scheduled' || apt.status === 'confirmed')
        ).slice(0, 5); // Take only first 5
        
        console.log("All appointments:", allAppointments);
        console.log("Upcoming appointments filtered:", upcoming);
        setUpcomingAppointments(upcoming);
      } else {
        console.error("Appointments API failed:", appointmentsResponse);
      }

      if (doctorsResponse.success && doctorsResponse.data) {
        setDoctors(doctorsResponse.data.slice(0, 6)); // Show top 6 doctors
        console.log("Doctors set:", doctorsResponse.data.slice(0, 6));
      } else {
        console.error("Doctors API failed:", doctorsResponse);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Welcome Header */}
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            {getGreeting()}, {user?.patient?.firstName || "Patient"}!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's your healthcare dashboard
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    <ClockIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      {stats?.upcoming || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      {stats?.completed || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                    <CancelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cancelled
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      {stats?.cancelled || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      {stats?.total || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Upcoming Appointments */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Upcoming Appointments
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={() => setShowBookingModal(true)}
                    >
                      Book New
                    </Button>
                  </Box>

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : upcomingAppointments.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No upcoming appointments found. Book your next
                      appointment!
                    </Alert>
                  ) : (
                    <List sx={{ width: "100%" }}>
                        {upcomingAppointments.map((appointment, index) => (
                          <React.Fragment key={appointment.id}>
                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                  <CalendarIcon />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      Dr. {appointment.doctor.firstName}{" "}
                                      {appointment.doctor.lastName}
                                    </Typography>
                                    <Chip
                                      label={
                                        appointment.status
                                          .charAt(0)
                                          .toUpperCase() +
                                        appointment.status.slice(1)
                                      }
                                      color="primary"
                                      size="small"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      color="primary"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {appointment.doctor.specialization} •{" "}
                                      {appointment.doctor.department}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        mt: 0.5,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <CalendarIcon
                                          sx={{
                                            fontSize: 16,
                                            color: "text.secondary",
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {appointmentService.formatAppointmentDate(
                                            appointment.appointmentDate
                                          )}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <TimeIcon
                                          sx={{
                                            fontSize: 16,
                                            color: "text.secondary",
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {appointmentService.formatAppointmentTime(
                                            appointment.appointmentDate
                                          )}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <strong>Reason:</strong>{" "}
                                      {appointment.reason}
                                    </Typography>
                                  </Box>
                                }
                                primaryTypographyProps={{ component: "div" }}
                                secondaryTypographyProps={{ component: "div" }}
                              />
                            </ListItem>
                            {index < upcomingAppointments.length - 1 && (
                              <Divider variant="inset" component="li" />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                  )}
                </>
              </CardContent>
            </Card>
          </Grid>

          {/* Doctors List */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Available Doctors
                </Typography>

                <List sx={{ width: "100%" }}>
                  {doctors.map((doctor, index) => (
                    <React.Fragment key={doctor.id}>
                      <ListItemButton>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: "secondary.main" }}>
                            <HospitalIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              Dr. {doctor.firstName} {doctor.lastName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="primary">
                                {doctor.specialization}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {doctor.qualification} • {doctor.department}
                              </Typography>
                            </Box>
                          }
                          primaryTypographyProps={{ component: "div" }}
                          secondaryTypographyProps={{ component: "div" }}
                        />
                      </ListItemButton>
                      {index < doctors.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Additional Dashboard Content */}
        <Grid container spacing={3}>
          {/* Notification Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <NotificationSettingsComponent />
          </Grid>
          
          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: "grey.50", height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlusIcon />}
                    onClick={() => setShowBookingModal(true)}
                    sx={{ py: 1.5 }}
                  >
                    Book Appointment
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CalendarIcon />}
                    href="/appointments"
                    sx={{ py: 1.5 }}
                  >
                    View All Appointments
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<HospitalIcon />}
                    sx={{ py: 1.5 }}
                  >
                    Find Doctors
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    sx={{ py: 1.5 }}
                  >
                    Health Reports
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Booking Modal */}
      <BookingModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />
    </Container>
  );
};

export default Dashboard;
