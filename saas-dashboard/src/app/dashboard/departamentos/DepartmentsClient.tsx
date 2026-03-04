'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'
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

type Department = { id: string; name: string; company_id: string }

export default function DepartmentsClient({ initialData }: { initialData: Department[] }) {
    const [departments, setDepartments] = useState<Department[]>(initialData)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [editId, setEditId] = useState<string | null>(null)

    const supabase = createClient()

    const handleOpenDialog = (dept?: Department) => {
        if (dept) {
            setEditId(dept.id)
            setName(dept.name)
        } else {
            setEditId(null)
            setName('')
        }
        setIsOpen(true)
    }

    const handleSave = async () => {
        if (!name.trim()) return
        setLoading(true)

        // Solo como medida preventiva local, obetenemos datos de sesión
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return; }

        try {
            if (editId) {
                // Update
                const { error } = await supabase
                    .from('departments')
                    .update({ name })
                    .eq('id', editId)

                if (!error) {
                    setDepartments(prev => prev.map(d => d.id === editId ? { ...d, name } : d))
                }
            } else {
                // Insert
                // Buscamos company_id del usuario actual en la tabla profiles
                const { data: userData, error: userError } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', user.id)
                    .single()

                if (userError || !userData?.company_id) {
                    console.error("Error al obtener company_id:", userError)
                    alert("Tu usuario no está enlazado a ninguna empresa (company_id). No puedes crear departamentos.")
                    setLoading(false)
                    return
                }

                const companyId = userData.company_id

                const { data: newDepts, error } = await supabase
                    .from('departments')
                    .insert({ name, company_id: companyId })
                    .select()

                if (!error && newDepts) {
                    setDepartments([newDepts[0], ...departments])
                } else if (error) {
                    console.error("Error insertando departamento:", error)
                    alert("Error al guardar: " + error.message)
                }
            }
        } catch (e: any) {
            console.error(e)
            alert("Excepción: " + e.message)
        } finally {
            setLoading(false)
            setIsOpen(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar departamento? Los usuarios asignados quedarán sin departamento.')) return

        const { error } = await supabase.from('departments').delete().eq('id', id)
        if (!error) {
            setDepartments(prev => prev.filter(d => d.id !== id))
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Listado</h2>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Departamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
                        <DialogHeader>
                            <DialogTitle>{editId ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-slate-300">
                                    Nombre
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="col-span-3 bg-slate-950 border-slate-800 text-white"
                                    placeholder="Ej: Ingeniería"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                {loading ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-slate-900/50">
                            <TableHead className="text-slate-400">Nombre del Departamento</TableHead>
                            <TableHead className="text-right text-slate-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.length === 0 ? (
                            <TableRow className="border-slate-800">
                                <TableCell colSpan={2} className="h-24 text-center text-slate-500">
                                    No hay departamentos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            departments.map((dept) => (
                                <TableRow key={dept.id} className="border-slate-800 hover:bg-slate-900/50">
                                    <TableCell className="font-medium text-slate-200">{dept.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(dept)} className="text-slate-400 hover:text-blue-400">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="text-slate-400 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
