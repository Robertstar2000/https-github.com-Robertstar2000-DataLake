
import type { Customer, Product, Order } from './types';

export const customers: Customer[] = [
  { "customer_id": 1, "customer_name": "Alice Johnson", "email": "alice@example.com" },
  { "customer_id": 2, "customer_name": "Bob Smith", "email": "bob@example.com" },
  { "customer_id": 3, "customer_name": "Charlie Brown", "email": "charlie@example.com" },
  { "customer_id": 4, "customer_name": "Diana Prince", "email": "diana@example.com" }
];

export const products: Product[] = [
  { "product_id": 1, "product_name": "CloudBook Pro", "price": 1200 },
  { "product_id": 2, "product_name": "Quantum Mouse", "price": 25 },
  { "product_id": 3, "product_name": "Mechanic Keyboard", "price": 75 },
  { "product_id": 4, "product_name": "4K Monitor", "price": 450 }
];

export const orders: Order[] = [
  { "order_id": 101, "customer_id": 1, "product_id": 1, "order_date": "2023-01-15", "quantity": 2 },
  { "order_id": 102, "customer_id": 2, "product_id": 3, "order_date": "2023-01-16", "quantity": 1 },
  { "order_id": 103, "customer_id": 1, "product_id": 2, "order_date": "2023-01-17", "quantity": 5 },
  { "order_id": 104, "customer_id": 3, "product_id": 1, "order_date": "2023-01-18", "quantity": 3 },
  { "order_id": 105, "customer_id": 4, "product_id": 4, "order_date": "2023-02-01", "quantity": 2 },
  { "order_id": 106, "customer_id": 2, "product_id": 1, "order_date": "2023-02-05", "quantity": 1 },
  { "order_id": 107, "customer_id": 3, "product_id": 3, "order_date": "2023-02-10", "quantity": 2 },
  { "order_id": 108, "customer_id": 1, "product_id": 4, "order_date": "2023-02-12", "quantity": 1 }
];
