import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
    const { id: expenseId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
        setupSocket();
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [expenseId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get(`/expenses/${expenseId}/chat`);
            setMessages(data);

            const expRes = await api.get(`/expenses/${expenseId}`);
            setExpense(expRes.data);
        } catch (err) {
            console.error('Error fetching chat history');
            if (err.response?.status === 404) navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = () => {
        const token = localStorage.getItem('token');
        const socket = io('http://localhost:5000', { auth: { token } });

        socket.on('connect', () => {
            socket.emit('joinExpenseRoom', { expenseId });
        });

        socket.on('receiveMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        socketRef.current = socket;
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || newMessage.length > 500) return;
        socketRef.current.emit('sendMessage', { expenseId, message: newMessage });
        setNewMessage('');
    };

    if (loading) return <div className="p-8 text-center text-gray-500 min-h-screen flex items-center justify-center">Loading Chat...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow px-6 py-4 flex items-center border-b border-gray-200">
                <Link to={expense ? `/groups/${expense.groupId}` : '/dashboard'} className="text-gray-500 hover:text-gray-800 font-medium mr-4 transition-colors">&larr; Back</Link>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Expense Chat</h1>
                    {expense && <p className="text-xs text-gray-500 truncate max-w-[250px] sm:max-w-md">{expense.description} (₹{expense.amount})</p>}
                </div>
            </nav>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-80px)]">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-100px)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 mt-10">
                                <p className="font-medium text-lg mb-1">No messages yet.</p>
                                <p className="text-sm">Start the conversation about {expense?.description || 'this expense'}!</p>
                            </div>
                        )}

                        {messages.map((m, i) => {
                            const isMe = m.userId === user.id;
                            return (
                                <div key={m.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 px-1 font-semibold">{isMe ? 'You' : m.user?.name}</span>
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                        <p className="text-sm break-words">{m.message}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center space-x-3">
                        <input
                            className="flex-1 border border-gray-300 px-5 py-3 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            maxLength={500}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Chat;
