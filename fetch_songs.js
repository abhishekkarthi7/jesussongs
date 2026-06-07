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

// Helper to make HTTPS requests for JSON APIs (christianlyricz.com)
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch JSON: Status Code ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Clean and extract lyrics from HTML tab content (waytochurch.com)
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

// Clean and extract lyrics from WordPress HTML content (christianlyricz.com)
function extractLyrics(html) {
  if (!html) return { telugu: '', english: '' };

  let cleaned = html.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n');
  cleaned = cleaned.replace(/<\/div>/gi, '\n');
  cleaned = cleaned.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    return '\n' + content + '\n';
  });

  cleaned = cleaned.replace(/<[^>]+>/g, '');

  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8230;/g, '...')
    .replace(/&#160;/g, ' ')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  const lines = cleaned.split('\n').map(l => l.trim());

  const teluguLines = [];
  const englishLines = [];

  for (let line of lines) {
    if (!line) {
      if (teluguLines.length > 0 && teluguLines[teluguLines.length - 1] !== '') {
        teluguLines.push('');
      }
      if (englishLines.length > 0 && englishLines[englishLines.length - 1] !== '') {
        englishLines.push('');
      }
      continue;
    }

    if (
      line.includes('[wptab') || 
      line.includes('[/wptab') || 
      line.includes('Download Lyrics') || 
      line.includes('Credits:') || 
      line.includes('Chords Credits') ||
      line.includes('Capo on') ||
      line.startsWith('||') ||
      /^[.\s-_]*$/.test(line)
    ) {
      continue;
    }

    if (/[\u0c00-\u0c7f]/.test(line)) {
      teluguLines.push(line);
    } else {
      const isChordsLine = /^[A-G](maj|min|m|dim|aug|sus)?[2-9]?(\s+[A-G](maj|min|m|dim|aug|sus)?[2-9]?)*\s*$/i.test(line);
      if (isChordsLine) {
        continue;
      }
      englishLines.push(line);
    }
  }

  let teluguLyrics = teluguLines.join('\n').trim();
  let englishLyrics = englishLines.join('\n').trim();

  if (!teluguLyrics && englishLyrics) teluguLyrics = englishLyrics;
  if (!englishLyrics && teluguLyrics) englishLyrics = teluguLyrics;

  return {
    telugu: teluguLyrics,
    english: englishLyrics
  };
}

// Convert slug to a readable Title Case string
function slugToTitle(slug) {
  if (!slug) return '';
  const cleaned = slug.replace(/[-_]+/g, ' ');
  if (/[\u0c00-\u0c7f]/.test(cleaned)) {
    return cleaned.trim();
  }
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

// Parse index page list items for Telugu and English indices (waytochurch.com)
function parseListPage(html, songsMap) {
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

// Extract pagination URLs of starting letters from the list page HTML (waytochurch.com)
function getLetterUrls(html) {
  const urls = [];
  const letterRegex = /\/lyrics\/list\/Telugu-[^'"]+/gi;
  let match;
  while ((match = letterRegex.exec(html)) !== null) {
    const path = match[0];
    const url = 'https://waytochurch.com' + path;
    if (!urls.includes(url) && !path.endsWith('-') && !path.endsWith('%ef%bf%bd')) {
      urls.push(url);
    }
  }
  return urls;
}

// Helper to normalize string for duplicate checks
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\u0c00-\u0c7fa-z0-9]/g, '')
    .trim();
}

// Get the normalized title keys for a song
function getTitleKeys(song) {
  const keys = new Set();
  if (song.titleTelugu) keys.add(normalizeString(song.titleTelugu));
  if (song.titleEnglish) keys.add(normalizeString(song.titleEnglish));
  return keys;
}

// Scrape and parse christianlyricz.com database
async function scrapeChristianLyricz(existingKeys) {
  console.log('\n=== Fetching unique songs from christianlyricz.com ===');
  
  const additionalSongs = [];
  const songsPerRequest = 100;
  let page = 1;
  let consecutiveErrors = 0;
  
  while (true) {
    try {
      const url = `https://christianlyricz.com/wp-json/wp/v2/posts?per_page=${songsPerRequest}&page=${page}`;
      console.log(`Fetching christianlyricz.com page ${page}...`);
      
      let posts = null;
      let attempts = 0;
      while (attempts < 3) {
        try {
          posts = await fetchJSON(url);
          break;
        } catch (err) {
          attempts++;
          if (err.message.includes('Status Code 400')) throw err;
          if (attempts >= 3) throw err;
          console.warn(`[Warning] Attempt ${attempts} failed for page ${page}. Retrying in 2 seconds...`);
          await sleep(2000);
        }
      }
      
      if (!posts || posts.length === 0) {
        break;
      }
      
      for (const post of posts) {
        const titleTelugu = post.title && post.title.rendered ? post.title.rendered.replace(/&#8211;/g, '-').trim() : '';
        const titleEnglish = slugToTitle(post.slug);
        
        // Skip duplicate songs already fetched from waytochurch.com
        const keys = [normalizeString(titleTelugu), normalizeString(titleEnglish)];
        const isDuplicate = keys.some(k => k && existingKeys.has(k));
        
        if (isDuplicate) {
          continue;
        }
        
        const html = post.content && post.content.rendered ? post.content.rendered : '';
        const { telugu, english } = extractLyrics(html);
        
        if (!telugu && !english) {
          continue;
        }
        
        const category = detectCategory(post.slug, html);
        
        additionalSongs.push({
          id: `song-cl-${post.id}`, // Prefix to guarantee unique IDs
          titleTelugu: titleTelugu || titleEnglish,
          titleEnglish: titleEnglish,
          categoryEnglish: category,
          lyricsTelugu: telugu,
          lyricsEnglish: english
        });
        
        // Track the keys to avoid duplicate matches inside this run
        keys.forEach(k => { if (k) existingKeys.add(k); });
      }
      
      console.log(`Page ${page} parsed. Found ${additionalSongs.length} additional unique songs so far.`);
      page++;
      consecutiveErrors = 0;
      await sleep(1000); // 1-second throttle
      
    } catch (err) {
      if (err.message.includes('Status Code 400')) {
        console.log('Reached end of available pages on christianlyricz.com.');
        break;
      }
      
      console.error(`[Error] Failed page ${page} on christianlyricz.com:`, err.message);
      consecutiveErrors++;
      if (consecutiveErrors > 3) {
        console.log('Stopping christianlyricz.com fetch due to 3 consecutive errors.');
        break;
      }
      page++;
      await sleep(2000);
    }
  }
  
  return additionalSongs;
}

async function start() {
  console.log('=== Dual-Source Resilient Song Scraper ===');
  
  let songsMap = {};
  
  // 1. Compile waytochurch.com index
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
  
  // 2. Load already scraped waytochurch.com songs progress
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
      process.stdout.write(`\rProgress: ${completedCount}/${totalSongs} songs processed (${Math.round(completedCount/totalSongs*100)}%)...`);
      
      // Save progress to file every 50 songs
      if (completedCount % 50 === 0) {
        fs.writeFileSync('temp_scraped_songs.json', JSON.stringify(scrapedSongsMap, null, 2), 'utf-8');
      }
    });
    
    fs.writeFileSync('temp_scraped_songs.json', JSON.stringify(scrapedSongsMap, null, 2), 'utf-8');
  }
  
  // 4. Build Title Keys Set from waytochurch database
  const wayToChurchSongs = Object.values(scrapedSongsMap);
  console.log(`\nWayToChurch database contains ${wayToChurchSongs.length} songs.`);
  
  const existingKeys = new Set();
  for (const song of wayToChurchSongs) {
    const keys = getTitleKeys(song);
    for (const k of keys) {
      if (k) existingKeys.add(k);
    }
  }
  
  // 5. Scrape and merge unique songs from christianlyricz.com
  let christianLyriczSongs = [];
  try {
    christianLyriczSongs = await scrapeChristianLyricz(existingKeys);
    console.log(`Found and parsed ${christianLyriczSongs.length} unique songs from christianlyricz.com.`);
  } catch (err) {
    console.error('Failed to parse christianlyricz.com database, proceeding with waytochurch.com only:', err.message);
  }
  
  // 6. Combine and save to songs.js
  const finalSongsArray = [...wayToChurchSongs, ...christianLyriczSongs];
  console.log(`\nCompiling database... Combined total songs: ${finalSongsArray.length}`);
  
  if (finalSongsArray.length === 0) {
    console.error('Error: No songs were scraped successfully.');
    return;
  }
  
  const finalFileContent = `// Automatically generated Telugu Christian songs database (Combined waytochurch.com and christianlyricz.com)
// Total songs: ${finalSongsArray.length}

const INITIAL_SONGS = ${JSON.stringify(finalSongsArray, null, 2)};
`;
  
  fs.writeFileSync('songs.js', finalFileContent, 'utf-8');
  console.log('Successfully saved combined database to songs.js!');
  
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
