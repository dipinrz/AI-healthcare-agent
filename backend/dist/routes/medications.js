"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Medication_1 = require("../entities/Medication");
const Prescription_1 = require("../entities/Prescription");
const Patient_1 = require("../entities/Patient");
const Doctor_1 = require("../entities/Doctor");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const medicationRepository = database_1.AppDataSource.getRepository(Medication_1.Medication);
const prescriptionRepository = database_1.AppDataSource.getRepository(Prescription_1.Prescription);
const patientRepository = database_1.AppDataSource.getRepository(Patient_1.Patient);
const doctorRepository = database_1.AppDataSource.getRepository(Doctor_1.Doctor);
// Public endpoint for searching medications
router.get('/', async (req, res) => {
    try {
        const { search, category, form, isActive = true } = req.query;
        let queryBuilder = medicationRepository.createQueryBuilder('medication');
        if (search) {
            queryBuilder = queryBuilder.where('(medication.name ILIKE :search OR medication.genericName ILIKE :search OR medication.brandName ILIKE :search)', { search: `%${search}%` });
        }
        if (category) {
            queryBuilder = queryBuilder.andWhere('medication.category ILIKE :category', {
                category: `%${category}%`
            });
        }
        if (form) {
            queryBuilder = queryBuilder.andWhere('medication.form ILIKE :form', {
                form: `%${form}%`
            });
        }
        queryBuilder = queryBuilder.andWhere('medication.isActive = :isActive', {
            isActive: isActive === 'true' || isActive === true
        });
        const medications = await queryBuilder
            .orderBy('medication.name', 'ASC')
            .getMany();
        res.json({
            success: true,
            data: medications
        });
    }
    catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medications'
        });
    }
});
// Get medication by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const medication = await medicationRepository.findOne({
            where: { id }
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }
        res.json({
            success: true,
            data: medication
        });
    }
    catch (error) {
        console.error('Get medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medication'
        });
    }
});
// Protected routes
router.use(auth_1.authenticateToken);
// Create new medication (admin only)
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can create medications'
            });
        }
        const { name, genericName, brandName, category, description, indications, contraindications, sideEffects, interactions, warnings, dosageInfo, strength, form, manufacturer } = req.body;
        if (!name || !genericName || !category || !description || !form || !manufacturer) {
            return res.status(400).json({
                success: false,
                message: 'Name, generic name, category, description, form, and manufacturer are required'
            });
        }
        const medication = medicationRepository.create({
            name,
            genericName,
            brandName: brandName || genericName,
            category,
            description,
            indications: indications || [],
            contraindications: contraindications || [],
            sideEffects: sideEffects || [],
            interactions: interactions || [],
            warnings: warnings || [],
            dosageInfo: dosageInfo || { adult: 'Consult healthcare provider' },
            strength: strength || '',
            form,
            manufacturer,
            isActive: true
        });
        await medicationRepository.save(medication);
        res.status(201).json({
            success: true,
            message: 'Medication created successfully',
            data: medication
        });
    }
    catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create medication'
        });
    }
});
// Update medication (admin only)
router.put('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update medications'
            });
        }
        const medication = await medicationRepository.findOne({
            where: { id }
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }
        const { name, genericName, brandName, category, description, indications, contraindications, sideEffects, interactions, warnings, dosageInfo, strength, form, manufacturer, isActive } = req.body;
        if (name)
            medication.name = name;
        if (genericName)
            medication.genericName = genericName;
        if (brandName !== undefined)
            medication.brandName = brandName;
        if (category)
            medication.category = category;
        if (description)
            medication.description = description;
        if (indications !== undefined)
            medication.indications = indications;
        if (contraindications !== undefined)
            medication.contraindications = contraindications;
        if (sideEffects !== undefined)
            medication.sideEffects = sideEffects;
        if (interactions !== undefined)
            medication.interactions = interactions;
        if (warnings !== undefined)
            medication.warnings = warnings;
        if (dosageInfo !== undefined)
            medication.dosageInfo = dosageInfo;
        if (strength !== undefined)
            medication.strength = strength;
        if (form)
            medication.form = form;
        if (manufacturer)
            medication.manufacturer = manufacturer;
        if (isActive !== undefined)
            medication.isActive = isActive;
        await medicationRepository.save(medication);
        res.json({
            success: true,
            message: 'Medication updated successfully',
            data: medication
        });
    }
    catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update medication'
        });
    }
});
// Delete medication (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete medications'
            });
        }
        const medication = await medicationRepository.findOne({
            where: { id }
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }
        // Soft delete by setting isActive to false
        medication.isActive = false;
        await medicationRepository.save(medication);
        res.json({
            success: true,
            message: 'Medication deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete medication'
        });
    }
});
// Get all prescriptions
router.get('/prescriptions/all', async (req, res) => {
    try {
        const user = req.user;
        let prescriptions;
        if (user.role === 'patient') {
            if (!user.patientId) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient ID not found in token'
                });
            }
            prescriptions = await prescriptionRepository.find({
                where: { patient: { id: user.patientId } },
                relations: ['patient', 'doctor', 'medication'],
                order: { createdAt: 'DESC' }
            });
        }
        else if (user.role === 'doctor') {
            if (!user.doctorId) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor ID not found in token'
                });
            }
            prescriptions = await prescriptionRepository.find({
                where: { doctor: { id: user.doctorId } },
                relations: ['patient', 'doctor', 'medication'],
                order: { createdAt: 'DESC' }
            });
        }
        else {
            prescriptions = await prescriptionRepository.find({
                relations: ['patient', 'doctor', 'medication'],
                order: { createdAt: 'DESC' }
            });
        }
        const formattedPrescriptions = prescriptions.map(prescription => ({
            id: prescription.id,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            instructions: prescription.instructions,
            quantity: prescription.quantity,
            refills: prescription.refills,
            status: prescription.status,
            startDate: prescription.startDate,
            endDate: prescription.endDate,
            notes: prescription.notes,
            createdAt: prescription.createdAt,
            patient: {
                id: prescription.patient.id,
                firstName: prescription.patient.firstName,
                lastName: prescription.patient.lastName,
                email: prescription.patient.email
            },
            doctor: {
                id: prescription.doctor.id,
                firstName: prescription.doctor.firstName,
                lastName: prescription.doctor.lastName,
                specialization: prescription.doctor.specialization
            },
            medication: {
                id: prescription.medication.id,
                name: prescription.medication.name,
                genericName: prescription.medication.genericName,
                brandName: prescription.medication.brandName,
                form: prescription.medication.form,
                strength: prescription.medication.strength
            }
        }));
        res.json({
            success: true,
            data: formattedPrescriptions
        });
    }
    catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions'
        });
    }
});
// Create prescription (doctors only)
router.post('/prescriptions', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can create prescriptions'
            });
        }
        const { patientId, medicationId, dosage, frequency, duration, instructions, quantity, refills, startDate, endDate, notes } = req.body;
        if (!patientId || !medicationId || !dosage || !frequency || !duration || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID, medication ID, dosage, frequency, duration, and quantity are required'
            });
        }
        if (!user.doctorId) {
            return res.status(404).json({
                success: false,
                message: 'Doctor ID not found in token'
            });
        }
        const doctor = await doctorRepository.findOne({
            where: { id: user.doctorId }
        });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found'
            });
        }
        const patient = await patientRepository.findOne({
            where: { id: patientId }
        });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        const medication = await medicationRepository.findOne({
            where: { id: medicationId }
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }
        const prescription = prescriptionRepository.create({
            patient,
            doctor,
            medication,
            dosage,
            frequency,
            duration,
            instructions: instructions || '',
            quantity,
            refills: refills || 0,
            status: Prescription_1.PrescriptionStatus.ACTIVE,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            notes: notes || ''
        });
        await prescriptionRepository.save(prescription);
        const savedPrescription = await prescriptionRepository.findOne({
            where: { id: prescription.id },
            relations: ['patient', 'doctor', 'medication']
        });
        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            data: savedPrescription
        });
    }
    catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create prescription'
        });
    }
});
// Update prescription status
router.put('/prescriptions/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status, notes } = req.body;
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors and admins can update prescriptions'
            });
        }
        const prescription = await prescriptionRepository.findOne({
            where: { id },
            relations: ['doctor']
        });
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }
        // Check if doctor owns this prescription
        if (user.role === 'doctor') {
            if (!user.doctorId || prescription.doctor.id !== user.doctorId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }
        if (status)
            prescription.status = status;
        if (notes !== undefined)
            prescription.notes = notes;
        await prescriptionRepository.save(prescription);
        res.json({
            success: true,
            message: 'Prescription updated successfully',
            data: prescription
        });
    }
    catch (error) {
        console.error('Update prescription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update prescription'
        });
    }
});
exports.default = router;
