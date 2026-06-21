import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Plus, Trash2, Shield, User, Mail, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'manager' | 'admin';
}

export default function TeamSettings() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'manager' | 'admin'>('manager');

  useEffect(() => {
    if (userRole !== 'creator') {
      navigate('/login');
      return;
    }

    const fetchTeam = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'creators', currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.teamMembers) {
            setTeam(data.teamMembers);
          }
        }
      } catch (err) {
        console.error('Error fetching team:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [currentUser, userRole, navigate]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: newName,
      email: newEmail,
      role: newRole,
    };

    setTeam([...team, newMember]);
    setNewName('');
    setNewEmail('');
    setNewRole('manager');
  };

  const handleRemoveMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'creators', currentUser.uid), { teamMembers: team }, { merge: true });
      await setDoc(doc(db, 'users', currentUser.uid), { teamMembers: team }, { merge: true });
      alert('Team settings saved successfully!');
    } catch (err) {
      console.error('Error saving team:', err);
      alert('Failed to save team settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-[#e8473f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] layout-creator font-['Inter'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black uppercase tracking-tight flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#e8473f]" /> Team Settings
          </h1>
          <p className="text-gray-600 font-medium">
            Add managers and editors to your CreatorStack organisation.
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8">
          <div className="p-6 border-b-2 border-black bg-gray-50">
            <h2 className="text-xl font-black uppercase tracking-widest text-black flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add New Member
            </h2>
          </div>
          <form onSubmit={handleAddMember} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border-2 border-black text-black pl-10 pr-4 py-3 rounded-lg focus:border-[#e8473f] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border-2 border-black text-black pl-10 pr-4 py-3 rounded-lg focus:border-[#e8473f] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-white border-2 border-black text-black pl-10 pr-4 py-3 rounded-lg focus:border-[#e8473f] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-black text-white font-black px-6 py-3 rounded-lg uppercase tracking-widest text-xs flex items-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" /> Add to Team
            </button>
          </form>
        </div>

        <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="p-6 border-b-2 border-black bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-black flex items-center gap-2">
              <Users className="w-5 h-5" /> Current Members ({team.length})
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#e8473f] hover:bg-[#c73530] text-white font-black px-6 py-2.5 rounded-lg uppercase tracking-widest text-xs flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
          
          {team.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500 font-bold uppercase tracking-widest">No team members added yet.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {team.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-black text-black text-lg">{member.name}</span>
                    <span className="text-sm font-medium text-gray-500">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      member.role === 'admin' ? 'bg-[#fca5a5] text-red-900' :
                      member.role === 'manager' ? 'bg-[#93c5fd] text-blue-900' :
                      'bg-[#a7f3d0] text-emerald-900'
                    }`}>
                      {member.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
