import React, { useEffect, useState, useRef } from "react";
import {
  fetchMessages,
  sendMessage,
  sendBotReply,
  fetchChatSessions,
  createChatSession,
  deleteChatSession,
  updateSessionName,
  generateSessionName,
  getBotReply,
  ChatSession,
  ChatMessage,
} from "./api.ts";
import MarkdownRenderer from './MarkdownRenderer.tsx'; // Import the new component
import "./chatbot.css";
import { useNavigate } from 'react-router-dom';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isInitialized = useRef(false); // Ref to track initialization
  const navigate = useNavigate();

  // Get the current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user.username || '';

  useEffect(() => {
    // Prevent this effect from running more than once
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const existingSessions = await fetchChatSessions(username);
        if (existingSessions.length > 0) {
          setSessions(existingSessions);
          setCurrentSessionId(existingSessions[0].id);
        } else {
          // If no sessions exist, create one
          const newSession = await createChatSession("New Chat", username);
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [username]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const data = await fetchMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    let sessionId = currentSessionId;
    let newSession: ChatSession | null = null;

    // If no session exists, create one now
    if (!sessionId) {
      newSession = await createChatSession("New Chat", username);
      setSessions((prev) => [newSession as ChatSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMessage = input;
    setInput("");

    try {
      // Add user message to UI immediately
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        session_id: sessionId!,
        message: userMessage,
        sender: 'user',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      // Send message to database
      await sendMessage(sessionId!, userMessage);

      // Check if the session name is "New Chat" and update it
      const currentSession = (newSession || sessions.find(s => s.id === sessionId));
      if (currentSession && currentSession.name === "New Chat") {
        const sessionName = generateSessionName(userMessage);
        await updateSessionName(sessionId!, sessionName);
        // Update session name in the UI
        setSessions(prev =>
          prev.map(s => s.id === sessionId ? { ...s, name: sessionName, updated_at: new Date().toISOString() } : s)
             .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      }

      // Get AI response
      const botReply = await getBotReply(userMessage);

      // Add bot message to UI
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId!,
        message: botReply,
        sender: 'bot',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);

      // Send bot reply to database
      await sendBotReply(sessionId!, botReply);

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);

      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(remainingSessions);

      if (currentSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          // If no sessions are left, just clear the UI state
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    console.log('Logout button clicked. Clearing localStorage and redirecting to /login');
    localStorage.clear();
    navigate('/login', { replace: true });
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 200);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <button className="new-chat-button" onClick={handleNewChat}>
          + New Chat
        </button>
        {/* Removed sidebar logout button */}
        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => handleSessionClick(session.id)}
            >
              <div className="session-info">
                <div className="session-name">{session.name}</div>
                <div className="session-date">{formatDate(session.updated_at)}</div>
              </div>
              <button
                className="delete-session-btn"
                onClick={(e) => handleDeleteSession(session.id, e)}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-window">
        <header className="chat-header" style={{ position: 'relative' }}>
          { "🤖 Your AI Assistant"}
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1em',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            Logout
          </button>
        </header>

        <div className="chat-messages">
          {isLoading && messages.length === 0 ? (
            <div className="chat-message bot">
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Start a new conversation</h3>
              <p>Ask me anything and I'll help you out!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                <div className="chat-bubble">
                  <strong>{msg.sender === "user" }</strong>{" "}
                  <MarkdownRenderer content={msg.message} />
                </div>
              </div>
            ))
          )}
          {isLoading && messages.length > 0 && (
            <div className="chat-message bot">
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isLoading ? "Loading..." : "Type a message..."}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </footer>
        <div className="search-area-footer">
  AI Bot crafted with <span style={{ color: 'red', fontSize: '1.5em' }}>&hearts;</span> by <strong>Satyam</strong>.
  For any queries, feel free to reach out at <a href="mailto:satyamsrivastava1212@gmail.com">📩satyamsrivastava1212@gmail.com</a>
</div>

      </main>
    </div>
  );
};

export default ChatBot;
