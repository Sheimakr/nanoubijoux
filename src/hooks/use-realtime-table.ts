'use client';

import { useEffect, useRef } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * Postgres change events supported by Supabase Realtime.
 * Use '*' to listen to INSERT + UPDATE + DELETE at once.
 */
type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableOptions<T extends Record<string, unknown>> {
  /** Table name in the `public` schema (e.g. 'orders', 'products'). */
  table: string;

  /** Which Postgres event(s) to subscribe to. Default: '*' (all). */
  event?: ChangeEvent;

  /**
   * Callback fired on every matching event. The payload includes
   * `eventType`, `new` (INSERT/UPDATE), and `old` (UPDATE/DELETE).
   *
   * The reference is stashed in a ref internally, so inline closures
   * that capture local state are safe — they won't tear down the
   * subscription on every render.
   */
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void;

  /** Toggle the subscription without unmounting. Default: true. */
  enabled?: boolean;
}

/**
 * Subscribe to Postgres changes on a Supabase table.
 *
 * Opens one Realtime channel (`rt:<table>`) on mount and cleanly
 * removes it on unmount. Re-uses the same channel across renders.
 *
 * Prerequisites (fail silently if missing):
 *   1. Table is in the `supabase_realtime` publication:
 *        ALTER PUBLICATION supabase_realtime ADD TABLE <table>;
 *   2. RLS lets the current client role SELECT the rows.
 *      If RLS blocks SELECT, Realtime drops events with no error.
 *
 * Example:
 *   useRealtimeTable<Order>({
 *     table: 'orders',
 *     onChange: (p) => {
 *       if (p.eventType === 'INSERT') toast.success(`New order #${p.new.id}`);
 *       refetch();
 *     },
 *   });
 */
export function useRealtimeTable<T extends Record<string, unknown>>({
  table,
  event = '*',
  onChange,
  enabled = true,
}: UseRealtimeTableOptions<T>) {
  // Keep the latest callback in a ref so a new onChange identity per
  // render doesn't resubscribe the channel. Only table/event/enabled do.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel(`rt:${table}`)
      .on(
        // 'postgres_changes' is Supabase Realtime's Postgres-replication
        // feature — streams row-level changes from the publication.
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) =>
          onChangeRef.current(payload as RealtimePostgresChangesPayload<T>),
      )
      .subscribe();

    return () => {
      // Remove the channel on unmount / dep change.
      // Safe to call multiple times; Supabase no-ops if already removed.
      supabase.removeChannel(channel);
    };
  }, [table, event, enabled]);
}
