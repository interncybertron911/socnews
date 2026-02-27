import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../../services/authService';
import SettingsForm from './components/SettingsForm';

const SettingsPage: React.FC = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setName(user.name);
            setUsername(user.username);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validation if password is being changed
        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                setError('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.');
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
        }

        try {
            const updateData: any = { name, username };
            if (password) updateData.password = password;

            const res = await authService.updateProfile(updateData);
            if (res.ok) {
                setSuccess('PROFILE UPDATED SUCCESSFULLY');
                setPassword('');
                setConfirmPassword('');
                // If username changed, it might affect session, but service handles it
            } else {
                setError(res.error || 'Update failed');
            }
        } catch (err: any) {
            setError('An error occurred during update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overview-container">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '40px',
                minHeight: '100%'
            }}>
                <div className="card" style={{
                    width: '100%',
                    maxWidth: '600px',
                    padding: '40px',
                    border: '1px solid #333',
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative'
                }}>

                    <div style={{ marginBottom: '40px', borderBottom: '1px solid #222', paddingBottom: '20px' }}>
                        <h2 style={{
                            color: 'var(--accent-green)',
                            fontSize: '24px',
                            letterSpacing: '4px',
                            margin: 0,
                            textTransform: 'uppercase'
                        }}>OPERATIVE SETTINGS</h2>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                            SECURE IDENTITY MANAGEMENT TERMINAL
                        </div>
                    </div>

                    <SettingsForm
                        name={name}
                        setName={setName}
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                        success={success}
                    />
                </div>

                <div style={{ marginTop: '30px', color: '#333', fontSize: '10px', letterSpacing: '1px' }}>
                    TERMINAL ID: SOC-ALPHA-SET-01 // NODE: 127.0.0.1
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
