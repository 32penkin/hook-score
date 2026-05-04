import { ArrowLeft, Clock3 } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VideoAnalyzerHistoryItem } from '../../../services/usage/video-analyzer-usage.service';
import { IconButton } from '../../../shared/components/icon-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import { radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import { HookGoal } from '../../../shared/types/video.types';

type HistoryCopy = {
  title: string;
  subtitle: string;
  empty: string;
  back: string;
  itemGoal: string;
  clipWindow: string;
  loading: string;
  score: string;
  rewrite: string;
};

type HistoryScreenProps = {
  copy: HistoryCopy;
  records: VideoAnalyzerHistoryItem[];
  isLoading: boolean;
  error?: string | null;
  goalLabels: Record<HookGoal, string>;
  onBack: () => void;
};

export function HistoryScreen({
  copy,
  records,
  isLoading,
  error,
  goalLabels,
  onBack,
}: HistoryScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton icon={ArrowLeft} label={copy.back} onPress={onBack} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      {isLoading ? (
        <View
          style={[
            styles.emptyBox,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{copy.loading}</Text>
        </View>
      ) : records.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Clock3 color={colors.textSubtle} size={28} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{copy.empty}</Text>
        </View>
      ) : (
        records.map((record) => (
          <View
            key={record.id}
            style={[
              styles.record,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.recordHeader}>
              <Text style={[styles.fileName, { color: colors.text }]}>{record.clip.fileName}</Text>
              <Text style={[styles.score, { color: colors.accent }]}>
                {copy.score}: {record.result.score}
              </Text>
            </View>
            <Text style={[styles.meta, { color: colors.accent }]}>
              {copy.clipWindow}: {Math.round(record.clip.windowStartMs / 1000)}-
              {Math.round((record.clip.windowStartMs + record.clip.windowDurationMs) / 1000)}s ·{' '}
              {copy.itemGoal}: {record.result.goals.map((goal) => goalLabels[goal]).join(', ') || '-'}
            </Text>
            <Text style={[styles.date, { color: colors.textSubtle }]}>
              {formatHistoryDate(record.createdAt)}
            </Text>
            <Text style={[styles.hook, { color: colors.textMuted }]} numberOfLines={2}>
              {record.context.hookText || record.context.videoDescription}
            </Text>
            <Text style={[styles.rewriteLabel, { color: colors.textSubtle }]}>{copy.rewrite}</Text>
            <Text style={[styles.hook, { color: colors.textMuted }]} numberOfLines={3}>
              {record.result.rewrite}
            </Text>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
  },
  headerText: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  emptyBox: {
    minHeight: 180,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  record: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fileName: {
    flex: 1,
    minWidth: 160,
    fontSize: typography.body,
    fontWeight: '900',
  },
  score: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  meta: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  date: {
    fontSize: typography.micro,
    fontWeight: '800',
  },
  rewriteLabel: {
    marginTop: spacing.xs,
    fontSize: typography.micro,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  hook: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  error: {
    fontSize: typography.small,
    fontWeight: '800',
  },
});

function formatHistoryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
