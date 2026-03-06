import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, MapPin, Flag, Briefcase,
    UserCog, Settings, Sliders, UserCheck, LogOut,
    Ruler, Moon, Sun, Users, Trophy, Swords, Shield,
    Star, Eye, Edit2, Trash2, Calendar, PlusCircle, X,
    ToggleLeft, ToggleRight, BarChart2, PlayCircle
} from 'lucide-react';

// Import Tabs (Components หน้าลูก)
import CompetitionsTab from './CompetitionsTab';
import HomeTab from './HomeTab';
import MatchManagementTab from './MatchManagementTab';
import PlayerViewTab from './PlayerViewTab';
import ClubsTab from './ClubsTab';
import AccountsTab from './AccountsTab';
import PendingUsersTab from './PendingUsersTab';
import EScoreTab from './EScoreTab';
import StadiumsTab from './StadiumsTab';
import TeamRankingTab from './TeamRankingTab';
import LiveScorerTab from './LiveScorerTab';
import OfficialsTab from './OfficialsTab';
//import RefereesTab from './RefereesTab';


// สร้าง Component Placeholder สำหรับหน้าทียังไม่ได้ทำจริง
const PlaceholderTab = ({ title }) => (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">หน้านี้กำลังอยู่ระหว่างการพัฒนา...</p>
    </div>
);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('competitions');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleLogout = async () => {
        try {
            await api.logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

            {/* ================= Sidebar (Left Menu) ================= */}
            <aside className={`w-64 flex-shrink-0 flex flex-col border-r shadow-sm z-20 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

                {/* Logo / Header */}
                <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
                    <h1 className="text-xl font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                        ADMIN PANEL
                    </h1>
                </div>

                {/* Scrollable Menu Area */}
                <nav className="flex-1 overflow-y-auto py-4">

                    {/* --- Group 1: Main --- */}
                    <div className="px-3 space-y-1 mb-4">
                        <MenuButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard size={20} />} label="Home" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'competitions'} onClick={() => setActiveTab('competitions')} icon={<Trophy size={20} />} label="Competitions" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'clubs'} onClick={() => setActiveTab('clubs')} icon={<Shield size={20} />} label="Clubs" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'stadium'} onClick={() => setActiveTab('stadium')} icon={<MapPin size={20} />} label="Stadium" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'team_ranking'} onClick={() => setActiveTab('team_ranking')} icon={<BarChart2 size={20} />} label="Team Ranking" darkMode={darkMode} />
                    </div>

                    <div className={`border-b mx-4 mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

                    {/* --- Group 2: People --- */}
                    <div className="px-3 space-y-1 mb-4">
                        <MenuButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={<Users size={20} />} label="Players" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'coaches'} onClick={() => setActiveTab('coaches')} icon={<UserCog size={20} />} label="Coaches" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'officials'} onClick={() => setActiveTab('officials')} icon={<Flag size={20} />} label="Officials" darkMode={darkMode} />
                    </div>

                    <div className={`border-b mx-4 mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

                    {/* --- Group 3: Score --- */}
                    <div className="px-3 space-y-1 mb-4">
                        <MenuButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Swords size={20} />} label="Matches" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'escore'} onClick={() => setActiveTab('escore')} icon={<Star size={20} />} label="VIS" darkMode={darkMode} />
                        <MenuButton active={activeTab === 'live_scorer'} onClick={() => setActiveTab('live_scorer')} icon={<PlayCircle size={20} />} label="Live Scorer" darkMode={darkMode} />
                    </div>

                    <div className={`border-b mx-4 mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

                    {/* --- Group 4: System --- */}
                    <div className="px-3 space-y-1">
                        <MenuButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<UserCheck size={20} />} label="Accounts" darkMode={darkMode} />

                        {/* Control Panel (สมมติว่าเป็นหน้า Dashboard รวม หรือ Settings ขั้นสูง) */}
                        <MenuButton active={activeTab === 'pending_users'} onClick={() => setActiveTab('pending_users')} icon={<Sliders size={20} />} label="Pending Users" darkMode={darkMode} />

                        {/* Setting Panel (Toggle Dark Mode หรืออื่นๆ) */}
                        <div className="pt-2">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 
                            ${darkMode
                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Footer Sidebar (Logout) */}
                <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-red-500 hover:text-red-700 font-medium text-sm transition"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* ================= Main Content Area ================= */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* Header ของเนื้อหา (Optional) */}
                    <div className="mb-6 flex justify-between items-end">
                        <h2 className="text-3xl font-bold dark:text-white capitalize">
                            {activeTab.replace('_', ' ')}
                        </h2>
                        {/* ปุ่ม Action ขวาบนถ้าต้องการ */}
                    </div>

                    {/* Render เนื้อหาตาม Tab */}
                    {activeTab === 'home' && <HomeTab darkMode={darkMode} />}
                    {activeTab === 'competitions' && <CompetitionsTab darkMode={darkMode} />}
                    {activeTab === 'clubs' && <ClubsTab darkMode={darkMode} />}
                    {activeTab === 'stadium' && <StadiumsTab darkMode={darkMode} />}
                    {activeTab === 'team_ranking' && <TeamRankingTab darkMode={darkMode} />}

                    {activeTab === 'players' && <PlayerViewTab darkMode={darkMode} />}
                    {activeTab === 'coaches' && <PlaceholderTab title="Coaches Management" />}
                    {activeTab === 'officials' && <OfficialsTab darkMode={darkMode} />}

                    {activeTab === 'accounts' && <AccountsTab darkMode={darkMode} />}
                    {activeTab === 'pending_users' && <PendingUsersTab darkMode={darkMode} />}
                    {activeTab === 'control_panel' && <PlaceholderTab title="Control Panel" />}
                    {activeTab === 'matches' && <MatchManagementTab darkMode={darkMode} />}
                    {activeTab === 'escore' && <EScoreTab darkMode={darkMode} />}
                    {activeTab === 'live_scorer' && <LiveScorerTab darkMode={darkMode} />}
                </div>
            </main>

        </div>
    );
}

// Helper: Sidebar Menu Button
function MenuButton({ active, onClick, icon, label, darkMode }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                ${active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : `text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}