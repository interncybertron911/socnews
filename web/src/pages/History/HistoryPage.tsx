import React, { useState, useEffect } from 'react';
import { fetchTIArticles, updateArticleStatus, type TIArticle } from '../../services/tiService';
import { socketService } from '../../services/socketService';
import { authService } from '../../services/authService';
import HistoryFilters from './components/HistoryFilters';
import HistoryTable from './components/HistoryTable';

const HistoryPage: React.FC = () => {
    const [articles, setArticles] = useState<TIArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTitle, setFilterTitle] = useState('');
    const [filterUser, setFilterUser] = useState('');

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchTIArticles('COMPLETE', 100, {
                title: filterTitle,
                assignedTo: filterUser,
                includeDeleted: true
            });
            setArticles(data);
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadHistory, 500);
        return () => clearTimeout(timer);
    }, [filterTitle, filterUser]);

    const handleReset = async (id: string) => {
        if (!window.confirm("Move this news back to NEW status?")) return;

        try {
            await updateArticleStatus(id, 'NEW', null);
            const currentUser = authService.getCurrentUser()?.username || "anonymous";

            setArticles(prev => prev.filter(a => a.externalId !== id));
            socketService.emitStatusUpdated(id, 'NEW', currentUser);
        } catch (e) {
            console.error("Failed to reset article", e);
            alert("Failed to reset article status.");
        }
    };

    return (
        <div className="overview-container" style={{ padding: '20px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>COMPLETED HISTORY</span>
                </div>

                <HistoryFilters
                    filterTitle={filterTitle}
                    setFilterTitle={setFilterTitle}
                    filterUser={filterUser}
                    setFilterUser={setFilterUser}
                />

                <div className="scrollable-y" style={{ flex: 1, minHeight: 0, padding: '0 10px' }}>
                    {loading ? (
                        <div className="cyber-scan-container">
                            <div className="cyber-scan-line" />
                            <div className="cyber-status-text">Retrieving History...</div>
                        </div>
                    ) : (
                        <HistoryTable
                            articles={articles}
                            onReset={handleReset}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
