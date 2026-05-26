import Dexie from 'dexie';

export const db = new Dexie('ReelVaultDB');

// Define database schema
db.version(1).stores({
  reels: '++id, url, caption, title, summary, category, status, createdAt, isFavorite'
});

// Seed data to make the app gorgeous and immediately usable
export async function seedDatabase() {
  const count = await db.reels.count();
  if (count > 0) return;

  const mockReels = [
    {
      url: 'https://www.instagram.com/reel/C32x7y8t1A9/',
      title: 'Ultimate 15-Minute Creamy Garlic Tuscan Chicken',
      caption: 'Quick dinner ideas! This creamy tuscan chicken takes under 20 minutes and is packed with flavor. Sun-dried tomatoes, spinach, garlic, and fresh parmesan! #cooking #easyrecipes #dinnerideas #tuscanchicken',
      summary: 'A fast and rich 15-minute skillet chicken recipe cooked in a creamy sun-dried tomato and spinach sauce. Ideal for busy weeknights.',
      category: 'Food',
      transcript: "[Intro Music] Hey everyone! Today we are making the absolute easiest and creamiest garlic Tuscan chicken you've ever had, and it only takes 15 minutes. First, season your chicken breasts with salt, pepper, garlic powder, and Italian seasoning. Sear them in hot olive oil for about 5 minutes per side until beautifully golden brown, then set aside. In the same pan, toss in a tablespoon of minced garlic and a half cup of chopped sun-dried tomatoes. Sauté for one minute until fragrant. Now, pour in one cup of heavy cream and bring to a simmer. Stir in a cup of fresh baby spinach and half a cup of freshly grated parmesan cheese. Let that spinach wilt down, then return the chicken to the pan and spoon that gorgeous sauce right over the top. Let it simmer for another two minutes to thicken up. Garnish with fresh basil, serve it over pasta or with crusty bread, and enjoy!",
      notes: 'Try substituting chicken broth for half of the heavy cream to lighten it up. Delicious when served over angel hair pasta or zucchini noodles!',
      createdAt: Date.now() - 3600000 * 24, // 1 day ago
      status: 'completed',
      isFavorite: 1
    },
    {
      url: 'https://www.instagram.com/reel/C4_P9y8x1B0/',
      title: '3 Secret Hidden Spots in Kyoto You MUST Visit',
      caption: 'Kyoto secrets! Escape the crowds and visit these three breathtaking spots on your next trip to Japan. Save this reel for later! 🇯🇵✈️ #kyoto #japan #travelguide #hiddengems #explorejapan',
      summary: 'A detailed travel guide highlighting three crowd-free, highly scenic locations in Kyoto, Japan, complete with transit tips.',
      category: 'Travel',
      transcript: "[Soft Traditional Flute Music] If you are planning a trip to Kyoto, you need to save this reel right now. Everyone knows the bamboo forest and Fushimi Inari, but here are three hidden spots you probably don't know. Number one: Gio-ji Temple. Tucked away in Arashiyama, this tiny temple is surrounded by a lush, vibrant green moss garden that looks straight out of a fairytale. It is incredibly peaceful. Number two: Otagi Nenbutsu-ji. Just a short walk up the road, this temple features 1,200 whimsical stone statues, each representing a Buddhist disciple, and each has a completely unique, often funny facial expression! Number three: The scenic canal of Okazaki. Rent a small wooden boat during cherry blossom season for a stunning, crowd-free view of the sakura arches. Share this with your travel partner!",
      notes: 'Otagi Nenbutsu-ji is best visited early in the morning around 8:30 AM before the tour buses start arriving. Okazaki boat tours must be booked online 3 weeks in advance.',
      createdAt: Date.now() - 3600000 * 12, // 12 hours ago
      status: 'completed',
      isFavorite: 0
    },
    {
      url: 'https://www.instagram.com/reel/C5_A7B1x2C4/',
      title: 'How I Built an AI Agent in 10 Minutes with Groq & LLaMA-3',
      caption: 'AI is moving too fast! Build your first fully agentic coding assistant using Groq and the new LLaMA-3 model in less than ten minutes. Step by step. #ai #groq #llama3 #developer #coding #aiagents',
      summary: 'A fast-paced developer tutorial demonstrating how to connect to the Groq API, initialize LLaMA-3, and program a functional autonomous AI terminal agent.',
      category: 'Tech',
      transcript: "[Upbeat Synth Beats] Stop scrolling! AI is evolving at lightning speed, and today I'm showing you exactly how to build an autonomous coding agent in under ten minutes using Groq and LLaMA-3. First, head over to console.groq.com and grab your free API key. Next, spin up a new Node.js project and install the official Groq SDK using npm install groq-sdk. In your index.js, initialize the Groq client and create an asynchronous chat completions call. We will use the llama3-70b-8192 model because it is ridiculously fast and smart. Give the agent a system prompt directing it to write clean, secure code. Finally, wrap it in a terminal read-line loop so you can chat with it in real-time. Look at that response speed! Groq is running at over 300 tokens per second! Comment 'AGENT' below and I'll DM you the full GitHub repo!",
      notes: 'Need to test LLaMA 3.3 70B Versatile for more complex reasoning. The speed is perfect for real-time terminal UI interactions.',
      createdAt: Date.now() - 3600000 * 2, // 2 hours ago
      status: 'completed',
      isFavorite: 1
    },
    {
      url: 'https://www.instagram.com/reel/C6_K9y8x2D5/',
      title: 'When You Try to Exit a Vim Editor in Public',
      caption: 'Legend says he is still trying to close the terminal. Send help! 😂🖥️ #programmerhumor #codinglife #linux #vim #developerlife #funnymemes',
      summary: 'A highly relatable programming comedy skit dramatizing the classic, frustrating struggle that developers experience when trying to exit the Vim command-line text editor.',
      category: 'Comedy',
      transcript: "[Dramatic Cinematic Music] *Heavy breathing sounds* Okay, I'm in the terminal. I just needed to make a quick edit in this config file. I used Vim. I'm done editing. Now... how do I get out? *Frantic keyboard clicking* Escape... escape... escape. Why is nothing happening? Control C? No. Alt F4? No! *Loud panic* Let me just type 'exit'. Wait, now it's writing 'exit' inside the document! No, no, delete! Okay, let me just close the terminal window... it says 'Vim is still running'! What do I do? Is there a cheat code? *Phone rings* 'Hey mom, I might not make it to dinner, I'm stuck in Vim.' *Sighs and shuts the laptop lid* Guess I'm buying a new computer. [Outro Sound Effect]",
      notes: 'Share this meme with the engineering slack channel on Friday!',
      createdAt: Date.now() - 3600000 * 6, // 6 hours ago
      status: 'completed',
      isFavorite: 0
    }
  ];

  await db.reels.bulkAdd(mockReels);
}
