import { Router } from 'express';
import { HealthRecordsController } from '../controllers/healthRecords.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();
const healthRecordsController = new HealthRecordsController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { patientId } = req.params;
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow common document and image formats
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    // Medical imaging (basic)
    'application/dicom',
    'image/tiff'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Please upload images, PDFs, or document files.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Health Records Overview
router.get('/:patientId', authenticateToken, healthRecordsController.getHealthRecord);
router.get('/:patientId/search', authenticateToken, healthRecordsController.searchHealthRecords);
router.get('/:patientId/stats', authenticateToken, healthRecordsController.getHealthRecordStats);

// Medical Documents
router.post(
  '/:patientId/documents',
  authenticateToken,
  upload.single('file'),
  healthRecordsController.uploadDocument
);
router.get('/:patientId/documents', authenticateToken, healthRecordsController.getMedicalDocuments);
router.get('/:patientId/documents/:documentId/download', authenticateToken, healthRecordsController.downloadDocument);
router.delete('/:patientId/documents/:documentId', authenticateToken, healthRecordsController.deleteDocument);

// Vital Signs
router.post('/:patientId/vitals', authenticateToken, healthRecordsController.addVitalSigns);
router.get('/:patientId/vitals', authenticateToken, healthRecordsController.getVitalSigns);
router.put('/:patientId/vitals/:vitalId', authenticateToken, healthRecordsController.updateVitalSigns);
router.delete('/:patientId/vitals/:vitalId', authenticateToken, healthRecordsController.deleteVitalSigns);

// Lab Results
router.post('/:patientId/lab-results', authenticateToken, healthRecordsController.addLabResult);
router.get('/:patientId/lab-results', authenticateToken, healthRecordsController.getLabResults);

export default router;