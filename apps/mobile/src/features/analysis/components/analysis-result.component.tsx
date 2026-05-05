import { ComponentType } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Lightbulb,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../../../shared/components/icon-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import { AppColors, radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import { HookAnalysisResult, HookGoal } from '../../../shared/types/video.types';

type AnalysisResultCopy = {
  title: string;
  subtitle: string;
  empty: string;
  back: string;
  score: string;
  clarity: string;
  specificity: string;
  payoffSpeed: string;
  curiosity: string;
  audienceFit: string;
  visualTextMatch: string;
  scrollResistance: string;
  selectedGoals: string;
  verdict: string;
  mainProblem: string;
  bestFix: string;
  tryHooks: string;
  firstFrameText: string;
  subscores: string;
  details: string;
  observations: string;
  nextSteps: string;
};

type AnalysisResultScreenProps = {
  copy: AnalysisResultCopy;
  result: HookAnalysisResult | null;
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
        <ResultContent copy={copy} goalLabels={goalLabels} result={result} />
      )}
    </ScreenContainer>
  );
}

function ResultContent({
  copy,
  goalLabels,
  result,
}: {
  copy: AnalysisResultCopy;
  goalLabels: Record<HookGoal, string>;
  result: HookAnalysisResult;
}) {
  const { colors } = useAppTheme();
  const scoreColor = getScoreColor(result.score, colors);
  const verdict = result.verdict || getFallbackVerdict(result.score);
  const rewrites = getRewriteOptions(result);
  const goals = result.goals.map((goal) => goalLabels[goal]).join(', ');

  return (
    <>
      <View
        style={[
          styles.scorePanel,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.scoreLabel, { color: colors.textSubtle }]}>{copy.score}</Text>
        <View style={styles.scoreLine}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{result.score}</Text>
          <Text style={[styles.verdict, { color: colors.text }]}>- {verdict}</Text>
        </View>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          {copy.selectedGoals}: {goals || '-'}
        </Text>
      </View>

      <View style={styles.insightGrid}>
        <InsightBlock
          icon={Target}
          label={copy.mainProblem}
          text={result.mainProblem}
          tone={colors.coral}
        />
        <InsightBlock
          icon={Lightbulb}
          label={copy.bestFix}
          text={result.bestFix}
          tone={colors.amber}
        />
      </View>

      {rewrites.length ? (
        <View
          style={[
            styles.section,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Zap color={colors.sky} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.tryHooks}</Text>
          </View>
          {rewrites.map((rewrite, index) => (
            <View
              key={`${rewrite}-${index}`}
              style={[
                styles.rewriteCard,
                { borderColor: colors.border, backgroundColor: colors.backgroundSoft },
              ]}
            >
              <View style={[styles.rewriteIndex, { backgroundColor: scoreColor }]}>
                <Text style={[styles.rewriteIndexText, { color: colors.black }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.rewriteText, { color: colors.text }]}>{rewrite}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {result.firstFrameText ? (
        <View
          style={[
            styles.section,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Eye color={colors.sky} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {copy.firstFrameText}
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            {result.firstFrameText}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.subscores}</Text>
        <View style={styles.subscores}>
          <ScoreTile icon={CheckCircle2} label={copy.clarity} value={result.subscores.clarity} />
          <ScoreTile icon={Target} label={copy.specificity} value={result.subscores.specificity} />
          <ScoreTile icon={Zap} label={copy.payoffSpeed} value={result.subscores.payoffSpeed} />
          <ScoreTile icon={Lightbulb} label={copy.curiosity} value={result.subscores.curiosity} />
          <ScoreTile icon={Target} label={copy.audienceFit} value={result.subscores.audienceFit} />
          <ScoreTile icon={Eye} label={copy.visualTextMatch} value={result.subscores.visualTextMatch} />
          <ScoreTile icon={Sparkles} label={copy.scrollResistance} value={result.subscores.scrollResistance} />
        </View>
      </View>

      {result.observations?.length || result.improvements?.length ? (
        <View
          style={[
            styles.section,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.details}</Text>
          {result.observations?.length ? (
            <DetailGroup label={copy.observations} values={result.observations} />
          ) : null}
          {result.improvements?.length ? (
            <DetailGroup label={copy.nextSteps} values={result.improvements} />
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function InsightBlock({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  text: string;
  tone: string;
}) {
  const { colors } = useAppTheme();

  if (!text) {
    return null;
  }

  return (
    <View
      style={[
        styles.insightBlock,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Icon color={tone} size={18} />
        <Text style={[styles.insightLabel, { color: colors.textSubtle }]}>{label}</Text>
      </View>
      <Text style={[styles.insightText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function ScoreTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  value?: number;
}) {
  const { colors } = useAppTheme();
  const hasValue = typeof value === 'number';
  const valueColor = hasValue ? getScoreColor(value, colors) : colors.textSubtle;

  return (
    <View
      style={[
        styles.scoreTile,
        { borderColor: colors.border, backgroundColor: colors.backgroundSoft },
      ]}
    >
      <Icon color={colors.sky} size={18} />
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: valueColor }]}>{hasValue ? value : '-'}</Text>
    </View>
  );
}

function DetailGroup({ label, values }: { label: string; values: string[] }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.detailGroup}>
      <Text style={[styles.detailLabel, { color: colors.textSubtle }]}>{label}</Text>
      {values.map((value) => (
        <Text key={value} style={[styles.bodyText, { color: colors.textMuted }]}>
          {value}
        </Text>
      ))}
    </View>
  );
}

function getRewriteOptions(result: HookAnalysisResult) {
  if (result.rewrites?.length) {
    return result.rewrites.slice(0, 3);
  }

  if (result.rewrite) {
    return [result.rewrite];
  }

  return [];
}

export function getScoreColor(score: number, colors: AppColors) {
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

export function getFallbackVerdict(score: number) {
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
    gap: spacing.md,
  },
  scoreLabel: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
  },
  verdict: {
    flex: 1,
    minWidth: 160,
    paddingBottom: spacing.sm,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  metaText: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  insightGrid: {
    gap: spacing.sm,
  },
  insightBlock: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  insightLabel: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '800',
  },
  rewriteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  rewriteIndex: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewriteIndexText: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  rewriteText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 23,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  subscores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreTile: {
    flex: 1,
    minWidth: 132,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tileLabel: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tileValue: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  detailGroup: {
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
