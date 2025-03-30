import React from "react";
import Header from "./ui/header";

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <main className="flex-grow overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
