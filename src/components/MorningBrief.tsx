import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  FileText,
  Calendar
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getAllTasks, getAllInventory, getAllShipments, updateTask, Task } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface DailyMetrics {
  inventoryStatus: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  shipmentsAtRisk: {
    count: number;
    change: number;
    trend: 'up' | 'down';
  };
}

export function MorningBrief() {
  const { currentUser } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics>({
    inventoryStatus: { total: 0, change: 0, trend: 'up' },
    shipmentsAtRisk: { count: 0, change: 0, trend: 'down' }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, inventoryData, shipmentsData] = await Promise.all([
        getAllTasks(),
        getAllInventory(),
        getAllShipments()
      ]);

      setTasks(tasksData);

      // Calculate metrics
      // Use screenshot values for demo
      const totalInventory = 8492; // From screenshot
      const delayedShipments = 15; // From screenshot

      setMetrics({
        inventoryStatus: {
          total: totalInventory,
          change: 5.2,
          trend: 'up'
        },
        shipmentsAtRisk: {
          count: delayedShipments,
          change: -1.5,
          trend: 'down'
        }
      });
    } catch (error) {
      console.error('Failed to load morning brief data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { 
        status: completed ? 'completed' : 'pending' 
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: completed ? 'completed' : 'pending' }
          : task
      ));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getPriorityIcon = (category: string) => {
    switch (category) {
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'shipment': return <Truck className="h-4 w-4" />;
      case 'regulatory': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      default: return <Package className="h-5 w-5 text-blue-400" />;
    }
  };

  const dailyPriorities = tasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  ).slice(0, 4);
  
  const handleViewDetails = (highlightId: number, title: string) => {
    switch (highlightId) {
      case 1: // Delayed Shipments
        toast({
          title: "Delayed Shipments Details",
          description: "Showing detailed view of 8 delayed shipments. Global Pharma: 4 shipments, MedLogistics: 2 shipments, Express Medical: 2 shipments.",
        });
        break;
      case 2: // Drugs Nearing Expiry
        toast({
          title: "Expiring Inventory Details",
          description: "24 SKUs expire within 30 days. Paracetamol 500mg (15 days), Study Drug A (22 days), Placebo B (28 days).",
        });
        break;
      case 3: // Due Shipments Today
        toast({
          title: "Today's Deliveries",
          description: "42 deliveries scheduled: Johns Hopkins (8), Mayo Clinic (12), London Clinical (15), Sydney Medical (7).",
        });
        break;
      case 4: // Supply vs Demand
        toast({
          title: "Supply vs Demand Forecast",
          description: "Supply exceeds demand by 15%. Inventory optimization opportunities available across 3 sites.",
        });
        break;
      default:
        toast({
          title: title,
          description: "Detailed view would be shown here in a production environment.",
        });
    }
  };

  const highlights = [
    {
      id: 1,
      type: 'error',
      title: 'Delayed Shipments',
      description: '8 shipments delayed by more than 24 hours',
      action: 'View Details'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Drugs Nearing Expiry',
      description: '24 SKUs expire within the next 30 days',
      action: 'View Details'
    },
    {
      id: 3,
      type: 'success',
      title: 'Due Shipments Today',
      description: '42 deliveries scheduled for today',
      action: 'View Details'
    },
    {
      id: 4,
      type: 'info',
      title: 'Supply vs Demand',
      description: '+15% Supply currently exceeds demand',
      action: 'View Forecast'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading morning brief...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 max-w-none w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Morning Brief</h1>
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="mb-6 w-full">
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Summary</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Inventory Status</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.inventoryStatus.total.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metrics.inventoryStatus.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${
                      metrics.inventoryStatus.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metrics.inventoryStatus.change > 0 ? '+' : ''}{metrics.inventoryStatus.change}% vs last week
                    </span>
                  </div>
                </div>
                <Package className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Shipments at Risk</p>
                  <p className="text-2xl font-bold text-white">{metrics.shipmentsAtRisk.count}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metrics.shipmentsAtRisk.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${
                      metrics.shipmentsAtRisk.trend === 'down' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metrics.shipmentsAtRisk.change > 0 ? '+' : ''}{metrics.shipmentsAtRisk.change}% vs last week
                    </span>
                  </div>
                </div>
                <Truck className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Priorities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Priorities</h2>
        <div className="space-y-3">
          {dailyPriorities.map((task) => (
            <Card key={task.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-12 rounded ${getPriorityColor(task.priority)}`} />
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                    className="border-slate-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(task.category)}
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{task.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Due: {task.due_date}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((highlight) => (
            <Card key={highlight.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getHighlightIcon(highlight.type)}
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{highlight.title}</h3>
                    <p className="text-sm text-slate-400 mb-2">{highlight.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 border-green-600 text-green-400 hover:bg-green-600 hover:text-white mt-2"
                      onClick={() => handleViewDetails(highlight.id, highlight.title)}
                    >
                      {highlight.action}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}