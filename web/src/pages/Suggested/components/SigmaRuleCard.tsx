import React from 'react';
import { SigmaRule } from '../../../models/incidentModel';

interface SigmaRuleCardProps {
    rules: SigmaRule[];
    selectedId: string;
    onSelect: (rule: SigmaRule) => void;
    yamlText: string;
    cachedRuleIds: string[];
}

const SigmaRuleCard: React.FC<SigmaRuleCardProps> = ({ rules, selectedId, onSelect, yamlText, cachedRuleIds }) => {
    return (
        <aside className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">SIGMA DETECTION RULE</div>
            <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                <select
                    className="input-dark"
                    value={selectedId}
                    onChange={(e) => {
                        const next = rules.find((r) => r.id === e.target.value);
                        if (next) onSelect(next);
                    }}
                >
                    <option value="">Choose Rule ({rules.length} matches)...</option>
                    {rules.map((r) => (
                        <option key={r.id} value={r.id} style={{ color: cachedRuleIds.includes(r.id) ? 'var(--accent-green)' : 'inherit' }}>
                            {cachedRuleIds.includes(r.id) ? '● ' : ''}{r.title}
                        </option>
                    ))}
                </select>
                <div
                    className="input-dark scrollable-y"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        width: "100%",
                        fontSize: 11,
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                        padding: '10px',
                        overflow: 'auto',
                        whiteSpace: 'pre',
                        background: '#0a0a0a',
                        border: '1px solid #222',
                        borderRadius: '4px'
                    }}
                >
                    {(() => {
                        if (!yamlText) return <span style={{ color: '#555' }}>Sigma YAML will appear here...</span>;

                        const lines = yamlText.split('\n');
                        return lines.map((line, i) => {
                            const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+:)(.*)$/);
                            const commentMatch = line.match(/^(\s*)#(.*)$/);

                            if (commentMatch) {
                                return <div key={i} style={{ color: '#555' }}>{line}</div>;
                            }

                            if (keyMatch) {
                                const [_, indent, key, rest] = keyMatch;
                                return (
                                    <div key={i}>
                                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{indent}{key}</span>
                                        <span style={{ color: '#ccc' }}>{rest}</span>
                                    </div>
                                );
                            }

                            return <div key={i} style={{ color: '#ccc' }}>{line}</div>;
                        });
                    })()}
                </div>
            </div>
        </aside>
    );
};

export default SigmaRuleCard;
