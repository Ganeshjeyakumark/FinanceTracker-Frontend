import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PlusCircle,
    Trash2,
    Search,
    LogOut,
    LogIn,
    UserPlus,
    ShieldCheck
} from 'lucide-react';

const API_BASE = 'https://financetracker-2-3rob.onrender.com/api';

function App() {

    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [view, setView] = useState('login');

    const [transactions, setTransactions] = useState([]);
    const [dailySummary, setDailySummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0, balance: 0 });

    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [authError, setAuthError] = useState('');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setView('dashboard');
            fetchData();
        } else {
            setView('login');
        }
        // eslint-disable-next-line
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

            console.error(err);

            if (err.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchAdminData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/transactions/admin/all`);
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {

        if (view === 'dashboard') fetchData();
        if (view === 'admin') fetchAdminData();

        // eslint-disable-next-line
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

            console.error(err);

        }
    };

    const handleDelete = async (id) => {

        try {

            await axios.delete(`${API_BASE}/transactions/${id}`);
            fetchData();

        } catch (err) {

            console.error(err);

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

                        {authError && (
                            <p style={{ color: 'red', fontSize: '0.8rem' }}>{authError}</p>
                        )}

                        <button type="submit" className="btn btn-primary">

                            {view === 'login'
                                ? <LogIn size={18} />
                                : <UserPlus size={18} />}

                            {view === 'login' ? 'Login' : 'Sign Up'}

                        </button>

                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>

                        {view === 'login'
                            ? "Don't have an account?"
                            : "Already have an account?"}

                        <span
                            style={{ color: '#2563eb', cursor: 'pointer', marginLeft: '5px' }}
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

            <header className="header">

                <h1>PocketLedger</h1>

                <button onClick={handleLogout} className="btn">

                    <LogOut size={18} /> Logout

                </button>

            </header>

        </div>

    );
}

export default App;