import { useCallback } from 'react';
import { Alert } from 'react-native';
import { reportUser } from '@/lib/api/users';
import { blockUser } from '@/lib/services/blockUserService';
import { addReport } from '@/lib/services/reportQueueService';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';

export interface ReportBlockUser {
  id: string;
  name: string;
  handle?: string;
  avatar?: string | null;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment or bullying',
  'Inappropriate content',
  'Misinformation',
  'Other',
] as const;

export function useReportBlock(options?: { onReported?: () => void; onBlocked?: () => void; showToast?: (message: string, type: 'success' | 'error') => void }) {
  const showToast = options?.showToast;
  const onReported = options?.onReported;
  const onBlocked = options?.onBlocked;

  const handleReport = useCallback(
    async (user: ReportBlockUser) => {
      return new Promise<string | null>((resolve) => {
        Alert.alert(
          'Report',
          `Why are you reporting ${user.name || user.handle || 'this user'}?`,
          [
            ...REPORT_REASONS.map((reason) => ({
              text: reason,
              onPress: () => resolve(reason),
            })),
            { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
          ]
        );
      });
    },
    []
  );

  const handleBlock = useCallback(
    async (user: ReportBlockUser) => {
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Block User',
          `Block ${user.name || user.handle || 'this user'}? They won't be able to message you or see your profile.`,
          [
            { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(false) },
            {
              text: 'Block',
              style: 'destructive' as const,
              onPress: () => resolve(true),
            },
          ]
        );
      });
    },
    []
  );

  const reportUserAction = useCallback(
    async (user: ReportBlockUser): Promise<void> => {
      const reason = await handleReport(user);
      if (!reason) return;
      try {
        const uid = getCurrentUserIdOrFallback();
        await reportUser(uid, user.id, reason);
        await addReport({
          type: 'user',
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserHandle: user.handle,
          reason,
          reporterId: uid,
        });
        showToast?.('Report submitted. We\'ll review it.', 'success');
        onReported?.();
      } catch {
        showToast?.('Failed to submit report', 'error');
      }
    },
    [handleReport, showToast, onReported]
  );

  const blockUserAction = useCallback(
    async (user: ReportBlockUser): Promise<void> => {
      const confirmed = await handleBlock(user);
      if (!confirmed) return;
      try {
        await blockUser(
          user.id,
          user.name,
          user.handle || `@user${user.id}`,
          user.avatar
        );
        showToast?.('User blocked', 'success');
        onBlocked?.();
      } catch {
        showToast?.('Failed to block user', 'error');
      }
    },
    [handleBlock, showToast, onBlocked]
  );

  /** Returns menu options to append to any action sheet: Report and Block (for non-current user) */
  const getReportBlockOptions = useCallback(
    (user: ReportBlockUser | null | undefined): Array<{ text: string; style?: 'default' | 'destructive' | 'cancel'; onPress: () => void }> => {
      if (!user || user.id === getCurrentUserIdOrFallback() || user.id === '1') return [];
      return [
        {
          text: 'Report',
          onPress: () => reportUserAction(user),
        },
        {
          text: 'Block',
          style: 'destructive' as const,
          onPress: () => blockUserAction(user),
        },
      ];
    },
    [reportUserAction, blockUserAction]
  );

  return {
    getReportBlockOptions,
    reportUser: reportUserAction,
    blockUser: blockUserAction,
  };
}
