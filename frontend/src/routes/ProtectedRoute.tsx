import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProfileQuery } from '../api/hooks';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const storedRoles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const enabled = Boolean(accessToken);
  const { isLoading } = useProfileQuery({ enabled });

  useEffect(() => {
    if (!accessToken) {
      useAuthStore.getState().logout();
    }
  }, [accessToken]);

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  const activeRoles = user?.roles?.length ? user.roles : storedRoles;
  const isGuestOnly = activeRoles.includes('guest') && activeRoles.length === 1;
  const isClient = activeRoles.includes('client') && !activeRoles.includes('admin') && !activeRoles.includes('manager');
  const isManager = activeRoles.includes('manager') && !activeRoles.includes('admin');
  
  if (isGuestOnly && !location.pathname.startsWith('/catalog') && !location.pathname.startsWith('/store')) {
    return <Navigate to="/catalog" replace />;
  }
  
  if (isClient && !location.pathname.startsWith('/store') && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/cart') && !location.pathname.startsWith('/profile')) {
    return <Navigate to="/store" replace />;
  }
  
  if (isManager && !location.pathname.startsWith('/manager') && !location.pathname.startsWith('/orders') && !location.pathname.startsWith('/clients') && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/profile')) {
    return <Navigate to="/manager" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
