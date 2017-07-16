// ----------------------------------------------------------------------------
// 
// moviecli.js
// A mediocrely named file that provides a command line utility for grabbing 
// movie data given a movie's title as the first cli argument
// 
// invoked like so:
// 
// > node moviecli "The Avengers"
// or 
// > node moviecli Inception
// 
// Will return movie data!
// 
// - riotrah
// 
// ----------------------------------------------------------------------------

// Connect to MovieDB api via MovieDB library
const movie = require('./lib/movieGrabber.js');

movie.setup()
.then(() => {
  movie.grab(process.argv[2])
  .then((movie) => {
    console.log(movie.name);
    console.log(movie.desc);
    console.log(movie.attachment);
    console.log(movie.labels);
  })
  .catch((err) => {
	console.log(err+"");
  });
})
.catch((err) => {
  console.log(err+"");
});
