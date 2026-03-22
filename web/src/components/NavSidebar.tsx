import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * NavSidebar Component
 * Far left navigation menu with hover-expand effect.
 */
const NavSidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAdmin = user?.type === 'admin';

    const sections = [
        {
            title: 'MAIN',
            items: [
                { name: 'News', icon: '📰', path: '/news' },
                { name: 'Rules', icon: '📜', path: '/rules' },
                { name: 'Lookup', icon: '💡', path: '/lookup' },
                { name: 'History', icon: '🕒', path: '/history' },
                { name: 'Settings', icon: '⚙️', path: '/settings' },
            ]
        }
    ];

    if (isAdmin) {
        sections[0].items.push({ name: 'Users', icon: '👤', path: '/admin/users' });
    }

    return (
        <aside className="nav-sidebar">
            {sections.map(section => (
                <div key={section.title} className="nav-section">
                    <div className="nav-section-title">{section.title}</div>
                    <div className="nav-items">
                        {section.items.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.name}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </aside>
    );
};

export default NavSidebar;
