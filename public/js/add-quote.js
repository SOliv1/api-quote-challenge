const submitButton = document.getElementById('submit-quote');
const newQuoteContainer = document.getElementById('new-quote');
const quoteListContainer = document.getElementById('quote-list');

const getQuoteContent = (quote) => quote.text || quote.quote;

const renderMessage = (message) => {
  newQuoteContainer.innerHTML = `<p>${message}</p>`;
};

const loadQuotes = () => {
  fetch('/api/quotes')
    .then((response) => response.json())
    .then(({ quotes = [] }) => {
      quoteListContainer.innerHTML = '';

      if (quotes.length === 0) {
        quoteListContainer.innerHTML = '<p>No quotes found.</p>';
        return;
      }

      quotes.forEach((quote) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-list-item';
        quoteItem.innerHTML = `
          <div>
            <div class="quote-text">${getQuoteContent(quote)}</div>
            <div class="attribution">- ${quote.person}</div>
            <div class="attribution">Category: ${quote.category || 'random'}</div>
          </div>
          <button class="remove-quote" data-id="${quote._id}">Remove</button>
        `;
        quoteListContainer.appendChild(quoteItem);
      });
    })
    .catch(() => {
      quoteListContainer.innerHTML = '<p>Unable to load quotes right now.</p>';
    });
};

const removeQuote = (quoteId) => {
  fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
    method: 'DELETE'
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to remove quote.');
      }

      return response.json();
    })
    .then(({ quote }) => {
      renderMessage(`Removed "${getQuoteContent(quote)}".`);
      loadQuotes();
    })
    .catch(() => {
      renderMessage('Unable to remove that quote right now.');
    });
};

submitButton.addEventListener('click', () => {
  const quote = document.getElementById('quote').value.trim();
  const person = document.getElementById('person').value.trim();

  fetch('/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: quote,
      person
    })
  })
    .then(response => response.json())
    .then(({ quote }) => {
      newQuoteContainer.innerHTML = `
      <h3>Congrats, your quote was added!</h3>
      <div class="quote-text">${getQuoteContent(quote)}</div>
      <div class="attribution">- ${quote.person}</div>
      <p>Go to the <a href="/index.html">home page</a> to request and view all quotes.</p>
      `;
      loadQuotes();
    });
});

quoteListContainer.addEventListener('click', (event) => {
  if (!event.target.classList.contains('remove-quote')) {
    return;
  }

  removeQuote(event.target.dataset.id);
});

loadQuotes();
