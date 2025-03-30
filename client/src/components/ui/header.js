import React from "react";
import {useNavigate} from "react-router-dom";
import useAuthStore from "../../state/useAuthStore";
import LogoutBtn from "../ui/logoutBtn";

export default function Header() {
    const navigate = useNavigate();
    const {token, user} = useAuthStore();

    const handleNav = (path) => {
        navigate(path);
    };

    return (
        <header className="bg-white shadow sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-gray-800">Vaska App</h1>
                    </div>

                    <nav className="md:flex space-x-4">

                        { token ? (
                            <>
                                <button
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handleNav("/")}
                                >
                                    Home
                                </button>
                                <button
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handleNav("/favorites")}
                                >
                                    Favorites
                                </button>
                                <button
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handleNav("/messages")}
                                >
                                    Messages
                                </button>
                                <span
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handleNav("/profile")}
                                >
                                    <img className="w-9 h-9 rounded-[50%] cursor-pointer" src={user.photoURL ? user.photoURL : "https://www.svgrepo.com/show/384676/account-avatar-profile-user-6.svg"} alt="User"/>

                                </span>
                            </>
                        ) : ""}

                        {token ? <LogoutBtn/> : ""}

                    </nav>

                </div>
            </div>
        </header>
    );
}
