import React from 'react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
    username: string;
    setUsername: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
    username, setUsername,
    password, setPassword,
    onSubmit,
    loading,
    error
}) => {
    return (
        <div className="card" style={{
            width: '400px',
            padding: '40px',
            margin: 'auto 0',
            overflow: 'visible',
            border: '1px solid var(--accent-green)',
            boxShadow: '0 0 30px rgba(0, 255, 65, 0.1)',
            background: 'rgba(13, 13, 13, 0.9)',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '30px'
            }}>
                <img src="/logo.png" alt="SOC Logo" style={{ width: '80px', marginBottom: '20px' }} />
                <h1 style={{
                    color: 'var(--accent-green)',
                    fontSize: '32px',
                    letterSpacing: '5px',
                    margin: '0 0 10px 0',
                    textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
                }}>SOC NEWS</h1>
                <div style={{
                    fontSize: '10px',
                    color: '#666',
                    letterSpacing: '2px'
                }}>SYSTEM ACCESS TERMINAL</div>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>USERNAME</label>
                    <input
                        type="text"
                        className="input-dark"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ height: '40px', fontSize: '14px' }}
                        placeholder="Enter credentials..."
                        autoComplete="username"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>PASSWORD</label>
                    <input
                        type="password"
                        className="input-dark"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ height: '40px', fontSize: '14px' }}
                        placeholder="Enter secure key..."
                        autoComplete="current-password"
                    />
                </div>

                {error && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--accent-red)',
                        background: 'rgba(255, 62, 62, 0.1)',
                        padding: '10px',
                        border: '1px solid rgba(255, 62, 62, 0.2)',
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn"
                    style={{
                        height: '45px',
                        marginTop: '10px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        background: loading ? '#222' : 'transparent',
                        borderColor: loading ? '#333' : 'var(--accent-green)',
                        color: loading ? '#555' : 'var(--accent-green)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                </button>
            </form>

            <div style={{
                marginTop: '30px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#444'
            }}>
                NEW OPERATIVE? <Link to="/signup" style={{ color: 'var(--accent-green)', textDecoration: 'none', marginLeft: '5px' }}>REGISTER HERE</Link>
            </div>
        </div>
    );
};

export default LoginForm;
