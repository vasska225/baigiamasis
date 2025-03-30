import React, {useEffect, useState} from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';
import Post from "./posts/post";

const Favorites = () => {
    const { token } = useAuthStore();
    const [favoritePosts, setFavoritePosts] = useState([]);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        const fetchFavoritePosts = async () => {
            try {
                const response = await fetch('/api/favorites/posts', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setFavoritePosts(data.posts);
                    setReload(false);
                }
            } catch (error) {
                console.error('Error fetching favorite posts:', error);
            }
        };

        if (token) {
            fetchFavoritePosts();
        }
    }, [token, reload]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleReload = () => {
        setReload(true);
    };


    return (
        <div className="flex min-h-[80vh] min-w-[70vw]">

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-3xl font-semibold text-gray-900 ">Your Favorites:</h2>
                </div>


                <div>
                    <div className="text-gray-600">
                        {favoritePosts.length === 0 ? (
                            <p>No favorite posts found.</p>
                        ) : (
                            favoritePosts.map((post) => (
                                <Post
                                    key={post._id}
                                    props={{ from: "Favorites", ...post }}
                                    reloadParent={handleReload}
                                />
                            ))
                        )}
                    </div>
                </div>
            </main>

        </div>
    );
};

export default Favorites;
