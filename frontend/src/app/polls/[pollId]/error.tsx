'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto pt-16 p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Something went wrong!
      </h2>
      <button
        onClick={() => reset()}
        className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}