import { useState, useEffect, useRef } from 'react'
import styles from './BreathingExercise.module.css'

const PHASES = [
  { label: 'Inspira',   duration: 4, color: '#6fcf97' },
  { label: 'Trattieni', duration: 4, color: '#f2c94c' },
  { label: 'Espira',    duration: 6, color: '#56ccf2' },
  { label: 'Pausa',     duration: 2, color: '#bb6bd9' },
]

const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0) // 16 secondi

export default function BreathingExercise() {
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= TOTAL_CYCLE) {
          setCycles(c => c + 1)
          setPhaseIndex(0)
          return 0
        }

        let acc = 0
        for (let i = 0; i < PHASES.length; i++) {
          acc += PHASES[i].duration
          if (next < acc) {
            setPhaseIndex(i)
            break
          }
        }
        return next
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running])

  const stop = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setElapsed(0)
    setPhaseIndex(0)
  }

  const phase = PHASES[phaseIndex]

  // Calcolo progresso nella fase corrente
  let phaseStart = 0
  for (let i = 0; i < phaseIndex; i++) phaseStart += PHASES[i].duration
  const phaseElapsed = elapsed - phaseStart
  const phaseProgress = phaseElapsed / phase.duration

  // Scale del cerchio: inspira → cresce, espira → si restringe
  const isExpand = phaseIndex === 0
  const isHold = phaseIndex === 1
  const isContract = phaseIndex === 2

  let circleScale = 1
  if (isExpand) circleScale = 0.7 + phaseProgress * 0.4
  else if (isHold) circleScale = 1.1
  else if (isContract) circleScale = 1.1 - phaseProgress * 0.4
  else circleScale = 0.7

  return (
    <div className={styles.container}>
      {!running ? (
        <div className={styles.intro}>
          <div className={styles.introIcon}>🌬️</div>
          <h3 className={styles.title}>Respirazione 4-4-6-2</h3>
          <p className={styles.desc}>
            Questa tecnica di respirazione aiuta a calmare il sistema nervoso e ridurre l'ansia.
            Segui il ritmo guidato: inspira per 4 secondi, trattieni per 4, espira per 6, pausa per 2.
          </p>
          <p className={styles.tip}>Siediti comodamente, chiudi gli occhi, e inizia quando sei pronto/a.</p>
          <button onClick={() => setRunning(true)} className="btn btn-primary">
            Inizia esercizio
          </button>
        </div>
      ) : (
        <div className={styles.exercise}>
          <div className={styles.cyclesCounter}>
            Cicli completati: <strong>{cycles}</strong>
          </div>

          <div className={styles.circleWrapper}>
            <div
              className={styles.circleOuter}
              style={{
                transform: `scale(${circleScale})`,
                borderColor: phase.color,
                boxShadow: `0 0 40px ${phase.color}44`,
                transition: 'transform 1s ease-in-out, border-color 0.5s, box-shadow 0.5s',
              }}
            >
              <div className={styles.circleInner} style={{ background: phase.color + '22' }}>
                <div className={styles.phaseText} style={{ color: phase.color }}>
                  {phase.label}
                </div>
                <div className={styles.phaseCountdown}>
                  {phase.duration - phaseElapsed}s
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar della fase */}
          <div className={styles.phaseProgress}>
            {PHASES.map((p, i) => (
              <div
                key={i}
                className={styles.phaseSegment}
                style={{
                  flex: p.duration,
                  background: i === phaseIndex ? p.color : (i < phaseIndex ? p.color + '66' : 'var(--bg-input)'),
                  opacity: i === phaseIndex ? 1 : 0.5,
                }}
              />
            ))}
          </div>

          <div className={styles.phaseLabels}>
            {PHASES.map((p, i) => (
              <span key={i} style={{ flex: p.duration, color: i === phaseIndex ? p.color : 'var(--text-muted)', fontSize: 11 }}>
                {p.label}
              </span>
            ))}
          </div>

          <button onClick={stop} className="btn btn-ghost" style={{ marginTop: 8 }}>
            Ferma
          </button>
        </div>
      )}
    </div>
  )
}
