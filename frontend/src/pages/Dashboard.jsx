import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

    if (loading) return <div className="p-8 text-center text-gray-500 min-h-screen flex items-center justify-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow px-6 py-4 flex justify-between items-center w-full sticky top-0 z-10">
                <h1 className="text-xl font-bold text-blue-600">Splitwise Clone</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-700 font-medium">Hello, {user?.name}</span>
                    <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 transition-colors font-medium">Logout</button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-8 flex-1">
                {/* Balances Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-5">Your Overall Balances</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-red-50 p-5 rounded-lg text-red-700 border border-red-100">
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Total I Owe</p>
                            <p className="text-3xl font-bold">₹{balances.totalOwedByMe}</p>
                        </div>
                        <div className="bg-green-50 p-5 rounded-lg text-green-700 border border-green-100">
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Total Owed To Me</p>
                            <p className="text-3xl font-bold">₹{balances.totalOwedToMe}</p>
                        </div>
                        <div className="bg-blue-50 p-5 rounded-lg text-blue-800 border border-blue-100">
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Net Balance</p>
                            <p className="text-3xl font-bold">₹{balances.netBalance}</p>
                        </div>
                    </div>
                </section>

                {/* Groups Section */}
                <section>
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">Your Groups</h2>
                        <button onClick={() => setShowCreateGroup(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-blue-700 text-sm font-medium transition-colors">
                            + Create New Group
                        </button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
                            <p className="text-lg font-medium mb-1">You are not in any groups yet.</p>
                            <p className="text-sm">Create a group to start tracking expenses with peers.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {groups.map(g => (
                                <div key={g.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-800 truncate pr-2">{g.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-5">{g.members?.length || 1} members</p>
                                    </div>
                                    <button onClick={() => navigate(`/groups/${g.id}`)} className="text-blue-600 font-semibold hover:text-blue-800 text-left text-sm flex items-center transition-colors">
                                        Open Group <span className="ml-1 text-lg leading-none">&rarr;</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-xl text-gray-900 mb-4">Create New Group</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg mb-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="E.g. Goa Trip, Apartment"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                required
                                autoFocus
                            />
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
