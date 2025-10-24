// This file runs in a separate thread and acts as a message-passing
// wrapper around the core database logic.

import * as dbLogic from './db-logic';

self.onmessage = async (e: MessageEvent) => {
    const { id, action, payload } = e.data;

    try {
        let result: any;
        switch(action) {
            case 'initializeDatabase':
                result = await dbLogic.initializeDatabase(payload?.dbBytes);
                break;
            case 'executeQuery':
                result = dbLogic.executeQuery(payload.query, payload.params);
                break;
            case 'getTableSchemas':
                result = dbLogic.getTableSchemas();
                break;
            case 'createTableFromMcp':
                result = dbLogic.createTableFromMcp(payload);
                break;
            case 'findSimilarDocuments':
                result = dbLogic.findSimilarDocuments(payload.docId, payload.count);
                break;
            case 'getDbStatistics':
                result = dbLogic.getDbStatistics();
                break;
            case 'exportDb':
                result = dbLogic.exportDb();
                break;
            case 'runMaintenance':
                result = dbLogic.runMaintenance();
                break;
            case 'getVectorStoreStats':
                result = dbLogic.getVectorStoreStats();
                break;
            case 'rebuildVectorStore':
                dbLogic.rebuildVectorStore();
                result = 'Vector store rebuilt.';
                break;
            case 'getDashboardStats':
                result = dbLogic.getDashboardStats();
                break;
            case 'getMcpServers':
                result = dbLogic.getMcpServers();
                break;
            case 'getWorkflows':
                result = dbLogic.getWorkflows();
                break;
            case 'getLoadedMcpServers':
                result = dbLogic.getLoadedMcpServers();
                break;
            case 'saveMcpServer':
                dbLogic.saveMcpServer(payload.server, payload.isLoaded);
                result = 'MCP server saved.';
                break;
            case 'saveWorkflow':
                dbLogic.saveWorkflow(payload.workflow);
                result = 'Workflow saved.';
                break;
            case 'deleteWorkflow':
                dbLogic.deleteWorkflow(payload.id);
                result = 'Workflow deleted.';
                break;
            case 'getDashboards':
                result = dbLogic.getDashboards();
                break;
            case 'saveDashboard':
                dbLogic.saveDashboard(payload.dashboard);
                result = 'Dashboard saved.';
                break;
            case 'deleteDashboard':
                dbLogic.deleteDashboard(payload.id);
                result = 'Dashboard deleted.';
                break;
            case 'getUsers':
                result = dbLogic.getUsers();
                break;
            case 'saveUser':
                dbLogic.saveUser(payload.user);
                result = 'User saved.';
                break;
            case 'deleteUser':
                dbLogic.deleteUser(payload.userId);
                result = 'User deleted.';
                break;
            default:
                throw new Error(`Unknown worker action: ${action}`);
        }
        self.postMessage({ id, result });
    } catch (error: any) {
        self.postMessage({ id, error: error.message, action });
    }
};