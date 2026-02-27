import React, { useState, useEffect, useMemo, useRef } from 'react';
import ThreatNewsList from './components/ThreatNewsList';
import AIAnalysisCard from './components/AIAnalysisCard';
import SigmaRuleCard from './components/SigmaRuleCard';
import SplunkQueryCard from './components/SplunkQueryCard';
import AnalysisFilters from './components/AnalysisFilters';
import { fetchSigmaYaml } from "../../services/sigmaYamlService";

import {
    fetchTIArticles,
    markArticleRead,
    updateArticleStatus,
    unlockArticle,
    deleteArticle,
    type TIArticle,
    type TIStatus
} from "../../services/tiService";

import { fetchSuggested } from '../../services/suggestedService';
import { convertSigmaToSplunk } from "../../services/sigmaService";
import { socketService } from "../../services/socketService";
import { authService } from "../../services/authService";

import type { ThreatArticle, SigmaRule } from '../../models/incidentModel';

/**
 * SuggestedPage Component
 * AI-driven insights for new Use Cases and Sigma Rules based on Threat Intelligence.
 */
const SuggestedPage: React.FC = () => {

    // DB-backed TI Articles (source of truth)
    const [tiArticles, setTiArticles] = useState<TIArticle[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [articlesError, setArticlesError] = useState<string | null>(null);

    // In UI we use selectedArticleId as externalId (e.g., hn_123)
    const [selectedArticleId, setSelectedArticleId] = useState<string>('');

    // ✅ 6-Panel Analysis State
    const [analysisData, setAnalysisData] = useState<{
        newsSummary: string;
        sigmaReasoning: string;
        splunkReasoning: string;
        splunkQuery: string;
        primaryRuleId: string | null;
    } | null>(null);

    const [sigmaRules, setSigmaRules] = useState<SigmaRule[]>([]);
    const [cachedRuleIds, setCachedRuleIds] = useState<string[]>([]);
    const [selectedSigmaId, setSelectedSigmaId] = useState<string>('');
    const [sigmaYamlText, setSigmaYamlText] = useState<string>('');
    const [loadingSplunk, setLoadingSplunk] = useState(false);
    const [splunkError, setSplunkError] = useState<string | null>(null);

    const [loadingSuggested, setLoadingSuggested] = useState(false);
    const [loadingRuleOnly, setLoadingRuleOnly] = useState(false); // ✅ New state
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [suggestedError, setSuggestedError] = useState<string | null>(null);

    // Individual AI loading states
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingReasoning, setLoadingReasoning] = useState(false);
    const [loadingExplanation, setLoadingExplanation] = useState(false);

    const [isSelecting, setIsSelecting] = useState(false);

    // Filter States
    const [filterTitle, setFilterTitle] = useState('');
    const [filterStatuses, setFilterStatuses] = useState<string[]>(['NEW', 'READ', 'IN_PROGRESS', 'COMPLETE']);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Ref for managing the current loading session's AbortController
    const abortControllerRef = useRef<AbortController | null>(null);
    const lockedArticleIdRef = useRef<string>(''); // ✅ Sync track of socket lock

    /**
     * Map TIArticle -> ThreatArticle shape for existing UI components.
     */
    const uiArticles: (ThreatArticle & { status?: string })[] = useMemo(() => {
        return tiArticles.map((a: any) => ({
            id: a.externalId,
            source: a.source,
            title: a.title,
            url: a.url,
            publishTime: a.publishTime,
            contentText: a.contentText || "",
            status: a.status,
            lockedBy: a.lockedBy,
            assignedTo: a.assignedTo
        }));
    }, [tiArticles]);

    const currentArticle = uiArticles.find((a) => a.id === selectedArticleId);

    // ✅ 7. Socket.io Connection & Listeners
    useEffect(() => {
        socketService.connect();

        // Listen for remote locks
        socketService.onNewsLocked(({ articleId, username }) => {
            patchTiArticle(articleId, { lockedBy: username });
        });

        // Listen for remote unlocks
        socketService.onNewsUnlocked(({ articleId }) => {
            patchTiArticle(articleId, { lockedBy: null });
        });

        // Listen for status updates
        socketService.onNewsStatusChanged(({ articleId, status }) => {
            patchTiArticle(articleId, { status });
        });

        // Listen for removals
        socketService.onNewsRemoved(({ articleId }) => {
            setTiArticles(prev => prev.filter(a => a.externalId !== articleId));
            if (selectedArticleId === articleId) {
                setSelectedArticleId('');
                setAnalysisData(null);
            }
        });

        return () => {
            socketService.offAll();
            socketService.disconnect();
        };
    }, []);

    // Initial Load & Filtered Load: TI Articles from DB
    useEffect(() => {
        const loadNews = async () => {
            setLoadingArticles(true);
            setArticlesError(null);
            try {
                const startUTC = filterStartDate ? new Date(filterStartDate).toISOString() : '';
                const endUTC = filterEndDate ? new Date(filterEndDate).toISOString() : '';

                const items = await fetchTIArticles(filterStatuses.join(','), 50, {
                    title: filterTitle,
                    startDate: startUTC,
                    endDate: endUTC
                });
                setTiArticles(items);
            } catch (err: any) {
                console.error('Failed to fetch TI articles:', err);
                setArticlesError(err?.message || 'Unknown error occurred while fetching TI articles.');
                setTiArticles([]);
            } finally {
                setLoadingArticles(false);
            }
        };

        const timer = setTimeout(loadNews, filterTitle ? 500 : 0);
        return () => clearTimeout(timer);
    }, [filterTitle, filterStatuses, filterStartDate, filterEndDate]);

    // ✅ Listen for Global Reset (Logo Click)
    useEffect(() => {
        const handleGlobalReset = async () => {
            console.log("[SuggestedPage] Global Reset triggered (soc-reset event)");

            // 1) Cancel any in-flight
            if (abortControllerRef.current) abortControllerRef.current.abort();

            // 2) Play animation + Reset visuals
            setLoadingArticles(true);
            setAnalysisData(null);
            setSigmaRules([]);
            setCachedRuleIds([]);
            setSelectedSigmaId('');
            setSigmaYamlText('');
            // Socket: Leave old lock before clearing ID
            const currentUser = authService.getCurrentUser()?.username || "anonymous";
            if (lockedArticleIdRef.current) {
                socketService.emitLeaveNews(lockedArticleIdRef.current, currentUser);
                patchTiArticle(lockedArticleIdRef.current, { lockedBy: null });
                await unlockArticle(lockedArticleIdRef.current, currentUser).catch(console.error);
                lockedArticleIdRef.current = '';
            }
            setSelectedArticleId('');

            // Wait 1s for the Cyber-Scan animation to finish
            await new Promise(resolve => setTimeout(resolve, 1000));
            setLoadingArticles(false);
            console.log("[SuggestedPage] Global Reset - Visual scan complete.");
        };

        window.addEventListener('soc-reset', handleGlobalReset);
        return () => window.removeEventListener('soc-reset', handleGlobalReset);
    }, []);

    const handleManualRefresh = async () => {
        console.log("[SuggestedPage] User triggered manual news refresh (reset selection + 1s delay)");

        // RESET all panels/selection
        const currentUser = authService.getCurrentUser()?.username || "anonymous";
        if (lockedArticleIdRef.current) {
            socketService.emitLeaveNews(lockedArticleIdRef.current, currentUser);
            patchTiArticle(lockedArticleIdRef.current, { lockedBy: null });
            await unlockArticle(lockedArticleIdRef.current, currentUser).catch(console.error);
            lockedArticleIdRef.current = '';
        }
        setSelectedArticleId('');
        setAnalysisData(null);
        setSigmaRules([]);
        setCachedRuleIds([]);
        setSelectedSigmaId('');
        setSigmaYamlText('');

        setLoadingArticles(true);
        setArticlesError(null);
        try {
            const startUTC = filterStartDate ? new Date(filterStartDate).toISOString() : '';
            const endUTC = filterEndDate ? new Date(filterEndDate).toISOString() : '';

            // Promise.all ensures both finish before proceeding
            const [data] = await Promise.all([
                fetchTIArticles(filterStatuses.join(","), 50, {
                    title: filterTitle,
                    startDate: startUTC,
                    endDate: endUTC
                }),
                new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay for animation
            ]);

            setTiArticles(data as any);
            console.log(`[SuggestedPage] Manual refresh complete: ${data.length} articles found`);
        } catch (err: any) {
            console.error('[SuggestedPage] Manual refresh failed:', err);
            setArticlesError(err?.message || 'Manual refresh failed');
        } finally {
            setLoadingArticles(false);
        }
    };

    const patchTiArticle = (externalId: string, patch: Partial<any>) => {
        setTiArticles((prev) =>
            prev.map((a) => (a.externalId === externalId ? { ...a, ...patch } : a))
        );
    };

    // ✅ helper: ensure we have an AbortController session (so Cancel Loading works)
    const ensureAbortSession = () => {
        if (!abortControllerRef.current) abortControllerRef.current = new AbortController();
        return abortControllerRef.current;
    };

    const convertYamlToSplunk = async (yamlText: string) => {
        const controller = ensureAbortSession();
        const signal = controller.signal;

        setLoadingSplunk(true);
        setSplunkError(null);

        try {
            const res = await convertSigmaToSplunk(yamlText, { signal });
            if (signal.aborted) return;
            // Not setting setSplunkQuery(res.query) as it's not used by the suggested panel's textarea
        } catch (e: any) {
            if (e?.name === "AbortError" || e?.message === "AbortError") return;
            setSplunkError(e?.message || "Convert to Splunk failed");
        } finally {
            if (!signal.aborted) setLoadingSplunk(false);
        }
    };

    const handleSelectSigma = async (rule: any) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const signal = controller.signal;

        setSelectedSigmaId(rule.id);
        setSigmaYamlText("");
        setLoadingRuleOnly(true); // ✅ Use rule-specific loading

        // Clear old rule-related analysis while loading new ones
        setAnalysisData(prev => prev ? {
            ...prev,
            sigmaReasoning: "",
            splunkReasoning: "",
            splunkQuery: "",
            primaryRuleId: rule.id
        } : null);

        try {
            // 1) Fetch YAML
            const yamlText = await fetchSigmaYaml(rule.yamlPath, { signal });
            if (signal.aborted) return;
            setSigmaYamlText(yamlText);

            // 2) Fetch Specific Analysis for this Rule
            const data = await fetchSuggested(selectedArticleId, { signal, ruleId: rule.id });
            if (signal.aborted) return;

            if (data.status === "RUNNING") {
                // Retry in 2s
                setTimeout(() => {
                    handleSelectSigma(rule);
                }, 2000);
                return;
            }

            if (data.status === "READY" && data.analysis) {
                if (data.cachedRuleIds) setCachedRuleIds(data.cachedRuleIds);
                setAnalysisData({
                    newsSummary: data.analysis.newsSummary,
                    sigmaReasoning: data.analysis.sigmaReasoning,
                    splunkReasoning: data.analysis.splunkReasoning,
                    splunkQuery: data.analysis.splunkQuery,
                    primaryRuleId: data.analysis.primaryRuleId
                });
            }

        } catch (e: any) {
            if (e?.name === "AbortError") return;
            console.error("Manual selection analysis failed:", e);
            alert(e.message || "Manual conversion failed.");
        } finally {
            if (!signal.aborted) setLoadingRuleOnly(false);
        }
    };

    const handleGenerateAI = async (task: "summary" | "reasoning" | "explanation") => {
        if (!selectedArticleId) return;

        const setLoader = {
            summary: setLoadingSummary,
            reasoning: setLoadingReasoning,
            explanation: setLoadingExplanation
        }[task];

        setLoader(true);
        try {
            const data = await fetchSuggested(selectedArticleId, { task, ruleId: selectedSigmaId });
            if (data.status === "READY" && data.analysis) {
                setAnalysisData(prev => ({
                    ...prev,
                    newsSummary: data.analysis.newsSummary || prev?.newsSummary || "",
                    sigmaReasoning: data.analysis.sigmaReasoning || prev?.sigmaReasoning || "",
                    splunkReasoning: data.analysis.splunkReasoning || prev?.splunkReasoning || "",
                    splunkQuery: data.analysis.splunkQuery || prev?.splunkQuery || "",
                    primaryRuleId: data.analysis.primaryRuleId || prev?.primaryRuleId || null
                }));
            }
        } catch (err: any) {
            console.error(`AI Generation failed (${task}):`, err);
            alert(`AI Generation failed: ${err.message}`);
        } finally {
            setLoader(false);
        }
    };




    const handleSelectArticle = async (externalId: string) => {
        const article = tiArticles.find(a => a.externalId === externalId);
        if (article?.lockedBy && article.lockedBy !== authService.getCurrentUser()?.username) {
            console.warn(`[SuggestedPage] Article ${externalId} is locked by ${article.lockedBy}`);
            return;
        }

        if (abortControllerRef.current) abortControllerRef.current.abort();

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const signal = controller.signal;

        // Socket: Leave old lock, Join new lock
        const currentUser = authService.getCurrentUser()?.username || "anonymous";
        if (lockedArticleIdRef.current) {
            socketService.emitLeaveNews(lockedArticleIdRef.current, currentUser);
            patchTiArticle(lockedArticleIdRef.current, { lockedBy: null });
        }
        socketService.emitJoinNews(externalId, currentUser);
        patchTiArticle(externalId, { lockedBy: currentUser });
        lockedArticleIdRef.current = externalId;

        // Sync article status locally and in background
        setSelectedArticleId(externalId);

        setIsSelecting(true);
        setLoadingId(externalId);
        setSuggestedError(null);
        setLoadingSuggested(true);

        // Reset analysis
        setAnalysisData(null);
        setSigmaRules([]);
        setSigmaYamlText("");
        setSelectedSigmaId("");

        try {
            // Load 6-panel bundle from backend (covers enrichment, rules, query, and analysis)
            const data = await fetchSuggested(externalId, { signal });

            if (signal.aborted) return;

            if (data.status === "RUNNING") {
                // Background task still running, keep loading state and retrying
                setTimeout(() => {
                    handleSelectArticle(externalId);
                }, 2000);
                return;
            }

            if (data.status === "READY" && data.analysis) {
                setSigmaRules(data.sigmaRules || []);
                if (data.cachedRuleIds) setCachedRuleIds(data.cachedRuleIds);
                setAnalysisData({
                    newsSummary: data.analysis.newsSummary,
                    sigmaReasoning: data.analysis.sigmaReasoning,
                    splunkReasoning: data.analysis.splunkReasoning,
                    splunkQuery: data.analysis.splunkQuery,
                    primaryRuleId: data.analysis.primaryRuleId
                });

                // Set initial YAML/Selection if primary rule is provided
                if (data.analysis.primaryRuleId) {
                    const primary = data.sigmaRules.find(r => r.id === data.analysis?.primaryRuleId);
                    if (primary) {
                        setSelectedSigmaId(primary.id);
                        if (primary.yamlPath) {
                            fetchSigmaYaml(primary.yamlPath, { signal }).then(setSigmaYamlText).catch(console.error);
                        }
                    }
                }
            }

            // Sync article status locally and in background ONLY IF it was NEW
            if (article?.status === "NEW") {
                markArticleRead(externalId).catch(console.error);
                setTiArticles(prev => prev.map(a => a.externalId === externalId ? { ...a, status: "READ" } : a));

                // Broadcast status change
                socketService.emitStatusUpdated(externalId, "READ", currentUser);
            }

        } catch (err: any) {
            if (err?.name === "AbortError" || err?.message === "AbortError") return;
            console.error("6-panel load failed:", err);
            setSuggestedError(err?.message || "Analysis failed");
        } finally {
            if (abortControllerRef.current === controller) {
                if (signal.aborted) {
                    console.log(`[SuggestedPage] Request for ${externalId} was successfully CANCELLED (signal.aborted=true)`);
                }
                setIsSelecting(false);
                setLoadingSuggested(false);
                setLoadingId(null);
                abortControllerRef.current = null;
            }
        }
    };

    const handleCancelLoading = () => {
        console.log("[SuggestedPage] User clicked CANCEL button");
        if (!abortControllerRef.current) {
            console.log("[SuggestedPage] Cancel ignored: No active AbortController found");
            return;
        }

        const idToRevert = loadingId;
        console.log(`[SuggestedPage] Aborting active session for ID: ${idToRevert || 'unknown'}`);

        abortControllerRef.current.abort();
        abortControllerRef.current = null;

        setIsSelecting(false);
        setLoadingSuggested(false);
        setLoadingSplunk(false);
        setLoadingId(null);

        console.log("[SuggestedPage] States reset to idle after cancellation");

        if (idToRevert) {
            const currentUser = authService.getCurrentUser()?.username || "anonymous";
            socketService.emitLeaveNews(idToRevert, currentUser);
            if (lockedArticleIdRef.current === idToRevert) {
                lockedArticleIdRef.current = '';
            }
            setSelectedArticleId(''); // Also clear selection on cancel

            setTiArticles((prev) =>
                prev.map((a: any) =>
                    a.externalId === idToRevert
                        ? { ...a, status: a.status === "READ" ? "NEW" : a.status, readAt: a.status === "READ" ? null : a.readAt, lockedBy: null }
                        : a
                )
            );
            socketService.emitStatusUpdated(idToRevert, "NEW", currentUser);
        }
    };

    /**
     * Handle updating status (IN_PROGRESS, COMPLETE, etc.)
     */
    const handleSetStatus = async (id: string, status: any) => {
        const selectedId = id || selectedArticleId;
        if (!selectedId) return;

        const currentUser = authService.getCurrentUser()?.username || "anonymous";
        const tiStatus = status as TIStatus;

        setTiArticles((prev) =>
            prev.map((a) => (a.externalId === selectedId ? { ...a, status: tiStatus, assignedTo: currentUser } : a))
        );

        try {
            await updateArticleStatus(selectedId, tiStatus, currentUser);
            socketService.emitStatusUpdated(selectedId, tiStatus, currentUser);
        } catch (e) {
            console.error("updateArticleStatus failed:", e);
        }
    };

    /**
     * Handle deleting the selected article
     */
    const handleDeleteSelected = async () => {
        if (!selectedArticleId) return;

        const targetId = selectedArticleId;
        const currentUser = authService.getCurrentUser()?.username || "anonymous";

        let nextId = '';
        setTiArticles((prev) => {
            const filtered = prev.filter((a) => a.externalId !== targetId);
            if (filtered.length > 0) {
                const currentIndex = prev.findIndex((a) => a.externalId === targetId);
                const nextItem = filtered[currentIndex] || filtered[filtered.length - 1];
                nextId = nextItem.externalId;
            }
            return filtered;
        });

        setSelectedArticleId(nextId);

        try {
            await deleteArticle(targetId);
            socketService.emitLeaveNews(targetId, currentUser);
            if (lockedArticleIdRef.current === targetId) {
                lockedArticleIdRef.current = '';
            }
            socketService.emitNewsDeleted(targetId);
        } catch (e) {
            console.error("deleteArticle failed:", e);
        }
    };

    return (
        <div className="overview-container">
            <div className="suggested-grid">

                {/* --- ROW 1: TECHNICAL DATA --- */}

                {/* 1. Intel Context (News + Detail) */}
                <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>INTEL & CONTEXT</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                className="btn"
                                style={{ fontSize: 10, padding: "4px 8px" }}
                                onClick={loadingSuggested ? handleCancelLoading : handleManualRefresh}
                                disabled={loadingArticles}
                            >
                                {loadingSuggested ? "Cancel" : (loadingArticles ? "Refreshing..." : "Refresh")}
                            </button>
                            <button className="btn-icon" onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ color: isFilterOpen ? 'var(--accent-green)' : 'inherit' }}>🔍</button>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px 12px 12px' }}>
                            <div style={{ minHeight: '150px' }}>
                                <ThreatNewsList
                                    articles={uiArticles}
                                    selectedId={selectedArticleId}
                                    onSelect={handleSelectArticle}
                                    onSetStatus={handleSetStatus}
                                    onDelete={handleDeleteSelected}
                                    disabled={isSelecting}
                                    loading={loadingArticles}
                                    currentUser={authService.getCurrentUser()?.username || "anonymous"}
                                />
                            </div>
                        </div>

                        {/* Sticky Bottom Tabbar Filter */}
                        {isFilterOpen && (
                            <AnalysisFilters
                                filterTitle={filterTitle}
                                setFilterTitle={setFilterTitle}
                                filterStatuses={filterStatuses}
                                setFilterStatuses={setFilterStatuses}
                                filterStartDate={filterStartDate}
                                setFilterStartDate={setFilterStartDate}
                                filterEndDate={filterEndDate}
                                setFilterEndDate={setFilterEndDate}
                                onReset={async () => {
                                    setFilterTitle('');
                                    setFilterStatuses(['NEW', 'READ', 'IN_PROGRESS', 'COMPLETE']);
                                    setFilterStartDate('');
                                    setFilterEndDate('');

                                    // Clear selection & lock
                                    const currentUser = authService.getCurrentUser()?.username || "anonymous";
                                    if (lockedArticleIdRef.current) {
                                        socketService.emitLeaveNews(lockedArticleIdRef.current, currentUser);
                                        patchTiArticle(lockedArticleIdRef.current, { lockedBy: null });
                                        lockedArticleIdRef.current = '';
                                    }
                                    setSelectedArticleId('');
                                    setAnalysisData(null);
                                }}
                            />
                        )}
                    </div>
                </aside>

                <SigmaRuleCard
                    rules={sigmaRules}
                    selectedId={selectedSigmaId}
                    onSelect={handleSelectSigma}
                    yamlText={sigmaYamlText}
                    cachedRuleIds={cachedRuleIds}
                />

                {/* 3. Splunk Query (Technical Output) */}
                <SplunkQueryCard
                    query={analysisData?.splunkQuery || ""}
                    isLoading={loadingSuggested || loadingRuleOnly}
                    onCopy={() => analysisData && navigator.clipboard.writeText(analysisData.splunkQuery)}
                />

                {/* --- ROW 2: AI ANALYSIS --- */}

                {/* 4. AI News Summary */}
                <AIAnalysisCard
                    title="AI THREAT SUMMARY"
                    content={analysisData?.newsSummary || ""}
                    isLoading={loadingSuggested || loadingSummary}
                    onGenerate={() => handleGenerateAI("summary")}
                    accentColor="var(--accent-blue)"
                    background="rgba(0,180,255,0.02)"
                    placeholder="No summary generated. Click 'Generate' to analyze."
                    loadingText="Summarizing threat news..."
                    showGenerate={!analysisData?.newsSummary && !loadingSuggested && !loadingSummary && !!selectedArticleId}
                    footer={currentArticle?.url && (
                        <a href={currentArticle.url} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 10, textDecoration: 'none' }}>Read Full Article →</a>
                    )}
                />

                {/* 5. AI Sigma Reasoning */}
                <AIAnalysisCard
                    title="DETECTION REASONING"
                    content={analysisData?.sigmaReasoning || ""}
                    isLoading={loadingSuggested || loadingRuleOnly || loadingReasoning}
                    onGenerate={() => handleGenerateAI("reasoning")}
                    accentColor="var(--accent-green)"
                    background="rgba(0,255,150,0.02)"
                    placeholder="No reasoning generated. Click 'Generate' to analyze rule choice."
                    loadingText="Evaluating rule effectiveness..."
                    showGenerate={!analysisData?.sigmaReasoning && !loadingSuggested && !loadingRuleOnly && !loadingReasoning && !!selectedSigmaId}
                    footer={selectedSigmaId && sigmaRules.find(r => r.id === selectedSigmaId)?.yamlPath && (
                        <a
                            href={`https://github.com/SigmaHQ/sigma/blob/master/rules/${sigmaRules.find(r => r.id === selectedSigmaId)?.yamlPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{ fontSize: 10, textDecoration: 'none' }}
                        >
                            View Official Sigma Source (GitHub) →
                        </a>
                    )}
                />

                {/* 6. AI Splunk Explanation */}
                <AIAnalysisCard
                    title="QUERY EXPLANATION"
                    content={analysisData?.splunkReasoning || ""}
                    isLoading={loadingSuggested || loadingRuleOnly || loadingExplanation}
                    onGenerate={() => handleGenerateAI("explanation")}
                    accentColor="var(--accent-orange)"
                    background="rgba(255,150,0,0.02)"
                    placeholder="No explanation generated. Click 'Generate' to analyze query logic."
                    loadingText="Interpreting search logic..."
                    showGenerate={!analysisData?.splunkReasoning && !loadingSuggested && !loadingRuleOnly && !loadingExplanation && !!analysisData?.splunkQuery}
                />

            </div>

            {/* Scroll Indicator */}
            {analysisData && !loadingSuggested && (
                <div style={{ textAlign: 'center', padding: '10px', opacity: 0.4, fontSize: 10, letterSpacing: 2 }}>
                    SCROLL DOWN FOR AI INSIGHTS ↓
                </div>
            )}
        </div>
    );
};

export default SuggestedPage;
