(function() {
  var fuseInstance = null;
  var indexLoaded = false;
  var overlay = document.getElementById('search-overlay');
  var input = document.getElementById('search-input');
  var resultsContainer = document.getElementById('js-results-container');
  if (!overlay || !input || !resultsContainer) return;

  var noResults = resultsContainer.querySelector('.no-results');
  var debounceTimer = null;

  function fetchIndex() {
    if (indexLoaded) return Promise.resolve(fuseInstance);
    return fetch('/index.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        fuseInstance = new Fuse(data, {
          keys: ['title', 'description', 'tags', 'content'],
          threshold: 0.3
        });
        indexLoaded = true;
        return fuseInstance;
      });
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function renderResults(results) {
    // Remove old result items (keep .no-results)
    var old = resultsContainer.querySelectorAll('.search-result-item');
    for (var i = 0; i < old.length; i++) {
      old[i].remove();
    }

    if (results.length === 0) {
      noResults.style.display = '';
      resultsContainer.classList.remove('hidden');
      return;
    }

    noResults.style.display = 'none';
    resultsContainer.classList.remove('hidden');

    var fragment = document.createDocumentFragment();
    var limit = Math.min(results.length, 10);
    for (var i = 0; i < limit; i++) {
      var item = results[i].item;
      var a = document.createElement('a');
      a.href = item.permalink;
      a.className = 'search-result-item block px-4 py-3 hover:bg-[var(--bg-alt)] transition-base';
      if (i > 0) {
        a.style.borderTop = '1px solid var(--border)';
      }

      var title = document.createElement('div');
      title.className = 'font-semibold text-theme-heading text-sm';
      title.textContent = item.title;

      var desc = document.createElement('div');
      desc.className = 'text-theme-alt text-xs mt-1 line-clamp-2';
      desc.textContent = truncate(item.description || item.content, 120);

      a.appendChild(title);
      a.appendChild(desc);

      if (item.tags && item.tags.length > 0) {
        var tag = document.createElement('span');
        tag.className = 'inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[var(--bg-alt)] text-theme-alt capitalize';
        tag.textContent = item.tags[0];
        a.appendChild(tag);
      }

      fragment.appendChild(a);
    }
    resultsContainer.appendChild(fragment);
  }

  function hideResults() {
    resultsContainer.classList.add('hidden');
    var old = resultsContainer.querySelectorAll('.search-result-item');
    for (var i = 0; i < old.length; i++) {
      old[i].remove();
    }
  }

  function doSearch(query) {
    if (!query.trim()) {
      hideResults();
      return;
    }
    fetchIndex().then(function(fuse) {
      var results = fuse.search(query);
      renderResults(results);
    });
  }

  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    var query = input.value;
    debounceTimer = setTimeout(function() {
      doSearch(query);
    }, 200);
  });

  // Clear results when search overlay is closed
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && !overlay.classList.contains('is-open')) {
        input.value = '';
        hideResults();
      }
    });
  });
  observer.observe(overlay, { attributes: true });
})();
