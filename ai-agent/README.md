# Healthcare Appointment Booking MCP Server

This MCP (Model Context Protocol) server provides AI agents with tools to manage healthcare appointments. It connects to your existing PostgreSQL database and provides comprehensive appointment booking, scheduling, and management capabilities.

## 🚀 Features

### Core Tools Available:
- **search_doctors** - Find available doctors with optional specialization filtering
- **check_availability** - Check doctor availability for specific dates  
- **book_appointment** - Book new appointments with comprehensive details
- **get_appointments** - Retrieve appointments with flexible filtering
- **cancel_appointment** - Cancel existing appointments

### Capabilities:
- ✅ Real-time doctor availability checking
- ✅ Smart appointment conflict detection  
- ✅ Multiple appointment types (consultation, follow-up, emergency, routine)
- ✅ Specialization-based doctor search
- ✅ Comprehensive appointment history
- ✅ Patient and doctor-specific filtering

## 📋 Prerequisites

1. **PostgreSQL Database** - Your healthcare app database should be running
2. **Python 3.8+** - Required for the MCP server
3. **Claude Desktop** - To interact with the MCP server
4. **Database Access** - Server needs read/write access to your database

## 🛠️ Installation

### 1. Install Dependencies
```bash
cd ai-agent
pip install -r requirements.txt
```

### 2. Database Configuration
The server connects to your existing PostgreSQL database with these default settings:
```python
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres", 
    "password": "root",
    "database": "ai-agent"
}
```

To change these settings, edit the `DB_CONFIG` dictionary in `appointment_mcp_server.py`.

### 3. Test Database Connection
```bash
# Make sure your PostgreSQL server is running
sudo systemctl start postgresql

# Test connection (optional)
psql -h localhost -U postgres -d ai-agent -c "SELECT COUNT(*) FROM doctor;"
```

## ⚙️ Claude Desktop Configuration

Add this to your Claude Desktop `claude_desktop_config.json`:

### Windows
Location: `%APPDATA%\Claude\claude_desktop_config.json`

### macOS  
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Linux
Location: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "appointment-booking": {
      "command": "python",
      "args": ["/full/path/to/ai-healthcare-new/ai-agent/appointment_mcp_server.py"],
      "env": {}
    }
  }
}
```

**Important**: Replace `/full/path/to/ai-healthcare-new` with the actual absolute path to your project.

## 🧪 Testing the MCP Server

### 1. Start Your Database
Make sure your PostgreSQL server and healthcare backend are running:
```bash
# In your backend directory
cd backend
npm run dev
```

### 2. Test MCP Server Directly
```bash
cd ai-agent
python appointment_mcp_server.py
```

### 3. Test in Claude Desktop
Restart Claude Desktop and try these test queries:

#### 📅 Basic Appointment Booking:
```
"I need to book an appointment with Dr. Smith for tomorrow"
"Book appointment with Dr. Johnson for next Monday at 2pm" 
"Schedule me with a cardiologist for this week"
"I want to see Dr. Brown on December 15th at 10am"
"Book me with any available doctor for tomorrow morning"
```

#### 🔍 Check Doctor Availability:
```
"What doctors are available this week?"
"When is Dr. Smith available?"
"Show me available times for Dr. Johnson tomorrow"
"What are the earliest available slots?"
"Which doctors are free on Friday afternoon?"
```

#### ⚡ Emergency/Urgent Appointments:
```
"I need an emergency appointment today"
"Book urgent appointment for chest pain"
"Emergency consultation needed now"
"I need to see a doctor immediately for severe headache"
"Book same-day appointment for fever and nausea"
```

#### 🔄 Appointment Management:
```
"Cancel my appointment"
"I need to cancel my upcoming appointment"
"Show me my upcoming appointments"
"What appointments do I have this week?"
```

#### 🏥 Specific Medical Needs:
```
"Book follow-up appointment with Dr. Johnson"
"I need a routine checkup next month"  
"Schedule annual physical exam"
"Book appointment for blood pressure check"
"Need consultation for diabetes management"
```

## 🔧 Tool Reference

### search_doctors
Search for available doctors with optional specialization filtering.

**Parameters:**
- `specialization` (optional): Filter by specialization (e.g., 'cardiology', 'orthopedic')

**Example Usage:**
```
"Find me a cardiologist"
"Show me all available doctors"
"Search for orthopedic doctors"
```

### check_availability  
Check doctor availability for a specific date.

**Parameters:**
- `doctor_id` (required): Doctor's UUID
- `date` (required): Date in YYYY-MM-DD format

**Example Usage:**
```
"Check Dr. Smith's availability for tomorrow"
"What times is Dr. Johnson free on 2025-08-05?"
```

### book_appointment
Book a new appointment with comprehensive details.

**Parameters:**
- `patient_id` (required): Patient's UUID
- `doctor_id` (required): Doctor's UUID  
- `date` (required): Date in YYYY-MM-DD format
- `time` (required): Time in HH:MM format (24-hour)
- `type` (required): consultation|follow_up|emergency|routine_checkup
- `reason` (optional): Reason for appointment
- `symptoms` (optional): Patient symptoms

### get_appointments
Retrieve appointments with flexible filtering.

**Parameters:**
- `patient_id` (optional): Filter by patient UUID
- `doctor_id` (optional): Filter by doctor UUID
- `date_from` (optional): Show appointments from date (YYYY-MM-DD)

### cancel_appointment
Cancel an existing appointment.

**Parameters:**
- `appointment_id` (required): Appointment UUID to cancel

## 🗃️ Database Schema

The MCP server works with these existing tables:

### doctor
- `id` (UUID) - Primary key
- `firstName`, `lastName` - Doctor name
- `specialization` - Medical specialization  
- `availability` (JSON) - Weekly schedule with time slots
- `isAvailable` (boolean) - Active status

### appointment  
- `id` (UUID) - Primary key
- `appointmentDate` (timestamp) - Date and time
- `status` - scheduled|confirmed|cancelled|completed|no_show
- `type` - consultation|follow_up|emergency|routine_checkup
- `patient_id`, `doctor_id` - Foreign keys

### patient
- `id` (UUID) - Primary key  
- `firstName`, `lastName` - Patient name

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U postgres -d ai-agent

# Check if tables exist
\dt
```

### MCP Server Issues
```bash
# Check Python dependencies
pip list | grep mcp

# Test server directly
cd ai-agent
python appointment_mcp_server.py

# Check logs
tail -f appointment_mcp_server.log
```

### Claude Desktop Issues
1. **Restart Claude Desktop** after config changes
2. **Check config path** - ensure correct JSON file location
3. **Verify absolute paths** - use full paths, not relative ones
4. **Check JSON syntax** - validate your configuration file

### Common Error Messages

**"Doctor not found"** - Doctor ID doesn't exist or doctor is inactive
**"Time slot not available"** - Requested time is already booked  
**"Invalid date format"** - Use YYYY-MM-DD for dates, HH:MM for times
**"Database connection failed"** - Check PostgreSQL server and credentials

## 📊 Sample Data

To test effectively, ensure your database has:
- At least 2-3 doctors with different specializations
- Doctor availability schedules configured
- A few sample patients
- Various appointment types represented

## 🔒 Security Notes

- Server connects to localhost database only
- No authentication tokens stored
- All database queries use parameterized statements
- Logging excludes sensitive patient data

## 🚀 Next Steps

Once working well in Claude Desktop:
1. **Integration** - Connect to your frontend chat interface
2. **Enhanced RAG** - Add vector search for complex queries  
3. **Notifications** - Add appointment reminders
4. **Scheduling Logic** - Implement smart scheduling algorithms
5. **Analytics** - Add appointment analytics and reporting

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your database schema matches expectations
3. Test database connectivity independently
4. Check Claude Desktop logs for MCP server errors

The MCP server provides comprehensive logging to help diagnose issues.