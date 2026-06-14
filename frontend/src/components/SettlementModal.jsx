import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

    // Available receivers exclude self
    const validReceivers = members.filter(m => m.userId !== user.id);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Settle Up</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Paying To</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
                            value={receiverId}
                            onChange={e => setReceiverId(e.target.value)}
                            required
                        >
                            <option value="">Select a member...</option>
                            {validReceivers.map(m => (
                                <option key={m.userId} value={m.userId}>{getUserName(m.userId)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                        <input
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="pt-3 flex space-x-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                            {loading ? 'Processing...' : 'Settle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettlementModal;
