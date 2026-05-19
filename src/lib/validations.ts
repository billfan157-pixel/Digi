import { z } from 'zod';

export const genderEnum = z.enum(['Nam', 'Nữ', 'Khác']);
export const activityEnum = z.enum(['sedentary', 'light', 'moderate', 'active', 'high', 'athlete']);
export const climateEnum = z.enum(['temperate', 'warm', 'hot', 'tropical', 'cold']);
export const goalEnum = z.enum(['Giảm mỡ & Tăng cơ', 'Sức khỏe tổng quát', 'Bảo vệ da']);

export const nicknameSchema = z.string().min(1, 'Vui lòng nhập tên hiển thị').max(50, 'Tên tối đa 50 ký tự').trim();
export const emailSchema = z.string().email('Email không hợp lệ');

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 số');

export const ageSchema = z.number().int('Tuổi phải là số nguyên').min(5, 'Tuổi tối thiểu 5').max(120, 'Tuổi tối đa 120');
export const heightSchema = z.number().min(50, 'Chiều cao tối thiểu 50cm').max(250, 'Chiều cao tối đa 250cm');
export const weightSchema = z.number().min(20, 'Cân nặng tối thiểu 20kg').max(300, 'Cân nặng tối đa 300kg');

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ (HH:MM)');

export const profileSchema = z.object({
  nickname: nicknameSchema,
  gender: genderEnum,
  age: ageSchema,
  height: heightSchema,
  weight: weightSchema,
  activity: activityEnum,
  climate: climateEnum,
  goal: goalEnum,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
  gender: genderEnum,
  age: ageSchema,
  height: heightSchema,
  weight: weightSchema,
  activity: activityEnum,
  climate: climateEnum,
  goal: goalEnum,
  wakeUp: timeSchema,
  bedTime: timeSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ');
}
