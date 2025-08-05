import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
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
  Fade,
  Zoom,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as UserIcon,
  Phone as PhoneIcon,
  Visibility,
  VisibilityOff,
  AutoAwesome as SparkleIcon,
  Security as SecurityIcon,
  Healing as HealingIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Wc as GenderIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import { useAuth } from '../../context/AuthContext';

// Animations
const breathingAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const floatingParticles = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(180deg);
    opacity: 0;
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(25, 118, 210, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
  }
`;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

const ModernRegister: React.FC = () => {
  const theme = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const steps = [
    { label: 'Personal Info', icon: <UserIcon /> },
    { label: 'Contact Details', icon: <EmailIcon /> },
    { label: 'Account Security', icon: <SecurityIcon /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calculate password strength
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 6) strength += 25;
      if (value.length >= 8) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/[0-9]/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender);
      case 1:
        return !!(formData.email && formData.phone);
      case 2:
        return !!(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError("");
    } else {
      setError("Please fill in all required fields");
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Final validation
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'error';
    if (passwordStrength < 50) return 'warning';
    if (passwordStrength < 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                👋 Tell us about yourself
              </Typography>
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
                          <UserIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.primary.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&.Mui-focused': {
                          background: alpha(theme.palette.primary.main, 0.06),
                        },
                      },
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.primary.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&.Mui-focused': {
                          background: alpha(theme.palette.primary.main, 0.06),
                        },
                      },
                    }}
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
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon sx={{ color: 'secondary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.secondary.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.secondary.main, 0.04),
                        },
                      },
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
                          <GenderIcon sx={{ color: 'info.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.info.main, 0.02),
                      },
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
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'secondary.main' }}>
                📞 How can we reach you?
              </Typography>
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
                          <EmailIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.primary.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.04),
                        },
                      },
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
                    placeholder="+1 (555) 123-4567"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'success.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.success.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.success.main, 0.04),
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in={true} timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'error.main' }}>
                🔐 Secure your account
              </Typography>
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
                          <LockIcon sx={{ color: 'error.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.error.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.error.main, 0.04),
                        },
                      },
                    }}
                  />
                  {formData.password && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption">Password Strength:</Typography>
                        <Chip
                          label={getPasswordStrengthText()}
                          color={getPasswordStrengthColor()}
                          size="small"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength}
                        color={getPasswordStrengthColor()}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.grey[300], 0.3),
                        }}
                      />
                    </Box>
                  )}
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
                          <LockIcon sx={{ color: 'warning.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha(theme.palette.warning.main, 0.02),
                        '&:hover': {
                          background: alpha(theme.palette.warning.main, 0.04),
                        },
                      },
                    }}
                  />
                  {formData.confirmPassword && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" color="success.main">
                            Passwords match
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="error.main">
                          Passwords don't match
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.08)} 25%,
          ${alpha(theme.palette.info.main, 0.06)} 50%,
          ${alpha(theme.palette.success.main, 0.04)} 75%,
          ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        backgroundSize: '400% 400%',
        animation: `${gradientShift} 15s ease infinite`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            animation: `${floatingParticles} ${10 + i * 2}s linear infinite`,
            left: `${5 + i * 12}%`,
            animationDelay: `${i * 1.5}s`,
            opacity: 0.4,
          }}
        />
      ))}

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Zoom in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.primary.main, 0.02)} 0%, 
                  ${alpha(theme.palette.secondary.main, 0.02)} 50%, 
                  ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 }, position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    animation: `${breathingAnimation} 4s ease-in-out infinite, ${pulseGlow} 3s ease-in-out infinite`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <HealingIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Join Our Healthcare Family
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    mb: 2,
                    maxWidth: 600,
                    mx: 'auto',
                  }}
                >
                  Start your journey towards personalized healthcare with AI-powered assistance
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip
                    icon={<SparkleIcon />}
                    label="AI-Powered Care"
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    icon={<SecurityIcon />}
                    label="Secure & Private"
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              </Box>

              {/* Stepper */}
              <Box sx={{ mb: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => (
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: completed
                                ? 'success.main'
                                : active
                                ? 'primary.main'
                                : 'grey.300',
                              color: 'white',
                              transition: 'all 0.3s',
                              ...(active && {
                                animation: `${pulseGlow} 2s ease-in-out infinite`,
                              }),
                            }}
                          >
                            {completed ? <CheckIcon /> : step.icon}
                          </Avatar>
                        )}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: activeStep === index ? 600 : 400,
                            color: activeStep === index ? 'primary.main' : 'text.secondary',
                            mt: 1,
                          }}
                        >
                          {step.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Form Content */}
              <Box component="form" onSubmit={handleSubmit}>
                <Card
                  elevation={0}
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    p: 3,
                    mb: 3,
                  }}
                >
                  {renderStepContent(activeStep)}
                </Card>

                {/* Error Message */}
                {error && (
                  <Fade in={true}>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<BackIcon />}
                    sx={{
                      borderRadius: 3,
                      px: 3,
                      py: 1.5,
                      visibility: activeStep === 0 ? 'hidden' : 'visible',
                    }}
                  >
                    Back
                  </Button>

                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading || !validateStep(activeStep)}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SparkleIcon />}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      disabled={!validateStep(activeStep)}
                      endIcon={<ForwardIcon />}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>

                {/* Login Link */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
                    <Typography
                      component={Link}
                      to="/login"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'secondary.main',
                        },
                        transition: 'color 0.2s',
                      }}
                    >
                      Sign in here
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default ModernRegister;