import { createClient } from '@/utils/supabase/server'
import SettingsClient from './SettingsClient'

export const metadata = {
    title: 'Ajustes | Asensio ADMS',
    description: 'Configuración general de la Empresa',
}

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener company_id del usuario auth
    let companyData = null

    if (user) {
        const { data: userData } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (userData?.company_id) {
            const { data } = await supabase
                .from('companies')
                .select('*')
                .eq('id', userData.company_id)
                .single()

            companyData = data
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Ajustes de la Empresa</h1>
                <p className="text-slate-400 mt-2">
                    Administra la información comercial para los reportes y facturación.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-sm max-w-2xl">
                <SettingsClient initialData={companyData} />
            </div>
        </div>
    )
}
