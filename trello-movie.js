// ----------------------------------------------------------------------------
// 
// trello-movie-prettifier
// The Trello movie data grabber you never knew you wanted
// 
// Made with a passion for movies, posters and scripts
// - Rayat Rahman
// - gh: riotrah
// 
// TODO: 
// - Promisify everything
// - Update cards 
// - Add streaming links and labels
// 
// License: http://opensource.org/licenses/MIT
// 
// ----------------------------------------------------------------------------

require('dotenv').config();
const Trello = require('node-trello');
const t = new Trello(process.env.T_KEY, process.env.T_TOKEN);
const m = require('./lib/moviegrabber.js');
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck(1, 100);

const mode = process.argv[2];

const boardId = process.env.T_BOARD;
t.get('/1/boards/'+boardId+'/cards', function(err, data) {

  console.log('Parsing', data.length, 'cards');
  console.log(data[0]);
  
  m.setup()
  .then((configs)=>{
    switch(mode) {

      case null:
      case undefined:
        grabCards(data);
        break;
      case "--reset":
        resetCards(data);
        break;
      // case "--update":
        // updateCards(data);
      default:
        console.log('Not a supported mode');
        break;
    }
  });
});

/**
 * Runs the loop to process the array of cards
 *
 * TODO: Don't check for prettified cards; update them
 * 
 * @param  {Array} cards The array of Card objects returned by Trello's request
 */
function grabCards(cards) {


  cards.forEach((card) => {

    if(!isPretty(card)) {

      grabMovieFromCard(card);
    }
  });
}

/**
 * Checks if a card is already prettified
 * Currently simply checks if the year was added to the card
 * @param  {Object}  card Trello API Card object
 * @return {Boolean}      Is it pretty?
 */
function isPretty(card) {

  if(card.desc.substr(card.desc.length - 7) === "Grabbed") {
    return true;
  } else {
    return false;
  }
}

function cardNameHasYear(cardName) {

  const dateRegEx = /\(\b(19|20)\d{2}\b\)/g;
  if(cardName.substr(cardName.length - 6).match(dateRegEx)) {
    return true; 
  } else {
    return false;
  }
}

function getYearFromCardName(cardName) {

  const year = cardName.substr(cardName.length - 6).replace(/[()]/g, '');

  return Number(year);
}

function getTitleFromCardName(cardName) {

  return cardName.substr(0, cardName.length - 7);
}

/**
 * Grabs card and passes it to movieGrabber.js
 * Then takes that data and updates card with it
 * @param  {Object} card Trello API card object
 */
/*function grabMovieFromCard(card) {

  m.grab(card.name)
  .then((movie) => {
    return limiter.schedule(addMovieDetails, card, movie);
  }, 
  (err) => {
    console.log(err+"");
    return card;
  })
  .then((movie) => {
    return limiter.schedule(addPoster, card, movie);
  },
  (err) => {
    console.log(err+"");
    return card;
  })
  .then((movie) => {
    if(movie.labels) { return limiter.schedule(addGenres, card, movie); }
    else { return [movie]; }
  },
  (err) => {
    console.log(err+"");
    return [card];
  })
  .then((movies) => {
    handleCardSuccess(movies[0]);
  });
}*/

function grabMovieFromCard(card) {

  let name = card.name;
  let year;

  if(cardNameHasYear(card.name)) {
    name = getTitleFromCardName(card.name);
    year = getYearFromCardName(card.name);
  }
  
  m.grab(name, year)
  .then((movie) => {
    return submitMovieToCard(movie,card);
  }
  ,(err) => {
    console.log(err+"");
  })
  .then((movies) => {
    handleCardSuccess(movies[0]);
  })
  .catch((err) => {
    console.log(err+"");
  });

}

/**
 * Applies data from movie grab to a given card
 * @param  {Object} card  Trello API card object
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function addMovieDetails(card, movie) {

  const cardDesc = movie.desc + `\n\n${new Date().toString()} : Grabbed`;

  const cardUrl = '/1/cards/'+card.id;
  const cardDetails = {
    name: movie.name,
    desc: cardDesc,
  };

  return new Promise((resolve, reject) => {
    t.put(cardUrl, cardDetails, (err, res) => {
      if(err) {
        reject(err+"");
      } else {
        resolve(movie);
      } 
    });
  });
}

/**
 * Adds movie poster image url as attachment to card
 *
 * TODO: update poster instead of readding
 * 
 * @param  {Object} card  Trello API card object
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function addPoster(card, movie) {

  const cardAttachUrl = '/1/cards/'+card.id+'/attachments';
  const attachment = {
    url: movie.attachment,
  };

  return new Promise((resolve, reject) => {
    t.post(cardAttachUrl, attachment, (err, res) => {
      if(err) {
        reject(err+"");
      } else {
        resolve(movie);
      }  
    });
  });
}

/**
 * Adds movie genres as labels to card
 *
 * TODO: update poster instead of readding
 * 
 * @param  {Object} card  Trello API card object
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function addGenres(card, movie) {

  const cardLabelsUrl = '/1/cards/'+card.id+'/labels';
  const promises = [];

  movie.labels.forEach((l)=>{
    const label = {
      name: l,
    };

    promises.push(new Promise((resolve, reject) => {

      t.post(cardLabelsUrl, label, (err, res) => {
        if(err) {
          reject(err);
        } else {
          resolve(movie);
        }
      });
    }));
  });

  return Promise.all(promises);
}

function submitMovieToCard(movie, card) {

  const promises = [];

  promises.push(limiter.schedule(addMovieDetails, card, movie));

  if(movie.attachment && !card.idAttachmentCover) {
    promises.push(limiter.schedule(addPoster, card, movie));
  }

  if(movie.labels.length && card.labels.length) { 
    promises.push(limiter.schedule(addGenres, card, movie));
  }

  return Promise.all(promises);
}

/**
 * Handles success of updating an individual card
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function handleCardSuccess(movie) {

  console.log('Successfully grabbed!', movie.name);
}

//////////////////////
// Resetting cards  //
//////////////////////

function resetCards(cards) {

  cards.forEach((card) => {

    stripCard(card);
  });
}

function stripCard(card) {

/*  const strippedName = isPretty(card) 
        ? card.name.substr(0, card.name.length - 6)
        : card.name;

  limiter.schedule(replaceNameAndDescription, card, strippedName)
  .then((card) => {
    if(card.idLabels.length) { return limiter.schedule(stripLabels, card); }
    else { return [card]; }
  },
  (err) => {
    console.log(err+"");
  })
  .then((card) => {
    if(card[0].idAttachmentCover) { return limiter.schedule(stripAttachment, card[0]); }
    else { return card[0]; }
  },
  (err) => {
    console.log(err+"");
  })
  .then((card) => {
    console.log('Stripped', card.name);
  },
  (err) => {
    console.log(err+"");
  });
  */
/*  const strippedName = isPretty(card) 
        ? getTitleFromCardName(card.name)
        : card.name;*/

  limiter.schedule(replaceNameAndDescription, card, card.name)
  .then((card) => {
    console.log();
  })
  .catch((err) => {
    console.log(err+"");
  });

  if (card.idLabels.length) {

    limiter.schedule(stripLabels, card)
    .then((card) => {
      console.log();
    })
    .catch((err) => {
      console.log(err+"");
    });
  }
    
  if (card.idAttachmentCover) {

    limiter.schedule(stripAttachment, card)
    .then((card) => {
      console.log();
    })
    .catch((err) => {
      console.log(err+"");
    });
  }
}

function replaceNameAndDescription(card, strippedName) {

  return new Promise((resolve, reject) => {

    console.log('Stripping', card.name);

    t.put('1/cards/'+card.id, {
      name: strippedName,
      desc: "",
      // idLabels: []
    }, (err, res) => {
      if(err) {
        reject(err);  
      } else {
        resolve(card);
      }
    });
  });
}

function stripAttachment(card) {

  return new Promise((resolve, reject) => {

    t.del('1/cards/'+card.id+'/attachments/'+card.idAttachmentCover, (err, res) => {
      if(err) {
        reject(err);
      } else {
        resolve(card);
      }
    });
  });
}

function stripLabels(card) {

  const promises = [];

  card.labels.forEach((label) => {

    console.log('Stripping LABEL:', label.name, "from", card.name);
    
    promises.push(new Promise((resolve, reject) => {  
      
      t.del('1/cards/'+card.id+'/idLabels/'+label.id, (err, res) => {
        if(err) {
          reject(err);
        } else {
          resolve(card);
        }
      });
    }));
  });

  return Promise.all(promises);
}
