import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate, Link } from 'react-router-dom';

import Swal from 'sweetalert2'; // Import SweetAlert2

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    const response = await api.login({
      username: formData.username,
      password: formData.password
    });

    if (!response.data) {
      throw new Error("No response from server");
    }

    const { token, user } = response.data;

    if (!token) {
      throw new Error("Token not received from server");
    }

    const { role, status, team_id } = user;

    // 🔐 Save Token
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // =========================
    // ADMIN
    // =========================
    console.log("ROLE =", role);
    if (role === "admin") {

      navigate("/admin");

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Welcome Admin",
        showConfirmButton: false,
        timer: 1500
      });

      
      return;
    }

    // =========================
    // USER NOT APPROVED
    // =========================
    if (status !== "approved") {

      await Swal.fire({
        icon: "warning",
        title: "Account Pending",
        text: "Your account is pending approval from Admin.",
        confirmButtonColor: "#f59e0b"
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return;
    }

    // =========================
    // SUCCESS
    // =========================
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Signed in successfully",
      showConfirmButton: false,
      timer: 1500
    });

    // =========================
    // TEAM CHECK
    // =========================
    if (team_id) {
      navigate("/team-dashboard");
    } else {
      navigate("/create-team");
    }

  } catch (err) {

    console.error("Login error:", err);

    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: err.response?.data?.error || err.message || "Invalid username or password.",
      confirmButtonColor: "#4f46e5"
    });

  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Card Container */}
      <div className="bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Volley Manager Login
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            ระบบจัดการทีมวอลเลย์บอล
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input 
              name="username" 
              type="text" 
              required
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              onChange={handleChange}
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
            </div>
            <input 
              name="password" 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-indigo-500/50 hover:from-indigo-700 hover:to-purple-700 transform transition-all duration-200 active:scale-95"
          >
            Sign In
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            เจ้าหน้าที่ทีมยังไม่มีทีม?&nbsp;{' '}
            <Link 
              to="/register" 
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}