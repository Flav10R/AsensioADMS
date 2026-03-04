'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
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
    { name: 'Tarjeta Reloj', href: '/dashboard/asistencia', icon: CalendarDays },
    { name: 'Personal', href: '/dashboard/empleados', icon: Users },
    { name: 'Departamentos', href: '/dashboard/departamentos', icon: Building2 },
    { name: 'Horarios de Trabajo', href: '/dashboard/horarios', icon: Clock },
    { name: 'Incidentes', href: '/dashboard/incidentes', icon: AlertTriangle },
    { name: 'Registradores', href: '/dashboard/equipos', icon: HardDrive },
    { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const [companyName, setCompanyName] = useState('Mi Empresa')
    const [userName, setUserName] = useState('Admin')

    useEffect(() => {
        const fetchCompany = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Obtener el nombre del Admin desde sus metadatos o fragmento del email
                setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin')

                // En un diseño robusto el company_id estaría en el JWT, 
                // aquí consultamos tabla profiles (perfil del admin)
                const { data: userData } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
                if (userData?.company_id) {
                    const { data: companyData } = await supabase.from('companies').select('name').eq('id', userData.company_id).single()
                    if (companyData) setCompanyName(companyData.name)
                }
            }
        }
        fetchCompany()
    }, [])

    return (
        <div className="flex flex-col w-64 bg-slate-950 border-r border-slate-800 h-screen fixed top-0 left-0 hidden md:flex z-50">
            {/* Brand & User Profile */}
            <div className="flex flex-col shrink-0 px-6 py-4 justify-center border-b border-slate-800 min-h-20">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 line-clamp-1">
                    Operador: {userName}
                </span>
                <span className="text-xl font-extrabold tracking-tight text-white line-clamp-1" title={companyName}>
                    {companyName}
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

            {/* Version Indicator */}
            <div className="flex-shrink-0 p-4 border-t border-slate-800">
                <p className="text-center text-xs font-mono text-slate-600">
                    ADMS v1.0.1
                </p>
            </div>
        </div>
    )
}
