'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService } from '@/services/analytics.service';
import { OrderService } from '@/services/order.service';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch sales analytics for today
      const analyticsResponse = await AnalyticsService.getSalesAnalytics({
        start_date: today,
        end_date: today,
      });

      // Fetch recent orders
      const ordersResponse = await OrderService.getOrders({ limit: 5, page: 1 });

      if (analyticsResponse.data?.success && analyticsResponse.data.data) {
        const data = analyticsResponse.data.data;
        setStats({
          todayOrders: data.total_orders || 0,
          todayRevenue: data.total_revenue || 0,
          totalCustomers: data.unique_customers || 0,
          avgOrderValue: data.average_order_value || 0,
        });
      }

      if (ordersResponse.data?.success && ordersResponse.data.data?.orders) {
        setRecentOrders(ordersResponse.data.data.orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber p-8 rounded-lg shadow-xl-golden">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-white/90 mt-2">
          {isAdmin() ? 'Admin Dashboard' : 'Cashier Dashboard'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Orders"
          value={loading ? '...' : stats.todayOrders.toString()}
          icon={ShoppingCartIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Revenue"
          value={loading ? '...' : `₱${stats.todayRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={CurrencyDollarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Customers"
          value={loading ? '...' : stats.totalCustomers.toString()}
          icon={UserGroupIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Order Value"
          value={loading ? '...' : `₱${stats.avgOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={ChartBarIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Recent Orders</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-default-500">Loading...</p>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.order_id} className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Order #{order.order_id}</p>
                    <p className="text-sm text-default-500">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    <p className={`text-sm ${
                      order.order_status === 'completed' ? 'text-success' :
                      order.order_status === 'pending' ? 'text-warning' :
                      'text-default-500'
                    }`}>
                      {order.order_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-default-500">No recent orders</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-row items-center gap-4 p-6">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-sm text-default-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
