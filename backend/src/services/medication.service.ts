import { MedicationRepository } from '../repositories/medication.repository';
import { Medication } from '../models/Medication.model';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';

export interface MedicationFilters {
  search?: string;
  category?: string;
}

export class MedicationService {
  private medicationRepository = new MedicationRepository();

  async getAllMedications(
    filters: MedicationFilters,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      logger.info('Getting all medications with filters:', filters);

      let medications: Medication[];

      if (filters.search) {
        medications = await this.medicationRepository.searchMedications(filters.search);
      } else if (filters.category) {
        medications = await this.medicationRepository.findByCategory(filters.category);
      } else {
        medications = await this.medicationRepository.findAll({
          order: { name: 'ASC' },
        });
      }

      const total = medications.length;
      const paginatedMedications = medications.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedMedications,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all medications error:', error);
      throw error;
    }
  }

  async getMedicationById(id: string): Promise<Medication> {
    try {
      const medication = await this.medicationRepository.findById(id);
      
      if (!medication) {
        throw new Error(MESSAGES.ERROR.MEDICATION_NOT_FOUND);
      }

      return medication;
    } catch (error) {
      logger.error('Get medication by ID error:', error);
      throw error;
    }
  }

  async createMedication(medicationData: Partial<Medication>): Promise<Medication> {
    try {
      // Check if medication with same name already exists
      if (medicationData.name) {
        const existingMedication = await this.medicationRepository.findByName(medicationData.name);
        if (existingMedication) {
          throw new Error('Medication with this name already exists');
        }
      }

      const medication = await this.medicationRepository.create({
        ...medicationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Medication created successfully:', medication.id);
      return medication;
    } catch (error) {
      logger.error('Create medication error:', error);
      throw error;
    }
  }

  async updateMedication(id: string, updateData: Partial<Medication>): Promise<Medication> {
    try {
      const existingMedication = await this.medicationRepository.findById(id);
      if (!existingMedication) {
        throw new Error(MESSAGES.ERROR.MEDICATION_NOT_FOUND);
      }

      // Check name uniqueness if name is being updated
      if (updateData.name && updateData.name !== existingMedication.name) {
        const medicationWithName = await this.medicationRepository.findByName(updateData.name);
        if (medicationWithName && medicationWithName.id !== id) {
          throw new Error('Medication with this name already exists');
        }
      }

      const updatedMedication = await this.medicationRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      if (!updatedMedication) {
        throw new Error(MESSAGES.ERROR.MEDICATION_NOT_FOUND);
      }

      logger.info('Medication updated successfully:', id);
      return updatedMedication;
    } catch (error) {
      logger.error('Update medication error:', error);
      throw error;
    }
  }

  async deleteMedication(id: string): Promise<void> {
    try {
      const medication = await this.medicationRepository.findById(id);
      if (!medication) {
        throw new Error(MESSAGES.ERROR.MEDICATION_NOT_FOUND);
      }

      // Check if medication is being used in prescriptions
      const isInUse = await this.medicationRepository.isInUse(id);
      if (isInUse) {
        throw new Error('Cannot delete medication that is currently prescribed');
      }

      await this.medicationRepository.delete(id);
      
      logger.info('Medication deleted successfully:', id);
    } catch (error) {
      logger.error('Delete medication error:', error);
      throw error;
    }
  }

  async searchMedications(searchTerm: string): Promise<Medication[]> {
    try {
      return await this.medicationRepository.searchMedications(searchTerm);
    } catch (error) {
      logger.error('Search medications error:', error);
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await this.medicationRepository.getCategories();
    } catch (error) {
      logger.error('Get medication categories error:', error);
      throw error;
    }
  }

  async getMedicationsByCategory(category: string): Promise<Medication[]> {
    try {
      return await this.medicationRepository.findByCategory(category);
    } catch (error) {
      logger.error('Get medications by category error:', error);
      throw error;
    }
  }

  async getMedicationsByDosageForm(dosageForm: string): Promise<Medication[]> {
    try {
      return await this.medicationRepository.findByDosageForm(dosageForm);
    } catch (error) {
      logger.error('Get medications by dosage form error:', error);
      throw error;
    }
  }

  async getMedicationStats() {
    try {
      return await this.medicationRepository.getMedicationStats();
    } catch (error) {
      logger.error('Get medication stats error:', error);
      throw error;
    }
  }

  async getPopularMedications(limit: number = 10): Promise<Medication[]> {
    try {
      return await this.medicationRepository.findMostPrescribed(limit);
    } catch (error) {
      logger.error('Get popular medications error:', error);
      throw error;
    }
  }
}