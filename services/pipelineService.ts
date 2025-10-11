import { executeQuery } from './db';
import type { Workflow } from '../types';
import { customers, products } from '../data';

// A helper to introduce a delay to make the process feel more real
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Specific logic for 'Ingest Customer Orders'
// This will simulate adding a new order to the system
const runIngestCustomerOrders = async (logCallback: (message: string) => void): Promise<boolean> => {
    const newOrder = { 
        order_id: Math.floor(1000 + Math.random() * 9000), 
        customer_id: customers[Math.floor(Math.random() * customers.length)].customer_id,
        product_id: products[Math.floor(Math.random() * products.length)].product_id,
        order_date: new Date().toISOString().split('T')[0], 
        quantity: Math.floor(1 + Math.random() * 3) 
    };
    
    await delay(500);
    logCallback(`[INFO] New order received from Kafka stream: Order ID ${newOrder.order_id}`);
    
    const query = `
        INSERT INTO orders (order_id, customer_id, product_id, order_date, quantity)
        VALUES (${newOrder.order_id}, ${newOrder.customer_id}, ${newOrder.product_id}, '${newOrder.order_date}', ${newOrder.quantity});
    `;

    await delay(500);
    logCallback(`[INFO] Writing to destination: 'orders' table...`);
    
    const result = executeQuery(query);

    if (result.error) {
        logCallback(`[ERROR] Failed to insert new order: ${result.error}`);
        return false;
    }

    await delay(300);
    logCallback(`[SUCCESS] Successfully ingested new order. Dashboard will reflect this on next refresh.`);
    return true;
}

// Specific logic for 'Calculate Daily Sales Metrics'
const runCalculateDailyMetrics = async (logCallback: (message: string) => void): Promise<boolean> => {
    const metricsTable = 'daily_sales_metrics';

    await delay(300);
    logCallback(`[INFO] Preparing destination table '${metricsTable}'...`);
    executeQuery(`DROP TABLE IF EXISTS ${metricsTable};`);
    executeQuery(`
        CREATE TABLE ${metricsTable} (
            report_date TEXT PRIMARY KEY,
            total_orders INTEGER,
            total_revenue REAL,
            avg_order_value REAL
        );
    `);
    
    await delay(500);
    logCallback(`[INFO] Reading from source: 'orders' and 'products' tables...`);
    const aggregationQuery = `
        SELECT
            o.order_date as report_date,
            COUNT(o.order_id) as total_orders,
            SUM(p.price * o.quantity) as total_revenue
        FROM orders o
        JOIN products p ON o.product_id = p.product_id
        GROUP BY o.order_date;
    `;
    const aggResult = executeQuery(aggregationQuery);

    if (aggResult.error) {
        logCallback(`[ERROR] Failed to aggregate data: ${aggResult.error}`);
        return false;
    }
    
    await delay(700);
    logCallback(`[INFO] Transformation complete. Calculated metrics for ${aggResult.data.length} days.`);

    if (aggResult.data.length > 0) {
        for (const row of aggResult.data) {
            const avg_order_value = row.total_orders > 0 ? row.total_revenue / row.total_orders : 0;
            const insertQuery = `
                INSERT INTO ${metricsTable} (report_date, total_orders, total_revenue, avg_order_value)
                VALUES ('${row.report_date}', ${row.total_orders}, ${row.total_revenue.toFixed(2)}, ${avg_order_value.toFixed(2)});
            `;
            executeQuery(insertQuery);
        }
        await delay(500);
        logCallback(`[INFO] Writing ${aggResult.data.length} records to destination '${metricsTable}'.`);
    } else {
        logCallback(`[INFO] No data to write to destination.`);
    }
    
    await delay(300);
    logCallback(`[SUCCESS] Daily sales metrics have been updated.`);
    return true;
}

// A placeholder for workflows not yet implemented
const runNotImplemented = async (logCallback: (message: string) => void): Promise<boolean> => {
    await delay(500);
    logCallback(`[WARN] This workflow contains proprietary logic and cannot be executed in this environment.`);
    logCallback(`[INFO] Execution finished.`);
    return true;
}


export const executeWorkflow = async (
    workflow: Workflow,
    logCallback: (message: string) => void
): Promise<boolean> => {
    logCallback(`[INFO] Starting workflow '${workflow.name}'...`);
    logCallback(`[INFO] Triggered by: Manual Run`);
    
    try {
        let success = false;
        switch(workflow.id) {
            case 'wf-1':
                success = await runIngestCustomerOrders(logCallback);
                break;
            case 'wf-3':
                success = await runCalculateDailyMetrics(logCallback);
                break;
            // For other workflows, we'll use a placeholder that does nothing
            case 'wf-2':
            default:
                success = await runNotImplemented(logCallback);
                break;
        }

        if (success) {
            logCallback(`[SUCCESS] Workflow '${workflow.name}' finished successfully.`);
        } else {
            logCallback(`[FAILURE] Workflow '${workflow.name}' failed. Check logs for details.`);
        }
        return success;

    } catch (e: any) {
        logCallback(`[CRITICAL] An unexpected error occurred: ${e.message}`);
        return false;
    }
}