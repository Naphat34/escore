import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import { 
  Users, 
  Trophy, 
  UserPlus, 
  Calendar, 
  Shield, 
  Briefcase,
  Activity,
  Edit2,
  Trash2,
  MapPin,
  User,
  X,
  Star,
  Search,
  Download,
  Moon,
  Sun,
  LogOut,
  BarChart2,
  Swords
} from 'lucide-react'; 

// Toast Configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export default function TeamDashboard() {
  const [activeTab, setActiveTab] = useState('roster'); 
  const [players, setPlayers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [statsGenderFilter, setStatsGenderFilter] = useState('All');
  const [rosterGenderFilter, setRosterGenderFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [openCompetitions, setOpenCompetitions] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  const [teamInfo, setTeamInfo] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', code: '', logo_url: '' });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

 
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [viewingStatsPlayer, setViewingStatsPlayer] = useState(null);
  const [statsData, setStatsData] = useState(null);

  
  const [playerForm, setPlayerForm] = useState({ 
      number: '', 
      first_name: '', 
      last_name: '', 
      nickname: '', 
      position: 'OH', 
      height_cm: '',
      weight: '', 
      birth_date: '', 
      nationality: '', 
      photo: '',
      gender: 'Male',
      is_captain: false 
  });

  const [staffForm, setStaffForm] = useState({ first_name: '', last_name: '', role: 'Head Coach', gender: 'Male' });

  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
        await api.logout();
        localStorage.clear();
        navigate('/login');
    } catch (error) {
        console.error("Logout failed", error);
        localStorage.clear();
        navigate('/login');
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

  useEffect(() => {
      const fetchTeamInfo = async () => {
          try {
              const [resTeam, resStaff] = await Promise.all([
                  api.getMyTeam(),
                  api.getMyStaff()
              ]);
              const info = resTeam.data;
              const headCoach = resStaff.data.find(s => s.role === 'Head Coach') || resStaff.data[0];
              if (headCoach) {
                  info.coach = `${headCoach.first_name} ${headCoach.last_name}`;
              }
              setTeamInfo(info);
          } catch (err) {
              console.error("Error fetching team info:", err);
          }
      };
      fetchTeamInfo();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        if (activeTab === 'roster') {
            const res = await api.getMyPlayers();
            setPlayers(res.data);
        } else if (activeTab === 'staff') {
            const res = await api.getMyStaff();
            setStaff(res.data);
        } else if (activeTab === 'competitions') {
            const [resOpen, resMy] = await Promise.all([
                api.getOpenCompetitions(),
                api.getMyCompetitions()
            ]);
            // กรองรายการที่สมัครไปแล้วออกจากรายการที่เปิดรับสมัคร
            const myCompIds = resMy.data.map(c => c.id);
            setOpenCompetitions(resOpen.data.filter(c => c.status === 'open' && !myCompIds.includes(c.id)));
            setMyCompetitions(resMy.data);
        } else if (activeTab === 'stats') {
            const res = await api.getMyPlayersStats();
            setPlayerStats(res.data);
        } else if (activeTab === 'schedule') {
            const res = await api.getMyMatches();
            setMyMatches(res.data);
        }
    } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
            navigate('/login');
        }
    } finally {
        setLoading(false);
    }
  }, [activeTab, navigate]);


  const handlePlayerSubmit = async (e) => {
      e.preventDefault();
      try {
          if (editingPlayerId) {
              await api.updatePlayer(editingPlayerId, playerForm);
              Toast.fire({ icon: 'success', title: 'Player updated successfully' });
          } else {
              await api.addPlayer(playerForm);
              Toast.fire({ icon: 'success', title: 'Player added successfully' });
          }
          
          resetPlayerForm();
          fetchData(); 
      } catch (err) {
          Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to save player' });
      }
  };

  const resetPlayerForm = () => {
      setEditingPlayerId(null);
      setPlayerForm({ 
        number: '', first_name: '', last_name: '', nickname: '', 
        position: 'OH', height_cm: '', weight: '', 
        birth_date: '', nationality: '', photo: '',
        gender: 'Male',
        is_captain: false // Reset Checkbox
      });
  };

  const handleEditPlayer = (p) => {
      setEditingPlayerId(p.id);
      setPlayerForm({
          number: p.number ?? '',
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          nickname: p.nickname ?? '',
          position: p.position ?? 'OH',
          height_cm: p.height_cm ?? '',
          weight: p.weight ?? '',
          birth_date: p.birth_date ? p.birth_date.split('T')[0] : '', 
          nationality: p.nationality ?? '',
          photo: p.photo ?? '',
          gender: p.gender ?? 'Male',
          is_captain: p.is_captain ?? false 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStaffSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.addStaff(staffForm);
          Toast.fire({ icon: 'success', title: 'Staff added successfully' });
          setStaffForm({ first_name: '', last_name: '', role: 'Head Coach', gender: 'Male' });
          fetchData();
      } catch (err) {
          Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to add staff' });
      }
  };

  const handleJoinCompetition = async (id) => {
      try {
        // 1. ตรวจสอบจำนวนผู้เล่น (Roster Limit)
        const comp = openCompetitions.find(c => c.id === id);
        if (comp && comp.max_players && players.length > comp.max_players) {
            Swal.fire('Error', `Cannot join. Your team roster (${players.length}) exceeds the limit of ${comp.max_players} players.`, 'error');
            return;
        }

        await api.joinCompetition(id);
        Toast.fire({ icon: 'success', title: 'Joined competition!' });
        fetchData();
      } catch (err) {
        Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to join' });
      }
  };

  const handleLeaveCompetition = async (id) => {
      const result = await Swal.fire({
          title: 'Leave Competition?',
          text: "Are you sure you want to withdraw from this competition?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Yes, Leave'
      });

      if (result.isConfirmed) {
          try {
            await api.leaveCompetition(id);
            Toast.fire({ icon: 'success', title: 'Left competition successfully' });
            fetchData();
          } catch (err) {
            Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to leave' });
          }
      }
  };

  const handleViewStats = async (player) => {
      // เปิด Modal ทันทีพร้อมข้อมูลผู้เล่น และกำหนดค่าเริ่มต้นให้ statsData เป็น object ว่าง
      // เพื่อป้องกัน error และให้ Modal แสดงผลได้ก่อนที่ข้อมูลจริงจะมาถึง
      setViewingStatsPlayer(player);
      setStatsData({}); 
      try {
          const res = await api.getPlayerStats(player.id);
          setStatsData(res.data);
      } catch (err) {
          console.error(err);
          Toast.fire({ icon: 'error', title: 'Failed to load stats' });
          // หากเกิดข้อผิดพลาด ให้ปิด Modal ไปเลย
          setViewingStatsPlayer(null);
      }
  };

  const filteredStats = playerStats.filter(p => 
    statsGenderFilter === 'All' || p.gender === statsGenderFilter
  );

  // --- Logic: Calculate Top Players ---
  const getStatValue = (p, type) => {
      if (!p) return 0;
      if (type === 'score') return (Number(p.attack_kills)||0) + (Number(p.block_points)||0) + (Number(p.serve_aces)||0);
      if (type === 'block') return Number(p.block_points)||0;
      if (type === 'serve') return Number(p.serve_aces)||0;
      if (type === 'dig') return Number(p.digs)||0;
      return 0;
  };

  const topScorer = [...filteredStats].sort((a, b) => getStatValue(b, 'score') - getStatValue(a, 'score'))[0];
  const topBlocker = [...filteredStats].sort((a, b) => getStatValue(b, 'block') - getStatValue(a, 'block'))[0];
  const topServer = [...filteredStats].sort((a, b) => getStatValue(b, 'serve') - getStatValue(a, 'serve'))[0];
  const topDefender = [...filteredStats].sort((a, b) => getStatValue(b, 'dig') - getStatValue(a, 'dig'))[0];
  // ------------------------------------

  const handleDeletePlayer = async (id) => {
    // This was fixed in a previous step, but the context file is old.
    // Re-applying the fix.
    const result = await Swal.fire({
      title: 'Remove this player?',
      text: "Are you sure you want to remove this player from the roster?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove'
    });
    if (!result.isConfirmed) return;

    try {
      await api.deletePlayer(id);
      Toast.fire({ icon: 'success', title: 'Player removed successfully' });
      fetchData();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to remove player' });
    }
  };

  const filteredPlayers = players.filter(p => 
    (rosterGenderFilter === 'All' || p.gender === rosterGenderFilter) &&
    (
      p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.number.toString().includes(searchTerm)
    )
  );

  const handleExportCSV = () => {
      if (filteredPlayers.length === 0) {
          Toast.fire({ icon: 'info', title: 'No players to export' });
          return;
      }

      const headers = ["Number,First Name,Last Name,Nickname,Position,Height (cm),Weight (kg),Birth Date,Nationality,Captain"];
      const rows = filteredPlayers.map(p => [
          p.number,
          `"${p.first_name}"`,
          `"${p.last_name}"`,
          `"${p.nickname || ''}"`,
          p.position,
          p.height_cm || '',
          p.weight || '',
          p.birth_date ? p.birth_date.split('T')[0] : '',
          p.nationality || '',
          p.is_captain ? 'Yes' : 'No'
      ].join(','));

      const csvContent = "\uFEFF" + [headers, ...rows].join('\n'); // Add BOM for Excel support
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "team_roster.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleEditTeamClick = () => {
      if (teamInfo) {
          setTeamForm({
              name: teamInfo.name || '',
              code: teamInfo.code || '',
              logo_url: teamInfo.logo_url || ''
          });
          setIsEditingTeam(true);
      }
  };

  const handleUpdateTeam = async (e) => {
      e.preventDefault();
      try {
          const res = await api.updateMyTeam(teamForm);
          setTeamInfo(prev => ({ ...prev, ...res.data }));
          setIsEditingTeam(false);
          Toast.fire({ icon: 'success', title: 'Team updated successfully' });
      } catch (err) {
          console.error(err);
          Toast.fire({ icon: 'error', title: 'Failed to update team' });
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {teamInfo?.logo_url ? (
                    <img 
                        src={teamInfo.logo_url} 
                        alt={teamInfo.name} 
                        className="w-10 h-10 object-contain rounded-lg bg-white border border-gray-200" 
                        onError={(e) => {e.target.style.display = 'none'}}
                    />
                ) : (
                    <div className="bg-indigo-600 p-2 rounded-lg"><Shield className="text-white w-6 h-6"/></div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{teamInfo?.name || 'Team Dashboard'}</h1>
                    {teamInfo?.coach && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Coach: {teamInfo.coach}</p>}
                    <button onClick={handleEditTeamClick} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 mt-1">
                        <Edit2 size={12} /> Edit Team Info
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setDarkMode(!darkMode)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition">
                    Sign Out
                </button>
            </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700" aria-label="Tabs">
            <TabButton active={activeTab === 'competitions'} onClick={() => setActiveTab('competitions')} icon={<Trophy size={18} className="mr-2"/>} label="Competitions" />
            <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={18} className="mr-2"/>} label="Schedule" />
            <TabButton active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} icon={<Users size={18} className="mr-2"/>} label="Roster (Players)" />
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart2 size={18} className="mr-2"/>} label="Player Stats" />
            <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Briefcase size={18} className="mr-2"/>} label="Coaching Staff" />
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ========================== ROSTER TAB ========================== */}
        {activeTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-50 dark:bg-indigo-900/50 p-2 rounded-full">
                                    {editingPlayerId ? <Edit2 className="text-orange-600 dark:text-orange-400 w-5 h-5"/> : <UserPlus className="text-indigo-600 dark:text-indigo-400 w-5 h-5"/>}
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {editingPlayerId ? 'Edit Player' : 'Add New Player'}
                                </h2>
                            </div>
                            {editingPlayerId && (
                                <button onClick={resetPlayerForm} className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 px-2 py-1 rounded flex items-center gap-1 transition">
                                    <X size={14}/> Cancel
                                </button>
                            )}
                        </div>
                        
                        <form onSubmit={handlePlayerSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Number" value={playerForm.number} required
                                    onChange={e => setPlayerForm({...playerForm, number: e.target.value})} 
                                />
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Position</label>
                                    <select value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-200"
                                    >
                                        <option value="OH">OH - Outside Hitter</option>
                                        <option value="OPP">OPP - Opposite</option>
                                        <option value="S">S - Setter</option>
                                        <option value="MB">MB - Middle Blocker</option>
                                        <option value="L">L - Libero</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Gender</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Male" checked={playerForm.gender === 'Male'} onChange={e => setPlayerForm({...playerForm, gender: e.target.value})} className="text-indigo-600 focus:ring-indigo-500" /> <span className="text-sm text-gray-700 dark:text-gray-300">Male</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Female" checked={playerForm.gender === 'Female'} onChange={e => setPlayerForm({...playerForm, gender: e.target.value})} className="text-indigo-600 focus:ring-indigo-500" /> <span className="text-sm text-gray-700 dark:text-gray-300">Female</span></label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="First Name" value={playerForm.first_name} required
                                    onChange={e => setPlayerForm({...playerForm, first_name: e.target.value})} 
                                />
                                <Input label="Last Name" value={playerForm.last_name} required
                                    onChange={e => setPlayerForm({...playerForm, last_name: e.target.value})} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Nickname" value={playerForm.nickname}
                                    onChange={e => setPlayerForm({...playerForm, nickname: e.target.value})} 
                                />
                                <Input label="Nationality" value={playerForm.nationality} placeholder="TH"
                                    onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Height (cm)" type="number" value={playerForm.height_cm}
                                    onChange={e => setPlayerForm({...playerForm, height_cm: e.target.value})} 
                                />
                                <Input label="Weight (kg)" type="number" value={playerForm.weight}
                                    onChange={e => setPlayerForm({...playerForm, weight: e.target.value})} 
                                />
                            </div>
                            
                            <Input label="Date of Birth" type="date" value={playerForm.birth_date} required
                                onChange={e => setPlayerForm({...playerForm, birth_date: e.target.value})} 
                            />

                            <Input label="Photo URL" placeholder="https://example.com/image.jpg" value={playerForm.photo}
                                onChange={e => setPlayerForm({...playerForm, photo: e.target.value})} 
                            />

                            {/* ✅ 1. เพิ่ม Checkbox Captain */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <input 
                                    type="checkbox" 
                                    id="is_captain"
                                    className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                                    checked={playerForm.is_captain}
                                    onChange={e => setPlayerForm({...playerForm, is_captain: e.target.checked})}
                                />
                                <label htmlFor="is_captain" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1">
                                    Captain <span className="text-yellow-500 dark:text-yellow-400 text-xs">(กัปตันทีม)</span>
                                </label>
                            </div>

                            <Button 
                                type="submit" 
                                label={editingPlayerId ? "Update Player" : "Add Player"} 
                                icon={editingPlayerId ? <Edit2 size={18}/> : <UserPlus size={18}/>} 
                                full 
                                className={editingPlayerId ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-200" : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200"}
                            />
                        </form>
                    </div>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <Users size={18} className="text-gray-400"/> Current Roster
                                </h3>
                                <div className="flex items-center gap-2">
                                    <FilterButton active={rosterGenderFilter === 'All'} onClick={() => setRosterGenderFilter('All')} label="All" />
                                    <FilterButton active={rosterGenderFilter === 'Male'} onClick={() => setRosterGenderFilter('Male')} label="Men's Team" />
                                    <FilterButton active={rosterGenderFilter === 'Female'} onClick={() => setRosterGenderFilter('Female')} label="Women's Team" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search players..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                    />
                                </div>
                                <button 
                                    onClick={handleExportCSV}
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500 p-2 rounded-lg transition shadow-sm"
                                    title="Export CSV"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {filteredPlayers.length === 0 ? <EmptyState text={searchTerm ? "No players found matching your search." : "No players added yet."} /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">No.</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Physical</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                        {filteredPlayers.map((p) => (
                                            <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                                                <td className="px-6 py-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 border-2 border-indigo-50 dark:border-gray-600 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-lg shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-500 group-hover:scale-110 group-hover:shadow-md transition-all font-mono">
                                                        {p.number}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm group-hover:shadow-md transition-all">
                                                            {p.photo ? (
                                                                <img 
                                                                    src={p.photo} 
                                                                    alt={p.first_name} 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {e.target.style.display = 'none'}}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                                                                    <User size={24}/>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            {/* ✅ 2. แสดงตัว C พื้นหลังเหลือง */}
                                                            <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-base">
                                                                {p.first_name} {p.last_name}
                                                                {p.is_captain && (
                                                                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center justify-center tracking-wider" title="Team Captain">
                                                                        CAP
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                                {p.nickname && <span className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/50 px-1.5 rounded">"{p.nickname}"</span>}
                                                                {p.nationality && <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500"> {p.nationality}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium font-mono">
                                                            {p.height_cm ? `${p.height_cm}cm` : '-'} <span className="text-gray-300 dark:text-gray-600">/</span> {p.weight ? `${p.weight}kg` : '-'}
                                                        </div>
                                                        {p.age && (
                                                            <div className="text-xs text-gray-400">
                                                                Age: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.age}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                     <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                                                        p.position === 'L' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700' :
                                                        p.position === 'S' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700' :
                                                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                                    }`}>
                                                        {p.position}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                                        <button 
                                                            onClick={() => handleViewStats(p)} 
                                                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                                            title="View Stats"
                                                        >
                                                            <BarChart2 size={16} />
                                                        </button>

                                                        <button 
                                                            onClick={() => handleEditPlayer(p)} 
                                                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>

                                                        <button 
                                                            onClick={() => handleDeletePlayer(p.id)} 
                                                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ========================== STAFF TAB ========================== */}
        {activeTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400"/> Add Staff
                        </h2>
                        <form onSubmit={handleStaffSubmit} className="space-y-4">
                            <Input label="First Name" value={staffForm.first_name} required
                                onChange={e => setStaffForm({...staffForm, first_name: e.target.value})} 
                            />
                            <Input label="Last Name" value={staffForm.last_name} required
                                onChange={e => setStaffForm({...staffForm, last_name: e.target.value})} 
                            />
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Gender</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="staffGender" value="Male" checked={staffForm.gender === 'Male'} onChange={e => setStaffForm({...staffForm, gender: e.target.value})} className="text-indigo-600 focus:ring-indigo-500" /> <span className="text-sm text-gray-700 dark:text-gray-300">Male</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="staffGender" value="Female" checked={staffForm.gender === 'Female'} onChange={e => setStaffForm({...staffForm, gender: e.target.value})} className="text-indigo-600 focus:ring-indigo-500" /> <span className="text-sm text-gray-700 dark:text-gray-300">Female</span></label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Role</label>
                                <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-200"
                                >
                                    <option>Head Coach</option>
                                    <option>Assistant Coach</option>
                                    <option>Team Manager</option>
                                    <option>Physiotherapist</option>
                                    <option>Statistician</option>
                                </select>
                            </div>
                            <Button type="submit" label="Add Staff" icon={<UserPlus size={18}/>} full />
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Coaching Staff</h3>
                        </div>
                        {staff.length === 0 ? <EmptyState text="No staff members." /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                                {staff.map(s => (
                                    <div key={s.id} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-gray-700 group">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                                            {s.first_name[0]}{s.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{s.first_name} {s.last_name}</div>
                                            <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                                                {s.role}
                                                {s.gender && <span className="ml-1 text-gray-400 font-normal dark:text-gray-500">({s.gender})</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ========================== PLAYER STATS TAB ========================== */}
        {activeTab === 'stats' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <BarChart2 size={18} className="text-gray-400"/> Player Statistics
                    </h3>
                    <div className="flex items-center gap-2">
                        <FilterButton active={statsGenderFilter === 'All'} onClick={() => setStatsGenderFilter('All')} label="All Players" />
                        <FilterButton active={statsGenderFilter === 'Male'} onClick={() => setStatsGenderFilter('Male')} label="Male" />
                        <FilterButton active={statsGenderFilter === 'Female'} onClick={() => setStatsGenderFilter('Female')} label="Female" />
                    </div>
                </div>
                
                {/* --- Top Performers Cards --- */}
                {filteredStats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
                        <TopPlayerCard 
                            title="Top Scorer" 
                            icon={<Trophy size={16} className="text-yellow-600 dark:text-yellow-400" />} 
                            player={topScorer} 
                            value={getStatValue(topScorer, 'score')} 
                            label="Points"
                            color="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800"
                        />
                        <TopPlayerCard 
                            title="Best Blocker" 
                            icon={<Shield size={16} className="text-emerald-600 dark:text-emerald-400" />} 
                            player={topBlocker} 
                            value={getStatValue(topBlocker, 'block')} 
                            label="Blocks"
                            color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                        />
                        <TopPlayerCard 
                            title="Best Server" 
                            icon={<Activity size={16} className="text-blue-600 dark:text-blue-400" />} 
                            player={topServer} 
                            value={getStatValue(topServer, 'serve')} 
                            label="Aces"
                            color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                        />
                        <TopPlayerCard 
                            title="Best Defender" 
                            icon={<Star size={16} className="text-purple-600 dark:text-purple-400" />} 
                            player={topDefender} 
                            value={getStatValue(topDefender, 'dig')} 
                            label="Digs"
                            color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800"
                        />
                    </div>
                )}

                {filteredStats.length === 0 ? <EmptyState text={statsGenderFilter === 'All' ? "No player stats available." : "No players found for this filter."} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-bold tracking-wider">Player</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Attack Kills">Kills</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Attack Errors">Errors</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Attack Efficiency">Eff %</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Kill Blocks">Blocks</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Service Aces">Aces</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Digs">Digs</th>
                                    <th scope="col" className="px-4 py-3 font-bold tracking-wider text-center" title="Receptions">Receptions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredStats.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                    {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <User size={20} className="text-gray-400 m-auto"/>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-gray-100">#{p.number} {p.first_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-gray-800 dark:text-gray-200">{p.attack_kills}</td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-red-500 dark:text-red-400">{p.attack_errors}</td>
                                        <td className={`px-4 py-4 text-center font-mono font-bold ${parseFloat(p.attack_efficiency) >= 25 ? 'text-green-500' : parseFloat(p.attack_efficiency) > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>{p.attack_efficiency}%</td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-gray-800 dark:text-gray-200">{p.block_points}</td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-gray-800 dark:text-gray-200">{p.serve_aces}</td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-gray-800 dark:text-gray-200">{p.digs}</td>
                                        <td className="px-4 py-4 text-center font-mono font-medium text-gray-800 dark:text-gray-200">{p.receptions}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

        {/* ========================== COMPETITIONS TAB ========================== */}
        {activeTab === 'competitions' && (
             <div className="space-y-8">
                {/* My Competitions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/30">
                        <Trophy className="text-indigo-600 dark:text-indigo-400" size={20}/>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">My Competitions</h3>
                    </div>
                    {myCompetitions.length === 0 ? <EmptyState text="You haven't joined any competitions yet." /> : (
                         <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {myCompetitions.map(c => (
                                <div key={c.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{c.title || c.name}</h4>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700 text-[10px] font-bold uppercase rounded">Registered</span>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(c.start_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><MapPin size={14}/> {c.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                                        <button className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm">
                                            View Schedule
                                        </button>
                                        <button 
                                            onClick={() => handleLeaveCompetition(c.id)}
                                            className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 shadow-sm flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Leave
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                </div>

                {/* Open for Registration */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Activity className="text-green-500" size={20}/> Open for Registration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {openCompetitions.length === 0 ? (
                            <div className="col-span-full bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-400">
                                No competitions open right now.
                            </div>
                        ) : (
                            openCompetitions.map(c => (
                                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-700/50 transition flex flex-col">
                                    <div className="h-2 bg-indigo-500"></div>
                                    <div className="p-6 flex-1">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{c.title || c.name}</h4>
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                            <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400"/> {new Date(c.start_date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> {c.location}</div>
                                            <div className="flex items-center gap-2"><Shield size={16} className="text-gray-400"/> {c.sport} ({c.gender})</div>
                                        </div>
                                        <button 
                                            onClick={() => handleJoinCompetition(c.id)}
                                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            Join Now
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* ========================== SCHEDULE TAB ========================== */}
        {activeTab === 'schedule' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/30">
                    <Calendar className="text-indigo-600 dark:text-indigo-400" size={20}/>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Match Schedule</h3>
                </div>
                {myMatches.length === 0 ? <EmptyState text="No matches scheduled." /> : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {myMatches.map(m => (
                            <div key={m.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase rounded">{m.competition_name || 'Competition'}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${m.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-1">
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {m.home_team} <span className="text-gray-400 mx-2">vs</span> {m.away_team}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Calendar size={14}/> {m.start_time ? new Date(m.start_time).toLocaleString() : 'TBD'}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14}/> {m.location || 'TBD'}</span>
                                    </div>
                                </div>
                                {m.status === 'completed' && (
                                    <div className="text-2xl font-black text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                        {m.home_set_score} - {m.away_set_score}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </main>

      {/* Edit Team Modal */}
      {isEditingTeam && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Edit Team Info</h3>
                    <button onClick={() => setIsEditingTeam(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleUpdateTeam} className="space-y-4">
                        <Input label="Team Name" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required />
                        <Input label="Team Code (Abbr)" value={teamForm.code} onChange={e => setTeamForm({...teamForm, code: e.target.value})} required />
                        <Input label="Logo URL" value={teamForm.logo_url} onChange={e => setTeamForm({...teamForm, logo_url: e.target.value})} placeholder="https://..." />
                        
                        <Button type="submit" label="Save Changes" full />
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Player Stats Modal */}
      {viewingStatsPlayer && statsData && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <BarChart2 size={24} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{viewingStatsPlayer.first_name} {viewingStatsPlayer.last_name}</h3>
                            <p className="text-xs text-indigo-100 opacity-90">#{viewingStatsPlayer.number} • {viewingStatsPlayer.position}</p>
                        </div>
                    </div>
                    <button onClick={() => { setViewingStatsPlayer(null); setStatsData(null); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Attack Stats */}
                    <div className="col-span-2 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800/50">
                        <h4 className="text-rose-600 dark:text-rose-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                            <Swords size={16}/> Attack
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div><div className="text-2xl font-black text-gray-800 dark:text-gray-100">{statsData.attack_kills ?? 0}</div><div className="text-xs text-gray-500">Kills</div></div>
                            <div><div className="text-2xl font-black text-gray-800 dark:text-gray-100">{statsData.attack_errors ?? 0}</div><div className="text-xs text-gray-500">Errors</div></div>
                            <div><div className={`text-2xl font-black ${
                                parseFloat(statsData.attack_efficiency ?? 0) >= 40 ? 'text-emerald-600 dark:text-emerald-400' :
                                parseFloat(statsData.attack_efficiency ?? 0) >= 25 ? 'text-green-600 dark:text-green-400' :
                                parseFloat(statsData.attack_efficiency ?? 0) >= 10 ? 'text-blue-600 dark:text-blue-400' :
                                parseFloat(statsData.attack_efficiency ?? 0) >= 0 ? 'text-gray-800 dark:text-gray-100' :
                                'text-red-500 dark:text-red-400'
                            }`}>{statsData.attack_efficiency ?? 0}%</div><div className="text-xs text-gray-500">Eff</div></div>
                        </div>
                    </div>

                    {/* Block Stats */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                            <Shield size={16}/> Block
                        </h4>
                        <div className="text-center">
                            <div className="text-3xl font-black text-gray-800 dark:text-gray-100">{statsData.block_points ?? 0}</div>
                            <div className="text-xs text-gray-500">Kill Blocks</div>
                        </div>
                    </div>

                    {/* Serve Stats */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <h4 className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                            <Activity size={16}/> Serve
                        </h4>
                        <div className="flex justify-around text-center">
                            <div><div className="text-xl font-black text-gray-800 dark:text-gray-100">{statsData.serve_aces ?? 0}</div><div className="text-[10px] text-gray-500">Aces</div></div>
                            <div><div className="text-xl font-black text-gray-800 dark:text-gray-100">{statsData.serve_errors ?? 0}</div><div className="text-[10px] text-gray-500">Err</div></div>
                        </div>
                    </div>

                    {/* Defense Stats */}
                    <div className="col-span-2 md:col-span-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-around items-center">
                        <div className="text-center">
                            <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{statsData.digs ?? 0}</div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Digs</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{statsData.receptions ?? 0}</div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Receptions</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{statsData.total_actions ?? 0}</div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Total Actions</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---

function FilterButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                active 
                ? 'bg-indigo-600 text-white shadow' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );
}

function Input({ label, type="text", value, onChange, required, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{label}</label>
            <input type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" 
            />
        </div>
    );
}

function TopPlayerCard({ title, icon, player, value, label, color }) {
    // ถ้าไม่มีข้อมูล หรือค่าเป็น 0 ให้แสดงแบบจางๆ
    if (!player || value === 0) return (
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${color} opacity-50`}>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">{icon}</div>
            <div>
                <div className="text-xs font-bold uppercase opacity-70">{title}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">-</div>
            </div>
        </div>
    );

    return (
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${color} transition-transform hover:scale-105 shadow-sm`}>
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                    {player.photo ? (
                        <img 
                            src={player.photo} 
                            alt={player.first_name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {e.target.style.display = 'none'}}
                        />
                    ) : (
                        <User size={20} className="text-gray-400" />
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                    {icon}
                </div>
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-70 mb-0.5 tracking-wider">{title}</div>
                <div className="font-bold text-gray-900 dark:text-gray-100 leading-tight truncate text-sm">
                    {player.first_name} {player.last_name}
                </div>
                <div className="text-xs font-medium mt-0.5 text-gray-600 dark:text-gray-300">
                    <span className="text-lg font-black">{value}</span> {label}
                </div>
            </div>
        </div>
    );
}

function Button({ type, label, icon, full, className }) {
    return (
        <button type={type} className={`${className || "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200"} text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 ${full ? 'w-full' : ''}`}>
            {icon} {label}
        </button>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                ${active 
                    ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
            `}
        >
            <span className={`${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`}>
                {icon}
            </span>
            {label}
        </button>
    );
}

function Badge({ text, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${colors[color] || colors.gray}`}>{text}</span>;
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{text}</p>
        </div>
    );
}
