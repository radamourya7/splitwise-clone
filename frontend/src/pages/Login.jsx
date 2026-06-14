import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 p-4">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300 mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-300 mix-blend-multiply filter blur-3xl opacity-40 animate-blob" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-fuchsia-300 mix-blend-multiply filter blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="w-full max-w-md glass-panel rounded-[2rem] p-8 sm:p-10 transform transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 animate-slide-up">

                <div className="text-center mb-10">
                    <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/40 mb-6 transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                        <Wallet size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">Splitwise</h2>
                    <p className="text-slate-500 mt-2 font-medium">Welcome back, securely.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2 flex-shrink-0 animate-pulse"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                className="w-full bg-white/50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 focus:bg-white"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot?</a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                className="w-full bg-white/50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 focus:bg-white"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        className="w-full btn-primary flex justify-center items-center group mt-8"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <p className="mt-8 text-center text-sm text-slate-500 font-medium pb-2">
                        Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 transition-colors">Create one</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
