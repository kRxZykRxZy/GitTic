import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { STORAGE_KEYS } from "../../utils/constants";

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    text: string;
    timestamp: string;
}

interface ChatPanelProps {
    /** Room identifier (e.g., "org:myorg" or "repo:owner/name") */
    room: string;
    /** Display title for the chat */
    title: string;
    /** Height of the chat panel */
    height?: string;
}

/**
 * Discord-like real-time chat panel for organizations and repositories.
 * Uses WebSocket on /api/v1/developer/chat for real-time messaging.
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({ room, title, height = "500px" }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [connected, setConnected] = useState(false);
    const [typing, setTyping] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // WebSocket connection to /api/v1/developer/chat
    useEffect(() => {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/developer/chat`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`[Chat] Connected to ${room}`);

            const token =
                localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
                localStorage.getItem("token") ||
                localStorage.getItem("access_token");
            if (token) {
                ws.send(JSON.stringify({ type: "auth", token }));
            }
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "auth:success":
                        setConnected(true);
                        ws.send(JSON.stringify({ type: "join", room }));
                        break;

                    case "room:joined":
                        console.log(`[Chat] Joined room: ${msg.room}`);
                        break;

                    case "room:user_joined":
                        if (msg.userId !== user?.id) {
                            addSystemMessage(`${msg.username} joined the chat`);
                        }
                        break;

                    case "room:user_left":
                        if (msg.userId !== user?.id) {
                            addSystemMessage(`${msg.username} left the chat`);
                        }
                        break;

                    case "chat:message":
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: `${msg.userId}-${msg.data.timestamp}`,
                                userId: msg.userId,
                                username: msg.username,
                                text: msg.data.text,
                                timestamp: msg.data.timestamp,
                            },
                        ]);
                        setTyping((prev) => {
                            const next = new Set(prev);
                            next.delete(msg.username);
                            return next;
                        });
                        break;

                    case "chat:typing":
                        if (msg.userId !== user?.id) {
                            setTyping((prev) => new Set(prev).add(msg.username));
                            setTimeout(() => {
                                setTyping((prev) => {
                                    const next = new Set(prev);
                                    next.delete(msg.username);
                                    return next;
                                });
                            }, 3000);
                        }
                        break;

                    case "error":
                        console.error(`[Chat] Error:`, msg.error);
                        break;
                }
            } catch (err) {
                console.error("[Chat] Failed to parse message:", err);
            }
        };

        ws.onerror = (error) => {
            console.error("[Chat] WebSocket error:", error);
            setConnected(false);
        };

        ws.onclose = () => {
            console.log("[Chat] Disconnected");
            setConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "leave", room }));
            }
            ws.close();
        };
    }, [room, user?.id]);

    const addSystemMessage = (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: `system-${Date.now()}`,
                userId: "system",
                username: "System",
                text,
                timestamp: new Date().toISOString(),
            },
        ]);
    };

    const sendMessage = useCallback(() => {
        if (!inputText.trim() || !connected || !wsRef.current) return;

        wsRef.current.send(
            JSON.stringify({
                type: "chat:message",
                room,
                data: {
                    text: inputText.trim(),
                    timestamp: new Date().toISOString(),
                },
            })
        );

        setMessages((prev) => [
            ...prev,
            {
                id: `${user?.id}-${Date.now()}`,
                userId: user?.id || "",
                username: user?.username || "You",
                text: inputText.trim(),
                timestamp: new Date().toISOString(),
            },
        ]);

        setInputText("");
    }, [inputText, connected, room, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        if (connected && wsRef.current) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            wsRef.current.send(JSON.stringify({ type: "chat:typing", room }));

            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 1000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        height,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
    };

    const headerStyle: React.CSSProperties = {
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--text-primary)",
    };

    const statusDotStyle: React.CSSProperties = {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: connected ? "var(--accent-green)" : "var(--text-muted)",
        marginRight: "8px",
    };

    const messagesStyle: React.CSSProperties = {
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    };

    const messageStyle = (isOwn: boolean, isSystem: boolean): React.CSSProperties => ({
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        gap: "2px",
        padding: isSystem ? "4px 0" : "0",
    });

    const messageBubbleStyle = (isOwn: boolean, isSystem: boolean): React.CSSProperties => ({
        maxWidth: "80%",
        padding: isSystem ? "4px 8px" : "8px 12px",
        borderRadius: "12px",
        background: isSystem
            ? "transparent"
            : isOwn
                ? "var(--accent-blue)"
                : "var(--bg-tertiary)",
        color: isSystem
            ? "var(--text-muted)"
            : isOwn
                ? "#fff"
                : "var(--text-primary)",
        fontSize: isSystem ? "12px" : "13px",
        wordBreak: "break-word",
        fontStyle: isSystem ? "italic" : "normal",
        textAlign: isSystem ? "center" : "left",
        width: isSystem ? "100%" : "auto",
    });

    const usernameStyle: React.CSSProperties = {
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-secondary)",
        paddingLeft: "12px",
    };

    const timestampStyle: React.CSSProperties = {
        fontSize: "10px",
        color: "var(--text-muted)",
        paddingLeft: "12px",
    };

    const typingStyle: React.CSSProperties = {
        fontSize: "11px",
        color: "var(--text-muted)",
        fontStyle: "italic",
        padding: "4px 12px",
    };

    const inputContainerStyle: React.CSSProperties = {
        padding: "12px",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        gap: "8px",
        background: "var(--bg-primary)",
    };

    const inputStyle: React.CSSProperties = {
        flex: 1,
        padding: "8px 12px",
        fontSize: "13px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px",
        color: "var(--text-primary)",
        outline: "none",
    };

    const sendButtonStyle: React.CSSProperties = {
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        background: connected ? "var(--accent-blue)" : "var(--bg-tertiary)",
        color: connected ? "#fff" : "var(--text-muted)",
        border: "none",
        borderRadius: "20px",
        cursor: connected ? "pointer" : "not-allowed",
        transition: "all 0.15s",
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={statusDotStyle} />
                    <div style={titleStyle}>{title}</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {connected ? "Connected" : "Disconnected"}
                </div>
            </div>

            <div style={messagesStyle}>
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                        💬 Start chatting with your team!
                    </div>
                )}
                {messages.map((msg) => {
                    const isOwn = msg.userId === user?.id;
                    const isSystem = msg.userId === "system";

                    return (
                        <div key={msg.id} style={messageStyle(isOwn, isSystem)}>
                            {!isOwn && !isSystem && <div style={usernameStyle}>{msg.username}</div>}
                            <div style={messageBubbleStyle(isOwn, isSystem)}>{msg.text}</div>
                            {!isSystem && <div style={timestampStyle}>{formatTime(msg.timestamp)}</div>}
                        </div>
                    );
                })}
                {typing.size > 0 && (
                    <div style={typingStyle}>
                        {Array.from(typing).join(", ")} {typing.size === 1 ? "is" : "are"} typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={inputContainerStyle}>
                <input
                    type="text"
                    style={inputStyle}
                    placeholder={connected ? "Type a message..." : "Connecting..."}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={!connected}
                />
                <button
                    style={sendButtonStyle}
                    onClick={sendMessage}
                    disabled={!connected || !inputText.trim()}
                    type="button"
                >
                    Send
                </button>
            </div>
        </div>
    );
};
