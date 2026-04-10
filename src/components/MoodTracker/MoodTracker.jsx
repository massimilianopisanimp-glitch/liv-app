import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import styles from './MoodTracker.module.css'

const MOODS = [
  { id: 'sereno',      label: 'Sereno',     emoji: '😌', color: '#6fcf97', desc: 'Mi sento tranquillo e in pace' },
  { id: 'ansioso',     label: 'Ansioso',    emoji: '😰', color: '#f2c94c', desc: 'Ho pensieri che girano in testa' },
  { id: 'triste',      label: 'Triste',     emoji: '😢', color: '#56ccf2', desc: 'Mi sento giù o malinconico' },
  { id: 'arrabbiato',  label: 'Arrabbiato', emoji: '😤', color: '#eb5757', desc: 'Provo frustrazione o rabbia' },
  { id: 'confuso',     label: 'Confuso',    emoji: '😕', color: '#bb6bd9', desc: 'Non riesco a capire cosa sento' },
]

export default function MoodTracker() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (user) fetchLogs()
  }, [user])

  const fetchLogs = async () => {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setLogs(data)
    setLoadingLogs(false)
  }

  const handleSave = async () => {
    if (!selected) return

    if (user) {
      await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood: selected,
        note: note.trim() || null,
      })
      fetchLogs()
    }

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setSelected(null)
      setNote('')
    }, 2500)
  }

  const moodCounts = MOODS.reduce((acc, m) => {
    acc[m.id] = logs.filter(l => l.mood === m.id).length
    return acc
  }, {})

  const maxCount = Math.max(...Object.values(moodCounts), 1)

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      {/* Selezione umore */}
      <div className="card fade-in">
        <h2 className={styles.sectionTitle}>Come ti senti adesso?</h2>
        <p className={styles.subtitle}>Scegli lo stato d'animo più vicino a come ti senti in questo momento.</p>

        <div className={styles.moodGrid}>
          {MOODS.map(mood => (
            <button
              key={mood.id}
              className={[styles.moodBtn, selected === mood.id ? styles.selected : ''].join(' ')}
              style={selected === mood.id ? { borderColor: mood.color, background: mood.color + '22' } : {}}
              onClick={() => setSelected(selected === mood.id ? null : mood.id)}
            >
              <span className={styles.moodEmoji}>{mood.emoji}</span>
              <span className={styles.moodLabel} style={selected === mood.id ? { color: mood.color } : {}}>
                {mood.label}
              </span>
              <span className={styles.moodDesc}>{mood.desc}</span>
            </button>
          ))}
        </div>

        {selected && !saved && (
          <div className={styles.noteArea + ' fade-in'}>
            <label htmlFor="mood-note">Vuoi aggiungere qualcosa? (opzionale)</label>
            <textarea
              id="mood-note"
              placeholder="Come mai ti senti così? Cosa è successo?"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
            <button onClick={handleSave} className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
              {user ? 'Salva umore' : 'Registra (senza account)'}
            </button>
            {!user && (
              <p className={styles.guestNote}>
                <a href="/accesso">Accedi</a> per salvare lo storico del tuo umore
              </p>
            )}
          </div>
        )}

        {saved && (
          <div className={styles.savedMsg + ' fade-in'}>
            ✓ Umore registrato. Grazie per esserti fermato/a un momento su di te.
          </div>
        )}
      </div>

      {/* Grafico storico (solo utenti loggati) */}
      {user && (
        <div className="card fade-in" style={{ marginTop: 20 }}>
          <h3 className={styles.sectionTitle} style={{ fontSize: 16 }}>Il tuo storico emotivo</h3>

          {loadingLogs ? (
            <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>
          ) : logs.length === 0 ? (
            <p className={styles.subtitle}>Nessun umore registrato ancora. Inizia oggi!</p>
          ) : (
            <>
              <div className={styles.barChart}>
                {MOODS.map(mood => (
                  <div key={mood.id} className={styles.barItem}>
                    <span className={styles.barEmoji}>{mood.emoji}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(moodCounts[mood.id] / maxCount) * 100}%`,
                          background: mood.color,
                        }}
                      />
                    </div>
                    <span className={styles.barCount}>{moodCounts[mood.id]}</span>
                  </div>
                ))}
              </div>

              <div className={styles.logList}>
                <h4 className={styles.logTitle}>Ultimi registrazioni</h4>
                {logs.slice(0, 8).map(log => {
                  const moodInfo = MOODS.find(m => m.id === log.mood)
                  return (
                    <div key={log.id} className={styles.logItem}>
                      <span className={styles.logEmoji}>{moodInfo?.emoji}</span>
                      <div className={styles.logContent}>
                        <span className={styles.logMood} style={{ color: moodInfo?.color }}>
                          {moodInfo?.label}
                        </span>
                        {log.note && <span className={styles.logNote}>{log.note}</span>}
                      </div>
                      <span className={styles.logDate}>{formatDate(log.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
