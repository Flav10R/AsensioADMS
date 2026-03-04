'use client'

import { LogOut, Bell, Menu } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function Topbar() {
    const router = useRouter()
    const [email, setEmail] = useState<string>('')

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
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">

            {/* Botón menú móvil */}
            <button type="button" className="-m-2.5 p-2.5 text-slate-400 md:hidden hover:text-white">
                <span className="sr-only">Abrir Menú</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separador móvil */}
            <div className="h-6 w-px bg-slate-800 md:hidden" aria-hidden="true" />

            <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex items-center gap-x-4 lg:gap-x-6">

                    {/* Notificaciones */}
                    <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-white">
                        <span className="sr-only">Ver notificaciones</span>
                        <Bell className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Separador Desktop */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" aria-hidden="true" />

                    {/* Perfil */}
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
                            <LogOut className="h-4 w-4 mr-2" />
                            Salir
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
