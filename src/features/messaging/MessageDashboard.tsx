import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Send, User, MessageSquare, Clock, Search, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function MessageDashboard() {
  const { currentUser, userRole } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'primary' | 'pitches'>('primary');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Chats
  useEffect(() => {
    if (!currentUser) return;

    const roleField = userRole === 'brand' ? 'brandId' : 'creatorId';
    const q = query(collection(db, 'chats'), where(roleField, '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        
        // Fetch the OTHER party's profile info
        let otherPartyName = 'Unknown';
        let otherPartyImage = '';
        
        if (userRole === 'brand') {
          const creatorSnap = await getDoc(doc(db, 'creators', data.creatorId));
          if (creatorSnap.exists()) {
            otherPartyName = creatorSnap.data().name;
            otherPartyImage = creatorSnap.data().profile_image_url;
          }
        } else {
          // If we are creator, we'd fetch brand info. For now we use brandId or Campaign Name.
          const campaignSnap = await getDoc(doc(db, 'campaigns', data.campaignId));
          if (campaignSnap.exists()) {
            otherPartyName = campaignSnap.data().brandName || 'Brand';
          }
        }

        return {
          id: chatDoc.id,
          otherPartyName,
          otherPartyImage,
          ...data
        };
      }));

      // Sort by lastMessageAt descending
      chatsData.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  // Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'), 
      where('chatId', '==', activeChat.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (userRole === 'brand') {
      return activeTab === 'primary' ? chat.initiatedBy === 'brand' : chat.initiatedBy === 'creator';
    } else {
      return activeTab === 'primary' ? chat.initiatedBy === 'brand' : chat.initiatedBy === 'creator';
    }
  });

  const tab1Label = userRole === 'brand' ? 'Primary (Interested)' : 'Brand Interest';
  const tab2Label = userRole === 'brand' ? 'Creator Pitches' : 'My Pitches';

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r-2 border-black flex flex-col bg-white">
        <div className="p-4 border-b-2 border-black bg-white">
          <h1 className="text-2xl font-black text-black mb-4">Messages</h1>
          <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button 
              onClick={() => setActiveTab('primary')}
              className={`flex-1 text-sm font-bold py-2 rounded-lg transition-colors ${activeTab === 'primary' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black' : 'border-2 border-transparent text-slate-600 hover:text-black'}`}
            >
              {tab1Label}
            </button>
            <button 
              onClick={() => setActiveTab('pitches')}
              className={`flex-1 text-sm font-bold py-2 rounded-lg transition-colors ${activeTab === 'pitches' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black' : 'border-2 border-transparent text-slate-600 hover:text-black'}`}
            >
              {tab2Label}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No messages in this folder.</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b-2 border-black cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 items-start ${activeChat?.id === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'bg-white border-l-4 border-l-transparent'}`}
              >
                <img 
                  src={chat.otherPartyImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.otherPartyName)}&background=4f46e5&color=fff`} 
                  alt="" 
                  className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-black truncate">{chat.otherPartyName}</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 ml-2">
                      {chat.lastMessageAt ? format(chat.lastMessageAt.toDate(), 'MMM d') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate font-medium">{chat.lastMessage || 'New connection'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${activeChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-transparent`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-600 hover:text-black" onClick={() => setActiveChat(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img 
                  src={activeChat.otherPartyImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.otherPartyName)}&background=4f46e5&color=fff`} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <div>
                  <h2 className="font-bold text-black">{activeChat.otherPartyName}</h2>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Campaign: #{activeChat.campaignId.substring(0,6)}
                  </p>
                </div>
              </div>
              {userRole === 'brand' ? (
                <Link to={`/deal-room/${activeChat.campaignId}/${activeChat.creatorId}`} className="bg-slate-900 border-2 border-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Initiate Contract
                </Link>
              ) : (
                <Link to={`/creator-deal-room/${activeChat.campaignId}`} className="bg-indigo-600 border-2 border-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
                  View Deal Room
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.uid;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-5 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                        : 'bg-white text-black rounded-2xl rounded-bl-sm'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] font-bold mt-1 block uppercase tracking-wider ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
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
                  className="w-14 h-[52px] rounded-xl bg-indigo-600 border-2 border-black text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
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
            <h2 className="text-xl font-black text-black mb-2">Your Messages</h2>
            <p className="text-slate-600 font-semibold text-center max-w-md text-sm">Select a conversation from the sidebar to view your messages or start chatting.</p>
          </div>
        )}
      </div>

    </div>
  );
}
