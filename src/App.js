import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PlusCircle,
  Trash2,
  Search,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

const API_BASE = "https://financetracker-2-3rob.onrender.com/api";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("login");

  const [transactions, setTransactions] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [monthlySummary, setMonthlySummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [authError, setAuthError] = useState("");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setView("dashboard");
      fetchData();
    } else {
      setView("login");
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedMonth) params.append("month", selectedMonth);

      const [resTrans, resDaily, resMonthly] = await Promise.all([
        axios.get(`${API_BASE}/transactions?${params.toString()}`),
        axios.get(`${API_BASE}/summary/daily`),
        axios.get(`${API_BASE}/summary/monthly`),
      ]);

      setTransactions(resTrans.data);
      setDailySummary(resDaily.data);
      setMonthlySummary(resMonthly.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    const endpoint = view === "signup" ? "signup" : "login";

    try {
      const res = await axios.post(`${API_BASE}/auth/${endpoint}`, authForm);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Authentication failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setView("login");

    delete axios.defaults.headers.common["Authorization"];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !amount) return;

    try {
      await axios.post(`${API_BASE}/transactions`, {
        description,
        amount: parseFloat(amount),
        type,
        date,
      });

      setDescription("");
      setAmount("");

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

  useEffect(() => {
    if (view === "dashboard") fetchData();
  }, [search, selectedMonth]);

  /* ---------------- LOGIN / SIGNUP ---------------- */

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "10vh" }}>
        <div className="card">
          <h2 style={{ textAlign: "center" }}>
            {view === "login" ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleAuth}>
            {view === "signup" && (
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              required
            />

            {authError && <p style={{ color: "red" }}>{authError}</p>}

            <button type="submit" className="btn btn-primary">
              {view === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {view === "login" ? "Login" : "Sign Up"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            {view === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <span
              style={{ color: "#2563eb", cursor: "pointer", marginLeft: "5px" }}
              onClick={() => setView(view === "login" ? "signup" : "login")}
            >
              {view === "login" ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */

  return (
    <div className="container">

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1>PocketLedger</h1>

        <button onClick={handleLogout} className="btn">
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* DAILY SUMMARY */}

      <div className="card">
        <h3>Today's Summary</h3>
        <p>Income: ${dailySummary.income}</p>
        <p>Expense: ${dailySummary.expense}</p>
        <p>Balance: ${dailySummary.balance}</p>
      </div>

      {/* MONTHLY SUMMARY */}

      <div className="card">
        <h3>Monthly Summary</h3>
        <p>Income: ${monthlySummary.income}</p>
        <p>Expense: ${monthlySummary.expense}</p>
        <p>Balance: ${monthlySummary.balance}</p>
      </div>

      {/* ADD TRANSACTION */}

      <div className="card">
        <h3>Add Transaction</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button type="submit" className="btn btn-primary">
            <PlusCircle size={18} /> Add
          </button>
        </form>
      </div>

      {/* SEARCH */}

      <div className="card">
        <input
          type="text"
          placeholder="Search transaction"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>

      {/* TRANSACTIONS */}

      <div className="card">
        <h3>Transactions</h3>

        {transactions.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          transactions.map((t) => (
            <div
              key={t._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span>{t.description}</span>

              <span>
                {t.type === "income" ? "+" : "-"}${t.amount}
              </span>

              <button onClick={() => handleDelete(t._id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;