import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema interfaces
export interface Site {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  investigator: string;
  enrollment_target: number;
  current_enrollment: number;
  last_shipment: string;
}

export interface Inventory {
  id: string;
  site_id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  status: 'available' | 'reserved' | 'expired' | 'quarantine';
  temperature_range: string;
  last_updated: string;
}

export interface Shipment {
  id: string;
  site_id: string;
  tracking_number: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'returned';
  shipped_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  contents: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vendor: string;
}

export interface Study {
  id: string;
  name: string;
  phase: 'I' | 'II' | 'III' | 'IV';
  status: 'planning' | 'active' | 'completed' | 'paused';
  start_date: string;
  expected_end_date: string;
  sites_count: number;
  enrollment_status: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'logistics' | 'packaging';
  status: 'active' | 'inactive' | 'under_review';
  contact_person: string;
  email: string;
  phone: string;
  performance_rating: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigned_to: string;
  due_date: string;
  created_date: string;
  category: 'inventory' | 'shipment' | 'regulatory' | 'communication' | 'planning';
}

interface TSMDatabase extends DBSchema {
  sites: {
    key: string;
    value: Site;
  };
  inventory: {
    key: string;
    value: Inventory;
  };
  shipments: {
    key: string;
    value: Shipment;
  };
  studies: {
    key: string;
    value: Study;
  };
  vendors: {
    key: string;
    value: Vendor;
  };
  tasks: {
    key: string;
    value: Task;
  };
}

let db: IDBPDatabase<TSMDatabase>;

export async function initDatabase() {
  db = await openDB<TSMDatabase>('tsm-database', 1, {
    upgrade(db) {
      // Create object stores
      db.createObjectStore('sites', { keyPath: 'id' });
      db.createObjectStore('inventory', { keyPath: 'id' });
      db.createObjectStore('shipments', { keyPath: 'id' });
      db.createObjectStore('studies', { keyPath: 'id' });
      db.createObjectStore('vendors', { keyPath: 'id' });
      db.createObjectStore('tasks', { keyPath: 'id' });
    },
  });

  // Initialize with sample data
  await initializeSampleData();
  return db;
}

async function initializeSampleData() {
  // Check if data already exists
  const existingSites = await db.count('sites');
  if (existingSites > 0) return;

  // Sample Sites
  const sites: Site[] = [
    {
      id: 'site-001',
      name: 'Johns Hopkins Medical Center',
      location: 'Baltimore, MD, USA',
      status: 'active',
      investigator: 'Dr. Sarah Johnson',
      enrollment_target: 50,
      current_enrollment: 42,
      last_shipment: '2024-11-20'
    },
    {
      id: 'site-002',
      name: 'Mayo Clinic',
      location: 'Rochester, MN, USA',
      status: 'active',
      investigator: 'Dr. Michael Chen',
      enrollment_target: 75,
      current_enrollment: 68,
      last_shipment: '2024-11-18'
    },
    {
      id: 'site-003',
      name: 'London Clinical Research',
      location: 'London, UK',
      status: 'active',
      investigator: 'Dr. Emma Thompson',
      enrollment_target: 60,
      current_enrollment: 35,
      last_shipment: '2024-11-15'
    },
    {
      id: 'site-004',
      name: 'Sydney Medical Research',
      location: 'Sydney, Australia',
      status: 'pending',
      investigator: 'Dr. James Wilson',
      enrollment_target: 40,
      current_enrollment: 8,
      last_shipment: '2024-11-10'
    }
  ];

  // Sample Inventory
  const inventory: Inventory[] = [
    {
      id: 'inv-001',
      site_id: 'site-001',
      product_name: 'Study Drug A',
      batch_number: 'SDA-2024-001',
      quantity: 24,
      expiry_date: '2025-06-15',
      status: 'available',
      temperature_range: '2-8°C',
      last_updated: '2024-11-20'
    },
    {
      id: 'inv-002',
      site_id: 'site-001',
      product_name: 'Placebo A',
      batch_number: 'PLA-2024-001',
      quantity: 18,
      expiry_date: '2025-08-20',
      status: 'available',
      temperature_range: '15-25°C',
      last_updated: '2024-11-20'
    },
    {
      id: 'inv-003',
      site_id: 'site-002',
      product_name: 'Study Drug A',
      batch_number: 'SDA-2024-002',
      quantity: 5,
      expiry_date: '2025-03-10',
      status: 'available',
      temperature_range: '2-8°C',
      last_updated: '2024-11-18'
    },
    {
      id: 'inv-004',
      site_id: 'site-003',
      product_name: 'Study Drug B',
      batch_number: 'SDB-2024-001',
      quantity: 2,
      expiry_date: '2024-12-30',
      status: 'expired',
      temperature_range: '2-8°C',
      last_updated: '2024-11-15'
    },
    {
      id: 'inv-005',
      site_id: 'site-001',
      product_name: 'Paracetamol 500mg',
      batch_number: 'PAR-2024-001',
      quantity: 8,
      expiry_date: '2025-04-15',
      status: 'available',
      temperature_range: '15-25°C',
      last_updated: '2024-11-22'
    },
    {
      id: 'inv-006',
      site_id: 'site-002',
      product_name: 'Paracetamol 500mg',
      batch_number: 'PAR-2024-002',
      quantity: 3,
      expiry_date: '2024-12-25',
      status: 'available',
      temperature_range: '15-25°C',
      last_updated: '2024-11-20'
    }
  ];

  // Sample Shipments
  const shipments: Shipment[] = [
    {
      id: 'ship-001',
      site_id: 'site-001',
      tracking_number: 'TRK-001-2024',
      status: 'delivered',
      shipped_date: '2024-11-18',
      expected_delivery: '2024-11-20',
      actual_delivery: '2024-11-20',
      contents: 'Study Drug A (24 units), Placebo A (12 units)',
      priority: 'high',
      vendor: 'MedLogistics Inc'
    },
    {
      id: 'ship-002',
      site_id: 'site-002',
      tracking_number: 'TRK-002-2024',
      status: 'delayed',
      shipped_date: '2024-11-15',
      expected_delivery: '2024-11-18',
      contents: 'Study Drug A (30 units)',
      priority: 'urgent',
      vendor: 'Global Pharma Logistics'
    },
    {
      id: 'ship-003',
      site_id: 'site-003',
      tracking_number: 'TRK-003-2024',
      status: 'in_transit',
      shipped_date: '2024-11-22',
      expected_delivery: '2024-11-25',
      contents: 'Study Drug B (20 units), Emergency Kit',
      priority: 'urgent',
      vendor: 'Express Medical Supply'
    }
  ];

  // Sample Studies
  const studies: Study[] = [
    {
      id: 'study-001',
      name: 'CARDIO-PROTECT Phase III',
      phase: 'III',
      status: 'active',
      start_date: '2024-01-15',
      expected_end_date: '2025-12-31',
      sites_count: 25,
      enrollment_status: '68% enrolled (340/500 patients)'
    },
    {
      id: 'study-002',
      name: 'NEURO-ADVANCE Phase II',
      phase: 'II',
      status: 'active',
      start_date: '2024-06-01',
      expected_end_date: '2025-08-30',
      sites_count: 12,
      enrollment_status: '45% enrolled (90/200 patients)'
    }
  ];

  // Sample Vendors
  const vendors: Vendor[] = [
    {
      id: 'vendor-001',
      name: 'MedLogistics Inc',
      type: 'logistics',
      status: 'active',
      contact_person: 'John Smith',
      email: 'john.smith@medlogistics.com',
      phone: '+1-555-0123',
      performance_rating: 4.8
    },
    {
      id: 'vendor-002',
      name: 'Global Pharma Logistics',
      type: 'logistics',
      status: 'under_review',
      contact_person: 'Maria Garcia',
      email: 'maria.garcia@gpl.com',
      phone: '+1-555-0456',
      performance_rating: 3.2
    },
    {
      id: 'vendor-003',
      name: 'BioManufacturing Corp',
      type: 'manufacturer',
      status: 'active',
      contact_person: 'Dr. Robert Lee',
      email: 'robert.lee@biomanuf.com',
      phone: '+1-555-0789',
      performance_rating: 4.9
    }
  ];

  // Sample Tasks - Enhanced with screenshot scenarios
  const tasks: Task[] = [
    {
      id: 'task-001',
      title: 'Review Overdue Goods Receipts',
      description: '3 receipts are 5+ days overdue and need immediate attention',
      priority: 'urgent',
      status: 'pending',
      assigned_to: 'Logistics Coordinator',
      due_date: '2024-11-20',
      created_date: '2024-11-15',
      category: 'inventory'
    },
    {
      id: 'task-002',
      title: 'Approve Expedited Shipment #12345',
      description: 'Awaiting manager approval for urgent shipment to London Clinical Research',
      priority: 'high',
      status: 'pending',
      assigned_to: 'Operations Manager',
      due_date: '2024-11-25',
      created_date: '2024-11-23',
      category: 'shipment'
    },
    {
      id: 'task-003',
      title: 'Check Low Stock Alert',
      description: 'Paracetamol 500mg is below threshold - immediate reorder required',
      priority: 'medium',
      status: 'completed',
      assigned_to: 'Supply Manager',
      due_date: '2024-11-25',
      created_date: '2024-11-22',
      category: 'inventory'
    },
    {
      id: 'task-004',
      title: 'Review Q4 shipment manifests',
      description: 'Review and approve all Q4 shipment manifests for regulatory compliance',
      priority: 'high',
      status: 'in_progress',
      assigned_to: 'TSM Team',
      due_date: '2024-11-26',
      created_date: '2024-11-20',
      category: 'regulatory'
    },
    {
      id: 'task-005',
      title: 'Process Drugs Nearing Expiry',
      description: '24 SKUs expire within the next 30 days - review disposal procedures',
      priority: 'high',
      status: 'pending',
      assigned_to: 'Quality Manager',
      due_date: '2024-11-27',
      created_date: '2024-11-24',
      category: 'regulatory'
    },
    {
      id: 'task-006',
      title: 'Monitor Due Shipments Today',
      description: '42 deliveries scheduled for today - track delivery confirmations',
      priority: 'medium',
      status: 'in_progress',
      assigned_to: 'Logistics Team',
      due_date: '2024-11-25',
      created_date: '2024-11-25',
      category: 'shipment'
    }
  ];

  // Insert sample data
  const tx = db.transaction(['sites', 'inventory', 'shipments', 'studies', 'vendors', 'tasks'], 'readwrite');
  
  await Promise.all([
    ...sites.map(site => tx.objectStore('sites').add(site)),
    ...inventory.map(inv => tx.objectStore('inventory').add(inv)),
    ...shipments.map(ship => tx.objectStore('shipments').add(ship)),
    ...studies.map(study => tx.objectStore('studies').add(study)),
    ...vendors.map(vendor => tx.objectStore('vendors').add(vendor)),
    ...tasks.map(task => tx.objectStore('tasks').add(task))
  ]);

  await tx.done;
}

// Database query functions
export async function getAllSites(): Promise<Site[]> {
  return await db.getAll('sites');
}

export async function getAllInventory(): Promise<Inventory[]> {
  return await db.getAll('inventory');
}

export async function getAllShipments(): Promise<Shipment[]> {
  return await db.getAll('shipments');
}

export async function getAllStudies(): Promise<Study[]> {
  return await db.getAll('studies');
}

export async function getAllVendors(): Promise<Vendor[]> {
  return await db.getAll('vendors');
}

export async function getAllTasks(): Promise<Task[]> {
  return await db.getAll('tasks');
}

export async function getInventoryBySite(siteId: string): Promise<Inventory[]> {
  const allInventory = await getAllInventory();
  return allInventory.filter(inv => inv.site_id === siteId);
}

export async function getShipmentsBySite(siteId: string): Promise<Shipment[]> {
  const allShipments = await getAllShipments();
  return allShipments.filter(ship => ship.site_id === siteId);
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const task = await db.get('tasks', taskId);
  if (task) {
    await db.put('tasks', { ...task, ...updates });
  }
}

export { db };