import ChatInterface from '../components/Chat/ChatInterface'
import Disclaimer from '../components/Layout/Disclaimer'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.disclaimerBar}>
        <Disclaimer />
      </div>
      <ChatInterface />
    </div>
  )
}
