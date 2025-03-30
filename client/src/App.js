import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import HomePage from './components/HomePage';
import Create from "./components/posts/postCreate";
import Favorites from "./components/Favorites";
import Post from "./components/Post";
import Profile from "./components/Profile";
import User from "./components/User";
import Messages from "./components/Messages";

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user/:email" element={<User />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/post/:id" element={<Post />} />
                    <Route path="/post/create" element={<Create />} />
                    <Route path="/messages" element={<Messages />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
