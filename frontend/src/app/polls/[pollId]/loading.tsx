export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto pt-16 p-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-100 h-64 rounded-lg"></div>
                    <div className="bg-gray-100 h-64 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}
