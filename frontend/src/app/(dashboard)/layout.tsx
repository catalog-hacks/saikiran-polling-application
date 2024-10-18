import SideBarNav from "@/components/dashboard/SideBarNav";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const links = [
        { name: "Create", path: "/create" },
        { name: "My Polls", path: "/mypolls" },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh_-_80px)] flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 text-white flex flex-col fixed min-h-[calc(100vh_-_80px)]">
                    <div className="p-4 text-2xl font-bold border-b border-gray-700">
                        My Dashboard
                    </div>

                    <SideBarNav links={links} />
                </aside>

                {/* Main content */}
                <div className="flex-1 bg-gray-100 p-6 ml-64">{children}</div>
            </div>
        </ProtectedRoute>
    );
}
