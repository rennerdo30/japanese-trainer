'use client';

import { useCallback, useState } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import {
  IoVolumeHigh,
  IoStop,
  IoInformationCircle,
  IoCheckmark,
  IoWarning,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoChevronDown,
  IoChevronUp,
} from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import styles from './GrammarLesson.module.css';
import type { CommonMistake, FormalityLevel } from '@/types';

interface GrammarLessonProps {
  title: string;              // Grammar point title
  pattern?: string;           // Grammar pattern (e.g., "〜ている", "estar + gerundio")
  explanation: string;        // Explanation of the grammar
  examples: Array<{
    sentence: string;
    translation: string;
    audioUrl?: string;
    reading?: string;
    register?: 'casual' | 'polite' | 'formal';
    isIncorrect?: boolean;
  }>;
  usageNotes?: string[];
  // Enhanced grammar fields
  formation?: string;
  formalityLevel?: FormalityLevel;
  pragmaticNotes?: string;
  commonMistakes?: CommonMistake[];
  negativeForm?: string;
  questionForm?: string;
  conjugationTable?: Record<string, string>;
  relatedGrammar?: string[];
  onMastered?: () => void;
}

// Helper to get formality badge color
function getFormalityColor(level: FormalityLevel): string {
  switch (level) {
    case 'casual': return 'var(--color-accent-blue)';
    case 'polite': return 'var(--color-accent-green)';
    case 'formal': return 'var(--color-accent-purple)';
    case 'humble': return 'var(--color-accent-orange)';
    default: return 'var(--color-text-muted)';
  }
}

// Helper to get register badge style
function getRegisterStyle(register?: 'casual' | 'polite' | 'formal'): React.CSSProperties {
  switch (register) {
    case 'casual': return { backgroundColor: 'var(--color-accent-blue)', color: 'white' };
    case 'polite': return { backgroundColor: 'var(--color-accent-green)', color: 'white' };
    case 'formal': return { backgroundColor: 'var(--color-accent-purple)', color: 'white' };
    default: return {};
  }
}

export default function GrammarLesson({
  title,
  pattern,
  explanation,
  examples,
  usageNotes,
  formation,
  formalityLevel,
  pragmaticNotes,
  commonMistakes,
  negativeForm,
  questionForm,
  conjugationTable,
  relatedGrammar,
  onMastered,
}: GrammarLessonProps) {
  const { t } = useLanguage();
  const { speak, stop, isPlaying } = useTTS();
  const [showExplanation, setShowExplanation] = useState(true);
  const [showFormation, setShowFormation] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [showConjugation, setShowConjugation] = useState(false);
  const [activeExample, setActiveExample] = useState<number | null>(null);

  const handleExampleSpeak = useCallback((index: number) => {
    if (activeExample === index && isPlaying) {
      stop();
      setActiveExample(null);
    } else {
      setActiveExample(index);
      speak(examples[index].sentence, { audioUrl: examples[index].audioUrl });
    }
  }, [examples, activeExample, isPlaying, speak, stop]);

  // Separate correct and incorrect examples
  const correctExamples = examples.filter(ex => !ex.isIncorrect);
  const incorrectExamples = examples.filter(ex => ex.isIncorrect);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Text variant="h2" className={styles.title}>{title}</Text>
        {pattern && (
          <Text className={styles.pattern}>{pattern}</Text>
        )}
        {formalityLevel && formalityLevel !== 'any' && (
          <span
            className={styles.formalityBadge}
            style={{ backgroundColor: getFormalityColor(formalityLevel) }}
          >
            {formalityLevel}
          </span>
        )}
      </div>

      {/* Explanation Section */}
      <div className={styles.explanationSection}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExplanation(!showExplanation)}
          className={styles.explanationToggle}
        >
          <IoInformationCircle />
          <span>{showExplanation ? t('lessons.grammar.hideExplanation') : t('lessons.grammar.showExplanation')}</span>
          {showExplanation ? <IoChevronUp /> : <IoChevronDown />}
        </Button>

        {showExplanation && (
          <div className={styles.explanation}>
            <Text variant="body">{explanation}</Text>
          </div>
        )}
      </div>

      {/* Formation Rules Section */}
      {formation && (
        <div className={styles.formationSection}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormation(!showFormation)}
            className={styles.sectionToggle}
          >
            <span>{t('lessons.grammar.formation') || 'How to Form'}</span>
            {showFormation ? <IoChevronUp /> : <IoChevronDown />}
          </Button>

          {showFormation && (
            <div className={styles.formationContent}>
              <Text variant="body" className={styles.formationText}>
                {formation}
              </Text>
              {negativeForm && (
                <div className={styles.formVariant}>
                  <Text variant="label" color="muted">{t('lessons.grammar.negativeForm') || 'Negative'}</Text>
                  <Text variant="body">{negativeForm}</Text>
                </div>
              )}
              {questionForm && (
                <div className={styles.formVariant}>
                  <Text variant="label" color="muted">{t('lessons.grammar.questionForm') || 'Question'}</Text>
                  <Text variant="body">{questionForm}</Text>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conjugation Table Section */}
      {conjugationTable && Object.keys(conjugationTable).length > 0 && (
        <div className={styles.conjugationSection}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConjugation(!showConjugation)}
            className={styles.sectionToggle}
          >
            <span>{t('lessons.grammar.conjugation') || 'Conjugation'}</span>
            {showConjugation ? <IoChevronUp /> : <IoChevronDown />}
          </Button>

          {showConjugation && (
            <div className={styles.conjugationTable}>
              {Object.entries(conjugationTable).map(([form, value]) => (
                <div key={form} className={styles.conjugationRow}>
                  <Text variant="caption" color="muted" className={styles.conjugationLabel}>
                    {form.replace(/_/g, ' ')}
                  </Text>
                  <Text variant="body" className={styles.conjugationValue}>
                    {value}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pragmatic Notes Section */}
      {pragmaticNotes && (
        <div className={styles.pragmaticSection}>
          <Text variant="label" color="muted">{t('lessons.grammar.whenToUse') || 'When to Use'}</Text>
          <Text variant="body" className={styles.pragmaticText}>
            {pragmaticNotes}
          </Text>
        </div>
      )}

      {/* Examples Section */}
      <div className={styles.examplesSection}>
        <Text variant="label" color="muted">{t('lessons.grammar.examples')}</Text>
        <div className={styles.examples}>
          {correctExamples.map((example, idx) => (
            <div key={idx} className={styles.example}>
              <div className={styles.exampleMain}>
                <div className={styles.exampleContent}>
                  <Text variant="body" className={styles.exampleSentence}>
                    {example.sentence}
                  </Text>
                  {example.register && (
                    <span
                      className={styles.registerBadge}
                      style={getRegisterStyle(example.register)}
                    >
                      {example.register}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExampleSpeak(idx)}
                  className={styles.exampleAudio}
                  aria-label={t('common.listen')}
                >
                  {activeExample === idx && isPlaying ? <IoStop /> : <IoVolumeHigh />}
                </Button>
              </div>
              {example.reading && (
                <Text variant="caption" color="muted" className={styles.exampleReading}>
                  {example.reading}
                </Text>
              )}
              <Text variant="caption" color="muted" className={styles.exampleTranslation}>
                {example.translation}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistakes Section */}
      {commonMistakes && commonMistakes.length > 0 && (
        <div className={styles.mistakesSection}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMistakes(!showMistakes)}
            className={styles.sectionToggle}
          >
            <IoWarning className={styles.warningIcon} />
            <span>{t('lessons.grammar.commonMistakes') || 'Common Mistakes'}</span>
            {showMistakes ? <IoChevronUp /> : <IoChevronDown />}
          </Button>

          {showMistakes && (
            <div className={styles.mistakesList}>
              {commonMistakes.map((mistake, idx) => (
                <div key={idx} className={styles.mistakeItem}>
                  <div className={styles.mistakeComparison}>
                    <div className={styles.mistakeWrong}>
                      <IoCloseCircle className={styles.wrongIcon} />
                      <Text variant="body">{mistake.mistake}</Text>
                    </div>
                    <div className={styles.mistakeCorrect}>
                      <IoCheckmarkCircle className={styles.correctIcon} />
                      <Text variant="body">{mistake.correction}</Text>
                    </div>
                  </div>
                  <Text variant="caption" color="muted" className={styles.mistakeExplanation}>
                    {mistake.explanation}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incorrect Examples Section (if any) */}
      {incorrectExamples.length > 0 && (
        <div className={styles.incorrectExamplesSection}>
          <Text variant="label" color="muted">
            <IoWarning className={styles.warningIcon} />
            {t('lessons.grammar.whatNotToSay') || "What NOT to Say"}
          </Text>
          <div className={styles.incorrectExamples}>
            {incorrectExamples.map((example, idx) => (
              <div key={idx} className={`${styles.example} ${styles.incorrectExample}`}>
                <div className={styles.exampleMain}>
                  <IoCloseCircle className={styles.wrongIcon} />
                  <Text variant="body" className={styles.exampleSentence}>
                    {example.sentence}
                  </Text>
                </div>
                <Text variant="caption" color="muted" className={styles.exampleTranslation}>
                  {example.translation}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Notes */}
      {usageNotes && usageNotes.length > 0 && (
        <div className={styles.notesSection}>
          <Text variant="label" color="muted">{t('lessons.grammar.usageNotes')}</Text>
          <ul className={styles.notesList}>
            {usageNotes.map((note, idx) => (
              <li key={idx}>
                <Text variant="caption">{note}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Grammar */}
      {relatedGrammar && relatedGrammar.length > 0 && (
        <div className={styles.relatedSection}>
          <Text variant="label" color="muted">{t('lessons.grammar.relatedPatterns') || 'Related Patterns'}</Text>
          <div className={styles.relatedList}>
            {relatedGrammar.map((item, idx) => (
              <span key={idx} className={styles.relatedItem}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {onMastered && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={onMastered}
            className={styles.masteredButton}
          >
            <IoCheckmark /> {t('lessons.grammar.iUnderstand')}
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <Text variant="caption" color="muted">
          {t('common.tapToContinue')}
        </Text>
      </div>
    </div>
  );
}
