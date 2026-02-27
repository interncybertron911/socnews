import React from 'react';

interface SigmaFiltersProps {
    search: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    category: string;
    onCategoryChange: (newCat: string) => void;
    categories: string[];
}

const SigmaFilters: React.FC<SigmaFiltersProps> = ({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    categories
}) => {
    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                <input
                    type="text"
                    placeholder="SEARCH BY TITLE OR CONTENT..."
                    className="input-dark"
                    value={search}
                    onChange={onSearchChange}
                    style={{ height: '36px', paddingLeft: '40px', fontSize: '11px', letterSpacing: '1px', width: '100%' }}
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>🔍</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', padding: '4px', overflowX: 'auto', maxWidth: '100%' }}>
                <button
                    onClick={() => onCategoryChange('all')}
                    style={{
                        padding: '6px 15px',
                        fontSize: '10px',
                        background: category === 'all' ? '#222' : 'transparent',
                        color: category === 'all' ? 'var(--accent-green)' : '#666',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    all
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        style={{
                            padding: '6px 15px',
                            fontSize: '10px',
                            background: category === cat ? '#222' : 'transparent',
                            color: category === cat ? 'var(--accent-green)' : '#666',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {cat}
                    </button>
                ))}
                <button
                    onClick={() => onCategoryChange('custom')}
                    style={{
                        padding: '6px 15px',
                        fontSize: '10px',
                        background: category === 'custom' ? '#222' : 'transparent',
                        color: category === 'custom' ? 'var(--accent-blue)' : '#666',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Custom Rules
                </button>
            </div>
        </div>
    );
};

export default SigmaFilters;
