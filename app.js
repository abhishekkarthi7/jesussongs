/**
 * Jesus Songs & Lyrics Web Application
 * Core Script, Canvas Particle Engine, Interactive Category Grid Navigation, and Spiritual Reflection Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let allSongs = [];
  let currentLyricsFontSize = parseFloat(localStorage.getItem('lyricFontSize')) || 1.15; // in rem
  let activeSong = null;
  let activeCategory = 'all';
  let searchQuery = '';
  let favoriteSongs = JSON.parse(localStorage.getItem('fav_jesus_songs')) || [];

  // --- DOM ELEMENTS ---
  const songsGrid = document.getElementById('songsGrid');
  const searchInput = document.getElementById('searchInput');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const suggestionBox = document.getElementById('suggestionBox');
  const appHeader = document.getElementById('appHeader');
  const libraryHeading = document.getElementById('libraryHeading');
  const libraryDescription = document.getElementById('libraryDescription');
  
  // Lyrics Modals & Panels
  const lyricModal = document.getElementById('lyricModal');
  const modalSongTitle = document.getElementById('modalSongTitle');
  const modalSongMeta = document.getElementById('modalSongMeta');
  const lyricsDisplay = document.getElementById('lyricsDisplay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const favoriteSongBtn = document.getElementById('favoriteSongBtn');
  
  // Lyrics Modal Actions
  const copyLyricsBtn = document.getElementById('copyLyricsBtn');
  const shareLyricsBtn = document.getElementById('shareLyricsBtn');
  const printLyricsBtn = document.getElementById('printLyricsBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomNormalBtn = document.getElementById('zoomNormalBtn');

  // Spiritual Reflection Modal
  const spiritualModal = document.getElementById('spiritualModal');
  const spiritualModalTitle = document.getElementById('spiritualModalTitle');
  const spiritualGraphic = document.getElementById('spiritualGraphic');
  const spiritualTextContent = document.getElementById('spiritualTextContent');
  const closeSpiritualModalBtn = document.getElementById('closeSpiritualModalBtn');

  // --- 1. SPIRITUAL REFLECTIONS DICTIONARY ---
  const SPIRITUAL_REFLECTIONS = {
    worship: {
      title: "Divine Worship",
      icon: "fa-solid fa-hands-praying",
      text: `Worship is not merely singing songs or reciting prayers; it is a profound, personal encounter with <strong>Jesus Christ</strong>—the living Savior of the world.<br><br>
             Unlike historical figures who remain in their tombs, Jesus conquered death and is active today. When we worship Him, we enter the tangible presence of the Almighty God who created the heavens and the earth, yet knows the details of your life. In His presence, depression lifts, addictions break, and broken hearts are completely restored. Worship is the gateway to experiencing the unconditional love and reality of the alive God.`
    },
    praise: {
      title: "Victorious Praise",
      icon: "fa-solid fa-music",
      text: `Praise is the joyous declaration of Jesus' absolute victory and majesty. He is not a distant deity, but the active, all-powerful King of Kings.<br><br>
             When we praise Jesus, we align our minds with the reality that no storm is too great for Him. Praise shifts our focus from our limitations to His limitless power. In praise, we witness His miraculous hand: chains are broken, pathways are opened, and light shines into the deepest darkness. Praising Jesus proves that He is alive, working signs and wonders in the lives of millions today.`
    },
    prayer: {
      title: "Direct Prayer",
      icon: "fa-solid fa-dove",
      text: `Prayer is a direct line of communication to the Creator of the universe through Jesus Christ. God became flesh in Jesus so He could relate to our pain and walk in our shoes.<br><br>
             When you pray in the name of Jesus, you are speaking to a living Savior who hears your whispers and counts your tears. Prayer is not a religious ritual; it is a catalyst for divine intervention. Countless documented miracles—instantaneous healings, restored minds, and supernatural provisions—bear testimony to the truth that Jesus answers prayer today because He is alive and reigns as Almighty God.`
    },
    bible: {
      title: "The Living Word",
      icon: "fa-solid fa-book-bible",
      text: `The Holy Bible is not a relic of the past; it is the living, breathing Word of God. Through its pages, Jesus speaks directly to the human spirit with power, wisdom, and life.<br><br>
             Supernaturally preserved over thousands of years, the Bible contains hundreds of precise prophecies written centuries before Jesus' birth that were perfectly fulfilled in Him. Reading the Bible reveals the truth of eternity and the blueprint of your soul. Its words have the unique power to pierce the heart, convict the conscience, and guide you into absolute truth, testifying that Jesus is the eternal Word of God.`
    },
    faith: {
      title: "Unshakable Faith",
      icon: "fa-solid fa-cross",
      text: `Faith is not blind optimism; it is the confident trust in the character and promises of the living God, Jesus Christ. It is anchored in the historical certainty of His resurrection.<br><br>
             When we place our faith in Jesus, we invite the Almighty God to do what is impossible for humans. Faith is the shield that keeps us secure in times of trouble and the anchor that holds us steady. By taking a step of faith, millions have emerged from despair, found eternal hope, and experienced a complete transformation of their lives, knowing that Jesus is alive, faithful, and will never abandon those who trust in Him.`
    }
  };

  const CATEGORY_DESCRIPTIONS = {
    'all': 'Welcome to the Jesus Songs library. Music is a divine gift to connect our hearts with the Almighty. Explore these lyrics to experience the presence, love, and reality of the living Savior, Jesus Christ.',
    'worship songs': 'Worship is a personal, intimate encounter with Jesus Christ—the living, active Savior. Unlike other historical figures who remain in their tombs, Jesus conquered death and is alive today! When we worship, we step into the real presence of the Almighty God. Here, hearts are healed, depression lifts, and souls find peace. Jesus is not a myth; He is the alive God who hears your voice right now.',
    'praise songs': 'Praise is the victorious celebration of Jesus\' absolute power and authority! He is the Almighty God who does signs, wonders, and miracles. When we praise, we declare His goodness over every storm and trial. Praise shifts our focus to His limitless strength, breaking every chain and bringing joy and breakthrough. Praise is proof that our God is alive and actively working in our lives today!',
    'gospel songs': 'Gospel songs share the good news of salvation through Jesus Christ. Jesus came to earth, died for our sins, and rose again on the third day to give us eternal life. These songs contain rich biblical truths that guide our lives, strengthen our faith, and reveal the character of the living God. To know the Gospel is to know the path of truth, light, and everlasting hope.',
    'prayer songs': 'Prayer is talking directly to the Creator of the universe. In Jesus, God became flesh to understand our struggles, count our tears, and heal our pain. Prayer songs are heartfelt conversations with a living God who answers. Countless miracles, healings, and answered prayers stand as a testimony that Jesus is alive, listening, and ready to help you.',
    'christmas songs': 'Christmas is the celebration of God coming down to earth as a human child—Emmanuel, which means \'God with us\'. Jesus was born of a virgin, lived a perfect life, and brought light to a dark world. Christmas songs remind us of the great love of the Father who sent His Son to save us. He is not a distant deity, but a personal Savior who wants to dwell in your heart.',
    'revival songs': 'Revival is the spiritual awakening of the soul, turning back to the living God with passion and repentance. Revival songs call for the fire of the Holy Spirit to transform our lives, families, and nations. When the Spirit moves, chains of addiction are broken, cold hearts are set on fire, and the power of the living Jesus is displayed dynamically. Jesus is alive and calling you to a fresh, powerful walk of faith!',
    'youth songs': 'Youth songs are energetic, vibrant expressions of devotion for the younger generation. Setting our hearts on Jesus early in life anchors us against the waves of this world. These songs inspire young people to stand strong in faith, live with purpose, and declare that Jesus is their best friend, guide, and living Lord.'
  };

  // --- 2. INITIALIZATION ---
  function init() {
    // Load static songs (from songs.js)
    allSongs = typeof INITIAL_SONGS !== 'undefined' ? INITIAL_SONGS : [];
    
    // Initialize particle canvas background
    initCanvasParticles();
    
    // Perform initial rendering
    applyLyricsFontSize();
    renderCategoryFilters();
    renderSongs();
    
    // Bind all event listeners
    bindEvents();
  }

  // --- 3. CANVAS PARTICLE BACKGROUND SYSTEM ---
  function initCanvasParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particlesArray = [];
    
    function setCanvasSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = Math.random() * 0.15 - 0.075;
        this.speedY = Math.random() * 0.25 - 0.35; // Floating upwards slowly
        this.opacity = Math.random() * 0.5 + 0.15;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Wrap around borders
        if (this.y < 0) {
          this.y = canvas.height;
          this.x = Math.random() * canvas.width;
        }
        if (this.x < 0 || this.x > canvas.width) {
          this.x = Math.random() * canvas.width;
        }
      }
      
      draw() {
        ctx.fillStyle = `rgba(244, 196, 84, ${this.opacity})`; // Soft golden particle glow
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = '#f4c454';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset blur for performance
      }
    }
    
    function populateParticles() {
      particlesArray = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      requestAnimationFrame(animate);
    }
    
    populateParticles();
    animate();
    
    window.addEventListener('resize', populateParticles);
  }

  // --- 4. RENDER CATEGORY FILTERS (Hook to category-card click events) ---
  function renderCategoryFilters() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        categoryCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        card.classList.add('active');
        
        // Set active category value
        activeCategory = card.dataset.category;
        
        // Render filtered songs
        renderSongs();
        
        // Smooth scroll to the library heading
        if (libraryHeading) {
          libraryHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // --- 5. RENDER SONGS ---
  function renderSongs() {
    if (!songsGrid) return;

    // Update library section heading text
    if (libraryHeading) {
      if (activeCategory === 'all') {
        libraryHeading.textContent = "All Songs Library";
      } else {
        libraryHeading.textContent = `${activeCategory} Library`;
      }
    }
    if (libraryDescription) {
      const descKey = activeCategory.toLowerCase();
      libraryDescription.innerHTML = CATEGORY_DESCRIPTIONS[descKey] || CATEGORY_DESCRIPTIONS['all'];
    }

    // Filter matching criteria (ignores language restriction to show all songs)
    const filtered = allSongs.filter(song => {
      // 1. Category Filter
      let matchCategory = true;
      if (activeCategory !== 'all') {
        matchCategory = (song.categoryEnglish || '').toLowerCase() === activeCategory.toLowerCase();
      }
      
      // 2. Search Query (global search)
      let matchQuery = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        
        const titleTe = (song.titleTelugu || '').toLowerCase();
        const titleEn = (song.titleEnglish || '').toLowerCase();
        const lyricsTe = (song.lyricsTelugu || '').toLowerCase();
        const lyricsEn = (song.lyricsEnglish || '').toLowerCase();
        const artistTe = (song.artistTelugu || '').toLowerCase();
        const artistEn = (song.artistEnglish || '').toLowerCase();
        
        matchQuery = titleTe.includes(query) || 
                     titleEn.includes(query) || 
                     lyricsTe.includes(query) || 
                     lyricsEn.includes(query) ||
                     artistTe.includes(query) ||
                     artistEn.includes(query);
      }
      
      return matchCategory && matchQuery;
    });

    songsGrid.innerHTML = '';

    if (filtered.length === 0) {
      songsGrid.innerHTML = `
        <div class="no-results-card" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i class="fa-solid fa-face-frown" style="font-size: 2.5rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
          <h3 style="font-weight: 300; font-size: 1.4rem; color: var(--color-text-primary);">No Songs Found</h3>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.5rem;">We couldn't find any songs matching your search term. Please try another query.</p>
        </div>
      `;
      return;
    }

    // Append song cards dynamically
    filtered.forEach(song => {
      const card = document.createElement('article');
      card.className = 'song-card';
      
      const displayTitle = `<span class="telugu-title">${song.titleTelugu}</span><span class="translit-title">${song.titleEnglish}</span>`;
      const displayCategory = song.categoryEnglish || 'Worship';
      const displayArtist = song.artistEnglish || 'Traditional';

      let iconClass = 'fa-music';
      if (displayCategory.toLowerCase().includes('worship')) iconClass = 'fa-hands-praying';
      else if (displayCategory.toLowerCase().includes('praise')) iconClass = 'fa-music';
      else if (displayCategory.toLowerCase().includes('gospel')) iconClass = 'fa-book-bible';
      else if (displayCategory.toLowerCase().includes('prayer')) iconClass = 'fa-dove';
      else if (displayCategory.toLowerCase().includes('christmas')) iconClass = 'fa-star';
      else if (displayCategory.toLowerCase().includes('revival')) iconClass = 'fa-fire';
      else if (displayCategory.toLowerCase().includes('youth')) iconClass = 'fa-heart';

      card.innerHTML = `
        <div class="song-card-compact-icon">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="song-card-compact-main">
          <h3 class="song-card-title">${displayTitle}</h3>
        </div>
        <div class="song-card-compact-meta">
          <span class="song-category-tag">${displayCategory}</span>
          <button class="song-read-btn">View Lyrics <i class="fa-solid fa-chevron-right" style="margin-left: 6px; font-size: 0.65rem;"></i></button>
        </div>
      `;
      
      // Card click events
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        openLyricsModal(song);
      });
      
      card.querySelector('.song-read-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openLyricsModal(song);
      });
      
      songsGrid.appendChild(card);
    });
  }

  // --- 6. INSTANT SEARCH SUGGESTIONS LOGIC ---
  function handleSearchInput(e) {
    searchQuery = e.target.value;
    
    if (searchQuery.trim() !== '') {
      clearSearchBtn.style.display = 'block';
      showSearchSuggestions();
    } else {
      clearSearchBtn.style.display = 'none';
      suggestionBox.style.display = 'none';
    }
    
    renderSongs();
  }

  function showSearchSuggestions() {
    const query = searchQuery.toLowerCase().trim();
    
    const matches = allSongs.filter(song => {
      const titleTe = (song.titleTelugu || '').toLowerCase();
      const titleEn = (song.titleEnglish || '').toLowerCase();
      return titleTe.includes(query) || titleEn.includes(query);
    }).slice(0, 5);
    
    if (matches.length === 0) {
      suggestionBox.style.display = 'none';
      return;
    }
    
    suggestionBox.innerHTML = '';
    
    matches.forEach(song => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      
      div.innerHTML = `
        <span class="suggest-title">${song.titleEnglish} (${song.titleTelugu})</span>
        <span class="suggest-cat">${song.categoryEnglish || 'Worship'}</span>
      `;
      
      div.addEventListener('click', () => {
        openLyricsModal(song);
        suggestionBox.style.display = 'none';
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
      });
      
      suggestionBox.appendChild(div);
    });
    
    suggestionBox.style.display = 'block';
  }

  // --- 7. LYRICS PAGE MODAL ACTIONS ---
  function openLyricsModal(song) {
    activeSong = song;
    
    // Set headers
    modalSongTitle.textContent = song.titleEnglish;
    modalSongMeta.textContent = song.categoryEnglish || 'Worship Songs';
    
    // Inner Lyric language toggle mode
    let lyricsMode = 'telugu';
    const btnLyricTelugu = document.getElementById('btnLyricTelugu');
    const btnLyricEnglish = document.getElementById('btnLyricEnglish');
    
    function updateLyricsDisplay() {
      if (lyricsMode === 'telugu') {
        lyricsDisplay.textContent = song.lyricsTelugu;
        btnLyricTelugu.classList.add('active');
        btnLyricEnglish.classList.remove('active');
      } else {
        lyricsDisplay.textContent = song.lyricsEnglish || song.lyricsTelugu;
        btnLyricEnglish.classList.add('active');
        btnLyricTelugu.classList.remove('active');
      }
    }
    
    btnLyricTelugu.onclick = () => {
      lyricsMode = 'telugu';
      updateLyricsDisplay();
    };
    
    btnLyricEnglish.onclick = () => {
      lyricsMode = 'english';
      updateLyricsDisplay();
    };
    
    updateLyricsDisplay();
    updateFavoriteBtnState();
    
    // Show panel
    lyricModal.classList.add('active');
    lyricModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // Close the lyrics modal
  function closeLyricsModal() {
    lyricModal.classList.remove('active');
    lyricModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeSong = null;
  }

  // Favorites state manager
  function toggleFavorite() {
    if (!activeSong) return;
    
    const index = favoriteSongs.indexOf(activeSong.id);
    if (index === -1) {
      favoriteSongs.push(activeSong.id);
    } else {
      favoriteSongs.splice(index, 1);
    }
    
    localStorage.setItem('fav_jesus_songs', JSON.stringify(favoriteSongs));
    updateFavoriteBtnState();
  }

  function updateFavoriteBtnState() {
    if (!activeSong) return;
    
    const isFav = favoriteSongs.includes(activeSong.id);
    if (isFav) {
      favoriteSongBtn.classList.add('active');
      favoriteSongBtn.innerHTML = `<i class="fa-solid fa-heart" style="color: #ec4899;"></i>`;
    } else {
      favoriteSongBtn.classList.remove('active');
      favoriteSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
    }
  }

  // Lyrics Resizing Controls
  function applyLyricsFontSize() {
    lyricsDisplay.style.fontSize = `${currentLyricsFontSize}rem`;
    localStorage.setItem('lyricFontSize', currentLyricsFontSize);
  }

  function adjustFontSize(delta) {
    currentLyricsFontSize = Math.min(2.5, Math.max(0.85, currentLyricsFontSize + delta));
    applyLyricsFontSize();
  }

  function resetFontSize() {
    currentLyricsFontSize = 1.15;
    applyLyricsFontSize();
  }

  // Copy lyrics
  function copyLyricsToClipboard() {
    if (!activeSong) return;
    const title = activeSong.titleEnglish;
    const lyrics = lyricsDisplay.textContent;
    
    const textToCopy = `🎵 ${title} 🎵\n\n${lyrics}\n\n---\nJesus Songs & Lyrics App`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalHTML = copyLyricsBtn.innerHTML;
      copyLyricsBtn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> Copied!`;
      copyLyricsBtn.style.borderColor = '#10b981';
      
      setTimeout(() => {
        copyLyricsBtn.innerHTML = originalHTML;
        copyLyricsBtn.style.borderColor = '';
      }, 2000);
    }).catch(() => {
      alert('Failed to copy. Please select the text manually.');
    });
  }

  // Share lyrics
  function shareLyrics() {
    if (!activeSong) return;
    const title = activeSong.titleEnglish;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out the lyrics of "${title}" on our Jesus Songs website!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert(`Sharing: "${title}" lyrics - Link copied to clipboard!`);
      navigator.clipboard.writeText(window.location.href);
    }
  }

  // --- 8. SPIRITUAL REFLECTION MODAL ACTIONS ---
  function openSpiritualModal(type) {
    const data = SPIRITUAL_REFLECTIONS[type];
    if (!data) return;
    
    spiritualModalTitle.textContent = data.title;
    spiritualGraphic.innerHTML = `<i class="${data.icon}"></i>`;
    spiritualTextContent.innerHTML = data.text;
    
    spiritualModal.classList.add('active');
    spiritualModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSpiritualModal() {
    spiritualModal.classList.remove('active');
    spiritualModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // --- 9. EVENT BINDING ---
  function bindEvents() {
    // Scroll header opacity transition
    window.addEventListener('scroll', () => {
      if (appHeader) {
        if (window.scrollY > 50) {
          appHeader.classList.add('scrolled');
        } else {
          appHeader.classList.remove('scrolled');
        }
      }
    });

    // Search bar event listeners
    searchInput.addEventListener('input', handleSearchInput);
    
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      suggestionBox.style.display = 'none';
      renderSongs();
      searchInput.focus();
    });
    
    // Close suggestions box clicking outside
    document.addEventListener('click', (e) => {
      if (e.target !== searchInput && e.target !== suggestionBox) {
        suggestionBox.style.display = 'none';
      }
    });

    searchTriggerBtn.addEventListener('click', () => {
      renderSongs();
      suggestionBox.style.display = 'none';
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        renderSongs();
        suggestionBox.style.display = 'none';
      }
    });

    // Close lyric panel
    closeModalBtn.addEventListener('click', closeLyricsModal);
    lyricModal.addEventListener('click', (e) => {
      if (e.target === lyricModal) {
        closeLyricsModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lyricModal.classList.contains('active')) closeLyricsModal();
        if (spiritualModal && spiritualModal.classList.contains('active')) closeSpiritualModal();
      }
    });

    // Font tuner adjustments
    zoomInBtn.addEventListener('click', () => adjustFontSize(0.15));
    zoomOutBtn.addEventListener('click', () => adjustFontSize(-0.15));
    zoomNormalBtn.addEventListener('click', resetFontSize);
    
    // Actions triggers
    copyLyricsBtn.addEventListener('click', copyLyricsToClipboard);
    shareLyricsBtn.addEventListener('click', shareLyrics);
    favoriteSongBtn.addEventListener('click', toggleFavorite);
    if (printLyricsBtn) {
      printLyricsBtn.addEventListener('click', () => window.print());
    }

    // Click events for Spiritual Reflection Cards
    document.querySelectorAll('.clickable-reflection-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.reflection;
        openSpiritualModal(type);
      });
    });

    // Close spiritual modal controls
    if (closeSpiritualModalBtn) {
      closeSpiritualModalBtn.addEventListener('click', closeSpiritualModal);
    }
    if (spiritualModal) {
      spiritualModal.addEventListener('click', (e) => {
        if (e.target === spiritualModal) {
          closeSpiritualModal();
        }
      });
    }
  }

  // --- START THE APPLICATION ---
  init();
});
