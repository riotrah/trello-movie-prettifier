# trello-movie-prettifier
This lil node app converts simple plaintext Trello cards with movie titles as their card titles into aesthetic cards containing links and details of each including a poster thumbnail!

## *Now with Netflix link addition!*

# Overview
The app will crawl a given board for cards of a broadly defined format. It grabs data based on the title of the card, from The Movie DataBase.
It then updates that card with its proper title, a poster, genre labels, its synopsis, its TMDB rating and a link to its Netflix page if it's on it!

## Note:
Its not very intelligent, so it grabs the *first* movie it gets results from.

If any word in the movie name is mispelled, it will fail for that card!

# Who is it for?
No one - it is nigh useless
*It was fun to build tho!*

# In action
![](https://thumbs.gfycat.com/DeficientNecessaryElectriceel-size_restricted.gif)

# Usage

## Setup

* Grab a TMDB Application Key.
* Grab a Trello API Key.
* Grab the associated API Token.
* Grab the id of your desired trello board by appending '.json' to its url and looking for the value of the key 'id' in the first object that appears.
* Clone this repo.
* Create an `.env` file in the directory root  and place the following text in it, replacing the parts that need to be replaced.

```
TMBD_KEY='<your TMDB key here'
T_KEY='<your Trello key here'
T_TOKEN='<your Trello token here'
T_BOARD='<your Trello board id here>'
```

## Running

* Fill your board with cards with the titles of movies. The closer the name to the actual title of the movie, the better. 

	- "Space Odyssey" will correct to "2001: A Space Odyssey" and will work
	- "Space Oddysy" will be skipped
	- "The Blair Witch Project" will work, and will populate the card with information for the 1999 movie
	- "Blair Witch" will work, but will populate the card with information for the recent remake/sequel - so beware what you type!

* Run `node trello-movie` in your terminal

# Contribution:

1. Make a fork
2. Contribute
3. ???
4. Profit!
5. (Please submit PR)

## Some ideas

- [ ] TESTS!
- [ ] Grab netflix data in a better way than scraping InstantWatcher!
- [ ] Implement spell checking
- [ ] Grab hulu or other data source

# Credits

[The Movie DataBase API](https://www.themoviedb.org/documentation/api) - A beautiful community and API.

This product uses the TMDb API but is not endorsed or certified by TMDb.

<img height="150" width="150" src="https://www.themoviedb.org/assets/static_cache/02a9430b88975cae16fcfcc9cf7b5799/images/v4/logos/primary-green.svg">

<!-- ![movie_img](https://www.themoviedb.org/assets/static_cache/02a9430b88975cae16fcfcc9cf7b5799/images/v4/logos/primary-green.svg) -->
[node-trello](https://github.com/adunkman/node-trello) - nice lil Trello wrapper

[MovieDB](https://github.com/impronunciable/moviedb) - nice lil TMDB wrapper

[This movie board](https://trello.com/b/3Zo3Q3dF/movies) - this hand-done board inspired this lil project!