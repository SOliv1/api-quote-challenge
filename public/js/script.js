const nextQuoteButton = document.getElementById('next-quote');
const fetchByAuthorButton = document.getElementById('fetch-by-author');
const toggleCategoryButton = document.getElementById('toggle-category');

const quoteText = document.getElementById('quote-text');
const quotePerson = document.getElementById('quote-person');
const splashElement = document.getElementById('splash');
const homeShell = document.querySelector('.home-shell');
let activeCategory = 'cinematic';
let fadeTimeout;

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

const showMessage = (message, person = '') => {
  clearTimeout(fadeTimeout);
  quoteText.classList.remove('show');
  quotePerson.classList.remove('show');

  fadeTimeout = setTimeout(() => {
    quoteText.textContent = message;
    quotePerson.textContent = person;
    quoteText.classList.add('show');
    quotePerson.classList.add('show');
  }, 800);
};


const renderQuote = (quote) => {
  if (!quote) {
    showMessage('No quotes found.', '');
    return;
  }

  const quoteContent = quote.text || quote.quote;
  const person = quote.person ? `- ${quote.person}` : '';
  showMessage(`"${quoteContent}"`, person);
};

const fetchQuotes = (path) => {
  return fetch(path)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      showMessage(`Request failed: ${response.status} ${response.statusText}`, '');
      return [];
    })
    .then((response) => {
      return Array.isArray(response) ? response : response.quotes || [];
    });
};

const getRandomQuote = (quotes = []) => {
  if (quotes.length === 0) {
    return null;
  }

  return quotes[Math.floor(Math.random() * quotes.length)];
};

const fetchRandomQuote = () => {
  fetchQuotes(`/quotes/${activeCategory}`)
  .then(quotes => {
    renderQuote(getRandomQuote(quotes));
  });
};

const fetchByAuthor = () => {
  const author = document.getElementById('author').value;
  fetchQuotes(`/quotes?person=${encodeURIComponent(author)}`)
  .then(quotes => {
    renderQuote(getRandomQuote(quotes));
  });
};

const toggleCategory = () => {
  activeCategory = activeCategory === 'cinematic' ? 'random' : 'cinematic';
  toggleCategoryButton.textContent = `Category: ${activeCategory === 'cinematic' ? 'Cinematic' : 'Random'}`;

  fetchQuotes(`/quotes/${activeCategory}`)
  .then(quotes => {
    renderQuote(getRandomQuote(quotes));
  });
};

nextQuoteButton.addEventListener('click', fetchRandomQuote);
fetchByAuthorButton.addEventListener('click', fetchByAuthor);
toggleCategoryButton.addEventListener('click', toggleCategory);
