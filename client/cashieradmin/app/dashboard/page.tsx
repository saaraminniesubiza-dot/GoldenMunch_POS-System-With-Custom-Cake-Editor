'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

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
          value="0"
          icon={ShoppingCartIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Revenue"
          value="₱0.00"
          icon={CurrencyDollarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Customers"
          value="0"
          icon={UserGroupIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Order Value"
          value="₱0.00"
          icon={ChartBarIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          <p className="text-default-500">No recent activity</p>
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
