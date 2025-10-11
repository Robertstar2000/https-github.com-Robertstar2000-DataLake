
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { unstructuredData } from '../data/unstructuredData';
import type { UnstructuredDocument } from '../data/unstructuredData';
import { initialCustomServers, initialMcpServers } from '../data/mcpServers';
import { initialWorkflows } from '../data/workflows';
import { schemaMetadata } from '../data/schemaMetadata';
import type { Workflow, McpServer, Dashboard as DashboardType, WidgetConfig } from '../types';


// --- IndexedDB Helpers ---
const IDB_NAME = 'DataLakeDB';
const IDB_STORE_NAME = 'sqljs';
const IDB_KEY = 'database';

function openIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, 1);
        request.onerror = () => reject("Error opening IndexedDB");
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                db.createObjectStore(IDB_STORE_NAME);
            }
        };
    });
}

async function saveDbToIndexedDB(dbInstance: Database | null) {
    if (!dbInstance) return;
    try {
        const dbHandle = await openIdb();
        const transaction = dbHandle.transaction(IDB_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const dbBytes = dbInstance.export();
        store.put(dbBytes, IDB_KEY);
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => {
                dbHandle.close();
                resolve();
            };
            transaction.onerror = (event) => {
                dbHandle.close();
                reject(`Error saving DB to IndexedDB: ${(event.target as IDBTransaction).error}`);
            };
        });
    } catch(e) {
        console.error("Could not save database to IndexedDB.", e);
    }
}

async function loadDbFromIndexedDB(): Promise<Uint8Array | null> {
    const dbHandle = await openIdb();
    const transaction = dbHandle.transaction(IDB_STORE_NAME, 'readonly');
    const store = transaction.objectStore(IDB_STORE_NAME);
    const request = store.get(IDB_KEY);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            dbHandle.close();
            resolve(request.result ? (request.result as Uint8Array) : null);
        };
        request.onerror = () => {
            dbHandle.close();
            reject("Error loading DB from IndexedDB");
        };
    });
}
// --- End IndexedDB Helpers ---


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
  if (!db) return;
  vectorStore = []; // Reset before initializing
  
  // 1. Process unstructured data files
  unstructuredData.forEach(doc => {
    let vector = Array.from({ length: VECTOR_DIMENSION }, () => Math.random() * 2 - 1);
    const mag = magnitude(vector);
    vector = vector.map(v => v / mag);
    vectorStore.push({ ...doc, vector });
  });

  // 2. Replicate relevant structured data from SQL DB
  Object.entries(schemaMetadata).forEach(([tableName, meta]) => {
    if (meta.inVectorStore) {
        try {
            const { data } = executeQuery(`SELECT * FROM ${tableName}`);
            data.forEach((row: any) => {
                // Heuristic to create content: join all text-like fields.
                const content = Object.keys(row)
                  .filter(key => typeof row[key] === 'string' && key.toLowerCase() !== 'id')
                  .map(key => `${key}: ${row[key]}`)
                  .join('\n');
                
                // Heuristic for name and ID
                const name = row.name || row.title || row.item_description || `${tableName} Row`;
                const id = `sql:${tableName}:${row.id || row.item_id || row.question_id || row.message_id || Math.random()}`;

                let vector = Array.from({ length: VECTOR_DIMENSION }, () => Math.random() * 2 - 1);
                const mag = magnitude(vector);
                vector = vector.map(v => v / mag); // Normalize vector

                vectorStore.push({
                    id,
                    name,
                    content,
                    type: `SQL Record: ${tableName}`,
                    vector,
                });
            });
        } catch (e) {
            console.error(`Failed to replicate data from ${tableName} to vector store`, e);
        }
    }
  });
};

function populateNewDatabase(db: Database) {
    db.run(`
      -- Drop old tables if they exist for a clean slate
      DROP TABLE IF EXISTS p21_customers;
      DROP TABLE IF EXISTS p21_items;
      DROP TABLE IF EXISTS p21_sales_orders;
      DROP TABLE IF EXISTS p21_sales_order_lines;
      DROP TABLE IF EXISTS por_rental_assets;
      DROP TABLE IF EXISTS por_rental_contracts;
      DROP TABLE IF EXISTS por_contract_lines;
      DROP TABLE IF EXISTS qc_tests;
      DROP TABLE IF EXISTS wordpress_products;
      DROP TABLE IF EXISTS wordpress_product_categories;
      DROP TABLE IF EXISTS wordpress_product_category_map;
      DROP TABLE IF EXISTS teams_users;
      DROP TABLE IF EXISTS teams_channels;
      DROP TABLE IF EXISTS teams_messages;
      DROP TABLE IF EXISTS gdrive_files;
      DROP TABLE IF EXISTS stackoverflow_questions;
      DROP TABLE IF EXISTS stackoverflow_answers;
      DROP TABLE IF EXISTS mcp_servers;
      DROP TABLE IF EXISTS workflows;
      DROP TABLE IF EXISTS dashboards;
      DROP TABLE IF EXISTS dashboard_widgets;

      -- Epicore P21 (ERP) MCP Tables
      CREATE TABLE p21_customers ( customer_id INTEGER PRIMARY KEY, company_name TEXT NOT NULL, contact_name TEXT, contact_email TEXT UNIQUE, address TEXT );
      CREATE TABLE p21_items ( item_id TEXT PRIMARY KEY, item_description TEXT, unit_price REAL, quantity_on_hand INTEGER );
      CREATE TABLE p21_sales_orders ( order_num INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, total_amount REAL, status TEXT, FOREIGN KEY (customer_id) REFERENCES p21_customers(customer_id) );
      CREATE TABLE p21_sales_order_lines ( line_id INTEGER PRIMARY KEY AUTOINCREMENT, order_num INTEGER, item_id TEXT, quantity INTEGER, price_per_unit REAL, FOREIGN KEY (order_num) REFERENCES p21_sales_orders(order_num), FOREIGN KEY (item_id) REFERENCES p21_items(item_id) );
      CREATE TABLE por_rental_assets ( asset_id INTEGER PRIMARY KEY AUTOINCREMENT, asset_name TEXT NOT NULL, asset_category TEXT, daily_rate REAL, status TEXT );
      CREATE TABLE por_rental_contracts ( contract_id INTEGER PRIMARY KEY, customer_id INTEGER, start_date TEXT, end_date TEXT, total_cost REAL, FOREIGN KEY (customer_id) REFERENCES p21_customers(customer_id) );
      CREATE TABLE por_contract_lines ( line_id INTEGER PRIMARY KEY AUTOINCREMENT, contract_id INTEGER, asset_id INTEGER, FOREIGN KEY (contract_id) REFERENCES por_rental_contracts(contract_id), FOREIGN KEY (asset_id) REFERENCES por_rental_assets(asset_id) );
      CREATE TABLE qc_tests ( test_id INTEGER PRIMARY KEY AUTOINCREMENT, test_suite TEXT NOT NULL, item_id TEXT, test_date TEXT, result TEXT, metrics TEXT );
      CREATE TABLE wordpress_products ( product_id INTEGER PRIMARY KEY AUTOINCREMENT, product_name TEXT NOT NULL, description TEXT, price REAL, stock_quantity INTEGER, image_url TEXT );
      CREATE TABLE wordpress_product_categories ( category_id INTEGER PRIMARY KEY AUTOINCREMENT, category_name TEXT UNIQUE );
      CREATE TABLE wordpress_product_category_map ( product_id INTEGER, category_id INTEGER, PRIMARY KEY (product_id, category_id), FOREIGN KEY (product_id) REFERENCES wordpress_products(product_id), FOREIGN KEY (category_id) REFERENCES wordpress_product_categories(category_id) );
      CREATE TABLE teams_users ( user_id TEXT PRIMARY KEY, display_name TEXT, email TEXT UNIQUE );
      CREATE TABLE teams_channels ( channel_id TEXT PRIMARY KEY, channel_name TEXT );
      CREATE TABLE teams_messages ( message_id TEXT PRIMARY KEY, channel_id TEXT, user_id TEXT, sent_datetime TEXT, content TEXT, FOREIGN KEY (channel_id) REFERENCES teams_channels(channel_id), FOREIGN KEY (user_id) REFERENCES teams_users(user_id) );
      CREATE TABLE gdrive_files ( file_id TEXT PRIMARY KEY, file_name TEXT, mime_type TEXT, owner_email TEXT, last_modified TEXT, file_size INTEGER );
      CREATE TABLE stackoverflow_questions ( question_id INTEGER PRIMARY KEY, title TEXT, body TEXT, author_email TEXT, creation_date TEXT, tags TEXT );
      CREATE TABLE stackoverflow_answers ( answer_id INTEGER PRIMARY KEY, question_id INTEGER, body TEXT, author_email TEXT, is_accepted INTEGER, creation_date TEXT, FOREIGN KEY (question_id) REFERENCES stackoverflow_questions(question_id) );
      
      -- App State Tables
      CREATE TABLE mcp_servers ( id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, type TEXT, description TEXT, is_loaded INTEGER DEFAULT 0 );
      CREATE TABLE workflows ( id TEXT PRIMARY KEY, name TEXT NOT NULL, lastExecuted TEXT, status TEXT, source TEXT, transformer TEXT, destination TEXT, repartition INTEGER, trigger TEXT );
      CREATE TABLE dashboards ( id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT );
      CREATE TABLE dashboard_widgets ( id TEXT PRIMARY KEY, dashboard_id TEXT, title TEXT, type TEXT, colSpan INTEGER, sqlQuery TEXT, FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) );
    `);

    // --- POPULATE TABLES WITH MOCK DATA ---
    db.run("INSERT INTO p21_customers VALUES (1, 'Innovate Corp', 'Alice Johnson', 'alice@innovate.com', '123 Tech Lane'), (2, 'Builders LLC', 'Bob Smith', 'bob@builders.com', '456 Construct Ave');");
    db.run("INSERT INTO p21_items VALUES ('CB-PRO', 'CloudBook Pro Laptop', 1200.00, 50), ('QM-01', 'Quantum Mouse', 25.50, 200), ('MK-ULTRA', 'Mechanic Keyboard Ultra', 75.00, 150);");
    db.run("INSERT INTO p21_sales_orders VALUES (101, 1, '2023-01-15', 2400.00, 'Shipped'), (102, 2, '2023-01-16', 75.00, 'Shipped'), (103, 1, '2023-02-05', 1225.50, 'Processing');");
    db.run("INSERT INTO p21_sales_order_lines (order_num, item_id, quantity, price_per_unit) VALUES (101, 'CB-PRO', 2, 1200.00), (102, 'MK-ULTRA', 1, 75.00), (103, 'CB-PRO', 1, 1200.00), (103, 'QM-01', 1, 25.50);");
    db.run("INSERT INTO por_rental_assets (asset_name, asset_category, daily_rate, status) VALUES ('Excavator EX-500', 'Heavy Equipment', 350.00, 'Available'), ('Scissor Lift SL-30', 'Aerial Lift', 150.00, 'Rented'), ('Concrete Mixer CM-10', 'Construction', 80.00, 'Available');");
    db.run("INSERT INTO por_rental_contracts VALUES (2001, 2, '2023-02-10', '2023-02-17', 1050.00);");
    db.run("INSERT INTO por_contract_lines (contract_id, asset_id) VALUES (2001, 2);");
    db.run("INSERT INTO qc_tests (test_suite, item_id, test_date, result, metrics) VALUES ('Swivel', 'SW-JOINT-V2', '2023-03-01', 'Pass', '{\"torque_nm\": 45.2, \"rotation_deg\": 360}'), ('Rubbergoods', 'RG-HOSE-A1', '2023-03-02', 'Fail', '{\"pressure_psi\": 150, \"failure_point\": \"seam\"}');");
    db.run("INSERT INTO wordpress_products (product_id, product_name, description, price, stock_quantity, image_url) VALUES (1, 'CloudBook Pro', 'The ultimate laptop for professionals.', 1200.00, 50, '/images/laptop.jpg'), (2, 'Quantum Mouse', 'A sleek and responsive wireless mouse.', 25.50, 200, '/images/mouse.jpg');");
    db.run("INSERT INTO wordpress_product_categories (category_name) VALUES ('Laptops'), ('Accessories');");
    db.run("INSERT INTO wordpress_product_category_map VALUES (1, 1), (2, 2);");
    db.run("INSERT INTO teams_users VALUES ('alice-id', 'Alice Johnson', 'alice@innovate.com'), ('bob-id', 'Bob Smith', 'bob@builders.com');");
    db.run("INSERT INTO teams_channels VALUES ('proj-phoenix', 'Project Phoenix');");
    db.run("INSERT INTO teams_messages (message_id, channel_id, user_id, sent_datetime, content) VALUES ('msg1', 'proj-phoenix', 'alice-id', '2023-03-05 10:00:00', 'The latest design mockups are in the GDrive folder.');");
    db.run("INSERT INTO gdrive_files VALUES ('file-abc-123', 'Project Phoenix Mockups.fig', 'application/figma', 'alice@innovate.com', '2023-03-05 09:58:00', 5024000);");
    db.run("INSERT INTO stackoverflow_questions (question_id, title, author_email, creation_date, tags) VALUES (1, 'How to connect to the P21 MCP?', 'bob@builders.com', '2023-02-20 14:30:00', 'p21,mcp,api');");
    db.run("INSERT INTO stackoverflow_answers (question_id, body, author_email, is_accepted, creation_date) VALUES (1, 'You need to use the service account credentials stored in the vault. See the documentation link here...', 'alice@innovate.com', 1, '2023-02-20 15:00:00');");
    
    // --- POPULATE APP STATE TABLES ---
    const libraryServers: McpServer[] = initialMcpServers.map((s, i) => ({ ...s, id: `lib-server-${i}`, type: 'Official' }));
    [...libraryServers, ...initialCustomServers].forEach((s, i) => {
      db.run('INSERT INTO mcp_servers (id, name, url, type, description, is_loaded) VALUES (?, ?, ?, ?, ?, ?)', [s.id, s.name, s.url, s.type, s.description, s.type === 'Custom' ? 1 : 0]);
    });
    initialWorkflows.forEach(w => {
      db.run('INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [w.id, w.name, w.lastExecuted, w.status, w.source, w.transformer, w.destination, w.repartition, w.trigger]);
    });

    // Populate initial dashboard
    db.run("INSERT INTO dashboards VALUES ('sales-overview-1', 'Sales Overview', 'A high-level look at sales performance and key metrics.')");
    const initialWidgets: WidgetConfig[] = [
        { id: 'w1', title: 'Total Revenue', type: 'Metric', colSpan: 1, sqlQuery: 'SELECT SUM(total_amount) as value FROM p21_sales_orders' },
        { id: 'w2', title: 'Total Orders', type: 'Metric', colSpan: 1, sqlQuery: 'SELECT COUNT(*) as value FROM p21_sales_orders' },
        { id: 'w3', title: 'Unique Customers', type: 'Metric', colSpan: 1, sqlQuery: 'SELECT COUNT(DISTINCT customer_id) as value FROM p21_customers' },
        { id: 'w4', title: 'Avg. Order Value', type: 'Metric', colSpan: 1, sqlQuery: 'SELECT AVG(total_amount) as value FROM p21_sales_orders' },
        { id: 'w5', title: 'Revenue by Product (Top 5)', type: 'Bar', colSpan: 4, sqlQuery: "SELECT i.item_description as name, SUM(ol.quantity * ol.price_per_unit) as value FROM p21_sales_order_lines ol JOIN p21_items i ON ol.item_id = i.item_id GROUP BY i.item_description ORDER BY value DESC LIMIT 5" },
        { id: 'w6', title: 'Orders Over Time', type: 'Line', colSpan: 2, sqlQuery: 'SELECT order_date as name, COUNT(order_num) as value FROM p21_sales_orders GROUP BY order_date ORDER BY order_date' },
        { id: 'w7', title: 'Top Product Revenue (Pie)', type: 'Pie', colSpan: 2, sqlQuery: "SELECT i.item_description as name, SUM(ol.quantity * ol.price_per_unit) as value FROM p21_sales_order_lines ol JOIN p21_items i ON ol.item_id = i.item_id GROUP BY i.item_description ORDER BY value DESC LIMIT 5" },
    ];
    initialWidgets.forEach(w => {
        db.run("INSERT INTO dashboard_widgets VALUES (?, ?, ?, ?, ?, ?)", [w.id, 'sales-overview-1', w.title, w.type, w.colSpan, w.sqlQuery]);
    });
}

export const initializeDatabase = async (dbBytes?: Uint8Array) => {
  const SQL = await initSqlJs({ locateFile: file => `https://esm.sh/sql.js@1.10.3/dist/${file}` });
  
  if (dbBytes) {
    console.log("Initializing database from provided file bytes...");
    db = new SQL.Database(dbBytes);
  } else {
    try {
        const savedDbBytes = await loadDbFromIndexedDB();
        if (savedDbBytes) {
            console.log("Initializing database from IndexedDB...");
            db = new SQL.Database(savedDbBytes);
        } else {
            console.log("No saved database found. Initializing new database...");
            db = new SQL.Database();
            populateNewDatabase(db);
        }
    } catch (e) {
        console.error("Failed to load/save with IndexedDB, creating temporary in-memory database.", e);
        db = new SQL.Database();
        populateNewDatabase(db);
    }
  }
  await saveDbToIndexedDB(db);
  rebuildVectorStore();
};

const isModifyingQuery = (query: string): boolean => {
    const keywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'VACUUM', 'REPLACE'];
    const queryUpper = query.trim().toUpperCase();
    return keywords.some(keyword => queryUpper.startsWith(keyword));
};


export const executeQuery = (query: string, params: (string|number)[] = []) => {
    if (!db) throw new Error("Database not initialized");
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();

        if (isModifyingQuery(query)) {
            saveDbToIndexedDB(db).catch(err => console.error("Async DB save failed:", err));
        }

        if (results.length === 0) {
            return { headers: [], data: [] };
        }
        
        const headers = Object.keys(results[0]);
        return { headers, data: results };

    } catch (e: any) {
        return { error: e.message };
    }
};

export const getTableSchemas = (): Record<string, string> => {
    if (!db) throw new Error("Database not initialized");
    const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").data;
    const schemas: Record<string, string> = {};
    if (tables) {
        tables.forEach(row => {
            const tableName = row.name as string;
            const tableInfo = executeQuery(`PRAGMA table_info(${tableName})`).data;
            if (tableInfo) {
                const columnNames = tableInfo.map((col: any) => `${col.name} (${col.type})`);
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
        .map(otherDoc => ({ doc: otherDoc, similarity: cosineSimilarity(sourceDoc.vector, otherDoc.vector) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, count)
        .map(item => item.doc);
};

export const getDbStatistics = () => {
  if (!db) throw new Error("Database not initialized");
  const tableCounts: Record<string, number> = {};
  const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").data;
  if(tables) {
      tables.forEach((row: any) => {
          const tableName = row.name as string;
          const countResult = executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`).data;
          tableCounts[tableName] = countResult[0].count as number;
      })
  }
  const dbSizeBytes = db.export().byteLength;
  return { tableCounts, dbSizeBytes };
};

export const exportDb = (): Uint8Array => {
  if (!db) throw new Error("Database not initialized");
  return db.export();
};

export const runMaintenance = (): { success: boolean, message: string } => {
  if (!db) throw new Error("Database not initialized");
  try {
    db.run('VACUUM;');
    saveDbToIndexedDB(db).catch(err => console.error("Async DB save failed:", err));
    return { success: true, message: 'Database maintenance (VACUUM) completed successfully.' };
  } catch (e: any) {
    console.error("Failed to run maintenance", e);
    return { success: false, message: e.message };
  }
};

export const getVectorStoreStats = () => {
  return { documentCount: vectorStore.length, vectorDimension: VECTOR_DIMENSION };
};

export const getDashboardStats = () => {
    const { data: mcpData } = executeQuery("SELECT COUNT(*) as count FROM mcp_servers WHERE is_loaded = 1");
    const { data: workflowData } = executeQuery("SELECT status, COUNT(*) as count FROM workflows GROUP BY status");
    
    const workflowCounts = workflowData.reduce((acc, row) => {
        acc[row.status as string] = row.count;
        return acc;
    }, {} as Record<string, number>);

    return {
        dbStats: getDbStatistics(),
        vectorStats: getVectorStoreStats(),
        mcpCount: mcpData[0]?.count || 0,
        workflowCounts,
    }
}

// --- App State Management Functions ---
export const getMcpServers = (): McpServer[] => executeQuery("SELECT *, is_loaded as isLoaded FROM mcp_servers").data;
export const getWorkflows = (): Workflow[] => executeQuery("SELECT * FROM workflows").data;
export const getLoadedMcpServers = (): McpServer[] => executeQuery("SELECT * FROM mcp_servers WHERE is_loaded = 1").data;

export const saveMcpServer = (server: McpServer, isLoaded: boolean) => {
    executeQuery("REPLACE INTO mcp_servers (id, name, url, type, description, is_loaded) VALUES (?, ?, ?, ?, ?, ?)", [server.id, server.name, server.url, server.type, server.description, isLoaded ? 1 : 0]);
};

export const saveWorkflow = (workflow: Workflow) => {
    executeQuery("REPLACE INTO workflows (id, name, lastExecuted, status, source, transformer, destination, repartition, trigger) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [workflow.id, workflow.name, workflow.lastExecuted, workflow.status, workflow.source, workflow.transformer, workflow.destination, workflow.repartition, workflow.trigger]);
};
export const deleteWorkflow = (id: string) => executeQuery("DELETE FROM workflows WHERE id = ?", [id]);


export const getDashboards = (): DashboardType[] => {
    const dashboardsResult = executeQuery("SELECT * FROM dashboards").data as any[];
    const widgetsResult = executeQuery("SELECT * FROM dashboard_widgets").data as any[];
    
    return dashboardsResult.map(d => ({
        ...d,
        widgets: widgetsResult.filter(w => w.dashboard_id === d.id)
    }));
};

export const saveDashboard = (dashboard: DashboardType) => {
    executeQuery("REPLACE INTO dashboards (id, name, description) VALUES (?, ?, ?)", [dashboard.id, dashboard.name, dashboard.description]);
    // Nuke and pave widgets for simplicity in this demo app
    executeQuery("DELETE FROM dashboard_widgets WHERE dashboard_id = ?", [dashboard.id]);
    dashboard.widgets.forEach(w => {
        executeQuery("INSERT INTO dashboard_widgets (id, dashboard_id, title, type, colSpan, sqlQuery) VALUES (?, ?, ?, ?, ?, ?)", [w.id, dashboard.id, w.title, w.type, w.colSpan, w.sqlQuery]);
    });
};
export const deleteDashboard = (id: string) => {
    executeQuery("DELETE FROM dashboards WHERE id = ?", [id]);
    executeQuery("DELETE FROM dashboard_widgets WHERE dashboard_id = ?", [id]);
};
