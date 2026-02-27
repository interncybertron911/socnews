import React from 'react';

interface NewsCategoryFiltersProps {
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    categoryStats: Record<string, number>;
    tiArticlesCount: number;
}

const NewsCategoryFilters: React.FC<NewsCategoryFiltersProps> = ({
    selectedCategory,
    setSelectedCategory,
    categoryStats,
    tiArticlesCount
}) => {
    return (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                    fontSize: '9px',
                    padding: '4px 12px',
                    borderRadius: '15px',
                    background: selectedCategory === 'ALL' ? 'var(--accent-green)' : 'transparent',
                    color: selectedCategory === 'ALL' ? '#000' : '#888',
                    border: '1px solid ' + (selectedCategory === 'ALL' ? 'var(--accent-green)' : '#333'),
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}
            >
                ALL ({tiArticlesCount})
            </button>
            {Object.entries(categoryStats).map(([cat, count]) => {
                const colors: Record<string, string> = {
                    phishing: '#3b82f6', malware: '#ef4444', brute_force: '#f59e0b',
                    sql_injection: '#8b5cf6', ddos: '#06b6d4', other: '#6b7280'
                };
                const isActive = selectedCategory === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            fontSize: '9px',
                            padding: '4px 12px',
                            borderRadius: '15px',
                            background: isActive ? colors[cat] : 'transparent',
                            color: isActive ? '#fff' : '#666',
                            border: '1px solid ' + (isActive ? colors[cat] : '#222'),
                            cursor: 'pointer',
                            letterSpacing: '1px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#fff' : colors[cat] }}></div>
                        {cat.replace('_', ' ').toUpperCase()} ({count})
                    </button>
                );
            })}
        </div>
    );
};

export default NewsCategoryFilters;
