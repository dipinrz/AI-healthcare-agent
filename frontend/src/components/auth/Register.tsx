import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Avatar,
  MenuItem,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Slide,
  LinearProgress,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as UserIcon,
  Phone as PhoneIcon,
  Visibility,
  VisibilityOff,
  LocalHospital as MedicalIcon,
  Security as SecurityIcon,
  Wc as GenderIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
} from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    {
      label: 'Personal Information',
      description: 'Tell us about yourself',
      icon: <UserIcon />,
    },
    {
      label: 'Contact Details',
      description: 'How can we reach you?',
      icon: <EmailIcon />,
    },
    {
      label: 'Security Setup',
      description: 'Secure your account',
      icon: <SecurityIcon />,
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
      case 1:
        return formData.email.trim() !== "" && formData.phone.trim() !== "" && 
               formData.dateOfBirth !== "" && formData.gender !== "";
      case 2:
        return formData.password.length >= 6 && formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError("");
    } else {
      setError(getStepError(activeStep));
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError("");
  };

  const getStepError = (step: number): string => {
    switch (step) {
      case 0:
        return "Please fill in your first and last name";
      case 1:
        return "Please complete all contact information";
      case 2:
        if (formData.password.length < 6) return "Password must be at least 6 characters long";
        if (formData.password !== formData.confirmPassword) return "Passwords do not match";
        return "Please complete password setup";
      default:
        return "";
    }
  };

  const getProgress = (): number => {
    return ((activeStep + 1) / steps.length) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: "patient",
      });

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{xs: 12, sm: 6}}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                required
                value={formData.firstName}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{xs: 12}}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{xs: 12}}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="+1 (555) 123-4567"
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <TextField
                fullWidth
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <TextField
                fullWidth
                id="gender"
                name="gender"
                label="Gender"
                select
                required
                value={formData.gender}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GenderIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">Select gender</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{xs: 12}}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Password must be at least 6 characters long"
              />
            </Grid>
            <Grid size={{xs: 12}}>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.1)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.1)} 50%, 
          ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: "white",
                textAlign: "center",
                py: 4,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  backgroundSize: "200% 200%",
                  animation: "shimmer 3s ease-in-out infinite",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  <MedicalIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  Join AI Healthcare
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                  Your journey to better health starts here
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ px: 4, pt: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Step {activeStep + 1} of {steps.length}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                  {Math.round(getProgress())}% Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              />
            </Box>

            {/* Form Content */}
            <Box sx={{ p: 4 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: index <= activeStep ? "primary.main" : "grey.300",
                            color: "white",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {index < activeStep ? (
                            <CheckIcon />
                          ) : (
                            step.icon
                          )}
                        </Avatar>
                      )}
                    >
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ py: 3 }}>
                        <Slide
                          direction="left"
                          in={activeStep === index}
                          timeout={300}
                        >
                          <div>{renderStepContent(index)}</div>
                        </Slide>

                        {/* Error Message */}
                        {error && (
                          <Fade in={true} timeout={300}>
                            <Alert severity="error" sx={{ mt: 3 }}>
                              {error}
                            </Alert>
                          </Fade>
                        )}

                        {/* Step Navigation */}
                        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
                          <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            startIcon={<BackIcon />}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          >
                            Back
                          </Button>
                          {activeStep === steps.length - 1 ? (
                            <Button
                              variant="contained"
                              onClick={handleSubmit}
                              disabled={isLoading || !validateStep(activeStep)}
                              sx={{
                                borderRadius: 2,
                                px: 4,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                                },
                              }}
                            >
                              {isLoading ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CircularProgress size={20} color="inherit" />
                                  Creating account...
                                </Box>
                              ) : (
                                "Create Account"
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={handleNext}
                              endIcon={<NextIcon />}
                              disabled={!validateStep(activeStep)}
                              sx={{
                                borderRadius: 2,
                                px: 4,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              }}
                            >
                              Next
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {/* Login Link */}
              <Box sx={{ textAlign: "center", mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Typography
                    component={Link}
                    to="/login"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 600,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Sign in here
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Register;
