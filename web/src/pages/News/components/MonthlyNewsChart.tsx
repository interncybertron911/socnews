import React, { useState, useEffect, useMemo } from 'react';
import { fetchTIArticles } from '../../../services/tiService';

const MonthlyNewsChart: React.FC = () => {
    const today = new Date();
    const [month, setMonth] = useState<number>(today.getMonth());
    const [year, setYear] = useState<number>(today.getFullYear());
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        const loadMonthData = async () => {
            setLoading(true);
            try {
                // First day of selected month
                const start = new Date(year, month, 1, 0, 0, 0, 0);
                const startStr = start.toISOString();

                // Last day of selected month
                const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
                const endStr = end.toISOString();

                const items = await fetchTIArticles('NEW,READ,IN_PROGRESS,COMPLETE', 5000, {
                    startDate: startStr,
                    endDate: endStr
                });
                setArticles(items);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadMonthData();
    }, [month, year]);

    // Group by day of month
    const { dailyCounts, maxCount, totalCount } = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const counts = Array(daysInMonth).fill(0);

        articles.forEach(a => {
            const date = new Date(a.publishTime);
            if (date.getMonth() === month && date.getFullYear() === year) {
                const day = date.getDate();
                if (day >= 1 && day <= daysInMonth) {
                    counts[day - 1]++;
                }
            }
        });

        const max = Math.max(...counts, 10); // scale reference
        const total = counts.reduce((sum, val) => sum + val, 0);
        return { dailyCounts: counts, maxCount: max, totalCount: total };
    }, [articles, month, year]);

    const yAxisLabels = [maxCount, Math.round(maxCount / 2), 0];

    return (
        <div className="card" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Header and Selectors */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pulse" style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%' }}></span>
                    MONTHLY INCIDENT FREQUENCY
                </div>
                <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="input-dark"
                        style={{ padding: '2px 8px', fontSize: '10px', height: '26px' }}
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="input-dark"
                        style={{ padding: '2px 8px', fontSize: '10px', height: '26px' }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Total display - Made smaller per user request */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                    {loading ? '...' : totalCount}
                </span>
                <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>
                    TOTAL INCIDENTS IN {months[month].toUpperCase()} {year}
                </span>
            </div>

            {/* Chart Area */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', marginLeft: '5px' }}>

                {/* Y-Axis Labels */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    paddingRight: '15px',
                    paddingBottom: '24px', // Space for X-axis labels
                    color: '#666',
                    fontSize: '9px',
                    textAlign: 'right',
                    minWidth: '25px'
                }}>
                    {yAxisLabels.map((val, i) => <span key={i}>{val}</span>)}
                </div>

                {/* Main Graph Container */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

                    {/* Horizontal Grid Lines */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '24px', pointerEvents: 'none' }}>
                        <div style={{ borderTop: '1px dashed #333', position: 'absolute', top: '0%', width: '100%' }}></div>
                        <div style={{ borderTop: '1px dashed #333', position: 'absolute', top: '50%', width: '100%' }}></div>
                        <div style={{ borderTop: '1px solid #444', position: 'absolute', bottom: '0%', width: '100%' }}></div>
                    </div>

                    {/* Bars and X-Axis Container */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', position: 'relative', zIndex: 1, paddingBottom: '24px' }}>
                        {loading && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                                <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>LOADING...</span>
                            </div>
                        )}

                        {dailyCounts.map((count, idx) => {
                            const date = idx + 1;
                            const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            const isHovered = hoveredDay === date;

                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredDay(date)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        height: '100%',
                                        position: 'relative',
                                        cursor: 'crosshair'
                                    }}
                                >
                                    {/* Tooltip */}
                                    {isHovered && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: `calc(${heightPercent}% + 8px)`,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: '#111',
                                            border: '1px solid var(--accent-green)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '9px',
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                            zIndex: 20,
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                                        }}>
                                            <span style={{ color: 'var(--accent-green)' }}>{months[month]} {date}:</span> {count} Incidents
                                        </div>
                                    )}

                                    {/* The Bar */}
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${heightPercent}%`,
                                            minHeight: count > 0 ? '2px' : '0',
                                            background: count > 0 ? 'var(--accent-green)' : 'transparent',
                                            borderRadius: '2px 2px 0 0',
                                            opacity: isHovered ? 1 : 0.6,
                                            boxShadow: isHovered ? '0 0 10px rgba(0, 255, 100, 0.4)' : 'none',
                                            transition: 'all 0.2s ease',
                                            borderTop: isHovered && count > 0 ? '1px solid #fff' : 'none'
                                        }}
                                    />

                                    {/* X-Axis Date Labels */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '9px',
                                        color: isHovered ? 'var(--accent-green)' : '#555',
                                        fontWeight: isHovered ? 'bold' : 'normal',
                                        transition: 'color 0.2s'
                                    }}>
                                        {/* Display specific labels to avoid clutter, but show hovered day */}
                                        {date === 1 || date % 5 === 0 || date === dailyCounts.length || isHovered ? date : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyNewsChart;
