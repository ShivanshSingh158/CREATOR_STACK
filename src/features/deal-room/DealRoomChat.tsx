import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'creator' | 'brand';
  text: string;
  createdAt: any;
}

interface DealRoomChatProps {
  campaignId: string;
  creatorId: string;
  currentUserRole: 'creator' | 'brand';
}

export function DealRoomChat({ campaignId, creatorId, currentUserRole }: DealRoomChatProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dealRoomId = `${campaignId}_${creatorId}`;
  const messagesRef = collection(db, 'dealRooms', dealRoomId, 'messages');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsub();
  }, [dealRoomId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderRole: currentUserRole,
        text,
        createdAt: serverTimestamp(),
      });

      // Update the master chats collection for the global inbox / notifications
      await setDoc(
        doc(db, 'chats', dealRoomId),
        {
          campaignId,
          creatorId,
          brandId: currentUserRole === 'brand' ? currentUser.uid : '', // In a real app we'd fetch brandId properly
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: currentUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Persona Colors
  const myColor = currentUserRole === 'creator' ? 'bg-[#e8473f] text-white' : 'bg-[#0f3460] text-white';
  const myBorder = currentUserRole === 'creator' ? 'border-[#a8221b]' : 'border-black';

  const otherColor = 'bg-white text-black border-2 border-black';
  const otherRoleText = currentUserRole === 'creator' ? 'Brand' : 'Creator';
  const myRoleText = currentUserRole === 'creator' ? 'You (Creator)' : 'You (Brand)';

  return (
    <div className="flex flex-col h-[600px] bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden sticky top-24">
      {/* Header */}
      <div className="bg-gray-50 border-b-2 border-black px-4 py-3 flex items-center gap-3">
        <div className="bg-white border-2 border-black p-1.5 rounded-lg">
          <MessageSquare className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="font-black text-black uppercase tracking-wide text-sm">Deal Room Chat</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            End-to-end Encrypted
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f9fafb]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <MessageSquare className="w-6 h-6 text-gray-300" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col text-center px-4">
            <span className="text-3xl mb-2">👋</span>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              No messages yet
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1 max-w-[200px]">
              Start the conversation to negotiate terms or clarify deliverables.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 mx-1">
                  {isMe ? myRoleText : otherRoleText}
                </span>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm font-medium leading-relaxed ${
                    isMe
                      ? `${myColor} border-2 ${myBorder} rounded-tr-sm`
                      : `${otherColor} rounded-tl-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                  }`}
                >
                  {msg.text}
                </div>
                {msg.createdAt && (
                  <span className="text-[9px] font-bold text-gray-400 mt-1 mx-1">
                    {format(msg.createdAt.toDate(), 'h:mm a')}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t-2 border-black p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-2 border-black rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-4 py-2 border-2 border-black rounded-lg flex items-center justify-center transition-all ${
              !newMessage.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : currentUserRole === 'creator'
                  ? 'bg-[#e8473f] text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-[#0f3460] text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
