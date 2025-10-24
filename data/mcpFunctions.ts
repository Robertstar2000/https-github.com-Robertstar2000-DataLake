
export interface McpFunction {
  name: string;
  template: string;
}

export const mcpFunctions: Record<string, { uploads: McpFunction[], downloads: McpFunction[] }> = {
    'Epicore P21': {
        uploads: [
            { name: 'ingestSalesOrders', template: "Received {n} new sales orders. Writing to `p21_sales_orders`." },
            { name: 'updateCustomerRecord', template: "Ingested customer update for '{c_name}'. Writing to `p21_customers`." },
            { name: 'syncStockLevels', template: "Received inventory adjustment for item '{sku}'. Writing to `p21_items`." },
        ],
        downloads: [
            { name: 'pushOrderStatus', template: "Pushed 'Shipped' status update for order #{n} to P21." },
            { name: 'createCustomerRecord', template: "Sent new customer record for '{c_name}' to P21." },
            { name: 'pushStockLevels', template: "Pushed stock level updates for {n} items to P21." },
        ]
    },
    'Point of Rental (POR)': {
        uploads: [
            { name: 'ingestRentalContracts', template: "Received {n} new rental contracts. Writing to `por_rental_contracts`." },
            { name: 'updateAssetStatus', template: "Ingested asset status update for '{asset}'. Writing to `por_rental_assets`." },
        ],
        downloads: [
            { name: 'pushAssetAvailability', template: "Pushed rental availability for asset '{asset}' to POR." },
            { name: 'sendBillingInfo', template: "Sent customer billing information for contract #{n} to POR." },
        ]
    },
    'WordPress Interface': {
        uploads: [
            { name: 'ingestProductReviews', template: "Received {n} new product reviews. Writing to vector store." },
            { name: 'syncProductDescription', template: "Ingested product description update for '{sku}'. Writing to `wordpress_products`." },
        ],
        downloads: [
            { name: 'pushStockLevels', template: "Pushed updated stock levels for {n} items to WordPress." },
            { name: 'updateProductPrice', template: "Sent updated pricing for '{sku}' to WordPress." },
        ]
    },
    'Default': {
        uploads: [
            { name: 'ingestDataPackets', template: "Received {n} data packets. Writing to data lake." },
            { name: 'ingestRecordBatch', template: "Ingested new records batch." }
        ],
        downloads: [
            { name: 'pushAnalysisResults', template: "Pushed data analysis results." },
            { name: 'sendDataSubset', template: "Sent requested data subset." }
        ]
    }
};
