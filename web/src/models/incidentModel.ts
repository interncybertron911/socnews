export interface ThreatArticle {
    id: string; // externalId
    title: string;
    source: string;
    publishTime: string;
    url: string;
    contentText: string;
}

export interface SigmaRule {
    id: string;
    title: string;
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    logsource: any;
    matchReasons: string[];
    detectionSummary: string;
    falsePositives: string[];
    yamlLink: string;
    yamlPath: string; // ✅ เพิ่ม yamlPath
    relatedArticleId: string;
    description?: string;
}

export interface SuggestedUseCase {
    id: string;
    name: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    whyItMatters: string;
    requiredDataSources: string[];
    coverageNote: string;
    tuningNotes: string;
    status: 'SUGGESTED';
    relatedArticleId: string;
}
