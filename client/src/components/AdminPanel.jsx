import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, updateUserPassword } from '../api';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [resetPasswordId, setResetPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await createUser(newUser.username, newUser.password, newUser.role);
      setNewUser({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleResetPassword(id) {
    if (!newPassword.trim()) return;
    try {
      await updateUserPassword(id, newPassword);
      setResetPasswordId(null);
      setNewPassword('');
      alert('Password updated');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">Manage users and access</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Add User */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-4">Add New User</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="password"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-5">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                  >
                    {creating ? 'Adding…' : 'Add User'}
                  </button>
                </div>
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
              )}
            </form>
          </div>

          {/* User List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              All Users <span className="text-gray-400 font-normal">({users.length})</span>
            </h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                          </span>
                          <span className="ml-2">{new Date(user.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resetPasswordId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg w-28"
                          />
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setResetPasswordId(null); setNewPassword(''); }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setResetPasswordId(user.id)}
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition"
                          >
                            Reset PW
                          </button>
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
