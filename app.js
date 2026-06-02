/**
 * Jesus Telugu Songs Web Application
 * Core Logic & State Management
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let allSongs = [];
  let customSongs = [];
  let currentLyricsFontSize = parseFloat(localStorage.getItem('lyricFontSize')) || 1.15; // in rem
  let activeSong = null;
  let activeCategory = 'all';
  let searchQuery = '';

  // --- DOM ELEMENTS ---
  const songsGrid = document.getElementById('songsGrid');
  const songCountEl = document.getElementById('songCount');
  const searchInput = document.getElementById('searchInput');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filtersContainer = document.getElementById('filtersContainer');
  
  // Modals & Panels
  const lyricModal = document.getElementById('lyricModal');
  const modalTitleTelugu = document.getElementById('modalTitleTelugu');
  const modalTitleEnglish = document.getElementById('modalTitleEnglish');
  const lyricsDisplay = document.getElementById('lyricsDisplay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  // Modal Actions
  const copyLyricsBtn = document.getElementById('copyLyricsBtn');
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

  // --- INITIALIZATION ---
  function init() {
    // 1. Load custom songs from local storage
    const storedCustom = localStorage.getItem('custom_jesus_songs');
    if (storedCustom) {
      try {
        customSongs = JSON.parse(storedCustom);
      } catch (e) {
        console.error("Error parsing custom songs from localStorage", e);
        customSongs = [];
      }
    }
    
    // 2. Merge preloaded INITIAL_SONGS (from songs.js) with custom songs
    const baseSongs = typeof INITIAL_SONGS !== 'undefined' ? INITIAL_SONGS : [];
    allSongs = [...customSongs, ...baseSongs];
    
    // 3. Render initial list
    renderSongs();
    applyLyricsFontSize();
    
    // 4. Bind all event listeners
    bindEvents();
  }

  // --- RENDERING CORE ---
  function renderSongs() {
    // Apply filters and searches
    const filtered = allSongs.filter(song => {
      // Category Filter
      const matchCategory = activeCategory === 'all' || 
                            song.category.toLowerCase().includes(activeCategory.toLowerCase());
      
      // Search Query Filter (Fuzzy Search across Telugu, English titles and lyrics)
      let matchQuery = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const titleTe = (song.titleTelugu || '').toLowerCase();
        const titleEn = (song.titleEnglish || '').toLowerCase();
        const lyrics = (song.lyricsTelugu || '').toLowerCase();
        const artist = (song.artist || '').toLowerCase();
        
        matchQuery = titleTe.includes(query) || 
                     titleEn.includes(query) || 
                     lyrics.includes(query) ||
                     artist.includes(query);
      }
      
      return matchCategory && matchQuery;
    });

    // Update Counter
    songCountEl.textContent = allSongs.length;
    
    // Clear grid
    songsGrid.innerHTML = '';

    if (filtered.length === 0) {
      songsGrid.innerHTML = `
        <div class="no-results-card">
          <i class="fa-solid fa-face-frown"></i>
          <h3>No Songs Found</h3>
          <p>We couldn't find any songs matching your search term. Please try searching with another keyword.</p>
        </div>
      `;
      return;
    }

    // Render cards
    filtered.forEach(song => {
      const card = document.createElement('article');
      card.className = 'song-card';
      card.dataset.id = song.id;
      
      card.innerHTML = `
        <div class="song-card-header">
          <span class="song-category">${song.category.split(' ')[0]}</span>
          ${song.key ? `<span class="song-key"><i class="fa-solid fa-guitar"></i> ${song.key}</span>` : ''}
        </div>
        <h3 class="song-title-telugu">${song.titleTelugu}</h3>
        <p class="song-title-english">${song.titleEnglish}</p>
        <div class="song-card-footer">
          <span class="song-artist"><i class="fa-solid fa-microphone"></i> ${song.artist || 'Traditional'}</span>
          <button class="read-btn" data-id="${song.id}">Read Lyrics <i class="fa-solid fa-angle-right"></i></button>
        </div>
      `;
      
      // Event listener to open lyrics
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('read-btn') && e.target.tagName === 'BUTTON') return;
        openLyricsModal(song);
      });
      
      // Also bind explicitly to the button
      card.querySelector('.read-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openLyricsModal(song);
      });
      
      songsGrid.appendChild(card);
    });
  }

  // --- LYRIC MODAL LOGIC ---
  function openLyricsModal(song) {
    activeSong = song;
    modalTitleTelugu.textContent = song.titleTelugu;
    modalTitleEnglish.textContent = song.titleEnglish;
    
    // Set Telugu Lyrics
    lyricsDisplay.textContent = song.lyricsTelugu;
    
    // Open Modal
    lyricModal.classList.add('active');
    lyricModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scrolling
  }

  function closeLyricsModal() {
    lyricModal.classList.remove('active');
    lyricModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Unlock background scrolling
    activeSong = null;
  }

  // Readability/Text Zoom Controls
  function applyLyricsFontSize() {
    lyricsDisplay.style.fontSize = `${currentLyricsFontSize}rem`;
    localStorage.setItem('lyricFontSize', currentLyricsFontSize);
  }

  // Adjust font size
  function adjustFontSize(delta) {
    currentLyricsFontSize = Math.min(2.5, Math.max(0.85, currentLyricsFontSize + delta));
    applyLyricsFontSize();
  }

  function resetFontSize() {
    currentLyricsFontSize = 1.15;
    applyLyricsFontSize();
  }

  // Copy Lyrics to Clipboard
  function copyLyricsToClipboard() {
    if (!activeSong) return;
    
    const textToCopy = `🎵 ${activeSong.titleTelugu} (${activeSong.titleEnglish}) 🎵\n\n${activeSong.lyricsTelugu}\n\n---\nJesus Telugu Songs Library`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Temporary UI Success feedback
      const originalHTML = copyLyricsBtn.innerHTML;
      copyLyricsBtn.innerHTML = `<i class="fa-solid fa-check" style="color: #34d399;"></i> Copied!`;
      copyLyricsBtn.style.borderColor = '#10b981';
      copyLyricsBtn.style.color = '#34d399';
      
      setTimeout(() => {
        copyLyricsBtn.innerHTML = originalHTML;
        copyLyricsBtn.style.borderColor = '';
        copyLyricsBtn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Could not copy lyrics: ', err);
      alert('Unable to copy. Please select and copy the text manually.');
    });
  }

  // Print lyrics
  function printLyrics() {
    window.print();
  }

  // --- CONTRIBUTOR FORM LOGIC ---
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
    const artist = document.getElementById('inputArtist').value.trim() || 'Traditional';
    const key = document.getElementById('inputKey').value.trim();
    const tempo = document.getElementById('inputTempo').value.trim();
    const lyrics = document.getElementById('textareaLyrics').value.trim();

    if (!titleTe || !titleEn || !category || !lyrics) {
      alert('Please fill out all required fields marked with (*).');
      return;
    }

    const newSong = {
      id: `custom-${Date.now()}`,
      titleTelugu: titleTe,
      titleEnglish: titleEn,
      artist: artist,
      category: category,
      key: key || null,
      tempo: tempo || null,
      lyricsTelugu: lyrics
    };

    customSongs.unshift(newSong);
    localStorage.setItem('custom_jesus_songs', JSON.stringify(customSongs));
    
    const baseSongs = typeof INITIAL_SONGS !== 'undefined' ? INITIAL_SONGS : [];
    allSongs = [...customSongs, ...baseSongs];
    
    renderSongs();
    closeAddSongModal();
    
    alert(`🎉 "${titleTe}" has been successfully added to your library!`);
  }

  // --- EVENT BINDING ---
  function bindEvents() {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.trim() !== '') {
        clearSearchBtn.style.display = 'flex';
      } else {
        clearSearchBtn.style.display = 'none';
      }
      renderSongs();
    });

    searchTriggerBtn.addEventListener('click', () => {
      renderSongs();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderSongs();
      searchInput.focus();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        renderSongs();
      }
    });

    filtersContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-badge')) return;
      
      const activeBadge = filtersContainer.querySelector('.filter-badge.active');
      if (activeBadge) activeBadge.classList.remove('active');
      e.target.classList.add('active');
      
      activeCategory = e.target.dataset.category;
      renderSongs();
    });

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

    zoomInBtn.addEventListener('click', () => adjustFontSize(0.15));
    zoomOutBtn.addEventListener('click', () => adjustFontSize(-0.15));
    zoomNormalBtn.addEventListener('click', resetFontSize);
    
    copyLyricsBtn.addEventListener('click', copyLyricsToClipboard);
    printLyricsBtn.addEventListener('click', printLyrics);

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
