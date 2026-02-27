import React from 'react';
import SigmaDynamicField, { DynamicField } from './SigmaDynamicField';

interface SigmaRuleModalProps {
    isOpen: boolean;
    isEditing: boolean;
    formLoading: boolean;
    formFields: DynamicField[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    updateField: (fieldId: string, updates: Partial<DynamicField>) => void;
    toggleNesting: (fieldId: string) => void;
    removeField: (fieldId: string) => void;
    addField: (targetItems: DynamicField[], parentId?: string) => void;
}

const SigmaRuleModal: React.FC<SigmaRuleModalProps> = ({
    isOpen,
    isEditing,
    formLoading,
    formFields,
    onClose,
    onSubmit,
    updateField,
    toggleNesting,
    removeField,
    addField
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div className="card" style={{
                width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                border: '1px solid var(--accent-green)', boxShadow: '0 0 50px rgba(0,255,65,0.1)'
            }}>
                <div style={{ padding: '25px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ color: 'var(--accent-green)', margin: 0, letterSpacing: '2px', fontSize: '16px' }}>
                            {isEditing ? 'EDIT SIGMA RULE' : 'CREATE CUSTOM SIGMA RULE'}
                        </h3>
                        <div style={{ fontSize: '9px', color: '#555', marginTop: '5px' }}>DYNAMIC KEY-VALUE DETECTION BUILDER</div>
                    </div>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={onSubmit} style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <SigmaDynamicField
                        fields={formFields}
                        updateField={updateField}
                        toggleNesting={toggleNesting}
                        removeField={removeField}
                        addField={addField}
                    />

                    <button
                        type="button"
                        className="btn"
                        style={{
                            height: '40px', borderStyle: 'dashed', borderColor: '#444', color: '#888',
                            fontSize: '11px', letterSpacing: '1px'
                        }}
                        onClick={() => addField(formFields)}
                    >
                        + ADD NEW HEADER FIELD
                    </button>
                </form>

                <div style={{ padding: '20px', borderTop: '1px solid #222', display: 'flex', gap: '15px' }}>
                    <button
                        type="submit"
                        className="btn"
                        style={{ flex: 2, height: '40px', fontSize: '12px' }}
                        disabled={formLoading}
                        onClick={onSubmit}
                    >
                        {formLoading ? 'PROCESSING...' : (isEditing ? 'UPDATE DETECTION RULE' : 'PUBLISH CUSTOM RULE')}
                    </button>
                    <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, height: '40px', fontSize: '12px', borderColor: '#333', color: '#666' }}
                        onClick={onClose}
                    >
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SigmaRuleModal;
