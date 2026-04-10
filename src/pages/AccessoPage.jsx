import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/Auth/AuthModal'
import styles from './AccessoPage.module.css'

export default function AccessoPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tab = params.get('tab') || 'login'

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h2 className={styles.leftTitle}>Il tuo spazio personale</h2>
        <ul className={styles.benefits}>
          <li>
            <span className={styles.benefitIcon}>💬</span>
            <span>Salva le tue conversazioni con Aria</span>
          </li>
          <li>
            <span className={styles.benefitIcon}>📊</span>
            <span>Tieni uno storico del tuo umore nel tempo</span>
          </li>
          <li>
            <span className={styles.benefitIcon}>🔒</span>
            <span>I tuoi dati sono privati e solo tuoi</span>
          </li>
          <li>
            <span className={styles.benefitIcon}>✨</span>
            <span>Completamente gratuito</span>
          </li>
        </ul>
        <p className={styles.anonNote}>
          Puoi comunque usare il chatbot e gli esercizi senza registrarti.
        </p>
      </div>

      <div className={styles.right}>
        <AuthModal defaultTab={tab} onSuccess={() => navigate('/')} />
      </div>
    </div>
  )
}
