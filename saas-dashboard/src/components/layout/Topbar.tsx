'use client'

import { LogOut, Bell, Menu, X, LayoutDashboard, CalendarDays, Users, Building2, Clock, AlertTriangle, HardDrive, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

export default function Topbar() {
    const router = useRouter()
    const pathname = usePathname()
    const [email, setEmail] = useState<string>('')
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setEmail(user.email || '')
        })
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <>
            <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 shadow-sm md:justify-end">

                {/* Botón menú móvil (Izquierda) */}
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    className="-m-2.5 p-2.5 text-slate-400 md:hidden hover:text-white"
                >
                    <span className="sr-only">Abrir Menú</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Titulo en móvil */}
                <div className="text-white font-bold md:hidden">Asensio ADMS</div>

                <div className="flex justify-end gap-x-4">
                    <div className="flex items-center gap-x-4 lg:gap-x-6">

                        {/* Perfil (Solo correo o "Salir") */}
                        <div className="flex items-center gap-x-4">
                            <span className="hidden lg:flex lg:items-center">
                                <span className="text-sm font-semibold leading-6 text-slate-300" aria-hidden="true">
                                    {email || 'Administrador'}
                                </span>
                            </span>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-slate-400 hover:text-white hover:bg-red-500/20"
                            >
                                <LogOut className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:block">Salir</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fondo oscuro móvil */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)}></div>
            )}

            {/* Panel Lateral Móvil */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800">
                    <span className="text-xl font-extrabold tracking-tight text-white">
                        Asensio <span className="text-blue-500">ADMS</span>
                    </span>
                    <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

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
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors ${isActive
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
        </>
    )
}
