import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    const redirect = () => {
        navigate('/login');
    };

    return (
        <button
            className="text-gray-600 hover:text-gray-800"
            onClick={redirect}
        >
            Login
        </button>
    );
};

export default Login;
