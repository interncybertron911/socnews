import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import LoginForm from './components/LoginForm';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authService.login(username, password);
            if (res.ok) {
                navigate('/lookup');
            } else {
                setError(res.error || 'Login failed');
            }
        } catch (err: any) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
            flexDirection: 'column',
            padding: '60px 20px',
            overflowX: 'hidden'
        }}>
            <LoginForm
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />

            <div style={{
                fontSize: '9px',
                color: '#333',
                letterSpacing: '1px'
            }}>
                ENCRYPTED CONNECTION • SECURE NODE 7-Alpha
            </div>
        </div>
    );
};

export default LoginPage;
