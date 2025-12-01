/**
 * Application Mode Detection
 * Determines whether the app is running in Demo Mode or Production Mode
 */

/**
 * Check if the application is running in production mode
 * 
 * Production mode requires:
 * 1. VITE_API_BASE_URL environment variable is set
 * 2. VITE_MODE environment variable is set to 'production'
 * 
 * @returns true if in production mode, false for demo mode
 */
export const isProductionMode = (): boolean => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const mode = import.meta.env.VITE_MODE;
  
  // Must have both API URL and production mode flag
  const hasApiUrl = apiBaseUrl && apiBaseUrl !== '';
  const isProduction = mode === 'production';
  
  return hasApiUrl && isProduction;
};

/**
 * Get the current database mode
 * @returns 'demo' for IndexedDB local storage, 'production' for backend API
 */
export const getDatabaseMode = (): 'demo' | 'production' => {
  return isProductionMode() ? 'production' : 'demo';
};

/**
 * Check if backend API is configured
 * @returns true if API base URL is set
 */
export const hasBackendApi = (): boolean => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return !!(apiBaseUrl && apiBaseUrl !== '');
};

/**
 * Get current mode information for debugging
 * @returns object with mode details
 */
export const getModeInfo = () => {
  return {
    mode: getDatabaseMode(),
    isProduction: isProductionMode(),
    hasBackend: hasBackendApi(),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'Not configured',
    viteMode: import.meta.env.VITE_MODE || 'Not set',
  };
};

/**
 * Log mode information to console (for debugging)
 */
export const logModeInfo = () => {
  const info = getModeInfo();
  console.group('🎯 Sally TSM Mode Information');
  console.log('Mode:', info.mode.toUpperCase());
  console.log('Production Mode:', info.isProduction ? '✅' : '❌');
  console.log('Backend API:', info.hasBackend ? '✅' : '❌');
  console.log('API Base URL:', info.apiBaseUrl);
  console.log('VITE_MODE:', info.viteMode);
  console.groupEnd();
  
  return info;
};

/**
 * Display mode notification in UI
 * @returns user-friendly mode message
 */
export const getModeMessage = (): string => {
  if (isProductionMode()) {
    return 'Production Mode: Connected to backend database';
  }
  return 'Demo Mode: Using local IndexedDB with sample data';
};
