/**
 * Application Configuration
 * 
 * This configuration file checks the VITE_APP_STAGE environment variable
 * and dynamically sets the appropriate base URLs for different environments.
 * 
 * Supported stages: 'local', 'dev', 'staging', 'production'
 */

type AppStage = 'local' | 'dev' | 'staging' | 'production';

interface AppConfig {
  stage: AppStage;
  appName: string;
  api: {
    account: {
      baseUrl: string;
    };
    azapal: {
      baseUrl: string;
    };
  };
  isDevelopment: boolean;
  isProduction: boolean;
  isLocal: boolean;
}

/**
 * Get the current application stage from environment variables
 * Defaults to 'local' if not specified
 */
const getAppStage = (): AppStage => {
  const stage = import.meta.env.VITE_APP_STAGE?.toLowerCase();

  console.log('state:', stage)
  
  if (stage === 'dev' || stage === 'development') return 'dev';
  if (stage === 'staging' || stage === 'stage') return 'staging';
  if (stage === 'production' || stage === 'prod') return 'production';
  
  return 'local';
};

/**
 * Get the base URL for the Account API based on the current stage
 */
const getAccountBaseUrl = (stage: AppStage): string => {
  switch (stage) {
    case 'local':
      return import.meta.env.VITE_ACCOUNT_BASE_URL_LOCAL || 'http://localhost:3000/api/v1/account';
    
    case 'dev':
      return import.meta.env.VITE_ACCOUNT_BASE_URL_DEV || 'https://i7ofu796g2.execute-api.us-east-1.amazonaws.com/dev/api/v1/account';
    
    case 'staging':
      return import.meta.env.VITE_ACCOUNT_BASE_URL_STAGING || import.meta.env.VITE_ACCOUNT_BASE_URL_DEV || 'https://i7ofu796g2.execute-api.us-east-1.amazonaws.com/dev/api/v1/account';
    
    case 'production':
      return import.meta.env.VITE_ACCOUNT_BASE_URL_PROD || import.meta.env.VITE_ACCOUNT_BASE_URL_DEV || 'https://i7ofu796g2.execute-api.us-east-1.amazonaws.com/dev/api/v1/account';
    
    default:
      return 'http://localhost:3000/api/v1/account';
  }
};

/**
 * Get the base URL for the Azapal API based on the current stage
 */
const getAzapalBaseUrl = (stage: AppStage): string => {
      console.log('stage:', stage);


  switch (stage) {
    case 'local':
      console.log('skskskkskk', import.meta.env)
      return import.meta.env.VITE_AZAPAL_BASE_URL_LOCAL || 'http://localhost:3000/api/v1/azapal';
    
    case 'dev':
      return import.meta.env.VITE_AZAPAL_BASE_URL_DEV || 'https://0x23ivl8ga.execute-api.us-east-1.amazonaws.com/dev/api/v1/azapal';
    
    case 'staging':
      return import.meta.env.VITE_AZAPAL_BASE_URL_STAGING || import.meta.env.VITE_AZAPAL_BASE_URL_DEV || 'https://0x23ivl8ga.execute-api.us-east-1.amazonaws.com/dev/api/v1/azapal';
    
    case 'production':
      return import.meta.env.VITE_AZAPAL_BASE_URL_PROD || import.meta.env.VITE_AZAPAL_BASE_URL_DEV || 'https://0x23ivl8ga.execute-api.us-east-1.amazonaws.com/dev/api/v1/azapal';
    
    default:
      return 'http://localhost:3000/api/v1/azapal';
  }
};

// Initialize configuration
const currentStage = getAppStage();

/**
 * Main application configuration object
 * Access this throughout your application for environment-specific settings
 */
const config: AppConfig = {
  stage: currentStage,
  appName: import.meta.env.VITE_APP_NAME || 'Azapal',
  
  api: {
    account: {
      baseUrl: getAccountBaseUrl(currentStage),
    },
    azapal: {
      baseUrl: getAzapalBaseUrl(currentStage),
    },
  },
  
  // Helper flags for environment checking
  isDevelopment: currentStage === 'local' || currentStage === 'dev',
  isProduction: currentStage === 'production',
  isLocal: currentStage === 'local',
};

// Log configuration in development (helps with debugging)
if (config.isDevelopment && typeof window !== 'undefined') {
  console.log('🚀 App Configuration:', {
    stage: config.stage,
    accountBaseUrl: config.api.account.baseUrl,
    azapalBaseUrl: config.api.azapal.baseUrl,
  });
}

export default config;

/**
 * Usage Examples:
 * 
 * // Import the config
 * import config from '@/config/config';
 * 
 * // Use in API calls
 * const response = await fetch(`${config.api.account.baseUrl}/authenticate-user`, {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 * 
 * // Check environment
 * if (config.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 * 
 * // Access specific values
 * console.log('Current stage:', config.stage);
 * console.log('App name:', config.appName);
 */
