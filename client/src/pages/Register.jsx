import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'team_staff' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.register(formData);
      
      // แสดง Success ด้วย SweetAlert2
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Please wait for Admin approval.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/login');
      });

    } catch (err) {
      console.error(err);
      // แสดง Error ที่ส่งมาจาก Backend
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.response?.data?.error || "Something went wrong",
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Register as Team Staff
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input 
              name="username"
              type="text" 
              required
              placeholder="Choose a username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="Create a password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              onChange={handleChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-indigo-500/50 hover:from-indigo-700 hover:to-purple-700 transform transition-all duration-200 active:scale-95 mt-4"
          >
            Sign Up
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
           Already have an account?&nbsp;
           <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
             Sign In
           </Link>
        </div>
      </div>
    </div>
  );
}