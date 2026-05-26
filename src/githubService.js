// Service to interface with GitHub Actions API and simulate pipelines

// Helper to extract owner and repo from a GitHub URL or string
export function parseGitHubRepo(repoString) {
  if (!repoString) return { owner: '', repo: '' };
  
  // Clean URL if full path provided
  const cleanStr = repoString.replace(/https?:\/\/github\.com\//, '');
  const parts = cleanStr.split('/');
  
  return {
    owner: parts[0] || '',
    repo: parts[1] || ''
  };
}

// 1. Trigger GitHub Repository Dispatch
export async function triggerGitHubDispatch({ owner, repo, token, eventType = 'process-reel', reelUrl }) {
  if (!owner || !repo || !token) {
    throw new Error('GitHub configuration missing (Owner, Repo, and Token are required).');
  }

  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanToken = token.trim();

  const url = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${cleanToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: {
        url: reelUrl
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API Error (${response.status}): ${errorText || response.statusText}`);
  }

  return true;
}

// 2. Fetch Workflow Runs to check progress
export async function fetchWorkflowRuns({ owner, repo, token }) {
  if (!owner || !repo || !token) return [];

  const url = `https://api.github.com/repos/${owner.trim()}/${repo.trim()}/actions/runs?event=repository_dispatch&per_page=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.workflow_runs || [];
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return [];
  }
}

// 3. High-Fidelity Simulation Engine
// Generates terminal logs and returns a mock processed Reel based on the URL input
export function startPipelineSimulation(reelUrl, onLog, onComplete, forcedCategory = null) {
  // Determine a mock theme based on keywords in URL or a forced category selection
  const combinedText = reelUrl.toLowerCase();
  
  let targetCategory = forcedCategory;
  if (!targetCategory) {
    if (combinedText.includes('food') || combinedText.includes('cook') || combinedText.includes('recipe') || combinedText.includes('eat') || combinedText.includes('chef') || combinedText.includes('chicken') || combinedText.includes('steak') || combinedText.includes('pan-sear')) {
      targetCategory = 'Food';
    } else if (combinedText.includes('travel') || combinedText.includes('trip') || combinedText.includes('vacation') || combinedText.includes('beach') || combinedText.includes('explore') || combinedText.includes('kyoto') || combinedText.includes('japan') || combinedText.includes('island') || combinedText.includes('villas')) {
      targetCategory = 'Travel';
    } else if (combinedText.includes('tech') || combinedText.includes('code') || combinedText.includes('ai') || combinedText.includes('dev') || combinedText.includes('hack') || combinedText.includes('software') || combinedText.includes('program') || combinedText.includes('vscode')) {
      targetCategory = 'Tech';
    } else if (combinedText.includes('funny') || combinedText.includes('laugh') || combinedText.includes('comedy') || combinedText.includes('meme') || combinedText.includes('joke') || combinedText.includes('humor') || combinedText.includes('vim')) {
      targetCategory = 'Comedy';
    } else if (combinedText.includes('music') || combinedText.includes('song') || combinedText.includes('dance') || combinedText.includes('beat') || combinedText.includes('cover') || combinedText.includes('guitar')) {
      targetCategory = 'Music';
    } else {
      // If there are no explicit keywords in the URL (e.g. normal hash patterns like instagram.com/reel/C8_p...),
      // we hash the URL string deterministically to map to one of our premium categories.
      // This mimics the VideoPrism classification and ensures they don't all show up under the default category.
      const mockPool = ['Food', 'Travel', 'Tech', 'Comedy', 'Music'];
      let charCodeSum = 0;
      for (let i = 0; i < reelUrl.length; i++) {
        charCodeSum += reelUrl.charCodeAt(i);
      }
      targetCategory = mockPool[charCodeSum % mockPool.length];
    }
  }

  let category = 'Lifestyle';
  let title = 'Smart Ingested Instagram Reel';
  let summary = 'A curated digital insight summarizing this Instagram Reel clip.';
  let tags = ['General', 'Social'];
  let notes = 'Auto-generated notes from ingestion.';
  let transcript = 'This is a simulated transcript generated by the Whisper speech recognition model.';

  if (targetCategory === 'Food') {
    category = 'Food';
    title = 'Savory Garlic Herb Butter Steak Skillet';
    summary = 'A professional kitchen walkthrough showing how to pan-sear a ribeye steak to a perfect medium-rare, basting with garlic, fresh rosemary, and artisanal butter.';
    tags = ['cooking', 'steak', 'recipe', 'culinary', 'dinner'];
    notes = 'Try adding sliced mushrooms in the pan during the final 3 minutes of basting. Serve alongside roasted asparagus.';
    transcript = '[Upbeat Acoustic Guitar] Hey guys, today we are searing a gorgeous dry-aged ribeye! Get your cast-iron skillet screaming hot, add avocado oil, and lay that steak down. Sear for 3 minutes until a deep golden crust forms. Flip it, then throw in a half-bar of unsalted butter, crushed garlic cloves, and sprigs of fresh rosemary. Tilt the pan and continuously spoon that melted butter right over the steak. Rest it for 5 minutes, slice it up, and look at that perfect pink center! Pure perfection.';
  } else if (targetCategory === 'Travel') {
    category = 'Travel';
    title = '5 Budget Maldives Water Villas You Wont Believe Exist';
    summary = 'A travel breakdown revealing budget-friendly water villas in the Maldives that cost under $180 a night, including transfers.';
    tags = ['maldives', 'budgettravel', 'watervillas', 'wanderlust', 'islands'];
    notes = 'Book between May and October (rainy season but lower prices) for the absolute lowest rates. Standard speedboat transfers are much cheaper than seaplane transfers.';
    transcript = '[Calm Island Beats] Do you think the Maldives is only for millionaires? Think again! Here are three water villas under one hundred and eighty dollars a night. First is Cinnamon Dhonveli, featuring incredible sunset ocean views. Second is Embudu Village, offering a world-class house reef right outside your bedroom door. And third, Safari Island Resort. Save this reel, share it with your travel squad, and start packing!';
  } else if (targetCategory === 'Tech') {
    category = 'Tech';
    title = 'The Ultimate Developer Setup Trick to Double Coding Speed';
    summary = 'A step-by-step developer tutorial showcasing productivity workflows, terminal keybind hacks, and AI autocomplete settings that save hours of active dev time.';
    tags = ['developer', 'productivity', 'vscode', 'ai', 'terminal', 'coding'];
    notes = 'Requires installing modern terminal multiplexers and configuring custom shell scripts. Keep keyboard layouts standard for muscle memory.',
    transcript = '[Dynamic Techno Beat] If you are still using your mouse to navigate your code editor, stop! You are losing hours every single week. First, download the Tmux multiplexer to run parallel shell panels. Next, configure custom keybindings in your VSCode settings.json to jump lines instantly. Finally, connect your shell completion to an ultra-fast local LLM server. You will write code twice as fast. Comment "CONFIG" below for my dotfiles!';
  } else if (targetCategory === 'Comedy') {
    category = 'Comedy';
    title = 'When the Senior Dev Reviews Your Junior Code';
    summary = 'A hilarious comedy skit contrasting a optimistic junior developer presenting their code with the experienced, silent panic of the senior engineer.';
    tags = ['funny', 'developerhumor', 'juniorcode', 'codereview', 'engineering'];
    notes = 'Highly shareable content, perfect for Slack channels.',
    transcript = '[Fun Clarinet Music] *Junior Dev:* So yeah, I finished the feature! I didn\'t write tests, but it compiles. It only took me 3 days and 4000 lines of code. *Senior Dev stares blankly at a screen of nested loops* *Senior Dev:* ...Is this... a recursive call that loops indefinitely? *Junior Dev:* Well, it ensures the app stays awake! *Senior Dev starts quietly sobbing into his coffee mug* [Laugh Track]';
  } else if (targetCategory === 'Music') {
    category = 'Music';
    title = 'Acoustic Guitar Looper Jam - Midnight Vibes';
    summary = 'A mesmerizing live audio layering performance using an acoustic guitar, a delay pedal, and a multi-track loop station to build a ambient night rhythm.';
    tags = ['acoustic', 'guitar', 'loopstation', 'indie', 'midnight', 'instrumental'];
    notes = 'Beautiful ambient tone. Ideal study or relaxing background track.',
    transcript = '[Live Guitar Audio looping in background] Hey friends, just putting together a quick loop tonight. Started with a percussive slap on the body, layered in a basic root chord progression in E minor, and now adding some ambient delay swells over the top. Let\'s improvise a small melody... [Aesthetic guitar solo plays and fades]';
  }

  const logs = [
    { text: '🚀 Spinning up GitHub Actions runner environment (ubuntu-latest)...', type: 'info', delay: 100 },
    { text: '⚙ Preparing system dependencies: Installing FFmpeg on the workspace...', type: 'info', delay: 500 },
    { text: '📥 [yt-dlp] Downloading Instagram Reel stream on the host machine...', type: 'info', delay: 1100 },
    { text: '✔ [yt-dlp] Reel download complete (audio track successfully extracted to mp3).', type: 'success', delay: 1700 },
    { text: '🔍 [VideoPrism] Checking reel frames with visual classification model...', type: 'info', delay: 2400 },
    { text: `🏷 [VideoPrism] Frame-level classification complete. Auto-tag assigned: "${category}"`, type: 'success', delay: 3000 },
    { text: '🎙 [Groq Whisper] Processing audio speech-to-text transcription...', type: 'info', delay: 3600 },
    { text: '✔ [Groq Whisper] Transcript generated successfully.', type: 'success', delay: 4100 },
    { text: '🧠 [Groq LLaMA-3] Summarizing text patterns & extracting actionable insights...', type: 'info', delay: 4600 },
    { text: '✔ [Groq LLaMA-3] Auto-notes, tags and summaries compiled successfully.', type: 'success', delay: 5100 },
    { text: '💾 [Database] Synced structured reel metadata to library IndexedDB schema.', type: 'info', delay: 5600 },
    { text: '🎉 ReelVault AI pipeline successfully finished with 100% automation!', type: 'success', delay: 6000 }
  ];

  let currentLogIdx = 0;
  const timers = [];

  const triggerNextLog = () => {
    if (currentLogIdx < logs.length) {
      const log = logs[currentLogIdx];
      const timer = setTimeout(() => {
        onLog(log.text, log.type);
        currentLogIdx++;
        triggerNextLog();
      }, log.delay - (currentLogIdx > 0 ? logs[currentLogIdx - 1].delay : 0));
      timers.push(timer);
    } else {
      // Completed! Return the seeded reel object
      const newReel = {
        url: reelUrl,
        title,
        caption: `Simulated caption for ${reelUrl}. Automatically extracted from headers.`,
        summary,
        category,
        transcript,
        notes,
        createdAt: Date.now(),
        status: 'completed',
        isFavorite: 0
      };
      
      const timer = setTimeout(() => {
        onComplete(newReel);
      }, 500);
      timers.push(timer);
    }
  };

  triggerNextLog();

  return {
    cancel: () => {
      timers.forEach(clearTimeout);
    }
  };
}
