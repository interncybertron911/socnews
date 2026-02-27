import React from 'react';

interface SettingsFormProps {
    name: string;
    setName: (val: string) => void;
    username: string;
    setUsername: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string;
    success: string;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
    name, setName,
    username, setUsername,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    onSubmit,
    loading,
    error,
    success
}) => {
    return (
        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold', letterSpacing: '1px' }}>FULL NAME</label>
                    <input
                        type="text"
                        className="input-dark"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ height: '40px', fontSize: '14px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold', letterSpacing: '1px' }}>USERNAME (CODENAME)</label>
                    <input
                        type="text"
                        className="input-dark"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ height: '40px', fontSize: '14px' }}
                    />
                </div>
            </div>

            <div style={{ borderTop: '1px solid #222', gridColumn: 'span 2', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-green)', marginBottom: '20px', letterSpacing: '1px' }}>
                    CHANGE SECURITY KEY (LEAVE BLANK TO KEEP CURRENT)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>NEW PASSWORD</label>
                        <input
                            type="password"
                            className="input-dark"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ height: '40px', fontSize: '14px' }}
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>CONFIRM NEW PASSWORD</label>
                        <input
                            type="password"
                            className="input-dark"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{ height: '40px', fontSize: '14px' }}
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                <div style={{ fontSize: '8px', color: '#444', marginTop: '10px' }}>
                    REQUIREMENT: 8+ CHARS, UPPERCASE, LOWERCASE & NUMBERS
                </div>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                {error && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--accent-red)',
                        background: 'rgba(255, 62, 62, 0.05)',
                        padding: '12px',
                        border: '1px solid rgba(255, 62, 62, 0.2)',
                        borderRadius: '4px',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--accent-green)',
                        background: 'rgba(0, 255, 65, 0.05)',
                        padding: '12px',
                        border: '1px solid rgba(0, 255, 65, 0.2)',
                        borderRadius: '4px',
                        textAlign: 'center',
                        marginBottom: '20px',
                        letterSpacing: '1px'
                    }}>
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn"
                    style={{
                        width: '100%',
                        height: '45px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        background: loading ? '#222' : 'transparent',
                        borderColor: loading ? '#333' : 'var(--accent-green)',
                        color: loading ? '#555' : 'var(--accent-green)'
                    }}
                >
                    {loading ? 'SYNCHRONIZING...' : 'UPDATE IDENTITY'}
                </button>
            </div>
        </form>
    );
};

export default SettingsForm;
