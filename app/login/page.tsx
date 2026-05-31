"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { createClient } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  useEffect(()=>{
    const supabase=createClient();
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>{if(data.session)router.replace("/")});
  },[router]);
  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setError("");
    const supabase=createClient();
    if(!supabase){setError("Configure o Supabase para acessar a dashboard.");setLoading(false);return}
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError("Não foi possível entrar. Verifique seus dados.");setLoading(false);return}
    router.replace("/");
  }
  return <main className="noise grid min-h-screen place-items-center bg-[#080b18] p-5 text-slate-100"><div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#11162d]/90 shadow-2xl shadow-amber-950/40 md:grid-cols-2"><section className="hidden bg-gradient-to-br from-[#17120a] via-[#4a340b] to-[#15100a] p-9 md:block"><div className="flex items-center gap-3 text-xl font-extrabold"><img src="/elite-dashboard-logo.png" alt="Elite Dashboard" className="h-12 w-12 rounded-xl border border-amber-400/30 object-cover"/>ELITE DASHBOARD</div><div className="mt-28"><Sparkles/><h1 className="mt-5 text-3xl font-bold">Sua operação no próximo nível.</h1><p className="mt-3 text-sm text-white/75">Acompanhe campanhas, criativos e oportunidades em uma central inteligente.</p></div><div className="mt-20 flex items-center gap-2 text-xs text-white/70"><ShieldCheck size={16}/> Dados protegidos por usuário</div></section><section className="p-7 md:p-9"><p className="text-xs font-bold tracking-[.2em] text-amber-400">BEM-VINDO DE VOLTA</p><h2 className="mt-3 text-2xl font-bold">Acesse sua conta</h2><p className="mt-2 text-xs text-slate-500">Entre com seus dados para abrir o painel.</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block"><span className="text-xs text-slate-400">E-mail</span><div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3"><Mail size={15} className="text-slate-500"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none"/></div></label><label className="block"><span className="text-xs text-slate-400">Senha</span><div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3"><LockKeyhole size={15} className="text-slate-500"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none"/></div></label>{error&&<p className="text-xs text-red-300">{error}</p>}<button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 py-3 text-xs font-bold shadow-lg shadow-amber-900/40">{loading?"Entrando...":"Entrar"}<ArrowRight size={15}/></button></form><p className="mt-6 text-center text-[10px] text-slate-600">Acesso exclusivo para usuários cadastrados.</p></section></div></main>
}
