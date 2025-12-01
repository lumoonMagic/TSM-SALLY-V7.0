import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Download, FileText, BarChart3, Table, MessageSquare, Mail, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { QueryResponse } from '@/lib/aiService';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmailDraftDialog } from './EmailDraftDialog';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: QueryResponse;
}

export function OnDemandQA() {
  const { aiService, currentUser } = useApp();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm Sally, your AI Trial Supply Manager assistant. I can help you with inventory management, shipment tracking, risk assessment, and more. Try asking me something like 'Show me late shipments from Vendor X' or 'Which sites have low stock?'",
      timestamp: new Date(),
      response: {
        type: 'text',
        content: "Hello! I'm Sally, your AI Trial Supply Manager assistant. I can help you with inventory management, shipment tracking, risk assessment, and more.",
        suggestions: [
          "Show me inventory levels by site",
          "Which shipments are delayed?",
          "What are the high priority tasks?",
          "Show me sites with low stock"
        ]
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'warning' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    context: string;
    subject: string;
    body: string;
    recipientType: 'vendor' | 'site' | 'team';
  }>({ open: false, context: '', subject: '', body: '', recipientType: 'vendor' });
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleActionWithConfirmation = (action: string, description: string, callback: () => void, variant: 'default' | 'warning' | 'destructive' = 'default') => {
    setConfirmDialog({
      open: true,
      title: `Confirm ${action}`,
      description,
      action: callback,
      variant
    });
  };

  const handleEmailDraft = (context: string, subject: string, body: string, recipientType: 'vendor' | 'site' | 'team' = 'vendor') => {
    setEmailDialog({
      open: true,
      context,
      subject,
      body,
      recipientType
    });
  };

  const generateContextualEmail = (message: Message, recipientType: 'vendor' | 'site' | 'team') => {
    const response = message.response;
    let emailBody = '';
    let subject = '';
    
    // Extract specific data from the response
    const hasCharts = response?.data?.charts && response.data.charts.length > 0;
    const hasTables = response?.data?.tables && response.data.tables.length > 0;
    
    if (message.content.includes('delayed') || message.content.includes('Delayed Shipments')) {
      if (recipientType === 'vendor') {
        subject = 'URGENT: Delayed Shipments Requiring Immediate Action';
        emailBody = `Dear Vendor Team,\n\nWe have identified significant delays in our shipment schedule that require immediate attention and resolution.\n\n`;
        
        // Add specific delay data
        if (hasCharts) {
          const delayChart = response.data.charts.find(chart => chart.title.includes('Delay'));
          if (delayChart) {
            emailBody += `DELAY ANALYSIS:\n`;
            delayChart.labels.forEach((label: string, idx: number) => {
              emailBody += `• ${label}: ${delayChart.values[idx]} ${delayChart.unit || 'shipments'}\n`;
            });
            emailBody += `\n`;
          }
        }
        
        // Add specific shipment details
        if (hasTables) {
          const shipmentTable = response.data.tables.find(table => table.title.includes('Shipments'));
          if (shipmentTable) {
            emailBody += `AFFECTED SHIPMENTS:\n`;
            shipmentTable.rows.forEach((row: string[]) => {
              emailBody += `• Tracking: ${row[1]} | Destination: ${row[0]} | Days Late: ${row[3]} | Priority: ${row[4]}\n`;
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `REQUIRED ACTIONS:\n• Provide immediate status update for all delayed shipments\n• Submit revised delivery timeline within 24 hours\n• Implement corrective measures to prevent future delays\n• Escalate to senior management if necessary\n\nThis situation is impacting our clinical trial operations and requires your urgent attention.\n\nPlease respond within 4 hours with your action plan.\n\nBest regards,\nTrial Supply Manager`;
      } else if (recipientType === 'site') {
        subject = 'Supply Chain Update: Shipment Delays - Contingency Plan Activated';
        emailBody = `Dear Site Team,\n\nWe want to inform you of current shipment delays that may impact your operations and outline our contingency measures.\n\n`;
        
        if (hasTables) {
          const shipmentTable = response.data.tables.find(table => table.title.includes('Shipments'));
          if (shipmentTable) {
            emailBody += `SHIPMENTS TO YOUR SITE:\n`;
            shipmentTable.rows.forEach((row: string[]) => {
              emailBody += `• Tracking: ${row[1]} | Expected: ${row[2]} | New ETA: ${row[3]} | Priority: ${row[4]}\n`;
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `CONTINGENCY MEASURES:\n• Alternative suppliers have been contacted\n• Expedited shipping arranged for critical items\n• Inventory redistribution from other sites if needed\n\nWe are actively working with vendors to resolve these delays and will keep you updated on progress.\n\nPlease contact us immediately if this impacts patient care or study timelines.\n\nBest regards,\nTrial Supply Manager`;
      }
    } else if (message.content.includes('critical') || message.content.includes('shortage') || message.content.includes('Critical')) {
      if (recipientType === 'vendor') {
        subject = 'CRITICAL: Stock Shortage - Emergency Resupply Required';
        emailBody = `Dear Vendor Team,\n\nWe have identified critical stock shortages that pose immediate risk to our clinical trial operations.\n\n`;
        
        if (hasTables) {
          const stockTable = response.data.tables.find(table => table.title.includes('Stock') || table.title.includes('Critical'));
          if (stockTable) {
            emailBody += `CRITICAL STOCK LEVELS:\n`;
            stockTable.rows.forEach((row: string[]) => {
              emailBody += `• Site: ${row[0]} | Product: ${row[1]} | Current: ${row[2]} | Required: ${row[3]} | Days Until Stockout: ${row[4]}\n`;
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `IMMEDIATE ACTIONS REQUIRED:\n• Emergency manufacturing run for affected products\n• Expedited shipping (air freight) for critical items\n• Provide delivery confirmation within 2 hours\n• Implement quality fast-track if necessary\n\nThis is a CRITICAL situation that could impact patient safety and study integrity.\n\nPlease treat this as highest priority and respond immediately.\n\nBest regards,\nTrial Supply Manager`;
      } else if (recipientType === 'site') {
        subject = 'URGENT: Critical Stock Alert - Immediate Action Required';
        emailBody = `Dear Site Team,\n\nWe have identified critical stock levels at your site that require immediate attention.\n\n`;
        
        if (hasTables) {
          const stockTable = response.data.tables.find(table => table.title.includes('Stock') || table.title.includes('Critical'));
          if (stockTable) {
            emailBody += `YOUR SITE STOCK STATUS:\n`;
            stockTable.rows.forEach((row: string[]) => {
              if (row[0].includes('your site') || stockTable.rows.length <= 3) {
                emailBody += `• Product: ${row[1]} | Current Stock: ${row[2]} | Safety Level: ${row[3]} | Days Until Stockout: ${row[4]}\n`;
              }
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `IMMEDIATE ACTIONS:\n• Implement strict inventory conservation measures\n• Review patient dosing schedules for optimization\n• Prepare for potential temporary enrollment hold\n• Emergency resupply is being expedited\n\nWe are working around the clock to resolve this situation.\n\nPlease confirm receipt and your current exact inventory count.\n\nBest regards,\nTrial Supply Manager`;
      }
    } else if (message.content.includes('port') || message.content.includes('shutdown')) {
      subject = 'Supply Chain Disruption: Port Shutdown Impact & Mitigation Plan';
      emailBody = `Dear Team,\n\nWe are proactively addressing a supply chain disruption due to port operations that may impact our shipments.\n\n`;
      
      if (hasCharts) {
        const costChart = response.data.charts.find(chart => chart.title.includes('Cost'));
        if (costChart) {
          emailBody += `FINANCIAL IMPACT ANALYSIS:\n`;
          costChart.labels.forEach((label: string, idx: number) => {
            emailBody += `• ${label}: $${costChart.values[idx]}${costChart.unit ? ` ${costChart.unit}` : ''}\n`;
          });
          emailBody += `\n`;
        }
      }
      
      emailBody += `MITIGATION STRATEGY:\n• Alternative shipping routes activated\n• Air freight arranged for critical shipments\n• Vendor notifications sent for timeline adjustments\n• Site communications prepared for affected deliveries\n\nWe will monitor the situation closely and provide regular updates.\n\nBest regards,\nTrial Supply Manager`;
    } else if (message.content.includes('inventory') || message.content.includes('stock')) {
      if (recipientType === 'vendor') {
        subject = 'Inventory Replenishment Request - Urgent Action Required';
        emailBody = `Dear Vendor Team,\n\nWe need immediate inventory replenishment based on our current stock analysis.\n\n`;
        
        if (hasTables) {
          const inventoryTable = response.data.tables[0]; // First table usually contains inventory data
          if (inventoryTable) {
            emailBody += `INVENTORY REQUIREMENTS:\n`;
            inventoryTable.rows.forEach((row: string[]) => {
              emailBody += `• Product: ${row[1] || row[0]} | Current Stock: ${row[2] || 'Low'} | Required: Immediate resupply\n`;
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `REQUESTED ACTIONS:\n• Confirm availability for immediate shipment\n• Provide delivery timeline within 24 hours\n• Prioritize critical/urgent items\n• Implement expedited processing if necessary\n\nPlease treat this as high priority to avoid stock-outs.\n\nBest regards,\nTrial Supply Manager`;
      } else if (recipientType === 'site') {
        subject = 'Inventory Status Update - Stock Management Guidelines';
        emailBody = `Dear Site Team,\n\nWe are providing you with current inventory status and management guidelines.\n\n`;
        
        if (hasTables) {
          const inventoryTable = response.data.tables[0];
          if (inventoryTable) {
            emailBody += `YOUR SITE INVENTORY STATUS:\n`;
            inventoryTable.rows.forEach((row: string[]) => {
              emailBody += `• Product: ${row[1] || row[0]} | Status: ${row[4] || row[3] || 'Available'} | Quantity: ${row[2] || 'Check locally'}\n`;
            });
            emailBody += `\n`;
          }
        }
        
        emailBody += `INVENTORY MANAGEMENT GUIDELINES:\n• Monitor stock levels daily\n• Report low stock immediately\n• Follow proper storage protocols\n• Update inventory system regularly\n\nPlease confirm receipt and your current inventory count.\n\nBest regards,\nTrial Supply Manager`;
      }
    }
    
    // Fallback for generic issues
    if (!subject) {
      subject = 'Supply Chain Alert - Action Required';
      emailBody = `Dear Team,\n\nWe have identified supply chain issues that require attention:\n\n${message.content}\n\nPlease review and take appropriate action.\n\nBest regards,\nTrial Supply Manager`;
    }
    
    return { subject, body: emailBody };
  };

  const extractVendorFromResponse = (response: QueryResponse): string => {
    // Try to extract vendor name from tables
    if (response?.data?.tables) {
      for (const table of response.data.tables) {
        if (table.headers.includes('Vendor')) {
          const vendorIndex = table.headers.indexOf('Vendor');
          if (table.rows.length > 0 && table.rows[0][vendorIndex]) {
            return table.rows[0][vendorIndex];
          }
        }
      }
    }
    return 'Vendor Team';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !aiService) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiService.processQuery(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderResponse = (response: QueryResponse) => {
    switch (response.type) {
      case 'chart':
        return (
          <Card className="mt-2 bg-slate-800/50 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-slate-300">Chart Data</span>
              </div>
              {response.data && (
                <div className="space-y-1.5">
                  {response.data.labels?.map((label: string, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{label}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-1.5 bg-green-500 rounded"
                          style={{ width: `${(response.data.values[index] / Math.max(...response.data.values)) * 80}px` }}
                        />
                        <span className="text-xs font-medium text-white">{response.data.values[index]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card className="mt-2 bg-slate-800/50 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Table className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-slate-300">Data Table</span>
              </div>
              {response.data && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-600">
                        {response.data.headers?.map((header: string, index: number) => (
                          <th key={index} className="text-left py-1.5 px-2 text-slate-300 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.rows?.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b border-slate-700/50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="py-1.5 px-2 text-slate-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'summary':
        return (
          <div className="mt-2 space-y-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-slate-300">Executive Summary</span>
                </div>
                <div className="text-slate-200 whitespace-pre-line text-sm">
                  {response.content}
                </div>
              </CardContent>
            </Card>
            
            {/* Render Charts */}
            {response.data?.charts?.map((chart: any, index: number) => (
              <Card key={`chart-${index}`} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-slate-300">{chart.title}</span>
                  </div>
                  <div className="space-y-1.5">
                    {chart.labels?.map((label: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{label}</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-1.5 bg-green-500 rounded"
                            style={{ width: `${(chart.values[idx] / Math.max(...chart.values)) * 80}px` }}
                          />
                          <span className="text-xs font-medium text-white">
                            {chart.values[idx]}{chart.unit ? ` ${chart.unit}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Render Tables */}
            {response.data?.tables?.map((table: any, index: number) => (
              <Card key={`table-${index}`} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Table className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-slate-300">{table.title}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-600">
                          {table.headers?.map((header: string, idx: number) => (
                            <th key={idx} className="text-left py-1.5 px-2 text-slate-300 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows?.map((row: string[], rowIdx: number) => (
                          <tr key={rowIdx} className="border-b border-slate-700/50">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="py-1.5 px-2 text-slate-200">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">On-Demand Q&A</h1>
        </div>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground">
          <Download className="h-4 w-4 mr-2" />
          Export Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  SA
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`max-w-4xl ${message.type === 'user' ? 'order-first' : ''}`}>
              <div className="text-xs text-muted-foreground mb-1">
                {message.type === 'assistant' ? 'Assistant' : currentUser.name}
              </div>
              
              <div
                className={`rounded-lg p-3 text-sm leading-relaxed ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-card text-card-foreground'
                }`}
              >
                {message.content}
              </div>

              {message.response && renderResponse(message.response)}

              {message.response?.suggestions && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {message.response.suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition-colors text-xs px-2 py-1"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Email Draft Actions for Actionable Insights */}
                  {(message.content.includes('delayed') || message.content.includes('critical') || message.content.includes('shortage') || message.content.includes('risk') || message.content.includes('inventory') || message.content.includes('stock') || message.content.includes('Analysis') || message.response?.type === 'summary') && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        onClick={() => {
                          const emailData = generateContextualEmail(message, 'vendor');
                          handleEmailDraft(
                            'Vendor Communication',
                            emailData.subject,
                            emailData.body,
                            'vendor'
                          );
                        }}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Draft Vendor Email
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                        onClick={() => {
                          const emailData = generateContextualEmail(message, 'site');
                          handleEmailDraft(
                            'Site Notification',
                            emailData.subject,
                            emailData.body,
                            'site'
                          );
                        }}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Notify Sites
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {message.type === 'user' && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="bg-slate-600 text-white text-sm">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600">
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm">
                SA
              </AvatarFallback>
            </Avatar>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about inventory, shipments, risks, or anything else..."
            className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }}
      />

      {/* Email Draft Dialog */}
      <EmailDraftDialog
        open={emailDialog.open}
        onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}
        context={emailDialog.context}
        suggestedSubject={emailDialog.subject}
        suggestedBody={emailDialog.body}
        recipientType={emailDialog.recipientType}
      />
    </div>
  );
}