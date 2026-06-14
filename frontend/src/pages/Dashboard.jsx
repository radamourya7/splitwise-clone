import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Wallet, TrendingUp, TrendingDown, Users, Plus, ChevronRight, LogOut, Activity, UsersRound } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [balances, setBalances] = useState({ totalOwedByMe: 0, totalOwedToMe: 0, netBalance: 0 });
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [balRes, grpRes] = await Promise.all([
                api.get('/balances'),
                api.get('/groups')
            ]);
            setBalances(balRes.data);
            setGroups(grpRes.data);
        } catch (err) {
            console.error('Error fetching dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups', { name: newGroupName });
            setNewGroupName('');
            setShowCreateGroup(false);
            fetchDashboardData();
        } catch (err) {
            alert('Error creating group');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
            {/* Soft decorative background element */}
            <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-gradient-to-br from-indigo-100/40 via-purple-100/20 to-transparent rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>

            {/* Navbar */}
            <nav className="glass-panel sticky top-0 z-30 px-6 py-4 flex justify-between items-center border-b border-white/20">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-md">
                        <Wallet size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Splitwise</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-white/60 px-4 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold mr-2">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{user?.name}</span>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-10 z-10 animate-fade-in relative">

                {/* Header Welcome */}
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Overview</h2>
                    <p className="text-slate-500 font-medium mt-1">Here's your current financial breakdown across all groups.</p>
                </div>

                {/* Balances Section */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-80 transition-opacity"></div>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl shadow-sm border border-red-100">
                                <TrendingDown size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total I Owe</h3>
                        </div>
                        <p className="text-4xl font-extrabold text-slate-800 mt-2">₹{balances.totalOwedByMe}</p>
                    </div>

                    <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-80 transition-opacity"></div>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl shadow-sm border border-emerald-100">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Owed To Me</h3>
                        </div>
                        <p className="text-4xl font-extrabold text-slate-800 mt-2">₹{balances.totalOwedToMe}</p>
                    </div>

                    <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden group border-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">
                                <Activity size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Balance</h3>
                        </div>
                        <p className={`text-4xl font-extrabold mt-2 ${balances.netBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {balances.netBalance > 0 ? '+' : ''}₹{balances.netBalance}
                        </p>
                    </div>
                </section>

                {/* Groups Section */}
                <section>
                    <div className="flex justify-between items-end mb-6 border-b border-slate-200/50 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Active Groups</h2>
                            <p className="text-slate-500 text-sm mt-1">Manage shared expenses with your peers.</p>
                        </div>
                        <button onClick={() => setShowCreateGroup(true)} className="btn-primary flex items-center space-x-2">
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Create Group</span>
                        </button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="glass-card p-16 rounded-[2rem] text-center flex flex-col items-center justify-center border-dashed">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                                <UsersRound size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No groups yet</h3>
                            <p className="text-slate-500 max-w-sm mb-6">Create a group to start adding expenses and settling up with your friends or roommates.</p>
                            <button onClick={() => setShowCreateGroup(true)} className="btn-secondary flex items-center space-x-2">
                                <Plus size={18} />
                                <span>Add your first group</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map(g => (
                                <div key={g.id} onClick={() => navigate(`/groups/${g.id}`)} className="glass-card p-6 rounded-[2rem] cursor-pointer flex flex-col justify-between group">
                                    <div className="mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-200 shadow-sm">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="font-bold text-xl text-slate-800 truncate mb-1">{g.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{g.members?.length || 1} {g.members?.length === 1 ? 'member' : 'members'}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <span className="text-sm font-bold text-indigo-600">View Details</span>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                            <ChevronRight size={18} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel rounded-[2rem] p-8 w-full max-w-md animate-slide-up shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-2xl text-slate-800 tracking-tight">New Group</h3>
                            <button onClick={() => setShowCreateGroup(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup}>
                            <div className="space-y-2 mb-8">
                                <label className="block text-sm font-semibold text-slate-700 ml-1">Group Name</label>
                                <input
                                    className="w-full bg-white/50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-lg font-medium placeholder-slate-400"
                                    placeholder="E.g. Apartment, Goa Trip..."
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary text-center justify-center disabled:opacity-50" disabled={!newGroupName.trim()}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
