import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

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
        const socket = io('https://splitwise-clone-8k94.onrender.com', { auth: { token } });

        socket.on('connect', () => {
            socket.emit('joinExpenseRoom', { expenseId });
        });

        socket.on('receiveMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socketRef.current = socket;
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || newMessage.length > 500) return;
        socketRef.current.emit('sendMessage', { expenseId, message: newMessage });
        setNewMessage('');
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden relative">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-indigo-50/30 pointer-events-none -z-10"></div>

            <nav className="glass-panel sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link to={expense ? `/groups/${expense.groupId}` : '/dashboard'} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center">
                            Expense Discussion
                        </h1>
                        {expense && <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-md mt-0.5"><span className="text-indigo-600 font-bold">₹{expense.amount}</span> • {expense.description}</p>}
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto w-full p-2 sm:p-6 flex flex-col h-[calc(100vh-64px)] relative z-10 animate-fade-in">
                <div className="glass-card rounded-[2rem] shadow-xl border border-white/60 flex flex-col h-full overflow-hidden">

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex justify-center items-center mb-4">
                                    <MessageCircle size={32} className="text-slate-300" />
                                </div>
                                <p className="font-bold text-xl text-slate-600 mb-1">It's quiet here...</p>
                                <p className="text-sm">Start discussing this expense.</p>
                            </div>
                        )}

                        {messages.map((m, i) => {
                            const isMe = m.userId === user.id;
                            const showAvatar = !isMe && (i === 0 || messages[i - 1].userId !== m.userId);

                            return (
                                <div key={m.id || i} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                                            {showAvatar && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm mb-1">
                                                    {m.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        {showAvatar && !isMe && <span className="text-[11px] font-bold text-slate-400 mb-1 ml-1">{m.user?.name}</span>}

                                        <div className={`px-5 py-3 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-indigo-200' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                                            <p className="text-[15px] leading-relaxed break-words">{m.message}</p>
                                        </div>

                                        <span className={`text-[10px] font-medium text-slate-400 mt-1.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} className="h-1" />
                    </div>

                    <form onSubmit={handleSend} className="p-4 bg-white/80 backdrop-blur border-t border-slate-100 flex items-center space-x-3">
                        <input
                            className="flex-1 bg-slate-100/80 border-transparent px-5 py-3.5 rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-[15px] font-medium text-slate-800 transition-all placeholder-slate-400 shadow-inner block"
                            placeholder="Type a message..."
                            value={newMessage} onChange={(e) => setNewMessage(e.target.value)} maxLength={500} autoFocus
                        />
                        <button
                            type="submit" disabled={!newMessage.trim()}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:hover:scale-100 transition-all shrink-0"
                        >
                            <Send size={18} className="translate-x-[-1px] translate-y-[1px]" strokeWidth={2.5} />
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
};

export default Chat;
