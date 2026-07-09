const fetchAllButton = document.getElementById('fetch-quotes');
const fetchRandomButton = document.getElementById('fetch-random');
const fetchByAuthorButton = document.getElementById('fetch-by-author');
const toggleCategoryButton = document.getElementById('toggle-category');

const quoteContainer = document.getElementById('quote-container');
const cinematicListContainer = document.getElementById('cinematic-list');
const randomListContainer = document.getElementById('random-list');
const quoteText = document.querySelector('.quote');
const attributionText = document.querySelector('.attribution');
const splashElement = document.getElementById('splash');
const homeShell = document.querySelector('.home-shell');
let activeCategory = 'cinematic';

const revealHome = () => {
  if (homeShell) {
    homeShell.hidden = false;
  }

  if (splashElement) {
    splashElement.remove();
  }
};

if (splashElement && homeShell) {
  setTimeout(revealHome, 2500);
} else {
  revealHome();
}

const resetQuotes = () => {
  quoteContainer.innerHTML = '';
}

const renderError = response => {
  quoteContainer.innerHTML = `<p>Your request returned an error from the server: </p>
<p>Code: ${response.status}</p>
<p>${response.statusText}</p>`;
}

const renderQuotes = (quotes = []) => {
  resetQuotes();
  if (quotes.length > 0) {
    quotes.forEach(quote => {
      const newQuote = document.createElement('div');
      newQuote.className = 'single-quote';
      newQuote.innerHTML = `<div class="quote-text">${quote.quote}</div>
      <div class="attribution">- ${quote.person}</div>
      <div class="attribution">Category: ${quote.category || 'general'}</div>`;
      quoteContainer.appendChild(newQuote);
    });
  } else {
    quoteContainer.innerHTML = '<p>Your request returned no quotes.</p>';
  }
}

const renderCategoryQuotes = (targetElement, quotes = [], emptyMessage) => {
  if (!targetElement) {
    return;
  }

  targetElement.innerHTML = '';

  if (quotes.length > 0) {
    quotes.forEach((quote) => {
      const newQuote = document.createElement('div');
      newQuote.className = 'single-quote';
      newQuote.innerHTML = `<div class="quote-text">${quote.quote}</div>
      <div class="attribution">- ${quote.person}</div>`;
      targetElement.appendChild(newQuote);
    });
  } else {
    targetElement.innerHTML = `<p>${emptyMessage}</p>`;
  }
};

const fetchCategorySection = (category, targetElement, emptyMessage) => {
  fetch(`/api/quotes/${encodeURIComponent(category)}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      targetElement.innerHTML = `<p>Unable to load ${category} quotes right now.</p>`;
      return null;
    })
    .then((response) => {
      if (response) {
        renderCategoryQuotes(targetElement, response.quotes, emptyMessage);
      }
    });
};

fetchCategorySection('cinematic', cinematicListContainer, 'No cinematic quotes found.');
fetchCategorySection('random', randomListContainer, 'No random quotes found.');

fetchAllButton.addEventListener('click', () => {
  fetch('/api/quotes')
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      renderError(response);
    }
  })
  .then(response => {
    renderQuotes(response.quotes);
  });
});

fetchRandomButton.addEventListener('click', () => {
  fetch('/api/quote/random')
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      renderError(response);
    }
  })
  .then(response => {
    renderQuotes([response.quote]);
  });
});

fetchByAuthorButton.addEventListener('click', () => {
  const author = document.getElementById('author').value;
  fetch(`/api/quotes?person=${encodeURIComponent(author)}`)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      renderError(response);
    }
  })
  .then(response => {
    renderQuotes(response.quotes);
  });
});

toggleCategoryButton.addEventListener('click', () => {
  activeCategory = activeCategory === 'cinematic' ? 'random' : 'cinematic';
  toggleCategoryButton.textContent = `Toggle Category: ${activeCategory === 'cinematic' ? 'Cinematic' : 'Random'}`;

  fetch(`/api/quotes/${activeCategory}`)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      renderError(response);
    }
  })
  .then(response => {
    renderQuotes(response.quotes);
  });
});
