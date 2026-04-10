import { useState } from 'react'
import styles from './WritingExercise.module.css'

const PROMPTS = [
  'Cosa sento nel corpo in questo momento? Come descrivo questa sensazione fisica?',
  'Qual è il pensiero che mi gira di più in testa riguardo alla mia relazione?',
  'Se potessi dire una cosa alla persona con cui ho difficoltà, cosa direi?',
  'C\'è qualcosa che sto evitando di guardare? Cosa temo di scoprire?',
  'Quando mi sono sentito/a davvero capito/a e amato/a? Cosa rendeva speciale quel momento?',
  'Cosa ho bisogno in questo momento che non sto ricevendo?',
  'Se il mio migliore amico/a vivesse la mia situazione, cosa gli/le direi?',
  'Cosa vorrei che fosse diverso tra 6 mesi? Come potrei contribuire a quel cambiamento?',
]

export default function WritingExercise() {
  const [step, setStep] = useState('intro') // intro | writing | done
  const [promptIndex, setPromptIndex] = useState(0)
  const [text, setText] = useState('')
  const [allEntries, setAllEntries] = useState([])

  const startWriting = () => {
    const idx = Math.floor(Math.random() * PROMPTS.length)
    setPromptIndex(idx)
    setText('')
    setStep('writing')
  }

  const nextPrompt = () => {
    if (text.trim()) {
      setAllEntries(prev => [...prev, { prompt: PROMPTS[promptIndex], text }])
    }
    const next = Math.floor(Math.random() * PROMPTS.length)
    setPromptIndex(next)
    setText('')
  }

  const finish = () => {
    if (text.trim()) {
      setAllEntries(prev => [...prev, { prompt: PROMPTS[promptIndex], text }])
    }
    setStep('done')
  }

  const reset = () => {
    setStep('intro')
    setText('')
    setAllEntries([])
  }

  return (
    <div className={styles.container}>
      {step === 'intro' && (
        <div className={styles.intro}>
          <div className={styles.icon}>✍️</div>
          <h3 className={styles.title}>Scrittura Riflessiva</h3>
          <p className={styles.desc}>
            La scrittura riflessiva è uno strumento potente per fare chiarezza nelle emozioni.
            Ti verranno proposte domande aperte a cui rispondere liberamente.
            Non ci sono risposte giuste o sbagliate — scrivi quello che senti davvero.
          </p>
          <ul className={styles.tips}>
            <li>Scrivi almeno 5 minuti senza fermarti</li>
            <li>Non correggere né giudicare quello che scrivi</li>
            <li>Sii onesto/a con te stesso/a</li>
          </ul>
          <button onClick={startWriting} className="btn btn-primary">
            Inizia a scrivere
          </button>
        </div>
      )}

      {step === 'writing' && (
        <div className={styles.writing + ' fade-in'}>
          <div className={styles.promptBox}>
            <span className={styles.promptLabel}>Domanda guida</span>
            <p className={styles.prompt}>{PROMPTS[promptIndex]}</p>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Scrivi liberamente qui. Nessuno vedrà questo testo..."
            className={styles.writingArea}
            rows={8}
            autoFocus
          />

          <div className={styles.wordCount}>
            {text.trim() ? text.trim().split(/\s+/).length : 0} parole
          </div>

          <div className={styles.actions}>
            <button onClick={nextPrompt} className="btn btn-ghost">
              Prossima domanda
            </button>
            <button onClick={finish} className="btn btn-primary">
              Ho finito
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className={styles.done + ' fade-in'}>
          <div className={styles.icon}>💛</div>
          <h3 className={styles.title}>Grazie per esserti fermato/a</h3>
          <p className={styles.desc}>
            Hai dedicato del tempo prezioso a te stesso/a. Questo è già un atto di cura.
            Come ti senti adesso rispetto a prima di iniziare?
          </p>

          {allEntries.length > 0 && (
            <div className={styles.entriesNote}>
              <p>Hai risposto a {allEntries.length} domanda{allEntries.length > 1 ? 'e' : ''}.</p>
              <p className={styles.privacyNote}>
                I tuoi scritti non vengono salvati né inviati da nessuna parte.
                Se vuoi conservarli, copialo prima di chiudere.
              </p>
            </div>
          )}

          <button onClick={reset} className="btn btn-primary">
            Nuovo esercizio
          </button>
        </div>
      )}
    </div>
  )
}
