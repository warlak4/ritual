import { Navigate, useRoutes } from 'react-router-dom';
import { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../views/auth/LoginPage';
import { RegisterPage } from '../views/auth/RegisterPage';
import { DashboardPage } from '../views/dashboard/DashboardPage';
import { ManagerDashboardPage } from '../views/manager/ManagerDashboardPage';
import { ClientStorePage } from '../views/client/ClientStorePage';
import { OrdersPage } from '../views/orders/OrdersPage';
import { ClientsPage } from '../views/clients/ClientsPage';
import { CeremoniesPage } from '../views/ceremonies/CeremoniesPage';
import { ResourcesPage } from '../views/resources/ResourcesPage';
import { AnalyticsPage } from '../views/analytics/AnalyticsPage';
import { SettingsPage } from '../views/settings/SettingsPage';
import { NotFoundPage } from '../views/misc/NotFoundPage';
import { StorePage } from '../views/store/StorePage';
import { CartPage } from '../views/cart/CartPage';
import { ProfilePage } from '../views/profile/ProfilePage';
import { useAuthStore } from '../store/authStore';

function HomeRedirect() {
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRoles = useMemo(() => (user?.roles?.length ? user.roles : roles), [roles, user]);
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!accessToken || activeRoles.length === 0) {
    return <Navigate to="/login" replace />;
  }
  
  if (activeRoles.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  if (activeRoles.includes('manager')) {
    return <Navigate to="/manager" replace />;
  }
  if (activeRoles.includes('client') || (activeRoles.includes('guest') && activeRoles.length === 1)) {
    return <Navigate to="/store" replace />;
  }
  return <Navigate to="/login" replace />;
}

export function AppRoutes() {
  const element = useRoutes([
    { path: '/', element: <HomeRedirect /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'manager', element: <ManagerDashboardPage /> },
        { path: 'store', element: <ClientStorePage /> },
        { path: 'cart', element: <CartPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'orders', element: <OrdersPage /> },
        { path: 'clients', element: <ClientsPage /> },
        { path: 'ceremonies', element: <CeremoniesPage /> },
        { path: 'resources', element: <ResourcesPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'catalog', element: <StorePage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ]);

  return element;
}
