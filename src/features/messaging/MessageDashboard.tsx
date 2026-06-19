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
    <div className="flex h-[calc(100vh-80px)] bg-white font-['Outfit']">
      
      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r border-[#e5e7eb] flex flex-col bg-[#f9fafb]">
        <div className="p-4 border-b border-[#e5e7eb] bg-white">
          <h1 className="text-2xl font-black text-[#111827] mb-4">Messages</h1>
          <div className="flex bg-[#f3f4f6] p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('primary')}
              className={`flex-1 text-sm font-bold py-2 rounded-md transition-colors ${activeTab === 'primary' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6b7280] hover:text-[#111827]'}`}
            >
              {tab1Label}
            </button>
            <button 
              onClick={() => setActiveTab('pitches')}
              className={`flex-1 text-sm font-bold py-2 rounded-md transition-colors ${activeTab === 'pitches' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6b7280] hover:text-[#111827]'}`}
            >
              {tab2Label}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-[#6b7280]">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No messages in this folder.</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-[#e5e7eb] cursor-pointer hover:bg-white transition-colors flex gap-3 items-start ${activeChat?.id === chat.id ? 'bg-white border-l-4 border-l-[#d1b07c]' : 'border-l-4 border-l-transparent'}`}
              >
                <img 
                  src={chat.otherPartyImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.otherPartyName)}&background=111827&color=fff`} 
                  alt="" 
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#e5e7eb]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-[#111827] truncate">{chat.otherPartyName}</h3>
                    <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider shrink-0 ml-2">
                      {chat.lastMessageAt ? format(chat.lastMessageAt.toDate(), 'MMM d') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[#6b7280] truncate">{chat.lastMessage || 'New connection'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${activeChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-[#6b7280]" onClick={() => setActiveChat(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img 
                  src={activeChat.otherPartyImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.otherPartyName)}&background=111827&color=fff`} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb]"
                />
                <div>
                  <h2 className="font-bold text-[#111827]">{activeChat.otherPartyName}</h2>
                  <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                    Campaign: #{activeChat.campaignId.substring(0,6)}
                  </p>
                </div>
              </div>
              {userRole === 'brand' && (
                <Link to={`/deal-room/${activeChat.campaignId}/${activeChat.creatorId}`} className="bg-[#d1b07c] hover:bg-[#b59560] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Initiate Contract
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb] space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.uid;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                      isMe 
                        ? 'bg-[#111827] text-white rounded-br-sm' 
                        : 'bg-white border border-[#e5e7eb] text-[#111827] rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] font-bold mt-1 block uppercase tracking-wider ${isMe ? 'text-gray-400' : 'text-[#9ca3af]'}`}>
                        {msg.timestamp ? format(msg.timestamp.toDate(), 'h:mm a') : 'Sending...'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#e5e7eb]">
              <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-6 py-3 focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-[#d1b07c] text-white flex items-center justify-center hover:bg-[#b59560] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f9fafb]">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#e5e7eb] mb-4">
              <MessageSquare className="w-10 h-10 text-[#d1b07c]" />
            </div>
            <h2 className="text-xl font-black text-[#111827] mb-2">Your Messages</h2>
            <p className="text-[#6b7280] font-medium text-center max-w-md">Select a conversation from the sidebar to view your messages or start chatting.</p>
          </div>
        )}
      </div>

    </div>
  );
}
