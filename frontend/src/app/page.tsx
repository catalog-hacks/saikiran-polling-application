import { NextPage } from "next";
import Link from "next/link";

interface Props {}

const Page: NextPage<Props> = ({}) => {
    return (
        <div className="relative min-h-[calc(100vh_-_80px)] flex items-center justify-center bg-gradient-to-r from-purple-800 to-indigo-900">
            {/* Glassy background container */}
            <div className="relative z-10 rounded-lg p-8  max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold mb-4 text-white">
                    The Most Secure Polling Application
                </h1>
                <p className="text-lg mb-6 text-white">
                    Create, share, and participate in polls with confidence.
                    Your privacy and security are our top priorities.
                </p>
                <div className="flex justify-center space-x-4">
                    <Link
                        href="/create"
                        className="px-6 py-3 flex items-center bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
                    >
                        Create Poll
                    </Link>
                    <Link
                        href="/mypolls"
                        className="px-6 py-3 flex items-center bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition duration-300 shadow-md"
                    >
                        View Polls
                    </Link>
                </div>
            </div>

            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-indigo-900 to-black opacity-70 z-0"></div>
        </div>
    );
};

export default Page;
