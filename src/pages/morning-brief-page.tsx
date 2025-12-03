/**
 * Morning Brief Page - Complete Implementation
 * Integrated with Railway Backend API
 * Supports Production/Demo Mode
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { useAppConfig } from '@/lib/context/app-config-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  Truck,
  Users,
  RefreshCw,
  Download,
  Mail,
  Sparkles,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface MorningBriefData {
  date: string
  mode: string
  summary: {
    critical_alerts: number
    sites_low_inventory: number
    high_risk_shipments: number
    temperature_issues?: number
    enrollment_behind_schedule: string[]
  }
  sections: {
    alerts: Array<{
      severity: string
      type: string
      site: string
      site_name?: string
      message: string
      action?: string
      status?: string
    }>
    inventory_status: {
      total_sites?: number
      healthy?: number
      low_stock?: number
      critical?: number
      sites_with_issues?: number
      details?: Array<{
        site_id: string
        site_name: string
        low_stock_products: number
        total_units: number
      }>
    }
    shipments: {
      in_transit: number
      delayed: number
      temperature_issues: number
      arriving_today: number
      active_shipments?: Array<{
        shipment_id: string
        from: string
        to: string
        status: string
        eta: string | null
      }>
    }
    enrollment: {
      studies_on_track: number
      studies_behind: number
      total_subjects?: number
      total_studies?: number
      weekly_enrollment_rate?: number
      studies_details?: Array<{
        study_id: string
        study_name: string
        target: number
        current: number
        active_subjects: number
      }>
    }
    risk_insights: string[]
    recommendations: string[]
  }
  algorithms_used: string[]
  generated_at: string
}

export default function MorningBriefPage() {
  const { config } = useAppConfig()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch morning brief data
  const { data, isLoading, error, refetch } = useQuery<MorningBriefData>({
    queryKey: ['morning-brief', config.mode],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRIEFS.MORNING}?mode=${config.mode}`
      )
      return response
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Morning Brief refreshed successfully')
    } catch (err) {
      toast.error('Failed to refresh Morning Brief')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon')
  }

  const handleEmail = () => {
    toast.info('Email feature coming soon')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading Morning Brief...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Morning Brief</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load morning brief data'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) return null

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Morning Brief</h1>
            <Badge variant={config.mode === 'production' ? 'default' : 'secondary'}>
              {config.mode === 'production' ? (
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
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{data.summary.critical_alerts}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Inventory Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{data.summary.sites_low_inventory}</div>
                <p className="text-xs text-muted-foreground mt-1">Below minimum stock</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Risk Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{data.summary.high_risk_shipments}</div>
                <p className="text-xs text-muted-foreground mt-1">Delayed or at risk</p>
              </div>
              <Truck className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Studies Behind Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {data.summary.enrollment_behind_schedule.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enrollment lagging</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="shipments">
            <Truck className="mr-2 h-4 w-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="enrollment">
            <Users className="mr-2 h-4 w-4" />
            Enrollment
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {data.sections.alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No critical alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.sections.alerts.map((alert, index) => (
                    <Alert key={index} variant={getSeverityColor(alert.severity) as any}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {alert.site_name || alert.site} - {alert.type.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mt-2">{alert.message}</p>
                        {alert.action && (
                          <p className="mt-2 font-semibold">Action: {alert.action}</p>
                        )}
                        {alert.status && (
                          <Badge className="mt-2" variant="outline">
                            Status: {alert.status}
                          </Badge>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Site inventory levels and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {config.mode === 'production' && data.sections.inventory_status.details ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {data.sections.inventory_status.sites_with_issues || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Sites with Issues</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {data.sections.inventory_status.details.map((site, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-accent">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{site.site_name}</div>
                            <div className="text-sm text-muted-foreground">{site.site_id}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">
                              {site.low_stock_products} Products Low
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {site.total_units} units remaining
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {data.sections.inventory_status.healthy || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Healthy</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.sections.inventory_status.low_stock || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Low Stock</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {data.sections.inventory_status.critical || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {data.sections.inventory_status.total_sites || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sites</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Status</CardTitle>
              <CardDescription>Active shipments and delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{data.sections.shipments.in_transit}</div>
                  <div className="text-sm text-muted-foreground">In Transit</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.sections.shipments.delayed}
                  </div>
                  <div className="text-sm text-muted-foreground">Delayed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.sections.shipments.temperature_issues}
                  </div>
                  <div className="text-sm text-muted-foreground">Temp Issues</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.sections.shipments.arriving_today}
                  </div>
                  <div className="text-sm text-muted-foreground">Arriving Today</div>
                </div>
              </div>

              {data.sections.shipments.active_shipments && (
                <div className="space-y-2">
                  <h4 className="font-semibold mb-3">Active Shipments</h4>
                  {data.sections.shipments.active_shipments.slice(0, 5).map((shipment, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-accent">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{shipment.shipment_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {shipment.from} → {shipment.to}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge>{shipment.status}</Badge>
                          {shipment.eta && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ETA: {format(new Date(shipment.eta), 'MMM d, h:mm a')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollment Tab */}
        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Status</CardTitle>
              <CardDescription>Study enrollment progress and rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.sections.enrollment.studies_on_track}
                  </div>
                  <div className="text-sm text-muted-foreground">Studies On Track</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.sections.enrollment.studies_behind}
                  </div>
                  <div className="text-sm text-muted-foreground">Studies Behind</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {data.sections.enrollment.total_subjects || 
                     data.sections.enrollment.weekly_enrollment_rate || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.sections.enrollment.total_subjects ? 'Total Subjects' : 'Weekly Rate'}
                  </div>
                </div>
              </div>

              {data.sections.enrollment.studies_details && (
                <div className="space-y-2">
                  <h4 className="font-semibold mb-3">Study Details</h4>
                  {data.sections.enrollment.studies_details.map((study, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{study.study_name}</div>
                          <div className="text-sm text-muted-foreground">{study.study_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {study.current} / {study.target}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {study.active_subjects} active
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(study.current / study.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Insights</CardTitle>
              <CardDescription>AI-powered analysis and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.sections.risk_insights.map((insight, index) => (
                  <div key={index} className="p-3 border rounded-lg flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-orange-500 mt-0.5" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested actions based on current data</CardDescription>
            </CardHeader>
            <CardContent>
              {data.sections.recommendations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recommendations at this time
                </p>
              ) : (
                <div className="space-y-2">
                  {data.sections.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Algorithms Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.algorithms_used.map((algo, index) => (
                  <Badge key={index} variant="outline">
                    {algo.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
