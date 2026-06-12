import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hashPassword } from '@/utils/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { LogIn, Box, Smartphone, CheckCircle2, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, Mail, ScanLine, BarChart3, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha o usuário e a senha.');
      return;
    }

    setIsLoading(true);
    try {
      const hashed = await hashPassword(password);
      const success = await login(username.trim(), hashed);
      
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Usuário ou senha incorretos, ou usuário inativo.');
        setShowForgotPassword(true);
      }
    } catch (error) {
      toast.error('Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast.error('Preencha seu usuário para solicitar o reset.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { usersApi } = await import('@/api/users');
      const users = await usersApi.getUsers();
      const userFound = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
      
      if (!userFound) {
        toast.error('Usuário não encontrado no sistema.');
        return;
      }
      
      await usersApi.updateUser(userFound.id, { reset_requested: true });
      toast.success('Solicitação enviada! Avise seu gestor para liberar seu acesso.');
      setShowForgotPassword(false);
    } catch (e) {
      toast.error('Erro ao solicitar reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070314] font-sans relative overflow-hidden p-4 sm:p-8">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4F25A0]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#32127A]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10 min-h-[600px]">
        
        {/* LEFT SIDE - MARKETING (Dark Purple) */}
        <div className="hidden lg:flex w-5/12 bg-gradient-to-b from-[#2B116A] to-[#120638] flex-col p-10 text-white relative overflow-hidden">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgxOG0tMTggOThoMTgiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-30" />

          <div className="relative z-10 flex flex-col h-full items-center text-center">
            
            {/* Logo Section */}
            <div className="mb-8 flex flex-col items-center mt-4">
              <div className="relative w-24 h-24 mb-4">
                {/* Simulated Hexagon Logo */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B42F6] to-[#4F25A0] rounded-2xl rotate-45 opacity-80" />
                <div className="absolute inset-2 bg-[#1E0B4B] rounded-xl rotate-45 flex items-center justify-center border border-[#7B42F6]/50">
                  <div className="-rotate-45">
                    <Box className="w-10 h-10 text-white" />
                  </div>
                </div>
                {/* Checkmark badge */}
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#6231E2] to-[#7B42F6] rounded-full p-1.5 border-2 border-[#120638]">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                Estoque <span className="text-[#9D71FF]">Fácil</span>
              </h1>
              <p className="text-[#9D71FF] text-sm tracking-widest font-medium uppercase">
                Logística Inteligente
              </p>
            </div>

            {/* Typography Section */}
            <div className="mb-10 mt-auto">
              <h2 className="text-2xl font-bold leading-snug mb-4">
                Controle sua operação do <span className="text-[#9D71FF]">estoque</span> até a <span className="text-[#9D71FF]">entrega.</span>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-[280px] mx-auto">
                A plataforma completa que integra estoque, expedição, entregas e força de vendas em um único sistema.
              </p>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-4 gap-3 w-full mb-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Box className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Estoque<br/>inteligente</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Conferência<br/>por bipagem</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">App do<br/>Motorista</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Gestão<br/>completa</span>
              </div>
            </div>

          </div>

          {/* Floating Cubes Decoration at Bottom */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full h-32 opacity-40 pointer-events-none flex justify-center items-end gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#6231E2] to-transparent border border-[#9D71FF]/30 rounded-lg transform rotate-12 translate-y-4" />
            <div className="w-24 h-24 bg-gradient-to-tr from-[#7B42F6] to-transparent border border-[#9D71FF]/40 rounded-xl transform -rotate-12 z-10" />
            <div className="w-12 h-12 bg-gradient-to-tr from-[#4F25A0] to-transparent border border-[#9D71FF]/20 rounded-lg transform rotate-45 translate-y-8" />
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM (White) */}
        <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-8 lg:p-16 bg-white relative">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-[#4F25A0] rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0A0520]">Estoque Fácil</span>
          </div>

          <div className="w-full max-w-[380px]">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#0A0520] mb-2 flex items-center justify-center gap-2">
                Bem-vindo de volta! <span className="animate-wave inline-block origin-bottom-right">👋</span>
              </h2>
              <p className="text-[#64748B] text-sm">
                Acesse sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-[#64748B] ml-0.5">E-mail ou usuário</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                  <Input 
                    id="username"
                    type="text" 
                    placeholder="Digite seu e-mail ou usuário" 
                    className="h-12 pl-11 rounded-xl border-[#E2E8F0] focus-visible:ring-[#6231E2] focus-visible:border-[#6231E2] text-sm shadow-sm"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#64748B] ml-0.5">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha" 
                    className="h-12 pl-11 pr-11 rounded-xl border-[#E2E8F0] focus-visible:ring-[#6231E2] focus-visible:border-[#6231E2] text-sm shadow-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-semibold text-[#6231E2] hover:text-[#4F25A0] transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-[#4F25A0] hover:bg-[#3D1A84] text-white rounded-xl shadow-lg shadow-[#4F25A0]/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Acessando...' : <>Entrar <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
                <span className="flex-shrink-0 mx-4 text-[#94A3B8] text-xs">ou</span>
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
              </div>

              <Button 
                type="button" 
                variant="outline"
                className="w-full h-12 text-sm font-semibold border-[#E2E8F0] text-[#475569] hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-3"
                onClick={() => toast.info('Integração com Google em desenvolvimento.')}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>

              {showForgotPassword && (
                <div className="pt-6 text-center slide-up">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full rounded-xl border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Solicitar Reset ao Gestor
                  </Button>
                </div>
              )}
            </form>

            <div className="text-center pt-8 text-sm text-[#64748B]">
              Ainda não tem uma conta? <a href="#" className="font-semibold text-[#4F25A0] hover:underline">Fale com seu administrador.</a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links & Info */}
      <div className="relative z-10 mt-12 w-full max-w-[1000px] flex flex-col items-center gap-6 text-white/60 text-sm">
        
        <div className="flex items-center gap-4">
          <span>Quer conhecer mais sobre o sistema?</span>
          <Link to="/saiba-mais">
            <Button variant="outline" className="h-10 rounded-xl border-white/20 text-white hover:bg-white/10 hover:border-white/30 bg-transparent flex items-center gap-2">
              <Box className="h-4 w-4" /> Saiba mais <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[#94A3B8]">
          <ShieldCheck className="h-4 w-4" /> Sua conexão é segura e criptografada
        </div>

        <div className="text-[#64748B] text-xs">
          © 2024 Estoque Fácil. Todos os direitos reservados.
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
        }
      `}</style>

    </div>
  );
}
