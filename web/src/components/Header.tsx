import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from "../services/authService";

/**
 * Header Component
 * Displays "SOC" title and Thailand real-time clock.
 */
const Header: React.FC = () => {
    const [time, setTime] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const updateTime = () => {
            // Set to Thailand Time (UTC+7)
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            };
            setTime(new Intl.DateTimeFormat('en-GB', options).format(now));
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="header">
            <h1
                className="title clickable"
                onClick={() => window.dispatchEvent(new Event('soc-reset'))}
                style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
                <img src="/logo.png" alt="SOC Logo" style={{ height: '32px', width: 'auto' }} />
                <span>SOC <span style={{ color: 'var(--accent-green)' }}>NEWS</span></span>
            </h1>

            {/* User Info & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                        OPERATIVE: {authService.getCurrentUser()?.name.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div style={{ fontSize: '8px', color: '#666' }}>
                        ROLE: {authService.getCurrentUser()?.type.toUpperCase() || 'NONE'}
                    </div>
                </div>
                <button
                    className="btn"
                    style={{ fontSize: '10px', padding: '4px 10px', borderColor: '#444', color: '#888' }}
                    onClick={() => {
                        authService.logout();
                        navigate('/login');
                    }}
                >
                    LOGOUT
                </button>
                <div className="time-display">
                    <span className="time-label">BKK_TIME</span>
                    <span className="time-value">{time}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
