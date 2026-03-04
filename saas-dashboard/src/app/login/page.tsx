import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            {/* Background Graphic */}
            <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10">
                <div className="absolute w-[800px] h-[800px] bg-blue-600/10 blur-[100px] -top-64 -left-64 rounded-full opacity-50 mix-blend-screen"></div>
                <div className="absolute w-[800px] h-[800px] bg-emerald-600/10 blur-[100px] -bottom-64 -right-64 rounded-full opacity-50 mix-blend-screen"></div>
            </div>

            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Asensio <span className="text-blue-500">ADMS</span></h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">Plataforma SaaS de Control Biométrico</p>
                </div>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
                        <CardDescription className="text-slate-400">
                            Ingresa tus credenciales corporativas para continuar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="login-form" className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@empresa.com"
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                        Contraseña
                                    </label>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button
                            form="login-form"
                            formAction={login}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                        >
                            Accesar al Panel
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    )
}
