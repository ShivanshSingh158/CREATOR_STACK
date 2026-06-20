export const NICHES = [
  // Gaming
  'PC Gaming',
  'Console Gaming',
  'Mobile Gaming',
  'Esports',
  'Retro Gaming',
  'VR Gaming',
  'Tabletop Gaming',

  // Tech & Software
  'Consumer Tech',
  'Tech Hardware',
  'B2B SaaS',
  'Software Development',
  'AI & Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Crypto & Web3',

  // Business & Finance
  'Personal Finance',
  'Stock Trading',
  'Real Estate Investing',
  'FinTech',
  'Entrepreneurship',
  'Marketing & SEO',
  'E-commerce',

  // Education & Productivity
  'EdTech',
  'Language Learning',
  'Productivity & Notion',
  'Career Advice',
  'Science & Engineering',
  'History & Culture',

  // Lifestyle & Vlogs
  'Daily Vlogs',
  'Travel Vlogs',
  'Van Life',
  'Minimalism',
  'Digital Nomad',
  'Parenting & Family',

  // Beauty & Fashion
  'Makeup Tutorials',
  'Skincare',
  'Streetwear',
  'High Fashion',
  'Sneakerhead',
  "Men's Grooming",

  // Health & Fitness
  'Home Workouts',
  'Bodybuilding',
  'Yoga & Mindfulness',
  'Nutrition & Diet',
  'Running & Endurance',

  // Food & Cooking
  'Home Cooking',
  'Baking',
  'Restaurant Reviews',
  'Vegan/Plant-Based',
  'Mixology & Drinks',

  // Automotive
  'Car Reviews',
  'Motorcycles',
  'Car Tuning',
  'EVs & Green Tech',

  // Entertainment & Art
  'Comedy Sketches',
  'Movie Reviews',
  'Anime & Manga',
  'Music Production',
  'Photography',
  'Videography',
  'Digital Art',
];

// Matrix mapping each niche to 3-5 overlapping/related niches
export const RELATED_NICHES: Record<string, string[]> = {
  // Gaming
  'PC Gaming': ['Tech Hardware', 'Esports', 'Software Development', 'Console Gaming'],
  'Console Gaming': ['PC Gaming', 'Esports', 'Consumer Tech', 'Retro Gaming'],
  'Mobile Gaming': ['Consumer Tech', 'Esports', 'Console Gaming'],
  Esports: ['PC Gaming', 'Console Gaming', 'Tech Hardware'],
  'Retro Gaming': ['Console Gaming', 'PC Gaming', 'Consumer Tech'],
  'VR Gaming': ['Tech Hardware', 'PC Gaming', 'Consumer Tech'],
  'Tabletop Gaming': ['Retro Gaming', 'Console Gaming'],

  // Tech & Software
  'Consumer Tech': ['Tech Hardware', 'Mobile Gaming', 'Photography', 'Videography'],
  'Tech Hardware': ['PC Gaming', 'Consumer Tech', 'VR Gaming', 'Software Development'],
  'B2B SaaS': [
    'Software Development',
    'Marketing & SEO',
    'Entrepreneurship',
    'AI & Machine Learning',
  ],
  'Software Development': ['B2B SaaS', 'AI & Machine Learning', 'Tech Hardware', 'Data Science'],
  'AI & Machine Learning': ['Data Science', 'Software Development', 'B2B SaaS'],
  'Data Science': ['AI & Machine Learning', 'Software Development', 'Personal Finance'],
  Cybersecurity: ['Software Development', 'B2B SaaS', 'Tech Hardware'],
  'Crypto & Web3': ['Personal Finance', 'Stock Trading', 'Software Development'],

  // Business & Finance
  'Personal Finance': ['Stock Trading', 'Real Estate Investing', 'FinTech', 'Crypto & Web3'],
  'Stock Trading': ['Personal Finance', 'Crypto & Web3', 'Real Estate Investing'],
  'Real Estate Investing': ['Personal Finance', 'Entrepreneurship', 'Stock Trading'],
  FinTech: ['Personal Finance', 'Stock Trading', 'Crypto & Web3', 'B2B SaaS'],
  Entrepreneurship: ['Marketing & SEO', 'B2B SaaS', 'Personal Finance', 'E-commerce'],
  'Marketing & SEO': ['Entrepreneurship', 'B2B SaaS', 'E-commerce'],
  'E-commerce': ['Marketing & SEO', 'Entrepreneurship', 'B2B SaaS'],

  // Education & Productivity
  EdTech: ['Productivity & Notion', 'Software Development', 'Science & Engineering'],
  'Language Learning': ['Travel Vlogs', 'EdTech', 'History & Culture'],
  'Productivity & Notion': ['B2B SaaS', 'Entrepreneurship', 'EdTech', 'Career Advice'],
  'Career Advice': ['Productivity & Notion', 'Entrepreneurship', 'Software Development'],
  'Science & Engineering': ['Tech Hardware', 'AI & Machine Learning', 'Data Science'],
  'History & Culture': ['Travel Vlogs', 'Science & Engineering', 'Education & EdTech'],

  // Lifestyle & Vlogs
  'Daily Vlogs': ['Travel Vlogs', 'Photography', 'Minimalism'],
  'Travel Vlogs': ['Daily Vlogs', 'Digital Nomad', 'Photography', 'Van Life'],
  'Van Life': ['Travel Vlogs', 'Minimalism', 'Digital Nomad'],
  Minimalism: ['Personal Finance', 'Van Life', 'Home Cooking'],
  'Digital Nomad': ['Travel Vlogs', 'Entrepreneurship', 'Productivity & Notion'],
  'Parenting & Family': ['Daily Vlogs', 'Home Cooking', 'Minimalism'],

  // Beauty & Fashion
  'Makeup Tutorials': ['Skincare', 'High Fashion', 'Daily Vlogs'],
  Skincare: ['Makeup Tutorials', 'Health & Fitness', "Men's Grooming"],
  Streetwear: ['Sneakerhead', 'High Fashion', 'Photography'],
  'High Fashion': ['Streetwear', 'Makeup Tutorials', 'Photography'],
  Sneakerhead: ['Streetwear', 'High Fashion', 'Sports'],
  "Men's Grooming": ['Skincare', 'Health & Fitness', 'High Fashion'],

  // Health & Fitness
  'Home Workouts': ['Bodybuilding', 'Nutrition & Diet', 'Yoga & Mindfulness'],
  Bodybuilding: ['Home Workouts', 'Nutrition & Diet', "Men's Grooming"],
  'Yoga & Mindfulness': ['Home Workouts', 'Minimalism', 'Nutrition & Diet'],
  'Nutrition & Diet': ['Home Cooking', 'Home Workouts', 'Vegan/Plant-Based'],
  'Running & Endurance': ['Home Workouts', 'Nutrition & Diet', 'Sneakerhead'],

  // Food & Cooking
  'Home Cooking': ['Nutrition & Diet', 'Vegan/Plant-Based', 'Baking', 'Restaurant Reviews'],
  Baking: ['Home Cooking', 'Vegan/Plant-Based', 'Daily Vlogs'],
  'Restaurant Reviews': ['Travel Vlogs', 'Home Cooking', 'Mixology & Drinks'],
  'Vegan/Plant-Based': ['Home Cooking', 'Nutrition & Diet', 'Yoga & Mindfulness'],
  'Mixology & Drinks': ['Restaurant Reviews', 'Home Cooking', 'Daily Vlogs'],

  // Automotive
  'Car Reviews': ['Car Tuning', 'EVs & Green Tech', 'Motorcycles'],
  Motorcycles: ['Car Reviews', 'Car Tuning', 'Van Life'],
  'Car Tuning': ['Car Reviews', 'Motorcycles', 'Photography'],
  'EVs & Green Tech': ['Car Reviews', 'Tech Hardware', 'Consumer Tech'],

  // Entertainment & Art
  'Comedy Sketches': ['Daily Vlogs', 'Movie Reviews', 'Entertainment'],
  'Movie Reviews': ['Anime & Manga', 'Comedy Sketches', 'Videography'],
  'Anime & Manga': ['Movie Reviews', 'PC Gaming', 'Digital Art'],
  'Music Production': ['Tech Hardware', 'Videography', 'Digital Art'],
  Photography: ['Videography', 'Travel Vlogs', 'Digital Art'],
  Videography: ['Photography', 'Tech Hardware', 'Movie Reviews'],
  'Digital Art': ['Photography', 'Anime & Manga', 'Tech Hardware'],
};
