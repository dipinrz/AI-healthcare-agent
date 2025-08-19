"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_config_1 = require("./config/db.config");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const logger_config_1 = require("./config/logger.config");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => {
            logger_config_1.logger.info(message.trim());
        }
    }
}));
// Routes
app.use('/api', routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Error handling middleware (must be last)
app.use(error_middleware_1.errorHandler);
// Initialize database connection
const initializeApp = async () => {
    try {
        await db_config_1.AppDataSource.initialize();
        logger_config_1.logger.info('✅ Database connected successfully');
    }
    catch (error) {
        logger_config_1.logger.error('❌ Database connection failed:', error);
        throw error;
    }
};
exports.initializeApp = initializeApp;
exports.default = app;
