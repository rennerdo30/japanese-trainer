'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Navigation from '@/components/common/Navigation';
import { Container, Card, Text, Button, Toggle, Animated } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/context/TargetLanguageProvider';
import { useMobile } from '@/hooks/useMobile';
import { useKokoroVoice } from '@/hooks/useKokoroVoice';
import {
  loadKokoroModel,
  unloadKokoroModel,
  isKokoroLoaded,
  isKokoroLoading,
  getKokoroModelSize,
  checkKokoroSupport,
  KOKORO_VOICES,
  speakWithKokoro,
  getVoicesForTargetLanguage,
  isKokoroSupportedLanguage,
  type KokoroLoadProgress,
  type KokoroVoice,
} from '@/lib/kokoroTTS';
import {
  IoSettings,
  IoTrophy,
  IoTime,
  IoVolumeHigh,
  IoColorPalette,
  IoChevronForward,
  IoCloudOffline,
  IoDownload,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoPlay,
  IoMic,
  IoWarning,
} from 'react-icons/io5';
import styles from './settings.module.css';

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  pt: 'Portuguese',
  en: 'English',
};

// Test phrases per language
const TEST_PHRASES: Record<string, string> = {
  ja: 'こんにちは、これはテストです。',
  zh: '你好，这是一个测试。',
  es: 'Hola, esta es una prueba.',
  fr: 'Bonjour, ceci est un test.',
  hi: 'नमस्ते, यह एक परीक्षण है।',
  it: 'Ciao, questo è un test.',
  pt: 'Olá, isto é um teste.',
  en: 'Hello, this is a test.',
};

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { targetLanguage } = useTargetLanguage();
  const isMobile = useMobile();

  // Leaderboard visibility
  const leaderboardVisible = useQuery(api.leaderboard.getLeaderboardVisibility);
  const setLeaderboardVisibility = useMutation(api.leaderboard.setLeaderboardVisibility);
  const myXPData = useQuery(api.leaderboard.getMyXPBreakdown);

  // Offline TTS state
  const [kokoroStatus, setKokoroStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [kokoroProgress, setKokoroProgress] = useState(0);
  const [kokoroMessage, setKokoroMessage] = useState('');
  const [kokoroSupported, setKokoroSupported] = useState<boolean | null>(null);
  const [kokoroSupportReason, setKokoroSupportReason] = useState<string>('');

  // Voice selection - uses Convex when logged in, localStorage otherwise
  const { voice: selectedVoice, setVoice: setSelectedVoice, isSupported: languageSupported } = useKokoroVoice(targetLanguage);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Get available voices for the current target language
  const availableVoices = useMemo(() => {
    return getVoicesForTargetLanguage(targetLanguage);
  }, [targetLanguage]);

  // Group voices by gender
  const voicesByGender = useMemo(() => {
    const female = availableVoices.filter((v) => v.gender === 'Female');
    const male = availableVoices.filter((v) => v.gender === 'Male');
    return { female, male };
  }, [availableVoices]);

  // Check Kokoro support and initial status on mount
  useEffect(() => {
    const support = checkKokoroSupport();
    setKokoroSupported(support.supported);
    setKokoroSupportReason(support.reason ?? '');

    // Check initial status
    if (isKokoroLoaded()) {
      setKokoroStatus('ready');
    } else if (isKokoroLoading()) {
      setKokoroStatus('loading');
    }

    // On desktop, auto-load Kokoro if not already loaded
    if (!isMobile && support.supported && !isKokoroLoaded() && !isKokoroLoading()) {
      setKokoroStatus('loading');
      setKokoroMessage('Loading Kokoro TTS...');

      loadKokoroModel((progress) => {
        setKokoroProgress(progress.progress);
        setKokoroMessage(progress.message);
        if (progress.status === 'ready') {
          setKokoroStatus('ready');
        } else if (progress.status === 'error') {
          setKokoroStatus('error');
        }
      }).catch((error) => {
        setKokoroStatus('error');
        setKokoroMessage(error instanceof Error ? error.message : 'Failed to load');
      });
    }

    // Poll for Kokoro load completion (in case it's loading elsewhere)
    if (!isMobile && support.supported) {
      const checkInterval = setInterval(() => {
        if (isKokoroLoaded() && kokoroStatus !== 'ready') {
          setKokoroStatus('ready');
          clearInterval(checkInterval);
        }
      }, 500);

      // Cleanup
      return () => clearInterval(checkInterval);
    }
  }, [isMobile, kokoroStatus]);

  const handleVisibilityToggle = useCallback(async (visible: boolean) => {
    await setLeaderboardVisibility({ visible });
  }, [setLeaderboardVisibility]);

  const handleKokoroToggle = useCallback(async (enabled: string) => {
    if (enabled === 'enabled') {
      // Start loading the model
      setKokoroStatus('loading');
      setKokoroProgress(0);
      setKokoroMessage('Initializing...');

      try {
        await loadKokoroModel((progress: KokoroLoadProgress) => {
          setKokoroProgress(progress.progress);
          setKokoroMessage(progress.message);
          if (progress.status === 'ready') {
            setKokoroStatus('ready');
          } else if (progress.status === 'error') {
            setKokoroStatus('error');
          }
        });
      } catch (error) {
        setKokoroStatus('error');
        setKokoroMessage(error instanceof Error ? error.message : 'Failed to load model');
      }
    } else {
      // Unload the model
      unloadKokoroModel();
      setKokoroStatus('idle');
      setKokoroProgress(0);
      setKokoroMessage('');
    }
  }, []);

  const handleVoiceChange = useCallback((voiceId: KokoroVoice) => {
    setSelectedVoice(voiceId);
  }, [setSelectedVoice]);

  const handleTestVoice = useCallback(async () => {
    if (!isKokoroLoaded() || isTestingVoice) return;

    setIsTestingVoice(true);
    try {
      const testText = TEST_PHRASES[targetLanguage] || TEST_PHRASES.en;
      await speakWithKokoro(testText, selectedVoice, 0.8);
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTestingVoice(false);
    }
  }, [selectedVoice, isTestingVoice, targetLanguage]);

  const modelSize = getKokoroModelSize();
  const selectedVoiceInfo = KOKORO_VOICES.find((v) => v.id === selectedVoice);
  const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  return (
    <Container variant="centered">
      <Navigation />

      <Animated animation="fadeInDown">
        <div className={styles.pageHeader}>
          <IoSettings className={styles.headerIcon} />
          <Text variant="h1" color="gold" className={styles.pageTitle}>
            Settings
          </Text>
        </div>
        <Text color="muted" align="center" className={styles.pageSubtitle}>
          Customize your learning experience
        </Text>
      </Animated>

      {/* Leaderboard Settings */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoTrophy className={styles.sectionIcon} />
          <Text variant="h3">Leaderboard</Text>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Show on Leaderboard</Text>
            <Text variant="label" color="muted">
              When disabled, your progress won't appear in public rankings
            </Text>
          </div>
          <div className={styles.settingControl}>
            {leaderboardVisible !== undefined && (
              <Toggle
                options={[
                  { id: 'visible', label: 'Visible' },
                  { id: 'hidden', label: 'Hidden' },
                ]}
                value={leaderboardVisible ? 'visible' : 'hidden'}
                onChange={(value) => handleVisibilityToggle(value === 'visible')}
                name="leaderboardVisibility"
              />
            )}
          </div>
        </div>

        {myXPData?.anonymousName && (
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text className={styles.settingLabel}>Your Anonymous Name</Text>
              <Text variant="label" color="muted">
                This is how you appear on the leaderboard
              </Text>
            </div>
            <div className={styles.settingControl}>
              <Text color="gold" className={styles.anonymousName}>
                {myXPData.anonymousName}
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* SRS Settings Link */}
      <Link href="/settings/srs" className={styles.settingsLink}>
        <Card variant="glass" hover className={styles.settingsSection}>
          <div className={styles.linkContent}>
            <div className={styles.linkLeft}>
              <IoTime className={styles.sectionIcon} />
              <div>
                <Text variant="h3">Spaced Repetition</Text>
                <Text variant="label" color="muted">
                  Customize review scheduling and difficulty
                </Text>
              </div>
            </div>
            <IoChevronForward className={styles.chevron} />
          </div>
        </Card>
      </Link>

      {/* Audio & TTS Settings */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoVolumeHigh className={styles.sectionIcon} />
          <Text variant="h3">Audio & TTS</Text>
        </div>

        {/* Kokoro TTS Enable/Disable (mobile only shows toggle) */}
        {isMobile && (
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabelRow}>
                <IoCloudOffline className={styles.settingLabelIcon} />
                <Text className={styles.settingLabel}>Offline TTS (Kokoro)</Text>
              </div>
              <Text variant="label" color="muted">
                Download ~{modelSize}MB model for offline text-to-speech
              </Text>
              {!kokoroSupported && kokoroSupported !== null && (
                <Text variant="label" color="error" className={styles.warningText}>
                  Not supported: {kokoroSupportReason}
                </Text>
              )}
            </div>
            <div className={styles.settingControl}>
              {kokoroSupported && (
                <Toggle
                  options={[
                    { id: 'disabled', label: 'Off' },
                    { id: 'enabled', label: 'On' },
                  ]}
                  value={kokoroStatus === 'ready' ? 'enabled' : 'disabled'}
                  onChange={handleKokoroToggle}
                  name="offlineTTS"
                  disabled={kokoroStatus === 'loading'}
                />
              )}
            </div>
          </div>
        )}

        {/* Desktop auto-load notice */}
        {!isMobile && kokoroSupported && (
          <div className={styles.statusSection}>
            <IoCheckmarkCircle className={styles.successIcon} />
            <Text variant="label" color="success">
              Kokoro TTS loads automatically on desktop
            </Text>
          </div>
        )}

        {/* Kokoro Loading Progress */}
        {kokoroStatus === 'loading' && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <IoDownload className={styles.progressIcon} />
              <Text variant="label">{kokoroMessage}</Text>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${kokoroProgress}%` }}
              />
            </div>
            <Text variant="label" color="muted" className={styles.progressPercent}>
              {kokoroProgress}%
            </Text>
          </div>
        )}

        {/* Kokoro Ready Status */}
        {kokoroStatus === 'ready' && isMobile && (
          <div className={styles.statusSection}>
            <IoCheckmarkCircle className={styles.successIcon} />
            <Text variant="label" color="success">
              Offline TTS ready - works without internet
            </Text>
          </div>
        )}

        {/* Kokoro Error Status */}
        {kokoroStatus === 'error' && (
          <div className={styles.statusSection}>
            <IoCloseCircle className={styles.errorIcon} />
            <Text variant="label" color="error">
              {kokoroMessage || 'Failed to load offline TTS'}
            </Text>
          </div>
        )}

        {/* Voice Selection (only when Kokoro is ready) */}
        {(kokoroStatus === 'ready' || (!isMobile && isKokoroLoaded())) && (
          <>
            <div className={styles.voiceSelectionHeader}>
              <IoMic className={styles.settingLabelIcon} />
              <Text className={styles.settingLabel}>Voice Selection ({languageName})</Text>
            </div>

            {/* Show warning if language not supported by Kokoro */}
            {!languageSupported ? (
              <div className={styles.statusSection}>
                <IoWarning className={styles.warningIcon} />
                <Text variant="label" color="muted" className={styles.warningText}>
                  Kokoro does not support {languageName}. Using browser speech synthesis or pre-generated audio instead.
                </Text>
              </div>
            ) : availableVoices.length === 0 ? (
              <div className={styles.statusSection}>
                <IoWarning className={styles.warningIcon} />
                <Text variant="label" color="muted" className={styles.warningText}>
                  No voices available for {languageName}.
                </Text>
              </div>
            ) : (
              <>
                <Text variant="label" color="muted" className={styles.voiceSelectionNote}>
                  Select a voice for {languageName} text-to-speech. Pre-generated audio is used when available.
                </Text>

                {/* Voice Selector */}
                <div className={styles.voiceSelector}>
                  <select
                    className={styles.voiceSelect}
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value as KokoroVoice)}
                  >
                    {voicesByGender.female.length > 0 && (
                      <optgroup label="Female">
                        {voicesByGender.female.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} ({voice.quality}) {voice.traits || ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {voicesByGender.male.length > 0 && (
                      <optgroup label="Male">
                        {voicesByGender.male.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} ({voice.quality}) {voice.traits || ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <Button
                    variant="secondary"
                    onClick={handleTestVoice}
                    disabled={isTestingVoice || !isKokoroLoaded()}
                    className={styles.testVoiceButton}
                  >
                    <IoPlay />
                    {isTestingVoice ? 'Playing...' : 'Test'}
                  </Button>
                </div>

                {/* Selected Voice Info */}
                {selectedVoiceInfo && (
                  <div className={styles.voiceInfo}>
                    <Text variant="label" color="muted">
                      {selectedVoiceInfo.languageLabel} • {selectedVoiceInfo.gender} • Quality: {selectedVoiceInfo.quality}
                    </Text>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* TTS Tiers Explanation */}
        <div className={styles.ttsInfo}>
          <Text variant="label" color="muted" className={styles.ttsInfoTitle}>
            Audio playback priority:
          </Text>
          <ol className={styles.ttsTierList}>
            <li>Pre-generated audio (best quality)</li>
            <li>Kokoro TTS ({isMobile ? 'if enabled' : 'auto-loaded'}, {languageSupported ? languageName : 'English only'})</li>
            <li>Browser speech synthesis (fallback)</li>
          </ol>
        </div>
      </Card>

      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoColorPalette className={styles.sectionIcon} />
          <Text variant="h3">Appearance</Text>
        </div>
        <div className={styles.comingSoon}>
          <Text color="muted">Theme settings coming soon</Text>
        </div>
      </Card>

      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/')} className={styles.backButton}>
        Back to Dashboard
      </Button>
    </Container>
  );
}
