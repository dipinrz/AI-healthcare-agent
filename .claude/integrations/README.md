# HMS API Integration Layer

This directory contains the API integration layer for the AI Healthcare Management System (HMS). It provides a comprehensive interface for all HMS agents to interact with the backend API.

## Files Structure

```
.claude/integrations/
├── hms-api.ts          # TypeScript implementation with full type safety
├── hms-api.js          # JavaScript implementation for broader compatibility
├── config.js           # Configuration settings and environment variables
├── example-usage.js    # Comprehensive usage examples for all agents
└── README.md          # This documentation file
```

## Features

### 🔐 Authentication & Security
- JWT token management with automatic header injection
- Token refresh handling
- Role-based access control (patient/doctor/admin)
- Secure error handling without exposing sensitive data

### 🏥 Core API Endpoints
- **Appointments**: Create, read, update, cancel, reschedule
- **Doctors**: Directory, availability, specializations
- **Patients**: Profiles, health records, history
- **Medications**: Prescriptions, drug database, interactions
- **Health Records**: Vitals, lab results, documents
- **AI Chat**: Natural language processing for appointments

### 🤖 Agent-Specific Methods
- **Appointment Scheduler**: Specialized booking and availability methods
- **Prescription Helper**: Medication info and prescription management
- **Patient Assistant**: Comprehensive patient data and chat integration
- **Hospital FAQ**: System status and information retrieval

### 🛡️ Error Handling
- Comprehensive error catching and transformation
- Network error handling
- HTTP status code interpretation
- Retry logic for recoverable errors

### ⚡ Performance Features
- Axios interceptors for request/response processing
- Batch operations for efficient data loading
- Connection pooling and timeout management
- Configurable retry mechanisms

## Quick Start

### TypeScript Usage
```typescript
import { HMSApiIntegration, hmsApi } from './hms-api';

// Use singleton instance
const result = await hmsApi.login('user@example.com', 'password');

// Or create custom instance
const customApi = new HMSApiIntegration('https://your-api.com/api');
```

### JavaScript Usage
```javascript
const HMSApiIntegration = require('./hms-api');
const { hmsApi } = require('./hms-api');

// Use singleton instance
const result = await hmsApi.login('user@example.com', 'password');

// Or create custom instance
const customApi = new HMSApiIntegration('https://your-api.com/api');
```

## Configuration

Set environment variables in your `.env` file:

```env
# API Configuration
HMS_API_URL=http://localhost:3001/api
HMS_API_TIMEOUT=10000
HMS_API_RETRY=3
HMS_API_RETRY_DELAY=1000

# Database Configuration  
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai-agent
DB_USER=postgres
DB_PASS=root

# Authentication
JWT_EXPIRY=24h
JWT_REFRESH_THRESHOLD=300

# Features
ENABLE_BATCH=true
ENABLE_REALTIME=true
ENABLE_CACHE=true
ENABLE_UPLOAD=true

# Development
NODE_ENV=development
AGENT_LOGGING=true
```

## Agent Integration Examples

### Appointment Scheduler Agent
```javascript
const hmsApi = new HMSApiIntegration();

// Login and book appointment
await hmsApi.login('patient@example.com', 'password');
const doctors = await hmsApi.getDoctors();
const slots = await hmsApi.getDoctorAvailability(doctors.data[0].id, '2024-01-15');
const appointment = await hmsApi.bookAppointment(
  doctors.data[0].id,
  slots.data[0].time,
  null,
  { reason: 'Checkup', type: 'consultation' }
);
```

### Prescription Helper Agent
```javascript
// Get patient prescriptions and medication info
const prescriptions = await hmsApi.getPrescriptions();
const medications = await hmsApi.searchMedications('lisinopril');
const medicationInfo = await hmsApi.getMedicationInfo('medication-id');
```

### Patient Assistant Agent
```javascript
// Get comprehensive patient data
const patientSummary = await hmsApi.getPatientSummary();
const healthRecord = await hmsApi.getPatientHistory();
const chatResponse = await hmsApi.sendChatMessage('I need help with my medication');
```

### Hospital FAQ Agent
```javascript
// Get system information
const systemStatus = await hmsApi.getSystemStatus();
const healthCheck = await hmsApi.healthCheck();
const doctorDirectory = await hmsApi.getDoctors();
```

## API Response Format

All API methods return responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```

Example:
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "appt-123",
    "appointmentDate": "2024-01-15T10:00:00Z",
    "doctor": { ... },
    "patient": { ... }
  }
}
```

## Error Handling

The API integration provides comprehensive error handling:

```javascript
try {
  const result = await hmsApi.bookAppointment(doctorId, date);
  console.log('Success:', result.data);
} catch (error) {
  // Error is already formatted with helpful message
  console.error('Booking failed:', error.message);
  
  // Original error details available if needed
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', error.response.data);
  }
}
```

## Authentication Flow

1. **Login**: `await hmsApi.login(email, password)`
2. **Token Storage**: Automatically stored and added to subsequent requests
3. **Token Refresh**: Handled automatically when token expires
4. **Logout**: `hmsApi.clearAuthToken()` to clear stored token

## Batch Operations

For efficiency, use batch operations when loading multiple data types:

```javascript
// Load all patient data in parallel
const batchData = await hmsApi.batchGetPatientData();
console.log({
  appointments: batchData.appointments,
  prescriptions: batchData.prescriptions,
  healthRecord: batchData.healthRecord
});
```

## File Upload Support

Upload medical documents:

```javascript
const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
const result = await hmsApi.uploadDocument(file, 'lab_result', {
  patientId: 'patient-123',
  description: 'Blood test results'
});
```

## Development & Testing

Run the example usage file to test all functionality:

```bash
node .claude/integrations/example-usage.js
```

This will demonstrate:
- Authentication flow
- All CRUD operations
- Error handling
- Batch operations
- Agent-specific methods

## Production Considerations

1. **Environment Configuration**: Use production URLs and credentials
2. **Error Monitoring**: Implement logging and monitoring for API calls
3. **Rate Limiting**: Respect API rate limits and implement backoff
4. **Security**: Never log sensitive data like tokens or patient information
5. **Caching**: Implement appropriate caching for frequently accessed data
6. **Health Checks**: Regular health checks for system monitoring

## Contributing

When adding new API methods:
1. Add to both TypeScript and JavaScript versions
2. Include proper error handling
3. Add TypeScript interfaces for response types
4. Update example usage file
5. Document in this README

## Support

For issues with the API integration:
1. Check system health: `await hmsApi.healthCheck()`
2. Verify configuration in `config.js`
3. Review error logs for specific error messages
4. Test with example usage file to isolate issues