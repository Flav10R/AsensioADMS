"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, Clock, AlertCircle } from 'lucide-react'

// Dummy data for visual mockup
const mockPunches = [
    { date: "01 Mar", inAM: "08:00", outAM: "13:05", inPM: "14:00", outPM: "18:05", total: "9.1", extra: "0.1", late: 0, status: "ok", note: "" },
    { date: "02 Mar", inAM: "08:15", outAM: "13:00", inPM: "14:00", outPM: "18:00", total: "8.75", extra: "-", late: 15, status: "late", note: "" },
    { date: "03 Mar", inAM: "--:--", outAM: "--:--", inPM: "--:--", outPM: "--:--", total: "-", extra: "-", late: 0, status: "absent", note: "Enfermo" },
    { date: "04 Mar", inAM: "08:05", outAM: "12:00", inPM: "--:--", outPM: "--:--", total: "4", extra: "-", late: 5, status: "incomplete", note: "Retiro" },
    { date: "05 Mar", inAM: "08:00", outAM: "13:00", inPM: "14:00", outPM: "18:30", total: "9.5", extra: "0.5", late: 0, status: "ok", note: "" },
]

export default function TimeCard() {
    const [period, setPeriod] = useState("quincenal");

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6 text-slate-800">

            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
                <Tabs defaultValue="quincenal" onValueChange={setPeriod} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="semanal">Semanal</TabsTrigger>
                        <TabsTrigger value="quincenal">Quincenal</TabsTrigger>
                        <TabsTrigger value="mensual">Mensual</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* The Vintage Card */}
            <Card className="bg-[#fdfaf3] border-2 border-[#e6dfcc] shadow-xl overflow-hidden relative">
                {/* Subtle vintage texture overlay could go here */}

                <CardHeader className="border-b-2 border-dashed border-[#d5ccb5] bg-[#f9f5ea] pb-6 pt-8 px-8 flex flex-row items-center gap-6">
                    {/* Employee Photo Placeholder */}
                    <div className="w-24 h-32 bg-slate-200 border-4 border-white shadow-md rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/flavio.jpg" alt="Flavio Rodriguez" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flavio'; }} />
                    </div>

                    <div className="space-y-3 flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold font-serif text-slate-800 tracking-tight uppercase">Flavio Rodriguez</h2>
                                <div className="text-slate-600 font-medium text-sm mt-1 uppercase tracking-wide">
                                    Constructora Asensio S.A.
                                </div>
                                <div className="text-slate-500 font-mono mt-3 text-sm flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-slate-300 text-slate-600">ID: 21984269</Badge>
                                    <Badge variant="outline" className="border-slate-300 text-slate-600">Dpto: Ingeniería</Badge>
                                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">🕒 Horario: 08:00 - 18:00</Badge>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs uppercase tracking-widest text-[#a69c82] font-semibold">Período</div>
                                <div className="text-lg font-mono font-bold text-slate-700">MAR 2026</div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <Table className="font-mono text-sm min-w-[800px]">
                        <TableHeader className="bg-[#f0eadd]">
                            <TableRow className="border-b-2 border-[#d5ccb5]">
                                <TableHead className="w-[80px] font-bold text-slate-700 uppercase py-3 px-4">Día</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase">Ent. AM</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase border-r-2 border-dashed border-[#e6dfcc]">Sal. AM</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase">Ent. PM</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase border-r-2 border-dashed border-[#e6dfcc]">Sal. PM</TableHead>
                                <TableHead className="w-[120px] text-left font-bold text-slate-700 uppercase border-r-2 border-dashed border-[#e6dfcc]">Incidente</TableHead>
                                <TableHead className="text-center font-bold text-red-600 uppercase">Tard.</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase border-l-2 border-[#e6dfcc]">Total Hs</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 uppercase">Hs Ext.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPunches.map((punch, idx) => (
                                <TableRow key={idx} className={`border-b border-[#e6dfcc] hover:bg-[#f6f1e3] transition-colors ${punch.status === 'absent' ? 'bg-[#fcf5f5]' : ''}`}>
                                    <TableCell className="font-semibold text-slate-600 py-3 px-4">{punch.date}</TableCell>

                                    {punch.status === 'absent' ? (
                                        <TableCell colSpan={4} className="text-center italic text-slate-400 border-r-2 border-dashed border-[#e6dfcc]">
                                            Ausente
                                        </TableCell>
                                    ) : (
                                        <>
                                            {/* Fichajes */}
                                            <TableCell className={`text-center ${punch.inAM > "08:00" ? 'text-red-600' : 'text-slate-800'}`}>
                                                {punch.inAM}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-800 border-r-2 border-dashed border-[#e6dfcc] bg-white/30">
                                                {punch.outAM}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-800">
                                                {punch.inPM}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-800 border-r-2 border-dashed border-[#e6dfcc] bg-white/30">
                                                {punch.outPM}
                                            </TableCell>
                                        </>
                                    )}

                                    {/* Novedad */}
                                    <TableCell className="w-[120px] max-w-[120px] truncate text-left font-sans text-xs font-semibold text-slate-600 border-r-2 border-dashed border-[#e6dfcc]">
                                        {punch.note && (
                                            <span className={`px-2 py-1 rounded inline-flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap w-24 ${punch.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-200'}`}>
                                                {punch.status === 'absent' && <AlertCircle className="w-3 h-3 shrink-0" />}
                                                {punch.note}
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Tardanza */}
                                    <TableCell className={`text-center ${punch.late > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                        {punch.late > 0 ? `${punch.late}m` : '-'}
                                    </TableCell>

                                    {/* Totales */}
                                    <TableCell className="text-center text-slate-800 font-bold border-l-2 border-[#e6dfcc] bg-[#f5efe2]">
                                        {punch.status === "incomplete" ? (
                                            <span className="text-amber-600 flex items-center justify-center gap-1">
                                                <Clock className="w-3 h-3" /> Inc.
                                            </span>
                                        ) : (punch.total !== "-" ? punch.total + "h" : "-")}
                                    </TableCell>

                                    {/* Extras */}
                                    <TableCell className={`text-center text-sm ${punch.extra !== "-" ? 'text-emerald-700 bg-[#eef6ec]' : 'text-slate-400 bg-[#f9f5ea]'}`}>
                                        {punch.extra !== "-" ? `+${punch.extra}h` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Footer Totales */}
                    <div className="bg-[#e9e1cd] p-4 px-8 border-t-4 border-double border-[#d5ccb5] flex flex-wrap justify-between items-center font-mono gap-4">
                        <div className="text-sm font-bold text-slate-600 uppercase">Totales del Período</div>
                        <div className="flex gap-6 items-baseline flex-wrap">
                            <div className="text-red-600 text-2xl font-bold"><span className="text-sm font-semibold uppercase mr-1 opacity-70">Tardanzas:</span>20m</div>
                            <div className="text-emerald-700 text-2xl font-bold"><span className="text-sm font-semibold uppercase mr-1 opacity-70">Extra:</span>+0.6h</div>
                            <div className="text-slate-800 text-2xl font-bold"><span className="text-sm font-semibold uppercase mr-2 opacity-70">Normal:</span>31.35h</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
