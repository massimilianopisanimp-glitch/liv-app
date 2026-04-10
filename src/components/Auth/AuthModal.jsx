import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AuthModal.module.css'

export default function AuthModal({ defaultTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (tab === 'login') {
        await signIn(email, password)
        onSuccess?.()
      } else {
        await signUp(email, password)
        setSuccessMsg('Registrazione completata! Controlla la tua email per confermare l\'account.')
      }
    } catch (err) {
      const msg = err.message || 'Errore. Riprova.'
      if (msg.includes('Invalid login credentials')) {
        setError('Email o password non corretti.')
      } else if (msg.includes('already registered')) {
        setError('Questa email è già registrata. Prova ad accedere.')
      } else if (msg.includes('Password should be')) {
        setError('La password deve essere di almeno 6 caratteri.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={[styles.tab, tab === 'login' ? styles.activeTab : ''].join(' ')}
          onClick={() => { setTab('login'); setError(''); setSuccessMsg('') }}
        >
          Accedi
        </button>
        <button
          className={[styles.tab, tab === 'register' ? styles.activeTab : ''].join(' ')}
          onClick={() => { setTab('register'); setError(''); setSuccessMsg('') }}
        >
          Registrati
        </button>
      </div>

      <div className={styles.body}>
        <p className={styles.subtitle}>
          {tab === 'login'
            ? 'Bentornato/a. Le tue conversazioni ti aspettano.'
            : 'Crea un account per salvare le tue conversazioni e tracciare il tuo umore.'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {successMsg && <div className={styles.success}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="la-tua@email.it"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={tab === 'register' ? 'Minimo 6 caratteri' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : (tab === 'login' ? 'Accedi' : 'Crea account')}
          </button>
        </form>

        <p className={styles.switch}>
          {tab === 'login' ? (
            <>Non hai un account?{' '}
              <button onClick={() => { setTab('register'); setError('') }} className={styles.switchLink}>
                Registrati
              </button>
            </>
          ) : (
            <>Hai già un account?{' '}
              <button onClick={() => { setTab('login'); setError('') }} className={styles.switchLink}>
                Accedi
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
