import React from 'react';

interface DangerousThreatsProps {
    items: any[];
}

const DangerousThreats: React.FC<DangerousThreatsProps> = ({ items }) => {
    return (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse" style={{ width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '50%' }}></span>
                HIGH URGENCY OPERATIVES (TOP 5)
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {items.map((item, idx) => {
                    return (
                        <div key={item.externalId} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>0{idx + 1}</span>
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#aaa' }}>
                                {item.title}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Visit Intelligence Source"
                                    style={{ textDecoration: 'none', color: '#555', fontSize: '12px', padding: '2px' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                                >
                                    🌐
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DangerousThreats;
