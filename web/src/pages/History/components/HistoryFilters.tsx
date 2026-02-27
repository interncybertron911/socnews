import React from 'react';

interface HistoryFiltersProps {
    filterTitle: string;
    setFilterTitle: (val: string) => void;
    filterUser: string;
    setFilterUser: (val: string) => void;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
    filterTitle,
    setFilterTitle,
    filterUser,
    setFilterUser
}) => {
    return (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '10px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>SEARCH TITLE</label>
                <input
                    className="input-dark"
                    placeholder="🔍 News title..."
                    value={filterTitle}
                    onChange={e => setFilterTitle(e.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>SEARCH OPERATOR</label>
                <input
                    className="input-dark"
                    placeholder="👤 Assigned to..."
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
};

export default HistoryFilters;
