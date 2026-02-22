import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api-client";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { useToast } from "../../hooks/useToast";

interface KanbanCard {
    id: string;
    number: number;
    title: string;
    type: "issue" | "pr";
    assignees: string[];
    labels: string[];
    priority?: "low" | "medium" | "high";
}

interface KanbanColumn {
    id: string;
    title: string;
    cards: KanbanCard[];
    color: string;
}

interface KanbanBoardProps {
    owner: string;
    repo: string;
}

/**
 * Kanban Board for Issues and Pull Requests
 * Drag-and-drop cards between columns to update status
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({ owner, repo }) => {
    const toast = useToast();
    const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
    const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);

    const { data: columns, loading, error, refetch } = useApi<KanbanColumn[]>(
        () => api.get<KanbanColumn[]>(`/repositories/${owner}/${repo}/kanban`),
        [owner, repo]
    );

    const handleDragStart = useCallback((card: KanbanCard, columnId: string) => {
        setDraggedCard(card);
        setDraggedFromColumn(columnId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(async (targetColumnId: string) => {
        if (!draggedCard || !draggedFromColumn || draggedFromColumn === targetColumnId) {
            setDraggedCard(null);
            setDraggedFromColumn(null);
            return;
        }

        try {
            await api.patch(`/repositories/${owner}/${repo}/kanban/move`, {
                cardId: draggedCard.id,
                cardType: draggedCard.type,
                fromColumn: draggedFromColumn,
                toColumn: targetColumnId,
            });

            toast.success(`Moved ${draggedCard.type} #${draggedCard.number} to ${targetColumnId}`);
            await refetch();
        } catch (err) {
            toast.error("Failed to move card");
        } finally {
            setDraggedCard(null);
            setDraggedFromColumn(null);
        }
    }, [draggedCard, draggedFromColumn, owner, repo, toast, refetch]);

    if (loading) return <LoadingSpinner message="Loading kanban board..." />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;
    if (!columns || columns.length === 0) {
        return <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
            No items to display on the board
        </div>;
    }

    const boardStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        padding: "16px 0",
        minHeight: "600px",
    };

    const columnStyle: React.CSSProperties = {
        flex: "0 0 300px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 200px)",
    };

    const columnHeaderStyle = (color: string): React.CSSProperties => ({
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-tertiary)",
        borderTopLeftRadius: "var(--radius)",
        borderTopRightRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    });

    const columnTitleStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
    };

    const cardCountStyle: React.CSSProperties = {
        fontSize: "12px",
        padding: "2px 8px",
        background: "var(--bg-primary)",
        borderRadius: "12px",
        color: "var(--text-secondary)",
    };

    const cardsContainerStyle: React.CSSProperties = {
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    };

    const cardStyle = (priority?: string): React.CSSProperties => ({
        padding: "12px",
        background: "var(--bg-primary)",
        border: `1px solid ${priority === "high" ? "var(--accent-red)" :
                priority === "medium" ? "var(--accent-yellow)" :
                    "var(--border-color)"
            }`,
        borderRadius: "var(--radius)",
        cursor: "grab",
        transition: "transform 0.15s, box-shadow 0.15s",
    });

    const cardTitleStyle: React.CSSProperties = {
        fontSize: "13px",
        fontWeight: 500,
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    };

    const cardMetaStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        fontSize: "11px",
        color: "var(--text-secondary)",
    };

    const labelStyle = (color: string = "blue"): React.CSSProperties => ({
        padding: "2px 6px",
        borderRadius: "3px",
        background: `var(--accent-${color})`,
        color: "#fff",
        fontSize: "10px",
    });

    return (
        <div>
            <div style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Project Board</h2>
                <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "12px", height: "12px", background: "var(--accent-red)", borderRadius: "2px" }} />
                        <span>High Priority</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "12px", height: "12px", background: "var(--accent-yellow)", borderRadius: "2px" }} />
                        <span>Medium Priority</span>
                    </div>
                </div>
            </div>

            <div style={boardStyle}>
                {columns.map((column) => (
                    <div
                        key={column.id}
                        style={columnStyle}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                    >
                        <div style={columnHeaderStyle(column.color)}>
                            <div style={columnTitleStyle}>
                                <div style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: column.color,
                                }} />
                                {column.title}
                            </div>
                            <div style={cardCountStyle}>{column.cards.length}</div>
                        </div>

                        <div style={cardsContainerStyle}>
                            {column.cards.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "32px 16px",
                                    color: "var(--text-muted)",
                                    fontSize: "12px",
                                }}>
                                    Drop items here
                                </div>
                            ) : (
                                column.cards.map((card) => (
                                    <div
                                        key={card.id}
                                        draggable
                                        onDragStart={() => handleDragStart(card, column.id)}
                                        style={cardStyle(card.priority)}
                                        onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")}
                                        onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")}
                                    >
                                        <div style={cardTitleStyle}>
                                            <span>{card.type === "issue" ? "📋" : "🔀"}</span>
                                            <span>#{card.number}</span>
                                            <span style={{ flex: 1 }}>{card.title}</span>
                                        </div>
                                        <div style={cardMetaStyle}>
                                            {card.labels.map((label, i) => (
                                                <span key={i} style={labelStyle()}>
                                                    {label}
                                                </span>
                                            ))}
                                            {card.assignees.length > 0 && (
                                                <span>👤 {card.assignees.length}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
