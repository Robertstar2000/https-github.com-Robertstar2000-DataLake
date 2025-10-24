// Types for Dashboard Builder
export type ChartType = 'Metric' | 'Bar' | 'Line' | 'Pie';

export interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  colSpan: 1 | 2 | 3 | 4;
  sqlQuery: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
}

// Types for Workflow Builder
export type WorkflowStatus = 'Live' | 'Hold' | 'Test';

export interface Workflow {
  id: string;
  name: string;
  lastExecuted: string;
  status: WorkflowStatus;
  sources: string[];
  transformer: string;
  transformerCode?: string;
  destination: string;
  repartition: number;
  trigger: string;
}

// Types for Model Content Protocol
export interface McpServer {
  id:string;
  name: string;
  url: string;
  // FIX: Broaden the type to include new categories for better organization.
  type: 'Official' | 'Custom' | 'DocumentCollection' | 'ExternalAPI';
  description: string;
  // FIX: Added optional isLoaded property to align with component and backend logic.
  isLoaded?: boolean;
}

// Types for DL Controls
export type Role = 'Admin' | 'Analyst' | 'Viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}