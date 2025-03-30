import React, { useEffect, useState } from 'react';
import {Navigate, useLocation, useNavigate, useParams} from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';

const Post = () => {
    const { token } = useAuthStore();
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const from = queryParams.get('from');
    const [post, setPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`/api/post/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setPost(data.post);
                setIsFavorite(data.post.isFavorite);
            } catch (error) {
                console.error('Error fetching post:', error);
            }
        };

        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/post/${id}/comments`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setComments(data.comments);
            } catch (error) {
                console.error('Error fetching post:', error);
            }
        }

        if (id) {
            fetchPost();
            fetchComments();
        }
    }, [id, token, commentText]);

    const handleBack = () => {
        if (from) {
            switch (from.toUpperCase()) {
                case "HOME":
                    navigate('/');
                    break;
                case "FAVORITES":
                    navigate('/favorites');
                    break;
                default:
                    navigate('/');
                    break;
            }
        } else {
            navigate('/');
        }
    };


    const submitComment = async () => {
        if (!commentText) return;
        try {
            const response = await fetch(`/api/comment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    postId: id,
                    content: commentText,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setCommentText('');
            } else {
                alert('Failed to create comment: ' + data.message);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Error creating comment');
        }
    };

    const addFavorite = async () => {
        try {
            const response = await fetch('/api/favorites/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    postId: id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message || 'Error adding favorite');
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    };

    const removeFavorite = async () => {
        try {
            const response = await fetch('/api/favorites/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    postId: id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message || 'Error adding favorite');
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    };

    const toggleFavorite = async () => {
        const newFavoriteStatus = !isFavorite;
        setIsFavorite(newFavoriteStatus);

        try {
            if (newFavoriteStatus) {
                await addFavorite();
            } else {
                await removeFavorite();
            }
        } catch (error) {
            setIsFavorite(isFavorite);
            console.error('Error toggling favorite:', error);
        }
    };

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!post) {
        return <div>Post not found</div>;
    }

    console.log(from);

    return (
        <div className="min-h-[80vh] min-w-[70vw] flex flex-col bg-gray-50">

            <div className="flex-1 flex flex-col items-center py-8">

                <div className="w-full max-w-3xl flex justify-between items-center p-4 mb-3 bg-white shadow-sm">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Back
                    </button>

                    <button
                        onClick={ toggleFavorite }
                        className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        { isFavorite ? "Remove Favorite" : "Add Favorite" }
                    </button>
                </div>

                <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">{post.title}</h2>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    <p className="text-sm text-gray-500">
                        By <span className="font-medium">{post.author}</span> on{' '}
                        {new Date(post.createdAt).toLocaleString()}
                    </p>
                </div>

                <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6">
                    <div className="flex mb-4">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                        <button
                            onClick={submitComment}
                            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Submit
                        </button>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Comments:</h3>

                    {comments.map((comment, index) => (
                        <div key={index}>{comment.content} -> {comment.user}</div>
                    ))}

                </div>
            </div>
        </div>
    );
};

export default Post;
