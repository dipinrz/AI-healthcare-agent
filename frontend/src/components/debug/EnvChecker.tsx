import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Alert } from '@mui/material';
import { ENV_INFO } from '../../config/api';

const EnvChecker: React.FC = () => {
  return (
    <Card sx={{ mb: 2, border: '1px dashed', borderColor: 'info.main' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, color: 'info.main' }}>
          🔧 Environment Configuration
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label={`Environment: ${ENV_INFO.IS_DEVELOPMENT ? 'Development' : 'Production'}`}
            color={ENV_INFO.IS_DEVELOPMENT ? 'warning' : 'success'}
            size="small"
          />
          <Chip 
            label={`API: ${ENV_INFO.API_BASE_URL}`}
            color="primary"
            size="small"
          />
          <Chip 
            label={`Logging: ${ENV_INFO.ENABLE_LOGGING ? 'Enabled' : 'Disabled'}`}
            color={ENV_INFO.ENABLE_LOGGING ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          <Typography variant="body2">
            <strong>{ENV_INFO.APP_NAME}</strong> v{ENV_INFO.APP_VERSION} - 
            API calls are now using environment variables. 
            To change the backend URL, update VITE_API_BASE_URL in your .env file.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EnvChecker;