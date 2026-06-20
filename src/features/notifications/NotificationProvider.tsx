/**
 * NotificationProvider.tsx — Firebase Cloud Messaging (FCM) stub.
 * 
 * STATUS: Stub — not yet activated.
 * 
 * When activated, this provider will:
 * 1. Request notification permission on first authenticated load
 * 2. Store FCM token in Firestore (users/{uid}/fcmToken)
 * 3. Listen for foreground messages and show in-app toasts
 * 
 * Backend Cloud Functions needed:
 * - sendDealUpdate(dealId, message) → notifies both parties
 * - sendEscrowReleased(creatorId, amount) → notifies creator
 * - sendNewApplication(brandId, campaignId) → notifies brand
 * 
 * To activate:
 * 1. Enable FCM in Firebase Console
 * 2. Add VITE_FCM_VAPID_KEY to .env
 * 3. Create public/firebase-messaging-sw.js service worker
 * 4. Uncomment the initialization code below
 */
import React from 'react';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  // TODO: Initialize FCM here when VITE_FCM_VAPID_KEY is configured
  // useEffect(() => {
  //   const messaging = getMessaging(firebaseApp);
  //   const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_KEY });
  //   await updateDoc(doc(db, 'users', currentUser.uid), { fcmToken: token });
  //   onMessage(messaging, (payload) => { showToast(payload.notification?.body); });
  // }, [currentUser]);

  return <>{children}</>;
}
