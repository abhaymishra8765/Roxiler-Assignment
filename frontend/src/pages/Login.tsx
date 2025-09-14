import React from "react";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

type FormData = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit } = useForm<FormData>();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/auth/login", data);
      const token = res.data.accessToken;
      login(token);
      alert("Logged in");
      navigate("/stores");
    } catch (e: any) {
      alert(e.response?.data?.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
      <h2 className="text-xl mb-2">Login</h2>
      <div>
        <label>Email</label>
        <input {...register("email")} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" {...register("password")} />
      </div>
      <button type="submit" className="mt-2">
        Login
      </button>
    </form>
  );
}
