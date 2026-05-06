import {
  Gift,
  ImagePlus,
  LogIn,
  Mail,
  Settings,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react-native';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../shared/components/app-button.component';
import { DictationTextField } from '../../../shared/components/dictation-text-field.component';
import { IconButton } from '../../../shared/components/icon-button.component';
import { InfoPill } from '../../../shared/components/info-pill.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import {
  MultiSegmentedControl,
  SegmentOption,
} from '../../../shared/components/segmented-control.component';
import { TextField } from '../../../shared/components/text-field.component';
import { Locale } from '../../../shared/i18n/translations';
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
  dictate: string;
  dictationPermissionDeniedMessage: string;
  dictationPermissionDeniedTitle: string;
  dictationUnavailableMessage: string;
  dictationUnavailableTitle: string;
  hookText: string;
  hookTextPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  audience: string;
  audiencePlaceholder: string;
  niche: string;
  nichePlaceholder: string;
  goal: string;
  pickVideo: string;
  repickVideo: string;
  selected: string;
  visualContextAdded: string;
  noVideo: string;
  sourceLoading: string;
  ready: string;
  duration: string;
  stopDictation: string;
  analyze: string;
  todayUsage: string;
  usageLoading: string;
  dailyLimitReached: string;
  promoCodeTitle: string;
  promoCodeHint: string;
  promoCode: string;
  promoCodePlaceholder: string;
  promoCodeHelp: string;
  promoCodeEmailSubject: string;
  promoCodeEmailBody: string;
  redeemPromoCode: string;
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
  isGuest: boolean;
  todayAnalysisCount: number;
  todayAnalysisLimit: number;
  hasReachedDailyAnalysisLimit: boolean;
  promoCode: string;
  promoCodeFeedback?: string | null;
  isPromoCodeRedeeming: boolean;
  dictationLocale: Locale;
  canRedeemPromoCode: boolean;
  onContextChange: (
    field: 'hookText' | 'videoDescription' | 'targetAudience' | 'niche',
    value: string
  ) => void;
  onPromoCodeChange: (value: string) => void;
  onRedeemPromoCode: () => void;
  onGoalToggle: (goal: HookGoal) => void;
  onPickVideo: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onOpenSettings: () => void;
};

const PROMO_CODE_EMAIL = 'penkin.yauhen@gmail.com';

const buildPromoCodeEmailUrl = (subject: string, body: string) =>
  `mailto:${PROMO_CODE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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
  isGuest,
  todayAnalysisCount,
  todayAnalysisLimit,
  hasReachedDailyAnalysisLimit,
  promoCode,
  promoCodeFeedback,
  isPromoCodeRedeeming,
  dictationLocale,
  canRedeemPromoCode,
  onContextChange,
  onPromoCodeChange,
  onRedeemPromoCode,
  onGoalToggle,
  onPickVideo,
  onClear,
  onAnalyze,
  onOpenSettings,
}: VideoPrepScreenProps) {
  const { colors } = useAppTheme();
  const videoActionsDisabled = isSourceLoading || isAnalyzing;
  const HeaderActionIcon = isGuest ? LogIn : Settings;
  const showPromoCodeEntry = !isGuest && hasReachedDailyAnalysisLimit;
  const showBasicLimitHint = hasReachedDailyAnalysisLimit && !showPromoCodeEntry;
  const openPromoCodeEmail = () => {
    void Linking.openURL(
      buildPromoCodeEmailUrl(copy.promoCodeEmailSubject, copy.promoCodeEmailBody)
    ).catch(() => undefined);
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: colors.accent }]}>{userName}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>
        <IconButton
          disabled={videoActionsDisabled}
          icon={HeaderActionIcon}
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

      {showPromoCodeEntry ? (
        <View
          style={[
            styles.limitPanel,
            { borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <View style={styles.limitHeader}>
            <Gift color={colors.amber} size={18} />
            <Text style={[styles.limitTitle, { color: colors.text }]}>
              {copy.promoCodeTitle}
            </Text>
          </View>
          <Text style={[styles.limitCopy, { color: colors.textMuted }]}>
            {copy.dailyLimitReached}
          </Text>
          <Text style={[styles.limitCopy, { color: colors.textMuted }]}>
            {copy.promoCodeHint}
          </Text>
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isPromoCodeRedeeming && !isAnalyzing && !isUsageLoading}
            label={copy.promoCode}
            maxLength={19}
            onChangeText={onPromoCodeChange}
            placeholder={copy.promoCodePlaceholder}
            value={promoCode}
          />
          <View style={styles.promoActions}>
            <AppButton
              disabled={!canRedeemPromoCode}
              icon={Gift}
              label={copy.redeemPromoCode}
              loading={isPromoCodeRedeeming}
              onPress={onRedeemPromoCode}
            />
          </View>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={openPromoCodeEmail}
            style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
          >
            <Mail color={colors.textSubtle} size={16} />
            <Text style={[styles.contactText, { color: colors.textMuted }]}>
              {copy.promoCodeHelp}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {promoCodeFeedback ? (
        <Text
          style={[
            styles.promoFeedback,
            { color: hasReachedDailyAnalysisLimit ? colors.amber : colors.accent },
          ]}
        >
          {promoCodeFeedback}
        </Text>
      ) : null}

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.sectionAccent, { backgroundColor: colors.accent }]}
        />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.contextTitle}</Text>
        <DictationTextField
          dictateLabel={copy.dictate}
          dictationPermissionDeniedMessage={copy.dictationPermissionDeniedMessage}
          dictationPermissionDeniedTitle={copy.dictationPermissionDeniedTitle}
          dictationLocale={dictationLocale}
          dictationUnavailableMessage={copy.dictationUnavailableMessage}
          dictationUnavailableTitle={copy.dictationUnavailableTitle}
          editable={!videoActionsDisabled}
          label={copy.hookText}
          onChangeText={(value) => onContextChange('hookText', value)}
          placeholder={copy.hookTextPlaceholder}
          style={styles.hookInput}
          stopDictationLabel={copy.stopDictation}
          value={context.hookText}
        />
        <DictationTextField
          dictateLabel={copy.dictate}
          dictationPermissionDeniedMessage={copy.dictationPermissionDeniedMessage}
          dictationPermissionDeniedTitle={copy.dictationPermissionDeniedTitle}
          dictationLocale={dictationLocale}
          dictationUnavailableMessage={copy.dictationUnavailableMessage}
          dictationUnavailableTitle={copy.dictationUnavailableTitle}
          editable={!videoActionsDisabled}
          label={copy.description}
          multiline
          onChangeText={(value) => onContextChange('videoDescription', value)}
          placeholder={copy.descriptionPlaceholder}
          stopDictationLabel={copy.stopDictation}
          value={context.videoDescription}
        />
        <DictationTextField
          dictateLabel={copy.dictate}
          dictationPermissionDeniedMessage={copy.dictationPermissionDeniedMessage}
          dictationPermissionDeniedTitle={copy.dictationPermissionDeniedTitle}
          dictationLocale={dictationLocale}
          dictationUnavailableMessage={copy.dictationUnavailableMessage}
          dictationUnavailableTitle={copy.dictationUnavailableTitle}
          editable={!videoActionsDisabled}
          label={copy.niche}
          onChangeText={(value) => onContextChange('niche', value)}
          placeholder={copy.nichePlaceholder}
          stopDictationLabel={copy.stopDictation}
          value={context.niche}
        />
        <DictationTextField
          dictateLabel={copy.dictate}
          dictationPermissionDeniedMessage={copy.dictationPermissionDeniedMessage}
          dictationPermissionDeniedTitle={copy.dictationPermissionDeniedTitle}
          dictationLocale={dictationLocale}
          dictationUnavailableMessage={copy.dictationUnavailableMessage}
          dictationUnavailableTitle={copy.dictationUnavailableTitle}
          editable={!videoActionsDisabled}
          label={copy.audience}
          onChangeText={(value) => onContextChange('targetAudience', value)}
          placeholder={copy.audiencePlaceholder}
          stopDictationLabel={copy.stopDictation}
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
        <View
          pointerEvents="none"
          style={[styles.sectionAccent, { backgroundColor: colors.sky }]}
        />
        <View style={styles.sectionHeader}>
          <ImagePlus color={colors.sky} size={18} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.selected}</Text>
        </View>

        {selectedVideo ? (
          <View
            style={[
              styles.sourceCard,
              { borderColor: colors.border, backgroundColor: colors.backgroundSoft },
            ]}
          >
            <View style={[styles.sourceIcon, { backgroundColor: colors.accentDark }]}>
              <Video color={colors.accent} size={20} />
            </View>
            <View style={styles.sourceDetails}>
              <Text style={[styles.fileName, { color: colors.text }]}>
                {copy.visualContextAdded}
              </Text>
              <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                {selectedVideo.fileName} · {copy.duration}: {formatMilliseconds(selectedVideo.durationMs)}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.sourceCard,
              { borderColor: colors.border, backgroundColor: colors.backgroundSoft },
            ]}
          >
            <View style={[styles.sourceIcon, { backgroundColor: colors.surfaceMuted }]}>
              <Video color={colors.textSubtle} size={20} />
            </View>
            <Text style={[styles.empty, { color: colors.textSubtle }]}>{copy.noVideo}</Text>
          </View>
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

        {showBasicLimitHint ? (
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
    position: 'relative',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 3,
  },
  limitPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  limitTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  limitCopy: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  promoActions: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactRowPressed: {
    opacity: 0.72,
  },
  contactText: {
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19,
  },
  promoFeedback: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  sectionAccent: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    width: 64,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
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
  hookInput: {
    minHeight: 64,
    fontSize: 18,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  sourceIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sourceDetails: {
    flex: 1,
    minWidth: 0,
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
    flex: 1,
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
