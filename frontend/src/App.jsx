// src/App.jsx
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, Landmark, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// --- MAIN APP ORCHESTRATOR ---

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'debts':
        return <DebtView />;
      case 'transactions':
        return <TransactionView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">Finance OS</div>
        <ul className="nav-links">
          <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Executive Overview
          </li>
          <li className={activeTab === 'debts' ? 'active' : ''} onClick={() => setActiveTab('debts')}>
            <CreditCard size={20} /> Debt Workspace
          </li>
          <li className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
            <Landmark size={20} /> Cash Flow
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {renderContent()} 
      </main>
    </div>
  );
}

// --- VIEW COMPONENTS ---

// 1. The Executive Overview Screen
function OverviewView() {
  // Placeholder state to prevent crashes until we build the Python API for this page
  const [data, setData] = useState({
    userName: 'Vishnu',
    netWorth: 1500000,
    monthlyCashFlow: 45000,
    totalDebt: 1720000,
    chartData: [
      { month: 'Nov', income: 90000, expenses: 65000 },
      { month: 'Dec', income: 90000, expenses: 70000 },
      { month: 'Jan', income: 95000, expenses: 60000 },
      { month: 'Feb', income: 95000, expenses: 55000 },
      { month: 'Mar', income: 95000, expenses: 62000 },
      { month: 'Apr', income: 95000, expenses: 50000 }
    ]
  });

  return (
    <div>
      <div className="header">
        {/* Using optional chaining (?.) just in case data is ever empty */}
        <h1>Welcome back, {data?.userName || 'User'}</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Here is your financial summary for this month.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Net Worth</div>
          <div className={`kpi-value ${(data?.netWorth || 0) < 0 ? 'text-red' : 'text-green'}`}>
            ₹{(data?.netWorth || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Monthly Cash Flow</div>
          <div className="kpi-value text-green">
            +₹{(data?.monthlyCashFlow || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Active Debt</div>
          <div className="kpi-value text-red">
            ₹{(data?.totalDebt || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '10px', height: '350px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginBottom: '20px', color: '#374151', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          6-Month Cash Flow Trend
        </h3>
        
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 2. The Debt Workspace Screen
function DebtView() {
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', originalAmount: '', balance: '', interestRate: '', monthlyEmi: '' });
  const [activeTab, setActiveTab] = useState('active');

  const fetchDebts = () => {
    fetch('http://192.168.1.22:5000/api/debts')
      .then(response => response.json())
      .then(data => {
        setDebts(data);
        setIsLoading(false);
      })
      .catch(err => console.error("Error fetching debts:", err));
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleAddDebt = (e) => {
    e.preventDefault();
    fetch('http://192.168.1.22:5000/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        originalAmount: parseFloat(formData.originalAmount),
        balance: parseFloat(formData.balance),
        interestRate: parseFloat(formData.interestRate),
        monthlyEmi: parseFloat(formData.monthlyEmi)
      }),
    })
    .then(response => {
      if (response.ok) {
        setFormData({ name: '', originalAmount: '', balance: '', interestRate: '', monthlyEmi: '' });
        fetchDebts(); 
      }
    })
    .catch(err => console.error("Error saving debt:", err));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this liability?")) {
      fetch(`http://192.168.1.22:5000/api/debts/${id}`, { method: 'DELETE' })
      .then(response => { if (response.ok) fetchDebts(); })
      .catch(err => console.error("Error deleting:", err));
    }
  };

  const handleMarkPaid = (id) => {
    const note = window.prompt("🎉 Congratulations on clearing this debt! \n\nLeave a note for your historical record (e.g., 'Used annual bonus'):");
    if (note !== null) {
      fetch(`http://192.168.1.22:5000/api/debts/${id}/payoff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note }),
      })
      .then(response => { if (response.ok) fetchDebts(); })
      .catch(err => console.error("Error marking paid:", err));
    }
  };

  if (isLoading) return <div style={{ padding: '40px' }}>Loading Debt Data...</div>;

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const activeDebts = debts.filter(debt => debt.status !== 'paid');
  const paidDebts = debts.filter(debt => debt.status === 'paid');

  return (
    <div>
      <div className="header">
        <h1>Debt Management Workspace</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Track your liabilities and plan your payoff strategy.</p>
      </div>

      <div className="kpi-card" style={{ marginBottom: '30px', borderLeft: '4px solid #ef4444' }}>
        <div className="kpi-title">Total Outstanding Principal</div>
        <div className="kpi-value text-red">₹{totalDebt.toLocaleString('en-IN')}</div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#374151' }}>Add New Liability</h3>
        <form onSubmit={handleAddDebt} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Debt Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Loan (₹)</label>
            <input type="number" required value={formData.originalAmount} onChange={(e) => setFormData({...formData, originalAmount: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Balance (₹)</label>
            <input type="number" required value={formData.balance} onChange={(e) => setFormData({...formData, balance: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Interest Rate (%)</label>
            <input type="number" step="0.01" required value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Monthly EMI (₹)</label>
            <input type="number" required value={formData.monthlyEmi} onChange={(e) => setFormData({...formData, monthlyEmi: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', height: '40px', fontWeight: 'bold' }}>
            Add Debt
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('active')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'active' ? '#111827' : '#e5e7eb', color: activeTab === 'active' ? 'white' : '#6b7280' }}>
          Active Liabilities
        </button>
        <button onClick={() => setActiveTab('paid')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'paid' ? '#10b981' : '#e5e7eb', color: activeTab === 'paid' ? 'white' : '#6b7280' }}>
          Paid History 🏆
        </button>
      </div>

      {activeTab === 'active' && (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textTransform: 'uppercase', fontSize: '12px' }}>
              <th style={{ padding: '15px 20px' }}>Liability Name</th>
              <th style={{ padding: '15px 20px' }}>Total Loan Amount</th>
              <th style={{ padding: '15px 20px' }}>Interest Rate</th>
              <th style={{ padding: '15px 20px' }}>Monthly EMI</th>
              <th style={{ padding: '15px 20px' }}>Current Balance</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
              <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeDebts.map((debt) => (
              <tr key={debt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '15px 20px', fontWeight: '500' }}>{debt.name}</td>
                <td style={{ padding: '15px 20px' }}>
                  ₹{debt.originalAmount?.toLocaleString('en-IN')}
                  <br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{Math.round(((debt.originalAmount - debt.balance) / debt.originalAmount) * 100) || 0}% paid</span>
                </td>
                <td style={{ padding: '15px 20px' }}>{debt.interestRate}%</td>
                <td style={{ padding: '15px 20px', color: '#6b7280' }}>₹{debt.monthlyEmi?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₹{debt.balance.toLocaleString('en-IN')}</td>
                <td style={{ padding: '15px 20px' }}>
                  {debt.interestRate > 15 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>
                      <AlertTriangle size={16} /> Critical Priority
                    </span>
                  ) : (
                    <span style={{ color: '#10b981', fontSize: '14px' }}>Standard</span>
                  )}
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => handleMarkPaid(debt.id)} title="Mark as Paid" style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={14} /> Paid
                  </button>
                  <button onClick={() => handleDelete(debt.id)} title="Delete Record" style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'paid' && (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#ecfdf5', borderBottom: '1px solid #e5e7eb', color: '#065f46', textTransform: 'uppercase', fontSize: '12px' }}>
                <th style={{ padding: '15px 20px' }}>Liability Name</th>
                <th style={{ padding: '15px 20px' }}>Total Cleared</th>
                <th style={{ padding: '15px 20px' }}>Victory Note</th>
                <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paidDebts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No paid debts yet. Keep attacking that principal!</td>
                </tr>
              ) : (
                paidDebts.map((debt) => (
                  <tr key={debt.id} style={{ borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#374151' }}>{debt.name}</td>
                    <td style={{ padding: '15px 20px', color: '#10b981', fontWeight: 'bold' }}>₹{debt.originalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '15px 20px', fontStyle: 'italic', color: '#6b7280' }}>"{debt.payoffNote}"</td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(debt.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <PayoffSimulator debts={debts} />
    </div>
  );
}

// The Payoff Simulator Component
function PayoffSimulator({ debts }) {
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [extraPayment, setExtraPayment] = useState(0);

  const activeDebt = debts.find(d => d.id === parseInt(selectedDebtId));

  const calculatePayoff = (debt, extra = 0) => {
    if (!debt) return null;
    let balance = debt.balance;
    const monthlyRate = (debt.interestRate / 100) / 12;
    let basePayment = debt.monthlyEmi > 0 ? debt.monthlyEmi : (balance * 0.05); 
    const totalMonthlyPayment = basePayment + extra;
    let months = 0;
    let totalInterest = 0;

    while (balance > 0 && months < 360) {
      const interestCharge = balance * monthlyRate;
      totalInterest += interestCharge;
      const principalPayment = totalMonthlyPayment - interestCharge;
      balance -= principalPayment;
      months++;
    }
    return { months, totalInterest, totalPayment: basePayment + extra };
  };

  const standardPlan = calculatePayoff(activeDebt, 0);
  const acceleratedPlan = calculatePayoff(activeDebt, parseFloat(extraPayment) || 0);

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '10px', marginTop: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <h3 style={{ marginBottom: '20px', color: '#374151', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '0.5px' }}>Acceleration Simulator</h3>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Target Liability</label>
          <select value={selectedDebtId} onChange={(e) => setSelectedDebtId(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', background: 'white' }}>
            <option value="">-- Select a loan to attack --</option>
            {debts.map(d => <option key={d.id} value={d.id}>{d.name} (₹{d.balance.toLocaleString('en-IN')})</option>)}
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Extra Monthly Payment (₹)</label>
          <input type="number" value={extraPayment} onChange={(e) => setExtraPayment(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
        </div>
      </div>

      {activeDebt && standardPlan && acceleratedPlan && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div>
            <h4 style={{ color: '#6b7280', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase' }}>Standard Minimum Payments</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{Math.ceil(standardPlan.months / 12)} yrs {standardPlan.months % 12} mos</p>
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '5px' }}>Total Interest: ₹{Math.round(standardPlan.totalInterest).toLocaleString('en-IN')}</p>
          </div>
          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '20px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>With Extra ₹{extraPayment}</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{Math.ceil(acceleratedPlan.months / 12)} yrs {acceleratedPlan.months % 12} mos</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              Interest Saved: <strong style={{color: '#10b981'}}>₹{Math.round(standardPlan.totalInterest - acceleratedPlan.totalInterest).toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionView() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ type: 'expense', amount: '', category: 'Housing', description: '', date: today });

  const fetchTransactions = () => {
    fetch('http://192.168.1.22:5000/api/transactions')
      .then(response => response.json())
      .then(data => { setTransactions(data); setIsLoading(false); })
      .catch(err => console.error("Error fetching transactions:", err));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    fetch('http://192.168.1.22:5000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: formData.type, amount: parseFloat(formData.amount), category: formData.category, description: formData.description, date: formData.date }),
    })
    .then(response => {
      if (response.ok) {
        setFormData({ ...formData, amount: '', description: '' });
        fetchTransactions(); 
      }
    })
    .catch(err => console.error("Error saving transaction:", err));
  };

  if (isLoading) return <div style={{ padding: '40px' }}>Loading Cash Flow Data...</div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <div>
      <div className="header">
        <h1>Cash Flow Tracking</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Log your income and expenses to track your real-time net flow.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Income</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '5px' }}>+₹{totalIncome.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ef4444', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Expenses</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '5px' }}>-₹{totalExpense.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', borderLeft: `4px solid ${netFlow >= 0 ? '#3b82f6' : '#f59e0b'}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Net Cash Flow</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151', marginTop: '5px' }}>₹{netFlow.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#374151' }}>Log New Transaction</h3>
        <form onSubmit={handleAddTransaction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr auto', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Type</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Amount (₹)</label>
            <input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Category</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }}>
              {formData.type === 'income' ? (
                <><option value="Salary">Salary</option><option value="Bonus">Bonus</option><option value="Investments">Investments</option><option value="Other">Other</option></>
              ) : (
                <><option value="Housing">Housing</option><option value="Food">Food</option><option value="Debt">Debt Payoff</option><option value="Transport">Transport</option><option value="Utilities">Utilities</option><option value="Entertainment">Entertainment</option></>
              )}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Date</label>
            <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Description</label>
            <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g., April Rent" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: formData.type === 'income' ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', height: '38px', fontWeight: 'bold' }}>
            Save
          </button>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textTransform: 'uppercase', fontSize: '12px' }}>
              <th style={{ padding: '15px 20px' }}>Date</th>
              <th style={{ padding: '15px 20px' }}>Description</th>
              <th style={{ padding: '15px 20px' }}>Category</th>
              <th style={{ padding: '15px 20px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '15px 20px', color: '#6b7280', fontSize: '14px' }}>{t.date}</td>
                <td style={{ padding: '15px 20px', fontWeight: '500' }}>{t.description}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#4b5563' }}>{t.category}</span>
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: t.type === 'income' ? '#10b981' : '#374151' }}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;