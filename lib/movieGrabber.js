// ----------------------------------------------------------------------------
// 
// movieGrabber.js 
// 
// Uses moviedb to make API requests given a movie Title
// Creates a movieObj that maps to Trello card fields,
// Containing title, rating, poster, genres and synopses!
// 
// - riotrah
// 
// ----------------------------------------------------------------------------

// Connect to MovieDB api via MovieDB library
require('dotenv').config();
const nflx = require('./netflixGrabber.js');
const mdb = require('moviedb')(process.env.TMBD_KEY);
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck(1, 300);

exports = module.exports = {};
let IMAGE_BASE;
let IMAGE_SIZE;
let GENRE_LIST;

/**
 * Grabs genrelist and configuration info from TMDB
 * Should be chained before grab()
 * @return {Promise} A promise with no payload
 */
exports.setup = () => {

  return limiter.schedule(getConfigs);
};

function getConfigs() {

  console.log('Grabbing config');

  return new Promise((resolve, reject) => {

    mdb.configuration((err, res) => {
      if(err) { reject(err+""); } 
      else {

        IMAGE_BASE = res.images.base_url;
        IMAGE_SIZE = res.images.poster_sizes[3];

        mdb.genreMovieList(null, (err, res) => {
          if(err) {
            reject(err+"");
          } else {
            GENRE_LIST = createGenreObject(res.genres);
            resolve([IMAGE_BASE, IMAGE_SIZE, GENRE_LIST]);
          }
        });
      }
    });
  });
}

/**
 * Creates an object from the array of TMDB genre id-pair objects 
 * @param  {Arry} res TMDB API genre pair array
 * @return {Object}     Object with ids and keys and names as values
 */
function createGenreObject(res) {

  const obj = {};

  res.forEach((pair) => {
    obj[pair.id] = pair.name;
  });

  return obj;
}

/**
 * Main function to call.
 * It grabs movie info given a String detailing the title
 * @param  {String}   movieTitle A movie title
 * @return {Promise}              A promise carrying the movieObj
 */
exports.grab = (title, year) => {

  return limiter.schedule(getMovie, title, year);
};

function getMovie(movieTitle, movieYear) {

  return new Promise((resolve, reject) => {

    console.log('Grabbing data for', movieTitle, movieYear);

    mdb.searchMovie( {query: movieTitle, year: movieYear} , (err, movies) => {

      if(err) { reject(err) } 
      else if(movies.results[0]) {

        const movie = movies.results[0];

        nflx.link(movie.title, movieYear)
        .then((link) => {
          // console.log(link);
          const desc = createCardDesc(movie) + `\n\nNetflix: ${link}`;
          const movieObj = createMovieObject(true, desc, movie); 
          resolve(movieObj);
        })
        .catch((err) => {
          // console.log(err+"");
          const desc = createCardDesc(movie);
          const movieObj = createMovieObject(false, desc, movie); 
          resolve(movieObj);
        });
      } else {
        reject("No movie found");
      }
    });
  });
}

/**
 * Creates an object holding the all the information needed to send to Trello
 * @param {Boolean} netflix Whether or not the movie is on netflix
 * @param  {Object} movie TMDB API movie result
 * @return {Object}     A movie object that maps to Trello card fields
 */
function createMovieObject(netflix, desc, movie) {
  const title = movie.title;
  const year = movie.release_date.slice(0, 4);


  return {
    name: title + ' (' + year + ')',
    desc: desc,
    attachment: IMAGE_BASE + IMAGE_SIZE + movie.poster_path,
    labels: convertGenres(netflix, movie),
  };
}

/**
 * Creates a string that contains movie details for the trello description
 * Currently includes movie overview and community rating
 * @param  {Object} movie TMDB API Movie Object
 * @return {String}     A combined string holding the good stuff
 */
function createCardDesc(movie) {

  const desc = `${movie.overview}\n\nRating:  ${movie.vote_average}`;

  return desc;
}

/**
 * Grabs genre strings for genre ids
 * @param  {Object} res TMDB API Movie Object
 * @return {Array}     An array of Strings, each a genre
 */
 function convertGenres(netflix, res) {

  const labels = [];

  if(netflix) {
    labels.push("Netflix");
  }

  res.genre_ids.forEach((id) => {
    labels.push(GENRE_LIST[id]);
  });
  return labels;
}
