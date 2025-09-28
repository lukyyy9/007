import { z } from "zod";

export const usernameSchema = z.string()
    .min(1, "Nom d'utilisateur requis")
export const emailSchema = z
  .string()
  .min(1, "Email requis")
  .email("Email invalide");

export const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caractères");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmer le mot de passe"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterForm = z.infer<typeof registerSchema>;
