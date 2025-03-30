import React, { useState } from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser, setToken, token } = useAuthStore();
    const navigate = useNavigate();

    if (token) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (data.token) {
                setToken(data.token);
                setUser(data.user);
                navigate('/');
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <form
                className="bg-white p-6 rounded shadow-md w-full max-w-sm"
            >
                <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700">
                        Email:
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-gray-700">
                        Password:
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                    />
                </div>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                >
                    Login
                </button>
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="text-blue-500 hover:underline"
                    >
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
