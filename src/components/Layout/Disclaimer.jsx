import styles from './Disclaimer.module.css'

export default function Disclaimer() {
  return (
    <div className={styles.disclaimer}>
      <span className={styles.icon}>⚠️</span>
      <p>
        <strong>Importante:</strong> Liv è uno strumento di supporto emotivo e riflessione personale.{' '}
        <strong>Non è un servizio terapeutico e non sostituisce lo psicologo o lo psicoterapeuta.</strong>{' '}
        Se stai attraversando una crisi o hai bisogno di supporto professionale, ti incoraggiamo a rivolgerti a un professionista della salute mentale.
        In caso di emergenza chiama il <strong>112</strong>.
      </p>
    </div>
  )
}
