import React from 'react';
import { ThreatArticle } from '../../../models/incidentModel';

// รองรับ field เพิ่มเติมจาก TI (ส่งมาจาก SuggestedPage)
// รองรับ field เพิ่มเติมจาก TI (ส่งมาจาก SuggestedPage)
type ThreatArticleWithStatus = ThreatArticle & {
    status?: string; // "NEW" | "READ" | "IN_PROGRESS" | "COMPLETE"
    lockedBy?: string | null;
    assignedTo?: string | null;
};

interface ThreatNewsListProps {
    articles: ThreatArticleWithStatus[];
    selectedId: string;
    onSelect: (id: string) => void;
    onSetStatus?: (id: string, status: any) => void;
    onDelete?: (id: string) => void;
    disabled?: boolean;
    loading?: boolean;
    hideStatus?: boolean; // NEW: Option to hide status badge
    showLink?: boolean;   // NEW: Option to show external link icon
    currentUser?: string;
}

const ThreatNewsList: React.FC<ThreatNewsListProps> = ({
    articles,
    selectedId,
    onSelect,
    onSetStatus,
    onDelete,
    disabled,
    loading,
    hideStatus = false,
    showLink = false,
    currentUser
}) => {
    return (
        <div
            className="threat-news-list"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                pointerEvents: disabled ? 'none' : 'auto',
                opacity: disabled ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
                paddingBottom: '20px'
            }}
        >
            {loading ? (
                <div className="cyber-scan-container">
                    <div className="cyber-scan-line" />
                    <div className="cyber-status-text">Scanning Threat Feeds...</div>
                </div>
            ) : articles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px', border: '1px dashed #333' }}>
                    No intelligence articles found.
                </div>
            ) : (
                articles.map((article, index) => {
                    const isActive = selectedId === article.id;
                    const isNew = article.status === "NEW";
                    const isLocked = !!article.lockedBy && article.lockedBy !== currentUser;

                    // Status colors
                    let statusColor = "var(--accent-green)";
                    let categoryGlow = "transparent";

                    if (article.status === "IN_PROGRESS") {
                        statusColor = "var(--accent-orange)";
                        categoryGlow = "rgba(255, 150, 0, 0.05)";
                    } else if (article.status === "COMPLETE") {
                        statusColor = "#00ff9d";
                        categoryGlow = "rgba(0, 255, 157, 0.05)";
                    }

                    const publishLabel = (() => {
                        if (!article.publishTime) return "";
                        try {
                            const date = new Date(article.publishTime);
                            if (isNaN(date.getTime())) return article.publishTime;
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            const hh = String(date.getHours()).padStart(2, '0');
                            const mm = String(date.getMinutes()).padStart(2, '0');
                            return `${y}-${m}-${d} ${hh}:${mm}`;
                        } catch (e) {
                            return article.publishTime;
                        }
                    })();

                    return (
                        <div
                            key={article.id}
                            className={`incident-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                            style={{
                                cursor: (disabled || isLocked) ? 'not-allowed' : 'pointer',
                                padding: '15px',
                                borderLeft: isActive ? `3px solid ${statusColor}` : `3px solid #333`,
                                background: isActive ? categoryGlow || 'rgba(0, 255, 65, 0.05)' : (article.status === 'COMPLETE' ? 'rgba(0, 255, 157, 0.02)' : 'transparent'),
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => !disabled && !isLocked && onSelect(article.id)}
                        >
                            {/* User Badge if Locked (Show only if locked by others, OR if locked by me but NOT the one I'm currently selecting in this tab) */}
                            {article.lockedBy && (article.lockedBy !== currentUser || !isActive) && (
                                <div className="presence-tag" style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 15,
                                    background: article.lockedBy === currentUser ? 'var(--accent-blue, #0096ff)' : 'var(--accent-red)',
                                    color: '#000',
                                    fontSize: '9px',
                                    padding: '2px 10px',
                                    borderBottomLeftRadius: '6px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    letterSpacing: '1px',
                                    boxShadow: `0 0 15px ${article.lockedBy === currentUser ? 'rgba(0, 150, 255, 0.4)' : 'rgba(255, 62, 62, 0.4)'}`,
                                    zIndex: 10
                                }}>
                                    {article.lockedBy}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                <div style={{ fontSize: '10px', color: statusColor, marginBottom: '5px' }}>
                                    {article.source} • {publishLabel}
                                    {article.assignedTo && <span style={{ marginLeft: 8, opacity: 0.7 }}>• Handled by: <strong>{article.assignedTo}</strong></span>}
                                </div>

                                {isNew && !hideStatus && (
                                    <div
                                        title="New"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontSize: "9px",
                                            color: "var(--accent-green)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.6px",
                                            opacity: 0.9
                                        }}
                                    >
                                        <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "var(--accent-green)", display: "inline-block" }} />
                                        NEW
                                    </div>
                                )}

                                {article.status && ["IN_PROGRESS", "COMPLETE"].includes(article.status) && !hideStatus && (
                                    <div style={{ fontSize: "9px", color: statusColor, fontWeight: 'bold' }}>
                                        {article.status}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: '1.4', flex: 1 }}>
                                    {article.title}
                                </div>
                                {showLink && (
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textDecoration: 'none', fontSize: '14px', marginTop: '2px' }}
                                    >
                                        🌐
                                    </a>
                                )}
                            </div>

                            {/* Action Buttons (Visible only if active and not locked by others) */}
                            {isActive && !isLocked && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    {(article.status === "NEW" || article.status === "READ") && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSetStatus?.(article.id, "IN_PROGRESS"); }}
                                            className="btn"
                                            style={{ fontSize: '9px', padding: '4px 8px', borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }}
                                        >
                                            IN PROGRESS
                                        </button>
                                    )}
                                    {article.status === "IN_PROGRESS" && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSetStatus?.(article.id, "COMPLETE"); }}
                                            className="btn"
                                            style={{ fontSize: '9px', padding: '4px 8px', borderColor: '#00ff9d', color: '#00ff9d' }}
                                        >
                                            COMPLETE
                                        </button>
                                    )}
                                    {article.status === "COMPLETE" && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete?.(article.id); }}
                                            className="btn"
                                            style={{ fontSize: '9px', padding: '4px 8px', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                                        >
                                            DELETE
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ThreatNewsList;
