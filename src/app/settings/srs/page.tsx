'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/common/Navigation';
import { Container, Card, Text, Button, Input, Toggle, Animated } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { SRSSettings, DEFAULT_SRS_SETTINGS } from '@/lib/reviewQueue';
import { IoSave, IoRefresh, IoNotifications, IoSpeedometer, IoTime, IoVolumeHigh } from 'react-icons/io5';
import styles from './srs.module.css';

const STORAGE_KEY = 'japanese_trainer_srs_settings';

export default function SRSSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SRSSettings>(DEFAULT_SRS_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SRS_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load SRS settings:', error);
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof SRSSettings>(key: K, value: SRSSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  // Save settings
  const handleSave = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save SRS settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SRS_SETTINGS);
    setSaved(false);
  }, []);

  return (
    <Container variant="centered">
      <Navigation />

      <Animated animation="fadeInDown">
        <Text variant="h1" color="gold" className={styles.pageTitle}>
          SRS Settings
        </Text>
        <Text color="muted" className={styles.pageSubtitle}>
          Customize your spaced repetition experience
        </Text>
      </Animated>

      {/* Review Scheduling */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoTime className={styles.sectionIcon} />
          <Text variant="h3">Review Scheduling</Text>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Daily New Items Limit</Text>
            <Text variant="label" color="muted">Maximum new items to learn per day</Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.dailyNewItemsLimit}
              onChange={(e) => updateSetting('dailyNewItemsLimit', parseInt(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{settings.dailyNewItemsLimit}</span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Daily Review Limit</Text>
            <Text variant="label" color="muted">Maximum reviews per day (0 = unlimited)</Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={settings.dailyReviewLimit}
              onChange={(e) => updateSetting('dailyReviewLimit', parseInt(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>
              {settings.dailyReviewLimit === 0 ? '∞' : settings.dailyReviewLimit}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Review Threshold</Text>
            <Text variant="label" color="muted">How strict the SRS scheduling is</Text>
          </div>
          <div className={styles.settingControl}>
            <div className={styles.buttonGroup}>
              {(['strict', 'moderate', 'relaxed'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionButton} ${settings.reviewThreshold === option ? styles.active : ''}`}
                  onClick={() => updateSetting('reviewThreshold', option)}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Difficulty Adjustments */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoSpeedometer className={styles.sectionIcon} />
          <Text variant="h3">Difficulty Adjustments</Text>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Ease Bonus</Text>
            <Text variant="label" color="muted">
              Adjust how quickly intervals grow ({settings.easeBonus >= 0 ? '+' : ''}{Math.round(settings.easeBonus * 100)}%)
            </Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="-20"
              max="20"
              value={settings.easeBonus * 100}
              onChange={(e) => updateSetting('easeBonus', parseInt(e.target.value) / 100)}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>
              {settings.easeBonus >= 0 ? '+' : ''}{Math.round(settings.easeBonus * 100)}%
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Interval Multiplier</Text>
            <Text variant="label" color="muted">Scale all intervals by this factor</Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="50"
              max="200"
              value={settings.intervalMultiplier * 100}
              onChange={(e) => updateSetting('intervalMultiplier', parseInt(e.target.value) / 100)}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{settings.intervalMultiplier.toFixed(1)}x</span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Lapse New Interval</Text>
            <Text variant="label" color="muted">When you fail, reset interval to this % of previous</Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.lapseNewInterval * 100}
              onChange={(e) => updateSetting('lapseNewInterval', parseInt(e.target.value) / 100)}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{Math.round(settings.lapseNewInterval * 100)}%</span>
          </div>
        </div>
      </Card>

      {/* Review Modes */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoVolumeHigh className={styles.sectionIcon} />
          <Text variant="h3">Review Options</Text>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Autoplay Audio</Text>
            <Text variant="label" color="muted">Play audio when showing answer</Text>
          </div>
          <div className={styles.settingControl}>
            <Toggle
              options={[
                { id: 'on', label: 'On' },
                { id: 'off', label: 'Off' },
              ]}
              value={settings.autoplayAudio ? 'on' : 'off'}
              onChange={(value) => updateSetting('autoplayAudio', value === 'on')}
              name="autoplayAudio"
            />
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Show Reading Hints</Text>
            <Text variant="label" color="muted">Display reading hints for kanji</Text>
          </div>
          <div className={styles.settingControl}>
            <Toggle
              options={[
                { id: 'on', label: 'On' },
                { id: 'off', label: 'Off' },
              ]}
              value={settings.showReadingHints ? 'on' : 'off'}
              onChange={(value) => updateSetting('showReadingHints', value === 'on')}
              name="showReadingHints"
            />
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Required Accuracy</Text>
            <Text variant="label" color="muted">Target accuracy for mastery ({Math.round(settings.requiredAccuracy * 100)}%)</Text>
          </div>
          <div className={styles.settingControl}>
            <input
              type="range"
              min="60"
              max="100"
              value={settings.requiredAccuracy * 100}
              onChange={(e) => updateSetting('requiredAccuracy', parseInt(e.target.value) / 100)}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{Math.round(settings.requiredAccuracy * 100)}%</span>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card variant="glass" className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <IoNotifications className={styles.sectionIcon} />
          <Text variant="h3">Notifications</Text>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <Text className={styles.settingLabel}>Review Reminders</Text>
            <Text variant="label" color="muted">Get notified when you have reviews due</Text>
          </div>
          <div className={styles.settingControl}>
            <Toggle
              options={[
                { id: 'on', label: 'On' },
                { id: 'off', label: 'Off' },
              ]}
              value={settings.reviewReminders ? 'on' : 'off'}
              onChange={(value) => updateSetting('reviewReminders', value === 'on')}
              name="reviewReminders"
            />
          </div>
        </div>

        {settings.reviewReminders && (
          <>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text className={styles.settingLabel}>Reminder Time</Text>
                <Text variant="label" color="muted">When to send daily reminder</Text>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSetting('reminderTime', e.target.value)}
                  className={styles.timeInput}
                />
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text className={styles.settingLabel}>Reminder Threshold</Text>
                <Text variant="label" color="muted">Only notify when reviews exceed this number</Text>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={settings.reminderThreshold}
                  onChange={(e) => updateSetting('reminderThreshold', parseInt(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{settings.reminderThreshold}</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button onClick={handleReset} variant="ghost">
          <IoRefresh /> Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <IoSave /> {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <Button variant="ghost" onClick={() => router.push('/settings')} className={styles.backButton}>
        Back to Settings
      </Button>
    </Container>
  );
}
