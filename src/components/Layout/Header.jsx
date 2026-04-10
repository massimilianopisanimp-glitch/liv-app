import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navClass = ({ isActive }) =>
    [styles.navLink, isActive ? styles.active : ''].join(' ')

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>💚</span>
        <span>Liv</span>
      </Link>

      <nav className={styles.nav}>
        <NavLink to="/chat" className={navClass}>Chat</NavLink>
        <NavLink to="/umore" className={navClass}>Umore</NavLink>
        <NavLink to="/esercizi" className={navClass}>Esercizi</NavLink>
      </nav>

      <div className={styles.actions}>
        {user ? (
          <>
            <span className={styles.userEmail}>{user.email.split('@')[0]}</span>
            <button onClick={handleSignOut} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
              Esci
            </button>
          </>
        ) : (
          <Link to="/accesso" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}>
            Accedi
          </Link>
        )}
      </div>
    </header>
  )
}
