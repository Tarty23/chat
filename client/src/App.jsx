import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const savedName = localStorage.getItem('pulsechat-name') || '';

function formatTime(date) {
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

export default function App() {
  const [author, setAuthor] = useState(savedName);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/messages`)
      .then((response) => response.ok ? response.json() : [])
      .then(setMessages)
      .catch(() => setError('Could not load message history.'));

    const socket = io(API_URL);
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', (message) => setMessages((current) => [...current, message]));
    return () => socket.disconnect();
  }, []);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  function saveName(value) {
    const name = value.slice(0, 32);
    setAuthor(name);
    localStorage.setItem('pulsechat-name', name);
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!author.trim()) return setError('Choose a display name before sending a message.');
    if (!text || !socketRef.current?.connected) return;

    setError('');
    socketRef.current.emit('message:send', { author, text }, (result) => {
      if (!result?.ok) setError(result?.error || 'Message could not be sent.');
    });
    setDraft('');
  }

  return (
    <main className="app-shell">
      <section className="chat-card" aria-label="PulseChat conversation">
        <header>
          <div><p className="eyebrow">REAL-TIME CHAT</p><h1>PulseChat</h1></div>
          <span className={`status ${connected ? 'online' : ''}`}>{connected ? 'Live' : 'Connecting'}</span>
        </header>

        <div className="identity"><label htmlFor="name">You are</label><input id="name" value={author} onChange={(e) => saveName(e.target.value)} placeholder="Your display name" /></div>

        <div className="messages" aria-live="polite">
          {messages.length === 0 && <div className="empty-state">No messages yet. Start the conversation.</div>}
          {messages.map((message) => (
            <article className={`message ${message.author === author ? 'mine' : ''}`} key={message._id}>
              <div className="message-meta"><strong>{message.author}</strong><time>{formatTime(message.createdAt)}</time></div>
              <p>{message.text}</p>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="composer">
          <input aria-label="Message" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={author ? 'Write a message...' : 'Enter your name above first'} maxLength="1000" />
          <button type="submit" disabled={!connected}>Send</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
