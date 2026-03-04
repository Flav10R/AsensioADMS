'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Edit2, Trash2, Camera, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'


type Catalog = { id: string; name?: string; sn?: string; alias?: string }
type Employee = {
    id?: string
    pin: string
    internal_id?: string | null
    name: string
    photo_url: string | null
    phone?: string | null
    email?: string | null
    birth_date?: string | null
    department_id: string | null
    schedule_id: string | null
    departments?: { name: string } | null
    schedules?: { name: string } | null
    user_devices?: { device_id: string }[] | null
}

export default function EmployeesClient({
    initialEmployees,
    departments,
    schedules,
    devices,
    companyId
}: {
    initialEmployees: Employee[];
    departments: Catalog[];
    schedules: Catalog[];
    devices: Catalog[];
    companyId: string | null;
}) {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [editId, setEditId] = useState<string | null>(null)
    const [pin, setPin] = useState('')
    const [internalId, setInternalId] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [scheduleId, setScheduleId] = useState('')
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    const handleOpenDialog = (emp?: Employee) => {
        if (emp) {
            setEditId(emp.id!)
            setPin(emp.pin || '')
            setInternalId(emp.internal_id || '')
            setName(emp.name || '')
            setPhone(emp.phone || '')
            setEmail(emp.email || '')
            setBirthDate(emp.birth_date || '')
            setDepartmentId(emp.department_id || '')
            setScheduleId(emp.schedule_id || '')
            setPhotoUrl(emp.photo_url || null)

            // Map selected devices
            const userDeviceIds = emp.user_devices?.map((ud: any) => ud.device_sn) || []
            setSelectedDeviceIds(userDeviceIds)
        } else {
            setEditId(null)
            setPin('')
            setInternalId('')
            setName('')
            setPhone('')
            setEmail('')
            setBirthDate('')
            setDepartmentId('')
            setScheduleId('')
            setPhotoUrl(null)
            // Por defecto en nuevos empleados seleccionamos todos los relojes disponibles en la bd
            setSelectedDeviceIds(devices.map(d => d.id))
        }
        setIsOpen(true)
    }

    const toggleDevice = (deviceId: string) => {
        setSelectedDeviceIds(prev =>
            prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
        )
    }

    const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) return
            if (!companyId) throw new Error("No hay empresa asignada")

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${companyId}/${Math.random().toString(36).substring(2)}.${fileExt}`

            // Subimos al bucket "avatars"
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Obtenemos la URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            setPhotoUrl(publicUrl)
        } catch (error: any) {
            console.error(error)
            alert('Error al subir imagen. Detalle: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim() || !companyId) return
        setLoading(true)

        try {
            // El PIN numérico es obligatorio en BD por compatibilidad con ZKTeco 
            // Si no se proporcionó uno desde UI, generamos uno temporal basado en timestamp
            const finalPin = pin.trim() ? pin.trim() : Math.floor(Date.now() / 1000).toString()

            const employeeData = {
                pin: finalPin,
                internal_id: internalId.trim() || null,
                name,
                phone: phone.trim() || null,
                email: email.trim() || null,
                birth_date: birthDate || null,
                company_id: companyId,
                department_id: departmentId || null,
                schedule_id: scheduleId || null,
                photo_url: photoUrl
            }

            let insertedUserPin = pin.trim()

            if (editId) {
                // Actualizar Empleado (users)
                const { error } = await supabase.from('users').update(employeeData).eq('pin', editId) // ZKTeco usa PIN como pk pero lo simulabas como id
                if (error) throw error
                insertedUserPin = editId
            } else {
                // Insertar Empleado
                const { data: newEmp, error } = await supabase
                    .from('users')
                    .insert([employeeData])
                    .select('pin')
                    .single()

                if (error) {
                    if (error.code === '23505') throw new Error("El Legajo o ID de Usuario ingresado ya está registrado en la base de datos.")
                    throw error
                }
                if (newEmp) insertedUserPin = newEmp.pin
            }

            // Gestionar Relación NxM (Usuario <-> Reloj / user_devices)
            if (insertedUserPin) {
                // 1. Borrar asociaciones anteriores para asegurar integridad (ahora en base a user_pin)
                await supabase.from('user_devices').delete().eq('user_pin', insertedUserPin)

                // 2. Insertar nuevas selecciones si existen
                if (selectedDeviceIds.length > 0) {
                    const devicesToInsert = selectedDeviceIds.map(deviceId => ({
                        company_id: companyId,
                        user_pin: insertedUserPin,
                        device_sn: deviceId
                    }))

                    const { error: devError } = await supabase.from('user_devices').insert(devicesToInsert)
                    if (devError) console.error("Error al vincular equipos:", devError)
                }
            }

            // Refrescar al finalizar el modal
            window.location.reload();
            setIsOpen(false)
        } catch (e: any) {
            console.error(e)
            alert('Error al guardar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (pinodelete: string) => {
        if (!confirm('¿Eliminar empleado? Esto borrará sus fichajes.')) return
        const { error } = await supabase.from('users').delete().eq('pin', pinodelete)
        if (!error) {
            // Recargar para limpiar relacionales
            window.location.reload()
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Empleados</h2>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Personal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white">
                        <DialogHeader>
                            <DialogTitle>{editId ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">

                            {/* Fotografía de Perfil */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group w-24 h-24 rounded-md overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle2 className="w-12 h-12 text-slate-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading} />
                                    </label>
                                </div>
                                <span className="text-xs text-slate-400">{uploading ? 'Subiendo...' : 'Click en foto para subir localmente'}</span>
                            </div>

                            {/* Datos Básicos */}
                            <div className="space-y-4 border border-slate-800 p-4 rounded-md bg-slate-950/50">
                                <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Datos Principales</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="internalId" className="text-slate-300">N° Legajo (Sistema)</Label>
                                        <Input id="internalId" value={internalId} onChange={(e) => setInternalId(e.target.value)} className="bg-slate-950 border-slate-800 text-white" placeholder="Ej: EMP-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin" className="text-slate-300">ID Usuario (ID en reloj)</Label>
                                        <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value)} className="bg-slate-950 border-slate-800 text-white" placeholder="ID numérico ZKTeco" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-300">Nombres y Apellidos *</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border-slate-800 text-white" placeholder="Nombre completo" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-300">Celular</Label>
                                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-950 border-slate-800 text-white" placeholder="+54 9 11 ..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-950 border-slate-800 text-white" placeholder="correo@empresa.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="text-slate-300">Fecha de Nacimiento</Label>
                                    <Input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="bg-slate-950 border-slate-800 text-white [color-scheme:dark]" />
                                </div>
                            </div>

                            {/* Organización Laboral */}
                            <div className="space-y-4 border border-slate-800 p-4 rounded-md bg-slate-950/50">
                                <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Organización</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dept" className="text-slate-300">Dpto. o Sector</Label>
                                        <select
                                            id="dept"
                                            value={departmentId}
                                            onChange={(e) => setDepartmentId(e.target.value)}
                                            className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                                        >
                                            <option value="">(Sin asignar)</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="schedule" className="text-slate-300">Horario Normal</Label>
                                        <select
                                            id="schedule"
                                            value={scheduleId}
                                            onChange={(e) => setScheduleId(e.target.value)}
                                            className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                                        >
                                            <option value="">(Sin horario fijo)</option>
                                            {schedules.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Asignación a Dispositivos */}
                            <div className="space-y-4 border border-slate-800 p-4 rounded-md bg-slate-950/50">
                                <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Permisos en Registradores Físicos</h3>
                                <p className="text-xs text-slate-500 mb-2">Selecciona en qué relojes este empleado puede fichar y transferir su huella o rostro.</p>

                                <div className="flex flex-col gap-3 mt-2 max-h-32 overflow-y-auto">
                                    {devices.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">No hay registradores dados de alta en la Empresa.</p>
                                    ) : (
                                        devices.map(device => (
                                            <div key={device.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`dev-${device.id}`}
                                                    checked={selectedDeviceIds.includes(device.id)}
                                                    onChange={() => toggleDevice(device.id)}
                                                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-600 bg-slate-950"
                                                />
                                                <label
                                                    htmlFor={`dev-${device.id}`}
                                                    className="text-sm font-medium leading-none text-slate-300 cursor-pointer"
                                                >
                                                    {device.alias || device.sn}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                        <DialogFooter className="mt-4 pt-2 border-t border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-slate-800 text-slate-300 hover:bg-slate-800">Cancelar</Button>
                            <Button type="submit" disabled={loading || uploading} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                {loading ? 'Sincronizando...' : 'Guardar y Sincronizar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-slate-900/50">
                            <TableHead className="w-16"></TableHead>
                            <TableHead className="text-slate-400 font-mono">Legajo</TableHead>
                            <TableHead className="text-slate-400 font-mono text-xs">Reloj Usr ID</TableHead>
                            <TableHead className="text-slate-400">Personal</TableHead>
                            <TableHead className="text-slate-400">Dpto. / Horario</TableHead>
                            <TableHead className="text-slate-400">Estado (Novedad Diaria)</TableHead>
                            <TableHead className="text-right text-slate-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow className="border-slate-800">
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">No hay personal registrado en planta.</TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.pin} className="border-slate-800 hover:bg-slate-900/50">
                                    <TableCell>
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                                            {emp.photo_url ? <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" /> : <UserCircle2 className="w-5 h-5 text-slate-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-200">{emp.internal_id || '-'}</TableCell>
                                    <TableCell className="font-mono text-slate-500 text-xs">{emp.pin}</TableCell>
                                    <TableCell className="font-medium text-slate-200">{emp.name}</TableCell>
                                    <TableCell className="text-slate-400 text-sm">
                                        <div className="flex flex-col">
                                            <span>{emp.departments?.name || '-'}</span>
                                            <span className="text-xs text-slate-500">{emp.schedules?.name || 'Libre'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <select className="bg-slate-900 border border-slate-700 text-xs rounded p-1.5 text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                            <option>Trabajando (Check-In)</option>
                                            <option>Finalizó (Check-Out)</option>
                                            <option>Ausente / Faltó</option>
                                            <option>Licencia / Vacaciones</option>
                                        </select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(emp)} className="text-slate-400 hover:text-blue-400 px-1"><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.pin)} className="text-slate-400 hover:text-red-400 px-1"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
