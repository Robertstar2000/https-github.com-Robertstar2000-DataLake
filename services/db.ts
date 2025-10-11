
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { customers, products, orders } from '../data';
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
    // Create SQL tables
    db.run(`
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT,
        email TEXT
      );
      CREATE TABLE products (
        product_id INTEGER PRIMARY KEY,
        product_name TEXT,
        price REAL
      );
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        product_id INTEGER,
        order_date TEXT,
        quantity INTEGER,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );
    `);

    // Populate SQL tables
    const customerStmt = db.prepare("INSERT INTO customers (customer_id, customer_name, email) VALUES (?, ?, ?)");
    customers.forEach(c => customerStmt.run([c.customer_id, c.customer_name, c.email]));
    customerStmt.free();

    const productStmt = db.prepare("INSERT INTO products (product_id, product_name, price) VALUES (?, ?, ?)");
    products.forEach(p => productStmt.run([p.product_id, p.product_name, p.price]));
    productStmt.free();

    const orderStmt = db.prepare("INSERT INTO orders (order_id, customer_id, product_id, order_date, quantity) VALUES (?, ?, ?, ?, ?)");
    orders.forEach(o => orderStmt.run([o.order_id, o.customer_id, o.product_id, o.order_date, o.quantity]));
    orderStmt.free();
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
  const customerCount = db.exec("SELECT COUNT(*) FROM customers")[0].values[0][0] as number;
  const productCount = db.exec("SELECT COUNT(*) FROM products")[0].values[0][0] as number;
  const orderCount = db.exec("SELECT COUNT(*) FROM orders")[0].values[0][0] as number;
  const dbSizeBytes = db.export().byteLength;

  return {
    customerCount,
    productCount,
    orderCount,
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
