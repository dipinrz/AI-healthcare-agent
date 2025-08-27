import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import PrescriptionList from '../components/prescriptions/PrescriptionList';

const PrescriptionsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Multi-Medication Prescriptions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage comprehensive prescriptions with multiple medications, individual dosing instructions, and patient-specific notes.
        </Typography>
        
        <PrescriptionList 
          showPatientInfo={true}
          showDoctorInfo={false}
          showCreateButton={true}
        />
      </Box>
    </Container>
  );
};

export default PrescriptionsPage;