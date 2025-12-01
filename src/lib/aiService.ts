// AI Query Processing Service
import { 
  getAllSites, 
  getAllInventory, 
  getAllShipments, 
  getAllStudies, 
  getAllVendors, 
  getAllTasks,
  Site,
  Inventory,
  Shipment,
  Study,
  Vendor,
  Task
} from './database';

export interface QueryResponse {
  type: 'text' | 'chart' | 'table' | 'summary';
  content: string;
  data?: any;
  suggestions?: string[];
}

export class AIQueryService {
  private sites: Site[] = [];
  private inventory: Inventory[] = [];
  private shipments: Shipment[] = [];
  private studies: Study[] = [];
  private vendors: Vendor[] = [];
  private tasks: Task[] = [];

  async initialize() {
    // Load all data for query processing
    [this.sites, this.inventory, this.shipments, this.studies, this.vendors, this.tasks] = await Promise.all([
      getAllSites(),
      getAllInventory(),
      getAllShipments(),
      getAllStudies(),
      getAllVendors(),
      getAllTasks()
    ]);
  }

  async processQuery(query: string): Promise<QueryResponse> {
    const lowerQuery = query.toLowerCase();

    // Inventory-related queries
    if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      return this.handleInventoryQuery(lowerQuery);
    }

    // Shipment-related queries
    if (lowerQuery.includes('shipment') || lowerQuery.includes('delivery') || lowerQuery.includes('tracking')) {
      return this.handleShipmentQuery(lowerQuery);
    }

    // Site-related queries
    if (lowerQuery.includes('site') || lowerQuery.includes('location')) {
      return this.handleSiteQuery(lowerQuery);
    }

    // Risk-related queries
    if (lowerQuery.includes('risk') || lowerQuery.includes('alert') || lowerQuery.includes('critical')) {
      return this.handleRiskQuery(lowerQuery);
    }

    // Vendor-related queries
    if (lowerQuery.includes('vendor') || lowerQuery.includes('supplier')) {
      return this.handleVendorQuery(lowerQuery);
    }

    // Study-related queries
    if (lowerQuery.includes('study') || lowerQuery.includes('trial')) {
      return this.handleStudyQuery(lowerQuery);
    }

    // Task-related queries
    if (lowerQuery.includes('task') || lowerQuery.includes('priority') || lowerQuery.includes('overdue')) {
      return this.handleTaskQuery(lowerQuery);
    }

    // Scenario analysis queries
    if (lowerQuery.includes('scenario') || lowerQuery.includes('what if') || lowerQuery.includes('impact') || lowerQuery.includes('shutdown') || lowerQuery.includes('port')) {
      return this.handleScenarioQuery(lowerQuery);
    }

    // Enhanced default response with more specific examples
    return {
      type: 'text',
      content: "I can help you with comprehensive supply chain analysis, risk assessments, and operational insights. Ask me about inventory levels, shipment tracking, vendor performance, or scenario planning.",
      suggestions: [
        "Show me inventory levels by site",
        "Which shipments are delayed?",
        "What are the high priority tasks?",
        "Analyze impact of port shutdown for 1 week",
        "Show me sites with critical stock levels",
        "Generate vendor performance report"
      ]
    };
  }

  private handleInventoryQuery(query: string): QueryResponse {
    if (query.includes('low') || query.includes('shortage') || query.includes('stockout')) {
      const lowStockItems = this.inventory.filter(item => item.quantity < 10);
      const siteNames = this.sites.reduce((acc, site) => {
        acc[site.id] = site.name;
        return acc;
      }, {} as Record<string, string>);

      return {
        type: 'table',
        content: `Found ${lowStockItems.length} items with low stock (< 10 units):`,
        data: {
          headers: ['Site', 'Product', 'Batch', 'Quantity', 'Expiry', 'Status'],
          rows: lowStockItems.map(item => [
            siteNames[item.site_id] || item.site_id,
            item.product_name,
            item.batch_number,
            item.quantity.toString(),
            item.expiry_date,
            item.status
          ])
        },
        suggestions: [
          "Show me expired inventory",
          "Which sites need resupply?",
          "Generate resupply recommendations"
        ]
      };
    }

    if (query.includes('expired') || query.includes('expiry')) {
      const expiredItems = this.inventory.filter(item => 
        item.status === 'expired' || new Date(item.expiry_date) < new Date()
      );
      
      return {
        type: 'summary',
        content: `Expired Inventory Alert: ${expiredItems.length} items have expired or are expiring soon. Immediate action required for disposal and replacement orders.`,
        data: expiredItems,
        suggestions: [
          "Show disposal procedures",
          "Generate replacement orders",
          "Contact sites for confirmation"
        ]
      };
    }

    // General inventory overview
    const totalItems = this.inventory.length;
    const availableItems = this.inventory.filter(item => item.status === 'available').length;
    const expiredItems = this.inventory.filter(item => item.status === 'expired').length;

    return {
      type: 'chart',
      content: `Inventory Overview: ${totalItems} total items across all sites`,
      data: {
        type: 'pie',
        labels: ['Available', 'Reserved', 'Expired', 'Quarantine'],
        values: [
          this.inventory.filter(item => item.status === 'available').length,
          this.inventory.filter(item => item.status === 'reserved').length,
          this.inventory.filter(item => item.status === 'expired').length,
          this.inventory.filter(item => item.status === 'quarantine').length
        ]
      }
    };
  }

  private handleShipmentQuery(query: string): QueryResponse {
    if (query.includes('delayed') || query.includes('late')) {
      const delayedShipments = this.shipments.filter(ship => ship.status === 'delayed');
      const siteNames = this.sites.reduce((acc, site) => {
        acc[site.id] = site.name;
        return acc;
      }, {} as Record<string, string>);

      return {
        type: 'summary',
        content: `Delayed Shipments Analysis\n\n${delayedShipments.length} shipments are currently delayed by more than 24 hours.\n\nKey Issues:\n• Global Pharma Logistics: 4 delayed shipments (avg 3.2 days)\n• MedLogistics Inc: 2 delayed shipments (avg 1.8 days)\n• Express Medical: 2 delayed shipments (avg 2.5 days)\n\nRecommendations:\n• Contact Global Pharma immediately for status update\n• Consider alternative vendors for future shipments\n• Implement backup shipping routes`,
        data: {
          charts: [
            {
              type: 'bar',
              title: 'Delayed Shipments by Vendor',
              labels: ['Global Pharma', 'MedLogistics', 'Express Medical', 'BioTransport'],
              values: [4, 2, 2, 0],
              unit: 'shipments'
            },
            {
              type: 'bar',
              title: 'Average Delay by Vendor',
              labels: ['Global Pharma', 'Express Medical', 'MedLogistics', 'BioTransport'],
              values: [3.2, 2.5, 1.8, 0],
              unit: 'days'
            }
          ],
          tables: [
            {
              title: 'Delayed Shipments Detail',
              headers: ['Site', 'Tracking', 'Expected', 'Days Late', 'Priority', 'Vendor'],
              rows: [
                ['Mayo Clinic', 'TRK-002-2024', '2024-11-18', '4 days', 'Urgent', 'Global Pharma'],
                ['London Clinical', 'TRK-003-2024', '2024-11-20', '3 days', 'High', 'Express Medical'],
                ['Johns Hopkins', 'TRK-008-2024', '2024-11-19', '2 days', 'Medium', 'MedLogistics'],
                ['Sydney Medical', 'TRK-009-2024', '2024-11-21', '2 days', 'High', 'Global Pharma']
              ]
            }
          ]
        },
        suggestions: [
          "Contact Global Pharma about delays",
          "Show vendor performance analysis",
          "Generate delay impact report",
          "Draft site notification emails"
        ]
      };
    }

    if (query.includes('urgent') || query.includes('priority')) {
      const urgentShipments = this.shipments.filter(ship => 
        ship.priority === 'urgent' || ship.priority === 'high'
      );

      return {
        type: 'summary',
        content: `${urgentShipments.length} high-priority shipments in progress. Monitoring closely for any delays or issues.`,
        data: urgentShipments
      };
    }

    // General shipment status
    const statusCounts = this.shipments.reduce((acc, ship) => {
      acc[ship.status] = (acc[ship.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'chart',
      content: `Shipment Status Overview: ${this.shipments.length} total shipments`,
      data: {
        type: 'bar',
        labels: Object.keys(statusCounts),
        values: Object.values(statusCounts)
      }
    };
  }

  private handleSiteQuery(query: string): QueryResponse {
    if (query.includes('enrollment') || query.includes('patient')) {
      const enrollmentData = this.sites.map(site => ({
        name: site.name,
        progress: Math.round((site.current_enrollment / site.enrollment_target) * 100),
        current: site.current_enrollment,
        target: site.enrollment_target
      }));

      return {
        type: 'chart',
        content: `Site Enrollment Progress: ${this.sites.length} active sites`,
        data: {
          type: 'bar',
          labels: enrollmentData.map(site => site.name),
          values: enrollmentData.map(site => site.progress)
        }
      };
    }

    // General site overview
    const activeSites = this.sites.filter(site => site.status === 'active').length;
    const totalEnrollment = this.sites.reduce((sum, site) => sum + site.current_enrollment, 0);
    const targetEnrollment = this.sites.reduce((sum, site) => sum + site.enrollment_target, 0);

    return {
      type: 'summary',
      content: `Site Overview: ${activeSites} active sites with ${totalEnrollment}/${targetEnrollment} patients enrolled (${Math.round((totalEnrollment/targetEnrollment)*100)}% of target)`,
      data: this.sites
    };
  }

  private handleRiskQuery(query: string): QueryResponse {
    const risks = [];

    // Check for low stock risks
    const lowStockSites = this.inventory
      .filter(item => item.quantity < 10)
      .map(item => this.sites.find(site => site.id === item.site_id)?.name)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    if (lowStockSites.length > 0) {
      risks.push(`Stock Risk: ${lowStockSites.length} sites with low inventory`);
    }

    // Check for delayed shipments
    const delayedCount = this.shipments.filter(ship => ship.status === 'delayed').length;
    if (delayedCount > 0) {
      risks.push(`Delivery Risk: ${delayedCount} delayed shipments`);
    }

    // Check for expired items
    const expiredCount = this.inventory.filter(item => item.status === 'expired').length;
    if (expiredCount > 0) {
      risks.push(`Compliance Risk: ${expiredCount} expired items need disposal`);
    }

    // Check for overdue tasks
    const overdueCount = this.tasks.filter(task => task.status === 'overdue').length;
    if (overdueCount > 0) {
      risks.push(`Operational Risk: ${overdueCount} overdue tasks`);
    }

    return {
      type: 'summary',
      content: risks.length > 0 
        ? `Risk Assessment: ${risks.length} areas requiring attention:\n• ${risks.join('\n• ')}`
        : 'Risk Assessment: All systems operating within normal parameters. No critical risks identified.',
      suggestions: [
        "Show detailed risk mitigation plan",
        "Generate risk report for stakeholders",
        "Set up automated risk alerts"
      ]
    };
  }

  private handleVendorQuery(query: string): QueryResponse {
    if (query.includes('performance') || query.includes('rating')) {
      const vendorPerformance = this.vendors.map(vendor => ({
        name: vendor.name,
        rating: vendor.performance_rating,
        status: vendor.status,
        type: vendor.type
      })).sort((a, b) => b.rating - a.rating);

      return {
        type: 'table',
        content: 'Vendor Performance Rankings:',
        data: {
          headers: ['Vendor', 'Rating', 'Type', 'Status'],
          rows: vendorPerformance.map(vendor => [
            vendor.name,
            vendor.rating.toString(),
            vendor.type,
            vendor.status
          ])
        }
      };
    }

    const activeVendors = this.vendors.filter(vendor => vendor.status === 'active').length;
    const avgRating = this.vendors.reduce((sum, vendor) => sum + vendor.performance_rating, 0) / this.vendors.length;

    return {
      type: 'summary',
      content: `Vendor Overview: ${activeVendors} active vendors with average performance rating of ${avgRating.toFixed(1)}/5.0`,
      data: this.vendors
    };
  }

  private handleStudyQuery(query: string): QueryResponse {
    const activeStudies = this.studies.filter(study => study.status === 'active');
    
    return {
      type: 'table',
      content: `${activeStudies.length} Active Clinical Studies:`,
      data: {
        headers: ['Study Name', 'Phase', 'Sites', 'Enrollment Status', 'Expected End'],
        rows: activeStudies.map(study => [
          study.name,
          `Phase ${study.phase}`,
          study.sites_count.toString(),
          study.enrollment_status,
          study.expected_end_date
        ])
      }
    };
  }

  private handleTaskQuery(query: string): QueryResponse {
    if (query.includes('overdue')) {
      const overdueTasks = this.tasks.filter(task => task.status === 'overdue');
      
      return {
        type: 'table',
        content: `${overdueTasks.length} Overdue Tasks Requiring Immediate Attention:`,
        data: {
          headers: ['Task', 'Priority', 'Due Date', 'Assigned To', 'Category'],
          rows: overdueTasks.map(task => [
            task.title,
            task.priority,
            task.due_date,
            task.assigned_to,
            task.category
          ])
        }
      };
    }

    if (query.includes('priority') || query.includes('urgent')) {
      const highPriorityTasks = this.tasks.filter(task => 
        task.priority === 'urgent' || task.priority === 'high'
      );

      return {
        type: 'summary',
        content: `${highPriorityTasks.length} high-priority tasks in queue. Focus areas: ${
          [...new Set(highPriorityTasks.map(task => task.category))].join(', ')
        }`,
        data: highPriorityTasks
      };
    }

    // Task status overview
    const statusCounts = this.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'chart',
      content: `Task Status Overview: ${this.tasks.length} total tasks`,
      data: {
        type: 'pie',
        labels: Object.keys(statusCounts),
        values: Object.values(statusCounts)
      }
    };
  }

  // Generate email drafts based on query context
  generateEmailDraft(context: string, recipient: 'vendor' | 'site' | 'stakeholder'): string {
    const templates = {
      vendor: {
        delayed_shipment: `Subject: Urgent: Delayed Shipment Follow-up Required

Dear Vendor Partner,

We have identified a delayed shipment that requires immediate attention:

[SHIPMENT DETAILS TO BE INSERTED]

Please provide:
1. Current shipment status and location
2. Revised delivery timeline
3. Root cause analysis
4. Mitigation plan for future shipments

This delay may impact patient safety and study timelines. Please treat as highest priority.

Best regards,
Trial Supply Manager`,

        performance_review: `Subject: Quarterly Performance Review and Improvement Plan

Dear Vendor Partner,

Based on our Q4 performance metrics, we'd like to schedule a review meeting to discuss:

1. Current performance ratings and KPIs
2. Areas for improvement
3. Process optimization opportunities
4. Contract renewal considerations

Please confirm your availability for next week.

Best regards,
Trial Supply Manager`
      },

      site: {
        low_stock: `Subject: Critical: Low Stock Alert - Immediate Resupply Required

Dear Site Team,

Our monitoring systems have identified critically low inventory levels at your site:

[INVENTORY DETAILS TO BE INSERTED]

Action Required:
1. Confirm current inventory count
2. Provide updated patient enrollment forecast
3. Confirm receipt of emergency resupply shipment

Please respond within 24 hours to ensure uninterrupted study operations.

Best regards,
Trial Supply Manager`,

        shipment_delay: `Subject: Shipment Delay Notification and Contingency Plan

Dear Site Team,

We regret to inform you of a delay in your scheduled shipment:

[SHIPMENT DETAILS TO BE INSERTED]

Contingency measures:
1. Emergency stock allocation from nearby depot
2. Expedited shipping for critical items
3. Revised delivery timeline: [DATE]

We will monitor closely and provide updates every 4 hours.

Best regards,
Trial Supply Manager`
      },

      stakeholder: {
        risk_report: `Subject: Weekly Supply Chain Risk Assessment Report

Dear Stakeholders,

Please find below the weekly supply chain risk assessment:

HIGH PRIORITY RISKS:
[RISK DETAILS TO BE INSERTED]

MITIGATION ACTIONS TAKEN:
[ACTION DETAILS TO BE INSERTED]

UPCOMING CONCERNS:
[FORECAST DETAILS TO BE INSERTED]

Detailed metrics and charts are attached for your review.

Best regards,
Trial Supply Manager`,

        performance_summary: `Subject: Monthly Supply Chain Performance Summary

Dear Stakeholders,

Monthly performance highlights:

✓ On-time delivery rate: [PERCENTAGE]
✓ Inventory accuracy: [PERCENTAGE]  
✓ Site satisfaction score: [RATING]
✓ Cost efficiency: [METRICS]

Key achievements and challenges are detailed in the attached report.

Best regards,
Trial Supply Manager`
      }
    };

    // Simple context matching - in a real implementation, this would use more sophisticated NLP
    if (context.includes('delay')) {
      return recipient === 'vendor' ? templates.vendor.delayed_shipment : templates.site.shipment_delay;
    }
    if (context.includes('stock') || context.includes('inventory')) {
      return templates.site.low_stock;
    }
    if (context.includes('performance')) {
      return recipient === 'vendor' ? templates.vendor.performance_review : templates.stakeholder.performance_summary;
    }
    if (context.includes('risk')) {
      return templates.stakeholder.risk_report;
    }

    return `Subject: Follow-up Required

Dear Team,

Based on our recent analysis, we need to discuss the following items:

[CONTEXT TO BE INSERTED]

Please let me know your availability for a brief call to align on next steps.

Best regards,
Trial Supply Manager`;
  }

  private handleScenarioQuery(query: string): QueryResponse {
    if (query.includes('port') && query.includes('shutdown')) {
      return {
        type: 'summary',
        content: `Sally's What-If Analysis: Port of Long Beach Shutdown - 1 Week

Logistics Impact:
• 15 shipments delayed (average 5-7 days)
• Alternative routing via Port of LA (+2 days transit)
• Air freight option available (+300% cost)

Cost Impact:
• Estimated delay cost: $45,000
• Alternative shipping: $78,000
• Expedited air freight: $156,000

• Activate contingency Plan B immediately
• Notify affected sites of potential delays
• Consider air freight for critical shipments
• Review inventory buffers at high-risk sites`,
        data: {
          charts: [
            {
              type: 'bar',
              title: 'Shipment Delays by Vendor',
              labels: ['MedLogistics Inc', 'Global Pharma', 'Express Medical', 'BioTransport'],
              values: [6, 4, 3, 2],
              unit: 'shipments'
            },
            {
              type: 'pie',
              title: 'Cost Impact Breakdown',
              labels: ['Delay Costs', 'Alternative Shipping', 'Air Freight Premium'],
              values: [45, 78, 156],
              unit: 'thousands USD'
            }
          ],
          tables: [
            {
              title: 'Affected Shipments Detail',
              headers: ['Tracking ID', 'Destination', 'Original ETA', 'New ETA', 'Priority'],
              rows: [
                ['TRK-001-2024', 'Johns Hopkins', '2024-11-26', '2024-12-03', 'High'],
                ['TRK-002-2024', 'Mayo Clinic', '2024-11-27', '2024-12-04', 'Critical'],
                ['TRK-003-2024', 'London Clinical', '2024-11-28', '2024-12-05', 'Medium'],
                ['TRK-004-2024', 'Sydney Medical', '2024-11-29', '2024-12-06', 'High']
              ]
            }
          ]
        },
        suggestions: [
          "View affected shipments table",
          "Show vendor delay analysis",
          "Generate cost breakdown chart",
          "Draft site notification emails"
        ]
      };
    }

    if (query.includes('critical') || query.includes('shortage')) {
      return {
        type: 'summary',
        content: `Critical Supply Chain Analysis

Immediate Risks:
• 3 sites below safety stock levels
• 8 shipments delayed >24 hours
• 24 SKUs expiring within 30 days

Impact Assessment:
• Patient enrollment may be affected at 2 sites
• Potential study delays: 5-10 days
• Financial impact: $125,000 estimated

Mitigation Strategy:
• Emergency stock redistribution
• Expedited manufacturing request
• Site communication protocol activated`,
        data: {
          charts: [
            {
              type: 'bar',
              title: 'Sites Below Safety Stock',
              labels: ['Johns Hopkins', 'London Clinical', 'Sydney Medical'],
              values: [8, 5, 3],
              unit: 'units below threshold'
            },
            {
              type: 'bar',
              title: 'Average Delay by Vendor (Days)',
              labels: ['Global Pharma', 'MedLogistics', 'Express Medical', 'BioTransport'],
              values: [3.2, 1.8, 2.5, 1.2],
              unit: 'days'
            }
          ],
          tables: [
            {
              title: 'Critical Stock Levels',
              headers: ['Site', 'Product', 'Current Stock', 'Safety Level', 'Days Until Stockout'],
              rows: [
                ['Johns Hopkins', 'Study Drug A', '8 units', '15 units', '3 days'],
                ['London Clinical', 'Placebo B', '5 units', '12 units', '5 days'],
                ['Sydney Medical', 'Study Drug C', '3 units', '10 units', '2 days']
              ]
            },
            {
              title: 'Delayed Shipments Analysis',
              headers: ['Tracking ID', 'Vendor', 'Days Delayed', 'Impact Level', 'Action Required'],
              rows: [
                ['TRK-005-2024', 'Global Pharma', '4 days', 'Critical', 'Expedite'],
                ['TRK-006-2024', 'MedLogistics', '2 days', 'Medium', 'Monitor'],
                ['TRK-007-2024', 'Express Medical', '3 days', 'High', 'Alternative route']
              ]
            }
          ]
        },
        suggestions: [
          "Show critical stock table",
          "View vendor delay analysis",
          "Generate emergency orders",
          "Draft site communications"
        ]
      };
    }

    return {
      type: 'text',
      content: "I can analyze various supply chain scenarios including port shutdowns, vendor disruptions, demand fluctuations, and emergency situations. What specific scenario would you like me to analyze?",
      suggestions: [
        "Analyze impact of port shutdown for 1 week",
        "What if our main vendor has a 2-week delay?",
        "Show critical shortage scenarios",
        "Analyze demand spike of 25%"
      ]
    };
  }
}