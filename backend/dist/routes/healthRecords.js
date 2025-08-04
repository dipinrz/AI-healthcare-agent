"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Patient_1 = require("../entities/Patient");
const VitalSigns_1 = require("../entities/VitalSigns");
const LabResult_1 = require("../entities/LabResult");
const MedicalDocument_1 = require("../entities/MedicalDocument");
const Doctor_1 = require("../entities/Doctor");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const patientRepository = database_1.AppDataSource.getRepository(Patient_1.Patient);
const vitalSignsRepository = database_1.AppDataSource.getRepository(VitalSigns_1.VitalSigns);
const labResultRepository = database_1.AppDataSource.getRepository(LabResult_1.LabResult);
const medicalDocumentRepository = database_1.AppDataSource.getRepository(MedicalDocument_1.MedicalDocument);
const doctorRepository = database_1.AppDataSource.getRepository(Doctor_1.Doctor);
// All routes are protected
router.use(auth_1.authenticateToken);
// Get patient's complete health record
router.get('/:patientId', async (req, res) => {
    try {
        const user = req.user;
        const { patientId } = req.params;
        // Check permissions
        const patient = await patientRepository.findOne({
            where: { id: patientId }
        });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        // Authorization check
        if (user.role === 'patient') {
            const currentPatient = await patientRepository.findOne({
                where: { email: user.email }
            });
            if (!currentPatient || currentPatient.id !== patientId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }
        else if (user.role !== 'admin' && user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // Get all health record components
        const [vitalSigns, labResults, documents] = await Promise.all([
            vitalSignsRepository.find({
                where: { patient: { id: patientId } },
                relations: ['recordedBy'],
                order: { recordedDate: 'DESC' }
            }),
            labResultRepository.find({
                where: { patient: { id: patientId } },
                relations: ['orderedBy'],
                order: { testDate: 'DESC' }
            }),
            medicalDocumentRepository.find({
                where: { patient: { id: patientId }, isActive: true },
                relations: ['createdBy'],
                order: { documentDate: 'DESC' }
            })
        ]);
        const healthRecord = {
            patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                phone: patient.phone,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                address: patient.address,
                allergies: patient.allergies,
                emergencyContact: patient.emergencyContact
            },
            vitalSigns: vitalSigns.map(vs => ({
                id: vs.id,
                recordedDate: vs.recordedDate,
                systolicBP: vs.systolicBP,
                diastolicBP: vs.diastolicBP,
                heartRate: vs.heartRate,
                temperature: vs.temperature,
                weight: vs.weight,
                height: vs.height,
                oxygenSaturation: vs.oxygenSaturation,
                notes: vs.notes,
                recordedBy: vs.recordedBy ? {
                    id: vs.recordedBy.id,
                    firstName: vs.recordedBy.firstName,
                    lastName: vs.recordedBy.lastName,
                    specialization: vs.recordedBy.specialization
                } : null,
                createdAt: vs.createdAt
            })),
            labResults: labResults.map(lr => ({
                id: lr.id,
                testName: lr.testName,
                value: lr.value,
                unit: lr.unit,
                referenceRange: lr.referenceRange,
                status: lr.status,
                testDate: lr.testDate,
                resultDate: lr.resultDate,
                notes: lr.notes,
                labFacility: lr.labFacility,
                interpretation: lr.interpretation,
                orderedBy: lr.orderedBy ? {
                    id: lr.orderedBy.id,
                    firstName: lr.orderedBy.firstName,
                    lastName: lr.orderedBy.lastName,
                    specialization: lr.orderedBy.specialization
                } : null,
                createdAt: lr.createdAt
            })),
            documents: documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                description: doc.description,
                documentDate: doc.documentDate,
                fileName: doc.fileName,
                fileType: doc.fileType,
                fileSize: doc.fileSize,
                notes: doc.notes,
                createdBy: doc.createdBy ? {
                    id: doc.createdBy.id,
                    firstName: doc.createdBy.firstName,
                    lastName: doc.createdBy.lastName,
                    specialization: doc.createdBy.specialization
                } : null,
                createdAt: doc.createdAt
            }))
        };
        res.json({
            success: true,
            data: healthRecord
        });
    }
    catch (error) {
        console.error('Get health record error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch health record'
        });
    }
});
// Add vital signs
router.post('/:patientId/vitals', async (req, res) => {
    try {
        const user = req.user;
        const { patientId } = req.params;
        const { recordedDate, systolicBP, diastolicBP, heartRate, temperature, weight, height, oxygenSaturation, notes } = req.body;
        // Only doctors and admins can add vital signs
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can record vital signs'
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
        let recordedBy = null;
        if (user.role === 'doctor') {
            recordedBy = await doctorRepository.findOne({
                where: { email: user.email }
            });
        }
        const vitalSigns = vitalSignsRepository.create({
            patient,
            recordedBy,
            recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
            systolicBP,
            diastolicBP,
            heartRate,
            temperature,
            weight,
            height,
            oxygenSaturation,
            notes
        });
        await vitalSignsRepository.save(vitalSigns);
        res.status(201).json({
            success: true,
            message: 'Vital signs recorded successfully',
            data: vitalSigns
        });
    }
    catch (error) {
        console.error('Add vital signs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vital signs'
        });
    }
});
// Add lab result
router.post('/:patientId/lab-results', async (req, res) => {
    try {
        const user = req.user;
        const { patientId } = req.params;
        const { testName, value, unit, referenceRange, status, testDate, resultDate, notes, labFacility, interpretation } = req.body;
        // Only doctors and admins can add lab results
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can add lab results'
            });
        }
        if (!testName || !value) {
            return res.status(400).json({
                success: false,
                message: 'Test name and value are required'
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
        let orderedBy = null;
        if (user.role === 'doctor') {
            orderedBy = await doctorRepository.findOne({
                where: { email: user.email }
            });
        }
        const labResult = labResultRepository.create({
            patient,
            orderedBy,
            testName,
            value,
            unit,
            referenceRange,
            status: status || LabResult_1.LabResultStatus.PENDING,
            testDate: testDate ? new Date(testDate) : new Date(),
            resultDate: resultDate ? new Date(resultDate) : null,
            notes,
            labFacility,
            interpretation
        });
        await labResultRepository.save(labResult);
        res.status(201).json({
            success: true,
            message: 'Lab result added successfully',
            data: labResult
        });
    }
    catch (error) {
        console.error('Add lab result error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add lab result'
        });
    }
});
// Add medical document
router.post('/:patientId/documents', async (req, res) => {
    try {
        const user = req.user;
        const { patientId } = req.params;
        const { name, type, description, documentDate, fileName, fileType, fileSize, notes } = req.body;
        // Only doctors and admins can add documents
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can add medical documents'
            });
        }
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Document name is required'
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
        let createdBy = null;
        if (user.role === 'doctor') {
            createdBy = await doctorRepository.findOne({
                where: { email: user.email }
            });
        }
        const document = medicalDocumentRepository.create({
            patient,
            createdBy,
            name,
            type: type || MedicalDocument_1.DocumentType.OTHER,
            description,
            documentDate: documentDate ? new Date(documentDate) : new Date(),
            fileName,
            fileType,
            fileSize,
            notes,
            isActive: true
        });
        await medicalDocumentRepository.save(document);
        res.status(201).json({
            success: true,
            message: 'Medical document added successfully',
            data: document
        });
    }
    catch (error) {
        console.error('Add medical document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add medical document'
        });
    }
});
// Update vital signs
router.put('/:patientId/vitals/:vitalId', async (req, res) => {
    try {
        const user = req.user;
        const { patientId, vitalId } = req.params;
        // Only doctors and admins can update vital signs
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can update vital signs'
            });
        }
        const vitalSigns = await vitalSignsRepository.findOne({
            where: { id: vitalId, patient: { id: patientId } },
            relations: ['patient']
        });
        if (!vitalSigns) {
            return res.status(404).json({
                success: false,
                message: 'Vital signs record not found'
            });
        }
        const { systolicBP, diastolicBP, heartRate, temperature, weight, height, oxygenSaturation, notes } = req.body;
        if (systolicBP !== undefined)
            vitalSigns.systolicBP = systolicBP;
        if (diastolicBP !== undefined)
            vitalSigns.diastolicBP = diastolicBP;
        if (heartRate !== undefined)
            vitalSigns.heartRate = heartRate;
        if (temperature !== undefined)
            vitalSigns.temperature = temperature;
        if (weight !== undefined)
            vitalSigns.weight = weight;
        if (height !== undefined)
            vitalSigns.height = height;
        if (oxygenSaturation !== undefined)
            vitalSigns.oxygenSaturation = oxygenSaturation;
        if (notes !== undefined)
            vitalSigns.notes = notes;
        await vitalSignsRepository.save(vitalSigns);
        res.json({
            success: true,
            message: 'Vital signs updated successfully',
            data: vitalSigns
        });
    }
    catch (error) {
        console.error('Update vital signs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vital signs'
        });
    }
});
// Delete vital signs
router.delete('/:patientId/vitals/:vitalId', async (req, res) => {
    try {
        const user = req.user;
        const { patientId, vitalId } = req.params;
        // Only doctors and admins can delete vital signs
        if (user.role !== 'doctor' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can delete vital signs'
            });
        }
        const vitalSigns = await vitalSignsRepository.findOne({
            where: { id: vitalId, patient: { id: patientId } }
        });
        if (!vitalSigns) {
            return res.status(404).json({
                success: false,
                message: 'Vital signs record not found'
            });
        }
        await vitalSignsRepository.remove(vitalSigns);
        res.json({
            success: true,
            message: 'Vital signs deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete vital signs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vital signs'
        });
    }
});
exports.default = router;
