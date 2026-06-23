import { useEffect, useCallback, useRef } from 'react';
import { supabase, getActiveSchema } from '../../../lib/supabaseClient';
import type { AssignmentStatus } from '../services/assignmentService';

export interface AssignmentChangePayload {
  id: string;
  case_id: string;
  status: AssignmentStatus;
  assigned_by: string;
  assigned_to: string;
}

interface Options {
  /** uid of the currently logged-in user */
  currentUserId: string | undefined;
  /** fired when an assignment the doctor created changes status */
  onDoctorUpdate?: (payload: AssignmentChangePayload) => void;
  /** fired when an assignment sent to the radiologist changes */
  onRadiologistUpdate?: (payload: AssignmentChangePayload) => void;
}

const NOTIFY_STATUSES: AssignmentStatus[] = [
  'accepted',
  'rejected',
  'more_info_requested',
];

export function useAssignmentRealtime({
  currentUserId,
  onDoctorUpdate,
  onRadiologistUpdate,
}: Options) {
  // Stable refs so the channel callback doesn't become stale
  const onDoctorRef      = useRef(onDoctorUpdate);
  const onRadiologistRef = useRef(onRadiologistUpdate);
  onDoctorRef.current      = onDoctorUpdate;
  onRadiologistRef.current = onRadiologistUpdate;

  const schema = getActiveSchema(); // 'dev' or 'public'

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`assignment-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema,
          table:  'case_assignments',
        },
        (event) => {
          const payload = event.new as AssignmentChangePayload;
          if (!payload?.status) return;

          const isNotifiableStatus = NOTIFY_STATUSES.includes(payload.status);
          if (!isNotifiableStatus) return;

          // Doctor: notified when assignment they sent got a response
          if (payload.assigned_by === currentUserId) {
            onDoctorRef.current?.(payload);
          }

          // Radiologist: notified when their assignment status changes
          if (payload.assigned_to === currentUserId) {
            onRadiologistRef.current?.(payload);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, schema]);
}

// Helper: build a toast-ready message from a realtime payload
export function useAssignmentNotifications(currentUserId: string | undefined) {
  const onUpdate = useCallback((
    payload: AssignmentChangePayload,
    addToast: (p: AssignmentChangePayload) => void,
    reloadFn?: () => void,
  ) => {
    addToast(payload);
    reloadFn?.();
  }, []);

  return { onUpdate };
}
