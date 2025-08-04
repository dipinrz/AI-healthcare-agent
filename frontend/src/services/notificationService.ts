import toast from 'react-hot-toast';

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  nextDose: Date;
}

export interface FollowUpReminder {
  id: string;
  doctorName: string;
  lastVisit: Date;
  recommendedFollowUp: Date;
  reason: string;
}

class NotificationService {
  private medicationTimers: Map<string, NodeJS.Timeout> = new Map();
  private followUpTimers: Map<string, NodeJS.Timeout> = new Map();

  // Medication reminder methods
  showMedicationReminder(medication: MedicationReminder) {
    const message = `💊 Time for your medication!\n${medication.medicationName} - ${medication.dosage}\nScheduled for ${medication.time}`;
    
    toast.success(message, {
      duration: 30000, // 30 seconds
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
      },
      icon: '💊',
    });

    // Create a separate action toast for the "Mark as Taken" button
    setTimeout(() => {
      toast((t) => (
        `Mark ${medication.medicationName} as taken?`
      ), {
        duration: 25000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          cursor: 'pointer',
        },
        icon: '✓',
        onClick: () => {
          toast.dismiss();
          this.markMedicationTaken(medication.id);
        },
      });
    }, 2000);

    // Play notification sound if supported
    this.playNotificationSound();
  }

  showFollowUpReminder(followUp: FollowUpReminder) {
    const message = `🏥 Follow-up appointment reminder\nTime to schedule with ${followUp.doctorName}\nLast visit: ${followUp.lastVisit.toLocaleDateString()}\nReason: ${followUp.reason}`;
    
    toast(message, {
      duration: 45000, // 45 seconds
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#FFFFFF',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
      },
      icon: '🏥',
    });

    // Create a separate action toast for booking
    setTimeout(() => {
      toast((t) => (
        `Book follow-up with ${followUp.doctorName}?`
      ), {
        duration: 40000,
        position: 'top-right',
        style: {
          background: '#059669',
          color: '#FFFFFF',
          cursor: 'pointer',
        },
        icon: '📅',
        onClick: () => {
          toast.dismiss();
          this.bookFollowUpAppointment(followUp);
        },
      });
    }, 3000);
  }

  // Schedule medication reminders
  scheduleMedicationReminder(medication: MedicationReminder) {
    const now = new Date();
    const reminderTime = new Date(medication.nextDose);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      const timer = setTimeout(() => {
        this.showMedicationReminder(medication);
        // Schedule next reminder (daily for now)
        const nextReminder = new Date(reminderTime);
        nextReminder.setDate(nextReminder.getDate() + 1);
        this.scheduleMedicationReminder({
          ...medication,
          nextDose: nextReminder
        });
      }, timeUntilReminder);

      this.medicationTimers.set(medication.id, timer);
    }
  }

  // Schedule follow-up reminders
  scheduleFollowUpReminder(followUp: FollowUpReminder) {
    const now = new Date();
    const reminderTime = new Date(followUp.recommendedFollowUp);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      const timer = setTimeout(() => {
        this.showFollowUpReminder(followUp);
      }, timeUntilReminder);

      this.followUpTimers.set(followUp.id, timer);
    }
  }

  // Clear scheduled reminders
  clearMedicationReminder(medicationId: string) {
    const timer = this.medicationTimers.get(medicationId);
    if (timer) {
      clearTimeout(timer);
      this.medicationTimers.delete(medicationId);
    }
  }

  clearFollowUpReminder(followUpId: string) {
    const timer = this.followUpTimers.get(followUpId);
    if (timer) {
      clearTimeout(timer);
      this.followUpTimers.delete(followUpId);
    }
  }

  // Handle user actions
  private markMedicationTaken(medicationId: string) {
    // Here you could call an API to log medication taken
    toast.success('✅ Medication marked as taken!', {
      position: 'top-right',
      duration: 3000,
    });
    
    // Store in localStorage for now
    const takenMeds = JSON.parse(localStorage.getItem('takenMedications') || '[]');
    takenMeds.push({
      medicationId,
      takenAt: new Date().toISOString()
    });
    localStorage.setItem('takenMedications', JSON.stringify(takenMeds));
  }

  private bookFollowUpAppointment(followUp: FollowUpReminder) {
    // Navigate to appointments booking page or show booking modal
    toast.success('📅 Redirecting to appointment booking...', {
      position: 'top-right',
      duration: 3000,
    });
    
    // Store follow-up request
    localStorage.setItem('pendingFollowUp', JSON.stringify(followUp));
    
    // In a real app, you would navigate to the appointments page
    // window.location.href = '/appointments/book';
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzub3/LDciYEK4HO8tiJNwgZaLvt559NEAxPqOPwtmMcBjmQ1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBzub3/LDciUFLIHO8tiJNwgZaLvt559NEAxPqOPwtmQcBj');
      audio.play().catch(() => {
        // Ignore audio play errors (browser restrictions)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Success messages
  showSuccess(message: string) {
    toast.success(message, {
      position: 'top-right',
      duration: 4000,
    });
  }

  // Error messages
  showError(message: string) {
    toast.error(message, {
      position: 'top-right',
      duration: 5000,
    });
  }

  // Info messages
  showInfo(message: string) {
    toast(message, {
      icon: 'ℹ️',
      position: 'top-right',
      duration: 4000,
    });
  }

  // Demo methods for testing
  showDemoMedicationReminder() {
    const demoMedication: MedicationReminder = {
      id: 'demo-1',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      time: '8:00 AM',
      nextDose: new Date()
    };
    this.showMedicationReminder(demoMedication);
  }

  showDemoFollowUpReminder() {
    const demoFollowUp: FollowUpReminder = {
      id: 'demo-2',
      doctorName: 'Dr. Sarah Johnson',
      lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      recommendedFollowUp: new Date(),
      reason: 'Blood pressure check and medication review'
    };
    this.showFollowUpReminder(demoFollowUp);
  }
}

export const notificationService = new NotificationService();
export default notificationService;

// Export interfaces for use in other components
export type { MedicationReminder, FollowUpReminder };