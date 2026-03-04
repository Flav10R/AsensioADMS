import { createClient } from '@/utils/supabase/server'
import EmployeesClient from './EmployeesClient'

export const metadata = {
    title: 'Personal | Asensio ADMS',
    description: 'Gestión del Personal',
}

export default async function EmpleadosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    let companyId = null
    let employees = []
    let departments = []
    let schedules = []
    let devices = []

    if (user) {
        // Encontrar la empresa del admin actual
        const { data: userData } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        companyId = userData?.company_id

        if (companyId) {
            // Cargar empleados con sus FK (departmentos, horarios) y relación Muchos a Muchos (user_devices)
            const { data: empData } = await supabase
                .from('users')
                .select(`
                    id, 
                    pin, 
                    internal_id,
                    name, 
                    photo_url, 
                    department_id, 
                    schedule_id,
                    departments(name),
                    schedules(name),
                    user_devices(device_sn)
                `)
                .order('name', { ascending: true })

            if (empData) employees = empData

            // Cargar catálogos para los combos
            const { data: deptData } = await supabase.from('departments').select('id, name').order('name')
            if (deptData) departments = deptData

            const { data: schedData } = await supabase.from('schedules').select('id, name').order('name')
            if (schedData) schedules = schedData

            const { data: devData } = await supabase.from('devices').select('serial_number, alias').order('alias')
            if (devData) {
                // Adaptalo para el componente
                devices = devData.map(d => ({ id: d.serial_number, alias: d.alias, sn: d.serial_number }))
            }
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Personal</h1>
                <p className="text-slate-400 mt-2">
                    Administra los empleados, su horario y a qué registradores biométricos tienen acceso.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-sm">
                <EmployeesClient
                    initialEmployees={employees}
                    departments={departments}
                    schedules={schedules}
                    devices={devices}
                    companyId={companyId}
                />
            </div>
        </div>
    )
}
