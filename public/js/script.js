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
      const quoteContent = quote.text || quote.quote;
      const newQuote = document.createElement('div');
      newQuote.className = 'single-quote';
      newQuote.innerHTML = `<div class="quote-text">${quoteContent}</div>
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
      const quoteContent = quote.text || quote.quote;
      const newQuote = document.createElement('div');
      newQuote.className = 'single-quote';
      newQuote.innerHTML = `<div class="quote-text">${quoteContent}</div>
      <div class="attribution">- ${quote.person}</div>`;
      targetElement.appendChild(newQuote);
    });
  } else {
    targetElement.innerHTML = `<p>${emptyMessage}</p>`;
  }
};

const fetchQuotes = (path) => {
  return fetch(path)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      renderError(response);
      return [];
    })
    .then((response) => {
      return Array.isArray(response) ? response : response.quotes;
    });
};

const fetchAllQuotes = () => {
  fetchQuotes('/quotes')
  .then(quotes => {
    renderQuotes(quotes);
  });
};

const fetchRandomQuote = () => {
  fetchQuotes('/quotes/random')
  .then(quotes => {
    renderQuotes(quotes.length > 0 ? [quotes[Math.floor(Math.random() * quotes.length)]] : []);
  });
};

const fetchByAuthor = () => {
  const author = document.getElementById('author').value;
  fetchQuotes(`/quotes?person=${encodeURIComponent(author)}`)
  .then(quotes => {
    renderQuotes(quotes);
  });
};

const toggleCategory = () => {
  activeCategory = activeCategory === 'cinematic' ? 'random' : 'cinematic';
  toggleCategoryButton.textContent = `Toggle Category: ${activeCategory === 'cinematic' ? 'Cinematic' : 'Random'}`;

  fetchQuotes(`/quotes/${activeCategory}`)
  .then(quotes => {
    renderQuotes(quotes);
  });
};

fetchAllButton.addEventListener('click', fetchAllQuotes);
fetchRandomButton.addEventListener('click', fetchRandomQuote);
fetchByAuthorButton.addEventListener('click', fetchByAuthor);
toggleCategoryButton.addEventListener('click', toggleCategory);
