import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        type: 'user'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authService.listUsers();
            if (res.ok && res.users) {
                setUsers(res.users);
            } else {
                setError(res.error || 'Failed to fetch operative roster');
            }
        } catch (err) {
            setError('Terminal communication error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`CONFIRM DELETION: ARE YOU SURE YOU WANT TO DELETE OPERATIVE "${name.toUpperCase()}"?`)) return;

        setError('');
        setSuccess('');
        try {
            const res = await authService.deleteUser(id);
            if (res.ok) {
                setSuccess(`OPERATIVE ${name.toUpperCase()} DELETED SUCCESSFULLY`);
                setUsers(prev => prev.filter(u => u._id !== id));
            } else {
                setError(res.error || 'Deletion failed');
            }
        } catch (err) {
            setError('Operation failed due to network error');
        }
    };

    const handleEdit = (user: any) => {
        setEditingUserId(user._id);
        setFormData({
            name: user.name,
            username: user.username,
            password: '',
            type: user.type
        });
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const handleAdd = () => {
        setEditingUserId(null);
        setFormData({
            name: '',
            username: '',
            password: '',
            type: 'user'
        });
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            let res;
            if (editingUserId) {
                // Admin Update
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password;
                res = await authService.updateUser(editingUserId, updateData);
            } else {
                // Admin Create
                if (!formData.password) {
                    setError('PASSWORD IS REQUIRED FOR NEW OPERATIVES');
                    return;
                }
                res = await authService.signup(formData);
            }

            if (res.ok) {
                setSuccess(editingUserId ? 'OPERATIVE UPDATED SUCCESSFULLY' : 'NEW OPERATIVE ASSIGNED SUCCESSFULLY');
                setShowForm(false);
                fetchUsers();
            } else {
                setError(res.error || 'Operation failed');
            }
        } catch (err) {
            setError('Synchronous connection failure');
        }
    };

    return (
        <div className="overview-container">
            <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '30px', borderBottom: '2px solid var(--accent-green)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ color: 'var(--accent-green)', letterSpacing: '4px', margin: 0 }}>OPERATIVE MANAGEMENT</h1>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>ADMINISTRATIVE ACCESS ONLY // ROSTER CLEARANCE LEVEL: OMEGA</div>
                    </div>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={handleAdd} style={{ padding: '10px 20px', fontSize: '11px', fontWeight: 'bold' }}>
                            + ADD NEW OPERATIVE
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: '15px',
                        background: 'rgba(255, 62, 62, 0.1)',
                        border: '1px solid var(--accent-red)',
                        color: 'var(--accent-red)',
                        fontSize: '12px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        [ERROR] {error.toUpperCase()}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '15px',
                        background: 'rgba(0, 255, 65, 0.1)',
                        border: '1px solid var(--accent-green)',
                        color: 'var(--accent-green)',
                        fontSize: '12px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        [SUCCESS] {success}
                    </div>
                )}

                {showForm ? (
                    <UserForm
                        isEditing={!!editingUserId}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <UserTable
                        users={users}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}

                <div style={{ marginTop: '30px', color: '#222', fontSize: '9px', textAlign: 'center', letterSpacing: '2px' }}>
                    AUTHORIZED SOC PERSONNEL ONLY // UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;
