  import z from 'zod';


  export const registerValidator = z.object({
    firstName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters"),
    otherNames: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters").optional(),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please provide a valid email")
      .toLowerCase(),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
  });

  export const loginValidator = z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please provide a valid email")
      .toLowerCase(),
    password: z.string().min(1, "Password is required"),
  });