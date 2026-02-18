import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';

/** Current signed-in user id for UI. Prefer this over CURRENT_USER_ID in components. */
export function useCurrentUserId(): string {
  const { user } = useAuth();
  return user?.uid ?? getCurrentUserIdOrFallback();
}
