import React, { useState, useEffect, useMemo } from 'react';
import ThreatNewsList from '../Suggested/components/ThreatNewsList';
import NewsDonutChart from './components/NewsDonutChart';
import MonthlyNewsChart from './components/MonthlyNewsChart';
import NewsCategoryFilters from './components/NewsCategoryFilters';
import { fetchTIArticles, type TIArticle } from "../../services/tiService";
import type { ThreatArticle } from '../../models/incidentModel';

/**
 * NewsPage Component
 * Intelligence Dashboard with categorization and high-urgency threats.
 */
const NewsPage: React.FC = () => {
    const [tiArticles, setTiArticles] = useState<TIArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTitle, setFilterTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const loadNews = async () => {
        setLoading(true);
        try {
            // วันที่เป้าหมายจาก Date Picker
            const targetDate = new Date(selectedDate);
            targetDate.setHours(0, 0, 0, 0);
            const startDate = targetDate.toISOString();
            
            const endTarget = new Date(targetDate);
            endTarget.setDate(endTarget.getDate() + 1);
            const endDate = endTarget.toISOString();

            // ดึงข้อมูลโดยกำหนดวันที่ให้เป็นแค่วันนี้ (ให้ Limit เยอะขึ้นเพื่อดึงข่าวทั้งหมดของวันนี้ให้ครบ)
            const items = await fetchTIArticles('NEW,READ,IN_PROGRESS,COMPLETE', 500, {
                title: filterTitle,
                startDate,
                endDate
            });
            setTiArticles(items);
        } catch (err) {
            console.error('Failed to fetch TI articles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadNews, filterTitle ? 500 : 0);
        return () => clearTimeout(timer);
    }, [filterTitle, selectedDate]);

    // Same logic helper for consistency
    const getArticleCategory = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('phishing') || t.includes('email') || t.includes('credential')) return 'phishing';
        if (t.includes('malware') || t.includes('ransomware') || t.includes('botnet')) return 'malware';
        if (t.includes('brute force') || t.includes('bruteforce') || t.includes('login')) return 'brute_force';
        if (t.includes('sql') || t.includes('injection') || t.includes('sqli')) return 'sql_injection';
        if (t.includes('ddos') || t.includes('denial of service')) return 'ddos';
        return 'other';
    };

    // Categorization logic based on keywords
    const categoryStats = useMemo(() => {
        const stats = {
            phishing: 0,
            malware: 0,
            brute_force: 0,
            sql_injection: 0,
            ddos: 0,
            other: 0
        };

        tiArticles.forEach(a => {
            const cat = getArticleCategory(a.title);
            stats[cat as keyof typeof stats]++;
        });

        return stats;
    }, [tiArticles]);

    // Filtered articles based on category
    const filteredArticles = useMemo(() => {
        if (selectedCategory === 'ALL') return tiArticles;
        return tiArticles.filter(a => getArticleCategory(a.title) === selectedCategory);
    }, [tiArticles, selectedCategory]);

    // Donut Chart Calculation
    const chartData = useMemo(() => {
        const total = Object.values(categoryStats).reduce((a, b) => a + b, 0);
        if (total === 0) return [];

        const colors: Record<string, string> = {
            phishing: '#3b82f6',     // Blue
            malware: '#ef4444',      // Red
            brute_force: '#f59e0b',  // Amber
            sql_injection: '#8b5cf6', // Violet
            ddos: '#06b6d4',         // Cyan
            other: '#6b7280'         // Gray
        };

        let currentAngle = 0;
        return Object.entries(categoryStats).map(([cat, count]) => {
            const percentage = (count / total) * 100;
            const angle = (count / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            return { cat, count, percentage, color: colors[cat], startAngle, angle };
        }).filter(d => d.count > 0);
    }, [categoryStats]);



    // Format for component
    const uiArticles: ThreatArticle[] = useMemo(() => {
        return filteredArticles.map((a: any) => ({
            id: a.externalId,
            source: a.source,
            title: a.title,
            url: a.url,
            publishTime: a.publishTime,
            contentText: a.contentText || "",
            status: a.status,
        }));
    }, [filteredArticles]);


    return (
        <div className="overview-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ color: 'var(--accent-green)', letterSpacing: '2px', borderBottom: '1px solid #333', paddingBottom: '10px', width: '100%', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '24px' }}>🛡️ Intelligence Dashboard</span>
                        <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>OPERATIONAL RECONNAISSANCE</span>
                    </h2>
                </div>

                {/* ROW 1: Dashboard and Top 5 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '20px', height: '300px' }}>
                    <NewsDonutChart
                        tiArticlesCount={tiArticles.length}
                        chartData={chartData}
                        categoryStats={categoryStats}
                    />

                    <MonthlyNewsChart />
                </div>

                {/* ROW 2: Intel & Context List */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                    <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h4 style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', letterSpacing: '2px', margin: 0 }}>INTEL & CONTEXT STREAM</h4>
                                <div style={{ width: '40px', height: '1px', background: '#333' }}></div>
                            </div>

                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="SEARCH THREAT FEEDS..."
                                    className="input-dark"
                                    value={filterTitle}
                                    onChange={(e) => setFilterTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '32px',
                                        fontSize: '10px',
                                        paddingLeft: '35px',
                                        border: '1px solid #222',
                                        borderRadius: '4px',
                                        letterSpacing: '1px'
                                    }}
                                />
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontSize: '10px' }}>🔍</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: '#444' }}>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="input-dark"
                                    style={{
                                        height: '30px',
                                        fontSize: '10px',
                                        padding: '0 8px',
                                        border: '1px solid #222',
                                        borderRadius: '4px',
                                        letterSpacing: '1px',
                                        color: '#aaa',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{ width: '1px', height: '12px', background: '#222' }}></div>
                                <span style={{ textTransform: 'uppercase' }}>
                                    {selectedDate === new Date().toISOString().split('T')[0] ? "TODAY'S FEEDS" : "PAST FEEDS"}
                                </span>
                                <div style={{ width: '1px', height: '12px', background: '#222' }}></div>
                                <button
                                    className="btn"
                                    style={{ padding: '2px 8px', fontSize: '9px', borderColor: '#222' }}
                                    onClick={() => { 
                                        setFilterTitle(''); 
                                        setSelectedCategory('ALL'); 
                                        setSelectedDate(new Date().toISOString().split('T')[0]);
                                    }}
                                >
                                    RESET
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <NewsCategoryFilters
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            categoryStats={categoryStats}
                            tiArticlesCount={tiArticles.length}
                        />
                    </div>

                    <div className="card" style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                        <ThreatNewsList
                            articles={uiArticles}
                            onSelect={(id) => { }}
                            selectedId={''}
                            loading={loading}
                            hideStatus={true}
                            showLink={true}
                        />
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px', color: '#222', fontSize: '9px', letterSpacing: '2px' }}>
                CORE INTELLIGENCE RELAY // SECURITY LEVEL: BETA-9
            </div>
        </div>
    );
};

export default NewsPage;
