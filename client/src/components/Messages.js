import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../state/useAuthStore';
import Conversation from "./messages/conversation";
import { PlusCircle } from "lucide-react";

const Messages = () => {
    const { token, user } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [reload, setReload] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const to = queryParams.get('to');

    useEffect(() => {
        async function checkOrCreateConversation() {
            if (to && token && user) {
                try {
                    const response = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            participants: [user.email, to],
                        }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setSelectedConversationId(data.conversationId);
                    } else {
                        setError(data.message || 'Error creating conversation');
                    }
                    navigate('/messages', { replace: true });
                } catch (err) {
                    console.error('Error checking or creating conversation:', err);
                    setError('An error occurred while creating conversation.');
                }
            }
        }
        checkOrCreateConversation();
    }, [to, token, user, navigate]);

    useEffect(() => {
        async function fetchConversations() {
            try {
                const response = await fetch('/api/conversations', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setConversations(data.conversations);
                } else {
                    setError(data.message || 'Error fetching conversations');
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setError('An error occurred while fetching conversations.');
            }
        }
        if (token) {
            fetchConversations();
        }
    }, [token, reload]);

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedConversationId) return;
            try {
                const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setMessages(data.messages);
                    setReload(false);
                } else {
                    setError(data.message || 'Error fetching messages');
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('An error occurred while fetching messages.');
            }
        }
        if (token && selectedConversationId) {
            fetchMessages();
        }
    }, [token, selectedConversationId, reload]);

    const handleConversationClick = (convId) => {
        setSelectedConversationId(convId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversationId) return;
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversationId: selectedConversationId,
                    text: newMessage.trim(),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setNewMessage('');
                setReload(true);
            } else {
                setError(data.message || 'Error sending message');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('An error occurred while sending your message.');
        }
    };

    const createConversation = async () => {
        try {
            const recipientEmail = prompt("Enter the recipient's email:");
            if (!recipientEmail) return;
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    participants: [user.email, recipientEmail],
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setSelectedConversationId(data.conversationId);
                setReload(true);
            } else {
                setError(data.message || 'Error creating conversation');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            setError('An error occurred while creating the conversation.');
        }
    };

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex flex-grow min-h-full">
            <aside className="w-64 bg-gray-100 border-r border-gray-200 p-4 overflow-auto flex flex-col">
                <div className="cursor-pointer my-2 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <PlusCircle onClick={createConversation} className="cursor-pointer" />
                </div>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                {conversations.length === 0 ? (
                    <p className="text-gray-500">No conversations found.</p>
                ) : (
                    <ul className="flex-grow space-y-2">
                        {conversations.map((conv) => (
                            <Conversation
                                key={conv._id}
                                props={conv}
                                handleConversationClick={handleConversationClick}
                                selectedConversationId={selectedConversationId}
                            />
                        ))}
                    </ul>
                )}
                <div className="mt-auto text-center">
                    Footer
                </div>
            </aside>

            <main className="flex-grow flex flex-col p-4">
                {selectedConversationId ? (
                    <>
                        <div className="flex-grow bg-white rounded shadow p-4 mb-4 overflow-auto">
                            <h2 className="text-xl font-bold mb-2">Messages</h2>
                            {messages.length === 0 ? (
                                <p className="text-gray-500">No messages in this conversation.</p>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg._id} className="mb-2">
                    <span className="font-semibold">
                      {msg.sender === user.userId ? 'You' : (msg.senderData?.username || msg.senderData?.email)}:
                    </span>{' '}
                                        <span>{msg.text}</span>
                                        <div className="text-xs text-gray-400">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 flex">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
                            />
                            <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <p className="text-gray-500">Select a conversation to see messages.</p>
                )}
            </main>
        </div>
    );
};

export default Messages;
