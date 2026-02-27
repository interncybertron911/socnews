import React from 'react';

export interface DynamicField {
    id: string;
    key: string;
    value: string | DynamicField[];
}

export const SIGMA_KEYS = [
    'title', 'id', 'status', 'description', 'author', 'date', 'references',
    'logsource', 'detection', 'fields', 'falsepositives', 'level', 'tags'
];

interface SigmaDynamicFieldProps {
    fields: DynamicField[];
    updateField: (fieldId: string, updates: Partial<DynamicField>) => void;
    toggleNesting: (fieldId: string) => void;
    removeField: (fieldId: string) => void;
    addField: (targetItems: DynamicField[], parentId?: string) => void;
}

const SigmaDynamicField: React.FC<SigmaDynamicFieldProps> = ({
    fields,
    updateField,
    toggleNesting,
    removeField,
    addField
}) => {
    const renderFields = (items: DynamicField[], parentId?: string) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((field) => (
                    <div key={field.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '12px',
                        background: '#0f0f0f',
                        border: '1px solid #222',
                        borderRadius: '4px'
                    }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                                className="input-dark"
                                style={{ width: '150px', height: '32px', fontSize: '11px' }}
                                value={SIGMA_KEYS.includes(field.key) ? field.key : 'other'}
                                onChange={(e) => updateField(field.id, { key: e.target.value === 'other' ? 'custom_key' : e.target.value })}
                            >
                                {SIGMA_KEYS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                                <option value="other">CUSTOM...</option>
                            </select>

                            {!SIGMA_KEYS.includes(field.key) && (
                                <input
                                    type="text"
                                    className="input-dark"
                                    style={{ width: '120px', height: '32px', fontSize: '11px' }}
                                    value={field.key}
                                    placeholder="Enter Key..."
                                    onChange={(e) => updateField(field.id, { key: e.target.value })}
                                />
                            )}

                            <div style={{ flex: 1 }}>
                                {Array.isArray(field.value) ? (
                                    <div style={{ fontSize: '10px', color: 'var(--accent-blue)', opacity: 0.7 }}>[ NESTED BLOCK ]</div>
                                ) : field.key === 'id' ? (
                                    <input
                                        type="text"
                                        className="input-dark"
                                        style={{ width: '100%', height: '32px', fontSize: '11px', padding: '6px', opacity: 0.5, cursor: 'not-allowed' }}
                                        value={field.value as string}
                                        readOnly
                                        placeholder="Rule ID..."
                                    />
                                ) : field.key === 'level' ? (
                                    <select
                                        className="input-dark"
                                        style={{ width: '100%', height: '32px', fontSize: '11px' }}
                                        value={field.value as string}
                                        onChange={(e) => updateField(field.id, { value: e.target.value })}
                                    >
                                        <option value="low">LOW</option>
                                        <option value="medium">MEDIUM</option>
                                        <option value="high">HIGH</option>
                                        <option value="critical">CRITICAL</option>
                                    </select>
                                ) : field.key === 'status' ? (
                                    <select
                                        className="input-dark"
                                        style={{ width: '100%', height: '32px', fontSize: '11px' }}
                                        value={field.value as string}
                                        onChange={(e) => updateField(field.id, { value: e.target.value })}
                                    >
                                        <option value="experimental">EXPERIMENTAL</option>
                                        <option value="test">TEST</option>
                                        <option value="stable">STABLE</option>
                                        <option value="deprecated">DEPRECATED</option>
                                        <option value="unsupported">UNSUPPORTED</option>
                                    </select>
                                ) : (
                                    <textarea
                                        className="input-dark"
                                        style={{ width: '100%', minHeight: '32px', fontSize: '11px', padding: '6px' }}
                                        value={field.value as string}
                                        onChange={(e) => updateField(field.id, { value: e.target.value })}
                                        placeholder="Enter Data..."
                                    />
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    title={Array.isArray(field.value) ? "Convert to Text" : "Convert to Nested"}
                                    onClick={() => toggleNesting(field.id)}
                                    style={{ color: Array.isArray(field.value) ? 'var(--accent-orange)' : 'var(--accent-blue)' }}
                                >
                                    {Array.isArray(field.value) ? '📄' : '🌲'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    title="Delete Field"
                                    onClick={() => removeField(field.id)}
                                    style={{ color: 'var(--accent-red)' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {Array.isArray(field.value) && (
                            <div style={{ marginLeft: '30px', borderLeft: '1px dashed #333', paddingLeft: '15px', marginTop: '5px' }}>
                                {renderFields(field.value, field.id)}
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ fontSize: '9px', padding: '3px 8px', marginTop: '10px', borderColor: '#333', color: '#666' }}
                                    onClick={() => addField(field.value as DynamicField[], field.id)}
                                >
                                    + ADD SUB-HEADER
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return <>{renderFields(fields)}</>;
};

export default SigmaDynamicField;
