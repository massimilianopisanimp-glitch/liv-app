import MoodTracker from '../components/MoodTracker/MoodTracker'
import styles from './PageLayout.module.css'

export default function MoodPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tracker dell'Umore</h1>
        <p className={styles.subtitle}>
          Registrare come ti senti è un atto di consapevolezza. Anche i giorni difficili meritano
          di essere riconosciuti.
        </p>
      </div>
      <MoodTracker />
    </div>
  )
}
