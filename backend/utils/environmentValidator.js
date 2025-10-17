const { logger } = require('../middleware/logger');

/**
 * Environment validation configuration
 */
const REQUIRED_ENV_VARS = {
  // Database
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection string',
    default: 'mongodb://localhost:27017/edukanban'
  },
  
  // Security
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret',
    validate: (value) => {
      if (value === 'your-super-secret-jwt-key-change-this-in-production-12345') {
        return 'JWT_SECRET is using default value. Please change it for security.';
      }
      if (value.length < 32) {
        return 'JWT_SECRET should be at least 32 characters long.';
      }
      return null;
    }
  },
  
  SESSION_SECRET: {
    required: true,
    description: 'Session signing secret',
    default: 'your-session-secret-key-change-this-in-production',
    validate: (value) => {
      if (value === 'your-session-secret-key-change-this-in-production') {
        return 'SESSION_SECRET is using default value. Please change it for security.';
      }
      return null;
    }
  },
  
  // Server
  PORT: {
    required: false,
    description: 'Server port',
    default: '5001',
    validate: (value) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'PORT must be a valid port number (1-65535).';
      }
      return null;
    }
  },
  
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    default: 'development',
    validate: (value) => {
      if (!['development', 'production', 'test'].includes(value)) {
        return 'NODE_ENV must be one of: development, production, test.';
      }
      return null;
    }
  },
  
  // Frontend
  FRONTEND_URL: {
    required: false,
    description: 'Frontend URL for CORS',
    default: 'http://localhost:3000'
  }
};

const OPTIONAL_ENV_VARS = {
  // OpenAI
  OPENAI_API_KEY: {
    description: 'OpenAI API key for AI features',
    validate: (value) => {
      if (value === 'your-openai-api-key-here') {
        return 'OPENAI_API_KEY is using placeholder value. AI features will be disabled.';
      }
      if (value && !value.startsWith('sk-')) {
        return 'OPENAI_API_KEY should start with "sk-".';
      }
      return null;
    }
  },
  
  // Logging
  LOG_LEVEL: {
    description: 'Logging level',
    default: 'info',
    validate: (value) => {
      if (!['error', 'warn', 'info', 'debug'].includes(value)) {
        return 'LOG_LEVEL must be one of: error, warn, info, debug.';
      }
      return null;
    }
  },
  
  // File Upload
  MAX_FILE_SIZE: {
    description: 'Maximum file upload size',
    default: '50mb'
  },
  
  UPLOAD_PATH: {
    description: 'File upload directory',
    default: 'uploads/'
  },
  
  // Email
  EMAIL_SERVICE: {
    description: 'Email service provider'
  },
  
  EMAIL_USER: {
    description: 'Email user for notifications'
  },
  
  EMAIL_PASS: {
    description: 'Email password for notifications'
  },
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: {
    description: 'Rate limit window in milliseconds',
    default: '900000',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        return 'RATE_LIMIT_WINDOW_MS must be a non-negative number.';
      }
      return null;
    }
  },
  
  RATE_LIMIT_MAX_REQUESTS: {
    description: 'Maximum requests per window',
    default: '100',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'RATE_LIMIT_MAX_REQUESTS must be a positive number.';
      }
      return null;
    }
  },
  
  AUTH_RATE_LIMIT_MAX: {
    description: 'Maximum auth requests per window',
    default: '5',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'AUTH_RATE_LIMIT_MAX must be a positive number.';
      }
      return null;
    }
  }
};

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const issues = [];
  const warnings = [];
  const config = {};

  logger.info('🔍 Validating environment configuration...');

  // Check required variables
  for (const [key, spec] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    
    if (!value) {
      if (spec.default) {
        process.env[key] = spec.default;
        config[key] = spec.default;
        warnings.push(`${key}: Using default value "${spec.default}"`);
      } else {
        issues.push(`${key}: Required environment variable is missing. ${spec.description}`);
        continue;
      }
    } else {
      config[key] = value;
    }
    
    // Validate if validator function exists
    if (spec.validate) {
      const validationError = spec.validate(process.env[key]);
      if (validationError) {
        if (spec.required) {
          issues.push(`${key}: ${validationError}`);
        } else {
          warnings.push(`${key}: ${validationError}`);
        }
      }
    }
  }

  // Check optional variables
  for (const [key, spec] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key];
    
    if (value) {
      config[key] = value;
      
      // Validate if validator function exists
      if (spec.validate) {
        const validationError = spec.validate(value);
        if (validationError) {
          warnings.push(`${key}: ${validationError}`);
        }
      }
    } else if (spec.default) {
      process.env[key] = spec.default;
      config[key] = spec.default;
    }
  }

  // Log results
  if (warnings.length > 0) {
    logger.warn('⚠️ Environment configuration warnings:');
    warnings.forEach(warning => logger.warn(`   ${warning}`));
  }

  if (issues.length > 0) {
    logger.error('❌ Environment configuration errors:');
    issues.forEach(issue => logger.error(`   ${issue}`));
    throw new Error(`Environment validation failed. Please fix ${issues.length} configuration issue(s).`);
  }

  logger.info('✅ Environment validation completed successfully');
  
  // Log configuration summary (without sensitive values)
  const safeSummary = Object.entries(config).reduce((acc, [key, value]) => {
    if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('API_KEY')) {
      acc[key] = value ? '***CONFIGURED***' : '***NOT_SET***';
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  logger.info('📋 Configuration summary:', safeSummary);
  
  return config;
}

/**
 * Get environment status for health checks
 */
function getEnvironmentStatus() {
  const status = {
    environment: process.env.NODE_ENV || 'development',
    configured: {
      database: !!process.env.MONGODB_URI,
      jwt: !!process.env.JWT_SECRET,
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here',
      email: !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS),
      frontend: !!process.env.FRONTEND_URL
    },
    security: {
      defaultSecrets: [
        process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-12345',
        process.env.SESSION_SECRET === 'your-session-secret-key-change-this-in-production'
      ].some(Boolean)
    }
  };

  return status;
}

module.exports = {
  validateEnvironment,
  getEnvironmentStatus,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS
};