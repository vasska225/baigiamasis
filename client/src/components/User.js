import React, { useState, useEffect } from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';
import Post from "./posts/post";

const Profile = () => {
    const { logout, token, user } = useAuthStore();
    const { email } = useParams();
    const [username, setUsername] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [userId, setUserId] = useState('');
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {

        async function loadUser() {
            try {
                const response = await fetch(`/api/user/get/${email}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setUsername(data.user.username || '');
                    setPhotoURL(data.user.photoURL || '');
                    setUserId(data.user._id || '');
                }
            } catch (error) {
                console.error('Error fetching favorite posts:', error);
            }
        }

        const getPosts = async () => {
            try {
                const response = await fetch(`/api/posts/${email}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setPosts(data.posts);
            } catch (error) {
                logout();
            }
        };

        loadUser();
        getPosts();

    }, [email, logout, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleReload = () => {
    };

    const createMessage = () => {
        navigate(`/messages?to=${email}`);
    }

    return (
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between mb-2 py-8">
                    <div className="flex">
                        <img className="w-14 h-14 rounded-[50%] cursor-pointer mr-2" src={ photoURL ? photoURL : "https://www.svgrepo.com/show/384676/account-avatar-profile-user-6.svg"} alt="User"/>
                        <h1 className="text-4xl self-center font-bold text-gray-800 ">{ email } { username ? `(${username})` : "" }</h1>
                    </div>
                    { userId === user._id ? "" : (
                        <button
                            className="bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white px-4 border border-gray-500 hover:border-transparent rounded"
                            onClick={createMessage}
                        >
                            Message
                        </button>
                    )}

                </div>

                <div>
                    <div className="flex justify-between">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Latest posts</h3>
                    </div>
                    <div className="text-gray-600">
                        {posts.map(post => (
                            <Post
                                key={post._id}
                                props={{ from: "User", ...post }}
                                reloadParent={handleReload}
                            />
                        ))}
                    </div>
                </div>
            </main>
    );
};

export default Profile;
