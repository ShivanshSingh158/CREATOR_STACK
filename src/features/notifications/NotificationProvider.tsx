import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  onClickUrl?: string;
  timestamp: Date;
}

interface NotificationContextType {
  showNotification: (title: string, message: string, onClickUrl?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initialLoadRef = useRef(true);

  const showNotification = (title: string, message: string, onClickUrl?: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      onClickUrl,
      timestamp: new Date(),
    };
    
    setNotifications((prev) => [...prev, newNotif]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeNotification(newNotif.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (!currentUser || !userRole) return;

    const roleField = userRole === 'brand' ? 'brandId' : 'creatorId';
    const q = query(collection(db, 'chats'), where(roleField, '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Prevent showing toasts for existing messages on first load
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          
          // Only notify if there's a new message and we didn't send it
          if (data.lastMessageSenderId && data.lastMessageSenderId !== currentUser.uid) {
            
            // Try to fetch the other party's name
            let senderName = 'Someone';
            try {
              if (userRole === 'brand') {
                const creatorSnap = await getDoc(doc(db, 'creators', data.creatorId));
                if (creatorSnap.exists()) {
                  senderName = creatorSnap.data().name || 'Creator';
                }
              } else {
                const campaignSnap = await getDoc(doc(db, 'campaigns', data.campaignId));
                if (campaignSnap.exists()) {
                  senderName = campaignSnap.data().brandName || 'Brand';
                }
              }
            } catch (error) {
              console.error("Failed to fetch sender name for notification", error);
            }

            showNotification(
              `New Message from ${senderName}`, 
              data.lastMessage, 
              '/messages'
            );
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-20 right-4 md:right-8 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            onClick={() => {
              if (notif.onClickUrl) navigate(notif.onClickUrl);
              removeNotification(notif.id);
            }}
            className="pointer-events-auto bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-[slideLeft_0.3s_ease-out] cursor-pointer hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-start gap-3 relative"
          >
            <div className="bg-indigo-100 border-2 border-black rounded-lg p-2 shrink-0">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="text-black font-black text-sm uppercase tracking-wider">{notif.title}</h4>
              <p className="text-gray-600 text-xs font-medium mt-1 truncate">{notif.message}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notif.id);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
