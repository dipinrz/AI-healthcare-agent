# Authentication System Setup Guide

This guide explains how to set up and use the authentication system implemented for the AI Healthcare application.

## 🏗️ Architecture Overview

The authentication system uses:
- **JWT tokens** for secure authentication
- **bcryptjs** for password hashing
- **Role-based access control** (Patient, Doctor, Admin)
- **TypeORM** for database operations
- **PostgreSQL** for data storage

## 📦 Backend Setup

### 1. Database Setup
Ensure PostgreSQL is running and create the database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE "ai-agent";

# Exit PostgreSQL
\q
```

### 2. Environment Variables
Create a `.env` file in the backend directory:
```env
JWT_SECRET=your-super-secret-jwt-key-here
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=ai-agent
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend Server
```bash
cd backend
npm install
npm run build
npm run dev
```

The server will run on `http://localhost:3001`

## 🎨 Frontend Setup

### 1. Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Authentication Endpoints

### Backend API Endpoints (`http://localhost:3001/api/auth`)

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/register` | POST | Register new user | No |
| `/login` | POST | Login user | No |
| `/profile` | GET | Get current user profile | Yes |
| `/logout` | POST | Logout user | Yes |
| `/verify` | GET | Verify JWT token | Yes |
| `/change-password` | PUT | Change password | Yes |
| `/reset-password-request` | POST | Request password reset | No |
| `/reset-password-confirm` | POST | Confirm password reset | No |

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "role": "patient"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

### Get Profile (with JWT token)
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛡️ Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs with salt rounds of 12
2. **JWT Tokens**: Secure token-based authentication with 24-hour expiration
3. **Input Validation**: Server-side validation for all inputs
4. **Role-Based Access**: Different permission levels for patients, doctors, and admins
5. **CORS Protection**: Configured to only allow requests from the frontend
6. **Helmet Security**: Security headers protection
7. **Rate Limiting**: Built-in Express rate limiting (can be enhanced)

## 👥 User Roles

### Patient
- Can register and login
- Access to patient-specific features
- Can view own appointments and medical records

### Doctor
- Can register with additional professional information
- Access to doctor-specific features
- Can manage appointments and prescriptions

### Admin
- Full system access
- User management capabilities
- System configuration access

## 🧪 Testing Authentication

### 1. Test Registration
1. Start both backend and frontend servers
2. Navigate to `http://localhost:5173/register`
3. Fill out the registration form
4. Check the browser's Network tab to see the API call
5. Verify the user is created in the database

### 2. Test Login
1. Navigate to `http://localhost:5173/login`
2. Use the registered credentials
3. Check that JWT token is stored in localStorage
4. Verify successful authentication

### 3. Test Protected Routes
1. After login, access protected features
2. Check that the Authorization header includes the JWT token
3. Test logout functionality

## 🔧 Middleware Usage

### Protect Routes
```typescript
import { authenticateToken, requireRole } from '../middleware/auth';

// Require authentication
router.get('/protected', authenticateToken, (req, res) => {
  // User is authenticated
});

// Require specific role
router.get('/doctor-only', authenticateToken, requireDoctor, (req, res) => {
  // User is authenticated and is a doctor
});
```

### Available Middleware
- `authenticateToken`: Verifies JWT token
- `requirePatient`: Requires patient role
- `requireDoctor`: Requires doctor role  
- `requireAdmin`: Requires admin role
- `requireDoctorOrAdmin`: Requires doctor or admin role

## 📊 Database Schema

### User Entity
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Hashed password
- `role`: User role (patient/doctor/admin)
- `isActive`: Account status
- `lastLogin`: Last login timestamp
- `resetToken`: Password reset token
- `resetTokenExpiry`: Reset token expiration

### Relationships
- User → Patient (one-to-one)
- User → Doctor (one-to-one)

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check database credentials in config
   - Verify database "ai-agent" exists

2. **CORS Errors**
   - Check frontend URL in backend CORS config
   - Ensure both servers are running on correct ports

3. **JWT Token Issues**
   - Check JWT_SECRET in environment variables
   - Verify token is being sent in Authorization header
   - Check token expiration (24 hours default)

4. **Registration/Login Failures**
   - Check browser Network tab for detailed error messages
   - Verify all required fields are provided
   - Check backend console for database errors

### Backend Logs
The backend provides detailed logging:
- Database connection status
- Authentication attempts
- Error messages with stack traces

### Frontend Development
- Use browser DevTools Network tab to debug API calls
- Check localStorage for stored tokens and user data
- Use React DevTools for component state inspection

## 🔄 Next Steps

1. **Email Verification**: Add email verification for new registrations
2. **Password Strength**: Implement stronger password requirements
3. **Session Management**: Add session timeout and refresh tokens
4. **Two-Factor Authentication**: Implement 2FA for enhanced security
5. **Audit Logging**: Add comprehensive audit trails
6. **Rate Limiting**: Implement advanced rate limiting per user/IP
7. **Account Lockout**: Add account lockout after failed attempts