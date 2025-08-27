import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Home,
  Chat as MessageIcon,
  Event as CalendarIcon,
  LocalPharmacy as PillIcon,
  History as ActivityIcon,
  Description as FileTextIcon,
  Person as UserIcon,
  Favorite as HeartIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  People as PatientsIcon
} from '@mui/icons-material';

interface NavigationProps {
  user: any;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const getNavigationItems = () => {
    const userRole = user?.role;
    
    if (userRole === 'doctor') {
      return [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/doctor-dashboard', icon: PatientsIcon, label: 'Patient Management' },
        { path: '/doctor/appointments', icon: CalendarIcon, label: 'My Appointments' },
        { path: '/doctor/prescriptions', icon: PillIcon, label: 'Prescriptions' },
        { path: '/chat', icon: MessageIcon, label: 'AI Chat' },
        { path: '/health-records', icon: FileTextIcon, label: 'Health Records' },
      ];
    }
    
    // Default patient navigation
    return [
      { path: '/', icon: Home, label: 'Dashboard' },
      { path: '/chat', icon: MessageIcon, label: 'AI Chat' },
      { path: '/appointments', icon: CalendarIcon, label: 'Appointments' },
      { path: '/medications', icon: PillIcon, label: 'Medications' },
      { path: '/chat-sessions', icon: ActivityIcon, label: 'Chat History' },
      { path: '/health-records', icon: FileTextIcon, label: 'Health Records' },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
          <HeartIcon />
        </Avatar>
        <Typography variant="h6" component="div">
          AI Health Assistant
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Your Virtual Healthcare Companion
        </Typography>
      </Box>
      <Divider />
      
      {/* User Info in Mobile Drawer */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            bgcolor: user?.role === 'doctor' ? 'success.main' : 'secondary.main',
            width: 40, 
            height: 40 
          }}>
            <UserIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.patient?.firstName || user?.doctor?.firstName || 'User'} {user?.patient?.lastName || user?.doctor?.lastName || ''}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: user?.role === 'doctor' ? 'success.main' : 'info.main',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {user?.role === 'doctor' ? '👨‍⚕️ Doctor' : user?.role === 'patient' ? '🏥 Patient' : user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: isMobile ? 1 : 0,
              mr: 4
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <HeartIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                AI Health Assistant
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Your Virtual Healthcare Companion
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={<item.icon />}
                  variant={isActive(item.path) ? 'contained' : 'text'}
                  color={isActive(item.path) ? 'primary' : 'inherit'}
                  sx={{ 
                    mx: 0.5,
                    minWidth: 120,
                    color: isActive(item.path) ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* User Role Badge */}
            {!isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                  {user?.patient?.firstName || user?.doctor?.firstName || 'User'} {user?.patient?.lastName || user?.doctor?.lastName || ''}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: user?.role === 'doctor' ? 'success.light' : 'info.light',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  {user?.role === 'doctor' ? '👨‍⚕️ Doctor' : user?.role === 'patient' ? '🏥 Patient' : user?.role}
                </Typography>
              </Box>
            )}
            
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ 
                bgcolor: user?.role === 'doctor' ? 'success.main' : 'secondary.main',
                border: '2px solid',
                borderColor: user?.role === 'doctor' ? 'success.light' : 'secondary.light'
              }}>
                <UserIcon />
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: { minWidth: 220 }
              }}
            >
              <MenuItem disabled>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.patient?.firstName || user?.doctor?.firstName || 'User'} {user?.patient?.lastName || user?.doctor?.lastName || ''}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: user?.role === 'doctor' ? 'success.main' : 'info.main',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {user?.role === 'doctor' ? '👨‍⚕️ Doctor' : user?.role === 'patient' ? '🏥 Patient' : user?.role}
                  </Typography>
                  {user?.doctor?.specialization && (
                    <Typography variant="caption" color="text.secondary">
                      {user.doctor.specialization}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navigation;