import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import PrescriptionList from '../../components/prescriptions/PrescriptionList';

const DoctorPrescriptions: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Multi-Medication Prescriptions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage comprehensive prescriptions with multiple medications, individual dosing instructions, and patient-specific notes.
          </Typography>
        </Box>

        {/* Prescription List Component */}
        <PrescriptionList 
          showPatientInfo={true}
          showDoctorInfo={false}
          showCreateButton={true}
        />
      </Box>
    </Container>
  );
};

export default DoctorPrescriptions;