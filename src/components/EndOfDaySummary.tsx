import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar,
  Download,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getAllTasks, Task } from '@/lib/database';

interface TaskSummary {
  completed: Task[];
  outstanding: Task[];
  tomorrowPlan: Task[];
}

export function EndOfDaySummary() {
  const { currentUser } = useApp();
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    completed: [],
    outstanding: [],
    tomorrowPlan: []
  });
  const [activeTab, setActiveTab] = useState<'completed' | 'outstanding'>('completed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tasks = await getAllTasks();
      
      const completed = tasks.filter(task => task.status === 'completed');
      const outstanding = tasks.filter(task => 
        task.status === 'pending' || task.status === 'in_progress' || task.status === 'overdue'
      );
      
      // Mock tomorrow's plan - in real app, this would be generated based on priorities
      const tomorrowPlan = [
        {
          id: 'tomorrow-1',
          title: 'Review Q4 shipment manifests',
          description: 'Complete regulatory review for all Q4 shipments',
          priority: 'high' as const,
          status: 'pending' as const,
          assigned_to: 'TSM Team',
          due_date: '2024-11-26',
          created_date: '2024-11-25',
          category: 'regulatory' as const
        },
        {
          id: 'tomorrow-2',
          title: 'Site inventory audit - Johns Hopkins',
          description: 'Conduct monthly inventory verification',
          priority: 'medium' as const,
          status: 'pending' as const,
          assigned_to: 'Supply Manager',
          due_date: '2024-11-26',
          created_date: '2024-11-25',
          category: 'inventory' as const
        },
        {
          id: 'tomorrow-3',
          title: 'Vendor performance review meeting',
          description: 'Quarterly review with MedLogistics Inc',
          priority: 'medium' as const,
          status: 'pending' as const,
          assigned_to: 'Operations Lead',
          due_date: '2024-11-26',
          created_date: '2024-11-25',
          category: 'communication' as const
        },
        {
          id: 'tomorrow-4',
          title: 'Update supply forecasts',
          description: 'Adjust Q1 2025 supply planning based on enrollment data',
          priority: 'low' as const,
          status: 'pending' as const,
          assigned_to: 'Planning Team',
          due_date: '2024-11-27',
          created_date: '2024-11-25',
          category: 'planning' as const
        }
      ];

      setTaskSummary({
        completed,
        outstanding,
        tomorrowPlan
      });
    } catch (error) {
      console.error('Failed to load end of day summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const completionPercentage = Math.round(
    (taskSummary.completed.length / (taskSummary.completed.length + taskSummary.outstanding.length)) * 100
  ) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading end of day summary...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 max-w-none w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">End of Day Summary</h1>
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
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback className="bg-slate-600 text-white">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Tasks Completed</h3>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {taskSummary.completed.length}/{taskSummary.completed.length + taskSummary.outstanding.length}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400">+5%</span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Urgent Issues</h3>
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {taskSummary.outstanding.filter(task => task.priority === 'urgent').length}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ArrowDown className="h-4 w-4 text-green-400" />
              <span className="text-green-400">-2</span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-slate-800 border-slate-700 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Overall Progress</h3>
            <span className="text-2xl font-bold text-white">{completionPercentage}% Done</span>
          </div>
          <Progress value={completionPercentage} className="h-3 mb-2" />
          <p className="text-sm text-slate-400">
            {taskSummary.completed.length} completed, {taskSummary.outstanding.length} remaining
          </p>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Completed Today
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'outstanding'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Outstanding
          </button>
        </div>
      </div>

      {/* Task Lists */}
      <div className="mb-8">
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {taskSummary.completed.map((task) => (
              <Card key={task.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <p className="text-sm text-slate-400">{task.description}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                    <span className="text-xs text-slate-500">Done</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {taskSummary.completed.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                No tasks completed today
              </div>
            )}
          </div>
        )}

        {activeTab === 'outstanding' && (
          <div className="space-y-3">
            {taskSummary.outstanding.map((task) => (
              <Card key={task.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-400" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <p className="text-sm text-slate-400">{task.description}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs border-slate-600 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {taskSummary.outstanding.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                All tasks completed! 🎉
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan for Tomorrow */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Plan for Tomorrow</h2>
          </div>
          <p className="text-sm text-slate-400">Drag to reorder your priorities</p>
        </div>
        
        <div className="space-y-3">
          {taskSummary.tomorrowPlan.map((task, index) => (
            <Card key={task.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-slate-500 cursor-move" />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <p className="text-sm text-slate-400">{task.description}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                  <Badge variant="outline" className={`text-xs border-slate-600 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Export Summary
        </Button>
      </div>
    </div>
  );
}