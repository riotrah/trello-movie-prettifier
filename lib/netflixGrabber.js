// ----------------------------------------------------------------------------
// 
// netflixGrabber.js
// Shitty webscraper to see if a movie is on Netflix and grab its link
// 
// Maybe one day I'll reverse engineer their API but that seems unethical
// 
// - riotrah
// 
// ----------------------------------------------------------------------------

const request = require('request-promise-native');
const cheerio = require('cheerio');

exports = module.exports = {};

/**
 * Returns the Netflix link
 * @param  {String} title The title of the movie
 * @return {Promise}       A Promise 
 */
exports.link = (title) => {

  return netflixRequest(title);
}

/**
 * Makes a request to InstantWatcher's netflix search
 * @param  {String} title The title of the movie
 * @return {Promise}       A Promise (see request docs) that resolves with a 
 * Netflix title link
 */
const netflixRequest = (title) => {

  const url = `http://instantwatcher.com/search?source=1+2+3&q=
  ${title}&view=text&content_type%5B%5D=1`;
  const options = {
    url: url,
    transform: (body) => {
      return cheerio.load(body);
    }
  };

  return new Promise((resolve, reject) => { 
    
    console.log('Searching InstantWatcher for', title);
    request(options)
    .then((body) => {
      const link = grabNetflixLink(body);
      if(link) {
        resolve(link);
      } else {
        reject(title + " not on netflix");
      }
    })
    .catch((err) => {
      reject(err+"");
    });    
  });
}

/**
 * Returns the Netflix url associated with the 
 * first InstantWatcher search result
 *
 * Returns null if movie is not on netflix
 * @param  {Object} $ A Cheerio Html Object (see cheerio docs)
 * @return {String}   The Netflix title link
 */     
const grabNetflixLink = ($) => {

  const resultsList = "#filters-plus-results > div.item-results-page > div";
  let link;
  try {
    const firstResult = $(resultsList).children()[0];
    const netflixSuffix = firstResult.attribs['data-title-path'];
    link = 'https://www.netflix.com' + netflixSuffix;
  } catch(e) {
    link = null;
  }

  return link;

}