import React, { useState, useEffect, useCallback } from 'react';
import SigmaTable from './components/SigmaTable';
import SigmaFilters from './components/SigmaFilters';
import SigmaRuleModal from './components/SigmaRuleModal';
import { DynamicField, SIGMA_KEYS } from './components/SigmaDynamicField';
import {
    fetchSigmaRules,
    fetchSigmaCategories,
    createSigmaRule,
    updateSigmaRule,
    deleteSigmaRule,
    type SigmaRule
} from '../../services/sigmaService';


const DEFAULT_TEMPLATE: DynamicField[] = [
    { id: '1', key: 'title', value: '' },
    { id: '3', key: 'status', value: 'experimental' },
    { id: '4', key: 'description', value: '' },
    {
        id: '5', key: 'logsource', value: [
            { id: '5-1', key: 'product', value: 'windows' },
            { id: '5-2', key: 'service', value: 'security' }
        ]
    },
    {
        id: '6', key: 'detection', value: [
            { id: '6-1', key: 'selection', value: 'EventID: 4624' },
            { id: '6-2', key: 'condition', value: 'selection' }
        ]
    },
    { id: '7', key: 'level', value: 'low' },
    { id: '8', key: 'tags', value: 'attack.t1059' },
];

const SigmaRulesPage: React.FC = () => {
    const [rules, setRules] = useState<SigmaRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formFields, setFormFields] = useState<DynamicField[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const loadInitialData = async () => {
        try {
            const catRes = await fetchSigmaCategories();
            if (catRes.ok) {
                setCategories(catRes.categories);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSigmaRules({ q: search, category, page, limit: 20 });
            if (res.ok) {
                setRules(res.items);
                setTotalPages(res.pages);
                setTotalItems(res.total);
            }
        } catch (err) {
            console.error('Failed to fetch rules:', err);
        } finally {
            setLoading(false);
        }
    }, [search, category, page]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadRules, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [loadRules, search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleCategoryChange = (newCat: string) => {
        setCategory(newCat);
        setPage(1);
    };

    // --- FORM LOGIC ---
    const convertToFormFields = (rule: any): DynamicField[] => {
        const fields: DynamicField[] = [];
        Object.entries(rule).forEach(([k, v], idx) => {
            if (['id', '_id', '__v', 'createdAt', 'updatedAt', 'isCustom', 'slug', 'yamlLink', 'sourcePath', 'text'].includes(k)) return;

            // Handle detection/logsource as nested
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                fields.push({
                    id: String(Math.random()),
                    key: k,
                    value: Object.entries(v).map(([sk, sv]) => ({
                        id: String(Math.random()),
                        key: sk,
                        value: typeof sv === 'object' ? JSON.stringify(sv) : String(sv)
                    }))
                });
            } else {
                fields.push({
                    id: String(Math.random()),
                    key: k,
                    value: Array.isArray(v) ? v.join(', ') : String(v)
                });
            }
        });
        return fields;
    };

    const handleOpenModal = (rule?: SigmaRule) => {
        if (rule) {
            setIsEditing(true);
            // Convert existing rule to dynamic fields
            const existingFields = convertToFormFields(rule);
            // Ensure ruleId is preserved as 'id' field
            if (!existingFields.find(f => f.key === 'id')) {
                existingFields.unshift({ id: 'id-field', key: 'id', value: rule.ruleId });
            }
            setFormFields(existingFields);
        } else {
            setIsEditing(false);
            const template = JSON.parse(JSON.stringify(DEFAULT_TEMPLATE));
            // Auto generate ID for new custom rule
            const generatedId = crypto.randomUUID();
            template.unshift({ id: 'id-auto', key: 'id', value: generatedId });
            setFormFields(template);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormFields([]);
    };

    const addField = (targetItems: DynamicField[], parentId?: string) => {
        const newField: DynamicField = {
            id: String(Math.random()),
            key: SIGMA_KEYS[0],
            value: ''
        };

        if (!parentId) {
            setFormFields([...formFields, newField]);
        } else {
            const updateRecursive = (items: DynamicField[]): DynamicField[] => {
                return items.map(item => {
                    if (item.id === parentId) {
                        return {
                            ...item,
                            value: Array.isArray(item.value) ? [...item.value, newField] : [newField]
                        };
                    }
                    if (Array.isArray(item.value)) {
                        return { ...item, value: updateRecursive(item.value) };
                    }
                    return item;
                });
            };
            setFormFields(updateRecursive(formFields));
        }
    };

    const removeField = (fieldId: string) => {
        const filterRecursive = (items: DynamicField[]): DynamicField[] => {
            return items
                .filter(item => item.id !== fieldId)
                .map(item => {
                    if (Array.isArray(item.value)) {
                        return { ...item, value: filterRecursive(item.value) };
                    }
                    return item;
                });
        };
        setFormFields(filterRecursive(formFields));
    };

    const updateField = (fieldId: string, updates: Partial<DynamicField>) => {
        const updateRecursive = (items: DynamicField[]): DynamicField[] => {
            return items.map(item => {
                if (item.id === fieldId) {
                    return { ...item, ...updates };
                }
                if (Array.isArray(item.value)) {
                    return { ...item, value: updateRecursive(item.value) };
                }
                return item;
            });
        };
        setFormFields(updateRecursive(formFields));
    };

    const toggleNesting = (fieldId: string) => {
        const updateRecursive = (items: DynamicField[]): DynamicField[] => {
            return items.map(item => {
                if (item.id === fieldId) {
                    const isNested = Array.isArray(item.value);
                    return {
                        ...item,
                        value: isNested ? '' : [{ id: String(Math.random()), key: 'sub_key', value: '' }]
                    };
                }
                if (Array.isArray(item.value)) {
                    return { ...item, value: updateRecursive(item.value) };
                }
                return item;
            });
        };
        setFormFields(updateRecursive(formFields));
    };

    const handleDelete = async (ruleId: string) => {
        if (!window.confirm('WARNING: Are you sure you want to delete this rule? This cannot be undone.')) return;
        try {
            const res = await deleteSigmaRule(ruleId);
            if (res.ok) {
                loadRules();
            } else {
                alert('Delete failed: ' + ((res as any).error || 'Unknown error'));
            }
        } catch (err: any) {
            console.error(err);
            alert('Delete failed: ' + (err.message || 'Network error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert DynamicField[] -> Flat Payload
        const payload: any = {};
        const process = (items: DynamicField[], obj: any) => {
            items.forEach(item => {
                if (Array.isArray(item.value)) {
                    obj[item.key] = {};
                    process(item.value, obj[item.key]);
                } else {
                    // Try to handle special fields
                    if (item.key === 'tags' || item.key === 'references' || item.key === 'falsepositives') {
                        obj[item.key] = item.value.split(',').map(s => s.trim()).filter(Boolean);
                    } else {
                        obj[item.key] = item.value;
                    }
                }
            });
        };
        process(formFields, payload);

        // Map 'id' field in form to 'ruleId' for API
        if (payload.id) {
            payload.ruleId = payload.id;
            delete payload.id;
        }

        if (!payload.ruleId || !payload.title) {
            alert('Rule ID and Title are required');
            return;
        }

        setFormLoading(true);
        try {
            const res = isEditing
                ? await updateSigmaRule(payload.ruleId, payload)
                : await createSigmaRule(payload);

            if (res.ok) {
                handleCloseModal();
                loadRules();
            } else {
                alert('Operation failed: ' + (res as any).error);
            }
        } catch (err) {
            console.error(err);
            alert('Operation failed');
        } finally {
            setFormLoading(false);
        }
    };


    return (
        <div className="overview-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                <h2 style={{ color: 'var(--accent-green)', margin: 0, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '24px' }}>📜 Sigma Rules Repository</span>
                    <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>CENTRAL DETECTION DATABASE</span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '10px', color: '#444' }}>TOTAL RULES: <span style={{ color: 'var(--accent-green)' }}>{totalItems}</span></div>
                    <button className="btn" onClick={() => handleOpenModal()} style={{ padding: '5px 15px', fontSize: '10px' }}>
                        + CREATE CUSTOM RULE
                    </button>
                </div>
            </div>

            {/* Filter Row */}
            <SigmaFilters
                search={search}
                onSearchChange={handleSearch}
                category={category}
                onCategoryChange={handleCategoryChange}
                categories={categories}
            />

            {/* Rules List */}
            <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', minHeight: '500px', overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <SigmaTable
                        rules={rules}
                        loading={loading}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                </div>

                {/* Pagination Footer */}
                <div style={{ padding: '15px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <button
                        className="btn"
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                        style={{ fontSize: '10px', height: '28px' }}
                    >
                        PREV
                    </button>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
                        PAGE <span style={{ color: 'var(--accent-green)' }}>{page}</span> OF {totalPages}
                    </div>
                    <button
                        className="btn"
                        disabled={page === totalPages || loading}
                        onClick={() => setPage(p => p + 1)}
                        style={{ fontSize: '10px', height: '28px' }}
                    >
                        NEXT
                    </button>
                </div>
            </div>

            {/* --- IMPROVED FORM MODAL --- */}
            <SigmaRuleModal
                isOpen={isModalOpen}
                isEditing={isEditing}
                formLoading={formLoading}
                formFields={formFields}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                updateField={updateField}
                toggleNesting={toggleNesting}
                removeField={removeField}
                addField={addField}
            />

            <style>{`
                .rule-row:hover { background: rgba(255,255,255,0.02); }
                .btn-icon {
                    background: transparent; border: none; cursor: pointer; padding: 5px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; border-radius: 4px;
                }
                .btn-icon:hover { background: rgba(255,255,255,0.05); transform: scale(1.1); }
                
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #333; }
            `}</style>
        </div>
    );
};

export default SigmaRulesPage;
