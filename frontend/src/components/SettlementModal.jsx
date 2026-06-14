import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, X, ArrowRight } from 'lucide-react';

const SettlementModal = ({ groupId, members, onClose }) => {
    const { user } = useAuth();
    const [receiverId, setReceiverId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!receiverId) throw new Error("Select a receiver");
            await api.post(`/groups/${groupId}/settlements`, {
                receiverId: Number(receiverId),
                amount: parseFloat(amount)
            });
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || err.message || 'Settlement failed');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (uid) => members.find(m => m.userId === uid)?.user?.name || `User ${uid}`;
    const validReceivers = members.filter(m => m.userId !== user.id);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-panel rounded-[2rem] w-full max-w-sm overflow-hidden relative shadow-2xl animate-slide-up">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                <div className="p-6 border-b border-white/50 bg-white/40 backdrop-blur-sm flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                            <CheckCircle size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Settle Up</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center space-y-3 shadow-inner">
                        <div className="flex items-center space-x-4 w-full">
                            <div className="flex-1 bg-white border border-slate-200 text-center py-2 rounded-lg font-bold text-sm text-slate-700 shadow-sm truncate pb-2">
                                You
                            </div>
                            <div className="text-emerald-500 shrink-0">
                                <ArrowRight strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 relative">
                                <select
                                    className="w-full bg-white border border-emerald-200 py-2 pl-2 pr-6 rounded-lg font-bold text-sm text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none shadow-sm shadow-emerald-50 cursor-pointer"
                                    value={receiverId}
                                    onChange={e => setReceiverId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select User</option>
                                    {validReceivers.map(m => (
                                        <option key={m.userId} value={m.userId}>{getUserName(m.userId)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 text-center">Amount to Settle</label>
                        <div className="relative max-w-[200px] mx-auto">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-emerald-500 font-bold text-xl">₹</span>
                            </div>
                            <input
                                className="w-full bg-white border-2 border-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none text-2xl font-extrabold text-slate-800 text-center shadow-sm transition-colors placeholder-slate-300"
                                type="number" step="0.01" min="0.01" required
                                value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col space-y-3">
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all disabled:opacity-50 tracking-wide">
                            {loading ? 'Processing...' : 'Confirm Payment'}
                        </button>
                        <button type="button" onClick={onClose} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettlementModal;
