// Connect to MovieDB api via MovieDB library
const movie = require('./movieGrabber.js');

movie.setup()
.then(() => {
  movie.grab(process.argv[2], function(err, movie) {
    if(movie) {
      console.log(movie.name);
      console.log(movie.desc);
      console.log(movie.attachment);
      console.log(movie.labels);
    }
  });
})
.catch((err) => {
  console.log(err);
});
