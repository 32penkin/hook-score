import { ComponentType } from 'react';
import { ArrowLeft, CheckCircle2, Lightbulb, Sparkles, Target, Zap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../../../shared/components/icon-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import { radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import {
  HookAnalysisResult,
  HookGoal,
  PreparedVideoClip,
} from '../../../shared/types/video.types';

type AnalysisResultCopy = {
  title: string;
  subtitle: string;
  empty: string;
  back: string;
  score: string;
  clarity: string;
  pace: string;
  goalFit: string;
  selectedGoals: string;
  rewrite: string;
  firstFrameText: string;
  observations: string;
  nextSteps: string;
  nextStepOpening: string;
  nextStepPayoff: string;
  nextStepGoal: string;
  window: string;
};

type AnalysisResultScreenProps = {
  copy: AnalysisResultCopy;
  result: HookAnalysisResult | null;
  clip: PreparedVideoClip | null;
  goalLabels: Record<HookGoal, string>;
  onBack: () => void;
};

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export function AnalysisResultScreen({
  copy,
  result,
  clip,
  goalLabels,
  onBack,
}: AnalysisResultScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenContainer>
      <IconButton icon={ArrowLeft} label={copy.back} onPress={onBack} />

      <View style={styles.headerText}>
        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>
      </View>

      {!result ? (
        <View
          style={[
            styles.emptyBox,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Sparkles color={colors.textSubtle} size={28} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{copy.empty}</Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.scorePanel,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View>
              <Text style={[styles.scoreLabel, { color: colors.textSubtle }]}>{copy.score}</Text>
              <Text style={[styles.scoreValue, { color: colors.accent }]}>{result.score}</Text>
            </View>
            <View style={styles.scoreMeta}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {copy.window}: {clip ? `${Math.round(clip.windowDurationMs / 1000)}s` : '-'}
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {copy.selectedGoals}: {result.goals.map((goal) => goalLabels[goal]).join(', ') || '-'}
              </Text>
            </View>
          </View>

          <View style={styles.subscores}>
            <ScoreTile icon={CheckCircle2} label={copy.clarity} value={result.subscores.clarity} />
            <ScoreTile icon={Zap} label={copy.pace} value={result.subscores.pace} />
            <ScoreTile icon={Target} label={copy.goalFit} value={result.subscores.goalFit} />
          </View>

          <View
            style={[
              styles.section,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Lightbulb color={colors.amber} size={18} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.rewrite}</Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.textMuted }]}>{result.rewrite}</Text>
          </View>

          {result.firstFrameText ? (
            <View
              style={[
                styles.section,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {copy.firstFrameText}
              </Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                {result.firstFrameText}
              </Text>
            </View>
          ) : null}

          {result.observations?.length ? (
            <View
              style={[
                styles.section,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {copy.observations}
              </Text>
              {result.observations.map((observation) => (
                <Text key={observation} style={[styles.bodyText, { color: colors.textMuted }]}>
                  {observation}
                </Text>
              ))}
            </View>
          ) : null}

          <View
            style={[
              styles.section,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.nextSteps}</Text>
            {(result.improvements?.length
              ? result.improvements
              : [copy.nextStepOpening, copy.nextStepPayoff, copy.nextStepGoal]
            ).map((step) => (
              <Text key={step} style={[styles.bodyText, { color: colors.textMuted }]}>
                {step}
              </Text>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function ScoreTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  value: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.scoreTile,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Icon color={colors.sky} size={18} />
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  scorePanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  scoreLabel: {
    fontSize: typography.micro,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '900',
  },
  scoreMeta: {
    gap: spacing.sm,
  },
  metaText: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  subscores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreTile: {
    flex: 1,
    minWidth: 96,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tileLabel: {
    fontSize: typography.micro,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tileValue: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  bodyText: {
    fontSize: typography.body,
    lineHeight: 24,
  },
});
