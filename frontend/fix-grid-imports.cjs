const fs = require('fs');
const path = require('path');

// Files that need Grid component fixes
const filesToFix = [
  'src/components/Dashboard.tsx',
  'src/components/auth/ModernRegister.tsx',
  'src/pages/doctor/DoctorPrescriptions.tsx',
  'src/pages/Medications.tsx',
  'src/components/chat/SiriLikeAIChat.tsx',
  'src/components/prescriptions/ModernPrescriptionManager.tsx',
  'src/components/prescriptions/PrescriptionManager.tsx',
  'src/pages/HealthRecords.tsx',
  'src/pages/doctor/DoctorAppointments.tsx',
  'src/pages/ChatSessions.tsx',
  'src/components/chat/AIChat.tsx',
  'src/components/auth/Register.tsx',
  'src/components/appointments/BookingModal.tsx',
  'src/pages/Appointments.tsx',
  'src/components/appointments/RescheduleModal.tsx'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix Grid import - replace Grid with Grid2 as Grid
    content = content.replace(
      /import\s*{([^}]*?)Grid([^}]*?)}\s*from\s*['"]@mui\/material['"];/,
      (match, before, after) => {
        // Check if Grid2 is already imported
        if (match.includes('Grid2')) {
          return match;
        }
        // Add Grid2 as Grid
        const beforePart = before.trim();
        const afterPart = after.trim();
        const beforeComma = beforePart && !beforePart.endsWith(',') ? ',' : '';
        const afterComma = afterPart && !afterPart.startsWith(',') ? ',' : '';
        
        return `import {${beforePart}${beforeComma}\n  Grid2 as Grid${afterComma}${afterPart}} from '@mui/material';`;
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed Grid import in: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Grid imports fixed!');