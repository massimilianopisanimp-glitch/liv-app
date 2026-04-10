import { useState, useEffect, useRef } from 'react'
import styles from './MindfulnessExercise.module.css'

const STEPS = [
  {
    number: 5,
    sense: 'Vedi',
    color: '#56ccf2',
    emoji: '👁️',
    instruction: 'Guarda intorno a te e nomina mentalmente 5 cose che riesci a vedere in questo momento.',
    hint: 'Un oggetto, un colore, una forma, una luce... qualsiasi cosa catturi il tuo sguardo.',
  },
  {
    number: 4,
    sense: 'Tocca',
    color: '#6fcf97',
    emoji: '✋',
    instruction: 'Nota 4 cose che riesci a sentire fisicamente in questo momento.',
    hint: 'Il tessuto dei vestiti, il sedile sotto di te, la temperatura dell\'aria, la pressione dei piedi sul pavimento.',
  },
  {
    number: 3,
    sense: 'Ascolta',
    color: '#f2c94c',
    emoji: '👂',
    instruction: 'Fermati e identifica 3 suoni che riesci a sentire adesso.',
    hint: 'Suoni lontani, suoni vicini, il silenzio stesso. Anche i rumori più sottili contano.',
  },
  {
    number: 2,
    sense: 'Annusa',
    color: '#bb6bd9',
    emoji: '👃',
    instruction: 'Nota 2 odori che riesci a percepire, o l\'odore che hai intorno a te.',
    hint: 'L\'aria della stanza, il profumo dei vestiti, il tuo caffè, qualsiasi cosa arrivi al naso.',
  },
  {
    number: 1,
    sense: 'Assapora',
    color: '#6B9080',
    emoji: '👅',
    instruction: 'Nota 1 sapore in bocca in questo momento.',
    hint: 'Il gusto neutro della bocca, un residuo di qualcosa che hai bevuto o mangiato.',
  },
]

export default function MindfulnessExercise() {
  const [step, setStep] = useState(-1) // -1 = intro, 0-4 = step, 5 = done
  const [checked, setChecked] = useState([])
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (step >= 0 && step < STEPS.length) {
      setTimer(0)
      setChecked([])
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [step])

  const toggle = (i) => {
    setChecked(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  const canProceed = () => {
    if (step < 0 || step >= STEPS.length) return true
    return checked.length >= STEPS[step].number
  }

  const handleNext = () => {
    clearInterval(timerRef.current)
    if (step === STEPS.length - 1) {
      setStep(STEPS.length)
    } else {
      setStep(s => s + 1)
    }
  }

  const reset = () => {
    clearInterval(timerRef.current)
    setStep(-1)
    setChecked([])
    setTimer(0)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  if (step === -1) {
    return (
      <div className={styles.container}>
        <div className={styles.intro}>
          <div className={styles.icon}>🌿</div>
          <h3 className={styles.title}>Tecnica 5-4-3-2-1</h3>
          <p className={styles.desc}>
            Questa tecnica di grounding ti aiuta a tornare nel momento presente quando le emozioni
            o i pensieri sembrano travolgerti. Ancorandoti ai sensi, interrompi il ciclo dei pensieri
            ansiosi e riporti l'attenzione a ciò che è reale adesso.
          </p>
          <div className={styles.stepsPreview}>
            {STEPS.map(s => (
              <div key={s.number} className={styles.previewItem} style={{ borderColor: s.color }}>
                <span className={styles.previewNum} style={{ color: s.color }}>{s.number}</span>
                <span className={styles.previewEmoji}>{s.emoji}</span>
                <span className={styles.previewSense}>{s.sense}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="btn btn-primary">
            Inizia esercizio
          </button>
        </div>
      </div>
    )
  }

  if (step >= STEPS.length) {
    return (
      <div className={styles.container}>
        <div className={styles.done + ' fade-in'}>
          <div className={styles.icon}>🌱</div>
          <h3 className={styles.title}>Sei nel momento presente</h3>
          <p className={styles.desc}>
            Hai completato l'esercizio di grounding. Come ti senti adesso rispetto a prima?
            Spesso dopo questo esercizio ci si sente più radicati e meno sopraffatti.
          </p>
          <p className={styles.tip}>
            Puoi ripetere questa tecnica ogni volta che senti i pensieri accelerare
            o quando le emozioni sembrano troppo intense.
          </p>
          <button onClick={reset} className="btn btn-primary">
            Ripeti esercizio
          </button>
        </div>
      </div>
    )
  }

  const currentStep = STEPS[step]
  const items = Array.from({ length: currentStep.number }, (_, i) => i)

  return (
    <div className={styles.container}>
      <div className={styles.exercise + ' fade-in'}>
        {/* Progresso */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={styles.progressDot}
              style={{
                background: i < step ? s.color : i === step ? s.color : 'var(--bg-input)',
                transform: i === step ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Step corrente */}
        <div className={styles.stepHeader}>
          <span className={styles.stepEmoji}>{currentStep.emoji}</span>
          <div>
            <div className={styles.stepSense} style={{ color: currentStep.color }}>
              {currentStep.sense}
            </div>
            <div className={styles.stepTimer}>{formatTime(timer)}</div>
          </div>
        </div>

        <div className={styles.instruction}>
          {currentStep.instruction}
        </div>
        <div className={styles.hint}>{currentStep.hint}</div>

        {/* Checkbox items */}
        <div className={styles.checkList}>
          {items.map(i => (
            <button
              key={i}
              className={[styles.checkItem, checked.includes(i) ? styles.checkItemDone : ''].join(' ')}
              style={checked.includes(i) ? { borderColor: currentStep.color, background: currentStep.color + '22' } : {}}
              onClick={() => toggle(i)}
            >
              <div
                className={styles.checkBox}
                style={checked.includes(i) ? { background: currentStep.color, borderColor: currentStep.color } : {}}
              >
                {checked.includes(i) ? '✓' : ''}
              </div>
              <span style={{ color: checked.includes(i) ? currentStep.color : 'var(--text-muted)' }}>
                {checked.includes(i) ? `Cosa ${i + 1} trovata ✓` : `Cosa ${i + 1}`}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="btn btn-primary"
          disabled={!canProceed()}
          style={{ alignSelf: 'center' }}
        >
          {step === STEPS.length - 1 ? 'Completa' : 'Prossimo senso →'}
        </button>

        {!canProceed() && (
          <p className={styles.checkHint}>
            Seleziona le {currentStep.number} cose che hai trovato per continuare
          </p>
        )}
      </div>
    </div>
  )
}
