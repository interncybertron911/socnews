import React from 'react';

interface AnalysisFiltersProps {
    filterTitle: string;
    setFilterTitle: (val: string) => void;
    filterStatuses: string[];
    setFilterStatuses: (val: string[] | ((prev: string[]) => string[])) => void;
    filterStartDate: string;
    setFilterStartDate: (val: string) => void;
    filterEndDate: string;
    setFilterEndDate: (val: string) => void;
    onReset: () => void;
}

const AnalysisFilters: React.FC<AnalysisFiltersProps> = ({
    filterTitle,
    setFilterTitle,
    filterStatuses,
    setFilterStatuses,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    onReset
}) => {
    return (
        <div style={{
            padding: '12px',
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '2px solid var(--accent-green)',
            fontSize: 10,
            boxShadow: '0 -5px 25px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 Search intelligence title..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="input-dark"
                    style={{ flex: 1, height: '32px' }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                    {['NEW', 'READ', 'IN_PROGRESS', 'COMPLETE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatuses(p =>
                                Array.isArray(p)
                                    ? (p.includes(s) ? p.filter(x => x !== s) : [...p, s])
                                    : p
                            )}
                            style={{
                                fontSize: 8,
                                background: filterStatuses.includes(s) ? 'var(--accent-green)' : '#111',
                                color: filterStatuses.includes(s) ? '#000' : '#888',
                                border: '1px solid #333',
                                padding: '4px 8px',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>FROM:</span>
                    <input
                        type="datetime-local"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="input-dark"
                        style={{ flex: 1, fontSize: '9px', height: '28px', padding: '0 5px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>TO:</span>
                    <input
                        type="datetime-local"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="input-dark"
                        style={{ flex: 1, fontSize: '9px', height: '28px', padding: '0 5px' }}
                    />
                </div>
                <button
                    className="btn"
                    style={{ padding: '0 12px', height: '28px', fontSize: 9 }}
                    onClick={onReset}
                >
                    RESET ALL
                </button>
            </div>
        </div>
    );
};

export default AnalysisFilters;
