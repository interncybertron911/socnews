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
    filterSeverity: string;
    setFilterSeverity: (val: string) => void;
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
    filterSeverity,
    setFilterSeverity,
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
            gap: 12,
            zIndex: 100
        }}>
            {/* ROW 1: SEARCH */}
            <div style={{ display: 'flex', width: '100%' }}>
                <input
                    type="text"
                    placeholder="🔍 Search intelligence title..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="input-dark"
                    style={{ flex: 1, height: '32px' }}
                />
            </div>

            {/* ROW 2: STATUS & SEVERITY */}
            <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['NEW', 'READ', 'IN_PROGRESS', 'COMPLETE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatuses(p =>
                                Array.isArray(p)
                                    ? (p.includes(s) ? p.filter(x => x !== s) : [...p, s])
                                    : p
                            )}
                            style={{
                                fontSize: 9,
                                background: filterStatuses.includes(s) ? 'var(--accent-green)' : '#111',
                                color: filterStatuses.includes(s) ? '#000' : '#888',
                                border: '1px solid #333',
                                padding: '4px 10px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: filterStatuses.includes(s) ? 'bold' : 'normal'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: '8px', borderLeft: '1px solid #333' }}>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>SEVERITY:</span>
                    <select
                        className="input-dark"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        style={{ height: '26px', fontSize: '9px', padding: '0 8px', width: '120px' }}
                    >
                        <option value="ALL">ALL LEVELS</option>
                        <option value="CRITICAL">🔴 CRITICAL</option>
                        <option value="WARNING">🟠 WARNING</option>
                        <option value="INFO">⚫ INFO</option>
                    </select>
                </div>
            </div>

            {/* ROW 3: DATE & RESET */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: '160px' }}>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>FROM:</span>
                    <input
                        type="datetime-local"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="input-dark"
                        style={{ flex: 1, fontSize: '9px', height: '28px', padding: '0 5px', width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: '160px' }}>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>TO:</span>
                    <input
                        type="datetime-local"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="input-dark"
                        style={{ flex: 1, fontSize: '9px', height: '28px', padding: '0 5px', width: '100%' }}
                    />
                </div>

                <button
                    className="btn"
                    style={{ padding: '0 15px', height: '28px', fontSize: 10, fontWeight: 'bold', minWidth: '100px' }}
                    onClick={onReset}
                >
                    RESET ALL
                </button>
            </div>
        </div>
    );
};

export default AnalysisFilters;
