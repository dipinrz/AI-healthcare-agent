/**
 * Script to create doctor availability slots
 * Run this with: node create-doctor-slots.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Example usage functions
async function createSlotsForAllDoctors() {
  try {
    console.log('🏥 Creating availability slots for all doctors...');
    
    const response = await axios.post(`${API_BASE}/doctor-availability/seed-data`);
    
    if (response.data.success) {
      console.log('✅ Success:', response.data.message);
      console.log(`📊 Generated ${response.data.data.slotsCount} slots for ${response.data.data.doctorsCount} doctors`);
    } else {
      console.log('❌ Error:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error creating slots:', error.response?.data?.message || error.message);
  }
}

async function createSlotsForSpecificDoctor(doctorId) {
  try {
    console.log(`🏥 Creating availability slots for doctor ${doctorId}...`);
    
    const response = await axios.post(`${API_BASE}/doctor-availability/doctor/${doctorId}/generate-slots`);
    
    if (response.data.success) {
      console.log('✅ Success:', response.data.message);
      console.log(`📊 Generated ${response.data.data.slotsCount} slots`);
    } else {
      console.log('❌ Error:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error creating slots:', error.response?.data?.message || error.message);
  }
}

async function getDoctorsList() {
  try {
    console.log('👨‍⚕️ Fetching doctors list...');
    
    const response = await axios.get(`${API_BASE}/doctors`);
    
    if (response.data.success) {
      console.log('📋 Available Doctors:');
      response.data.data.forEach(doctor => {
        console.log(`  • Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) - ID: ${doctor.id}`);
      });
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Error fetching doctors:', error.response?.data?.message || error.message);
  }
}

async function viewDoctorSlots(doctorId, date = null) {
  try {
    let url = `${API_BASE}/doctor-availability/doctor/${doctorId}/slots`;
    if (date) {
      url += `?date=${date}`;
    }
    
    console.log(`📅 Fetching slots for doctor ${doctorId}...`);
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      console.log(`📊 Found ${response.data.data.length} slots:`);
      response.data.data.slice(0, 10).forEach(slot => {
        const status = slot.is_booked ? '🔴 Booked' : '🟢 Available';
        console.log(`  • ${slot.start_time} - ${slot.end_time} ${status}`);
      });
      
      if (response.data.data.length > 10) {
        console.log(`  ... and ${response.data.data.length - 10} more slots`);
      }
    }
  } catch (error) {
    console.error('❌ Error fetching slots:', error.response?.data?.message || error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Doctor Availability Slot Manager\n');
  
  // Option 1: Create slots for all doctors
  await createSlotsForAllDoctors();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Option 2: Get doctors list and create slots for specific doctor
  const doctors = await getDoctorsList();
  if (doctors && doctors.length > 0) {
    const firstDoctor = doctors[0];
    console.log('\n' + '='.repeat(50) + '\n');
    await createSlotsForSpecificDoctor(firstDoctor.id);
    
    console.log('\n' + '='.repeat(50) + '\n');
    await viewDoctorSlots(firstDoctor.id);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createSlotsForAllDoctors,
  createSlotsForSpecificDoctor,
  getDoctorsList,
  viewDoctorSlots
};