import { useState } from 'react'
import BreathingExercise from '../components/Exercises/BreathingExercise'
import WritingExercise from '../components/Exercises/WritingExercise'
import MindfulnessExercise from '../components/Exercises/MindfulnessExercise'
import styles from './ExercisesPage.module.css'

const EXERCISES = [
  {
    id: 'breathing',
    icon: '🌬️',
    title: 'Respirazione Guidata',
    desc: 'Una tecnica di respirazione 4-4-6-2 per calmare il sistema nervoso e ridurre l\'ansia.',
    duration: '5-10 min',
    color: '#6fcf97',
  },
  {
    id: 'writing',
    icon: '✍️',
    title: 'Scrittura Riflessiva',
    desc: 'Domande guidate per esplorare i tuoi pensieri ed emozioni attraverso la scrittura libera.',
    duration: '10-20 min',
    color: '#f2c94c',
  },
  {
    id: 'mindfulness',
    icon: '🌿',
    title: 'Momento Presente',
    desc: 'La tecnica 5-4-3-2-1 per ritornare al qui e ora quando le emozioni sembrano travolgerti.',
    duration: '5 min',
    color: '#56ccf2',
  },
]

export default function ExercisesPage() {
  const [active, setActive] = useState(null)

  const handleSelect = (id) => {
    setActive(active === id ? null : id)
    // Scroll to exercise
    setTimeout(() => {
      document.getElementById(`exercise-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Esercizi Pratici</h1>
        <p className={styles.subtitle}>
          Piccoli strumenti per ritrovare calma e chiarezza. Scegli quello che senti più adatto
          al tuo momento.
        </p>
      </div>

      <div className={styles.exercises}>
        {EXERCISES.map(ex => (
          <div key={ex.id} id={`exercise-${ex.id}`} className={styles.exerciseCard}>
            <button
              className={[styles.cardHeader, active === ex.id ? styles.cardHeaderActive : ''].join(' ')}
              style={active === ex.id ? { borderColor: ex.color } : {}}
              onClick={() => handleSelect(ex.id)}
            >
              <div className={styles.cardLeft}>
                <span className={styles.cardIcon} style={{ background: ex.color + '22' }}>
                  {ex.icon}
                </span>
                <div>
                  <div className={styles.cardTitle}>{ex.title}</div>
                  <div className={styles.cardDesc}>{ex.desc}</div>
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.duration}>{ex.duration}</span>
                <span className={styles.toggle} style={active === ex.id ? { color: ex.color } : {}}>
                  {active === ex.id ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {active === ex.id && (
              <div className={styles.cardBody + ' fade-in'} style={{ borderColor: ex.color + '44' }}>
                {ex.id === 'breathing' && <BreathingExercise />}
                {ex.id === 'writing' && <WritingExercise />}
                {ex.id === 'mindfulness' && <MindfulnessExercise />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
