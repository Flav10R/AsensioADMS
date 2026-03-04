'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Building2,
    Clock,
    AlertTriangle,
    Settings,
    CalendarDays,
    HardDrive
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Liquidación Temporal', href: '/dashboard/asistencia', icon: CalendarDays },
    { name: 'Staff', href: '/dashboard/empleados', icon: Users },
    { name: 'Departamentos', href: '/dashboard/departamentos', icon: Building2 },
    { name: 'Horarios de Trabajo', href: '/dashboard/horarios', icon: Clock },
    { name: 'Incidentes', href: '/dashboard/incidentes', icon: AlertTriangle },
    { name: 'Equipos ZKTeco', href: '/dashboard/equipos', icon: HardDrive },
    { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col w-64 bg-slate-950 border-r border-slate-800 h-screen fixed top-0 left-0 hidden md:flex">
            {/* Brand */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
                <span className="text-xl font-extrabold tracking-tight text-white">
                    Asensio <span className="text-blue-500">ADMS</span>
                </span>
            </div>

            {/* Nav Links */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-6">
                    <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Principal
                    </div>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-blue-600/10 text-blue-500'
                                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'
                                        }`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
