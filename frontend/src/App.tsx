import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import medicalTheme from "./theme/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Navigation from "./components/Navigation";
import AIChat from "./pages/AIChat";
import Appointments from "./pages/Appointments";
import Medications from "./pages/Medications";
import ChatSessions from "./pages/ChatSessions";
import HealthRecords from "./pages/HealthRecords";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import ToastProvider from "./components/notifications/ToastProvider";
import NewDashboard from "./pages/Dashboard";

function AppContent() {
  const { user, loading, logout, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <>
          {/* Navigation */}
          <Navigation user={user} onLogout={logout} />

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              maxWidth: "1200px",
              mx: "auto",
              px: { xs: 2, sm: 3, lg: 4 },
              py: 3,
              minHeight: "calc(100vh - 64px)", // Account for AppBar height
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/build"
                element={
                  <ProtectedRoute>
                    <NewDashboard/>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <AIChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medications"
                element={
                  <ProtectedRoute>
                    <Medications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat-sessions"
                element={
                  <ProtectedRoute>
                    <ChatSessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-records"
                element={
                  <ProtectedRoute>
                    <HealthRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/prescriptions"
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorPrescriptions />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </>
      )}
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={medicalTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
          <ToastProvider />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
