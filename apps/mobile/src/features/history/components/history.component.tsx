import { ArrowLeft, Clock3 } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { VideoAnalyzerHistoryItem } from '../../../services/usage/video-analyzer-usage.service';
import { IconButton } from '../../../shared/components/icon-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import { AppColors, radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import { HookGoal } from '../../../shared/types/video.types';

type HistoryCopy = {
  title: string;
  subtitle: string;
  empty: string;
  back: string;
  itemGoal: string;
  loading: string;
  score: string;
  bestFix: string;
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
        records.map((record) => {
          const scoreColor = getScoreColor(record.result.score, colors);
          const verdict = record.result.verdict || getFallbackVerdict(record.result.score);
          const goals = record.result.goals.map((goal) => goalLabels[goal]).join(', ');
          const bestFix =
            record.result.bestFix || record.result.rewrite || record.result.improvements?.[0];

          return (
            <View
              key={record.id}
              style={[
                styles.record,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.recordHeader}>
                <Text style={[styles.hookTitle, { color: colors.text }]} numberOfLines={2}>
                  {getHistoryTitle(record)}
                </Text>
                <Text style={[styles.score, { color: scoreColor }]}>
                  {record.result.score}
                </Text>
              </View>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {copy.score} {record.result.score} · {verdict}
              </Text>
              <Text style={[styles.date, { color: colors.textSubtle }]}>
                {formatHistoryDate(record.createdAt)} · {copy.itemGoal}: {goals || '-'}
              </Text>
              {bestFix ? (
                <Text style={[styles.hook, { color: colors.textMuted }]} numberOfLines={2}>
                  {copy.bestFix}: {bestFix}
                </Text>
              ) : null}
              {record.clip.mode === 'client-trim-window' ? (
                <Text style={[styles.sourceMeta, { color: colors.textSubtle }]} numberOfLines={1}>
                  {record.clip.fileName}
                </Text>
              ) : null}
            </View>
          );
        })
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
  hookTitle: {
    flex: 1,
    minWidth: 160,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '800',
  },
  score: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  meta: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  date: {
    fontSize: typography.micro,
    fontWeight: '700',
  },
  hook: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  sourceMeta: {
    fontSize: typography.micro,
    lineHeight: 16,
  },
  error: {
    fontSize: typography.small,
    fontWeight: '800',
  },
});

function getHistoryTitle(record: VideoAnalyzerHistoryItem) {
  const source = record.context.hookText || record.context.videoDescription || 'Untitled hook';
  const compact = source.replace(/\s+/g, ' ').trim();

  return compact || 'Untitled hook';
}

function getScoreColor(score: number, colors: AppColors) {
  if (score >= 80) {
    return colors.accent;
  }

  if (score >= 60) {
    return colors.amber;
  }

  if (score >= 40) {
    return colors.orange;
  }

  return colors.coral;
}

function getFallbackVerdict(score: number) {
  if (score >= 80) {
    return 'strong hook';
  }

  if (score >= 60) {
    return 'promising';
  }

  if (score >= 40) {
    return 'weak but fixable';
  }

  return 'needs a sharper hook';
}

function formatHistoryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
