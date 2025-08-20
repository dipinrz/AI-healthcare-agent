// .claude/integrations/config.js
module.exports = {
  // API Configuration
  api: {
    baseUrl: process.env.HMS_API_URL || 'http://localhost:3001/api',
    timeout: parseInt(process.env.HMS_API_TIMEOUT) || 10000,
    retryAttempts: parseInt(process.env.HMS_API_RETRY) || 3,
    retryDelay: parseInt(process.env.HMS_API_RETRY_DELAY) || 1000,
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'ai-agent',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'root',
  },

  // Authentication Configuration
  auth: {
    tokenExpiry: process.env.JWT_EXPIRY || '24h',
    refreshThreshold: parseInt(process.env.JWT_REFRESH_THRESHOLD) || 300, // 5 minutes
  },

  // Agent Configuration
  agents: {
    enableLogging: process.env.AGENT_LOGGING === 'true',
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT) || 5,
    defaultTimeout: parseInt(process.env.AGENT_TIMEOUT) || 30000,
  },

  // Feature Flags
  features: {
    enableBatchOperations: process.env.ENABLE_BATCH === 'true',
    enableRealTimeUpdates: process.env.ENABLE_REALTIME === 'true',
    enableCaching: process.env.ENABLE_CACHE === 'true',
    enableFileUpload: process.env.ENABLE_UPLOAD === 'true',
  },

  // Endpoints mapping for different environments
  endpoints: {
    development: {
      api: 'http://localhost:3001/api',
      websocket: 'ws://localhost:3001',
    },
    staging: {
      api: 'https://staging-api.your-domain.com/api',
      websocket: 'wss://staging-api.your-domain.com',
    },
    production: {
      api: 'https://api.your-domain.com/api',
      websocket: 'wss://api.your-domain.com',
    }
  },

  // Error handling configuration
  errorHandling: {
    enableDetailedErrors: process.env.NODE_ENV === 'development',
    logErrors: true,
    retryableStatusCodes: [429, 502, 503, 504],
  },

  // Medical compliance settings
  compliance: {
    enableAuditLogging: true,
    requireMedicalDisclaimer: true,
    maxSessionDuration: parseInt(process.env.MAX_SESSION_DURATION) || 3600000, // 1 hour
    encryptSensitiveData: true,
  }
};