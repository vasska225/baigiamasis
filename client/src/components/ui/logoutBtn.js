import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../state/useAuthStore';

const LogoutBtn = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const redirect = () => {
        logout();
        navigate('/login');
    };

    return (
        <button
            className="text-red-600 hover:text-gray-800"
            onClick={redirect}
        >
            Logout
        </button>
    );
};

export default LogoutBtn;
