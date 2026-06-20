import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { Send, MessageSquare, Clock, ArrowLeft, AlertCircle, Lock, Wallet } from 'lucide-react';
import { format } from 'date-fns';

// ──────────────────────────────────────────────
// Escrow gate modal — shown when brand tries to
// initiate a deal room without sufficient funds
// ──────────────────────────────────────────────
function EscrowGateModal({
  campaignBudget,
  walletBalance,
  onClose,
  onDeposit,
}: {
  campaignBudget: number;
  walletBalance: number;
  onClose: () => void;
  onDeposit: () => void;
}) {
  const shortfall = campaignBudget - walletBalance;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Wallet className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black uppercase tracking-tight">
              Fund Your Escrow Wallet
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Required before initiating a deal
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              Campaign Budget
            </span>
            <span className="text-sm font-black text-black">
              ₹{campaignBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              Wallet Balance
            </span>
            <span className="text-sm font-black text-black">
              ₹{walletBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-50 border-2 border-red-500 rounded-lg shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              Shortfall
            </span>
            <span className="text-sm font-black text-red-700">
              ₹{shortfall.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-6 text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
          <AlertCircle className="w-4 h-4 inline mr-1.5 mb-0.5" />
          Creators can only enter a deal room when your escrow wallet has sufficient funds. This
          protects creators from doing work without guaranteed payment.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onDeposit}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest border-2 border-black bg-indigo-600 text-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 transition-all"
          >
            Deposit Funds →
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function MessageDashboard() {
  const { currentUser, userRole, userProfile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'primary' | 'pitches'>('primary');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escrow gate state
  const [escrowGate, setEscrowGate] = useState<{
    show: boolean;
    campaignBudget: number;
    walletBalance: number;
    targetUrl: string;
  } | null>(null);

  // ── Fetch Chats ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const roleField = userRole === 'brand' ? 'brandId' : 'creatorId';
    const q = query(collection(db, 'chats'), where(roleField, '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData: Record<string, any>[] = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          let otherPartyName = 'Unknown';
          let otherPartyImage = '';

          if (userRole === 'brand') {
            const creatorSnap = await getDoc(doc(db, 'creators', data.creatorId));
            if (creatorSnap.exists()) {
              const d = creatorSnap.data();
              otherPartyName = d.name;
              otherPartyImage = d.youtubeData?.thumbnailUrl || d.channelThumbnail || '';
            }
          } else {
            const campaignSnap = await getDoc(doc(db, 'campaigns', data.campaignId));
            if (campaignSnap.exists()) {
              const d = campaignSnap.data();
              otherPartyName = d.brandName || 'Brand';
              otherPartyImage = d.brandLogoUrl || '';
            }
          }

          return { id: chatDoc.id, otherPartyName, otherPartyImage, ...data };
        }),
      );

      chatsData.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  // ── Fetch Messages for Active Chat ───────────
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'messages'), where('chatId', '==', activeChat.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      msgs.sort(
        (a: any, b: any) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0),
      );
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return () => unsubscribe();
  }, [activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: activeChat.id,
        senderId: currentUser.uid,
        senderRole: userRole,
        text,
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // ── FIX: Correct chat tab logic per role ─────
  // Brand:
  //   primary  = chats the brand initiated (brand-outreach to creators)
  //   pitches  = chats creators started with the brand
  // Creator:
  //   primary  = chats brands started with the creator (inbound interest)
  //   pitches  = chats the creator started (outbound pitches)
  const filteredChats = chats.filter((chat) => {
    if (userRole === 'brand') {
      return activeTab === 'primary'
        ? chat.initiatedBy === 'brand'
        : chat.initiatedBy === 'creator';
    } else {
      // Creator view: flip — primary = brand-initiated (inbound), pitches = creator-initiated (outbound)
      return activeTab === 'primary'
        ? chat.initiatedBy === 'brand'
        : chat.initiatedBy === 'creator';
    }
  });

  const tab1Label = userRole === 'brand' ? 'My Outreach' : 'Brand Interest';
  const tab2Label = userRole === 'brand' ? 'Creator Pitches' : 'My Pitches';

  // ── Escrow gate check before opening deal room ─
  const handleInitiateContract = async (chat: any) => {
    if (userRole !== 'brand') return;

    // Fetch campaign budget
    let campaignBudget = 0;
    try {
      const campaignSnap = await getDoc(doc(db, 'campaigns', chat.campaignId));
      if (campaignSnap.exists()) {
        const data = campaignSnap.data();
        const raw =
          typeof data.budget === 'number'
            ? data.budget
            : parseInt((data.budget || '0').toString().replace(/[^0-9]/g, '') || '0');
        campaignBudget = raw;
      }
    } catch {
      /* non-fatal */
    }

    // Get brand wallet balance
    const walletBalance = userProfile?.escrowWallet?.availableBalance || 0;

    if (walletBalance < campaignBudget && campaignBudget > 0) {
      setEscrowGate({
        show: true,
        campaignBudget,
        walletBalance,
        targetUrl: `/deal-room/${chat.campaignId}/${chat.creatorId}`,
      });
      return;
    }

    // Sufficient balance — navigate
    navigate(`/deal-room/${chat.campaignId}/${chat.creatorId}`);
  };

  return (
    <div
      className="flex h-[calc(100vh-80px)] bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Escrow Gate Modal ── */}
      {escrowGate?.show && (
        <EscrowGateModal
          campaignBudget={escrowGate.campaignBudget}
          walletBalance={escrowGate.walletBalance}
          onClose={() => setEscrowGate(null)}
          onDeposit={() => {
            setEscrowGate(null);
            navigate('/wallet');
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div className="w-full md:w-80 lg:w-96 border-r-2 border-black flex flex-col bg-white">
        <div className="p-4 border-b-2 border-black bg-white">
          <h1 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">Messages</h1>
          <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 text-xs font-black py-2 rounded-lg uppercase tracking-widest transition-colors ${activeTab === 'primary' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black' : 'border-2 border-transparent text-slate-600 hover:text-black'}`}
            >
              {tab1Label}
            </button>
            <button
              onClick={() => setActiveTab('pitches')}
              className={`flex-1 text-xs font-black py-2 rounded-lg uppercase tracking-widest transition-colors ${activeTab === 'pitches' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black' : 'border-2 border-transparent text-slate-600 hover:text-black'}`}
            >
              {tab2Label}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-xs font-bold uppercase tracking-widest">No messages here yet.</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b-2 border-black cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 items-start ${activeChat?.id === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'bg-white border-l-4 border-l-transparent'}`}
              >
                <img
                  src={
                    chat.otherPartyImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.otherPartyName)}&background=4f46e5&color=fff`
                  }
                  alt=""
                  className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-black text-black truncate text-sm">
                      {chat.otherPartyName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 ml-2">
                      {chat.lastMessageAt ? format(chat.lastMessageAt.toDate(), 'MMM d') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {chat.lastMessage || 'New connection'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className={`${activeChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-transparent`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden text-slate-600 hover:text-black"
                  onClick={() => setActiveChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img
                  src={
                    activeChat.otherPartyImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.otherPartyName)}&background=4f46e5&color=fff`
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="font-black text-black text-sm">{activeChat.otherPartyName}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Campaign: #{activeChat.campaignId?.substring(0, 6)}
                  </p>
                </div>
              </div>

              {/* Deal room button — with escrow gate for brands */}
              {userRole === 'brand' ? (
                <button
                  onClick={() => handleInitiateContract(activeChat)}
                  className="flex items-center gap-2 bg-slate-900 border-2 border-black text-white px-4 py-2 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest"
                >
                  <Lock className="w-3.5 h-3.5" /> Initiate Contract
                </button>
              ) : (
                <Link
                  to={`/creator-deal-room/${activeChat.campaignId}`}
                  className="flex items-center gap-2 bg-indigo-600 border-2 border-black text-white px-4 py-2 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest"
                >
                  View Deal Room
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.uid;
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-5 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' : 'bg-white text-black rounded-2xl rounded-bl-sm'}`}
                    >
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      <span
                        className={`text-[10px] font-bold mt-1 block uppercase tracking-wider ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}
                      >
                        {msg.timestamp ? format(msg.timestamp.toDate(), 'h:mm a') : 'Sending...'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t-2 border-black">
              <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:border-indigo-600 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-14 h-[52px] rounded-xl bg-indigo-600 border-2 border-black text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-black mb-2 uppercase tracking-tight">
              Your Messages
            </h2>
            <p className="text-slate-600 font-semibold text-center max-w-md text-sm">
              Select a conversation from the sidebar to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
