/**
 * Extract a human-readable error message from any error type.
 * Handles: Error objects, Supabase error objects ({message, code, details}),
 * plain strings, and unknown objects.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return 'Erreur inconnue';

  // Standard Error
  if (err instanceof Error) return err.message;

  // Supabase/PostgREST error object: { message: string, code?: string, details?: string }
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.length > 0) return obj.message;
    if (typeof obj.error === 'string' && obj.error.length > 0) return obj.error;
    if (typeof obj.details === 'string' && obj.details.length > 0) return obj.details;
    // Try JSON.stringify but avoid empty {}
    const json = JSON.stringify(obj);
    if (json && json !== '{}') return json;
  }

  // Plain string
  if (typeof err === 'string') return err;

  return 'Erreur inconnue';
}
