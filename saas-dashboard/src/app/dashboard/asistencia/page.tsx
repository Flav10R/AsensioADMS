import TimeCard from '@/components/TimeCard'

export default function AsistenciaPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Liquidación Temporal</h1>
                <p className="text-slate-400 mt-2">Revisa y audita las marcaciones, incidentes y horas extras del staff.</p>
            </div>

            <div className="pt-4">
                <TimeCard />
            </div>
        </div>
    )
}
