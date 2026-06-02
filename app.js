/**
 * Jesus Songs & Lyrics Web Application
 * Core Script, Dynamic Multi-Language Engine, Canvas Particle Engine, and Interactive Controls
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let allSongs = [];
  let customSongs = [];
  let currentLyricsFontSize = parseFloat(localStorage.getItem('lyricFontSize')) || 1.15; // in rem
  let activeSong = null;
  let activeCategory = 'all';
  let activeLang = 'english'; // 'telugu' or 'english'
  let searchQuery = '';
  let favoriteSongs = JSON.parse(localStorage.getItem('fav_jesus_songs')) || [];

  // --- DOM ELEMENTS ---
  const songsGrid = document.getElementById('songsGrid');
  const songCountEl = document.getElementById('songCount');
  const searchInput = document.getElementById('searchInput');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const suggestionBox = document.getElementById('suggestionBox');
  const categoryFilters = document.getElementById('categoryFilters');
  const appHeader = document.getElementById('appHeader');
  
  // Language elements to translate
  const btnLangTelugu = document.getElementById('btnLangTelugu');
  const btnLangEnglish = document.getElementById('btnLangEnglish');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  
  // Modals & Panels
  const lyricModal = document.getElementById('lyricModal');
  const modalSongTitle = document.getElementById('modalSongTitle');
  const modalSongMeta = document.getElementById('modalSongMeta');
  const lyricsDisplay = document.getElementById('lyricsDisplay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const favoriteSongBtn = document.getElementById('favoriteSongBtn');
  
  // Modal Actions
  const copyLyricsBtn = document.getElementById('copyLyricsBtn');
  const shareLyricsBtn = document.getElementById('shareLyricsBtn');
  const printLyricsBtn = document.getElementById('printLyricsBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomNormalBtn = document.getElementById('zoomNormalBtn');
  
  // Contributor Form Modal
  const addSongBtn = document.getElementById('addSongBtn');
  const addSongModal = document.getElementById('addSongModal');
  const closeFormBtn = document.getElementById('closeFormBtn');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const addSongForm = document.getElementById('addSongForm');
  const saveSongBtn = document.getElementById('saveSongBtn');
  
  // Footer card items
  const btnContact = null;

  // --- 1. DYNAMIC TRANSLATION DICTIONARY ---
  const TRANSLATIONS = {
    telugu: {
      heroTitle: "Jesus Songs & Lyrics",
      heroSubtitle: "Discover worship songs, praise songs, gospel songs, and inspirational lyrics that bring you closer to God.",
      searchPlaceholder: "Search songs, lyrics, worship songs...",
      worshipTitle: "Why Jesus Songs?",
      worshipDesc: "Jesus songs help believers worship, pray, meditate on God's word, and strengthen their faith. Through lyrics and music, people can experience encouragement, peace, hope, and spiritual growth.",
      countLabel: "Songs Available: ",
      addSongBtn: "Add Custom Song",
      searchBtnText: "Search",
      noSongsTitle: "No Songs Found",
      noSongsDesc: "We couldn't find any songs matching your search term. Please try another query.",
      readBtnText: "View Lyrics",
      lyricsActionsLabel: "Lyrics Options:",
      textSizeLabel: "Text Size:",
      copyLyricsBtn: "Copy Lyrics",
      shareLyricsBtn: "Share",
      footerTagline: "Made with Faith and Love",
      developerTag: "Developed by AV",
      portfolioBtn: "Portfolio",
      contactBtn: "Contact",
      categories: {
        "all": "All Songs",
        "Worship Songs": "Worship Songs",
        "Praise Songs": "Praise Songs",
        "Gospel Songs": "Gospel Songs",
        "Prayer Songs": "Prayer Songs",
        "Christmas Songs": "Christmas Songs",
        "Revival Songs": "Revival Songs",
        "Youth Songs": "Youth Songs",
        "Telugu Songs": "Telugu Songs",
        "English Songs": "English Songs"
      }
    },
    english: {
      heroTitle: "Jesus Songs & Lyrics",
      heroSubtitle: "Discover worship songs, praise songs, gospel songs, and inspirational lyrics that bring you closer to God.",
      searchPlaceholder: "Search songs, lyrics, worship songs...",
      worshipTitle: "Why Jesus Songs?",
      worshipDesc: "Jesus songs help believers worship, pray, meditate on God's word, and strengthen their faith. Through lyrics and music, people can experience encouragement, peace, hope, and spiritual growth.",
      countLabel: "Songs Available: ",
      addSongBtn: "Add Custom Song",
      searchBtnText: "Search",
      noSongsTitle: "No Songs Found",
      noSongsDesc: "We couldn't find any songs matching your search term. Please try another query.",
      readBtnText: "View Lyrics",
      lyricsActionsLabel: "Lyrics Options:",
      textSizeLabel: "Text Size:",
      copyLyricsBtn: "Copy Lyrics",
      shareLyricsBtn: "Share",
      footerTagline: "Made with Faith and Love",
      developerTag: "Developed by AV",
      portfolioBtn: "Portfolio",
      contactBtn: "Contact",
      categories: {
        "all": "All Songs",
        "Worship Songs": "Worship Songs",
        "Praise Songs": "Praise Songs",
        "Gospel Songs": "Gospel Songs",
        "Prayer Songs": "Prayer Songs",
        "Christmas Songs": "Christmas Songs",
        "Revival Songs": "Revival Songs",
        "Youth Songs": "Youth Songs",
        "Telugu Songs": "Telugu Songs",
        "English Songs": "English Songs"
      }
    }
  };

  // --- 2. INITIALIZATION ---
  function init() {
    // A. Load custom songs from local storage
    const storedCustom = localStorage.getItem('custom_jesus_songs');
    if (storedCustom) {
      try {
        customSongs = JSON.parse(storedCustom);
      } catch (e) {
        console.error("Error parsing custom songs", e);
        customSongs = [];
      }
    }
    
    // B. Merge base INITIAL_SONGS (from songs.js) with custom songs
    const baseSongs = typeof INITIAL_SONGS !== 'undefined' ? INITIAL_SONGS : [];
    allSongs = [...customSongs, ...baseSongs];
    
    // C. Initialize particle canvas background
    initCanvasParticles();
    
    // D. Load active language preferences from memory if any
    activeLang = localStorage.getItem('appLang') || 'english';
    
    // E. Perform initial rendering
    applyLanguageSwitch();
    applyLyricsFontSize();
    
    // F. Bind all event listeners
    bindEvents();
  }

  // --- 3. CANVAS PARTICLE BACKGROUND SYSTEM ---
  function initCanvasParticles() {
    const canvas = document.getElementById('particleCanvas');
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
    
    // Adjust particles density on screen resize
    window.addEventListener('resize', populateParticles);
  }

  // --- 4. MULTI-LANGUAGE DYNAMIC RENDERING ---
  function applyLanguageSwitch() {
    const dict = TRANSLATIONS[activeLang];
    localStorage.setItem('appLang', activeLang);
    
    // Switch active state classes on header buttons
    if (activeLang === 'telugu') {
      btnLangTelugu.classList.add('active');
      btnLangEnglish.classList.remove('active');
    } else {
      btnLangEnglish.classList.add('active');
      btnLangTelugu.classList.remove('active');
    }
    
    // Translate static DOM strings
    heroTitle.textContent = dict.heroTitle;
    heroSubtitle.textContent = dict.heroSubtitle;
    searchInput.placeholder = dict.searchPlaceholder;
    
    // About/Why section translation
    document.querySelector('.about-title').textContent = dict.worshipTitle;
    document.querySelector('.about-desc').textContent = dict.worshipDesc;
    
    // Add Song button translation
    addSongBtn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> ${dict.addSongBtn}`;
    searchTriggerBtn.textContent = dict.searchBtnText;
    
    // Footer translations
    const taglineEl = document.querySelector('.rect-tagline');
    if (taglineEl) taglineEl.textContent = dict.footerTagline;
    
    const developerEl = document.querySelector('.rect-developer');
    if (developerEl) developerEl.textContent = dict.developerTag;
    
    const portfolioEl = document.querySelector('.portfolio-btn');
    if (portfolioEl) portfolioEl.innerHTML = `${dict.portfolioBtn} <i class="fa-solid fa-arrow-up-right-from-square"></i>`;
    
    // Re-render categories layout
    renderCategoryFilters(dict.categories);
    
    // Re-render dynamic song list
    renderSongs();
  }

  function renderCategoryFilters(categoriesDict) {
    categoryFilters.innerHTML = '';
    
    // Define ordering of category badge values
    const filterKeys = [
      "all", "Worship Songs", "Praise Songs", "Gospel Songs", 
      "Prayer Songs", "Christmas Songs", "Revival Songs", "Youth Songs",
      "Telugu Songs", "English Songs"
    ];
    
    filterKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${activeCategory === key ? 'active' : ''}`;
      btn.dataset.filter = key;
      btn.textContent = categoriesDict[key] || key;
      
      btn.addEventListener('click', (e) => {
        const activePill = categoryFilters.querySelector('.filter-pill.active');
        if (activePill) activePill.classList.remove('active');
        btn.classList.add('active');
        activeCategory = key;
        renderSongs();
      });
      
      categoryFilters.appendChild(btn);
    });
  }

  // --- 5. RENDER SONGS CORE ---
  function renderSongs() {
    const dict = TRANSLATIONS[activeLang];
    
    // Filter matching criteria
    const filtered = allSongs.filter(song => {
      // 1. Language Filter: filter based on activeLang
      let matchLanguage = false;
      if (activeLang === 'telugu') {
        matchLanguage = !!(song.titleTelugu && song.lyricsTelugu);
      } else {
        matchLanguage = !!(song.titleEnglish && song.lyricsEnglish);
      }
      
      // 2. Category filters
      let matchCategory = true;
      if (activeCategory !== 'all') {
        matchCategory = (song.categoryEnglish || '').toLowerCase() === activeCategory.toLowerCase();
      }
      
      // 3. Search query matches (checks globally title, lyrics, artists, category)
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
      
      return matchLanguage && matchCategory && matchQuery;
    });

    // Update statistics banner count
    if (songCountEl) {
      songCountEl.textContent = filtered.length;
    }
    
    // Empty songs library grid view
    songsGrid.innerHTML = '';

    if (filtered.length === 0) {
      songsGrid.innerHTML = `
        <div class="no-results-card">
          <i class="fa-solid fa-face-frown"></i>
          <h3>${dict.noSongsTitle}</h3>
          <p>${dict.noSongsDesc}</p>
        </div>
      `;
      return;
    }

    // Append song cards dynamically
    filtered.forEach(song => {
      const card = document.createElement('article');
      card.className = 'song-card';
      
      // Select song details based on active language tab
      const displayTitle = activeLang === 'telugu' ? song.titleTelugu : song.titleEnglish;
      const displayCategory = activeLang === 'telugu' ? song.categoryTelugu : song.categoryEnglish;
      const displayArtist = activeLang === 'telugu' ? song.artistTelugu : song.artistEnglish;
      const displayDesc = activeLang === 'telugu' ? song.descriptionTelugu : song.descriptionEnglish;
      
      // Shorten description if too long
      const shortDesc = displayDesc || (activeLang === 'telugu' 
        ? "రక్షకుడైన యేసు క్రీస్తును కీర్తించే మధురమైన ఆత్మీయ గీతం." 
        : "A sacred worship song devoted to praising our Lord Jesus Christ.");
        
      const languageBadge = song.lyricsEnglish ? "English / Telugu" : "Telugu Script";

      const defaultImage = "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?q=80&w=600";
      const songImage = song.imageUrl || defaultImage;

      card.innerHTML = `
        <div class="song-card-img-wrapper">
          <img src="${songImage}" alt="${displayTitle}" class="song-card-img">
          <div class="song-card-header-overlay">
            <span class="song-category-tag">${displayCategory || 'Worship'}</span>
          </div>
        </div>
        <div class="song-card-body">
          <div class="song-card-meta-row">
            <span class="song-lang-tag">${languageBadge}</span>
          </div>
          <h3 class="song-card-title">${displayTitle}</h3>
          <p class="song-card-desc">${shortDesc}</p>
          <div class="song-card-footer">
            <span class="song-card-artist"><i class="fa-solid fa-microphone"></i> ${displayArtist || 'AV'}</span>
            <button class="song-read-btn">${dict.readBtnText}</button>
          </div>
        </div>
      `;
      
      // Card click events
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return; // Handled by button listener
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
    
    renderSongs(); // Update main grid live as you type
  }

  function showSearchSuggestions() {
    const query = searchQuery.toLowerCase().trim();
    
    // Find matching records
    const matches = allSongs.filter(song => {
      const titleTe = (song.titleTelugu || '').toLowerCase();
      const titleEn = (song.titleEnglish || '').toLowerCase();
      return titleTe.includes(query) || titleEn.includes(query);
    }).slice(0, 5); // Limit suggestions to top 5
    
    if (matches.length === 0) {
      suggestionBox.style.display = 'none';
      return;
    }
    
    suggestionBox.innerHTML = '';
    
    matches.forEach(song => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      
      const displayTitle = activeLang === 'telugu' ? song.titleTelugu : song.titleEnglish;
      const displayCategory = activeLang === 'telugu' ? song.categoryTelugu : song.categoryEnglish;
      
      div.innerHTML = `
        <span class="suggest-title">${displayTitle}</span>
        <span class="suggest-cat">${displayCategory || 'Worship'}</span>
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
    modalSongTitle.textContent = activeLang === 'telugu' ? song.titleTelugu : song.titleEnglish;
    
    const displayCategory = activeLang === 'telugu' ? song.categoryTelugu : song.categoryEnglish;
    const langLabel = activeLang === 'telugu' ? "తెలుగు" : "English";
    modalSongMeta.textContent = `${langLabel} • ${displayCategory || 'Worship Songs'}`;
    
    // Load lyrics script
    lyricsDisplay.textContent = activeLang === 'telugu' ? song.lyricsTelugu : (song.lyricsEnglish || song.lyricsTelugu);
    
    // Load favorite state
    updateFavoriteBtnState();
    
    // Copy/Share button translations
    const dict = TRANSLATIONS[activeLang];
    copyLyricsBtn.innerHTML = `<i class="fa-solid fa-copy"></i> ${dict.copyLyricsBtn}`;
    shareLyricsBtn.innerHTML = `<i class="fa-solid fa-share-nodes"></i> ${dict.shareLyricsBtn}`;
    
    // Show panel
    lyricModal.classList.add('active');
    lyricModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

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
    const title = activeLang === 'telugu' ? activeSong.titleTelugu : activeSong.titleEnglish;
    const lyrics = activeLang === 'telugu' ? activeSong.lyricsTelugu : (activeSong.lyricsEnglish || activeSong.lyricsTelugu);
    
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
    const title = activeLang === 'telugu' ? activeSong.titleTelugu : activeSong.titleEnglish;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out the lyrics of "${title}" on our Jesus Songs website!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback share alerts
      alert(`Sharing: "${title}" lyrics - Link copied to clipboard!`);
      navigator.clipboard.writeText(window.location.href);
    }
  }

  // --- 8. CONTRIBUTOR FORM MODAL ACTIONS ---
  function openAddSongModal() {
    addSongModal.classList.add('active');
    addSongModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAddSongModal() {
    addSongModal.classList.remove('active');
    addSongModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    addSongForm.reset();
  }

  function handleSaveSong() {
    const titleTe = document.getElementById('inputTitleTelugu').value.trim();
    const titleEn = document.getElementById('inputTitleEnglish').value.trim();
    const category = document.getElementById('selectCategory').value;
    const artist = document.getElementById('inputArtist').value.trim() || 'AV';
    const key = document.getElementById('inputKey').value.trim() || 'F Major';
    const tempo = document.getElementById('inputTempo').value.trim() || '75 BPM';
    const lyrics = document.getElementById('textareaLyrics').value.trim();

    if (!titleTe || !titleEn || !category || !lyrics) {
      alert('Please fill out all fields marked with (*).');
      return;
    }

    // Build bilingual model song properties
    const newSong = {
      id: `custom-${Date.now()}`,
      titleTelugu: titleTe,
      titleEnglish: titleEn,
      artistTelugu: artist,
      artistEnglish: artist,
      categoryTelugu: category === 'Worship Songs' ? 'ఆరాధన గీతాలు' : 'స్తుతి గీతాలు',
      categoryEnglish: category,
      descriptionTelugu: "నూతనంగా జోడించబడిన యేసయ్య ఆరాధన పాట.",
      descriptionEnglish: "A newly added devotional song for prayer and worship.",
      key: key,
      tempo: tempo,
      lyricsTelugu: lyrics,
      lyricsEnglish: lyrics // Default to same transliterated field
    };

    customSongs.unshift(newSong);
    localStorage.setItem('custom_jesus_songs', JSON.stringify(customSongs));
    
    // Refresh database
    const baseSongs = typeof INITIAL_SONGS !== 'undefined' ? INITIAL_SONGS : [];
    allSongs = [...customSongs, ...baseSongs];
    
    renderSongs();
    closeAddSongModal();
    
    alert(`🎉 "${titleTe}" has been successfully added to the library!`);
  }

  // --- 9. EVENT BINDING ---
  function bindEvents() {
    // Scroll header opacity transition
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        appHeader.classList.add('scrolled');
      } else {
        appHeader.classList.remove('scrolled');
      }
    });

    // Language switcher click events
    btnLangTelugu.addEventListener('click', () => {
      activeLang = 'telugu';
      applyLanguageSwitch();
    });
    btnLangEnglish.addEventListener('click', () => {
      activeLang = 'english';
      applyLanguageSwitch();
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
        if (addSongModal.classList.contains('active')) closeAddSongModal();
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

    // Add Song modal events
    addSongBtn.addEventListener('click', openAddSongModal);
    closeFormBtn.addEventListener('click', closeAddSongModal);
    cancelFormBtn.addEventListener('click', closeAddSongModal);
    addSongModal.addEventListener('click', (e) => {
      if (e.target === addSongModal) {
        closeAddSongModal();
      }
    });

    addSongForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveSong();
    });
  }

  // --- START THE APPLICATION ---
  init();
});
