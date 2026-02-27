import React from 'react';

interface AIAnalysisCardProps {
    title: string;
    content: string;
    isLoading: boolean;
    onGenerate: () => void;
    accentColor: string;
    background: string;
    placeholder: string;
    loadingText: string;
    showGenerate: boolean;
    footer?: React.ReactNode;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
    title,
    content,
    isLoading,
    onGenerate,
    accentColor,
    background,
    placeholder,
    loadingText,
    showGenerate,
    footer
}) => {
    return (
        <aside className="card" style={{ background }}>
            <div className="card-header" style={{ color: accentColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{title}</span>
                {showGenerate && (
                    <button
                        className="btn"
                        style={{ fontSize: 9, padding: '2px 8px' }}
                        onClick={onGenerate}
                        disabled={isLoading}
                    >
                        ✨ Generate
                    </button>
                )}
            </div>
            <div style={{ padding: 15, fontSize: 13, lineHeight: 1.6, color: '#ccc' }}>
                {isLoading ? (
                    <div className="pulse" style={{ opacity: 0.5 }}>{loadingText}</div>
                ) : (
                    content || <span style={{ color: '#555', fontStyle: 'italic' }}>{placeholder}</span>
                )}
                {footer && <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center' }}>{footer}</div>}
            </div>
        </aside>
    );
};

export default AIAnalysisCard;
