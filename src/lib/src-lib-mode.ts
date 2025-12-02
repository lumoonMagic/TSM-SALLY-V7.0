/**
 * Mode Detection Module
 * Determines if the app is running in demo or production mode
 */

/**
 * Check if the app is in production mode
 */
export function isProductionMode(): boolean {
  const mode = import.meta.env.VITE_MODE || 'demo';
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If API_BASE_URL is set and MODE is 'production', we're in production
  const isProduction = mode === 'production' && !!apiUrl;
  
  console.log('🔍 Mode Detection:', {
    VITE_MODE: mode,
    VITE_API_BASE_URL: apiUrl,
    isProductionMode: isProduction
  });
  
  return isProduction;
}

/**
 * Get database mode (demo or production)
 */
export function getDatabaseMode(): 'demo' | 'production' {
  return isProductionMode() ? 'production' : 'demo';
}

/**
 * Get mode information for display
 */
export function getModeInfo() {
  const mode = getDatabaseMode();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (mode === 'production') {
    return {
      mode: 'production',
      label: 'Production Mode',
      database: 'PostgreSQL (Railway)',
      api: apiUrl || 'Not configured',
      color: 'green'
    };
  } else {
    return {
      mode: 'demo',
      label: 'Demo Mode',
      database: 'IndexedDB (Browser)',
      api: 'Local only',
      color: 'blue'
    };
  }
}
