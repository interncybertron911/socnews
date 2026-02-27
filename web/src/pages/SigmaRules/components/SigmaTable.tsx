import React from 'react';
import { SigmaRule } from '../../../services/sigmaService';

interface SigmaTableProps {
    rules: SigmaRule[];
    loading: boolean;
    onEdit: (rule: SigmaRule) => void;
    onDelete: (ruleId: string) => void;
}

const SigmaTable: React.FC<SigmaTableProps> = ({ rules, loading, onEdit, onDelete }) => {
    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#444' }} className="pulse">LOADING RULES...</div>;
    }

    if (rules.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>NO RULES MATCHING CRITERIA</div>;
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 1, borderBottom: '1px solid #1a1a1a' }}>
                <tr>
                    <th style={{ textAlign: 'left', padding: '12px 15px', color: '#555', fontWeight: 'bold' }}>ORIGIN</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', color: '#555', fontWeight: 'bold' }}>TITLE</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', color: '#555', fontWeight: 'bold' }}>LEVEL</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', color: '#555', fontWeight: 'bold' }}>TAGS</th>
                    <th style={{ textAlign: 'right', padding: '12px 15px', color: '#555', fontWeight: 'bold' }}>ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {rules.map(rule => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid #0f0f0f' }} className="rule-row">
                        <td style={{ padding: '12px 15px' }}>
                            <span style={{
                                fontSize: '8px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: rule.isCustom ? 'rgba(0,150,255,0.1)' : 'rgba(0,255,65,0.05)',
                                color: rule.isCustom ? 'var(--accent-blue)' : 'var(--accent-green)',
                                border: `1px solid ${rule.isCustom ? 'rgba(0,150,255,0.2)' : 'rgba(0,255,65,0.1)'}`,
                                fontWeight: 'bold'
                            }}>
                                {rule.isCustom ? 'CUSTOM' : 'SYSTEM'}
                            </span>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                            <div style={{ color: '#ccc', fontWeight: 'bold', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rule.title}</div>
                            <div style={{ fontSize: '9px', color: '#444', marginTop: '2px' }}>{rule.ruleId}</div>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                            <span style={{
                                fontSize: '9px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: rule.level === 'critical' ? 'rgba(255,0,0,0.1)' : rule.level === 'high' ? 'rgba(255,150,0,0.1)' : '#111',
                                color: rule.level === 'critical' ? 'var(--accent-red)' : rule.level === 'high' ? 'var(--accent-orange)' : '#666',
                                textTransform: 'uppercase'
                            }}>
                                {rule.level || 'low'}
                            </span>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {rule.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} style={{ fontSize: '8px', color: '#444', border: '1px solid #222', padding: '1px 5px', borderRadius: '3px' }}>
                                        {tag}
                                    </span>
                                ))}
                                {rule.tags?.length > 3 && <span style={{ fontSize: '8px', color: '#333' }}>+{rule.tags.length - 3}</span>}
                            </div>
                        </td>
                        <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {rule.isCustom && (
                                    <button
                                        onClick={() => onEdit(rule)}
                                        className="btn-icon"
                                        style={{ fontSize: '12px', color: '#666' }}
                                        title="Edit Rule"
                                    >✏️</button>
                                )}
                                <button
                                    onClick={() => onDelete(rule.ruleId)}
                                    className="btn-icon"
                                    style={{ fontSize: '12px', color: 'var(--accent-red)', opacity: 0.6 }}
                                    title="Delete Rule"
                                >🗑️</button>
                                {!rule.isCustom && (
                                    <a
                                        href={`https://github.com/SigmaHQ/sigma/blob/master/${rule.sourcePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View Official Source"
                                        style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s', fontSize: '14px' }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#444'}
                                    >
                                        🌐
                                    </a>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SigmaTable;
