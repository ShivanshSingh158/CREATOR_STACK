/**
 * scripts/seed.js — Development-only Firestore seeder
 * 
 * Usage:
 *   Set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, etc. in your environment
 *   then run: node scripts/seed.js
 * 
 * WARNING: Never run this against production with real user data.
 * WARNING: This will DELETE all existing creators and replace them with test data.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';

// ✅ Credentials loaded from environment — not hardcoded
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('ERROR: Set FIREBASE_API_KEY and other env vars before running seed.js');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Realistic test data generator ─────────────────────────────────────────
const generateCreator = (niche, i) => {
  const followers = Math.floor(Math.random() * 40000) + 10000;
  const engagement_rate = parseFloat((Math.random() * 8 + 4).toFixed(1));
  const avg_views = Math.floor(followers * (Math.random() * 0.4 + 0.15));
  const platforms = ['YouTube', 'Instagram', 'LinkedIn'];
  const languages = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu'];
  const platform = niche === 'B2B Tech' ? 'LinkedIn' : platforms[Math.floor(Math.random() * platforms.length)];
  const language = languages[Math.floor(Math.random() * languages.length)];
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Karan', 'Anjali', 'Siddharth', 'Neha', 'Vikram', 'Pooja'];
  const lastNames = ['Sharma', 'Singh', 'Patel', 'Gupta', 'Verma', 'Kumar', 'Desai', 'Reddy', 'Iyer', 'Das'];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const handle = `@${name.replace(' ', '').toLowerCase()}${Math.floor(Math.random() * 100)}`;
  return { name, handle, niche, followers, platform, language, avg_views, engagement_rate };
};

const niches = [
  'Technology', 'Personal Finance', 'Finance', 'Beauty & Skincare',
  'EdTech', 'Fashion', 'Gaming', 'Food', 'Fitness', 'Lifestyle', 'B2B Tech',
];

const allCreators = niches.flatMap(niche => Array.from({ length: 10 }, (_, i) => generateCreator(niche, i)));

async function seed() {
  console.log('Seeding Firestore with test creators...');
  const creatorsCol = collection(db, 'creators');
  const snapshot = await getDocs(creatorsCol);
  console.log(`Deleting ${snapshot.docs.length} existing test creators...`);
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, 'creators', document.id));
  }

  console.log(`Inserting ${allCreators.length} test creators...`);
  for (let i = 0; i < allCreators.length; i++) {
    const creator = allCreators[i];
    const baseRate = 5000 + (creator.followers * 0.4) + (creator.engagement_rate * 1200);
    const fair_rate_inr = Math.floor(baseRate / 100) * 100;
    await setDoc(doc(creatorsCol, `creator_${i + 1}`), {
      ...creator,
      id: `creator_${i + 1}`,
      follower_count: creator.followers,
      // ✅ Fixed: test data is clearly marked as NOT verified
      // Real creators must go through OAuth + admin review
      is_verified: false,
      kycStatus: 'test_data',
      channelVerified: false,
      panVerified: false,
      upiVerified: false,
      fair_rate_inr,
    });
  }
  console.log(`Done! Seeded ${allCreators.length} test creators.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
