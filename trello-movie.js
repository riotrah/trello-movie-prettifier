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
const movie = require('./lib/moviegrabber.js');
const RateLimiter = require('limiter').RateLimiter;
const movieLimiter = new RateLimiter(30, 'second');
const trelloLimiter = new RateLimiter(10, 'second');

const mode = process.argv[2];

// Grab the board to update from env
const boardId = process.env.T_BOARD;
t.get('/1/boards/'+boardId+'/cards', function(err, data) {

  console.log('Parsing', data.length, 'cards');
  console.log(data[0]);
  
  movie.setup()
  .then(()=>{

    switch(mode) {

      case null:
      case undefined:
        grabCards(data);
        break;
      case "--reset":
        resetCards(data);
        break;
      case "--update":
        updateCards(data);
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
      console.log('Grabbing data for', card.name);
      grabMovieFromCard(card);
    }
  });
}

function updateCards(cards) {

  cards.forEach((card) => {

    if(isPretty(card)) {
      console.log('Updating', card.name);
      grabMovieFromCard(card);
    }
  })
}

/**
 * Checks if a card is already prettified
 * Currently simply checks if the year was added to the card
 * @param  {Object}  card Trello API Card object
 * @return {Boolean}      Is it pretty?
 */
function isPretty(card) {

  const dateRegEx = /\(\b(19|20)\d{2}\b\)/g;
  if(card.name.substr(card.name.length - 6).match(dateRegEx)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Grabs card and passes it to movieGrabber.js
 * Then takes that data and updates card with it
 * @param  {Object} card Trello API card object
 */
function grabMovieFromCard(card) {

  movieLimiter.removeTokens(1, (err, remaining) => {
    if(err) {
      console.log('Too many grab requests');
    } else {
      movie.grab(card.name)
      .then((movie) => {
        addMovieDetails(card, movie);
      }).catch((err) => {
        console.log(err+"");
      });
    }
  });
}

/**
 * Applies data from movie grab to a given card
 * @param  {Object} card  Trello API card object
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function addMovieDetails(card, movie) {

  const cardUrl = '/1/cards/'+card.id;
  const cardDetails = {
    name: movie.name,
    desc: movie.desc,
  };

  t.put(cardUrl, cardDetails, (err, res) => {
    if(err) {
      console.log(err+"");
    } else {
      // console.log(res);
      addPoster(card, movie);
    }
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

  t.post(cardAttachUrl, attachment, (err, res) => {
    if(err) {
      console.log(err+"");
    } else {
      // console.log(res.id);
      addGenres(card, movie);
    }
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

  movie.labels.forEach((l)=>{
    const label = {
      name: l,
    };
    t.post(cardLabelsUrl, label, (err, res) => {
      if(err) {
        console.log(err+"");
      } else {
        // console.log(res);
      }
    });
  });
  handleCardSuccess(movie);
}

/**
 * Handles success of updating an individual card
 * @param  {Object} movie movieGrabber.js Movie Object
 */
function handleCardSuccess(movie) {

  console.log('Successfully grabbed!', movie.name);
}

function resetCards(cards) {

  cards.forEach((card) => {
    
    // if(isPretty(card)) {

      console.log('Stripping', card.name);
      stripCard(card);
    // }
  });
}

//////////////////////
// Resetting cards  //
//////////////////////

function stripCard(card) {

  trelloLimiter.removeTokens(1, function(err, remaining) {
    if(err) {
      console.log('Too many strip requests');
    } else {
      const strippedName = isPretty(card) 
        ? card.name.substr(0, card.name.length - 6)
        : card.name;

  replaceNameAndDescription(card, strippedName)
  .then((res) => {
    stripAttachment(card);
  },
  (err) => {
    console.log(err+"");
  })
  .then((res) => {
    stripLabels(card);
  },
  (err) => {
    console.log(err+"");
  });

  // delete attachments
  // t.delete
}

function replaceNameAndDescription(card, strippedName) {

  return new Promise((resolve, reject) => {
    t.put('1/cards/'+card.id, {
      name: strippedName,
      desc: "",
      // idLabels: []
    }, (err, res) => {
      if(err) {
        reject(err);  
        // console.log(err+"");      
      } else {
        resolve(res);
      }
    });
  });
}

function stripLabels(card) {

  // return new Promise((resolve, reject) => {
    card.labels.forEach((label) => {

      console.log('Stripping LABEL:', label.name, "from", card.name);
      t.del('1/cards/'+card.id+'/idLabels/'+label.id, (err, res) => {
      if(err) {
        console.log(err+"");
      }
      // } else {
        // console.log("Deleted label", label.name, "from", card.name);
      // }
      });
    });
  // });
}

function stripAttachment(card) {

  return new Promise((resolve, reject) => {
    if(card.idAttachmentCover) {
      t.del('1/cards/'+card.id+'/attachments/'+card.idAttachmentCover, (err, res) => {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }
  });
}