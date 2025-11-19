import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { PaginatedResponse } from './client';
import { useAuthStore, type AuthRole } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

export interface Order {
  id: string;
  contractNumber: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  client: { fullName: string };
  deceased: { fullName: string };
}

export interface DashboardResponse {
  kpis: {
    activeOrders: number;
    completedOrders: number;
    upcomingCeremonies: number;
    totalRevenue: number;
  };
  activeOrders: unknown[];
  financial: unknown[];
  inventory: unknown[];
  inventoryPressure: { name: string; load: number }[];
}

export interface Client {
  id: string;
  fullName: string;
  contactEmail?: string;
  contactPhone?: string;
  isVip: boolean;
  deceasedRelations?: Array<{ id: string; fullName: string }>;
}

export interface ServicePackage {
  id: string;
  nameRu: string;
  nameEn?: string;
  currency: string;
  basePrice: number;
  services: Array<{
    service: {
      id: string;
      nameRu: string;
      nameEn?: string;
      basePrice: number;
    };
    quantity: number;
  }>;
}

export interface CatalogService {
  id: string;
  nameRu: string;
  nameEn?: string;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  basePrice: number;
  currency: string;
}

export interface AssignStaffPayload {
  staffId: string;
  role: string;
}

export interface AssignVehiclePayload {
  vehicleId: string;
  driverId: string | null;
  startAt: string;
  endAt: string;
  notes?: string | null;
}

export interface AssignInventoryPayload {
  inventoryId: string;
  quantity: number;
  notes?: string | null;
}

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        roles: data.roles ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRequestRegistrationCodeMutation = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const { data } = await api.post('/auth/request-registration-code', payload);
      return data;
    },
  });
};

export const useRegisterWithCodeMutation = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown> & { code: string }) => {
      const { data } = await api.post('/auth/register-with-code', payload);
      return data;
    },
    onSuccess: (data) => {
      setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        roles: data.roles ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        roles: data.roles ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useProfileQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      useAuthStore.getState().setUser({
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: Array.isArray(data.roles) ? (data.roles as Array<{ code: string }>).map((role) => role.code as AuthRole) : [],
      });
      useSettingsStore.getState().updateSettings({
        language: data.profile?.preferredLanguage ?? 'ru',
        dateFormat: data.profile?.dateFormat ?? 'dd.MM.yyyy',
        numberFormat: data.profile?.numberFormat ?? '1 234,56',
        pageSize: data.profile?.pageSize ?? 20,
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });

export const useDashboardQuery = () =>
  useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data;
    },
  });

export const useOrdersQuery = (params: { page?: number; limit?: number } = {}) =>
  useQuery<PaginatedResponse<Order>>({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });

export const useClientsQuery = (params: { page?: number; limit?: number } = {}) =>
  useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', params],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params });
      return data;
    },
  });

export const useCeremoniesQuery = () =>
  useQuery({
    queryKey: ['ceremonies'],
    queryFn: async () => {
      const { data } = await api.get('/ceremonies/schedule');
      return data;
    },
  });

export const useResourcesQuery = () =>
  useQuery<{ staff: unknown[]; vehicles: unknown[]; inventory: unknown[] }>({
    queryKey: ['resources'],
    queryFn: async () => {
      const [staff, vehicles, inventory] = await Promise.all([
        api.get('/resources/staff').then((r) => r.data as unknown[]),
        api.get('/resources/vehicles').then((r) => r.data as unknown[]),
        api.get('/resources/inventory').then((r) => r.data as unknown[]),
      ]);
      return { staff, vehicles, inventory };
    },
  });

export const useAnalyticsOrdersQuery = () =>
  useQuery({
    queryKey: ['analytics', 'orders'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/orders');
      return data;
    },
  });

export const useAnalyticsFinancialQuery = () =>
  useQuery({
    queryKey: ['analytics', 'financial'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/financial');
      return data;
    },
  });

export const useAnalyticsInventoryQuery = () =>
  useQuery({
    queryKey: ['analytics', 'inventory'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/inventory');
      return data;
    },
  });

export const useCatalogQuery = () =>
  useQuery<{ categories: unknown[]; services: CatalogService[]; packages: ServicePackage[] }>({
    queryKey: ['catalog'],
    queryFn: async () => {
      const [categories, services, packages] = await Promise.all([
        api.get('/catalog/categories').then((r) => r.data as unknown[]),
        api.get('/catalog/services').then((r) => r.data as CatalogService[]),
        api.get('/catalog/packages').then((r) => r.data as ServicePackage[]),
      ]);
      return { categories, services, packages };
    },
    staleTime: 1000 * 60 * 10,
  });

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings/preferences');
      return data;
    },
  });

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch('/settings/preferences', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useSendOrderMutation = () => {
  return useMutation({
    mutationFn: async (payload: {
      phone: string;
      items: Array<{ id: string; name: string; type: 'service' | 'package'; quantity: number; price: number; currency: string }>;
      total: number;
      currency: string;
      userName?: string;
    }) => {
      const { data } = await api.post('/telegram/send-order', payload);
      return data;
    },
  });
};

export const useSyncCartMutation = () => {
  return useMutation({
    mutationFn: async (payload: {
      phone: string;
      items: Array<{ id: string; name: string; type: 'service' | 'package'; quantity: number; price: number; currency: string; description?: string }>;
      total: number;
      currency: string;
    }) => {
      const { data } = await api.post('/telegram/sync-cart', payload);
      return data;
    },
  });
};

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/clients', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useAssignResourcesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ceremonyId: string; staff: AssignStaffPayload[]; vehicles: AssignVehiclePayload[]; inventory: AssignInventoryPayload[] }) => {
      const { ceremonyId, ...body } = payload;
      const { data } = await api.post(`/ceremonies/${ceremonyId}/assign`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceremonies'] });
    },
  });
};

