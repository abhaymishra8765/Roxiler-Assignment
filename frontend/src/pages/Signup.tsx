import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../api/axios";

type FormData = {
  name: string;
  email: string;
  password: string;
  address?: string;
};

const schema = yup
  .object({
    name: yup.string().min(20).max(60).required(),
    email: yup.string().email().required(),
    password: yup
      .string()
      .min(8)
      .max(16)
      .matches(/[A-Z]/, "at least one uppercase")
      .matches(/\W/, "at least one special")
      .required(),
    address: yup.string().max(400).optional(),
  })
  .required();

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/auth/register", data);
      alert("Registered successfully");
      console.log(res.data);
    } catch (e: any) {
      alert(e.response?.data?.error || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
      <h2 className="text-xl mb-2">Signup</h2>
      <div>
        <label>Name</label>
        <input {...register("name")} className="block w-full" />
        <p className="text-red-600">{errors.name?.message as any}</p>
      </div>
      <div>
        <label>Email</label>
        <input {...register("email")} />
        <p className="text-red-600">{errors.email?.message as any}</p>
      </div>
      <div>
        <label>Password</label>
        <input type="password" {...register("password")} />
        <p className="text-red-600">{errors.password?.message as any}</p>
      </div>
      <div>
        <label>Address</label>
        <textarea {...register("address")} />
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-2">
        Signup
      </button>
    </form>
  );
}
