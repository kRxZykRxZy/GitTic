import React, { useState, useRef, useEffect } from "react";
import { sendMessage, type AIMessage } from "../../services/pollinations-ai";
import "./AIChat.css";

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI coding assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: AIMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(newMessages);
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you?",
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button className="ai-chat-toggle" onClick={() => setIsOpen(true)} title="AI Assistant">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <h3>AI Assistant</h3>
        <div className="ai-chat-actions">
          <button onClick={handleClearChat} title="Clear chat">
            Clear
          </button>
          <button onClick={() => setIsOpen(false)} title="Close">
            ×
          </button>
        </div>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`ai-message ${message.role}`}>
            <div className="ai-message-avatar">
              {message.role === "user" ? "You" : "AI"}
            </div>
            <div className="ai-message-content">
              {message.content.split("```").map((part: string, i: number) => {
                if (i % 2 === 1) {
                  // Code block
                  return (
                    <pre key={i}>
                      <code>{part}</code>
                    </pre>
                  );
                }
                // Regular text
                return (
                  <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                    {part}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-avatar">AI</div>
            <div className="ai-message-content">
              <div className="ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about coding..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
