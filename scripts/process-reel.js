const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const AUDIO_FILE_PATH = path.join(__dirname, '../reel_audio.mp3');
const DATA_DIR = path.join(__dirname, '../public/data');
const DATABASE_FILE = path.join(DATA_DIR, 'reels.json');

async function runPipeline() {
  const reelUrl = process.env.REEL_URL;
  const groqApiKey = process.env.GROQ_API_KEY;

  console.log(`⚡ Launching ReelVault AI Processing Pipeline...`);
  console.log(`🔗 Target Reel URL: ${reelUrl}`);

  if (!reelUrl) {
    console.error('✖ Error: REEL_URL environment variable is missing.');
    process.exit(1);
  }

  if (!groqApiKey) {
    console.error('✖ Error: GROQ_API_KEY environment variable is missing.');
    process.exit(1);
  }

  let transcript = 'Audio transcription not available (Video audio stream could not be extracted).';
  let hasAudio = false;

  // 1. Download audio stream using yt-dlp
  try {
    console.log('📥 [yt-dlp] Downloading audio track from Instagram...');
    // Download audio stream and extract as mp3
    execSync(`yt-dlp -f "ba" -x --audio-format mp3 -o "${AUDIO_FILE_PATH}" "${reelUrl}" --no-playlist --max-downloads 1`, { stdio: 'inherit' });
    
    if (fs.existsSync(AUDIO_FILE_PATH)) {
      console.log('✔ [yt-dlp] Audio track successfully extracted!');
      hasAudio = true;
    }
  } catch (err) {
    console.warn('⚠ [yt-dlp] Warning: Failed to download audio. Falling back to URL metadata/text analysis...');
    console.warn(err.message);
  }

  // 2. Speech-To-Text Transcription via Groq Whisper API
  if (hasAudio) {
    try {
      console.log('🎙 [Whisper] Uploading audio to Groq Whisper v3 for speech-to-text...');
      
      // Node 18+ global fetch with FormData
      const formData = new FormData();
      const audioBuffer = fs.readFileSync(AUDIO_FILE_PATH);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
      
      formData.append('file', audioBlob, 'reel_audio.mp3');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API responded with ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      transcript = resJson.text || transcript;
      console.log('✔ [Whisper] Audio transcription complete!');
    } catch (err) {
      console.error('✖ [Whisper] Error: Transcription failed: ' + err.message);
    } finally {
      // Clean up audio file
      if (fs.existsSync(AUDIO_FILE_PATH)) {
        fs.unlinkSync(AUDIO_FILE_PATH);
      }
    }
  }

  // 3. Summarization & Categorization via Groq LLaMA-3
  let title = 'Ingested Instagram Reel';
  let summary = 'A curated digital summary of this shared Instagram clip.';
  let category = 'Lifestyle';
  let tags = ['General'];
  let notes = 'Auto-ingested via GitHub Actions workflow.';

  try {
    console.log('🧠 [Groq LLaMA-3] Analyzing metadata, transcript patterns & tags...');
    
    const userPrompt = `
      Reel URL: ${reelUrl}
      Speech-To-Text Transcript: ${transcript}
      
      Analyze the content and generate a beautiful structured review. Respond STRICTLY with a valid JSON block containing:
      {
        "title": "A short punchy title summarizing the topic",
        "summary": "A 2-3 sentence highly professional bulleted summary of key takeaways",
        "category": "Must be exactly one of [Food, Travel, Tech, Comedy, Music, Lifestyle]",
        "tags": ["3-5 lowercase hashtag keywords"],
        "notes": "Useful tips, instructions, recipes, commands, coordinates, or actions mentioned or inspired by this content"
      }
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { 
            role: 'system', 
            content: 'You are VideoPrism and LLaMA combined, a highly analytical video metadata tagger. You extract deep intent, summarize, and categorize. Respond only in strict JSON.' 
          },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLaMA API responded with ${response.status}: ${errorText}`);
    }

    const resJson = await response.json();
    const result = JSON.parse(resJson.choices[0].message.content);
    
    title = result.title || title;
    summary = result.summary || summary;
    category = result.category || category;
    tags = result.tags || tags;
    notes = result.notes || notes;

    console.log(`✔ [Groq LLaMA-3] Metadata, tags and summaries generated successfully!`);
    console.log(`🏷 Category Classified: ${category}`);
  } catch (err) {
    console.error('✖ [Groq LLaMA-3] Error: AI processing failed: ' + err.message);
  }

  // 4. Save/Sync Ingestion Results
  const ingestedReel = {
    url: reelUrl,
    title,
    caption: `Ingested from actions run.`,
    summary,
    category,
    transcript,
    notes,
    createdAt: Date.now(),
    status: 'completed',
    isFavorite: 0
  };

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    // Write to Supabase table
    try {
      console.log('💾 [Database] Writing results to Supabase table...');
      const response = await fetch(`${supabaseUrl}/rest/v1/reels`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(ingestedReel)
      });

      if (!response.ok) {
        throw new Error(`Supabase API responded with ${response.status}`);
      }
      console.log('✔ [Database] Synchronization with central Supabase DB complete!');
    } catch (err) {
      console.error('✖ [Database] Error: Supabase write failed: ' + err.message);
    }
  } else {
    // Commit back to local JSON database file in repository (git sync fallback)
    try {
      console.log('💾 [Database] Saving results to repository database file (fallback mode)...');
      
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      let currentDb = [];
      if (fs.existsSync(DATABASE_FILE)) {
        const fileContent = fs.readFileSync(DATABASE_FILE, 'utf8');
        try {
          currentDb = JSON.parse(fileContent);
          if (!Array.isArray(currentDb)) currentDb = [];
        } catch {
          currentDb = [];
        }
      }

      currentDb.push(ingestedReel);
      fs.writeFileSync(DATABASE_FILE, JSON.stringify(currentDb, null, 2), 'utf8');
      console.log('✔ [Database] Local JSON database file updated.');
    } catch (err) {
      console.error('✖ [Database] Error: Failed to write database file: ' + err.message);
    }
  }

  console.log('🎉 ReelVault AI pipeline successfully completed!');
}

runPipeline().catch(err => {
  console.error('✖ Critical Failure: ' + err.message);
  process.exit(1);
});
