export interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  price: number;
}

export interface Order {
  order_id: number;
  customer_id: number;
  product_id: number;
  order_date: string;
  quantity: number;
}

// Types for Dashboard Builder
export type ChartType = 'Metric' | 'Bar' | 'Line' | 'Pie';

export interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  colSpan: 1 | 2 | 3 | 4;
  dataKey: string;
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
  source: string;
  transformer: string;
  destination: string;
  repartition: number;
  trigger: string;
}

// Types for Pipeline Management
export type PipelineStatus = 'Healthy' | 'Failing' | 'Paused';
export type PipelineStage = 'Design' | 'Testing' | 'Production';

export interface Pipeline {
  id: string;
  name: string;
  stage: PipelineStage;
  source: string;
  destination: string;
  lastRun: string;
  status: PipelineStatus;
}

// Types for Model Content Protocol
export interface McpServer {
  id: string;
  name: string;
  url: string;
  type: 'Official' | 'Custom';
  description: string;
}
