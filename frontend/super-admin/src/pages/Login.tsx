import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function formatLoginError(err: any): string {
    const d = err?.response?.data;
    const msg = d?.message;
    if (Array.isArray(msg)) {
        return msg.join(', ');
    }
    if (typeof msg === 'string' && msg.trim()) {
        return msg;
    }
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        return 'Cannot reach API. Check that the backend is running and VITE_API_BASE_URL matches your browser URL (try http://127.0.0.1:5174 and API on port 3001).';
    }
    return err?.message || 'Invalid credentials';
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [persistReady, setPersistReady] = useState(() => {
        try {
            return useAuthStore.persist.hasHydrated();
        } catch {
            return false;
        }
    });

    const login = useAuthStore((s) => s.login);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const navigate = useNavigate();

    useEffect(() => {
        const done = () => setPersistReady(true);
        const unsub = useAuthStore.persist.onFinishHydration(done);
        if (useAuthStore.persist.hasHydrated()) {
            done();
        }
        return unsub;
    }, []);

    useEffect(() => {
        if (persistReady && isAuthenticated) {
            navigate('/app/dashboard', { replace: true });
        }
    }, [persistReady, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/app/dashboard', { replace: true });
        } catch (err: any) {
            setError(formatLoginError(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (!persistReady) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-gray-400">
                Loading…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">HireGoApp Super Admin</h1>
                        <p className="text-gray-400">Sign in to manage the platform</p>
                        <p className="text-gray-500 text-xs mt-2">
                            Default account after Nest seed is <span className="text-gray-400">admin@ats.com</span> — see README.
                            Legacy SQL/root seed may use <span className="text-gray-400">super@admin.com</span>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="admin@ats.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
