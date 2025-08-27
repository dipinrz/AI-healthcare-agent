"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthRecords_controller_1 = require("../controllers/healthRecords.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const router = (0, express_1.Router)();
const healthRecordsController = new healthRecords_controller_1.HealthRecordsController();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
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
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Please upload images, PDFs, or document files.`), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    }
});
// Health Records Overview
router.get('/:patientId', auth_middleware_1.authenticateToken, healthRecordsController.getHealthRecord);
router.get('/:patientId/search', auth_middleware_1.authenticateToken, healthRecordsController.searchHealthRecords);
router.get('/:patientId/stats', auth_middleware_1.authenticateToken, healthRecordsController.getHealthRecordStats);
// Medical Documents
router.post('/:patientId/documents', auth_middleware_1.authenticateToken, upload.single('file'), healthRecordsController.uploadDocument);
router.get('/:patientId/documents', auth_middleware_1.authenticateToken, healthRecordsController.getMedicalDocuments);
router.get('/:patientId/documents/:documentId/download', auth_middleware_1.authenticateToken, healthRecordsController.downloadDocument);
router.delete('/:patientId/documents/:documentId', auth_middleware_1.authenticateToken, healthRecordsController.deleteDocument);
// Vital Signs
router.post('/:patientId/vitals', auth_middleware_1.authenticateToken, healthRecordsController.addVitalSigns);
router.get('/:patientId/vitals', auth_middleware_1.authenticateToken, healthRecordsController.getVitalSigns);
router.put('/:patientId/vitals/:vitalId', auth_middleware_1.authenticateToken, healthRecordsController.updateVitalSigns);
router.delete('/:patientId/vitals/:vitalId', auth_middleware_1.authenticateToken, healthRecordsController.deleteVitalSigns);
// Lab Results
router.post('/:patientId/lab-results', auth_middleware_1.authenticateToken, healthRecordsController.addLabResult);
router.get('/:patientId/lab-results', auth_middleware_1.authenticateToken, healthRecordsController.getLabResults);
exports.default = router;
