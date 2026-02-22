import React from "react";
import { DevChat } from "../components/common/DevChat";

/**
 * DevChat Page
 *
 * Full-page wrapper for the DevChat component.
 * Provides a dedicated page for developer communication and messaging.
 */
export const DevChatPage: React.FC = () => {
    return (
        <div className="dev-chat-page">
            <DevChat />
        </div>
    );
};

export default DevChatPage;
