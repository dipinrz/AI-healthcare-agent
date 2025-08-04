#!/usr/bin/env python3
"""
Healthcare Appointment Booking MCP Server

This MCP server provides tools for booking, managing, and checking healthcare appointments.
It connects to the PostgreSQL database used by the healthcare application.
"""

import asyncio
import asyncpg
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Sequence
from dateutil import parser as date_parser

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import Resource, Tool, TextContent, ImageContent, EmbeddedResource
import mcp.types as types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("appointment-mcp-server")

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres", 
    "password": "root",
    "database": "ai-agent"
}

class AppointmentMCPServer:
    def __init__(self):
        self.server = Server("appointment-booking-mcp")
        self.db_pool = None
        
    async def init_db(self):
        """Initialize database connection pool"""
        try:
            self.db_pool = await asyncpg.create_pool(**DB_CONFIG)
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise
    
    async def close_db(self):
        """Close database connection pool"""
        if self.db_pool:
            await self.db_pool.close()
            logger.info("Database connection pool closed")

    async def get_doctors(self, specialization: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all doctors or filter by specialization"""
        query = """
        SELECT id, "firstName", "lastName", specialization, qualification, 
               experience, email, phone, department, bio, rating, "isAvailable", availability
        FROM doctor 
        WHERE "isAvailable" = true
        """
        params = []
        
        if specialization:
            query += " AND LOWER(specialization) LIKE LOWER($1)"
            params.append(f"%{specialization}%")
        
        query += " ORDER BY rating DESC, experience DESC"
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_doctor_availability(self, doctor_id: str, date: datetime) -> Dict[str, Any]:
        """Check doctor availability for a specific date"""
        day_name = date.strftime('%A').lower()
        
        # Get doctor info and availability schedule
        doctor_query = """
        SELECT "firstName", "lastName", availability
        FROM doctor 
        WHERE id = $1 AND "isAvailable" = true
        """
        
        # Get existing appointments for the date
        appointments_query = """
        SELECT "appointmentDate", duration
        FROM appointment 
        WHERE "doctorId" = $1 
        AND DATE("appointmentDate") = $2
        AND status NOT IN ('cancelled', 'no_show')
        ORDER BY "appointmentDate"
        """
        
        async with self.db_pool.acquire() as conn:
            doctor_row = await conn.fetchrow(doctor_query, doctor_id)
            if not doctor_row:
                return {"error": "Doctor not found or not available"}
            
            appointments = await conn.fetch(appointments_query, doctor_id, date.date())
            
            doctor_name = f"Dr. {doctor_row['firstName']} {doctor_row['lastName']}"
            availability_schedule = doctor_row['availability'] or {}
            
            # Parse JSON if it's a string
            if isinstance(availability_schedule, str):
                import json
                availability_schedule = json.loads(availability_schedule)
            
            if day_name not in availability_schedule:
                return {
                    "doctor": doctor_name,
                    "date": date.strftime('%Y-%m-%d'),
                    "available_slots": [],
                    "message": f"Dr. {doctor_row['firstName']} {doctor_row['lastName']} is not available on {date.strftime('%A')}"
                }
            
            # Get day schedule
            day_schedule = availability_schedule[day_name]
            available_slots = day_schedule.get('slots', [])
            
            # Remove booked slots
            booked_times = []
            for apt in appointments:
                booked_times.append(apt['appointmentDate'].strftime('%H:%M'))
            
            free_slots = [slot for slot in available_slots if slot not in booked_times]
            
            return {
                "doctor": doctor_name,
                "date": date.strftime('%Y-%m-%d'),
                "available_slots": free_slots,
                "booked_slots": booked_times,
                "total_slots": len(available_slots)
            }

    async def book_appointment(self, patient_id: str, doctor_id: str, appointment_date: datetime, 
                             appointment_type: str, reason: Optional[str] = None, 
                             symptoms: Optional[str] = None) -> Dict[str, Any]:
        """Book a new appointment"""
        
        # Validate appointment time is available
        availability = await self.get_doctor_availability(doctor_id, appointment_date)
        if "error" in availability:
            return availability
        
        time_slot = appointment_date.strftime('%H:%M')
        if time_slot not in availability['available_slots']:
            return {
                "error": f"Time slot {time_slot} is not available. Available slots: {availability['available_slots']}"
            }
        
        # Book the appointment
        insert_query = """
        INSERT INTO appointment ("patientId", "doctorId", "appointmentDate", duration, 
                               status, type, reason, symptoms)
        VALUES ($1, $2, $3, $4, 'scheduled', $5, $6, $7)
        RETURNING id, "appointmentDate", status
        """
        
        # Get doctor info for confirmation
        doctor_query = """
        SELECT "firstName", "lastName", specialization
        FROM doctor WHERE id = $1
        """
        
        try:
            async with self.db_pool.acquire() as conn:
                # Get doctor info
                doctor_info = await conn.fetchrow(doctor_query, doctor_id)
                if not doctor_info:
                    return {"error": "Doctor not found"}
                
                # Insert appointment
                appointment = await conn.fetchrow(
                    insert_query, patient_id, doctor_id, appointment_date, 
                    30, appointment_type, reason, symptoms  # Default 30 min duration
                )
                
                return {
                    "success": True,
                    "appointment_id": appointment['id'],
                    "doctor": f"Dr. {doctor_info['firstName']} {doctor_info['lastName']}",
                    "specialization": doctor_info['specialization'],
                    "date": appointment['appointmentDate'].strftime('%Y-%m-%d'),
                    "time": appointment['appointmentDate'].strftime('%H:%M'),
                    "status": appointment['status'],
                    "type": appointment_type,
                    "message": f"Appointment successfully booked with Dr. {doctor_info['firstName']} {doctor_info['lastName']}"
                }
                
        except Exception as e:
            logger.error(f"Error booking appointment: {e}")
            return {"error": f"Failed to book appointment: {str(e)}"}

    async def get_appointments(self, patient_id: Optional[str] = None, 
                             doctor_id: Optional[str] = None, 
                             date_from: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Get appointments with optional filters"""
        
        query = """
        SELECT a.id, a."appointmentDate", a.duration, a.status, a.type, 
               a.reason, a.symptoms, a.notes,
               d."firstName" as doctor_first_name, d."lastName" as doctor_last_name, 
               d.specialization,
               p."firstName" as patient_first_name, p."lastName" as patient_last_name
        FROM appointment a
        JOIN doctor d ON a."doctorId" = d.id
        JOIN patient p ON a."patientId" = p.id
        WHERE 1=1
        """
        params = []
        param_count = 0
        
        if patient_id:
            param_count += 1
            query += f" AND a.\"patientId\" = ${param_count}"
            params.append(patient_id)
        
        if doctor_id:
            param_count += 1
            query += f" AND a.\"doctorId\" = ${param_count}"
            params.append(doctor_id)
            
        if date_from:
            param_count += 1
            query += f" AND a.\"appointmentDate\" >= ${param_count}"
            params.append(date_from)
        
        query += " ORDER BY a.\"appointmentDate\" ASC"
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            appointments = []
            for row in rows:
                appointments.append({
                    "id": row['id'],
                    "date": row['appointmentDate'].strftime('%Y-%m-%d'),
                    "time": row['appointmentDate'].strftime('%H:%M'),
                    "duration": row['duration'],
                    "status": row['status'],
                    "type": row['type'],
                    "reason": row['reason'],
                    "symptoms": row['symptoms'],
                    "notes": row['notes'],
                    "doctor": f"Dr. {row['doctor_first_name']} {row['doctor_last_name']}",
                    "doctor_specialization": row['specialization'],
                    "patient": f"{row['patient_first_name']} {row['patient_last_name']}"
                })
            
            return appointments

    async def cancel_appointment(self, appointment_id: str) -> Dict[str, Any]:
        """Cancel an appointment"""
        
        # First get appointment details
        get_query = """
        SELECT a.id, a."appointmentDate", a.status,
               d."firstName" as doctor_first_name, d."lastName" as doctor_last_name
        FROM appointment a
        JOIN doctor d ON a."doctorId" = d.id
        WHERE a.id = $1
        """
        
        update_query = """
        UPDATE appointment 
        SET status = 'cancelled', "updatedAt" = NOW()
        WHERE id = $1
        RETURNING id, status
        """
        
        try:
            async with self.db_pool.acquire() as conn:
                # Get appointment info
                appointment = await conn.fetchrow(get_query, appointment_id)
                if not appointment:
                    return {"error": "Appointment not found"}
                
                if appointment['status'] == 'cancelled':
                    return {"error": "Appointment is already cancelled"}
                
                if appointment['status'] == 'completed':
                    return {"error": "Cannot cancel a completed appointment"}
                
                # Cancel the appointment
                updated = await conn.fetchrow(update_query, appointment_id)
                
                return {
                    "success": True,
                    "appointment_id": updated['id'],
                    "status": updated['status'],
                    "doctor": f"Dr. {appointment['doctor_first_name']} {appointment['doctor_last_name']}",
                    "original_date": appointment['appointmentDate'].strftime('%Y-%m-%d %H:%M'),
                    "message": "Appointment cancelled successfully"
                }
                
        except Exception as e:
            logger.error(f"Error cancelling appointment: {e}")
            return {"error": f"Failed to cancel appointment: {str(e)}"}

    def setup_tools(self):
        """Setup MCP tools"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            return [
                Tool(
                    name="search_doctors",
                    description="Search for available doctors, optionally filter by specialization",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "specialization": {
                                "type": "string",
                                "description": "Filter by doctor specialization (e.g., 'cardiology', 'orthopedic', 'general')"
                            }
                        }
                    }
                ),
                Tool(
                    name="check_availability",
                    description="Check doctor availability for a specific date",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "doctor_id": {
                                "type": "string",
                                "description": "Doctor's UUID"
                            },
                            "date": {
                                "type": "string",
                                "description": "Date in YYYY-MM-DD format"
                            }
                        },
                        "required": ["doctor_id", "date"]
                    }
                ),
                Tool(
                    name="book_appointment",
                    description="Book a new appointment with a doctor",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "patient_id": {
                                "type": "string",
                                "description": "Patient's UUID"
                            },
                            "doctor_id": {
                                "type": "string",
                                "description": "Doctor's UUID"
                            },
                            "date": {
                                "type": "string",
                                "description": "Appointment date in YYYY-MM-DD format"
                            },
                            "time": {
                                "type": "string",
                                "description": "Appointment time in HH:MM format (24-hour)"
                            },
                            "type": {
                                "type": "string",
                                "enum": ["consultation", "follow_up", "emergency", "routine_checkup"],
                                "description": "Type of appointment"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Reason for the appointment"
                            },
                            "symptoms": {
                                "type": "string",
                                "description": "Patient symptoms (optional)"
                            }
                        },
                        "required": ["patient_id", "doctor_id", "date", "time", "type"]
                    }
                ),
                Tool(
                    name="get_appointments",
                    description="Get appointments with optional filters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "patient_id": {
                                "type": "string",
                                "description": "Filter by patient UUID"
                            },
                            "doctor_id": {
                                "type": "string",
                                "description": "Filter by doctor UUID"
                            },
                            "date_from": {
                                "type": "string",
                                "description": "Show appointments from this date (YYYY-MM-DD)"
                            }
                        }
                    }
                ),
                Tool(
                    name="cancel_appointment",
                    description="Cancel an existing appointment",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "appointment_id": {
                                "type": "string",
                                "description": "Appointment UUID to cancel"
                            }
                        },
                        "required": ["appointment_id"]
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
            try:
                if name == "search_doctors":
                    specialization = arguments.get("specialization")
                    doctors = await self.get_doctors(specialization)
                    
                    if not doctors:
                        return [types.TextContent(
                            type="text",
                            text="No doctors found matching the criteria."
                        )]
                    
                    result = "Available Doctors:\n\n"
                    for doctor in doctors:
                        result += f"👨‍⚕️ Dr. {doctor['firstName']} {doctor['lastName']}\n"
                        result += f"   ID: {doctor['id']}\n"
                        result += f"   Specialization: {doctor['specialization']}\n"
                        result += f"   Experience: {doctor['experience']} years\n"
                        result += f"   Rating: {doctor['rating']}/5.0\n"
                        result += f"   Department: {doctor['department']}\n"
                        if doctor['bio']:
                            result += f"   Bio: {doctor['bio'][:100]}...\n"
                        result += f"   Email: {doctor['email']}\n"
                        result += f"   Phone: {doctor['phone']}\n\n"
                    
                    return [types.TextContent(type="text", text=result)]
                
                elif name == "check_availability":
                    doctor_id = arguments["doctor_id"]
                    date_str = arguments["date"]
                    
                    try:
                        date = datetime.strptime(date_str, "%Y-%m-%d")
                    except ValueError:
                        return [types.TextContent(
                            type="text",
                            text="Invalid date format. Please use YYYY-MM-DD format."
                        )]
                    
                    availability = await self.get_doctor_availability(doctor_id, date)
                    
                    if "error" in availability:
                        return [types.TextContent(type="text", text=availability["error"])]
                    
                    result = f"📅 Availability for {availability['doctor']} on {availability['date']}\n\n"
                    
                    if availability['available_slots']:
                        result += "✅ Available time slots:\n"
                        for slot in availability['available_slots']:
                            result += f"   • {slot}\n"
                        result += f"\nTotal available slots: {len(availability['available_slots'])}\n"
                    else:
                        result += "❌ No available slots for this date\n"
                    
                    if availability.get('booked_slots'):
                        result += f"\n🚫 Booked slots:\n"
                        for slot in availability['booked_slots']:
                            result += f"   • {slot}\n"
                    
                    return [types.TextContent(type="text", text=result)]
                
                elif name == "book_appointment":
                    patient_id = arguments["patient_id"]
                    doctor_id = arguments["doctor_id"]
                    date_str = arguments["date"]
                    time_str = arguments["time"]
                    appointment_type = arguments["type"]
                    reason = arguments.get("reason")
                    symptoms = arguments.get("symptoms")
                    
                    try:
                        # Combine date and time
                        datetime_str = f"{date_str} {time_str}"
                        appointment_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
                    except ValueError:
                        return [types.TextContent(
                            type="text",
                            text="Invalid date/time format. Please use YYYY-MM-DD for date and HH:MM for time."
                        )]
                    
                    result = await self.book_appointment(
                        patient_id, doctor_id, appointment_datetime, 
                        appointment_type, reason, symptoms
                    )
                    
                    if "error" in result:
                        return [types.TextContent(type="text", text=f"❌ {result['error']}")]
                    
                    response = f"✅ {result['message']}\n\n"
                    response += f"📋 Appointment Details:\n"
                    response += f"   ID: {result['appointment_id']}\n"
                    response += f"   Doctor: {result['doctor']} ({result['specialization']})\n"
                    response += f"   Date: {result['date']}\n"
                    response += f"   Time: {result['time']}\n"
                    response += f"   Type: {result['type'].replace('_', ' ').title()}\n"
                    response += f"   Status: {result['status'].title()}\n"
                    
                    return [types.TextContent(type="text", text=response)]
                
                elif name == "get_appointments":
                    patient_id = arguments.get("patient_id")
                    doctor_id = arguments.get("doctor_id")
                    date_from_str = arguments.get("date_from")
                    
                    date_from = None
                    if date_from_str:
                        try:
                            date_from = datetime.strptime(date_from_str, "%Y-%m-%d")
                        except ValueError:
                            return [types.TextContent(
                                type="text",
                                text="Invalid date format. Please use YYYY-MM-DD format."
                            )]
                    
                    appointments = await self.get_appointments(patient_id, doctor_id, date_from)
                    
                    if not appointments:
                        return [types.TextContent(
                            type="text",
                            text="No appointments found matching the criteria."
                        )]
                    
                    result = f"📅 Found {len(appointments)} appointment(s):\n\n"
                    
                    for apt in appointments:
                        status_emoji = {
                            'scheduled': '📋',
                            'confirmed': '✅', 
                            'cancelled': '❌',
                            'completed': '✓',
                            'no_show': '👻'
                        }.get(apt['status'], '📋')
                        
                        result += f"{status_emoji} {apt['date']} at {apt['time']}\n"
                        result += f"   ID: {apt['id']}\n"
                        result += f"   Doctor: {apt['doctor']} ({apt['doctor_specialization']})\n"
                        result += f"   Patient: {apt['patient']}\n"
                        result += f"   Type: {apt['type'].replace('_', ' ').title()}\n"
                        result += f"   Status: {apt['status'].title()}\n"
                        if apt['reason']:
                            result += f"   Reason: {apt['reason']}\n"
                        if apt['symptoms']:
                            result += f"   Symptoms: {apt['symptoms']}\n"
                        result += "\n"
                    
                    return [types.TextContent(type="text", text=result)]
                
                elif name == "cancel_appointment":
                    appointment_id = arguments["appointment_id"]
                    
                    result = await self.cancel_appointment(appointment_id)
                    
                    if "error" in result:
                        return [types.TextContent(type="text", text=f"❌ {result['error']}")]
                    
                    response = f"✅ {result['message']}\n\n"
                    response += f"📋 Cancelled Appointment:\n"
                    response += f"   ID: {result['appointment_id']}\n"
                    response += f"   Doctor: {result['doctor']}\n"
                    response += f"   Original Date/Time: {result['original_date']}\n"
                    response += f"   Status: {result['status'].title()}\n"
                    
                    return [types.TextContent(type="text", text=response)]
                
                else:
                    return [types.TextContent(
                        type="text",
                        text=f"Unknown tool: {name}"
                    )]
                    
            except Exception as e:
                logger.error(f"Error in tool {name}: {e}")
                return [types.TextContent(
                    type="text",
                    text=f"Error executing {name}: {str(e)}"
                )]

    async def run(self):
        """Run the MCP server"""
        await self.init_db()
        self.setup_tools()
        
        # Import here to avoid circular imports
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="appointment-booking-mcp",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )

async def main():
    server = AppointmentMCPServer()
    try:
        await server.run()
    finally:
        await server.close_db()

if __name__ == "__main__":
    asyncio.run(main())