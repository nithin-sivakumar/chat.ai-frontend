// src/App.js
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating conversation IDs
import Markdown from "react-markdown";

const API_BASE_URL = import.meta.env.VITE_APP_URL; // Your FastAPI backend URL

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tip, setTip] = useState(
    "Tip: Use () for giving instructions and ** for roleplays\n\nIt's always good to introduce yourself. Tell me your name and gender, your preferences, etc. to help me serve you better."
  );

  const messagesEndRef = useRef(null); // For auto-scrolling messages
  const inputRef = useRef(null); // For auto-focusing input

  // --- Effects ---

  // Effect to load or start a new conversation on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem("chatConversationId");
    if (storedConversationId) {
      setConversationId(storedConversationId);
      fetchHistory(storedConversationId);
    } else {
      // Do NOT auto-start a new conversation on mount
      // Just wait for user to click "New Chat"
      setConversationId(null);
    }
  }, []);

  // Effect to scroll to the bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to auto-focus the input field
  useEffect(() => {
    if (inputRef.current && !isLoading && conversationId) {
      inputRef.current.focus();
    }
  }, [isLoading, conversationId, messages]); // Re-focus when loading state changes, conversation is ready, or after new messages

  // --- API Helper Functions ---

  const fetchHistory = async (convId) => {
    if (!convId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${convId}/history`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(
            "Conversation not found on backend, starting fresh or check ID."
          );
          setMessages([]);
          // If a 404 occurs, it's often better to start a new conversation
          // or inform the user clearly. Forcing a new one here:
          // startNewConversation(); // Uncomment if you prefer to auto-start new on 404
          // localStorage.removeItem("chatConversationId"); // Clear invalid ID
          // Consider starting a new one if the old one is invalid
          // For now, we let it be, user can click "New Chat" or it might be handled by startNewConversation() if called elsewhere
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched history for conversation ${convId}:`);
      console.log(data);
      setMessages(
        data.payload.map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          attachment: msg.attachment || null,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError("Failed to load message history. Starting a new chat.");
      setMessages([]);
      startNewConversation(); // Start new if history fails critically
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/new`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start conversation");
      const data = await response.json();

      setConversationId(data.payload.conversation_id);
      localStorage.setItem("chatConversationId", data.payload.conversation_id);
    } catch (err) {
      console.error("Failed to start new conversation:", err);
      setError("Could not start new conversation.");
      setConversationId(null);
      localStorage.removeItem("chatConversationId");
    } finally {
      setIsLoading(false);
    }
  };
  // --- Event Handlers ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !conversationId) return;

    const userMessage = {
      id: uuidv4(),
      sender: "user",
      content: userInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = userInput; // Store before clearing
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
          body: JSON.stringify({ content: userMessage.content }), // Send original userMessage.content
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown server error during send." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const jsonData = await response.json();
      const aiMessageData = jsonData.payload;
      const aiMessage = {
        id: aiMessageData.id,
        sender: "assistant",
        content: aiMessageData.content,
        timestamp: aiMessageData.timestamp,
        attachment: aiMessageData.attachment || null,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to get a response. Please try again.");
      // Optional: Revert optimistic update or mark message as failed
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== userMessage.id)
      );
      setUserInput(currentInput); // Restore user input if send failed
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
    // Outermost container: takes full screen height, prevents its own scrolling, and centers its content.
    <div className="overflow-y-hidden w-full h-screen p-3 bg-stone-900 flex flex-col items-center justify-center">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-screen bg-stone-950/90 flex items-center justify-center z-40">
          <div className="border-4 border-stone-200 border-t-blue-500 size-12 animate-spin rounded-full"></div>
        </div>
      )}
      {/*
        Main chat UI container:
        - `flex-1`: Takes up available vertical space within the parent flex container.
        - `min-h-0`: Crucial for flex children that need to scroll internally. Prevents content from blowing out the flex item's size.
        - `overflow-hidden`: Ensures that its children (header, messages, input) don't cause this container to overflow.
          The message area *inside* this will have `overflow-y-auto`.
      */}
      <div className="w-full flex-1 min-h-0 rounded-xl bg-stone-800 text-white shadow-xl flex flex-col items-start justify-start overflow-hidden">
        {/* Header */}
        <div className="w-full h-20 border-b border-stone-400 shadow-md flex items-center justify-between px-4 shrink-0">
          {" "}
          {/* shrink-0 to prevent header from shrinking */}
          <h1 className="text-xl font-semibold">CompanionAI (v1.7)</h1>
          <button
            onClick={startNewConversation}
            className={`px-4 py-2 cursor-pointer shadow-xl rounded-lg text-sm disabled:cursor-not-allowed ${
              messages.length === 0
                ? "bg-blue-700 text-white hover:bg-blue-600"
                : "bg-stone-700 text-white hover:bg-stone-600"
            } `}
            disabled={isLoading}
          >
            New Chat
          </button>
        </div>

        {/* Message Display Area */}
        <div
          className={`flex-1 p-2 w-full space-y-4 ${
            messages.length === 0 ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {messages.length === 0 && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-center px-2">
                <Markdown>{tip}</Markdown>
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow font-semibold ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white border border-black"
                    : "bg-stone-700 text-white border border-black"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {msg.content
                    .trim()
                    .replaceAll("\n", "")
                    .replaceAll("  ", " ")}
                </p>

                {msg.attachment && (
                  <iframe
                    src={msg.attachment}
                    title="player"
                    className="mt-2 w-full aspect-square rounded-2xl"
                  />
                )}

                {/* Timestamp display (optional) */}
                {/* <p className="text-xs mt-1 opacity-70 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p> */}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {conversationId && (
          <div className="w-full h-auto min-h-[3.5rem] border-t border-stone-400 shadow-md p-2 shrink-0">
            {" "}
            {/* shrink-0 to prevent input area from shrinking */}
            <form
              className="w-full h-full flex items-center justify-center gap-2"
              onSubmit={handleSendMessage}
            >
              <input
                ref={inputRef} // Assign ref here
                type="text"
                name="message"
                id="message"
                autoComplete="off"
                placeholder={
                  isLoading
                    ? "AI is thinking..."
                    : messages.length === 0
                    ? "Your name and gender..."
                    : "Type a message..."
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading || !conversationId}
                className="flex-1 bg-stone-700 border border-stone-400 p-2 rounded-xl outline-none disabled:cursor-not-allowed focus-within:ring-1 ring-blue-500 disabled:opacity-50 placeholder:text-blue-300"
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim() || !conversationId}
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}
      </div>
      {/* Conversation ID display remains a sibling, fitting due to flex-1 on the chat UI container */}
      <p className="text-xs text-stone-600 mt-2 shrink-0">
        {" "}
        {/* shrink-0 to prevent this from shrinking if space is tight */}
        Conversation ID: {conversationId || "Initializing..."}
      </p>
    </div>
  );
};

export default App;
