export const dummyBrands = [
  { id: 'b1', name: 'TechMart India', industry: 'E-commerce', description: 'Leading electronics retailer.', website: 'techmart.in', trustScore: 98 },
  { id: 'b2', name: 'FitLife Foods', industry: 'Health & Wellness', description: 'Organic protein bars and supplements.', website: 'fitlifefoods.co.in', trustScore: 95 },
  { id: 'b3', name: 'StyleNova', industry: 'Fashion', description: 'Trendy fast-fashion for Gen Z.', website: 'stylenova.com', trustScore: 88 },
  { id: 'b4', name: 'FinEase', industry: 'Fintech', description: 'Investing made easy for millennials.', website: 'finease.in', trustScore: 92 },
  { id: 'b5', name: 'WanderLust Stays', industry: 'Travel', description: 'Boutique homestays across India.', website: 'wanderluststays.in', trustScore: 90 },
  // Adding 15 more generic ones
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `b${i+6}`,
    name: `Brand ${i+6}`,
    industry: ['Tech', 'Beauty', 'Food', 'Gaming'][i % 4],
    description: `Awesome brand ${i+6} looking for creators.`,
    website: `brand${i+6}.com`,
    trustScore: 80 + (i % 20)
  }))
];

export const dummyCreators = [
  { id: 'c1', name: 'Rohan Tech', niche: 'Technology', followers: '1.2M', engagementRate: '5.4%', bio: 'Tech reviews and unboxing.' },
  { id: 'c2', name: 'Sneha Styles', niche: 'Fashion', followers: '850K', engagementRate: '6.1%', bio: 'Everyday fashion and styling tips.' },
  { id: 'c3', name: 'GamerX', niche: 'Gaming', followers: '2.1M', engagementRate: '8.2%', bio: 'Pro BGMI player and streamer.' },
  { id: 'c4', name: 'Chef Karan', niche: 'Food', followers: '500K', engagementRate: '4.8%', bio: 'Easy home recipes and street food reviews.' },
  { id: 'c5', name: 'Finance with Priya', niche: 'Finance', followers: '1.5M', engagementRate: '7.5%', bio: 'Demystifying personal finance.' },
  // Adding 45 more generic ones
  ...Array.from({ length: 45 }, (_, i) => ({
    id: `c${i+6}`,
    name: `Creator ${i+6}`,
    niche: ['Tech', 'Fashion', 'Gaming', 'Food', 'Fitness', 'Finance'][i % 6],
    followers: `${(Math.random() * 5).toFixed(1)}M`,
    engagementRate: `${(Math.random() * 5 + 3).toFixed(1)}%`,
    bio: `Content creator specializing in ${['Tech', 'Fashion', 'Gaming', 'Food', 'Fitness', 'Finance'][i % 6]}.`
  }))
];

export const dummyCampaigns = [
  { id: 'camp1', brandId: 'b1', brandName: 'TechMart India', title: 'Diwali Electronics Sale', description: 'Promote our upcoming Diwali sale. We need a 60s dedicated integration.', budget: '₹50,000', deadline: '2023-10-15', deliverables: '1 YouTube Integration, 1 Insta Story', niche: 'Technology' },
  { id: 'camp2', brandId: 'b2', brandName: 'FitLife Foods', title: 'New Protein Bar Launch', description: 'Try our new protein bar and share your honest review.', budget: '₹30,000', deadline: '2023-11-01', deliverables: '1 Instagram Reel', niche: 'Health & Wellness' },
  { id: 'camp3', brandId: 'b4', brandName: 'FinEase', title: 'SIP Awareness Drive', description: 'Educate your audience about the benefits of starting a SIP early.', budget: '₹80,000', deadline: '2023-09-30', deliverables: '1 YouTube Dedicated Video', niche: 'Finance' },
  // Adding 27 more
  ...Array.from({ length: 27 }, (_, i) => ({
    id: `camp${i+4}`,
    brandId: `b${(i % 20) + 1}`,
    brandName: dummyBrands[i % 20]?.name || `Brand ${i}`,
    title: `Campaign ${i+4}`,
    description: `We are looking for creators to help promote our new products. Join our campaign.`,
    budget: `₹${(Math.floor(Math.random() * 10) + 2) * 10},000`,
    deadline: `2024-12-${Math.floor(Math.random() * 28) + 1}`,
    deliverables: `${(i % 3) + 1} Instagram Reel(s)`,
    niche: ['Technology', 'Fashion', 'Health & Wellness', 'Finance', 'Gaming'][i % 5]
  }))
];
