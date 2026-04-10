import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Message from './Message'
import styles from './ChatInterface.module.css'

const WELCOME_MSG = {
  role: 'assistant',
  content: 'Ciao, sono Aria. Sono qui per offrirti uno spazio sicuro in cui riflettere su come ti senti nelle tue relazioni.\n\nPuoi raccontarmi quello che hai in mente — non c\'è niente di sbagliato o di giusto da dire. Come stai oggi?',
}

export default function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversations, setConversations] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (data) setConversations(data)
  }

  const loadConversation = async (id) => {
    const { data } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages([WELCOME_MSG, ...data])
      setConversationId(id)
      setShowHistory(false)
    }
  }

  const saveMessage = async (convId, role, content) => {
    await supabase.from('messages').insert({ conversation_id: convId, role, content })
  }

  const ensureConversation = useCallback(async (firstUserMessage) => {
    if (conversationId) return conversationId
    if (!user) return null

    const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '…' : '')
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single()

    if (data) {
      setConversationId(data.id)
      loadConversations()
      return data.id
    }
    return null
  }, [conversationId, user])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')

    // Salva nel DB (solo per utenti registrati)
    let convId = conversationId
    if (user) {
      // Passa il messaggio come titolo solo alla prima chiamata
      const isFirstRealMsg = messages.length === 1 // solo il welcome
      if (isFirstRealMsg) {
        convId = await ensureConversation(text)
      }
      if (convId) await saveMessage(convId, 'user', text)
    }

    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Errore del server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullContent += parsed.text
                setStreamingContent(fullContent)
              }
            } catch { /* skip */ }
          }
        }
      }

      const assistantMsg = { role: 'assistant', content: fullContent }
      setMessages(prev => [...prev, assistantMsg])
      setStreamingContent('')
      setIsStreaming(false)

      if (user && convId) {
        await saveMessage(convId, 'assistant', fullContent)
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Mi dispiace, si è verificato un errore: ${err.message}\n\nAssicurati che il server sia avviato e che la chiave API sia configurata correttamente.`,
      }])
      setIsStreaming(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startNewChat = () => {
    setMessages([WELCOME_MSG])
    setConversationId(null)
    setShowHistory(false)
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <div className={styles.container}>
      {/* Sidebar storico (solo utenti loggati) */}
      {user && (
        <aside className={[styles.sidebar, showHistory ? styles.sidebarOpen : ''].join(' ')}>
          <div className={styles.sidebarHeader}>
            <span>Conversazioni</span>
            <button onClick={startNewChat} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }}>
              + Nuova
            </button>
          </div>
          <div className={styles.convList}>
            {conversations.length === 0 && (
              <p className={styles.noConv}>Nessuna conversazione salvata.</p>
            )}
            {conversations.map(c => (
              <button
                key={c.id}
                className={[styles.convItem, c.id === conversationId ? styles.convItemActive : ''].join(' ')}
                onClick={() => loadConversation(c.id)}
              >
                <span className={styles.convTitle}>{c.title}</span>
                <span className={styles.convDate}>{formatDate(c.updated_at)}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          {user && (
            <button
              className={styles.historyBtn}
              onClick={() => setShowHistory(!showHistory)}
            >
              ☰ Storico
            </button>
          )}
          <div className={styles.ariaBadge}>
            <div className={styles.ariaAvatar}>A</div>
            <div>
              <div className={styles.ariaName}>Aria</div>
              <div className={styles.ariaStatus}>Assistente di supporto emotivo</div>
            </div>
          </div>
          {!user && (
            <p className={styles.guestNote}>
              <a href="/accesso" className={styles.loginLink}>Accedi</a> per salvare le conversazioni
            </p>
          )}
        </div>

        {/* Messaggi */}
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} />
          ))}
          {isStreaming && (
            <Message role="assistant" content={streamingContent} isStreaming />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi come ti senti... (Invio per inviare, Shift+Invio per andare a capo)"
            className={styles.textarea}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={styles.sendBtn}
          >
            {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
