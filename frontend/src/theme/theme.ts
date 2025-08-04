import { createTheme } from '@mui/material/styles';

// Medical color palette
const medicalColors = {
  primary: '#1E40AF',      // Deep Medical Blue
  secondary: '#0D9488',    // Soft Teal
  accent: '#F97316',       // Warm Coral
  success: '#059669',      // Medical Green
  warning: '#D97706',      // Amber
  error: '#DC2626',        // Medical Red
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

export const medicalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: medicalColors.primary,
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: medicalColors.secondary,
      light: '#14B8A6',
      dark: '#0F766E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: medicalColors.error,
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: medicalColors.warning,
      light: '#F59E0B',
      dark: '#B45309',
    },
    success: {
      main: medicalColors.success,
      light: '#10B981',
      dark: '#047857',
    },
    grey: {
      50: medicalColors.gray[50],
      100: medicalColors.gray[100],
      200: medicalColors.gray[200],
      300: medicalColors.gray[300],
      400: medicalColors.gray[400],
      500: medicalColors.gray[500],
      600: medicalColors.gray[600],
      700: medicalColors.gray[700],
      800: medicalColors.gray[800],
      900: medicalColors.gray[900],
    },
    background: {
      default: medicalColors.gray[50],
      paper: '#FFFFFF',
    },
    text: {
      primary: medicalColors.gray[900],
      secondary: medicalColors.gray[600],
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif'
    ].join(','),
    h1: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: medicalColors.gray[900],
    },
    h2: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: medicalColors.gray[900],
    },
    h3: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      color: medicalColors.gray[900],
    },
    h4: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: medicalColors.gray[900],
    },
    h5: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: medicalColors.gray[900],
    },
    h6: {
      fontFamily: 'Poppins, Roboto, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
      color: medicalColors.gray[900],
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: medicalColors.gray[700],
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: medicalColors.gray[600],
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none' as const,
    }
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${medicalColors.primary} 0%, #3B82F6 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #1D4ED8 0%, ${medicalColors.primary} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: `1px solid ${medicalColors.gray[200]}`,
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: medicalColors.primary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: medicalColors.primary,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: medicalColors.gray[900],
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${medicalColors.gray[200]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: `${medicalColors.primary}15`,
          color: medicalColors.primary,
        },
        colorSecondary: {
          backgroundColor: `${medicalColors.secondary}15`,
          color: medicalColors.secondary,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: '48px',
          '&.Mui-selected': {
            color: medicalColors.primary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: medicalColors.primary,
          height: '3px',
          borderRadius: '3px',
        },
      },
    },
  },
});

export default medicalTheme;