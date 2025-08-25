import React, { useState } from "react";
import LabelledInput from "../components/LabelledInput";
import RadioGroup from "../components/RadioGroup";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_APP_URL;

const Landing = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    age: "",
    gender: "",
    orientation: "",
  });

  const isDataComplete = () => {
    return (
      data.name.trim() !== "" &&
      data.age.trim() !== "" &&
      data.gender.trim() !== "" &&
      data.orientation.trim() !== ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDataComplete()) {
      alert("Please fill in all the details.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/new`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      const result = await response.json();

      localStorage.setItem(
        "chatConversationId",
        result.payload.conversation_id
      );
      navigate("/chat", { state: { userData: result } });
    } catch (err) {
      console.error("Failed to start new conversation:", err);
      localStorage.removeItem("chatConversationId");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-stone-800 text-white p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/bg.jpg)" }}
    >
      <h2 className="mb-4 max-w-64 md:max-w-full text-center md:my-4 md:text-xl">
        I just need a few more details before we can proceed
      </h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-stone-700 rounded-xl shadow-lg shadow-black/20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/form-bg.jpg)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-8 rounded-xl bg-stone-900/90 backdrop-blur-xs">
          <h3 className="md:col-span-2 text-xl font-bold border-b border-white pb-2 mb-2">
            Personal Info
          </h3>
          {/* Name */}
          <LabelledInput
            type="text"
            identifier="name"
            content="Please tell me your name"
            placeholder="Eg: John Doe"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
          {/* Age */}
          <LabelledInput
            type="number"
            identifier="age"
            content="Please tell me your age"
            placeholder="Eg: 27"
            value={data.age}
            onChange={(e) => setData({ ...data, age: e.target.value })}
          />

          {/* Gender */}
          <RadioGroup
            name="gender"
            legend="Please select your gender"
            accentColor="accent-blue-600"
            options={[
              { label: "👨 Male", value: "male" },
              {
                label: "👩 Female",
                value: "female",
                accentColor: "accent-pink-600",
              },
            ]}
            value={data.gender}
            onChange={(e) => setData({ ...data, gender: e.target.value })}
          />

          {/* Orientation */}
          <RadioGroup
            name="orientation"
            legend="Please select your orientation"
            accentColor="accent-green-600"
            options={[
              {
                label: "🎯 Straight",
                value: "straight",
                accentColor: "accent-rose-500",
              },
              {
                label: "💜 Bisexual",
                value: "bisexual",
                accentColor: "accent-rose-500",
              },
              {
                label: "👭 Lesbian",
                value: "lesbian",
                accentColor: "accent-rose-500",
              },
              {
                label: "👬 Gay",
                value: "gay",
                accentColor: "accent-rose-500",
              },
            ]}
            value={data.orientation}
            onChange={(e) => setData({ ...data, orientation: e.target.value })}
          />
          <button
            type="submit"
            className="mt-2 cursor-pointer md:col-span-2 bg-rose-800 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-300 hover:bg-pink-700 focus:ring-2 focus:ring-white"
          >
            Let's go!
          </button>
        </div>
      </form>
    </div>
  );
};

export default Landing;
