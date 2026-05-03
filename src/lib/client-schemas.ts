"use client";

import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Invalid email").default(""),
  password: z.string().min(1, "Required").default(""),
});

export const registerFormSchema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string().min(8, "Min 8 characters"),
    terms: z.boolean().refine((value) => value === true, {
      message: "Please accept the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordStepOneSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const forgotPasswordStepTwoSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit OTP"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string().min(8, "Min 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const profileFormSchema = z.object({
  name: z.string().min(2, "Required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  dateOfBirth: z.string().optional(),
  genderPreference: z.enum(["men", "women", "unisex"]),
});

export const addressFormSchema = z.object({
  label: z.string().min(1, "Required"),
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(10, "Required"),
  street: z.string().min(3, "Required"),
  locality: z.string().min(2, "Required"),
  landmark: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  country: z.string().min(2, "Required"),
  addressType: z.enum(["Home", "Work", "Other"]).default("Home"),
  isDefault: z.boolean().default(false),
});
