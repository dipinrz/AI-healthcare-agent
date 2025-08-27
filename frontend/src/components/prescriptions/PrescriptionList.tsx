import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {Grid} from '@mui/system';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Medication as MedicationIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import PrescriptionCard from './PrescriptionCard';
import MultiMedicationPrescriptionForm from './MultiMedicationPrescriptionForm';
import prescriptionsService, { type Prescription, type PrescriptionFilters } from '../../services/prescriptionsService';
import toast from 'react-hot-toast';

interface PrescriptionListProps {
  patientId?: string;
  showPatientInfo?: boolean;
  showDoctorInfo?: boolean;
  showCreateButton?: boolean;
}

const PrescriptionList: React.FC<PrescriptionListProps> = ({
  patientId,
  showPatientInfo = true,
  showDoctorInfo = true,
  showCreateButton = true,
}) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    discontinued: 0,
  });

  const limit = 10;

  useEffect(() => {
    fetchPrescriptions();
    fetchStats();
  }, [page, statusFilter, patientId]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm || page !== 1) {
        setPage(1);
        fetchPrescriptions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const filters: PrescriptionFilters = {};
      
      if (statusFilter) filters.status = statusFilter;
      if (patientId) filters.patientId = patientId;
      if (user?.role === 'doctor') filters.doctorId = user.doctor?.id;

      let response: any;
      if (searchTerm) {
        response = await prescriptionsService.searchPrescriptions(searchTerm);
        setPrescriptions(response.data || []);
        setTotalPages(1);
      } else {
        response = await prescriptionsService.getAllPrescriptions(filters, page, limit);
        setPrescriptions(response.data || []);
        setTotalPages(response.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response: any = await prescriptionsService.getPrescriptionStats();
      setStats(response.data || stats);
    } catch (error) {
      console.error('Error fetching prescription stats:', error);
    }
  };

  const handleCreateSuccess = () => {
    fetchPrescriptions();
    fetchStats();
  };

  const handlePrescriptionUpdate = () => {
    fetchPrescriptions();
    fetchStats();
  };

  const canCreatePrescription = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicationIcon color="primary" />
          <Typography variant="h5">
            {patientId ? 'Patient Prescriptions' : 'All Prescriptions'}
          </Typography>
        </Box>
        {showCreateButton && canCreatePrescription && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setCreateFormOpen(true)}
            disabled={false}
          >
            New Multi-Medication Prescription
          </Button>
        )}
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 6, md: 3}}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Prescriptions
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.active}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats.discontinued}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discontinued
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="discontinued">Discontinued</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Prescriptions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : prescriptions.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            canCreatePrescription && patientId ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setCreateFormOpen(true)}
              >
                Create First Prescription
              </Button>
            ) : null
          }
        >
          {searchTerm || statusFilter 
            ? 'No prescriptions found matching your criteria.' 
            : 'No prescriptions found.'}
        </Alert>
      ) : (
        <>
          <Stack spacing={2}>
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onUpdate={handlePrescriptionUpdate}
                showPatientInfo={showPatientInfo}
                showDoctorInfo={showDoctorInfo}
              />
            ))}
          </Stack>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Prescription Form */}
      {createFormOpen && (
        <MultiMedicationPrescriptionForm
          open={createFormOpen}
          onClose={() => setCreateFormOpen(false)}
          onSuccess={handleCreateSuccess}
          patientId={patientId || ''}
          doctorId={user?.doctor?.id || ''}
        />
      )}
    </Box>
  );
};

export default PrescriptionList;