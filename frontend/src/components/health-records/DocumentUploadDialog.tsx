import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { healthRecordsService } from '../../services/healthRecordsService';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onUploadSuccess: () => void;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  open,
  onClose,
  patientId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<string>('other');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'physical_exam', label: 'Physical Exam' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'consultation_note', label: 'Consultation Note' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv', 'application/dicom', 'image/tiff'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please upload images, PDFs, or document files.');
        return;
      }

      setSelectedFile(file);
      setDocumentName(documentName || file.name.split('.').slice(0, -1).join('.'));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await healthRecordsService.uploadDocument(patientId, selectedFile, {
        name: documentName.trim(),
        type: documentType as any,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        documentDate: new Date(documentDate),
      });

      if (result.success) {
        onUploadSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('other');
    setDescription('');
    setNotes('');
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Upload Medical Document</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* File Upload Area */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              borderStyle: 'dashed',
              borderColor: selectedFile ? 'primary.main' : 'grey.400',
              bgcolor: selectedFile ? 'primary.50' : 'grey.50',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              },
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              hidden
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.dcm,.tiff"
            />
            
            {selectedFile ? (
              <Box>
                <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {healthRecordsService.formatFileSize(selectedFile.size)}
                </Typography>
                <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                  Click to select a different file
                </Typography>
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Click to select a file
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PDF, Images, Documents (Max 10MB)
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Document Details */}
          <TextField
            label="Document Name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            fullWidth
            required
            placeholder="Enter a descriptive name for this document"
          />

          <FormControl fullWidth>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              label="Document Type"
            >
              {documentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Document Date"
            type="date"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Brief description of the document contents"
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Additional notes or comments"
          />

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {uploading && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uploading document...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || !documentName.trim() || uploading}
          startIcon={<UploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadDialog;