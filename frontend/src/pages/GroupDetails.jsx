import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import SettlementModal from '../components/SettlementModal';
import { ArrowLeft, PlusCircle, CheckCircle, MessageCircle, MoreVertical, CreditCard, ChevronRight } from 'lucide-react';

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('expenses');

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

    if (!group) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans overflow-x-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-100/50 via-purple-50/50 to-transparent blur-3xl rounded-full -z-10 -translate-y-1/2 translate-x-1/3"></div>

            <nav className="glass-panel sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-white/20">
                <div className="flex items-center space-x-4">
                    <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight leading-none">{group.name}</h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{group.members?.length} active members</p>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mt-4 animate-fade-in">

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header Actions & Tabs */}
                    <div className="glass-card rounded-[2rem] p-2 flex flex-col sm:flex-row justify-between items-center sm:p-3">
                        <div className="flex w-full sm:w-auto p-1 bg-slate-100/80 backdrop-blur rounded-2xl">
                            {['expenses', 'balances', 'settlements'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 sm:flex-none px-6 py-2.5 capitalize rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3 w-full sm:w-auto mt-4 sm:mt-0 px-2 sm:px-0">
                            <button onClick={() => setShowSettlementModal(true)} className="flex-1 sm:flex-none btn-secondary flex items-center justify-center text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200">
                                <CheckCircle size={18} className="mr-2" />
                                <span>Settle</span>
                            </button>
                            <button onClick={() => setShowExpenseModal(true)} className="flex-1 sm:flex-none btn-primary flex items-center justify-center bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 shadow-orange-200">
                                <PlusCircle size={18} className="mr-2" />
                                <span>Expense</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content Display */}
                    <div className="glass-card rounded-[2rem] shadow-sm border border-slate-100/50 p-2 sm:p-6 min-h-[500px]">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                        ) : activeTab === 'expenses' ? (
                            <div className="space-y-4">
                                {expenses.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex justify-center items-center text-slate-300 mx-auto mb-4"><CreditCard size={32} /></div>
                                        <p className="text-lg font-bold text-slate-600">No expenses recorded yet.</p>
                                    </div>
                                )}
                                {expenses.map(exp => (
                                    <div key={exp.id} className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 px-6 border border-transparent hover:border-indigo-100 bg-white rounded-2xl hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300">
                                        <div className="mb-4 sm:mb-0">
                                            <p className="font-bold text-lg text-slate-800 mb-1">{exp.description}</p>
                                            <p className="text-sm font-medium text-slate-500">{new Date(exp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Paid by <span className="text-indigo-600 font-semibold">{getUserName(exp.paidById)}</span></p>
                                        </div>
                                        <div className="w-full sm:w-auto flex justify-between sm:flex-col items-center sm:items-end gap-3 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                            <p className="font-extrabold text-2xl text-slate-800 tracking-tight">₹{exp.amount}</p>
                                            <Link to={`/expenses/${exp.id}/chat`} className="flex items-center text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors group-hover:scale-105 transform">
                                                <MessageCircle size={14} className="mr-1.5" />
                                                Chat
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'balances' ? (
                            <div className="space-y-4">
                                {balances.length === 0 && (
                                    <div className="text-center py-20 text-slate-500">
                                        <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" strokeWidth={1} />
                                        <p className="text-lg font-bold text-slate-700">Perfectly Balanced</p>
                                        <p className="text-sm">Nobody owes anything.</p>
                                    </div>
                                )}
                                {balances.map((b, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row items-center justify-between py-6 px-6 bg-white border border-slate-100 rounded-2xl shadow-sm mb-4">
                                        <div className="flex items-center space-x-3 w-full sm:w-auto mb-4 sm:mb-0">
                                            <div className="flex -space-x-2">
                                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center font-bold text-sm z-10">{getUserName(b.debtor).charAt(0)}</div>
                                                <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{getUserName(b.creditor).charAt(0)}</div>
                                            </div>
                                            <p className="text-slate-700 font-medium">
                                                <span className="font-bold text-slate-900">{getUserName(b.debtor)}</span> owes <span className="font-bold text-indigo-600">{getUserName(b.creditor)}</span>
                                            </p>
                                        </div>
                                        <p className="font-extrabold text-2xl text-red-500">₹{b.amount}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {settlements.length === 0 && <p className="text-center py-20 text-slate-500 text-lg font-bold">No settlements recorded.</p>}
                                {settlements.map(s => (
                                    <div key={s.id} className="flex items-center justify-between py-5 px-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                        <div>
                                            <p className="text-slate-700 font-medium"><span className="font-bold text-slate-900">{getUserName(s.payerId)}</span> paid <span className="font-bold text-emerald-600">{getUserName(s.receiverId)}</span></p>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <p className="font-bold text-xl text-emerald-600">₹{s.amount}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Sidebar */}
                <div className="glass-card rounded-[2rem] p-6 sticky top-24">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Members <span className="text-slate-400 font-medium text-sm ml-1">({group.members?.length})</span></h3>
                        {isAdmin && (
                            <button onClick={() => setShowAddMember(!showAddMember)} className="text-indigo-600 text-sm font-bold bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                                {showAddMember ? 'Close' : '+ Add'}
                            </button>
                        )}
                    </div>

                    {showAddMember && (
                        <form onSubmit={handleAddMember} className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-fade-in shadow-sm">
                            <input
                                type="email"
                                required
                                value={memberEmail}
                                onChange={(e) => setMemberEmail(e.target.value)}
                                placeholder="Enter Email Address"
                                className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button type="submit" className="w-full btn-primary py-2 text-sm">Send Invite</button>
                        </form>
                    )}

                    <div className="space-y-2">
                        {group.members?.map(m => (
                            <div key={m.id} className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors group/member">
                                <div className="flex items-center space-x-3 truncate">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0 shadow-sm border border-white">
                                        {m.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate pr-2">
                                        <p className="text-sm font-bold text-slate-800 truncate">{m.user?.name} {m.userId === user.id && <span className="text-indigo-500 ml-1">(You)</span>}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.role}</p>
                                    </div>
                                </div>
                                {isAdmin && m.userId !== user.id && (
                                    <button onClick={() => handleRemoveMember(m.userId)} className="text-xs font-bold text-red-500 px-2 py-1 bg-red-50 rounded-md opacity-0 group-hover/member:opacity-100 transition-opacity">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Core Operation Modals */}
            {showExpenseModal && <ExpenseModal groupId={id} members={group.members} onClose={() => { setShowExpenseModal(false); fetchGroupData(); }} />}
            {showSettlementModal && <SettlementModal groupId={id} members={group.members} onClose={() => { setShowSettlementModal(false); fetchGroupData(); }} />}
        </div>
    );
};

export default GroupDetails;
