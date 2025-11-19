'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Tabs, Tab } from '@heroui/tabs';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'cashier'>('admin');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, loginType === 'cashier');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-gradient p-4">
      <Card className="w-full max-w-md shadow-xl-golden">
        <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-4">
          <div className="text-4xl animate-float">🥐</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            GoldenMunch POS
          </h1>
          <p className="text-sm text-default-500">Admin & Cashier Portal</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <Tabs
            selectedKey={loginType}
            onSelectionChange={(key) => setLoginType(key as 'admin' | 'cashier')}
            fullWidth
            color="primary"
            className="mb-6"
          >
            <Tab key="admin" title="Admin Login" />
            <Tab key="cashier" title="Cashier Login" />
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={loginType === 'admin' ? 'Username' : 'Cashier Code'}
              placeholder={loginType === 'admin' ? 'Enter your username' : 'Enter cashier code'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              variant="bordered"
              color="primary"
            />
            <Input
              label={loginType === 'admin' ? 'Password' : 'PIN'}
              placeholder={loginType === 'admin' ? 'Enter your password' : 'Enter 4-digit PIN'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="bordered"
              color="primary"
              maxLength={loginType === 'cashier' ? 4 : undefined}
            />

            {error && (
              <div className="text-danger text-sm p-2 bg-danger-50 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-2 bg-gradient-to-r from-golden-orange to-deep-amber hover:shadow-xl-golden transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
