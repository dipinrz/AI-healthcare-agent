"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
// Simple routes
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'AI Healthcare Backend'
    });
});
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});
app.post('/api/chat/message', (req, res) => {
    const { message } = req.body;
    res.json({
        response: `You said: ${message}. I'm your AI Health Assistant!`,
        agent: 'orchestrator'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🏥 AI Healthcare Backend is ready!`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
