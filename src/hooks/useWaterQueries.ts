import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toDateStr } from './useWaterData';
import { appQueryKeys } from '@/lib/queryKeys';
import {
  fetchWaterLogs,
  recordHydrationEvent,
  deleteWaterLog,
  updateWaterLog,
} from '@/services/water.service';

const todayFn = () => toDateStr();

export function useWaterLogsQuery(userId: string | undefined, day?: string) {
  return useQuery({
    queryKey: appQueryKeys.waterLogs(userId, day ?? todayFn()),
    queryFn: () => fetchWaterLogs(userId!, day ?? todayFn()),
    enabled: !!userId && userId.length >= 30,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useRecordHydrationMutation() {
  return useMutation({
    mutationFn: recordHydrationEvent,
  });
}

export function useDeleteWaterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; userId: string; day: string }) => {
      await deleteWaterLog(params.id, params.userId);
      return params;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appQueryKeys.waterLogs(data.userId, data.day) });
    },
  });
}

export function useUpdateWaterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      userId: string;
      day: string;
      amount: number;
      exp: number;
    }) => {
      await updateWaterLog(params.id, params.userId, { amount: params.amount, exp: params.exp });
      return params;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appQueryKeys.waterLogs(data.userId, data.day) });
    },
  });
}
