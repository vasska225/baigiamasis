import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../state/useAuthStore';

const PostCreate = () => {
    const { token, user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/post/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    author: user ? user.email : ''
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess('Post created successfully!');
                setTitle('');
                setContent('');
            } else {
                setError(data.message || 'Failed to create post');
            }
        } catch (err) {
            console.error('Error creating post:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] min-w-[50vw]">
            <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Create a New Post</h3>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {success && <p className="text-green-500 mb-4">{success}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-gray-700">
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="content" className="block text-gray-700">
                                Content
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows="6"
                                className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                        >
                            Create Post
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PostCreate;
