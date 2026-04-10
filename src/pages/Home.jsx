import { Link } from 'react-router-dom'
import Disclaimer from '../components/Layout/Disclaimer'
import { useAuth } from '../contexts/AuthContext'
import styles from './Home.module.css'

const FEATURES = [
  {
    icon: '💬',
    title: 'Chat con Aria',
    desc: 'Uno spazio sicuro per riflettere sui tuoi sentimenti con un\'assistente empatica e non giudicante.',
    link: '/chat',
    cta: 'Inizia a parlare',
    color: '#6fcf97',
  },
  {
    icon: '🌡️',
    title: 'Tracker dell\'Umore',
    desc: 'Tieni traccia di come ti senti giorno per giorno e osserva i tuoi pattern emotivi nel tempo.',
    link: '/umore',
    cta: 'Registra il tuo umore',
    color: '#f2c94c',
  },
  {
    icon: '🧘',
    title: 'Esercizi Pratici',
    desc: 'Respirazione guidata, scrittura riflessiva e grounding per ritrovare calma e chiarezza.',
    link: '/esercizi',
    cta: 'Prova un esercizio',
    color: '#56ccf2',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Uno spazio per te
            <span className={styles.heroAccent}> nelle relazioni</span>
          </h1>
          <p className={styles.heroSub}>
            Attraversare momenti difficili nelle relazioni sentimentali può essere travolgente.
            Qui trovi uno spazio sicuro per riflettere, esprimere le emozioni e ritrovare equilibrio.
          </p>
          <div className={styles.heroActions}>
            <Link to="/chat" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
              Parla con Aria
            </Link>
            {!user && (
              <Link to="/accesso" className="btn btn-ghost" style={{ fontSize: 15, padding: '12px 28px' }}>
                Crea account gratuito
              </Link>
            )}
          </div>
          {user && (
            <p className={styles.welcomeBack}>
              Bentornato/a, <strong>{user.email.split('@')[0]}</strong> 👋
            </p>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className={styles.section}>
        <Disclaimer />
      </section>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cosa trovi qui</h2>
        <div className={styles.grid}>
          {FEATURES.map(f => (
            <Link key={f.link} to={f.link} className={styles.featureCard} style={{ '--card-color': f.color }}>
              <div className={styles.featureIcon} style={{ background: f.color + '22', color: f.color }}>
                {f.icon}
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
              <span className={styles.featureCta} style={{ color: f.color }}>
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nota finale */}
      <section className={styles.section}>
        <div className={styles.note}>
          <p>
            Liv è uno strumento di supporto pensato per chi vuole prendersi cura
            del proprio stato emotivo. Non sostituisce la terapia professionale, ma può essere un
            utile punto di partenza per riflettere e capire meglio se stessi.
          </p>
          <p style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            Se stai cercando un professionista, ti consigliamo di contattare il tuo medico di base
            o cercare uno psicologo/psicoterapeuta nella tua zona.
          </p>
        </div>
      </section>
    </div>
  )
}
