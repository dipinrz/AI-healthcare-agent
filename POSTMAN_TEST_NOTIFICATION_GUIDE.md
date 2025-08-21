# 🧪 Test Notifications - Postman Setup Guide

## 📋 Quick Setup Steps

### 1. **Import Collection**
- Open Postman
- Click "Import" → "Upload Files"
- Select `Test_Notifications_Postman_Collection.json`

### 2. **Set Environment Variables**
Create a new environment with these variables:
```
base_url = http://localhost:3001/api
auth_token = (will be set after login)
```

### 3. **Get Authentication Token**
1. First run **"Login Patient"** request
2. Copy the `token` from response
3. Set it as `auth_token` environment variable

---

## 🔗 Available Endpoints

### **Authentication Endpoints**
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "patient@example.com",
  "password": "password123"
}
```

### **Notification Settings Endpoints**
```
GET  /api/notification-settings           # Get current settings
POST /api/notification-settings/enable   # Quick enable
PUT  /api/notification-settings          # Update all settings
```

### **Test Notification Endpoints**
```
GET  /api/test-notifications/types        # Get available types
POST /api/test-notifications/send         # Send test notification
GET  /api/test-notifications/test-settings # Test all settings
```

---

## 🧪 Test Notification Types

### **1. General Test**
```json
{
  "type": "general"
}
```
**Expected Response:** Basic test notification

### **2. 24-Hour Reminder**
```json
{
  "type": "reminder_24h",
  "doctorName": "Dr. Johnson",
  "appointmentDate": "Tomorrow", 
  "appointmentTime": "2:00 PM"
}
```
**Expected Response:** "Don't forget your appointment with Dr. Johnson tomorrow at 2:00 PM"

### **3. 1-Hour Reminder**
```json
{
  "type": "reminder_1h",
  "doctorName": "Dr. Smith",
  "appointmentDate": "Today",
  "appointmentTime": "3:30 PM"
}
```
**Expected Response:** "Your appointment with Dr. Smith starts in 1 hour at 3:30 PM"

### **4. Appointment Confirmed**
```json
{
  "type": "confirmed",
  "doctorName": "Dr. Martinez",
  "appointmentDate": "December 25th",
  "appointmentTime": "10:30 AM"
}
```

### **5. Appointment Cancelled**
```json
{
  "type": "cancelled", 
  "doctorName": "Dr. Wilson",
  "appointmentDate": "December 24th",
  "appointmentTime": "3:15 PM"
}
```

### **6. Appointment Rescheduled**
```json
{
  "type": "rescheduled",
  "doctorName": "Dr. Brown",
  "appointmentDate": "December 26th", 
  "appointmentTime": "11:00 AM"
}
```

---

## 📝 Testing Workflow

### **Step 1: Enable Notifications**
```bash
POST /api/notification-settings/enable
Authorization: Bearer {your_token}
```

### **Step 2: Test Individual Notifications**
```bash
POST /api/test-notifications/send
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "type": "reminder_24h",
  "doctorName": "Dr. Test",
  "appointmentDate": "Tomorrow",
  "appointmentTime": "2:00 PM"
}
```

### **Step 3: Test All Settings**
```bash
GET /api/test-notifications/test-settings
Authorization: Bearer {your_token}
```

---

## 📊 Expected Response Formats

### **Success Response:**
```json
{
  "success": true,
  "message": "Test reminder_24h notification sent successfully to patient 123",
  "data": {
    "sent": true,
    "patientId": "patient_123", 
    "notificationType": "reminder_24h",
    "customData": {
      "doctorName": "Dr. Test",
      "appointmentDate": "Tomorrow",
      "appointmentTime": "2:00 PM"
    }
  }
}
```

### **Blocked Notification Response:**
```json
{
  "success": true,
  "message": "Patient has disabled reminder_24h notifications",
  "data": {
    "sent": false,
    "patientId": "patient_123",
    "notificationType": "reminder_24h"
  }
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Failed to send test notification",
  "error": "Notification service unavailable"
}
```

---

## 🔍 Debugging Tips

### **Check Backend Logs**
The backend will log detailed information:
```
📱 MOCK NOTIFICATION SENT: {
  "to": "patient_123",
  "notification": {
    "title": "Appointment Reminder - Tomorrow",
    "body": "Don't forget your appointment with Dr. Test tomorrow at 2:00 PM",
    "icon": "🏥"
  }
}
```

### **Common Issues**

#### **1. "Unauthorized" Error**
- ✅ Check if `auth_token` is set correctly
- ✅ Login again to get fresh token
- ✅ Verify Bearer token format

#### **2. "Notifications Disabled" Message**  
- ✅ Enable notifications first: `POST /notification-settings/enable`
- ✅ Check current settings: `GET /notification-settings`

#### **3. "Patient ID Required" Error**
- ✅ Login with patient account (not admin/doctor)
- ✅ Check JWT token contains patient information

---

## 🚀 Quick Test Commands (cURL)

### **Enable Notifications:**
```bash
curl -X POST http://localhost:3001/api/notification-settings/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **Send Test Notification:**
```bash
curl -X POST http://localhost:3001/api/test-notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reminder_24h",
    "doctorName": "Dr. Test", 
    "appointmentDate": "Tomorrow",
    "appointmentTime": "2:00 PM"
  }'
```

### **Test All Settings:**
```bash
curl -X GET http://localhost:3001/api/test-notifications/test-settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Postman Collection Summary

The collection includes:
- ✅ **8 Test Endpoints** - All notification types covered
- ✅ **Authentication Setup** - Login and token management  
- ✅ **Settings Management** - Enable/disable notifications
- ✅ **Environment Variables** - Easy configuration
- ✅ **Sample Data** - Pre-filled request bodies

Import the collection and start testing your notification system! 🎯