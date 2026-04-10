import styles from './Message.module.css'

export default function Message({ role, content, isStreaming }) {
  const isUser = role === 'user'

  return (
    <div className={[styles.wrapper, isUser ? styles.userWrapper : styles.assistantWrapper].join(' ')}>
      {!isUser && (
        <div className={styles.avatar}>A</div>
      )}
      <div className={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble].join(' ')}>
        <div className={styles.content}>
          {content}
          {isStreaming && <span className={styles.cursor}>▌</span>}
        </div>
      </div>
      {isUser && (
        <div className={[styles.avatar, styles.userAvatar].join(' ')}>Tu</div>
      )}
    </div>
  )
}
