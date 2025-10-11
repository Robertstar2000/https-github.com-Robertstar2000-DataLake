# Cloud DataHub Help

Welcome to the Cloud DataHub! This guide will help you understand and navigate the features of this interactive data lake simulation.

## Quick Start

-   **Get Oriented:** Start with the **Architecture** view to see a visual representation of the data flow. Click on any component to jump to its management page.
-   **Ask a Question:** Go to the **AI Analyst** page, wait for the schema to load, and ask a question about the data in plain English, like "Which customer spent the most?".
-   **Explore the Data:** Use the **Data Explorer** to run SQL queries directly against the database or interact with unstructured documents using AI.
-   **Manage Data Sources:** Visit the **MCP** page to see available data sources. "Load" a server to simulate connecting it to the data lake.
-   **Build a Dashboard:** Navigate to the **Dashboard Builder** to create your own custom charts and metrics by writing SQL queries.
-   **Manage Pipelines:** Go to the **Workflow Manager** to see how data pipelines are defined. Try running one of the "RUNNABLE" workflows to see simulated data processing.

---

## Detailed User Manual

### Hub Status Board
This is your main dashboard, providing a high-level overview of the data lake's health and activity. Key metrics include the number of active data sources (MCPs), the status of data pipelines (Workflows), and statistics about the SQL and Vector databases. Clicking on any card will take you to the relevant management page.

### Architecture
This interactive diagram visualizes the end-to-end flow of data in the platform.
-   **Data Sources:** Where data originates.
-   **Processing Pipeline:** Represents the data transformation engine. You can select different workflows from the dropdown to see their associated (editable) transformation scripts.
-   **Data Lake Storage:** The different zones where data is stored.
-   **Consumption:** The tools and interfaces used to access and analyze the data.
Clicking on any node or the glowing hotspots will navigate you to that feature.

### Data Explorer
This is a powerful tool for hands-on data analysis.
-   **Structured Data (SQL):** Write and execute SQL queries directly against the data lake's relational database. Use the sidebar to browse table schemas or use the **AI Schema Search** to find relevant tables and columns by describing what you're looking for (e.g., "customer names and order dates").
-   **Unstructured Data (AI):** Select a document (like a support ticket or meeting notes) and use the chat interface to ask questions, summarize, or extract information from it using the Gemini API.

### AI Analyst
Your AI-powered data assistant. After it analyzes the database schema, you can ask complex questions in natural language. The AI will:
1.  Understand your question.
2.  Generate a SQL query to get the answer.
3.  Execute the query against the live database.
4.  Provide a summarized, easy-to-understand answer based on the results.
The example prompts are a great way to see it in action.

### Schema Explorer
This is your data catalog. It provides a detailed view of every table in the database, including column names, data types, and descriptions of what the data represents. You can filter by category or search for specific tables or columns.

### Dashboard Builder
Create custom dashboards to visualize your data.
1.  Use the tabs to switch between dashboards or create a new one.
2.  Click "Edit" to enter edit mode.
3.  Click "+ Add Widget" to create a new chart. You'll define a title, chart type, and the SQL query to power it.
4.  In edit mode, you can drag and drop widgets to rearrange them or use the controls to change their size or remove them.

### Workflow Manager
This is where you manage data pipelines (ETL/ELT jobs).
-   **List View:** Provides a detailed summary of all configured workflows.
-   **Kanban View:** A board that organizes workflows by their status (Live, Test, Hold). You can drag and drop workflows to change their status.
-   **Execution:** Some workflows are marked as "RUNNABLE". Clicking "Run" on these will open a log window and simulate a real data processing job, which will actually modify the data in the database.

### MCP (Model Content Protocol)
This page lets you manage all your data sources.
-   **Server Library:** A list of official, pre-configured connectors.
-   **Loaded Servers:** The data sources that are currently "connected" to your data lake.
-   **Actions:** You can "Load" a server from the library to connect it, or "Unload" an existing server. You can also add your own custom MCP endpoints.

### I/O Management
Monitor the real-time data flow for each of your loaded MCP servers. Select an MCP from the list to see a simulated log of data being uploaded to the data lake and downloaded back to the source system. You can also configure settings like how frequently the data lake polls the MCP for new data.

### DL Controls
The central governance console for the data lake. This page simulates managing:
-   **User Access:** Assign roles (Admin, Analyst, Viewer) to users.
-   **Global Data Policies:** Enable or disable platform-wide rules, such as data masking or retention policies.
-   **Cost Management:** View a simulated breakdown of monthly cloud costs.

### DB Maintenance
Perform administrative tasks on the underlying storage systems.
-   **SQL Database:** Backup the entire database to a file, restore it from a backup, and run maintenance tasks to optimize storage.
-   **Vector Store:** Rebuild the search index used by the Unstructured Data Explorer. This re-processes all relevant documents to ensure the AI has the latest information.

---

## Understanding MCP (Model Content Protocol)

In this application, **Model Content Protocol (MCP)** is a concept that represents a standardized interface for any data source or destination. Think of it as a universal plug that allows different systems—like ERPs, CRMs, file storage, or even other AI models—to connect to the data lake.

-   **How it Works:** When you go to the **MCP** page and "Load" a server (e.g., 'Epicore P21'), you are simulating the act of establishing a live connection to that external system.
-   **Data Ingestion:** Once an MCP is loaded, the application's backend simulates the ingestion of its data. It creates the relevant tables in the SQL database (e.g., `p21_customers`, `p21_sales_orders`) and populates them with sample data. This makes the data available for querying in the Data Explorer, AI Analyst, and Dashboard Builder.
-   **Live Monitoring:** The **I/O Management** page then allows you to "watch" the simulated data traffic for that specific MCP, giving you a feel for how data flows in and out of the system in real-time.

By managing MCPs, you are controlling the foundational data available within your entire data lake environment.
