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
const RateLimiter = require('limiter').RateLimiter;
const limiter = new RateLimiter(5, 'second');

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
      grabMovieFromCard(card);
    }
  });
}

function updateCards(cards) {

  cards.forEach((card) => {

    if(isPretty(card)) {
      // console.log('Updating', card.name);
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

  m.grab(card.name)
  .then((movie) => {
    return addMovieDetails(card, movie);
  }, 
  (err) => {
    console.log(err+"");
  })
  .then((movie) => {
    return addPoster(card, movie);
  },
  (err) => {
    console.log(err+"");
  })
  .then((movie) => {
    if(movie.labels) { addGenres(card, movie); }
  },
  (err) => {
    console.log(err+"");
  });
}

// function grabMovieFromCard(card) {

//   m.grab(card.name)
//   .then((movie) => {
//     return addMovieDetails(card, movie);
//   })
//   .then((movie) => {
//     return addPoster(card, movie);
//   })
//   .then((movie) => {
//     if(movie.labels) { addGenres(card, movie); }
//   });
// }

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

  return new Promise((resolve, reject) => {
    limiter.removeTokens(1, (err, remaining) => {
      if(err) {
        reject("    Trello:"+err+"");
      } else {
        t.put(cardUrl, cardDetails, (err, res) => {
          if(err) {
            reject(err+"");
          } else {
            resolve(movie);
          } 
        });
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
    limiter.removeTokens(1, (err, remaining) => {
      if(err) {
        reject("    Trello:"+err+"");
      } else {
        t.post(cardAttachUrl, attachment, (err, res) => {
          if(err) {
            reject(err+"");
          } else {
            resolve(movie);
          }  
        });
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

  limiter.removeTokens(movie.labels.length, (err, remaining) => {
    if(err) {
      console.log("    Trello:"+err+"");
    } else {
      movie.labels.forEach((l)=>{
        const label = {
          name: l,
        };
        t.post(cardLabelsUrl, label, (err, res) => {
          if(err) {
            console.log(err+"");
          } 
        });
      });
    }
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

//////////////////////
// Resetting cards  //
//////////////////////

function resetCards(cards) {

  cards.forEach((card) => {

    console.log('Stripping', card.name);
    stripCard(card);
  });
}

function stripCard(card) {

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

}

function replaceNameAndDescription(card, strippedName) {

  return new Promise((resolve, reject) => {
    
    limiter.removeTokens(1, (err, remaining) => {

      if(err) { reject("    Trello:"+err+""); }
      else {
        t.put('1/cards/'+card.id, {
          name: strippedName,
          desc: "",
          // idLabels: []
        }, (err, res) => {
          if(err) {
            reject(err);  
          } else {
            resolve(res);
          }
        });
      }
    });
  });
}

function stripAttachment(card) {

  return new Promise((resolve, reject) => {

    if(card.idAttachmentCover) {

      limiter.removeTokens(1, (err, remaining) => {

        if(err) { reject("    Trello:"+err+""); }
        else {
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
  });
}

function stripLabels(card) {

  card.labels.forEach((label) => {

    console.log('Stripping LABEL:', label.name, "from", card.name);
    limiter.removeTokens(1, (err, remaining) => {
      
      t.del('1/cards/'+card.id+'/idLabels/'+label.id, (err, res) => {

        if(err) {
          console.log(err+"");
        }
      });
    });
  });
}
