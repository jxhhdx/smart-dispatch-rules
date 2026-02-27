import request from '@/utils/request'
import type { DashboardStats, DashboardTrends, RuleTriggerStat, RiderPerformance, HeatmapData, RealtimeData } from '@/types'

export const getStats = (): Promise<DashboardStats> => {
  return request.get('/dashboard/stats')
}

export const getTrends = (): Promise<DashboardTrends> => {
  return request.get('/dashboard/trends')
}

export const getRuleStats = (): Promise<RuleTriggerStat[]> => {
  return request.get('/dashboard/rule-stats')
}

export const getRiderPerformance = (): Promise<RiderPerformance[]> => {
  return request.get('/dashboard/rider-performance')
}

export const getHeatmap = (): Promise<HeatmapData[]> => {
  return request.get('/dashboard/heatmap')
}

export const getRealtime = (): Promise<RealtimeData> => {
  return request.get('/dashboard/realtime')
}
