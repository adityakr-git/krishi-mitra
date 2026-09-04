import { db } from '../db';

/**
 * Deterministic Wait Time Calculation Algorithm for Mandi Queue
 * 
 * Formula:
 *   WaitTime = Math.round((queue_length * average_processing_time) / active_counters)
 * 
 * @param mandiId Identifier of the APMC procurement center
 * @returns Estimated waiting time in integer minutes
 */
export function calculateWaitTime(mandiId: string): number {
  const mandi = db.getMandi(mandiId);
  if (!mandi) {
    return 15; // Safe default
  }

  const queueLength = mandi.currentQueueLength;
  const avgProcessingTime = mandi.avgProcessingTimeMins || 6.0;
  const activeCounters = Math.max(1, mandi.activeWeighbridges || 2);

  if (queueLength <= 0) {
    return 0;
  }

  const estimatedMinutes = Math.round((queueLength * avgProcessingTime) / activeCounters);
  return Math.max(1, estimatedMinutes);
}
