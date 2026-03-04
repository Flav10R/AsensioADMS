import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Sidebar />
            <div className="md:pl-64 flex flex-col min-h-screen relative">
                <Topbar />

                {/* Main Content Area */}
                <main className="flex-1">
                    <div className="py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
