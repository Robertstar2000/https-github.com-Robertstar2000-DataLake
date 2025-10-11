
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { unstructuredData } from '../data/unstructuredData';
import type { UnstructuredDocument } from '../data/unstructuredData';

// SQL Database
let db: Database | null = null;

// Vector Store
interface VectorDocument extends UnstructuredDocument {
  vector: number[];
}
let vectorStore: VectorDocument[] = [];
const VECTOR_DIMENSION = 64; // For mock vectors

// Helper for vector math
const dot = (a: number[], b: number[]): number => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
const magnitude = (vec: number[]): number => Math.sqrt(dot(vec, vec));
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) return 0;
    return dot(vecA, vecB) / (magA * magB);
};

export const rebuildVectorStore = () => {
  vectorStore = []; // Reset before initializing
  unstructuredData.forEach(doc => {
    // Generate a random mock vector (normalized)
    let vector = Array.from({ length: VECTOR_DIMENSION }, () => Math.random() * 2 - 1);
    const mag = magnitude(vector);
    vector = vector.map(v => v / mag); // Normalize vector
    vectorStore.push({ ...doc, vector });
  });
};

export const initializeDatabase = async (dbBytes?: Uint8Array) => {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });
  
  if (dbBytes) {
    db = new SQL.Database(dbBytes);
  } else {
    db = new SQL.Database();
    
    // Drop old tables if they exist for a clean slate
    db.run(`
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS orders;
    `);

    // --- NEW SCHEMA FOR ALL MCPs ---
    db.run(`
      -- Epicore P21 (ERP) MCP Tables
      CREATE TABLE p21_customers (
        customer_id INTEGER PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT UNIQUE,
        address TEXT
      );
      CREATE TABLE p21_items (
        item_id TEXT PRIMARY KEY,
        item_description TEXT,
        unit_price REAL,
        quantity_on_hand INTEGER
      );
      CREATE TABLE p21_sales_orders (
        order_num INTEGER PRIMARY KEY,
        customer_id INTEGER,
        order_date TEXT,
        total_amount REAL,
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES p21_customers(customer_id)
      );
      CREATE TABLE p21_sales_order_lines (
        line_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_num INTEGER,
        item_id TEXT,
        quantity INTEGER,
        price_per_unit REAL,
        FOREIGN KEY (order_num) REFERENCES p21_sales_orders(order_num),
        FOREIGN KEY (item_id) REFERENCES p21_items(item_id)
      );

      -- Point of Rental (POR) MCP Tables
      CREATE TABLE por_rental_assets (
        asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_name TEXT NOT NULL,
        asset_category TEXT,
        daily_rate REAL,
        status TEXT -- e.g., 'Available', 'Rented', 'Maintenance'
      );
      CREATE TABLE por_rental_contracts (
        contract_id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        total_cost REAL,
        FOREIGN KEY (customer_id) REFERENCES p21_customers(customer_id)
      );
      CREATE TABLE por_contract_lines (
        line_id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER,
        asset_id INTEGER,
        FOREIGN KEY (contract_id) REFERENCES por_rental_contracts(contract_id),
        FOREIGN KEY (asset_id) REFERENCES por_rental_assets(asset_id)
      );
      
      -- Quality Control (Test Results) MCP Tables
      CREATE TABLE qc_tests (
        test_id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_suite TEXT NOT NULL, -- 'Rubbergoods', 'Fiberglass', 'Swivel'
        item_id TEXT, -- Can link to P21 items or be standalone
        test_date TEXT,
        result TEXT, -- 'Pass', 'Fail'
        metrics TEXT -- JSON blob for detailed results
      );

      -- WordPress MCP Tables
      CREATE TABLE wordpress_products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        description TEXT,
        price REAL,
        stock_quantity INTEGER,
        image_url TEXT
      );
      CREATE TABLE wordpress_product_categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT UNIQUE
      );
      CREATE TABLE wordpress_product_category_map (
        product_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES wordpress_products(product_id),
        FOREIGN KEY (category_id) REFERENCES wordpress_product_categories(category_id)
      );

      -- Microsoft Graph (Teams) MCP Tables
      CREATE TABLE teams_users (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        email TEXT UNIQUE
      );
      CREATE TABLE teams_channels (
        channel_id TEXT PRIMARY KEY,
        channel_name TEXT
      );
      CREATE TABLE teams_messages (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT,
        user_id TEXT,
        sent_datetime TEXT,
        content TEXT,
        FOREIGN KEY (channel_id) REFERENCES teams_channels(channel_id),
        FOREIGN KEY (user_id) REFERENCES teams_users(user_id)
      );
      
      -- Google Drive MCP Table
      CREATE TABLE gdrive_files (
        file_id TEXT PRIMARY KEY,
        file_name TEXT,
        mime_type TEXT,
        owner_email TEXT,
        last_modified TEXT,
        file_size INTEGER
      );

      -- Stack Overflow for Teams MCP Tables
      CREATE TABLE stackoverflow_questions (
        question_id INTEGER PRIMARY KEY,
        title TEXT,
        body TEXT,
        author_email TEXT,
        creation_date TEXT,
        tags TEXT -- Comma-separated
      );
       CREATE TABLE stackoverflow_answers (
        answer_id INTEGER PRIMARY KEY,
        question_id INTEGER,
        body TEXT,
        author_email TEXT,
        is_accepted INTEGER, -- 0 or 1
        creation_date TEXT,
        FOREIGN KEY (question_id) REFERENCES stackoverflow_questions(question_id)
      );
    `);

    // --- POPULATE TABLES WITH MOCK DATA ---
    
    // P21 Data
    db.run("INSERT INTO p21_customers VALUES (1, 'Innovate Corp', 'Alice Johnson', 'alice@innovate.com', '123 Tech Lane'), (2, 'Builders LLC', 'Bob Smith', 'bob@builders.com', '456 Construct Ave');");
    db.run("INSERT INTO p21_items VALUES ('CB-PRO', 'CloudBook Pro Laptop', 1200.00, 50), ('QM-01', 'Quantum Mouse', 25.50, 200), ('MK-ULTRA', 'Mechanic Keyboard Ultra', 75.00, 150);");
    db.run("INSERT INTO p21_sales_orders VALUES (101, 1, '2023-01-15', 2400.00, 'Shipped'), (102, 2, '2023-01-16', 75.00, 'Shipped'), (103, 1, '2023-02-05', 1225.50, 'Processing');");
    db.run("INSERT INTO p21_sales_order_lines (order_num, item_id, quantity, price_per_unit) VALUES (101, 'CB-PRO', 2, 1200.00), (102, 'MK-ULTRA', 1, 75.00), (103, 'CB-PRO', 1, 1200.00), (103, 'QM-01', 1, 25.50);");

    // POR Data
    db.run("INSERT INTO por_rental_assets (asset_name, asset_category, daily_rate, status) VALUES ('Excavator EX-500', 'Heavy Equipment', 350.00, 'Available'), ('Scissor Lift SL-30', 'Aerial Lift', 150.00, 'Rented'), ('Concrete Mixer CM-10', 'Construction', 80.00, 'Available');");
    db.run("INSERT INTO por_rental_contracts VALUES (2001, 2, '2023-02-10', '2023-02-17', 1050.00);");
    db.run("INSERT INTO por_contract_lines (contract_id, asset_id) VALUES (2001, 2);");

    // QC Data
    db.run("INSERT INTO qc_tests (test_suite, item_id, test_date, result, metrics) VALUES ('Swivel', 'SW-JOINT-V2', '2023-03-01', 'Pass', '{\"torque_nm\": 45.2, \"rotation_deg\": 360}'), ('Rubbergoods', 'RG-HOSE-A1', '2023-03-02', 'Fail', '{\"pressure_psi\": 150, \"failure_point\": \"seam\"}');");
    
    // WordPress Data
    db.run("INSERT INTO wordpress_products (product_name, description, price, stock_quantity, image_url) VALUES ('CloudBook Pro', 'The ultimate laptop for professionals.', 1200.00, 50, '/images/laptop.jpg'), ('Quantum Mouse', 'A sleek and responsive wireless mouse.', 25.50, 200, '/images/mouse.jpg');");
    db.run("INSERT INTO wordpress_product_categories (category_name) VALUES ('Laptops'), ('Accessories');");
    db.run("INSERT INTO wordpress_product_category_map VALUES (1, 1), (2, 2);");

    // Teams Data
    db.run("INSERT INTO teams_users VALUES ('alice-id', 'Alice Johnson', 'alice@innovate.com'), ('bob-id', 'Bob Smith', 'bob@builders.com');");
    db.run("INSERT INTO teams_channels VALUES ('proj-phoenix', 'Project Phoenix');");
    db.run("INSERT INTO teams_messages (message_id, channel_id, user_id, sent_datetime, content) VALUES ('msg1', 'proj-phoenix', 'alice-id', '2023-03-05 10:00:00', 'The latest design mockups are in the GDrive folder.');");

    // GDrive Data
    db.run("INSERT INTO gdrive_files VALUES ('file-abc-123', 'Project Phoenix Mockups.fig', 'application/figma', 'alice@innovate.com', '2023-03-05 09:58:00', 5024000);");

    // Stack Overflow Data
    db.run("INSERT INTO stackoverflow_questions (question_id, title, author_email, creation_date, tags) VALUES (1, 'How to connect to the P21 MCP?', 'bob@builders.com', '2023-02-20 14:30:00', 'p21,mcp,api');");
    db.run("INSERT INTO stackoverflow_answers (question_id, body, author_email, is_accepted, creation_date) VALUES (1, 'You need to use the service account credentials stored in the vault. See the documentation link here...', 'alice@innovate.com', 1, '2023-02-20 15:00:00');");
  }

  // Initialize Vector Store whenever the DB is initialized
  rebuildVectorStore();
};

export const executeQuery = (query: string) => {
    if (!db) throw new Error("Database not initialized");
    try {
        const results = db.exec(query);
        if (results.length === 0) {
            return { headers: [], data: [] };
        }
        const { columns, values } = results[0];
        const data = values.map(row => 
            columns.reduce((obj, col, i) => {
                obj[col] = row[i];
                return obj;
            }, {} as Record<string, any>)
        );
        return { headers: columns, data };
    } catch (e: any) {
        return { error: e.message };
    }
};

export const getTableSchemas = (): Record<string, string> => {
    if (!db) throw new Error("Database not initialized");
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const schemas: Record<string, string> = {};
    if (tables[0]) {
        tables[0].values.forEach(row => {
            const tableName = row[0] as string;
            const tableInfo = db.exec(`PRAGMA table_info(${tableName})`);
            if (tableInfo[0]) {
                const columnNames = tableInfo[0].values.map(col => `${col[1]} (${col[2]})`);
                schemas[tableName] = columnNames.join(', ');
            }
        });
    }
    return schemas;
}

export const findSimilarDocuments = (docId: string, count: number = 3): UnstructuredDocument[] => {
    const sourceDoc = vectorStore.find(d => d.id === docId);
    if (!sourceDoc) return [];

    return vectorStore
        .filter(d => d.id !== docId)
        .map(otherDoc => ({
            doc: otherDoc,
            similarity: cosineSimilarity(sourceDoc.vector, otherDoc.vector),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, count)
        .map(item => item.doc);
};

// --- New Functions for Maintenance ---

export const getDbStatistics = () => {
  if (!db) throw new Error("Database not initialized");
  const tableCounts: Record<string, number> = {};
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  if(tables[0]) {
      tables[0].values.forEach(row => {
          const tableName = row[0] as string;
          const count = db.exec(`SELECT COUNT(*) FROM ${tableName}`)[0].values[0][0] as number;
          tableCounts[tableName] = count;
      })
  }
  const dbSizeBytes = db.export().byteLength;

  return {
    tableCounts,
    dbSizeBytes,
  };
};

export const exportDb = (): Uint8Array => {
  if (!db) throw new Error("Database not initialized");
  return db.export();
};

export const runMaintenance = (): { success: boolean, message: string } => {
  if (!db) throw new Error("Database not initialized");
  try {
    db.run('VACUUM;');
    return { success: true, message: 'Database maintenance (VACUUM) completed successfully.' };
  } catch (e: any) {
    console.error("Failed to run maintenance", e);
    return { success: false, message: e.message };
  }
};

export const getVectorStoreStats = () => {
  return {
    documentCount: vectorStore.length,
    vectorDimension: VECTOR_DIMENSION,
  };
};

export const getDashboardStats = () => {
    return {
        dbStats: getDbStatistics(),
        vectorStats: getVectorStoreStats(),
    }
}
