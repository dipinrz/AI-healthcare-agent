"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
const medicationSeeder_1 = require("./seeders/medicationSeeder");
const prescriptionSeeder_1 = require("./seeders/prescriptionSeeder");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*',
    credentials: false
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'AI Healthcare Backend'
    });
});
// API Routes
const auth_1 = __importDefault(require("./routes/auth"));
const patients_1 = __importDefault(require("./routes/patients"));
const doctors_1 = __importDefault(require("./routes/doctors"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const medications_1 = __importDefault(require("./routes/medications"));
const chat_1 = __importDefault(require("./routes/chat"));
const healthRecords_1 = __importDefault(require("./routes/healthRecords"));
app.use('/api/auth', auth_1.default);
app.use('/api/patients', patients_1.default);
app.use('/api/doctors', doctors_1.default);
app.use('/api/appointments', appointments_1.default);
app.use('/api/medications', medications_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/health-records', healthRecords_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Initialize database first, then start server
database_1.AppDataSource.initialize()
    .then(async () => {
    console.log('✅ Database connected successfully');
    // Seed sample data
    await (0, medicationSeeder_1.seedMedications)();
    await (0, prescriptionSeeder_1.seedPrescriptions)();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🏥 AI Healthcare Backend is ready!`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    });
})
    .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.log('Please ensure PostgreSQL is running and database "ai-agent" exists');
    process.exit(1);
});
