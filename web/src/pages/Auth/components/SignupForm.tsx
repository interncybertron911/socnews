import React from 'react';
import { Link } from 'react-router-dom';

interface SignupFormProps {
    name: string;
    setName: (val: string) => void;
    username: string;
    setUsername: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    type: 'admin' | 'user';
    setType: (val: 'admin' | 'user') => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string;
    success: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({
    name, setName,
    username, setUsername,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    type, setType,
    onSubmit,
    loading,
    error,
    success
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
                <img src="/logo.png" alt="SOC Logo" style={{ width: '60px', marginBottom: '15px' }} />
                <h1 style={{
                    color: 'var(--accent-green)',
                    fontSize: '28px',
                    letterSpacing: '5px',
                    margin: '0 0 10px 0',
                    textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
                }}>OPERATIVE</h1>
                <div style={{
                    fontSize: '10px',
                    color: '#666',
                    letterSpacing: '2px'
                }}>REGISTRATION TERMINAL</div>
            </div>

            {success ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 0'
                }}>
                    <div style={{ color: 'var(--accent-green)', fontSize: '14px', marginBottom: '20px' }}>
                        REGISTRATION SUCCESSFUL
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Redirecting to access terminal...
                    </div>
                </div>
            ) : (
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>FULL NAME</label>
                        <input
                            type="text"
                            className="input-dark"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ height: '36px', fontSize: '13px' }}
                            placeholder="Incognito..."
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>USERNAME</label>
                        <input
                            type="text"
                            className="input-dark"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ height: '36px', fontSize: '13px' }}
                            placeholder="Codename..."
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
                            style={{ height: '36px', fontSize: '13px' }}
                            placeholder="Access key..."
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>CONFIRM PASSWORD</label>
                        <input
                            type="password"
                            className="input-dark"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ height: '36px', fontSize: '13px' }}
                            placeholder="Repeat access key..."
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>TYPE</label>
                        <select
                            className="input-dark"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            style={{ height: '36px', fontSize: '13px' }}
                        >
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                        </select>
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
                            height: '40px',
                            marginTop: '10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            letterSpacing: '2px',
                            background: loading ? '#222' : 'transparent',
                            borderColor: loading ? '#333' : 'var(--accent-green)',
                            color: loading ? '#555' : 'var(--accent-green)'
                        }}
                    >
                        {loading ? 'REGISTERING...' : 'ENROLL OPERATIVE'}
                    </button>
                </form>
            )}

            {!success && (
                <div style={{
                    marginTop: '30px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#444'
                }}>
                    ALREADY REGISTERED? <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', marginLeft: '5px' }}>ACCESS TERMINAL</Link>
                </div>
            )}
        </div>
    );
};

export default SignupForm;
