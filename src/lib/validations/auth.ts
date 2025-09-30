import { z } from 'zod';
import { MASTER_EMAIL } from '@/lib/config/master';

// Password strength validation
const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/\d/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

// Login form validation
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .refine(
      (email) => {
        const trimmedEmail = email.toLowerCase().trim();
        // Allow master email without @
        if (trimmedEmail === MASTER_EMAIL.toLowerCase()) {
          return true;
        }
        // For other emails, validate @ is present
        return z.string().email().safeParse(email).success;
      },
      { message: 'Digite um email válido' }
    )
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
});

// Signup form validation  
export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Digite um email válido')
    .toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

// Password strength checker
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Adicione uma letra maiúscula');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Adicione uma letra minúscula');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Adicione pelo menos um número');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Adicione um caractere especial (!@#$%^&*)');

  return { score, feedback };
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;