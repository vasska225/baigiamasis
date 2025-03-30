import React from 'react';
import useAuthStore from "../../state/useAuthStore";

const Conversation = ({
    props,
    handleConversationClick,
    selectedConversationId
}) => {
    const { user } = useAuthStore();
    return (
        <li
            className={`bg-white p-2 rounded shadow cursor-pointer ${
                props._id === selectedConversationId ? 'border-l-4 border-blue-500' : ''
            }`}
            onClick={() => handleConversationClick(props._id)}
        >
            <p className="font-semibold">
                {props.participantsData
                    .filter(participant => participant._id !== user._id)
                    .map(participant => participant.username ? participant.username : participant.email)
                    .join(', ')
                }
            </p>

            <p className="text-xs whitespace-nowrap text-ellipsis truncate">
                {props.lastMessage?.sender === user._id ? "You: " : null } {props.lastMessage ? props.lastMessage.text : 'New propsersation'}
            </p>
            <p className="text-sm text-gray-500">
                {new Date(props.updatedAt).toLocaleString()}
            </p>
        </li>
    );
};

export default Conversation;
