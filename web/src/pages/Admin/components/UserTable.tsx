import React from 'react';

interface UserTableProps {
    users: any[];
    loading: boolean;
    onEdit: (user: any) => void;
    onDelete: (id: string, name: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, loading, onEdit, onDelete }) => {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ background: '#111', color: 'var(--accent-green)', textAlign: 'left' }}>
                    <tr>
                        <th style={{ padding: '15px', borderBottom: '1px solid #222' }}>OPERATIVE NAME</th>
                        <th style={{ padding: '15px', borderBottom: '1px solid #222' }}>CODENAME</th>
                        <th style={{ padding: '15px', borderBottom: '1px solid #222' }}>ROLE</th>
                        <th style={{ padding: '15px', borderBottom: '1px solid #222' }}>JOINED</th>
                        <th style={{ padding: '15px', borderBottom: '1px solid #222', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                SYNCHRONIZING ROSTER...
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                NO OPERATIVES FOUND IN DATABASE
                            </td>
                        </tr>
                    ) : (
                        users.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid #111', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#0a0a0a'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '15px' }}>{user.name}</td>
                                <td style={{ padding: '15px', fontFamily: 'monospace', color: '#888' }}>@{user.username}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: user.type === 'admin' ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: user.type === 'admin' ? 'var(--accent-green)' : '#888',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        border: `1px solid ${user.type === 'admin' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
                                    }}>
                                        {user.type.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', color: '#555' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="btn"
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: '10px',
                                            borderColor: 'rgba(59, 130, 246, 0.3)',
                                            color: '#3b82f6'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        onClick={() => onDelete(user._id, user.name)}
                                        className="btn"
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: '10px',
                                            color: 'var(--accent-red)',
                                            borderColor: 'rgba(255, 62, 62, 0.3)',
                                            background: 'transparent'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 62, 62, 0.1)'; e.currentTarget.style.borderColor = 'var(--accent-red)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 62, 62, 0.3)'; }}
                                    >
                                        DELETE
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
