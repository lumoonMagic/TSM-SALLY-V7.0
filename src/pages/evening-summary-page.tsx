/**
 * Evening Summary Component - Complete Implementation
 * Can be used as: src/components/EveningSummary.tsx OR app/(dashboard)/evening-summary/page.tsx
 * Integrated with Railway Backend API
 * Supports Production/Demo Mode
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
  summary: {
    issues_resolved: number
    deliveries_completed: number
    on_time_percentage: number
    new_enrollments: number
  }
  sections: {
    today_achievements: {
      issues_resolved: Array<{
        type: string
        count: number
      }>
      deliveries: {
        total_deliveries?: number
        on_time?: number
        delayed?: number
      }
      deliveries_completed?: number
      on_time?: number
      delayed?: number
      enrollments?: Array<{
        study_id: string
        study_name: string
        new_subjects: number
      }>
    }
    metrics_vs_targets: {
      delivery_performance: {
        actual?: number
        target?: number
        status?: string
        total?: number
        on_time?: number
        delayed?: number
      }
      enrollment_rate?: {
        actual: number
        target: number
        status: string
      }
      inventory_transactions?: {
        total_transactions?: number
        additions?: number
        removals?: number
      }
    }
    overnight_monitors: {
      shipments_in_transit?: number | Array<{
        shipment_id: string
        from: string
        to: string
        eta: string | null
      }>
      sites_requiring_attention?: number
    }
    tomorrow_priorities?: string[]
  }
  generated_at: string
}

interface EveningSummaryProps {
  mode?: 'production' | 'demo'
}

export default function EveningSummary({ mode: propMode }: EveningSummaryProps = {}) {
  const [currentMode, setCurrentMode] = useState<'production' | 'demo'>(propMode || 'production')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch evening summary data
  const { data, isLoading, error, refetch } = useQuery<EveningSummaryData>({
    queryKey: ['evening-summary', currentMode],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/evening-summary?mode=${currentMode}``
      )
      return response.data
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Evening Summary refreshed')
    } catch (err) {
      toast.error('Failed to refresh')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportPDF = () => {
    toast.info('PDF export coming soon')
  }

  const handleEmail = () => {
    toast.info('Email feature coming soon')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading Evening Summary...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Evening Summary</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load data'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Moon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Evening Summary</h1>
            <Badge variant={currentMode === 'production' ? 'default' : 'secondary'}>
              {currentMode === 'production' ? (
                <><Activity className="mr-1 h-3 w-3" /> Production</>
              ) : (
                <><Sparkles className="mr-1 h-3 w-3" /> Demo</>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {format(new Date(data.date), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-muted-foreground">
            Generated at {format(new Date(data.generated_at), 'h:mm a')}
          </p>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issues Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {data.summary.issues_resolved}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Closed today</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deliveries Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{data.summary.deliveries_completed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.on_time_percentage.toFixed(1)}% on-time
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              On-Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {data.summary.on_time_percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {data.summary.new_enrollments}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Subjects enrolled</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">
            <Award className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Target className="mr-2 h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="overnight">
            <Moon className="mr-2 h-4 w-4" />
            Overnight
          </TabsTrigger>
          <TabsTrigger value="tomorrow">
            <TrendingUp className="mr-2 h-4 w-4" />
            Tomorrow
          </TabsTrigger>
        </TabsList>

        {/* Today's Achievements */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Achievements</CardTitle>
              <CardDescription>Issues resolved and deliveries completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Issues Resolved */}
              <div>
                <h4 className="font-semibold mb-3">Issues Resolved</h4>
                {data.sections.today_achievements.issues_resolved.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No issues resolved today</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {data.sections.today_achievements.issues_resolved.map((issue, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{issue.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {issue.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deliveries */}
              <div>
                <h4 className="font-semibold mb-3">Delivery Performance</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {data.sections.today_achievements.deliveries?.total_deliveries ||
                       data.sections.today_achievements.deliveries_completed || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {data.sections.today_achievements.deliveries?.on_time ||
                       data.sections.today_achievements.on_time || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">On Time</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {data.sections.today_achievements.deliveries?.delayed ||
                       data.sections.today_achievements.delayed || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Delayed</div>
                  </div>
                </div>
              </div>

              {/* Enrollments */}
              {data.sections.today_achievements.enrollments && (
                <div>
                  <h4 className="font-semibold mb-3">New Enrollments</h4>
                  <div className="space-y-2">
                    {data.sections.today_achievements.enrollments.map((enrollment, index) => (
                      <div key={index} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium">{enrollment.study_name}</div>
                          <div className="text-sm text-muted-foreground">{enrollment.study_id}</div>
                        </div>
                        <Badge variant="secondary">
                          {enrollment.new_subjects} new subjects
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics vs Targets */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics vs Targets</CardTitle>
              <CardDescription>Performance against KPIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Performance */}
              <div>
                <h4 className="font-semibold mb-3">Delivery Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">On-Time Delivery Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">
                        {data.sections.metrics_vs_targets.delivery_performance.actual?.toFixed(1) ||
                         (data.sections.metrics_vs_targets.delivery_performance.total && data.sections.metrics_vs_targets.delivery_performance.on_time
                           ? ((data.sections.metrics_vs_targets.delivery_performance.on_time / data.sections.metrics_vs_targets.delivery_performance.total) * 100).toFixed(1)
                           : '0.0')}%
                      </span>
                      <Badge variant={
                        (data.sections.metrics_vs_targets.delivery_performance.actual || 0) >= 95
                          ? 'default'
                          : 'destructive'
                      }>
                        Target: {data.sections.metrics_vs_targets.delivery_performance.target || 95}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (data.sections.metrics_vs_targets.delivery_performance.actual || 0) >= 95
                          ? 'bg-green-600'
                          : 'bg-yellow-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          data.sections.metrics_vs_targets.delivery_performance.actual || 0,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Enrollment Rate */}
              {data.sections.metrics_vs_targets.enrollment_rate && (
                <div>
                  <h4 className="font-semibold mb-3">Enrollment Rate</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Daily Enrollment</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">
                          {data.sections.metrics_vs_targets.enrollment_rate.actual}
                        </span>
                        <Badge variant={
                          data.sections.metrics_vs_targets.enrollment_rate.status === 'exceeding'
                            ? 'default'
                            : 'secondary'
                        }>
                          Target: {data.sections.metrics_vs_targets.enrollment_rate.target}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Transactions */}
              {data.sections.metrics_vs_targets.inventory_transactions && (
                <div>
                  <h4 className="font-semibold mb-3">Inventory Transactions</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {data.sections.metrics_vs_targets.inventory_transactions.total_transactions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {data.sections.metrics_vs_targets.inventory_transactions.additions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Additions</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.sections.metrics_vs_targets.inventory_transactions.removals || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Removals</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overnight Monitors */}
        <TabsContent value="overnight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overnight Monitors</CardTitle>
              <CardDescription>Items requiring overnight attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shipments in Transit */}
              <div>
                <h4 className="font-semibold mb-3">Shipments in Transit</h4>
                {Array.isArray(data.sections.overnight_monitors.shipments_in_transit) ? (
                  <div className="space-y-2">
                    {data.sections.overnight_monitors.shipments_in_transit.map((shipment, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{shipment.shipment_id}</div>
                            <div className="text-sm text-muted-foreground">
                              {shipment.from} → {shipment.to}
                            </div>
                          </div>
                          {shipment.eta && (
                            <div className="text-sm text-muted-foreground">
                              ETA: {format(new Date(shipment.eta), 'MMM d, h:mm a')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-lg">
                    <Truck className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {data.sections.overnight_monitors.shipments_in_transit || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Shipments in transit overnight</div>
                  </div>
                )}
              </div>

              {/* Sites Requiring Attention */}
              {data.sections.overnight_monitors.sites_requiring_attention !== undefined && (
                <div>
                  <h4 className="font-semibold mb-3">Sites Requiring Attention</h4>
                  <div className="text-center p-8 border rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">
                      {data.sections.overnight_monitors.sites_requiring_attention}
                    </div>
                    <div className="text-sm text-muted-foreground">Sites need monitoring</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tomorrow's Priorities */}
        <TabsContent value="tomorrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tomorrow's Priorities</CardTitle>
              <CardDescription>Recommended actions for tomorrow</CardDescription>
            </CardHeader>
            <CardContent>
              {!data.sections.tomorrow_priorities || data.sections.tomorrow_priorities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>All priorities addressed. Start fresh tomorrow!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.sections.tomorrow_priorities.map((priority, index) => (
                    <div key={index} className="p-4 border rounded-lg flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
