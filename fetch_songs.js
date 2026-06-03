const fs = require('fs');
const https = require('https');

// Helper to make HTTPS requests using native Node.js
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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

// Clean and extract lyrics from HTML
function extractLyrics(html) {
  if (!html) return { telugu: '', english: '' };

  // Convert break tags and paragraph end tags to newlines
  let cleaned = html.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n');
  cleaned = cleaned.replace(/<\/div>/gi, '\n');
  cleaned = cleaned.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    return '\n' + content + '\n';
  });

  // Strip all other HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Unescape HTML entities
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

  // Split into lines
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

    // Skip tab annotations and chords header lines
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

    // Check if line contains Telugu characters (\u0c00-\u0c7f)
    if (/[\u0c00-\u0c7f]/.test(line)) {
      teluguLines.push(line);
    } else {
      // It's English (or chords). Skip lines that look purely like chord progressions
      // e.g., "Am   G   F  Em" or similar
      const isChordsLine = /^[A-G](maj|min|m|dim|aug|sus)?[2-9]?(\s+[A-G](maj|min|m|dim|aug|sus)?[2-9]?)*\s*$/i.test(line);
      if (isChordsLine) {
        continue;
      }
      englishLines.push(line);
    }
  }

  // Combine and clean up trailing spaces/newlines
  let teluguLyrics = teluguLines.join('\n').trim();
  let englishLyrics = englishLines.join('\n').trim();

  // If one of the language variants is empty, duplicate the other to avoid blank screens
  if (!teluguLyrics && englishLyrics) teluguLyrics = englishLyrics;
  if (!englishLyrics && teluguLyrics) englishLyrics = teluguLyrics;

  return {
    telugu: teluguLyrics,
    english: englishLyrics
  };
}

// Convert slug to a readable Title Case string
function slugToTitle(slug) {
  if (!slug) return 'Unknown Song';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  
  // Default fallback
  return 'Gospel Songs';
}

async function start() {
  console.log('=== Telugu Christian Lyrics Scraper ===');
  console.log('Fetching songs from christianlyricz.com API...');
  
  const songs = [];
  const songsPerRequest = 100;
  const targetPages = 5; // 5 pages x 100 per page = 500 songs
  
  for (let page = 1; page <= targetPages; page++) {
    try {
      const url = `https://christianlyricz.com/wp-json/wp/v2/posts?per_page=${songsPerRequest}&page=${page}`;
      console.log(`Fetching page ${page} of ${targetPages}...`);
      const posts = await fetchJSON(url);
      
      if (!posts || posts.length === 0) {
        console.log('No more posts returned.');
        break;
      }
      
      console.log(`Received ${posts.length} posts. Parsing...`);
      
      for (const post of posts) {
        const titleTelugu = post.title && post.title.rendered ? post.title.rendered.replace(/&#8211;/g, '-').trim() : '';
        const titleEnglish = slugToTitle(post.slug);
        
        // Clean lyrics
        const html = post.content && post.content.rendered ? post.content.rendered : '';
        const { telugu, english } = extractLyrics(html);
        
        if (!telugu && !english) {
          // Skip posts with absolutely no lyrics content
          continue;
        }
        
        const category = detectCategory(post.slug, html);
        
        songs.push({
          id: `song-${post.id}`,
          titleTelugu: titleTelugu || titleEnglish,
          titleEnglish: titleEnglish,
          categoryEnglish: category,
          lyricsTelugu: telugu,
          lyricsEnglish: english
        });
      }
      
      console.log(`Current total: ${songs.length} songs parsed.`);
      
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
    }
  }
  
  if (songs.length === 0) {
    console.log('Error: No songs could be parsed.');
    return;
  }
  
  console.log(`Successfully parsed ${songs.length} songs!`);
  
  // Save to songs.js
  const fileContent = `// Automatically generated Telugu Christian songs database
// Total songs: ${songs.length}

const INITIAL_SONGS = ${JSON.stringify(songs, null, 2)};
`;

  fs.writeFileSync('songs.js', fileContent, 'utf-8');
  console.log('Saved successfully to songs.js! You can now reload your web page.');
}

start();
