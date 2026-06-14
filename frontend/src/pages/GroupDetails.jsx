import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import SettlementModal from '../components/SettlementModal';

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('expenses'); // expenses, balances, settlements

    // Data tabs
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);

    const [memberEmail, setMemberEmail] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);

    useEffect(() => {
        fetchGroupData();
    }, [id, activeTab]);

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/groups`);
            const g = res.data.find(g => g.id === Number(id));
            if (!g) {
                navigate('/dashboard');
                return;
            }
            setGroup(g);

            if (activeTab === 'expenses') {
                const { data } = await api.get(`/groups/${id}/expenses`);
                setExpenses(data);
            } else if (activeTab === 'balances') {
                const { data } = await api.get(`/groups/${id}/balances`);
                setBalances(data);
            } else if (activeTab === 'settlements') {
                const { data } = await api.get(`/groups/${id}/settlements`);
                setSettlements(data);
            }
        } catch (err) {
            console.error('Error fetching group data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/members`, { email: memberEmail });
            setMemberEmail('');
            setShowAddMember(false);
            fetchGroupData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Remove member?")) return;
        try {
            await api.delete(`/groups/${id}/members/${userId}`);
            fetchGroupData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove member');
        }
    };

    const isAdmin = group?.members?.some(m => m.userId === user.id && m.role === 'ADMIN');

    const getUserName = (uid) => group?.members?.find(m => m.userId === uid)?.user?.name || `User ${uid}`;

    if (!group) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow px-6 py-4 flex items-center space-x-4 sticky top-0 z-10 w-full">
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-800">&larr; Back</Link>
                <h1 className="text-xl font-bold text-gray-900 border-l pl-4 border-gray-200">{group.name}</h1>
            </nav>

            <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-5 rounded-xl border border-gray-100 shadow-sm gap-4">
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            {['expenses', 'balances', 'settlements'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 capitalize rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowExpenseModal(true)} className="flex-1 sm:flex-none bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 text-sm font-medium">Add Expense</button>
                            <button onClick={() => setShowSettlementModal(true)} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-medium">Settle Up</button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                        {loading ? (
                            <div className="text-center text-gray-500 py-10">Loading Data...</div>
                        ) : activeTab === 'expenses' ? (
                            <div className="space-y-4">
                                {expenses.length === 0 && <p className="text-gray-500 text-center py-8">No expenses yet.</p>}
                                {expenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded">
                                        <div>
                                            <p className="font-semibold">{exp.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(exp.createdAt).toLocaleDateString()} • Paid by {getUserName(exp.paidById)}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <p className="font-bold text-lg">₹{exp.amount}</p>
                                            <Link to={`/expenses/${exp.id}/chat`} className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-100 transition-colors">Chat &rarr;</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'balances' ? (
                            <div className="space-y-4">
                                {balances.length === 0 && <p className="text-gray-500 text-center py-8">All settled up.</p>}
                                {balances.map((b, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <p className="text-gray-700">
                                            <span className="font-semibold">{getUserName(b.debtor)}</span> owes <span className="font-semibold">{getUserName(b.creditor)}</span>
                                        </p>
                                        <p className="font-bold text-red-600">₹{b.amount}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {settlements.length === 0 && <p className="text-gray-500 text-center py-8">No settlements recorded.</p>}
                                {settlements.map(s => (
                                    <div key={s.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <div>
                                            <p className="text-gray-700"><span className="font-semibold">{getUserName(s.payerId)}</span> paid <span className="font-semibold">{getUserName(s.receiverId)}</span></p>
                                            <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <p className="font-bold text-green-600">₹{s.amount}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Members ({group.members?.length})</h3>
                        {isAdmin && (
                            <button onClick={() => setShowAddMember(true)} className="text-blue-600 text-sm font-medium hover:underline">+ Add</button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {group.members?.map(m => (
                            <div key={m.id} className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 truncate">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                                        {m.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-medium truncate">{m.user?.name} {m.userId === user.id && '(You)'}</p>
                                        <p className="text-xs text-gray-500">{m.role}</p>
                                    </div>
                                </div>
                                {isAdmin && m.userId !== user.id && (
                                    <button onClick={() => handleRemoveMember(m.userId)} className="text-xs text-red-500 hover:underline">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {showAddMember && (
                        <form onSubmit={handleAddMember} className="mt-4 pt-4 border-t">
                            <input
                                type="email"
                                required
                                value={memberEmail}
                                onChange={(e) => setMemberEmail(e.target.value)}
                                placeholder="User Email"
                                className="w-full border p-2 rounded text-sm mb-2"
                            />
                            <div className="flex space-x-2">
                                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 bg-gray-100 text-xs py-1.5 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded">Invite</button>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            {/* Modals placed optimally */}
            {showExpenseModal && <ExpenseModal groupId={id} members={group.members} onClose={() => { setShowExpenseModal(false); fetchGroupData(); }} />}
            {showSettlementModal && <SettlementModal groupId={id} members={group.members} onClose={() => { setShowSettlementModal(false); fetchGroupData(); }} />}
        </div>
    );
};

export default GroupDetails;
