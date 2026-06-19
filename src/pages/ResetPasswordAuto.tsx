import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/toaster';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordAuto() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleReset = async () => {
      try {
        // Supabase Auth extracts the token from the URL hash automatically.
        // We wait a brief moment to ensure the session is initialized.
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Link inválido ou expirado. Solicite a redefinição novamente.');
        }

        // Auto-update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: 'Trocar@123'
        });

        if (updateError) throw updateError;

        // Force must_change_password in the public.users table
        const { error: dbError } = await supabase
          .from('users')
          .update({ must_change_password: true })
          .eq('auth_user_id', session.user.id);

        if (dbError) throw dbError;

        // Sign out so they have to login with the new password
        await supabase.auth.signOut();
        
        setStatus('success');
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        toast.error(err.message || 'Erro ao processar o link.');
      }
    };

    handleReset();
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070314] text-white p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-bold">Redefinindo senha...</h2>
            <p className="text-white/60">Aguarde um momento enquanto processamos sua solicitação.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">Senha Redefinida!</h2>
              <p className="text-white/80">Sua senha foi redefinida automaticamente para o padrão do sistema.</p>
              <div className="bg-black/40 p-4 rounded-lg mt-4 border border-white/10">
                <p className="text-sm text-white/60 mb-1">Sua nova senha é:</p>
                <p className="text-xl font-mono text-white tracking-widest">Trocar@123</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
            >
              Fazer Login Agora
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">Falha na Redefinição</h2>
              <p className="text-white/80">O link é inválido, expirou, ou ocorreu um erro no sistema.</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Voltar ao Login e tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
