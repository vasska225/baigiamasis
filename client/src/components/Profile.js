import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';

const Profile = () => {
    const { token, user, setUser } = useAuthStore();
    const [username, setUsername] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setPhotoURL(user.photoURL || '');
        }
    }, [user]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                setMessage('Passwords do not match');
                return;
            }
        }

        const payload = {
            username,
            photoURL,
        };
        if (password) {
            payload.password = password;
        }

        try {
            const response = await fetch('/api/user/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Profile updated successfully');
                if (data.user) {
                    setUser(data.user);
                }
            } else {
                setMessage(data.message || 'Error updating profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('An error occurred while updating profile');
        }
    };

    return (
        <div className="min-h-[80vh] min-w-[70vw] flex flex-col bg-gray-50">
            <div className="flex-1 flex flex-col items-center py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h1>
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow-md">
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Photo URL</label>
                        <input
                            type="text"
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Enter your photo URL"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Confirm your new password"
                        />
                    </div>
                    {message && (
                        <div className="mb-4 text-center text-red-500">
                            {message}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
