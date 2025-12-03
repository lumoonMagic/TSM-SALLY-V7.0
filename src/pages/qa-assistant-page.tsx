'use client';

/**
 * Q&A Assistant Page - PRODUCTION READY
 * 
 * Full-featured on-demand Q&A interface with:
 * - Natural language query input
 * - SQL generation with Monaco Editor (read-only display)
 * - RAG-enhanced responses
 * - Query history
 * - Production/Demo mode toggle
 * - Real-time API integration with Railway backend
 * 
 * API Endpoints:
 * - POST /api/v1/qa/ask - Standard Q&A with SQL generation
 * - POST /api/v1/qa/ask-with-rag - RAG-enhanced Q&A
 * - GET /api/v1/qa/history - Query history
 * 
 * Backend: Uses rag_sql_service_FIXED.py with correct table names
 */

import React, { useState, useEffect } from 'react';
import { Search, History, Sparkles, Database, FileText, AlertCircle, CheckCircle2, Loader2, Copy, Download } from 'lucide-react';
import Editor from '@monaco-editor/react';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface QueryResult {
  question: string;
  sql_query: string;
  result_count: number;
  execution_time: number;
  data: any[];
  insights?: string;
  rag_context?: string;
  mode: 'demo' | 'production';
  timestamp: string;
}

interface HistoryItem {
  id: string;
  question: string;
  timestamp: string;
  mode: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function QAAssistantPage() {
  // State management
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'demo' | 'production'>('production');
  const [useRAG, setUseRAG] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'sql' | 'insights'>('results');

  // API base URL - Update this to match your Railway deployment
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

  // ========== Load Query History ==========
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/qa/history?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // ========== Submit Query ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = useRAG ? '/api/v1/qa/ask-with-rag' : '/api/v1/qa/ask';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          mode: mode,
          include_insights: true,
          include_visualization: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Query failed');
      }

      const data = await response.json();
      setResult({
        question: query,
        sql_query: data.sql_query || data.generated_sql || '',
        result_count: data.result_count || data.data?.length || 0,
        execution_time: data.execution_time || 0,
        data: data.data || [],
        insights: data.insights || data.answer,
        rag_context: data.rag_context,
        mode: mode,
        timestamp: new Date().toISOString()
      });

      // Reload history
      loadHistory();
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== Copy SQL to Clipboard ==========
  const copySQLToClipboard = () => {
    if (result?.sql_query) {
      navigator.clipboard.writeText(result.sql_query);
      alert('SQL copied to clipboard!');
    }
  };

  // ========== Download Results as JSON ==========
  const downloadResults = () => {
    if (result?.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `query_results_${Date.now()}.json`;
      link.click();
    }
  };

  // ========== Sample Queries ==========
  const sampleQueries = [
    'Show me all clinical sites with low inventory',
    'Which products are expiring in the next 30 days?',
    'What are the recent temperature excursions?',
    'Show shipments in transit',
    'Which sites have enrollment above 80%?'
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Q&A Assistant</h1>
          <p className="text-gray-600">Ask questions in natural language, get instant insights from your supply chain data</p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Mode:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('demo')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'demo'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => setMode('production')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'production'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Production
                </button>
              </div>
            </div>

            {/* RAG Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRAG}
                  onChange={(e) => setUseRAG(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable RAG</span>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </label>
            </div>

            {/* Status Indicator */}
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'production' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
              <span className="text-sm text-gray-600">
                {mode === 'production' ? 'Connected to Database' : 'Demo Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Query Input & History */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Query Input Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Ask a Question
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me all sites with inventory below reorder point"
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Submit Query
                    </>
                  )}
                </button>
              </form>

              {/* Sample Queries */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Sample Queries:</h3>
                <div className="space-y-2">
                  {sampleQueries.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(sample)}
                      className="w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Query History */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Recent Queries
              </h2>
              
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No query history yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setQuery(item.question)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm text-gray-900 line-clamp-2">{item.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()} • {item.mode}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results Display */}
          <div className="lg:col-span-2">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Query Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Results Panel */}
            {result && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                
                {/* Results Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                  <h2 className="text-xl font-semibold mb-2">{result.question}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {result.result_count} results
                    </span>
                    <span>{result.execution_time.toFixed(2)}ms</span>
                    <span className="px-2 py-1 bg-white/20 rounded">
                      {result.mode}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`flex-1 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'results'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Database className="h-4 w-4 inline mr-2" />
                    Results
                  </button>
                  <button
                    onClick={() => setActiveTab('sql')}
                    className={`flex-1 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'sql'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    SQL Query
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'insights'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Insights
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  
                  {/* Results Tab */}
                  {activeTab === 'results' && (
                    <div>
                      {result.data && result.data.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Query Results</h3>
                            <button
                              onClick={downloadResults}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              Download JSON
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  {Object.keys(result.data[0]).map((key) => (
                                    <th
                                      key={key}
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {result.data.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    {Object.values(row).map((value: any, cellIdx) => (
                                      <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {value !== null && value !== undefined ? String(value) : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No results found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SQL Tab */}
                  {activeTab === 'sql' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">Generated SQL Query</h3>
                        <button
                          onClick={copySQLToClipboard}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          Copy SQL
                        </button>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Editor
                          height="400px"
                          defaultLanguage="sql"
                          value={result.sql_query}
                          theme="vs-light"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Insights Tab */}
                  {activeTab === 'insights' && (
                    <div className="space-y-6">
                      {result.insights && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">LLM Analysis</h3>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed">{result.insights}</p>
                          </div>
                        </div>
                      )}
                      
                      {result.rag_context && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">RAG Context</h3>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700">{result.rag_context}</p>
                          </div>
                        </div>
                      )}

                      {!result.insights && !result.rag_context && (
                        <div className="text-center py-12">
                          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No insights available</p>
                          <p className="text-sm text-gray-400 mt-2">Enable RAG for enhanced insights</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Explore Your Data</h3>
                <p className="text-gray-600 mb-6">
                  Enter a question in natural language to query your supply chain database
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    SQL Generation
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    RAG Enhancement
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    LLM Insights
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
