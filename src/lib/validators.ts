
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name must be at most 50 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});
export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name must be at most 50 characters." }).optional(),
  bio: z.string().max(200, { message: "Bio must be at most 200 characters." }).optional(),
  germanLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']).nullable().optional(),
});
export type ProfileUpdateFormData = z.infer<typeof ProfileUpdateSchema>;

export const MessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty.").max(1000, "Message is too long."),
});
export type MessageFormData = z.infer<typeof MessageSchema>;

