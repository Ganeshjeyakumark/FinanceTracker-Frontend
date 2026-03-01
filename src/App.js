import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PlusCircle, Trash2, Search, Filter,
    Wallet, TrendingUp, TrendingDown,
    LogOut, LogIn, UserPlus, ShieldCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [view, setView] = useState('login'); // login, signup, dashboard, admin

    // Dashboard Data
    const [transactions, setTransactions] = useState([]);
    const [dailySummary, setDailySummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0, balance: 0 });

    // Auth Form State
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [authError, setAuthError] = useState('');

    // Transaction Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Filters State
    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    // Setup Axios Defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setView('dashboard');
            fetchData();
        } else {
            setView('login');
        }
    }, [token]);

    const fetchData = async () => {
        if (!token) return;
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (selectedMonth) params.append('month', selectedMonth);

            const [resTrans, resDaily, resMonthly] = await Promise.all([
                axios.get(`${API_BASE}/transactions?${params.toString()}`),
                axios.get(`${API_BASE}/summary/daily`),
                axios.get(`${API_BASE}/summary/monthly`)
            ]);

            setTransactions(resTrans.data);
            setDailySummary(resDaily.data);
            setMonthlySummary(resMonthly.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            if (err.response?.status === 401) handleLogout();
        }
    };

    const fetchAdminData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/transactions/admin/all`);
            setTransactions(res.data);
        } catch (err) {
            console.error('Admin Fetch Error:', err);
        }
    };

    useEffect(() => {
        if (view === 'dashboard') fetchData();
        if (view === 'admin') fetchAdminData();
    }, [search, selectedMonth, view]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        const endpoint = view === 'signup' ? 'signup' : 'login';
        try {
            const res = await axios.post(`${API_BASE}/auth/${endpoint}`, authForm);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setToken(res.data.token);
            setUser(res.data.user);
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Authentication failed');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setView('login');
        delete axios.defaults.headers.common['Authorization'];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount) return;

        try {
            await axios.post(`${API_BASE}/transactions`, {
                description,
                amount: parseFloat(amount),
                type,
                date
            });
            setDescription('');
            setAmount('');
            fetchData();
        } catch (err) {
            console.error('Error adding transaction:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_BASE}/transactions/${id}`);
            fetchData();
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    };

    if (!token) {
        return (
            <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
                <div className="card">
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <form onSubmit={handleAuth}>
                        {view === 'signup' && (
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={authForm.name}
                                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                            />
                        </div>
                        {view === 'signup' && (
                            <div className="form-group">
                                <label>Register as Admin?</label>
                                <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                                    <option value="user">No - Regular User</option>
                                    <option value="admin">Yes - System Admin</option>
                                </select>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    *System only supports one unique administrator account.
                                </p>
                            </div>
                        )}
                        {authError && <p style={{ color: 'var(--expense)', fontSize: '0.8rem', marginBottom: '1rem' }}>{authError}</p>}
                        <button type="submit" className="btn btn-primary">
                            {view === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                            {view === 'login' ? 'Login' : 'Sign Up'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <span
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                        >
                            {view === 'login' ? 'Sign Up' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', textAlign: 'left', margin: 0 }}>PocketLedger</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Welcome, {user?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {user?.role === 'admin' && (
                        <button
                            className="btn"
                            style={{ background: view === 'admin' ? 'var(--primary)' : 'var(--glass)', width: 'auto', padding: '0.5rem 1rem' }}
                            onClick={() => setView(view === 'admin' ? 'dashboard' : 'admin')}
                        >
                            <ShieldCheck size={18} />
                            {view === 'admin' ? 'Exit Admin' : 'Admin Panel'}
                        </button>
                    )}
                    <button onClick={handleLogout} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--expense)', width: 'auto', padding: '0.5rem 1rem' }}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </header>

            {view === 'dashboard' && (
                <section className="summaries-grid">
                    <div className="card">
                        <h3>Today Summary</h3>
                        <div className="stats-container">
                            <div className="stat-item">
                                <div className="stat-label">Income</div>
                                <div className="stat-value income">${dailySummary.income.toFixed(2)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Expense</div>
                                <div className="stat-value expense">${dailySummary.expense.toFixed(2)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Balance</div>
                                <div className="stat-value balance">${dailySummary.balance.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Monthly Summary</h3>
                        <div className="stats-container">
                            <div className="stat-item">
                                <div className="stat-label">Income</div>
                                <div className="stat-value income">${monthlySummary.income.toFixed(2)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Expense</div>
                                <div className="stat-value expense">${monthlySummary.expense.toFixed(2)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Balance</div>
                                <div className="stat-value balance">${monthlySummary.balance.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {view === 'admin' && (
                <div className="card" style={{ marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--primary)' }}>
                    <h2 style={{ color: 'var(--primary)' }}>Admin Command Center</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Viewing all global transactions across the system</p>
                </div>
            )}

            <div className="main-grid">
                {/* Only show Add form on Dashboard, not Admin Panel */}
                {view === 'dashboard' ? (
                    <section>
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Add Transaction</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. Tea"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    <PlusCircle size={20} />
                                    Save Transaction
                                </button>
                            </form>
                        </div>
                    </section>
                ) : (
                    <section>
                        <div className="card">
                            <h3>System Info</h3>
                            <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Admin mode is active. You can monitor all users but cannot add transactions on their behalf.</p>
                        </div>
                    </section>
                )}

                {/* Right Side: Filters & List */}
                <section>
                    <div className="filters-bar">
                        <div className="search-wrapper">
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search ledger..."
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="filter-wrapper">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="transaction-list">
                        {transactions.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No entries found.</p>
                        ) : (
                            transactions.map((t) => (
                                <div key={t._id} className={`transaction-item ${t.type}`}>
                                    <div className="item-info">
                                        <h4>{t.description} {view === 'admin' && <span style={{ color: 'var(--primary)', fontSize: '0.7rem' }}> (by {t.userId?.name})</span>}</h4>
                                        <p>{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="item-actions">
                                        <span className={`item-amount ${t.type}`}>
                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </span>
                                        {view === 'dashboard' && (
                                            <button onClick={() => handleDelete(t._id)} className="delete-btn">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default App;
