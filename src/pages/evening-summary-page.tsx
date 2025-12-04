/**
 * Evening Summary Component - Complete Implementation
 * Can be used as: src/components/EveningSummary.tsx OR app/(dashboard)/evening-summary/page.tsx
 * Integrated with Railway Backend API
 * Supports Production/Demo Mode
 * 
 * ✅ FIXED: Changed API endpoint from /api/v1/briefs/evening to /api/v1/evening-summary
 */

'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  Truck,
  Users,
  RefreshCw,
  Download,
  Mail,
  Moon,
  Activity,
  Sparkles,
  Target,
  Award
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tsm-sally-v70-production.up.railway.app'

interface EveningSummaryData {
  date: string
  mode: string
  kpis: Array<{
    label: string
    value: string
    change: string
    trend: 'up' | 'down' | 'stable'
    status: 'good' | 'warning' | 'critical'
  }>
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: string
    message: string
    site?: string
    compound?: string
    action_required?: string
  }>
  top_insights: Array<{
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    category: string
  }>
  summary_text: string
  generated_at: string
}

export default function EveningSummary() {
  const [currentMode, setCurrentMode] = useState<'demo' | 'production'>('demo')

  // Fetch Evening Summary
  const { data, isLoading, error, refetch } = useQuery<EveningSummaryData>({
    queryKey: ['evening-summary', currentMode],
    queryFn: async () => {
      const response = await axios.get(
        // ✅ FIXED: Changed from /api/v1/briefs/evening to /api/v1/evening-summary
        `${API_BASE_URL}/api/v1/evening-summary?mode=${currentMode}`
      )
      return response.data
    },
    refetchInterval: 60000, // Refresh every minute
  })

  const handleRefresh = () => {
    refetch()
    toast.success('Evening summary refreshed!')
  }

  const handleModeToggle = () => {
    const newMode = currentMode === 'demo' ? 'production' : 'demo'
    setCurrentMode(newMode)
    toast.info(`Switched to ${newMode} mode`)
  }

  const handleExport = () => {
    toast.success('Export functionality coming soon!')
  }

  const handleEmail = () => {
    toast.success('Email functionality coming soon!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading evening summary...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Failed to Load Evening Summary</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'An error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      case 'stable': return <Activity className="h-4 w-4 text-gray-500" />
      default: return null
    }
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>
      case 'low': return <Badge variant="outline">Low Impact</Badge>
      default: return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Moon className="h-8 w-8 text-indigo-600" />
            End of Day Summary
          </h1>
          <p className="text-gray-600 mt-1">Progress & tomorrow's plan</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleModeToggle}
            className={currentMode === 'production' ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {currentMode === 'production' ? 'Production Mode' : 'Demo Mode'}
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </div>
      </div>

      {/* Date & Timestamp */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Summary Date</p>
              <p className="text-lg font-semibold">{data?.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Generated At</p>
              <p className="text-lg font-semibold">{data?.generated_at}</p>
            </div>
            <div>
              <Badge variant="secondary" className="text-sm">
                Mode: {data?.mode}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.kpis?.map((kpi, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${getStatusColor(kpi.status)}`}>
                      {kpi.value}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <p className="text-sm text-gray-600">{kpi.change}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(kpi.status)}>
                    {kpi.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts & Warnings */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-yellow-600" />
          Alerts & Warnings
        </h2>
        <div className="space-y-3">
          {data?.alerts?.map((alert, index) => (
            <Alert key={index} className={getSeverityColor(alert.severity)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <AlertTitle className="font-semibold">
                    [{alert.severity.toUpperCase()}] {alert.category}
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.message}
                    {alert.site && (
                      <div className="mt-1 text-sm">
                        <strong>Site:</strong> {alert.site}
                      </div>
                    )}
                    {alert.compound && (
                      <div className="text-sm">
                        <strong>Compound:</strong> {alert.compound}
                      </div>
                    )}
                    {alert.action_required && (
                      <div className="mt-2 text-sm font-medium">
                        <strong>Action Required:</strong> {alert.action_required}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>

      {/* Top Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          Top Insights of the Day
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.top_insights?.map((insight, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  {getImpactBadge(insight.impact)}
                </div>
                <Badge variant="outline" className="w-fit">
                  {insight.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{data?.summary_text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
