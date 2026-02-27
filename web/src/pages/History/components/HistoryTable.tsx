import React from 'react';
import { TIArticle } from '../../../services/tiService';

interface HistoryTableProps {
    articles: TIArticle[];
    onReset: (id: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ articles, onReset }) => {
    if (articles.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5, fontSize: '14px', border: '1px dashed #222' }}>
                No completed news records found.
            </div>
        );
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: 'var(--accent-green)' }}>
                    <th style={{ padding: '12px', width: '50%' }}>NEWS TITLE</th>
                    <th style={{ padding: '12px' }}>OPERATOR</th>
                    <th style={{ padding: '12px' }}>SOURCE</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTION</th>
                </tr>
            </thead>
            <tbody>
                {articles.map((article, idx) => (
                    <tr key={article.externalId} style={{ borderBottom: '1px solid #1a1a1a', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{article.title}</td>
                        <td style={{ padding: '12px' }}>
                            <span style={{
                                padding: '2px 8px',
                                background: 'rgba(0, 150, 255, 0.1)',
                                color: 'var(--accent-blue, #0096ff)',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}>
                                {article.assignedTo || 'Unassigned'}
                            </span>
                        </td>
                        <td style={{ padding: '12px', opacity: 0.6, fontSize: '10px' }}>{article.source}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                            {article.isDeleted && (
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 10px', fontSize: '9px' }}
                                    onClick={() => onReset(article.externalId)}
                                >
                                    RESET TO NEW
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default HistoryTable;
