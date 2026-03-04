import { createClient } from '@/utils/supabase/server'
import DepartmentsClient from './DepartmentsClient'

export const metadata = {
    title: 'Departamentos | Asensio ADMS',
    description: 'Gestión de Departamentos',
}

export default async function DepartamentosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener departments filtrando por la empresa actual del usuario admin
    // En nuestro esquema simple, si es "service_role" o admin, obtenemos los de su company_id. 
    // O como simplificación, podemos listar todos vinculados al usuario logueado.
    // Asumimos que los permisos RLS en departments se ocupan de filtrar automáticamente:
    const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching departments:', error)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Departamentos</h1>
                <p className="text-slate-400 mt-2">
                    Administra las áreas organizativas y sucursales de tu empresa.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-sm">
                <DepartmentsClient initialData={departments || []} />
            </div>
        </div>
    )
}
