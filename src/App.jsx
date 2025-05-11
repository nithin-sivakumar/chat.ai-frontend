// src/App.js
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating conversation IDs

const API_BASE_URL = import.meta.env.VITE_APP_URL; // Your FastAPI backend URL

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null); // For auto-scrolling

  // --- Effects ---

  // Effect to load or start a new conversation on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem("chatConversationId");
    if (storedConversationId) {
      setConversationId(storedConversationId);
      fetchHistory(storedConversationId);
    } else {
      startNewConversation();
    }
  }, []);

  // Effect to scroll to the bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- API Helper Functions ---

  const fetchHistory = async (convId) => {
    if (!convId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${convId}/history?limit=100`
      );
      if (!response.ok) {
        if (response.status === 404) {
          // Conversation not found on backend, might be a new one client-side
          console.warn(
            "Conversation not found on backend, starting fresh or check ID."
          );
          setMessages([]); // Clear messages if history is not found
          // Optionally, force a new conversation if this happens unexpectedly
          // startNewConversation();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(
        data.map((msg) => ({
          id: msg.id, // Use the ID from the backend
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError("Failed to load message history. Please try again.");
      setMessages([]); // Clear messages on error
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Option 1: Use the backend endpoint to generate an ID (if you want backend to always create it)
      // const response = await fetch(`${API_BASE_URL}/chat/new`, { method: "POST" });
      // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      // const data = await response.json();
      // const newConvId = data.conversation_id;

      // Option 2: Generate UUID on client-side (simpler for this setup)
      const newConvId = uuidv4();

      setConversationId(newConvId);
      localStorage.setItem("chatConversationId", newConvId);
      setMessages([]); // Clear old messages
      console.log("Started new conversation:", newConvId);
    } catch (err) {
      console.error("Failed to start new conversation:", err);
      setError("Failed to start a new conversation. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Event Handlers ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !conversationId) return;

    const userMessage = {
      id: uuidv4(), // Temporary client-side ID
      sender: "user",
      content: userInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${conversationId}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: userMessage.content }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const aiMessageData = await response.json();
      const aiMessage = {
        id: aiMessageData.id, // Use the ID from the backend
        sender: "assistant",
        content: aiMessageData.content,
        timestamp: aiMessageData.timestamp,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to get a response. Please try again.");
      // Optional: remove the optimistically added user message if AI fails
      // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper Functions ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Render ---
  return (
    <div className="w-full h-screen p-5 bg-stone-300 flex flex-col items-center justify-center">
      <div className="w-full h-full rounded-xl bg-stone-200 shadow-xl flex flex-col items-start justify-start overflow-hidden">
        {/* Header */}
        <div className="w-full h-20 border-b border-stone-400 shadow-md flex items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-stone-700">Chat with AI</h1>
          <button
            onClick={startNewConversation}
            className="px-4 py-2 cursor-pointer bg-stone-400 hover:bg-stone-500 text-white rounded-lg text-sm"
            disabled={isLoading}
          >
            New Chat
          </button>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 w-full p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2 bg-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id || msg.timestamp} // Backend ID is preferred
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow ${
                  msg.sender === "user"
                    ? "bg-purple-200 text-black border border-black"
                    : "bg-stone-300 text-stone-800 border border-black"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {/* <p className="text-xs mt-1 opacity-70 text-right">
                  {new Date(msg.timestamp).toLocaleString([], {
                    // hour: 'numeric', // or '2-digit'
                    // minute: 'numeric', // or '2-digit'
                    // Use more specific options for consistent formatting
                    // year: "numeric",
                    // month: "numeric",
                    // day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    // second: '2-digit', // optional
                    // timeZoneName: 'short' // optional, e.g., "PST", "EDT"
                  })}
                </p> */}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* For auto-scrolling */}
        </div>

        {/* Input Area */}
        <div className="w-full h-auto min-h-[3.5rem] border-t border-stone-400 shadow-md p-2">
          <form
            className="w-full h-full flex items-center justify-center gap-2"
            onSubmit={handleSendMessage}
          >
            <input
              type="text"
              name="message"
              id="message"
              autoComplete="off"
              placeholder={
                isLoading ? "AI is thinking..." : "Type a message..."
              }
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading || !conversationId}
              className="flex-1 bg-stone-300 border border-stone-400 p-2 rounded-xl outline-none focus-within:ring-1 ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim() || !conversationId}
              className="px-8 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>
      <p className="text-xs text-stone-600 mt-2">
        Conversation ID: {conversationId || "Initializing..."}
      </p>
    </div>
  );
};

export default App;
