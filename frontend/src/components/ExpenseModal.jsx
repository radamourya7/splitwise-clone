import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ExpenseModal = ({ groupId, members, onClose }) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidById, setPaidById] = useState(user.id);
    const [splitType, setSplitType] = useState('EQUAL');

    // allocations array maps { userId, value, include }
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

            if (parsedSplits.length === 0) throw new Error('You must include at least one split member');

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Add an Expense</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="flex space-x-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                            <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Dinner at Joe's" autoFocus />
                        </div>
                        <div className="w-32 shrink-0">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
                            <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Paid By</label>
                        <select className="w-full border p-2 rounded bg-white outline-none" value={paidById} onChange={e => setPaidById(e.target.value)}>
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>{getUserName(m.userId)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Split Type</label>
                        <div className="flex space-x-2 bg-gray-100 p-1 rounded">
                            {['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].map(t => (
                                <button type="button" key={t} onClick={() => setSplitType(t)} className={`flex-1 text-xs py-1.5 rounded font-medium ${splitType === t ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                        {allocations.map(a => (
                            <div key={a.userId} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700 truncate pr-2">{getUserName(a.userId)}</span>
                                {splitType === 'EQUAL' ? (
                                    <input type="checkbox" checked={a.include} onChange={e => handleAllocationChange(a.userId, 'include', e.target.checked)} className="h-4 w-4 text-blue-600" />
                                ) : (
                                    <input
                                        type="number"
                                        min="0" step="0.01"
                                        placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'shares' : '₹'}
                                        className="w-24 border p-1 rounded text-right"
                                        value={a.value}
                                        onChange={e => handleAllocationChange(a.userId, 'value', e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={loading} className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
