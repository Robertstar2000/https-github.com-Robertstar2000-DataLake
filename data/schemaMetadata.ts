export interface ColumnMetadata {
  description: string;
}

export interface TableMetadata {
  description: string;
  inVectorStore?: boolean;
  columns: Record<string, ColumnMetadata>;
}

export const schemaMetadata: Record<string, TableMetadata> = {
  p21_customers: {
    description: "Stores information about business customers, acting as a central customer master record.",
    columns: {
      customer_id: { description: "Unique identifier for each customer." },
      company_name: { description: "The legal name of the customer's company." },
      contact_name: { description: "Primary contact person at the company." },
      contact_email: { description: "Email address for the primary contact." },
      address: { description: "Physical mailing address of the company." },
      credit_limit: { description: "The customer's approved credit limit in USD." },
      on_credit_hold: { description: "Flag (1 or 0) indicating if the customer is on credit hold." },
      last_credit_check_date: { description: "The date of the last formal credit review." },
    },
  },
  p21_credit_applications: {
    description: "Tracks credit limit applications and the vetting process for customers.",
    columns: {
      application_id: { description: "Unique identifier for the credit application." },
      customer_id: { description: "Foreign key linking to the p21_customers table." },
      application_date: { description: "The date the credit application was submitted." },
      requested_limit: { description: "The credit limit amount requested by the customer." },
      status: { description: "Current status of the application (e.g., 'Pending', 'Approved', 'Rejected')." },
      decision_date: { description: "The date a decision was made on the application." },
    },
  },
  p21_items: {
    description: "Represents the master list of all products or items available for sale, manufacturing, or service.",
    inVectorStore: true,
    columns: {
      item_id: { description: "Unique identifier for the product/item (SKU)." },
      item_description: { description: "A detailed description of the item." },
      item_type: { description: "The type of item (e.g., 'Purchased', 'Manufactured', 'Service')." },
      unit_price: { description: "The price for a single unit of the item." },
      quantity_on_hand: { description: "Current stock level for this item in the main warehouse." },
    },
  },
    p21_suppliers: {
    description: "Information about suppliers from whom goods and services are purchased.",
    columns: {
      supplier_id: { description: "Unique identifier for the supplier." },
      supplier_name: { description: "The legal name of the supplier." },
      contact_email: { description: "Primary email contact for the supplier." },
    },
  },
  p21_purchase_orders: {
    description: "Header information for purchase orders issued to suppliers.",
    columns: {
      po_num: { description: "Unique identifier for the purchase order." },
      supplier_id: { description: "Foreign key linking to the p21_suppliers table." },
      order_date: { description: "The date the purchase order was created." },
      total_amount: { description: "The total value of the purchase order." },
    },
  },
  p21_po_lines: {
    description: "Line item details for each purchase order.",
    columns: {
      line_id: { description: "Unique identifier for the purchase order line." },
      po_num: { description: "Foreign key linking to p21_purchase_orders." },
      item_id: { description: "Foreign key linking to the p21_items table." },
      quantity_ordered: { description: "The number of units of the item ordered." },
    },
  },
  p21_inventory_locations: {
    description: "Defines physical or logical locations where inventory is stored.",
    columns: {
      location_id: { description: "Unique identifier for the inventory location (e.g., 'MAIN', 'QC')." },
      location_name: { description: "A descriptive name for the location." },
      is_primary: { description: "Flag (1 or 0) indicating if this is the primary sales location." },
    },
  },
  p21_item_inventory: {
    description: "Tracks the quantity of items at different inventory locations.",
    columns: {
      item_id: { description: "Foreign key linking to the p21_items table." },
      location_id: { description: "Foreign key linking to p21_inventory_locations." },
      quantity: { description: "The quantity of the item at that specific location." },
    },
  },
  p21_sales_orders: {
    description: "Header information for each sales order placed by a customer.",
    columns: {
      order_num: { description: "Unique identifier for the sales order." },
      customer_id: { description: "Foreign key linking to the p21_customers table." },
      order_date: { description: "The date the order was placed." },
      total_amount: { description: "The total value of the entire order." },
      status: { description: "The current status of the order (e.g., 'Shipped', 'Processing')." },
    },
  },
  p21_sales_order_lines: {
    description: "Line item details for each sales order, linking orders to specific products.",
    columns: {
      line_id: { description: "Unique identifier for the order line." },
      order_num: { description: "Foreign key linking to the p21_sales_orders table." },
      item_id: { description: "Foreign key linking to the p21_items table." },
      quantity: { description: "The number of units of the item ordered." },
      price_per_unit: { description: "The price of the item at the time of purchase." },
    },
  },
  por_rental_assets: {
    description: "Information about assets available for rent, such as equipment.",
    columns: {
      asset_id: { description: "Unique identifier for a rental asset." },
      asset_name: { description: "Name or description of the rental asset." },
      asset_category: { description: "Category of the asset (e.g., 'Heavy Equipment')." },
      daily_rate: { description: "The cost to rent the asset for one day." },
      status: { description: "Current availability status (e.g., 'Available', 'Rented')." },
    },
  },
  por_rental_contracts: {
    description: "Header information for rental agreements with customers.",
    columns: {
      contract_id: { description: "Unique identifier for the rental contract." },
      customer_id: { description: "Foreign key linking to the p21_customers table." },
      start_date: { description: "The date the rental period begins." },
      end_date: { description: "The date the rental period ends." },
      total_cost: { description: "Total calculated cost of the rental contract." },
    },
  },
  por_contract_lines: {
    description: "Links specific rental assets to a rental contract.",
    columns: {
      line_id: { description: "Unique identifier for the contract line." },
      contract_id: { description: "Foreign key linking to por_rental_contracts." },
      asset_id: { description: "Foreign key linking to por_rental_assets." },
    },
  },
  qc_rubber_goods_tests: {
    description: "Stores pass/fail results and metrics from high-voltage testing of rubber safety goods.",
    columns: {
      test_id: { description: "Unique identifier for a specific test run." },
      item_id: { description: "The base item that was tested (e.g., '14-inch Class 2 Glove')." },
      serial_number_tested: { description: "The unique serial number of the specific item tested." },
      test_date: { description: "Date the test was conducted." },
      result: { description: "The outcome of the test ('Pass' or 'Fail')." },
      voltage_kv: { description: "The voltage in kilovolts applied during the test." },
      leakage_ma: { description: "The measured electrical leakage in milliamps." },
      technician_id: { description: "Identifier for the technician who performed the test." },
    },
  },
  qc_fiberglass_tests: {
    description: "Stores pass/fail results and metrics from mechanical load testing of fiberglass products.",
    columns: {
      test_id: { description: "Unique identifier for a specific test run." },
      item_id: { description: "The base item that was tested (e.g., '12ft Fiberglass Ladder')." },
      serial_number_tested: { description: "The unique serial number of the specific item tested." },
      test_date: { description: "Date the test was conducted." },
      result: { description: "The outcome of the test ('Pass' or 'Fail')." },
      load_lbs: { description: "The mechanical load in pounds applied during the test." },
      deflection_in: { description: "The measured deflection in inches under load." },
      technician_id: { description: "Identifier for the technician who performed the test." },
    },
  },
  qc_swivel_tests: {
    description: "Stores pass/fail results and metrics from swivel joint performance testing.",
    columns: {
      test_id: { description: "Unique identifier for a specific test run." },
      item_id: { description: "The swivel joint item that was tested." },
      serial_number_tested: { description: "The unique serial number of the specific item tested." },
      test_date: { description: "Date the test was conducted." },
      result: { description: "The outcome of the test ('Pass' or 'Fail')." },
      rotation_torque_nm: { description: "The measured torque in newton-meters required for rotation." },
      pressure_psi: { description: "The hydraulic pressure in PSI applied during the test." },
      technician_id: { description: "Identifier for the technician who performed the test." },
    },
  },
  cascade_locations: {
    description: "Defines customer sites where managed 'Cascade' inventory is held.",
    columns: {
      location_id: { description: "Unique identifier for the customer's inventory location." },
      customer_id: { description: "Foreign key linking to the p21_customers table." },
      location_name: { description: "A descriptive name for the site (e.g., 'Site A - Warehouse 2')." },
      address: { description: "The physical address of the cascade location." },
    },
  },
  cascade_inventory: {
    description: "Tracks current stock levels for items at each customer cascade location.",
    columns: {
      location_id: { description: "Foreign key linking to the cascade_locations table." },
      item_id: { description: "Foreign key linking to the p21_items table." },
      quantity: { description: "The current quantity of the item at the location." },
      min_stock_level: { description: "The minimum stock level that triggers a replenishment order." },
      max_stock_level: { description: "The target stock level for replenishment." },
      last_updated: { description: "Timestamp of the last inventory count or update." },
    },
  },
  mfg_work_orders: {
    description: "Tracks manufacturing jobs and customer repairs.",
    columns: {
      work_order_id: { description: "Unique identifier for the work order." },
      item_id_to_produce: { description: "The finished good item to be manufactured or repaired." },
      quantity: { description: "The number of units to produce or repair." },
      status: { description: "Current status of the work order (e.g., 'Pending', 'In Progress', 'Completed')." },
      creation_date: { description: "Date the work order was created." },
      due_date: { description: "The expected completion date." },
      type: { description: "Type of work order, either 'Manufacturing' or 'Repair'." },
    },
  },
  mfg_boms: {
    description: "Bill of Materials. Defines the component items required to build a manufactured item.",
    columns: {
      bom_id: { description: "Unique ID for the bill of material line item." },
      parent_item_id: { description: "The finished good (manufactured) item." },
      component_item_id: { description: "A component item required to build the parent." },
      quantity_per_parent: { description: "The quantity of the component needed for one parent." },
    },
  },
  wordpress_products: {
    description: "Product information sourced from the public-facing WordPress CMS.",
    inVectorStore: true,
    columns: {
      product_id: { description: "Unique product ID from WordPress." },
      product_name: { description: "Public-facing name of the product." },
      description: { description: "Marketing description of the product." },
      price: { description: "Publicly listed price." },
      stock_quantity: { description: "Publicly visible stock level." },
      image_url: { description: "URL for the main product image." },
    },
  },
  wordpress_product_categories: {
    description: "Defines product categories within the WordPress CMS.",
    columns: {
      category_id: { description: "Unique category ID from WordPress." },
      category_name: { description: "Name of the product category." },
    },
  },
  wordpress_product_category_map: {
    description: "Associative table mapping products to their categories in WordPress.",
    columns: {
      product_id: { description: "Foreign key to wordpress_products." },
      category_id: { description: "Foreign key to wordpress_product_categories." },
    },
  },
  teams_users: {
    description: "User profiles from Microsoft Teams.",
    columns: {
      user_id: { description: "Unique user ID from MS Graph." },
      display_name: { description: "User's full name." },
      email: { description: "User's email address." },
    },
  },
  teams_channels: {
    description: "Represents channels within Microsoft Teams.",
    columns: {
      channel_id: { description: "Unique channel ID from MS Graph." },
      channel_name: { description: "Name of the Teams channel." },
    },
  },
  teams_messages: {
    description: "Stores messages posted in Microsoft Teams channels.",
    inVectorStore: true,
    columns: {
      message_id: { description: "Unique message ID from MS Graph." },
      channel_id: { description: "Foreign key to teams_channels." },
      user_id: { description: "Foreign key to the author in teams_users." },
      sent_datetime: { description: "Timestamp when the message was sent." },
      content: { description: "The text content of the message." },
    },
  },
  gdrive_files: {
    description: "Metadata for files stored in Google Drive.",
    columns: {
      file_id: { description: "Unique file ID from Google Drive API." },
      file_name: { description: "The name of the file." },
      mime_type: { description: "The MIME type of the file (e.g., 'application/pdf')." },
      owner_email: { description: "Email of the file's owner." },
      last_modified: { description: "Timestamp of the last modification." },
      file_size: { description: "File size in bytes." },
    },
  },
  stackoverflow_questions: {
    description: "Questions posted in the internal Stack Overflow for Teams.",
    inVectorStore: true,
    columns: {
      question_id: { description: "Unique identifier for the question." },
      title: { description: "The title of the question." },
      body: { description: "The full content/body of the question." },
      author_email: { description: "Email of the user who asked the question." },
      creation_date: { description: "Timestamp when the question was posted." },
      tags: { description: "Comma-separated list of tags associated with the question." },
    },
  },
  stackoverflow_answers: {
    description: "Answers to questions in the internal Stack Overflow for Teams.",
    inVectorStore: true,
    columns: {
      answer_id: { description: "Unique identifier for the answer." },
      question_id: { description: "Foreign key linking to the stackoverflow_questions table." },
      body: { description: "The full content/body of the answer." },
      author_email: { description: "Email of the user who posted the answer." },
      is_accepted: { description: "Flag (1 or 0) indicating if this is the accepted answer." },
      creation_date: { description: "Timestamp when the answer was posted." },
    },
  },
   daily_sales_metrics: {
    description: "An aggregate table, created by a pipeline, that summarizes daily sales performance.",
    columns: {
      report_date: { description: "The date for which the metrics are calculated." },
      total_orders: { description: "The total number of orders on that day." },
      total_revenue: { description: "The sum of all order totals for that day." },
      avg_order_value: { description: "The average value of an order for that day." },
    }
  }
};