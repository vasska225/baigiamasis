import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from "../../state/useAuthStore";

const Post = ({ props, reloadParent }) => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const formattedDate = new Date(props.createdAt).toLocaleString();

    const openPost = () => {
        navigate(`/post/${props._id}?from=${props.from}`);
    };

    const viewUser = () => {
        navigate(`/user/${props.author}`);
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
                    postId: props._id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (reloadParent) {
                    reloadParent();
                }
            } else {
                throw new Error(data.message || 'Error adding favorite');
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
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
                    postId: props._id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (reloadParent) {
                    reloadParent();
                }
                return data;
            } else {
                throw new Error(data.message || 'Error adding favorite');
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    };

    return (
        <div
            key={props._id}
            className="bg-white rounded-lg shadow-md p-6 my-4"
        >
            <div className="w-full flex justify-between">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 cursor-pointer" onClick={openPost}>{props.title}</h3>
                { props.from === "Favorites" ? <span className="font-bold text-gray-800 mb-2 cursor-pointer" onClick={removeFavorite}>Remove From Favorites</span> :""}
                { props.from === "Home" && !props.isFavorite ? <span className="font-bold text-gray-800 mb-2 cursor-pointer" onClick={addFavorite}>Add Favorite</span> :""}
            </div>
            <p className="text-gray-700 mb-4 line-clamp-2">{props.content}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="cursor-pointer" onClick={viewUser}>By {props.authorUsername ? props.authorUsername : props.author}</span>
                <span>{formattedDate}</span>
            </div>
        </div>
    );
};

export default Post;
