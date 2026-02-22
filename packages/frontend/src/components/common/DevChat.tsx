import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api-client";
import "./DevChat.css";

interface User {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

interface Message {
    id: number;
    channelId: number;
    userId: number;
    content: string;
    attachments: string[] | null;
    replyToId: number | null;
    editedAt: string | null;
    createdAt: string;
    author: User;
}

interface Channel {
    id: number;
    name: string;
    description: string | null;
    type: "text" | "voice" | "announcement";
    categoryId: number | null;
}

interface Category {
    id: number;
    name: string;
    position: number;
    channels: Channel[];
}

interface ChatData {
    categories: Category[];
    uncategorized: Channel[];
}

export const DevChat: React.FC = () => {
    const [chatData, setChatData] = useState<ChatData | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageContent, setMessageContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedChannel) {
            loadMessages(selectedChannel.id);
            const interval = setInterval(() => loadMessages(selectedChannel.id, true), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedChannel]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadCategories = async () => {
        try {
            const response = await api.get<ChatData>("/chat/categories");
            setChatData(response.data);

            if (response.data.categories[0]?.channels[0]) {
                setSelectedChannel(response.data.categories[0].channels[0]);
            } else if (response.data.uncategorized[0]) {
                setSelectedChannel(response.data.uncategorized[0]);
            }

            setLoading(false);
        } catch (error) {
            console.error("Failed to load chat categories:", error);
            setLoading(false);
        }
    };

    const loadMessages = async (channelId: number, silent = false) => {
        try {
            const response = await api.get<{ messages: Message[] }>(
                `/chat/channels/${channelId}/messages?limit=100`
            );
            setMessages(response.data.messages);
        } catch (error) {
            if (!silent) {
                console.error("Failed to load messages:", error);
            }
        }
    };

    const sendMessage = async () => {
        if (!selectedChannel || !messageContent.trim() || sending) return;

        setSending(true);
        try {
            const payload: any = { content: messageContent.trim() };
            if (replyTo) payload.replyToId = replyTo.id;

            const newMessage = await api.post<Message>(
                `/chat/channels/${selectedChannel.id}/messages`,
                payload
            );

            setMessages([...messages, newMessage.data]);
            setMessageContent("");
            setReplyTo(null);
            textareaRef.current?.focus();
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const updateMessage = async () => {
        if (!editingMessage || !messageContent.trim() || sending) return;

        setSending(true);
        try {
            await api.patch(`/chat/messages/${editingMessage.id}`, {
                content: messageContent.trim(),
            });

            setMessages(
                messages.map((msg) =>
                    msg.id === editingMessage.id
                        ? { ...msg, content: messageContent.trim(), editedAt: new Date().toISOString() }
                        : msg
                )
            );
            setMessageContent("");
            setEditingMessage(null);
        } catch (error) {
            console.error("Failed to update message:", error);
            alert("Failed to update message");
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (messageId: number) => {
        if (!confirm("Delete this message?")) return;

        try {
            await api.delete(`/chat/messages/${messageId}`);
            setMessages(messages.filter((msg) => msg.id !== messageId));
        } catch (error) {
            console.error("Failed to delete message:", error);
            alert("Failed to delete message");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (editingMessage) {
                updateMessage();
            } else {
                sendMessage();
            }
        }
    };

    const startEdit = (message: Message) => {
        setEditingMessage(message);
        setMessageContent(message.content);
        setReplyTo(null);
        textareaRef.current?.focus();
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setMessageContent("");
    };

    const startReply = (message: Message) => {
        setReplyTo(message);
        setEditingMessage(null);
        textareaRef.current?.focus();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${timeStr}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${timeStr}`;
        } else {
            return `${date.toLocaleDateString()} ${timeStr}`;
        }
    };

    if (loading) {
        return <div className="dev-chat-loading">Loading DevChat...</div>;
    }

    return (
        <div className="dev-chat">
            <div className="dev-chat-sidebar">
                <div className="dev-chat-header">
                    <h2>💬 DevChat</h2>
                    <span className="dev-chat-subtitle">Developer Communication</span>
                </div>

                {chatData?.categories.map((category) => (
                    <div key={category.id} className="chat-category">
                        <div className="chat-category-header">{category.name}</div>
                        {category.channels.map((channel) => (
                            <div
                                key={channel.id}
                                className={`chat-channel ${selectedChannel?.id === channel.id ? "active" : ""}`}
                                onClick={() => setSelectedChannel(channel)}
                            >
                                <span className="channel-icon">
                                    {channel.type === "announcement" ? "📢" : "#"}
                                </span>
                                <span className="channel-name">{channel.name}</span>
                            </div>
                        ))}
                    </div>
                ))}

                {chatData?.uncategorized && chatData.uncategorized.length > 0 && (
                    <div className="chat-category">
                        <div className="chat-category-header">UNCATEGORIZED</div>
                        {chatData.uncategorized.map((channel) => (
                            <div
                                key={channel.id}
                                className={`chat-channel ${selectedChannel?.id === channel.id ? "active" : ""}`}
                                onClick={() => setSelectedChannel(channel)}
                            >
                                <span className="channel-icon">#</span>
                                <span className="channel-name">{channel.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="dev-chat-main">
                {selectedChannel ? (
                    <>
                        <div className="chat-main-header">
                            <h3>
                                <span className="channel-icon">
                                    {selectedChannel.type === "announcement" ? "📢" : "#"}
                                </span>
                                {selectedChannel.name}
                            </h3>
                            {selectedChannel.description && (
                                <p className="channel-description">{selectedChannel.description}</p>
                            )}
                        </div>

                        <div className="chat-messages">
                            {messages.map((message) => (
                                <div key={message.id} className="chat-message">
                                    <div className="message-avatar">
                                        {message.author.avatarUrl ? (
                                            <img src={message.author.avatarUrl} alt={message.author.username} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {message.author.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-header">
                                            <span className="message-author">
                                                {message.author.displayName || message.author.username}
                                            </span>
                                            <span className="message-time">{formatTime(message.createdAt)}</span>
                                            {message.editedAt && <span className="message-edited">(edited)</span>}
                                        </div>
                                        {message.replyToId && (
                                            <div className="message-reply-indicator">
                                                Replying to message #{message.replyToId}
                                            </div>
                                        )}
                                        <div className="message-body">{message.content}</div>
                                        <div className="message-actions">
                                            <button onClick={() => startReply(message)} title="Reply">
                                                💬
                                            </button>
                                            <button onClick={() => startEdit(message)} title="Edit">
                                                ✏️
                                            </button>
                                            <button onClick={() => deleteMessage(message.id)} title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-container">
                            {replyTo && (
                                <div className="reply-indicator">
                                    Replying to {replyTo.author.displayName || replyTo.author.username}
                                    <button onClick={() => setReplyTo(null)}>✕</button>
                                </div>
                            )}
                            {editingMessage && (
                                <div className="edit-indicator">
                                    Editing message
                                    <button onClick={cancelEdit}>Cancel</button>
                                </div>
                            )}
                            <div className="chat-input">
                                <textarea
                                    ref={textareaRef}
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={`Message #${selectedChannel.name}`}
                                    disabled={sending}
                                    rows={1}
                                />
                                <button
                                    onClick={editingMessage ? updateMessage : sendMessage}
                                    disabled={!messageContent.trim() || sending}
                                    className="send-button"
                                >
                                    {editingMessage ? "Update" : "Send"}
                                </button>
                            </div>
                            <div className="chat-input-hint">
                                Press Enter to send, Shift+Enter for new line
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-channel-selected">Select a channel to start chatting</div>
                )}
            </div>
        </div>
    );
};
