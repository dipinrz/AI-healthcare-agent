# 🧪 Test Queries for Healthcare Appointment MCP Server

This document contains comprehensive test queries to validate your appointment booking MCP server functionality.

## 🚀 Quick Start Test Sequence

Run these in order to verify basic functionality:

1. **"Show me all available doctors"**
2. **"Check Dr. [Name]'s availability for tomorrow"**  
   *(Use actual doctor name from step 1)*
3. **"Book an appointment with Dr. [Name] for [Date] at [Time]"**
   *(Use available slot from step 2)*
4. **"Show me my upcoming appointments"**
5. **"Cancel appointment with ID [appointment_id]"**
   *(Use ID from step 3)*

## 📅 Basic Appointment Booking Queries

### Simple Booking Requests
```
"I need to book an appointment with Dr. Smith for tomorrow"
"Book appointment with Dr. Johnson for next Monday at 2pm"
"Schedule me with a cardiologist for this week"
"I want to see Dr. Brown on December 15th at 10am"
"Book me with any available doctor for tomorrow morning"
"Schedule an appointment for next Friday afternoon"
"I need to see a doctor this week"
"Book me the earliest available appointment"
```

### Specific Date/Time Requests
```
"Book Dr. Smith for August 5th, 2025 at 10:30 AM"
"Schedule Dr. Johnson for 2025-08-06 at 14:00"
"I want to see Dr. Brown on Monday at 9am"
"Book appointment for next Tuesday at 3:30 PM"
"Schedule me for this Thursday morning at 11:00"
```

## 🔍 Doctor Search & Availability Queries

### Finding Doctors
```
"What doctors are available this week?"
"Show me all cardiologists"
"Find me an orthopedic doctor"
"List all available doctors"
"Who are the neurologists in the system?"
"Show me doctors with high ratings"
"Find me a general practitioner"
"What specialists are available?"
```

### Checking Availability
```
"When is Dr. Smith available?"
"Show me available times for Dr. Johnson tomorrow"
"What are Dr. Brown's free slots this week?"
"When can I see Dr. Wilson next?"
"What times is Dr. Davis free on Friday?"
"Show me Dr. Miller's schedule for next week"
"What are the earliest available slots?"
"Which doctors are free on Friday afternoon?"
```

## ⚡ Emergency & Urgent Appointment Queries

### Immediate Care
```
"I need an emergency appointment today"
"Book urgent appointment for chest pain"
"Emergency consultation needed now"
"I need to see a doctor immediately for severe headache"
"Book same-day appointment for fever and nausea"
"Urgent: need appointment for breathing problems"
"Emergency booking for allergic reaction"
"I need immediate medical attention for injury"
```

### Same-Day Booking
```
"Can I see a doctor today?"
"Book me today if possible"
"Any appointments available right now?"
"I need same-day consultation"
"What's the earliest I can be seen today?"
"Book me for this afternoon if available"
```

## 🔄 Appointment Management Queries

### Viewing Appointments
```
"Show me my upcoming appointments"
"What appointments do I have this week?"
"Display my appointment history"
"List all my appointments with Dr. Smith"
"Show me appointments for next month"
"What's my next appointment?"
"Display appointments after August 1st"
"Show me all cancelled appointments"
```

### Cancellation Requests
```
"Cancel my appointment"
"I need to cancel my upcoming appointment"
"Cancel my appointment with Dr. Smith"
"Remove my appointment for tomorrow"
"I want to cancel appointment ID [specific_id]"
"Cancel all my appointments for next week"
"Remove my appointment on Friday"
```

### Rescheduling (Implemented as cancel + rebook)
```
"Reschedule my appointment to next week"
"Change my appointment time to 3pm"
"Move my appointment to Friday"
"Can I reschedule for a different time?"
"Change my Tuesday appointment to Wednesday"
"Move my morning appointment to afternoon"
```

## 🏥 Medical Specialization Queries

### Specialty-Based Booking
```
"Book follow-up appointment with Dr. Johnson"
"I need a routine checkup next month"
"Schedule annual physical exam"
"Book appointment for blood pressure check"
"Need consultation for diabetes management"
"Schedule dermatology appointment for skin rash"
"Book cardiology consultation for heart palpitations"
"I need orthopedic appointment for knee pain"
"Schedule neurology appointment for migraines"
"Book psychiatry consultation for anxiety"
```

### Condition-Specific Requests
```
"I need to see someone about my back pain"
"Book appointment for diabetes follow-up"
"Schedule consultation for high blood pressure"
"I need help with anxiety management"
"Book appointment for skin condition"
"Need consultation for joint pain"
"Schedule appointment for chronic headaches"
"Book follow-up for recent surgery"
```

## 📋 Complex Booking Scenarios

### Multi-Option Requests
```
"Book Dr. Smith for tomorrow, if not available try Dr. Johnson"
"I need afternoon appointment next week, any doctor is fine"
"Schedule consultation for my back pain with orthopedist"
"Book appointment but I can only do mornings"
"Find me the earliest appointment with any cardiologist"
"Book me with whoever is available first"
"I prefer Dr. Smith but will take anyone if needed"
```

### Preference-Based Booking
```
"Book me with the highest rated doctor available"
"I prefer morning appointments with Dr. Johnson"
"Schedule me with the most experienced cardiologist"
"Book afternoon slot with any available doctor"
"I want to see Dr. Smith but only if available this week"
"Find me a female doctor if possible"
"Book with whoever has the earliest opening"
```

## ❓ Conversational & Natural Language Queries

### Casual Language
```
"Hi, I'm not feeling well and need to see a doctor"
"Can you help me book an appointment?"
"I have been having headaches, who should I see?"
"My regular doctor is Dr. Smith, when can I see him?"
"I need to schedule something for my annual checkup"
"Hey, can you find me a doctor for next week?"
"I'm having some health issues, need to see someone"
"Can you check when Dr. Brown is free?"
```

### Questions & Clarifications
```
"What types of appointments can I book?"
"How far in advance can I schedule?"
"What information do I need to provide?"
"Can I book for someone else?"
"What if I need to change my appointment?"
"How do I know if my appointment is confirmed?"
"What should I bring to my appointment?"
```

## 🎯 Testing AI Understanding & Edge Cases

### Abbreviated/Informal Queries
```
"Book me with Dr. A for tomorrow 12pm"
"Schedule doc johnson for next mon 3"
"need appt w/ dr smith asap"
"can i see dr brown this fri morning?"
"reschedule to next tuesday"
"cancel appt for wed"
"book cardio doc for next wk"
```

### Ambiguous Requests
```
"Book me an appointment"
"I need to see a doctor"
"Schedule something soon"
"When can I come in?"
"Find me a doctor"
"I need medical help"
"Book me next week"
"Cancel my appointment" (when multiple exist)
```

### Invalid/Edge Case Queries
```
"Book appointment with Dr. XYZ" (non-existent doctor)
"Schedule for yesterday" (past date)
"Book at 25:00" (invalid time)
"I want to see Dr. Smith on February 30th" (invalid date)
"Book appointment for 13 months from now"
"Schedule me for next Blursday" (invalid day)
```

## 🧪 Systematic Testing Strategy

### Phase 1: Basic Functionality
1. **Doctor Search**: Test finding doctors with/without specialization
2. **Availability Check**: Verify date/time availability checking
3. **Simple Booking**: Book basic appointments
4. **View Appointments**: Check appointment retrieval
5. **Cancellation**: Test appointment cancellation

### Phase 2: Complex Scenarios  
1. **Multi-Step Booking**: Search → Check → Book flow
2. **Conflict Handling**: Try booking occupied slots
3. **Preference Management**: Test preferred doctors/times
4. **Bulk Operations**: Multiple appointments for one patient

### Phase 3: Edge Cases & Error Handling
1. **Invalid Data**: Test with wrong IDs, dates, times
2. **Missing Data**: Test with incomplete information
3. **System Limits**: Test extreme dates, large data sets
4. **Concurrent Access**: Multiple simultaneous bookings

### Phase 4: Integration Testing
1. **Database State**: Verify data consistency
2. **Real-time Updates**: Test availability updates
3. **Performance**: Test response times with large data
4. **Error Recovery**: Test after failed operations

## 📊 Expected Responses

### Successful Booking Response:
```
✅ Appointment successfully booked with Dr. Smith

📋 Appointment Details:
   ID: 123e4567-e89b-12d3-a456-426614174000
   Doctor: Dr. John Smith (Cardiology)
   Date: 2025-08-05
   Time: 14:00
   Type: Consultation
   Status: Scheduled
```

### Availability Check Response:
```
📅 Availability for Dr. Smith on 2025-08-05

✅ Available time slots:
   • 09:00
   • 10:30
   • 14:00
   • 15:30

Total available slots: 4
```

### Error Response:
```
❌ Time slot 14:00 is not available. Available slots: [09:00, 10:30, 15:30]
```

## 🔄 Continuous Testing

Create a regular testing routine:

1. **Daily Smoke Tests**: Basic booking/cancellation flow
2. **Weekly Comprehensive**: All major features and edge cases  
3. **Monthly Load Tests**: Performance with realistic data volumes
4. **Before Deployments**: Full regression test suite

## 💡 Testing Tips

1. **Use Real Data**: Test with actual doctor/patient data when possible
2. **Test Different Time Zones**: Verify date/time handling
3. **Vary Language Patterns**: Mix formal and casual language
4. **Check Data Persistence**: Verify bookings persist correctly
5. **Test Error Recovery**: Ensure graceful handling of failures
6. **Monitor Logs**: Check server logs for debugging info

This comprehensive test suite ensures your MCP server handles real-world appointment booking scenarios effectively!