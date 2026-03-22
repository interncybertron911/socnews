import React from 'react';

interface SplunkQueryCardProps {
    query: string;
    isLoading: boolean;
    onCopy: () => void;
}

const SplunkQueryCard: React.FC<SplunkQueryCardProps> = ({ query, isLoading, onCopy }) => {
    return (
        <aside className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">SPLUNK SEARCH QUERY</div>
            <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                {isLoading ? (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0a0a0a',
                            borderRadius: '4px',
                            border: '1px solid #222'
                        }}
                    >
                        <span className="pulse" style={{ fontSize: 11, color: '#444' }}>Generating fresh query...</span>
                    </div>
                ) : (
                    <textarea
                        value={query || ""}
                        readOnly
                        className="input-dark"
                        style={{ flex: 1, width: "100%", fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, resize: 'none' }}
                        placeholder="Splunk query will appear here..."
                    />
                )}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
                    <button
                        className="btn"
                        style={{ fontSize: 10, padding: '5px 25px' }}
                        onClick={() => {
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(query);
                            } else {
                                // Fallback for non-secure contexts (HTTP)
                                const textArea = document.createElement("textarea");
                                textArea.value = query;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                            }
                            alert('Copied to clipboard!');
                        }}
                        disabled={!query || isLoading}
                    >
                        Copy Query
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default SplunkQueryCard;
