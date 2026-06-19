import dotenv from 'dotenv';
dotenv.config();

const YT_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const channelId = 'UCNU_lfiiWBdtULiA6zZ2T_g'; // Chai aur Code or similar

async function test() {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${YT_API_KEY}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
