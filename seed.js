import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSOCBgOnqgWEYPnJ9z0_vcf3TJVNAmDDA",
  authDomain: "creatorstack-bbcd0.firebaseapp.com",
  projectId: "creatorstack-bbcd0",
  storageBucket: "creatorstack-bbcd0.firebasestorage.app",
  messagingSenderId: "467070445325",
  appId: "1:467070445325:web:de1c8345c5f711215eb244",
  measurementId: "G-K0437TZLQ5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to generate realistic data
const generateCreator = (niche, i) => {
  const followers = Math.floor(Math.random() * 40000) + 10000; // 10k to 50k
  const engagement_rate = parseFloat((Math.random() * 8 + 4).toFixed(1)); // 4% to 12%
  const conversion_rate = parseFloat((Math.random() * 4 + 2).toFixed(1)); // 2% to 6%
  const avg_views = Math.floor(followers * (Math.random() * 0.4 + 0.15));
  const platforms = ["YouTube", "Instagram", "LinkedIn"];
  const languages = ["English", "Hindi", "Hinglish", "Tamil", "Telugu"];
  
  const platform = niche === "B2B Tech" ? "LinkedIn" : platforms[Math.floor(Math.random() * platforms.length)];
  const language = languages[Math.floor(Math.random() * languages.length)];

  // Create a realistic-sounding name
  const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Karan", "Anjali", "Siddharth", "Neha", "Vikram", "Pooja", "Arjun", "Riya"];
  const lastNames = ["Sharma", "Singh", "Patel", "Gupta", "Verma", "Kumar", "Desai", "Reddy", "Iyer", "Das"];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const handle = `@${name.replace(' ', '').toLowerCase()}${Math.floor(Math.random() * 100)}`;

  return {
    name,
    handle,
    niche,
    followers,
    platform,
    language,
    avg_views,
    engagement_rate,
    conversion_rate
  };
};

const niches = [
  "Technology", 
  "Personal Finance", 
  "Finance", 
  "Beauty & Skincare", 
  "EdTech", 
  "Fashion", 
  "Gaming", 
  "Food", 
  "Fitness", 
  "Lifestyle", 
  "B2B Tech"
];

const allCreators = [];

niches.forEach(niche => {
  for (let i = 0; i < 10; i++) {
    allCreators.push(generateCreator(niche, i));
  }
});

async function seed() {
  console.log("Seeding massive micro-creator database to Firestore...");
  const creatorsCol = collection(db, 'creators');
  
  const snapshot = await getDocs(creatorsCol);
  console.log(`Found ${snapshot.docs.length} existing creators. Deleting...`);
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, 'creators', document.id));
  }
  
  console.log(`Inserting ${allCreators.length} Indian micro-influencers (Exactly 10 per niche)...`);
  for (let i = 0; i < allCreators.length; i++) {
    const creator = allCreators[i];
    const engagementHistory = Array.from({length: 10}, () => Math.floor(creator.avg_views * (Math.random() * 0.4 + 0.8)));
    const velocities = ["Stable", "Accelerating", "Viral"];
    const baseRate = 5000 + (creator.followers * 0.4) + (creator.engagement_rate * 1200);
    const fair_rate_inr = Math.floor(baseRate / 100) * 100;
    
    await setDoc(doc(creatorsCol, `creator_${i + 1}`), {
      ...creator,
      id: `creator_${i + 1}`,
      follower_count: creator.followers, 
      velocity_score: velocities[Math.floor(Math.random() * velocities.length)],
      is_verified: Math.random() > 0.3,
      fair_rate_inr,
      engagement_history: engagementHistory
    });
  }
  console.log("Successfully seeded 110 real Indian micro-creators!");
  process.exit(0);
}

seed().catch(console.error);
