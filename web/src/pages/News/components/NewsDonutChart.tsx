import React from 'react';

interface NewsDonutChartProps {
    tiArticlesCount: number;
    chartData: any[];
    categoryStats: Record<string, number>;
}

const NewsDonutChart: React.FC<NewsDonutChartProps> = ({ tiArticlesCount, chartData, categoryStats }) => {
    const radius = 70;
    const strokeWidth = 15;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    return (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '20px' }}>
                THREAT LANDSCAPE DISTRIBUTION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                    <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                        {chartData.length === 0 ? (
                            <circle
                                cx="80" cy="80" r={normalizedRadius}
                                stroke="#222" strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                        ) : (
                            chartData.map((d, i) => {
                                const offset = circumference - (d.percentage / 100) * circumference;
                                const rotation = d.startAngle;
                                return (
                                    <circle
                                        key={d.cat}
                                        cx="80" cy="80" r={normalizedRadius}
                                        stroke={d.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        style={{
                                            strokeDashoffset: offset,
                                            transform: `rotate(${rotation}deg)`,
                                            transformOrigin: '50% 50%',
                                            transition: 'stroke-dashoffset 0.5s ease-out'
                                        }}
                                        fill="transparent"
                                    />
                                );
                            })
                        )}
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                            {tiArticlesCount}
                        </div>
                        <div style={{ fontSize: '9px', color: '#666' }}>FEEDS</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', flex: 1 }}>
                    {Object.entries(categoryStats).map(([cat, count]) => {
                        const total = Object.values(categoryStats).reduce((a, b) => a + b, 0);
                        const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                        const colors: Record<string, string> = {
                            phishing: '#3b82f6', malware: '#ef4444', brute_force: '#f59e0b',
                            sql_injection: '#8b5cf6', ddos: '#06b6d4', other: '#6b7280'
                        };
                        return (
                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', background: colors[cat], borderRadius: '2px' }}></div>
                                    <span style={{ color: '#aaa', textTransform: 'uppercase' }}>{cat.replace('_', ' ')}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{count}</span>
                                    <span style={{ color: '#444' }}>{percent}%</span>
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
