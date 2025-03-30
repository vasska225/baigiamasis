import React, { useEffect, useState } from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';
import Post from "./posts/post";

const HomePage = () => {
    const{ logout, token, user } = useAuthStore();
    const [posts, setPosts] = useState([]);
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/post/all', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setPosts(data.posts);
                setReload(false);
            } catch (error) {
                logout();
            }
        };

        if (token) {
            fetchData();
        }
    }, [token, reload, logout]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleReload = () => {
        setReload(true);
    };

    const create = () => {
        navigate('/post/create');
    };

    return (

                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                        Welcome {user.username ? user.username : user.email}
                    </h2>

                    <div>
                        <div className="flex justify-between">
                            <h3 className="text-2xl font-bold text-gray-800">Latest posts</h3>
                            <button
                                className="bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white px-4 border border-gray-500 hover:border-transparent rounded"
                                onClick={() => {create()}}
                            >
                                Create Post
                            </button>
                        </div>
                        <div className="text-gray-600">
                            { posts.length > 0 ? (
                                posts.slice(0, 5).map((post) => (
                                    <Post
                                        key={post._id}
                                        props={{ from: "Home", ...post }}
                                        reloadParent={handleReload}
                                    />
                                ))
                            ) : (
                                <div>No posts found.</div>
                            )
                            }
                        </div>
                    </div>

                </main>

    );
};

export default HomePage;
