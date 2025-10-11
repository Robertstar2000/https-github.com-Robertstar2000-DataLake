
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from './Card';
import { executeQuery } from '../services/db';

// FIX: Added a specific type for the dashboard data to improve type safety.
interface DashboardData {
  totalRevenue: string;
  totalOrders: number;
  activeUsers: number;
  avgOrderValue: string;
  ordersOverTime: { name: string; orders: number }[];
  revenueByProduct: { name: string; revenue: number }[];
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = () => {
        try {
            // Stat Card Queries
            const totalRevenueResult = executeQuery('SELECT SUM(p.price * o.quantity) as total FROM orders o JOIN products p ON o.product_id = p.product_id');
            const totalOrdersResult = executeQuery('SELECT COUNT(*) as count FROM orders');
            const activeUsersResult = executeQuery('SELECT COUNT(DISTINCT customer_id) as count FROM customers');

            const totalRevenue = totalRevenueResult.data[0]?.total || 0;
            const totalOrders = totalOrdersResult.data[0]?.count || 0;
            const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

            // Chart Queries
            const ordersOverTimeResult = executeQuery(`
                SELECT order_date as name, COUNT(order_id) as orders
                FROM orders
                GROUP BY order_date
                ORDER BY order_date
            `);
            
            const revenueByProductResult = executeQuery(`
                SELECT p.product_name as name, SUM(p.price * o.quantity) as revenue
                FROM orders o
                JOIN products p ON o.product_id = p.product_id
                GROUP BY p.product_name
                ORDER BY revenue DESC
            `);

            setDashboardData({
              totalRevenue: `$${totalRevenue.toLocaleString()}`,
              totalOrders,
              activeUsers: activeUsersResult.data[0].count,
              avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
              ordersOverTime: ordersOverTimeResult.data,
              revenueByProduct: revenueByProductResult.data,
            });
        } catch(e) {
            console.error("Failed to fetch dashboard data", e)
        }
    }
    fetchData();
  }, []);

  const COLORS = ['#06b6d4', '#818cf8', '#f87171', '#fbbf24'];

  const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactNode}> = ({ title, value, icon }) => (
    <Card>
      <div className="flex items-center">
        <div className="p-3 bg-slate-700/50 rounded-lg mr-4">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-semibold text-slate-400">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Application Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={dashboardData.totalRevenue} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
        <StatCard title="Total Orders" value={dashboardData.totalOrders} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Active Users" value={dashboardData.activeUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Avg. Order Value" value={dashboardData.avgOrderValue} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <h3 className="text-xl font-semibold text-white mb-4">Orders Over Time</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dashboardData.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#06b6d4" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4">Revenue by Product</h3>
             <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={dashboardData.revenueByProduct} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} cursor={{fill: 'rgba(100,116,139,0.1)'}} />
                        <Bar dataKey="revenue" fill="#06b6d4" name="Revenue" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
      
       <Card>
          <h3 className="text-xl font-semibold text-white mb-4">Revenue Contribution by Product</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dashboardData.revenueByProduct}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                  // FIX: By typing the dashboardData state, TypeScript correctly infers 'percent' as a number, resolving the arithmetic operation error.
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.revenueByProduct.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
    </div>
  );
};

export default Dashboard;
