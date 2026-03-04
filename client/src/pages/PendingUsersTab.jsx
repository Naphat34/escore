import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { Toast, ActionButton, EmptyState } from './AdminShared';
import Swal from 'sweetalert2';

export default function PendingUsersTab({ darkMode }) {
    const [pendingUsers, setPendingUsers] = useState([]);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.getPendingUsers();
            setPendingUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleApprove = async (id, status) => {
        if (status === 'rejected') {
            const result = await Swal.fire({
                title: 'Reject User?',
                text: "Are you sure you want to reject this user?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, Reject'
            });
            if (!result.isConfirmed) return;
        }
        try {
            await api.approveUser(id, status);
            Toast.fire({ icon: 'success', title: `User ${status}` });
            fetchPendingUsers();
        } catch (err) { 
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Action failed' }); 
        }
    };

    return (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                <h3 className="font-bold flex items-center gap-2">
                    <Users size={18} className="text-gray-400"/> Pending Approvals
                </h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">{pendingUsers.length} Requests</span>
            </div>
            {pendingUsers.length === 0 ? <EmptyState text="No pending requests." darkMode={darkMode}/> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold uppercase">User</th>
                                <th className="px-6 py-3 text-xs font-bold uppercase">Role</th>
                                <th className="px-6 py-3 text-xs font-bold uppercase">Team</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {pendingUsers.map(u => (
                                <tr key={u.id} className={`transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 font-medium">{u.username} <span className="text-xs text-gray-400 block">{u.email}</span></td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">{u.role}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.team_name || '-'}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <ActionButton onClick={() => handleApprove(u.id, 'approved')} color="green" icon={<CheckCircle size={16}/>} label="Approve" />
                                        <ActionButton onClick={() => handleApprove(u.id, 'rejected')} color="red" icon={<XCircle size={16}/>} label="Reject" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}