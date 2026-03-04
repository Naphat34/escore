import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Users, User, Hash, Image as ImageIcon } from 'lucide-react'; // นำเข้าไอคอนเพื่อความสวยงาม (ถ้าติดตั้ง lucide-react แล้ว)

export default function CreateTeam() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    coach: '', // ✅ เพิ่ม field coach
    logo_url: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ส่งข้อมูลไป API (รวม coach ไปด้วยแล้ว)
      await api.createMyTeam(formData);
      
      alert("Team created successfully! Redirecting to Dashboard...");
      
      navigate('/team-dashboard');
      window.location.reload(); 

    } catch (err) {
      alert(err.response?.data?.error || "Failed to create team");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
             <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Register Your Team</h1>
          <p className="text-gray-500 mt-2">Create a club profile to start managing players.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Team Name <span className="text-red-500">*</span></label>
            <div className="relative">
                <input 
                type="text" 
                name="name" 
                placeholder="e.g. Thailand National Team"
                required
                className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                onChange={handleChange}
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Team Code */}
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code <span className="text-red-500">*</span></label>
                <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                    type="text" 
                    name="code" 
                    placeholder="THA"
                    maxLength={10} // ✅ ปรับเป็น 10 ตาม Schema
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    value={formData.code}
                    />
                </div>
            </div>

             {/* Coach Name (New Field) */}
             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Head Coach</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                    type="text" 
                    name="coach" 
                    placeholder="Coach Name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    onChange={handleChange}
                    />
                </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Logo Image URL</label>
            <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input 
                type="url" 
                name="logo_url" 
                placeholder="https://example.com/logo.png"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={handleChange}
                />
            </div>
          </div>

          {/* Preview Logo */}
          {formData.logo_url && (
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400 mb-2">Logo Preview</span>
                <img 
                    src={formData.logo_url} 
                    alt="Preview" 
                    className="h-24 object-contain shadow-sm" 
                    onError={(e) => {
                        e.target.style.display='none'; // ซ่อนถ้ารูปเสีย
                    }}
                />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transform transition active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Creating Team...' : 'Create Team Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}