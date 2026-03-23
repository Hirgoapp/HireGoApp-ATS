import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/app');
        } catch (err: any) {
            const message = err?.response?.data?.message || err.message || 'Login failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <form onSubmit={handleSubmit} style={{ width: 400, background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <h1 style={{ color: '#212529', fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Welcome Back</h1>
                <p style={{ color: '#6c757d', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>Business Portal Sign In</p>
                {error && (
                    <div style={{ background: '#ffe0e0', color: '#c92a2a', border: '2px solid #ff8787', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                        {error}
                    </div>
                )}
                <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                        <label style={{ color: '#495057', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@company.com"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: '#f8f9fa',
                                color: '#212529',
                                border: '2px solid #dee2e6',
                                borderRadius: 8,
                                fontSize: 14,
                                transition: 'border-color 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#0c5ccc')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#dee2e6')}
                        />
                    </div>
                    <div>
                        <label style={{ color: '#495057', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: '#f8f9fa',
                                color: '#212529',
                                border: '2px solid #dee2e6',
                                borderRadius: 8,
                                fontSize: 14,
                                transition: 'border-color 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#0c5ccc')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#dee2e6')}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 8,
                            padding: '12px 16px',
                            background: loading ? '#6c757d' : 'linear-gradient(135deg, #0c5ccc 0%, #0a4fa8 100%)',
                            color: 'white',
                            border: 0,
                            borderRadius: 8,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 4px 12px rgba(12,92,204,0.3)'
                        }}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </div>
            </form>
        </div>
    );
}
