import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, AlertTriangle, Cpu } from 'lucide-react'

export default async function DashboardOverview() {
    const supabase = await createClient()

    // Here we would fetch actual data. For now, visual mockups.
    const metrics = [
        { title: 'Personal Activo', value: '45', icon: Users, desc: '+2 esta semana' },
        { title: 'Presentes Hoy', value: '42', icon: Clock, desc: '3 Ausentes' },
        { title: 'Llegadas Tarde', value: '5', icon: AlertTriangle, desc: '+15 min prom.' },
        { title: 'Relojes Online', value: '2/2', icon: Cpu, desc: 'Todos funcionales' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Resumen Diario</h1>
                <p className="text-slate-400 mt-2">Visión general del estado de presentismo y hardware en tu organización.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.title} className="bg-slate-900 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">
                                {metric.title}
                            </CardTitle>
                            <metric.icon className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{metric.value}</div>
                            <p className="text-xs text-slate-500 mt-1">{metric.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Space */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Fichajes Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-lg">
                            <p className="text-slate-500 text-sm">Flujo de datos en tiempo real (Próximamente)</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Estado del Hardware</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                    <span className="text-sm font-medium text-slate-300">Entrada Principal</span>
                                </div>
                                <span className="text-xs text-slate-500">Sincronizado hace 2m</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                    <span className="text-sm font-medium text-slate-300">Reloj Depósito</span>
                                </div>
                                <span className="text-xs text-slate-500">Sincronizado hace 5m</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
