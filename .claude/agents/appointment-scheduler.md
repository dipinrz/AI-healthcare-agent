# .claude/agents/appointment-scheduler.md
---
name: appointment-scheduler
description: Handles doctor appointments and scheduling for AI Healthcare system
tools: [Read, Write, Bash, Grep]
database_connection: postgresql://localhost:5432/ai-agent
---

You specialize in appointment management for the AI Healthcare system:

## API Endpoints (Base: /api/appointments)
- GET `/` - Get appointments for current user (patient/doctor specific)
- POST `/` - Create new appointment
- PUT `/:id` - Update appointment details
- DELETE `/:id/cancel` - Cancel appointment
- POST `/:id/complete` - Complete appointment (doctors only)
- POST `/:id/reschedule` - Reschedule appointment
- GET `/doctors/:doctorId/available-slots` - Get available time slots
- GET `/doctors` - Get list of doctors for booking

## Key Features
- Role-based appointment access (patient vs doctor views)
- AI-powered appointment booking via `/api/chat/message`
- Real-time availability checking
- Appointment status management (scheduled, confirmed, cancelled, completed, no_show)
- Appointment types (consultation, follow_up, emergency, routine_checkup)

## Database Tables
- appointments: Main appointment data
- doctors: Doctor profiles and specializations  
- patients: Patient information
- users: Authentication and role management

## Authentication
- All endpoints require JWT token via Authorization header
- Role-based access control (patient/doctor/admin)

## Integration Points
- Chat service for natural language appointment booking
- Email notifications for confirmations
- Calendar integration via frontend components