"use client";

import { useState } from "react";
import { usePasskeyAuth } from "../hooks/usePasskeyAuth";

export function RegisterForm() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const { register, error } = usePasskeyAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await register(email, name);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto mt-10 p-6 bg-white border border-gray-100 shadow-md rounded-lg"
        >
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Register
            </h2>

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
            />

            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
            />

            <button
                type="submit"
                className="w-full bg-blue-800 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            >
                Register
            </button>

            {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </form>
    );
}
