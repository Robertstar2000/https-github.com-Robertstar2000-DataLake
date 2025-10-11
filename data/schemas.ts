export interface SchemaField {
  name: string;
  type: string;
}

export interface Schema {
  id: string;
  name: string;
  category: string;
  fields: SchemaField[];
}

export const schemas: Schema[] = [
  // Discrete Manufacturing
  {
    id: 'dm_oee',
    name: 'Overall Equipment Effectiveness (OEE)',
    category: 'Discrete Manufacturing',
    fields: [
      { name: 'machine_id', type: 'integer' },
      { name: 'timestamp', type: 'datetime' },
      { name: 'availability', type: 'float' },
      { name: 'performance', type: 'float' },
      { name: 'quality', type: 'float' },
      { name: 'oee_score', type: 'float' },
    ],
  },
  {
    id: 'dm_wip',
    name: 'Work In Progress (WIP)',
    category: 'Discrete Manufacturing',
    fields: [
      { name: 'wip_id', type: 'integer' },
      { name: 'product_id', type: 'string' },
      { name: 'station_id', type: 'integer' },
      { name: 'entry_time', type: 'datetime' },
      { name: 'exit_time', type: 'datetime' },
      { name: 'status', type: 'string' },
    ],
  },
  // Continuous Manufacturing
  {
    id: 'cm_batch',
    name: 'Batch Production Records',
    category: 'Continuous Manufacturing',
    fields: [
      { name: 'batch_id', type: 'string' },
      { name: 'product_code', type: 'string' },
      { name: 'start_time', type: 'datetime' },
      { name: 'end_time', type: 'datetime' },
      { name: 'yield', type: 'decimal(10, 2)' },
      { name: 'quality_status', type: 'string' },
    ],
  },
  // Warehouse
  {
    id: 'wh_inventory',
    name: 'Inventory Levels',
    category: 'Warehouse',
    fields: [
      { name: 'sku', type: 'string' },
      { name: 'location_id', type: 'string' },
      { name: 'quantity_on_hand', type: 'integer' },
      { name: 'last_updated', type: 'datetime' },
    ],
  },
  {
    id: 'wh_order_fulfillment',
    name: 'Order Fulfillment Time',
    category: 'Warehouse',
    fields: [
      { name: 'order_id', type: 'integer' },
      { name: 'time_received', type: 'datetime' },
      { name: 'time_picked', type: 'datetime' },
      { name: 'time_shipped', type: 'datetime' },
      { name: 'fulfillment_duration_minutes', type: 'integer' },
    ],
  },
  // HR
  {
    id: 'hr_employee',
    name: 'Employee Master',
    category: 'HR',
    fields: [
      { name: 'employee_id', type: 'integer' },
      { name: 'first_name', type: 'string' },
      { name: 'last_name', type: 'string' },
      { name: 'department', type: 'string' },
      { name: 'hire_date', type: 'date' },
      { name: 'status', type: 'string' },
    ],
  },
  {
    id: 'hr_turnover',
    name: 'Employee Turnover Rate',
    category: 'HR',
    fields: [
      { name: 'period_id', type: 'string' },
      { name: 'department_id', type: 'integer' },
      { name: 'terminations', type: 'integer' },
      { name: 'avg_headcount', type: 'integer' },
      { name: 'turnover_rate', type: 'float' },
    ],
  },
  // Finance
  {
    id: 'fin_pnl',
    name: 'Profit and Loss Statement',
    category: 'Finance',
    fields: [
      { name: 'report_date', type: 'date' },
      { name: 'revenue', type: 'decimal(18, 2)' },
      { name: 'cogs', type: 'decimal(18, 2)' },
      { name: 'gross_profit', type: 'decimal(18, 2)' },
      { name: 'operating_expenses', type: 'decimal(18, 2)' },
      { name: 'net_income', type: 'decimal(18, 2)' },
    ],
  },
  {
    id: 'fin_ar',
    name: 'Accounts Receivable Aging',
    category: 'Finance',
    fields: [
      { name: 'customer_id', type: 'integer' },
      { name: 'invoice_id', type: 'string' },
      { name: 'amount_due', type: 'decimal(12, 2)' },
      { name: 'days_overdue', type: 'integer' },
      { name: 'aging_bucket', type: 'string' }, // e.g., '0-30', '31-60'
    ],
  },
  // Professional Services
  {
    id: 'ps_utilization',
    name: 'Billable Utilization Rate',
    category: 'Professional Services',
    fields: [
      { name: 'consultant_id', type: 'integer' },
      { name: 'week_ending_date', type: 'date' },
      { name: 'billable_hours', type: 'decimal(5, 2)' },
      { name: 'total_hours', type: 'decimal(5, 2)' },
      { name: 'utilization_rate', type: 'float' },
    ],
  },
  // Sales and Marketing
  {
    id: 'sm_lead_conversion',
    name: 'Lead Conversion Funnel',
    category: 'Sales and Marketing',
    fields: [
      { name: 'lead_id', type: 'integer' },
      { name: 'creation_date', type: 'date' },
      { name: 'source', type: 'string' },
      { name: 'status', type: 'string' }, // e.g., MQL, SQL, Closed-Won
      { name: 'conversion_date', type: 'date' },
    ],
  },
  {
    id: 'sm_customer_ltv',
    name: 'Customer Lifetime Value (LTV)',
    category: 'Sales and Marketing',
    fields: [
      { name: 'customer_id', type: 'integer' },
      { name: 'acquisition_date', type: 'date' },
      { name: 'total_revenue', type: 'decimal(12, 2)' },
      { name: 'predicted_ltv', type: 'decimal(12, 2)' },
    ],
  },
];

export const categories = [...new Set(schemas.map(s => s.category))].sort();
