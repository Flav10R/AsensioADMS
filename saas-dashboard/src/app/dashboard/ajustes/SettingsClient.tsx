'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CompanyData = {
    id: string
    name: string
    address?: string
    city?: string
    country?: string
    tax_id?: string
}

export default function SettingsClient({ initialData }: { initialData: CompanyData | null }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || '',
        tax_id: initialData?.tax_id || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setSuccess(false)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!initialData?.id || !formData.name.trim()) return

        setLoading(true)
        setSuccess(false)
        const supabase = createClient()

        const { error } = await supabase
            .from('companies')
            .update({
                name: formData.name,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                tax_id: formData.tax_id
            })
            .eq('id', initialData.id)

        if (!error) {
            setSuccess(true)
            // Recargar la página para que el Header también actualice el nombre
            window.location.reload()
        } else {
            console.error('Error al guardar ajustes', error)
            alert("Hubo un error al guardar los ajustes. Comprueba si los campos existen en la base de datos.")
        }
        setLoading(false)
    }

    if (!initialData) {
        return <div className="text-slate-400">No hay información de empresa vinculada a tu perfil.</div>
    }

    return (
        <form onSubmit={handleSave} className="space-y-6">

            <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-300">Razón Social</Label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-800 text-white w-full"
                    placeholder="Ej: Asensio Sistemas S.A."
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="tax_id" className="text-slate-300">CUIT / RUT / Identificación Fiscal</Label>
                <Input
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-800 text-white w-full"
                    placeholder="Ej: 30-12345678-9"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address" className="text-slate-300">Dirección Mátriz</Label>
                <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-800 text-white w-full"
                    placeholder="Calle 123, Oficina 4"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="city" className="text-slate-300">Ciudad</Label>
                    <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="bg-slate-950 border-slate-800 text-white w-full"
                        placeholder="Capital Federal"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="country" className="text-slate-300">País</Label>
                    <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="bg-slate-950 border-slate-800 text-white w-full"
                        placeholder="Argentina"
                    />
                </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                {success && <span className="text-emerald-500 text-sm">¡Guardado con éxito! Recargando...</span>}
            </div>

        </form>
    )
}
