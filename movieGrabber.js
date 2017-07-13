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
const mdb = require('moviedb')(process.env.TMBD_KEY);
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

  return new Promise((resolve, reject) => {
    mdb.configuration((err, res) => {

      if(err) {
        reject(err);
      } else {
        IMAGE_BASE = res.images.base_url;
        IMAGE_SIZE = res.images.poster_sizes[3];
      }

    }).genreMovieList(null, (err, res) => {

      if(err) {
        reject(err);
      } else {
        GENRE_LIST = createGenreObject(res.genres);
        resolve();
      }
    });
  });
};

/**
 * Main function to call.
 * It grabs movie info given a String detailing the title
 * @param  {String}   movieTitle A movie title
 * @param  {Function} callback   A callback
 * @return {Promise}              A promise carrying the movieObj
 */
exports.grab = (movieTitle, callback) => {

  let movieObj = {};

  return new Promise((resolve, reject) => {
    mdb.searchMovie({query: movieTitle}, (err, movies) => {
      if(err) {
        reject(err);
      } else if(movies.results[0]) {
        movieObj = createMovieObject(movies.results[0]);
        resolve(movieObj);
      }
    });
  });
};

/**
 * Creates an object holding the all the information needed to send to Trello
 * @param  {Object} movie TMDB API movie result
 * @return {Object}     A movie object that maps to Trello card fields
 */
function createMovieObject(movie) {
  const title = movie.title;
  const year = movie.release_date.slice(0, 4);

  return {
    name: title + ' (' + year + ')',
    desc: createCardDesc(movie),
    attachment: IMAGE_BASE + IMAGE_SIZE + movie.poster_path,
    labels: convertGenres(movie),
  };
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
 * Creates a string that contains movie details for the trello description
 * Currently includes movie overview and community rating
 * @param  {Object} res TMDB API Movie Object
 * @return {String}     A combined string holding the good stuff
 */
function createCardDesc(res) {

  let desc = `${res.overview} 

Rating:  ${res.vote_average}`;
  return desc;
}

/**
 * Grabs genre strings for genre ids
 * @param  {Object} res TMDB API Movie Object
 * @return {Array}     An array of Strings, each a genre
 */
 function convertGenres(res) {

  const labels = [];
  res.genre_ids.forEach((id) => {
    labels.push(GENRE_LIST[id]);
  });
  return labels;
}
