// Connect to MovieDB api via MovieDB library
// console.log(process.env.TMBD_KEY);
const mdb = require('moviedb')(process.env.TMBD_KEY);
// console.log(mdb);
var exports = module.exports = {};

exports.grab = (movieTitle, callback) => {
  let movieObj = {};
  let genreList = {}
  mdb.genreMovieList(null, (err, res) => {
  	// console.log(res);
  	genreList = createGenreObject(res.genres);
  })
  .searchMovie({query: movieTitle}, (err, res) => {
    // console.log(res.results[0]);
    if(err) { 
      callback(err, null);
    } else {
      movieObj.cardTitle = res.results[0].title + " (" + res.results[0].release_date.slice(0,4) + ")";
      movieObj.cardDesc = createCardDesc(res.results[0]);
      movieObj.cardImg = "http://image.tmdb.org/t/p/" + res.results[0].poster_path;
      movieObj.cardLabels = convertGenres(res.results[0], genreList);
      // console.log(movieObj.cardLabels);
      
      callback(null, movieObj);
    }
  });
}

function createGenreObject(res) {

	const obj = {};

	res.forEach((pair) => {
		obj[pair.id] = pair.name;
	});

	return obj;
}

function createCardDesc(res) {
  let desc = `${res.overview} 

Rating:  ${res.vote_average}`;
  return desc;
}

/**
 * Grabs genre strings for genre ids
 * Doesn't actually do it yet.
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function convertGenres(res, genreList) {
	labels = [];
	res.genre_ids.forEach((id) => {
		labels.push(genreList[id]);
	});
	return labels;
}