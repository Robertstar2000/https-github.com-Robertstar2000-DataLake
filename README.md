# Cloud DataHub: An Interactive Data Platform Simulation

## User Operating Instructions

Welcome to the Cloud DataHub! This guide provides detailed instructions on how to use each feature of this interactive data platform simulation.

### First Steps: A Quick Tour

Follow these steps to quickly get a feel for the application's core functionality.

1.  **Get Oriented (Architecture View):**
    *   Navigate to the **Architecture** view from the sidebar. This diagram shows the entire data flow.
    *   Notice the glowing hotspots. Hover over them to see tool descriptions.
    *   Click on the **AI Analyst** node in the "Consumption" block to jump directly to that tool.

2.  **Ask an AI-Powered Question (AI Analyst):**
    *   On the **AI Analyst** page, wait a moment for the initial "Analyze Table Schema" process to complete automatically. You'll see a message "AI Analyst Ready" with a list of tables.
    *   Click on one of the example prompts, like **"Which customer has spent the most money?"**.
    *   Watch as the AI generates a SQL query, executes it, and provides a natural language answer.
    *   Try another example prompt, such as **"Show total order value by date as a line chart"**, to see the AI generate a visualization.

3.  **Run a SQL Query (Data Explorer):**
    *   Go to the **Data Explorer**. The "Structured Data (SQL)" tab is selected by default.
    *   The editor is pre-filled with a query. Click the **Run Query** button.
    *   Examine the results table on the right. In the schema sidebar on the left, expand the `p21_customers` table to see its columns.

4.  **Run a Data Pipeline (Workflow Manager):**
    *   Go to the **Workflow Manager**.
    *   Find the workflow named **"RUNNABLE: Ingest P21 Sales Orders"** and click its **Run** button.
    *   A log window will appear, showing the steps of a simulated data ingestion pipeline.
    *   After it finishes, go back to the **Data Explorer** and run `SELECT * FROM p21_sales_orders ORDER BY order_date DESC;`. You will see a new, randomly generated order has been added to the database.

5.  **Build a Chart (Dashboard Builder):**
    *   Navigate to the **Dashboard Builder**.
    *   Click the **Edit** button in the top right. The dashboard will enter edit mode.
    *   Click **+ Add Widget**.
    *   Fill out the form:
        *   **Title:** `My New Metric`
        *   **Widget Type:** `Metric`
        *   **SQL Query:** `SELECT COUNT(*) as value FROM p21_items;`
        *   **Width:** `1`
    *   Click **Add Widget**. Your new widget appears on the dashboard.
    *   Click **Done** to save your changes.

---

### Detailed Feature Guide

#### Hub Status Board
This is your main dashboard. Each card is a high-level summary of a key part of the data platform.
-   **Functionality:** The cards display live counts and stats from the simulated backend.
-   **Interaction:** Clicking on any card (e.g., "Active MCPs", "Live Workflows", "DB Tables") will navigate you directly to the corresponding management page.

#### Architecture
This interactive diagram visualizes the data flow from sources to consumption tools.
-   **Interaction:** Click on any of the four main stages ("Data Sources", "Processing", etc.) or the individual nodes within them (e.g., "Databases", "AI Analyst") to navigate to that feature.
-   **Workflow Viewer:** In the "Processing Pipeline" stage, you can use the dropdown to select different workflows and view their (simulated) transformation code in the text area.

#### Data Explorer
A powerful tool for hands-on data analysis.
-   **Structured Data (SQL):**
    -   **Query Editor:** Write and execute SQL queries in the main text area.
    -   **Schema Sidebar:** Browse all available tables. Click the triangle next to a table name to expand and view its columns and their descriptions. Tables marked with a purple icon are included in the AI's unstructured data search.
    -   **AI Schema Search:** Type a natural language description (e.g., "customer emails") into the search bar and click "Search". The AI will highlight the most relevant tables and columns in the sidebar.
-   **Unstructured Data (AI):**
    -   **Document Selection:** Select a document (like a support ticket or meeting notes) from the list on the left.
    -   **Chat Interface:** The document content will be displayed. Use the input box at the bottom to ask questions about it, summarize it, or ask it to extract information.

#### AI Analyst
Your AI-powered data assistant.
-   **How it Works:** The AI has been given the database schema and access to tools. When you ask a question, it decides which tools to use (e.g., `executeQuerySql`), generates the necessary SQL, runs it, and then formulates a final answer based on the results.
-   **Usage:**
    1.  Wait for the initial schema analysis to complete.
    2.  Type a question in plain English or click an example prompt.
    3.  The AI's thought process, including the generated SQL, will be streamed to the chat window, followed by the final answer and any charts.

#### Schema Explorer
This is your data catalog.
-   **Browsing:** Select a schema from the list on the left to view its details on the right, including column names, data types, descriptions, and its source MCP (data lineage).
-   **Filtering:** Use the search bar and category filters to quickly find the table you're looking for.
-   **Extract Table from MCP:** This tool simulates a data ingestion workflow. Click the button, select a loaded MCP, define a new table name and schema, and click "Add Table". A new table with that structure will be created in the database and populated with mock data.

#### Dashboard Builder
Create custom dashboards to visualize your data.
-   **Editing:** Click the **Edit** button to manage the dashboard.
-   **Adding Widgets:** In edit mode, click **+ Add Widget**. You must provide a SQL query. **Important:** For charts, your query must alias the label column as `name` and the data column as `value` (e.g., `SELECT company_name as name, credit_limit as value FROM p21_customers`). For a single metric, alias the result as `value`.
-   **Arranging:** In edit mode, you can drag and drop widgets to reorder them and use the dropdown to change their width (from 1 to 4 columns).
-   **Saving:** Click **Done** to exit edit mode and save your changes.

#### Workflow Manager
Manage the data pipelines (ETL/ELT jobs) that process your data.
-   **Views:** Switch between a detailed **List** view and a status-based **Kanban** board. In Kanban view, you can drag and drop workflows to change their status.
-   **Creating/Editing:** Click "Create New Workflow" or the "Edit" button on an existing one to open the editor, where you can define its name, sources, destination, and configuration.
-   **Running a Workflow:** Some workflows are "RUNNABLE". Clicking **Run** opens a log modal that shows the simulated execution of the pipeline, which will perform real data modifications in the browser's database.

#### MCP (Model Content Protocol)
Manage all connections to your data sources.
-   **Loaded Servers:** This list shows which data sources are currently "active" and providing data to your lake.
-   **Server Library:** This contains pre-configured connectors. Click **Load** to add one to your "Loaded Servers".
-   **Add Custom Server:** You can simulate connecting to a new, custom data source by providing a name and a URL. The URL must start with `mcp://`, `http://`, or `https://`.
-   **View Code:** Click to see a JSON representation of the server's configuration, simulating its API definition.

#### I/O Management
Monitor the real-time data flow for each active MCP connection.
-   **Usage:** Select a loaded MCP from the list on the left.
-   **Monitoring:** The right panel will display the MCP's defined functions and two log windows showing a simulated, real-time feed of data being uploaded to the data lake and downloaded back to the source system.

#### DL Controls
The central governance console for the data lake.
-   **User Management:** Add, delete, or change the roles of users. The roles (Admin, Analyst, Viewer) are for simulation purposes and do not restrict functionality in this demo.
-   **Global Data Policies:** Toggle on or off simulated platform-wide rules, like PII masking or data retention policies.

#### DB Maintenance
Perform administrative tasks on the application's storage systems.
-   **Backup DB:** Downloads the entire current state of the SQL database as a `.db` file.
-   **Restore DB:** Upload a previously saved `.db` file to restore the database to that state. The application will reload.
-   **Rebuild Index:** Re-creates the search index for the Unstructured Data Explorer. Run this if you believe the unstructured search is out of sync.

---

# Cloud DataHub: An Interactive Data Platform Simulation

Cloud DataHub is a high-fidelity, browser-based simulation of a modern cloud data platform. It provides an interactive dashboard to explore and visualize a complete data lake architecture, featuring dynamic data exploration, runnable processing pipelines, a custom dashboard builder, and an AI-powered data analyst powered by the Google Gemini API.

This application is built entirely with frontend technologies, using an in-browser SQL database and a "frontend-as-backend" architecture to create a realistic and responsive user experience without requiring a server.

## Core Concepts

-   **Frontend-as-Backend Simulation:** The entire application runs in the browser. Logic that would typically reside on a server (database interactions, API logic, pipeline execution) is handled by TypeScript modules in the `services/` directory, providing a complete, self-contained experience.
-   **In-Browser Data Warehouse:** At its core, the application uses **SQL.js** (a WebAssembly port of SQLite) to run a powerful SQL database directly in the browser. All data transformations, user-created dashboards, and workflow definitions are stored here.
-   **Persistence with IndexedDB:** The state of the SQL.js database is persisted to the browser's **IndexedDB**. This ensures that any changes you make—such as creating a new dashboard, editing a workflow, or running a data ingestion pipeline—are saved across browser sessions.
-   **Model Content Protocol (MCP):** MCP is the application's abstraction for all data sources and destinations. The **MCP Management** page allows users to "load" and "unload" various data sources (like an ERP, a CRM, or a file system), which simulates the ingestion of that data into the data lake.
-   **AI Integration with Gemini:** The application leverages the Google Gemini API for advanced features, including:
    -   **Natural Language Querying:** The **AI Analyst** uses Gemini's function-calling capabilities to translate user questions into SQL queries, execute them, and summarize the results.
    -   **Semantic Search:** The **Data Explorer** uses Gemini for AI-powered schema search and for processing unstructured documents.

---

## Features

-   **Hub Status Board:** A central dashboard providing a high-level overview of the data lake's health, including active MCPs, workflow statuses, and database statistics.
-   **Interactive Architecture Diagram:** A dynamic visualization of the end-to-end data flow, from sources to consumption. Nodes are clickable, allowing for quick navigation to relevant tools.
-   **Data Explorer:** A dual-mode tool for deep data analysis:
    -   **Structured Data:** A full-featured SQL editor to query the in-browser database, complete with an AI schema search to find relevant tables and columns.
    -   **Unstructured Data:** An interface to interact with documents (e.g., support tickets, meeting notes) using AI for summarization and information extraction, backed by a simulated vector store for similarity search.
-   **AI Analyst:** A conversational chat interface that allows users to ask complex questions about their data in plain English. The AI generates and executes SQL queries to provide answers.
-   **Schema Explorer:** A comprehensive data catalog for browsing all tables and their schemas within the data lake. Includes a tool to simulate ingesting new tables from a loaded MCP.
-   **Dashboard Builder:** A powerful tool for creating and customizing dashboards. Users can add widgets (metrics, bar charts, line charts, pie charts) powered by custom SQL queries and arrange them using a drag-and-drop interface.
-   **Workflow Manager:** A management console for simulated data pipelines (ETL/ELT jobs). Features include:
    -   List and Kanban board views.
    -   A full editor for creating and modifying pipeline definitions.
    -   The ability to execute "runnable" workflows that perform real data transformations on the in-browser database.
-   **I/O Management:** A real-time monitor that simulates the data ingress (uploads) and egress (downloads) for each active MCP connection.
-   **DL Controls:** A governance console for managing user access control, setting global data policies, and monitoring simulated platform costs.
-   **DB Maintenance:** Administrative tools to manage the application's storage layer, including:
    -   Backup and restore of the entire SQL database.
    -   Re-indexing of the simulated vector store for unstructured data search.

---

## Technical Deep Dive

### Project Structure

-   `components/`: Contains all React components that form the UI of the application.
-   `services/`: The core logic of the application is here.
    -   `be-*.ts`: These files represent the "backend" simulation (database, AI, pipelines).
    -   `api.ts`: A client-side API layer that the components use to communicate with the `be-` services, simulating asynchronous network calls.
    -   `db.worker.ts`: A Web Worker that runs the SQL.js database on a separate thread to keep the UI responsive.
    -   `db-logic.ts`: The raw database and vector store logic, designed to be run by the web worker.
-   `data/`: Contains static mock data, schema metadata, and initial configurations for the application.
-   `contexts/`: Holds React Context providers for managing global state, such as the `ErrorContext`.

### How to Run

This is a browser-based application designed to run in the provided development environment. The `index.html` file sets up the necessary imports (via an `importmap`) and mounts the React application defined in `index.tsx`.

### Future Improvements

The application is architected for extension. Based on the analysis in `logic.md`, potential future enhancements include:

-   **Real-time Dashboard Updates:** Implement an event system to automatically refresh dashboard widgets when an underlying data source is updated by a workflow.
-   **SQL Query Auto-Completion:** Enhance the Data Explorer's SQL editor with auto-completion for table and column names.
-   **AI-Driven Chart Generation:** Empower the AI Analyst to not only answer questions but also suggest and render appropriate chart visualizations.
-   **Workflow Dependencies:** Allow workflows to be chained together, triggering one upon the successful completion of another to simulate complex data orchestration.