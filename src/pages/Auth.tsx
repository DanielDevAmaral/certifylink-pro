import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { loginSchema, signupSchema, type LoginFormData, type SignupFormData } from '@/lib/validations/auth';
import { PasswordStrength } from '@/components/ui/password-strength';
import { FormFieldError } from '@/components/ui/form-field-error';
import { useToast } from '@/hooks/use-toast';
export default function Auth() {
  const {
    user,
    signIn,
    signUp,
    signInWithGoogle
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states with validation
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [signupData, setSignupData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Validation errors
  const [loginErrors, setLoginErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [signupErrors, setSignupErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    // Validate form
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      validation.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof LoginFormData;
        errors[field] = issue.message;
      });
      setLoginErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signIn(loginData.email, loginData.password);
      if (error) {
        // Handle specific error types
        const errorMessage = error.message.includes('Invalid login credentials') ? 'Email ou senha incorretos' : error.message.includes('Email not confirmed') ? 'Confirme seu email antes de fazer login' : error.message;
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: errorMessage
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes."
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    // Validate form
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      const errors: Partial<Record<keyof SignupFormData, string>> = {};
      validation.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof SignupFormData;
        errors[field] = issue.message;
      });
      setSignupErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signUp(signupData.email, signupData.password, signupData.fullName);
      if (error) {
        const errorMessage = error.message.includes('User already registered') ? 'Este email já está cadastrado. Faça login ou use outro email.' : error.message;
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: errorMessage
        });
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta."
        });

        // Reset form
        setSignupData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: ''
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes."
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const {
        error
      } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login com Google",
          description: "Não foi possível fazer login. Tente novamente."
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes."
      });
    } finally {
      setGoogleLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão Documental
          </h1>
          <p className="text-muted-foreground">
            Plataforma corporativa de certificações e documentos
          </p>
        </div>

        {/* Auth Form */}
        <Card className="card-corporate">
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>


            <TabsContent value="login">
              {/* Google Login Button */}
              <div className="space-y-4">
                <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {googleLoading ? 'Conectando...' : 'Continuar com Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continue com email
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu.email@empresa.com" value={loginData.email} onChange={e => setLoginData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} className="pl-10" required />
                  </div>
                  <FormFieldError error={loginErrors.email} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginData.password} onChange={e => setLoginData(prev => ({
                    ...prev,
                    password: e.target.value
                  }))} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormFieldError error={loginErrors.password} />
                </div>

                <Button type="submit" className="btn-corporate w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {/* Google Signup Button */}
              <div className="space-y-4">
                <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {googleLoading ? 'Conectando...' : 'Criar conta com Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou crie com email
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="text" placeholder="Seu nome completo" value={signupData.fullName} onChange={e => setSignupData(prev => ({
                    ...prev,
                    fullName: e.target.value
                  }))} className="pl-10" required />
                  </div>
                  <FormFieldError error={signupErrors.fullName} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu.email@empresa.com" value={signupData.email} onChange={e => setSignupData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} className="pl-10" required />
                  </div>
                  <FormFieldError error={signupErrors.email} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={signupData.password} onChange={e => setSignupData(prev => ({
                    ...prev,
                    password: e.target.value
                  }))} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={signupData.password} />
                  <FormFieldError error={signupErrors.password} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="Confirme sua senha" value={signupData.confirmPassword} onChange={e => setSignupData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))} className="pl-10" required />
                  </div>
                  <FormFieldError error={signupErrors.confirmPassword} />
                </div>

                <Button type="submit" className="btn-corporate w-full" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Plataforma interna • Acesso restrito a colaboradores.
          <br>
          Por: Roger Lovato e Rodrigo Bonfim</br> </p>
        </div>
      </div>
    </div>;
}