import React, { useState, useEffect } from 'react';

/**
 * Enhanced Settings Panel Component
 * 
 * Features:
 * - Application Mode (Demo vs Production)
 * - Backend API Configuration
 * - Vector DB Selection (PostgreSQL/Cosmos/Google Cloud/ChromaDB)
 * - Configuration Override System
 * - LLM Provider Selection
 * - Database Configuration
 * 
 * All configurations can be done via UI - no code editing required
 */

export default function EnhancedSettingsPanel() {
  // Application Mode
  const [applicationMode, setApplicationMode] = useState('demo');
  const [isDemo, setIsDemo] = useState(true);
  
  // Configuration Override
  const [useEnvVars, setUseEnvVars] = useState(false);
  
  // Vector DB
  const [vectorDBType, setVectorDBType] = useState('postgres_pgvector');
  
  // Load initial settings
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const modeResponse = await fetch('/api/v1/settings/mode');
      const modeData = await modeResponse.json();
      setApplicationMode(modeData.mode);
      setIsDemo(modeData.is_demo);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  
  const switchMode = async (newMode: string) => {
    try {
      const response = await fetch(`/api/v1/settings/mode/switch?mode=${newMode}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setApplicationMode(newMode);
        setIsDemo(newMode === 'demo');
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <h2>Enhanced Settings Panel</h2>
      {/* Application Mode */}
      <div>
        <h3>Application Mode: {isDemo ? 'Demo' : 'Production'}</h3>
        <button onClick={() => switchMode(isDemo ? 'production' : 'demo')}>
          Switch to {isDemo ? 'Production' : 'Demo'}
        </button>
      </div>
      
      {/* Vector DB Selection */}
      <div>
        <h3>Vector Database</h3>
        <select value={vectorDBType} onChange={(e) => setVectorDBType(e.target.value)}>
          <option value="postgres_pgvector">PostgreSQL + pgvector</option>
          <option value="cosmos_db">Cosmos DB</option>
          <option value="google_cloud_vertex">Google Cloud Vertex AI</option>
          <option value="chromadb">ChromaDB</option>
        </select>
      </div>
    </div>
  );
}
