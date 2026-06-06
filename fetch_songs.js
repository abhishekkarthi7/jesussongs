const fs = require('fs');
const https = require('https');

// Helper to make HTTPS requests using native Node.js and return HTML content
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch: Status Code ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Clean and extract lyrics from HTML tab content
function cleanHtml(html) {
  if (!html) return '';
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  
  // Unescape HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8230;/g, '...')
    .replace(/&#160;/g, ' ')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
    
  return text.split('\n').map(line => line.trim()).join('\n').trim();
}

// Convert slug to a readable Title Case string
function slugToTitle(slug) {
  if (!slug) return '';
  // Replace dashes/underscores with spaces
  const cleaned = slug.replace(/[-_]+/g, ' ');
  // Check if it has Telugu script characters
  if (/[\u0c00-\u0c7f]/.test(cleaned)) {
    return cleaned.trim();
  }
  // Otherwise capitalize English words
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

// Categorize song based on slug and contents
function detectCategory(slug, contentHtml) {
  const normalized = (slug + ' ' + contentHtml).toLowerCase();
  
  if (normalized.includes('christmas') || normalized.includes('christmast')) {
    return 'Christmas Songs';
  }
  if (normalized.includes('youth') || normalized.includes('pillala') || normalized.includes('children') || normalized.includes('kids')) {
    return 'Youth Songs';
  }
  if (normalized.includes('revival') || normalized.includes('uthjeeva') || normalized.includes('ujiwa')) {
    return 'Revival Songs';
  }
  if (normalized.includes('prayer') || normalized.includes('prardhana') || normalized.includes('prarthana') || normalized.includes('prarthanala')) {
    return 'Prayer Songs';
  }
  if (normalized.includes('praise') || normalized.includes('stuthi') || normalized.includes('stotra') || normalized.includes('keerthana')) {
    return 'Praise Songs';
  }
  if (normalized.includes('worship') || normalized.includes('aaradhana') || normalized.includes('aradhana')) {
    return 'Worship Songs';
  }
  
  return 'Gospel Songs';
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Concurrency pool runner
async function runWithConcurrency(tasks, concurrencyLimit, workerFn) {
  let index = 0;
  const activeWorkers = [];

  const next = async () => {
    if (index >= tasks.length) return;
    const currentTask = tasks[index++];
    await workerFn(currentTask, index - 1);
    await next();
  };

  for (let i = 0; i < Math.min(concurrencyLimit, tasks.length); i++) {
    activeWorkers.push(next());
  }

  await Promise.all(activeWorkers);
}

// Parse index page list items for Telugu and English indices
function parseListPage(html, songsMap) {
  // Parse Telugu index
  const mainIndexMatch = html.match(/id="mainindex"[^>]*>([\s\S]*?)<\/ul>/);
  if (mainIndexMatch) {
    const mainIndexBlock = mainIndexMatch[1];
    const songRegex = /<li[^>]*>\s*\d+\.\s*<a href='(?:https:\/\/waytochurch\.com)?\/lyrics\/song\/(\d+)\/([^']*)'>\s*([\s\S]*?)<\/a>/g;
    let match;
    while ((match = songRegex.exec(mainIndexBlock)) !== null) {
      const id = match[1];
      const slug = match[2];
      const title = match[3].trim().replace(/<[^>]+>/g, '');
      
      if (!songsMap[id]) {
        songsMap[id] = {
          id: id,
          titleTelugu: title,
          titleEnglish: '',
          slug: slug
        };
      } else {
        if (!songsMap[id].titleTelugu) {
          songsMap[id].titleTelugu = title;
        }
      }
    }
  }

  // Parse English index
  const englishIndexMatch = html.match(/id="englishindex"[^>]*>([\s\S]*?)<\/ul>/);
  if (englishIndexMatch) {
    const englishIndexBlock = englishIndexMatch[1];
    const songRegex = /<li[^>]*>\s*\d+\.\s*<a href='(?:https:\/\/waytochurch\.com)?\/lyrics\/song\/(\d+)\/([^']*)'>\s*([\s\S]*?)<\/a>/g;
    let match;
    while ((match = songRegex.exec(englishIndexBlock)) !== null) {
      const id = match[1];
      const slug = match[2];
      const title = match[3].trim().replace(/<[^>]+>/g, '');
      
      if (!songsMap[id]) {
        songsMap[id] = {
          id: id,
          titleTelugu: '',
          titleEnglish: title,
          slug: slug
        };
      } else {
        songsMap[id].titleEnglish = title;
      }
    }
  }
}

// Extract pagination URLs of starting letters from the list page HTML
function getLetterUrls(html) {
  const urls = [];
  const letterRegex = /\/lyrics\/list\/Telugu-[^'"]+/gi;
  let match;
  while ((match = letterRegex.exec(html)) !== null) {
    const path = match[0];
    const url = 'https://waytochurch.com' + path;
    // Exclude incomplete/empty links
    if (!urls.includes(url) && !path.endsWith('-') && !path.endsWith('%ef%bf%bd')) {
      urls.push(url);
    }
  }
  return urls;
}

async function start() {
  console.log('=== WayToChurch Song Scraper & Compiler ===');
  
  let songsMap = {};
  
  // 1. Compile Song URLs / Metadata
  if (fs.existsSync('temp_song_list.json')) {
    console.log('Loading song metadata list from temp_song_list.json...');
    try {
      songsMap = JSON.parse(fs.readFileSync('temp_song_list.json', 'utf-8'));
      console.log(`Loaded ${Object.keys(songsMap).length} songs metadata.`);
    } catch (err) {
      console.error('Error loading temp_song_list.json. Starting fresh indexing.', err.message);
      songsMap = {};
    }
  }
  
  if (Object.keys(songsMap).length === 0) {
    console.log('Fetching main Telugu Christian index page to gather letters...');
    const mainIndexUrl = 'https://waytochurch.com/Lyrics/list/Telugu-Christian-songs-Lyrics';
    let mainIndexHtml = '';
    try {
      mainIndexHtml = await fetchHTML(mainIndexUrl);
    } catch (err) {
      console.error('Failed to fetch main index page:', err.message);
      return;
    }
    
    console.log('Parsing main page song list...');
    parseListPage(mainIndexHtml, songsMap);
    
    const letterUrls = getLetterUrls(mainIndexHtml);
    console.log(`Found ${letterUrls.length} starting-letter index pages to scrape.`);
    
    // Scrape index pages sequentially (to compile metadata map)
    for (let i = 0; i < letterUrls.length; i++) {
      const url = letterUrls[i];
      const letter = decodeURIComponent(url.split('-').pop());
      console.log(`[${i+1}/${letterUrls.length}] Fetching letter index page [${letter}]...`);
      try {
        const letterHtml = await fetchHTML(url);
        parseListPage(letterHtml, songsMap);
        await sleep(1000); // Wait 1s between index page fetches
      } catch (err) {
        console.error(`Error fetching index page for letter ${letter}:`, err.message);
      }
    }
    
    // Save metadata list to prevent re-indexing next time
    fs.writeFileSync('temp_song_list.json', JSON.stringify(songsMap, null, 2), 'utf-8');
    console.log(`Successfully compiled metadata list. Total unique songs: ${Object.keys(songsMap).length}`);
  }
  
  // 2. Load already scraped songs progress
  let scrapedSongsMap = {};
  if (fs.existsSync('temp_scraped_songs.json')) {
    try {
      scrapedSongsMap = JSON.parse(fs.readFileSync('temp_scraped_songs.json', 'utf-8'));
      console.log(`Resuming progress: Loaded ${Object.keys(scrapedSongsMap).length} already scraped songs.`);
    } catch (err) {
      console.error('Error reading temp_scraped_songs.json. Starting fresh scraping.', err.message);
      scrapedSongsMap = {};
    }
  }
  
  // 3. Start Scraping Song Details with Concurrency
  const allSongsList = Object.values(songsMap);
  const remainingSongs = allSongsList.filter(song => !scrapedSongsMap[song.id]);
  const totalSongs = allSongsList.length;
  let completedCount = totalSongs - remainingSongs.length;
  
  console.log(`Remaining songs to fetch lyrics for: ${remainingSongs.length} / ${totalSongs}`);
  
  if (remainingSongs.length > 0) {
    // Run with 5 concurrent workers
    await runWithConcurrency(remainingSongs, 5, async (song) => {
      const url = `https://waytochurch.com/lyrics/song/${song.id}`;
      let html = '';
      let attempts = 0;
      
      while (attempts < 3) {
        try {
          html = await fetchHTML(url);
          break; // Success
        } catch (err) {
          attempts++;
          if (attempts >= 3) {
            console.error(`\n[Failed] Could not load song ${song.id} (${song.titleEnglish || song.titleTelugu}): ${err.message}`);
            break;
          }
          await sleep(1500); // Wait 1.5s before retry
        }
      }
      
      if (html) {
        let lyricsTelugu = '';
        let lyricsEnglish = '';
        
        // Parse original / Telugu tab content
        const originalMatch = html.match(/<div id="original"[^>]*>([\s\S]*?)<\/div>/);
        if (originalMatch) {
          lyricsTelugu = cleanHtml(originalMatch[1]);
        }
        
        // Parse English tab content
        const englishMatch = html.match(/<div id="english"[^>]*>([\s\S]*?)<\/div>/);
        if (englishMatch) {
          lyricsEnglish = cleanHtml(englishMatch[1]);
        }
        
        // Fallbacks
        if (!lyricsTelugu && lyricsEnglish) lyricsTelugu = lyricsEnglish;
        if (!lyricsEnglish && lyricsTelugu) lyricsEnglish = lyricsTelugu;
        
        if (lyricsTelugu || lyricsEnglish) {
          // Detect category from slug/title & lyrics content
          const category = detectCategory(song.slug + ' ' + (song.titleEnglish || ''), lyricsTelugu);
          
          scrapedSongsMap[song.id] = {
            id: `song-${song.id}`,
            titleTelugu: song.titleTelugu || song.titleEnglish || 'Unknown Title',
            titleEnglish: slugToTitle(song.slug) || song.titleEnglish || 'Unknown Title',
            categoryEnglish: category,
            lyricsTelugu: lyricsTelugu,
            lyricsEnglish: lyricsEnglish
          };
        }
      }
      
      completedCount++;
      // Write progress log
      process.stdout.write(`\rProgress: ${completedCount}/${totalSongs} songs processed (${Math.round(completedCount/totalSongs*100)}%)...`);
      
      // Save progress to file every 50 songs
      if (completedCount % 50 === 0) {
        fs.writeFileSync('temp_scraped_songs.json', JSON.stringify(scrapedSongsMap, null, 2), 'utf-8');
      }
    });
    
    // Save final progress list
    fs.writeFileSync('temp_scraped_songs.json', JSON.stringify(scrapedSongsMap, null, 2), 'utf-8');
  }
  
  // 4. Compile into songs.js
  const finalSongsArray = Object.values(scrapedSongsMap);
  console.log(`\n\nCompiling database... parsed ${finalSongsArray.length} songs total.`);
  
  if (finalSongsArray.length === 0) {
    console.error('Error: No songs were scraped successfully.');
    return;
  }
  
  const finalFileContent = `// Automatically generated Telugu Christian songs database from waytochurch.com
// Total songs: ${finalSongsArray.length}

const INITIAL_SONGS = ${JSON.stringify(finalSongsArray, null, 2)};
`;
  
  fs.writeFileSync('songs.js', finalFileContent, 'utf-8');
  console.log('Successfully saved database to songs.js!');
  
  // Cleanup temp files
  try {
    if (fs.existsSync('temp_song_list.json')) fs.unlinkSync('temp_song_list.json');
    if (fs.existsSync('temp_scraped_songs.json')) fs.unlinkSync('temp_scraped_songs.json');
    if (fs.existsSync('temp_inspect.html')) fs.unlinkSync('temp_inspect.html');
    if (fs.existsSync('inspect_page.js')) fs.unlinkSync('inspect_page.js');
    console.log('Cleaned up temporary cache files.');
  } catch (err) {
    console.error('Warning: Failed to cleanup temporary files:', err.message);
  }
  
  console.log('=== All Done! Ready for your web application ===');
}

start();
