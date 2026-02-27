import React from 'react';

interface UserFormProps {
    isEditing: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ isEditing, formData, setFormData, onSubmit, onCancel }) => {
    return (
        <div className="card" style={{ padding: '40px', marginBottom: '40px' }}>
            <h3 style={{ color: 'var(--accent-green)', marginTop: 0, marginBottom: '25px', fontSize: '16px' }}>
                {isEditing ? 'MODIFY OPERATIVE DATA' : 'ASSIGN NEW OPERATIVE'}
            </h3>
            <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555' }}>FULL NAME</label>
                    <input
                        type="text"
                        className="input-dark"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555' }}>CODENAME (USERNAME)</label>
                    <input
                        type="text"
                        className="input-dark"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555' }}>CLEARANCE KEY (PASSWORD)</label>
                    <input
                        type="password"
                        className="input-dark"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder={isEditing ? "LEAVE BLANK TO UNCHANGED" : "MIN 8 CHARS..."}
                        autoComplete="new-password"
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555' }}>CLEARANCE LEVEL (TYPE)</label>
                    <select
                        className="input-dark"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        style={{ height: '36px' }}
                    >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                    </select>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }}>
                        {isEditing ? 'UPDATE OPERATIVE' : 'CONFIRM ASSIGNMENT'}
                    </button>
                    <button type="button" className="btn" onClick={onCancel} style={{ flex: 1, padding: '12px' }}>
                        CANCEL
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
