import React, { useState, useMemo } from 'react';

interface NewsDonutChartProps {
    tiArticlesCount: number;
    chartData: any[]; // Kept for prop compatibility
    categoryStats: Record<string, number>;
}

const NewsDonutChart: React.FC<NewsDonutChartProps> = ({ tiArticlesCount, categoryStats }) => {
    const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Increase circle sizes
    const SVG_SIZE = 240;
    const CENTER = SVG_SIZE / 2;
    const radius = 100;
    const strokeWidth = 20;
    const hoverStrokeWidth = 26; // Thicker when hovered
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    const colors: Record<string, string> = {
        phishing: '#3b82f6', malware: '#ef4444', brute_force: '#f59e0b',
        sql_injection: '#8b5cf6', ddos: '#06b6d4', other: '#6b7280'
    };

    // Calculate chart data locally so it updates immediately when legends are toggled
    const localChartData = useMemo(() => {
        const activeStats = Object.entries(categoryStats).filter(([cat]) => !hiddenCategories.includes(cat));
        const totalActive = activeStats.reduce((sum, [_, count]) => sum + count, 0);

        if (totalActive === 0) return [];

        let currentAngle = 0;
        return activeStats.map(([cat, count]) => {
            const percentage = (count / totalActive) * 100;
            const angle = (count / totalActive) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            return { cat, count, percentage, color: colors[cat] || '#888', startAngle, angle };
        });
    }, [categoryStats, hiddenCategories]);

    const handleLegendClick = (cat: string) => {
        setHiddenCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <div className="card" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px' }}>
                THREAT LANDSCAPE DISTRIBUTION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flex: 1 }}>
                
                {/* DONUT CHART AREA */}
                <div style={{ position: 'relative', width: `${SVG_SIZE}px`, height: `${SVG_SIZE}px`, flexShrink: 0 }}>
                    <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                        {localChartData.length === 0 ? (
                            <circle
                                cx={CENTER} cy={CENTER} r={normalizedRadius}
                                stroke="#222" strokeWidth={strokeWidth}
                                fill="none"
                            />
                        ) : (
                            localChartData.map((d) => {
                                const offset = circumference - (d.percentage / 100) * circumference;
                                const isHovered = hoveredCategory === d.cat;
                                const isFaded = hoveredCategory && hoveredCategory !== d.cat;

                                return (
                                    <circle
                                        key={d.cat}
                                        cx={CENTER} cy={CENTER} r={normalizedRadius}
                                        stroke={d.color}
                                        strokeWidth={isHovered ? hoverStrokeWidth : strokeWidth}
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        style={{
                                            strokeDashoffset: offset,
                                            transform: `rotate(${d.startAngle}deg)`,
                                            transformOrigin: '50% 50%',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            cursor: 'pointer',
                                            opacity: isFaded ? 0.3 : 1,
                                            pointerEvents: 'stroke' // CRITICAL: Only trigger hover on the stroke, not the empty center!
                                        }}
                                        fill="none" // Must be none to let cursor pass through the center
                                        onMouseEnter={() => setHoveredCategory(d.cat)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                    />
                                );
                            })
                        )}
                    </svg>
                    
                    {/* DYNAMIC CENTER INFO TEXT */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', width: '100%' }}>
                        {hoveredCategory ? (
                            <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
                                <div style={{ fontSize: '11px', color: colors[hoveredCategory], fontWeight: 'bold', transition: 'color 0.3s' }}>
                                    {hoveredCategory.replace('_', ' ').toUpperCase()}
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '4px 0' }}>
                                    {categoryStats[hoveredCategory]}
                                </div>
                                <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px' }}>INCIDENTS</div>
                            </div>
                        ) : (
                            <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                                    {tiArticlesCount}
                                </div>
                                <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', marginTop: '4px' }}>TOTAL FEEDS</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* INTERACTIVE LEGEND */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', flex: 1, paddingRight: '10px' }}>
                    {Object.entries(categoryStats).map(([cat, count]) => {
                        const total = Object.values(categoryStats).reduce((a, b) => a + b, 0);
                        const percent = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                        const isHidden = hiddenCategories.includes(cat);
                        const isFaded = hoveredCategory && hoveredCategory !== cat;

                        return (
                            <div 
                                key={cat} 
                                onClick={() => handleLegendClick(cat)}
                                onMouseEnter={() => setHoveredCategory(cat)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    fontSize: '11px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: isHidden ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                                    border: isHidden ? '1px dashed #333' : `1px solid transparent`,
                                    opacity: isHidden ? 0.3 : (isFaded ? 0.5 : 1),
                                    transition: 'all 0.2s ease-in-out',
                                    transform: hoveredCategory === cat && !isHidden ? 'translateX(5px)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                        width: '10px', 
                                        height: '10px', 
                                        background: isHidden ? 'transparent' : colors[cat], 
                                        border: isHidden ? `1px solid ${colors[cat]}` : 'none',
                                        borderRadius: '50%',
                                        transition: 'all 0.2s'
                                    }}></div>
                                    <span style={{ color: isHidden ? '#555' : '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {cat.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', opacity: isHidden ? 0.5 : 1 }}>
                                    <span style={{ color: isHidden ? '#555' : 'var(--accent-green)', fontWeight: 'bold' }}>{count}</span>
                                    <span style={{ color: '#555', minWidth: '30px', textAlign: 'right' }}>{percent}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default NewsDonutChart;

