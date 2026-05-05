import {
  ImagePlus,
  Settings,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../shared/components/app-button.component';
import { IconButton } from '../../../shared/components/icon-button.component';
import { InfoPill } from '../../../shared/components/info-pill.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import {
  MultiSegmentedControl,
  SegmentOption,
} from '../../../shared/components/segmented-control.component';
import { TextField } from '../../../shared/components/text-field.component';
import { radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import {
  HookContext,
  HookGoal,
  PreparedVideoClip,
  VideoAsset,
} from '../../../shared/types/video.types';
import { formatMilliseconds } from '../../../shared/utils/format';

type VideoPrepCopy = {
  title: string;
  subtitle: string;
  settings: string;
  contextTitle: string;
  hookText: string;
  hookTextPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  audience: string;
  audiencePlaceholder: string;
  niche: string;
  nichePlaceholder: string;
  goal: string;
  optionalSubtitle: string;
  firstFrameContext: string;
  firstFrameContextPlaceholder: string;
  pickVideo: string;
  repickVideo: string;
  selected: string;
  visualContextAdded: string;
  noVideo: string;
  sourceLoading: string;
  ready: string;
  duration: string;
  analyze: string;
  todayUsage: string;
  usageLoading: string;
  dailyLimitReached: string;
  clear: string;
};

type VideoPrepScreenProps = {
  copy: VideoPrepCopy;
  userName: string;
  goalOptions: SegmentOption<HookGoal>[];
  context: HookContext;
  selectedVideo: VideoAsset | null;
  preparedClip: PreparedVideoClip | null;
  error?: string | null;
  isSourceLoading: boolean;
  isPreparing: boolean;
  isAnalyzing: boolean;
  isUsageLoading: boolean;
  canAnalyze: boolean;
  todayAnalysisCount: number;
  todayAnalysisLimit: number;
  hasReachedDailyAnalysisLimit: boolean;
  onContextChange: (
    field: 'hookText' | 'videoDescription' | 'targetAudience' | 'niche' | 'firstFrameContext',
    value: string
  ) => void;
  onGoalToggle: (goal: HookGoal) => void;
  onPickVideo: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onOpenSettings: () => void;
};

export function VideoPrepScreen({
  copy,
  userName,
  goalOptions,
  context,
  selectedVideo,
  preparedClip,
  error,
  isSourceLoading,
  isPreparing,
  isAnalyzing,
  isUsageLoading,
  canAnalyze,
  todayAnalysisCount,
  todayAnalysisLimit,
  hasReachedDailyAnalysisLimit,
  onContextChange,
  onGoalToggle,
  onPickVideo,
  onClear,
  onAnalyze,
  onOpenSettings,
}: VideoPrepScreenProps) {
  const { colors } = useAppTheme();
  const videoActionsDisabled = isSourceLoading || isAnalyzing;

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: colors.accent }]}>{userName}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>
        <IconButton
          disabled={videoActionsDisabled}
          icon={Settings}
          label={copy.settings}
          onPress={onOpenSettings}
        />
      </View>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>

      <View style={styles.metricsRow}>
        <InfoPill
          label={copy.todayUsage}
          tone="sky"
          value={isUsageLoading ? copy.usageLoading : `${todayAnalysisCount}/${todayAnalysisLimit}`}
        />
      </View>

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.contextTitle}</Text>
        <TextField
          editable={!videoActionsDisabled}
          label={copy.hookText}
          onChangeText={(value) => onContextChange('hookText', value)}
          placeholder={copy.hookTextPlaceholder}
          style={styles.hookInput}
          value={context.hookText}
        />
        <TextField
          editable={!videoActionsDisabled}
          label={copy.description}
          multiline
          onChangeText={(value) => onContextChange('videoDescription', value)}
          placeholder={copy.descriptionPlaceholder}
          value={context.videoDescription}
        />
        <TextField
          editable={!videoActionsDisabled}
          label={copy.niche}
          onChangeText={(value) => onContextChange('niche', value)}
          placeholder={copy.nichePlaceholder}
          value={context.niche}
        />
        <TextField
          editable={!videoActionsDisabled}
          label={copy.audience}
          onChangeText={(value) => onContextChange('targetAudience', value)}
          placeholder={copy.audiencePlaceholder}
          value={context.targetAudience}
        />
        <Text style={[styles.label, { color: colors.textMuted }]}>{copy.goal}</Text>
        <MultiSegmentedControl
          disabled={videoActionsDisabled}
          options={goalOptions}
          value={context.goals}
          onToggle={onGoalToggle}
        />
      </View>

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.sectionHeader}>
          <ImagePlus color={colors.sky} size={18} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.selected}</Text>
        </View>
        <Text style={[styles.sectionCopy, { color: colors.textMuted }]}>
          {copy.optionalSubtitle}
        </Text>

        <TextField
          editable={!videoActionsDisabled}
          label={copy.firstFrameContext}
          multiline
          onChangeText={(value) => onContextChange('firstFrameContext', value)}
          placeholder={copy.firstFrameContextPlaceholder}
          value={context.firstFrameContext}
        />

        {selectedVideo ? (
          <View style={styles.sourceDetails}>
            <Text style={[styles.fileName, { color: colors.text }]}>
              {copy.visualContextAdded}
            </Text>
            <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
              {selectedVideo.fileName} · {copy.duration}: {formatMilliseconds(selectedVideo.durationMs)}
            </Text>
          </View>
        ) : (
          <Text style={[styles.empty, { color: colors.textSubtle }]}>{copy.noVideo}</Text>
        )}

        {isSourceLoading ? (
          <View
            style={[
              styles.loadingRow,
              { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
            ]}
          >
            <ActivityIndicator color={colors.sky} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {copy.sourceLoading}
            </Text>
          </View>
        ) : null}

        {preparedClip ? (
          <View style={[styles.readyRow, { backgroundColor: colors.surfaceElevated }]}>
            <Video color={colors.sky} size={18} />
            <Text style={[styles.readyText, { color: colors.text }]}>
              {copy.ready}
            </Text>
          </View>
        ) : null}

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {hasReachedDailyAnalysisLimit ? (
          <Text style={[styles.limitHint, { color: colors.amber }]}>
            {copy.dailyLimitReached}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            icon={ImagePlus}
            label={selectedVideo ? copy.repickVideo : copy.pickVideo}
            loading={isPreparing}
            onPress={onPickVideo}
            disabled={isAnalyzing}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton
          disabled={videoActionsDisabled}
          icon={Trash2}
          label={copy.clear}
          onPress={onClear}
          style={styles.actionButton}
          variant="secondary"
        />
        <AppButton
          disabled={!canAnalyze}
          icon={Sparkles}
          label={copy.analyze}
          loading={isAnalyzing}
          onPress={onAnalyze}
          style={styles.actionButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
    flexShrink: 1,
  },
  kicker: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
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
  sectionCopy: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  hookInput: {
    minHeight: 64,
    fontSize: 18,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  sourceDetails: {
    gap: spacing.sm,
  },
  fileName: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  detailText: {
    fontSize: typography.small,
  },
  empty: {
    fontSize: typography.body,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  loadingText: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  readyText: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
  error: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  limitHint: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 150,
  },
});
