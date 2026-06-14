import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, DollarSign, Split, X } from 'lucide-react';

const ExpenseModal = ({ groupId, members, onClose }) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidById, setPaidById] = useState(user.id);
    const [splitType, setSplitType] = useState('EQUAL');

    const [allocations, setAllocations] = useState(
        members.map(m => ({ userId: m.userId, value: '', include: true }))
    );
    const [loading, setLoading] = useState(false);

    const handleAllocationChange = (userId, field, val) => {
        setAllocations(prev => prev.map(a => a.userId === userId ? { ...a, [field]: val } : a));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const numericAmount = parseFloat(amount);
            let parsedSplits = [];

            if (splitType === 'EQUAL') {
                parsedSplits = allocations.filter(a => a.include).map(a => ({ userId: a.userId }));
            } else if (splitType === 'UNEQUAL') {
                parsedSplits = allocations.filter(a => parseFloat(a.value) > 0).map(a => ({ userId: a.userId, amountOwed: parseFloat(a.value) }));
            } else if (splitType === 'PERCENTAGE') {
                parsedSplits = allocations.filter(a => parseFloat(a.value) > 0).map(a => ({ userId: a.userId, percentage: parseFloat(a.value) }));
            } else if (splitType === 'SHARE') {
                parsedSplits = allocations.filter(a => parseFloat(a.value) > 0).map(a => ({ userId: a.userId, shares: parseFloat(a.value) }));
            }

            if (parsedSplits.length === 0) throw new Error('Include at least one participant.');

            const payload = {
                description,
                amount: numericAmount,
                paidById: Number(paidById),
                splitType,
                splits: parsedSplits
            };

            await api.post(`/groups/${groupId}/expenses`, payload);
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || err.message || 'Failed to create expense');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (uid) => members.find(m => m.userId === uid)?.user?.name || `User ${uid}`;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
            <div className="glass-panel rounded-[2rem] w-full max-w-md my-8 animate-slide-up shadow-2xl overflow-hidden relative">
                {/* Decorative header glow */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500"></div>

                <div className="flex justify-between items-center p-6 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                            <FileText size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Record Expense</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex space-x-4">
                        <div className="flex-1 space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Description</label>
                            <input
                                className="w-full bg-white/60 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium"
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="E.g. Sunday Brunch"
                                autoFocus
                            />
                        </div>
                        <div className="w-32 shrink-0 space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Cost (₹)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={16} /></div>
                                <input
                                    className="w-full bg-white/60 border border-slate-200 pl-8 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                                    type="number" step="0.01" min="0.01" required
                                    value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Paid By</label>
                        <select
                            className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-700 shadow-sm"
                            value={paidById} onChange={e => setPaidById(e.target.value)}
                        >
                            {members.map(m => <option key={m.userId} value={m.userId}>{getUserName(m.userId)}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 pl-1 text-slate-500">
                            <Split size={16} />
                            <label className="text-xs font-bold uppercase tracking-widest">Split Algorithm</label>
                        </div>
                        <div className="flex p-1 bg-slate-100 rounded-xl space-x-1 shadow-inner">
                            {['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].map(t => (
                                <button
                                    type="button" key={t} onClick={() => setSplitType(t)}
                                    className={`flex-1 text-[11px] font-bold py-2.5 rounded-lg transition-all ${splitType === t ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                    title={`Split by ${t}`}
                                >
                                    {t.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border border-slate-200/60 rounded-xl p-2 bg-slate-50/50 max-h-48 overflow-y-auto space-y-1 custom-scrollbar shadow-inner">
                        {allocations.map(a => (
                            <div key={a.userId} className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                <span className="font-bold text-sm text-slate-700 truncate pr-2">{getUserName(a.userId)}</span>
                                {splitType === 'EQUAL' ? (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox" checked={a.include} onChange={e => handleAllocationChange(a.userId, 'include', e.target.checked)}
                                            className="h-5 w-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300 transition-colors cursor-pointer"
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="number" min="0" step="0.01"
                                        placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'shares' : '₹'}
                                        className="w-24 bg-slate-50 border border-slate-200 p-1.5 rounded-md text-right font-medium text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                        value={a.value} onChange={e => handleAllocationChange(a.userId, 'value', e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex space-x-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 btn-secondary py-3">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 transition-all disabled:opacity-50">
                            {loading ? 'Crunching...' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
