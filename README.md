# trello-movie-prettifier
This lil node app converts simple plaintext Trello cards with movie titles as their card titles into aesthetic cards containing links and details of each including a poster thumbnail!

# Overview
The app will crawl a given board for cards of a broadly defined format. It grabs data based on the title of the card, from The Movie DataBase.
It then updates that card with its proper title, a poster, genre labels, its synopsis and its TMDB rating!

## Note:
Its not very intelligent, so it grabs the *first* movie it gets results from.

If any word in the movie name is mispelled, it will fail for that card!

# In action

# How to run

1. Grab a TMDB Application Key.
2. Grab a Trello API Key.
3. Grab the associated API Token.
4. Grab the id of your desired trello board by appending '.json' to its url and looking for the value of the key 'id' in the first object that appears.
5. Clone this repo.
6. Create an `.env` file in the directory root  and place the following text in it, replacing the parts that need to be replaced.

	TMBD_KEY='<your TMDB key here'
	T_KEY='<your Trello key here'
	T_TOKEN='<your Trello token here'
	T_BOARD='<your Trello board id here>'

7. Fill your board with cards with the titles of movies. The closer the name to the actual title of the movie, the better. 

"Space Odyssey" will correct to "2001: A Space Odyssey" and will work
"Space Oddysy" will be skipped
"The Blair Witch Project" will work, and will populate the card with information for the 1999 movie
"Blair Witch" will work, but will populate the card with information for the recent remake/sequel - so beware what you type!


# Current issues:

[ ] - It may make too many requests at once due to its async nature 
[ ] - It fails on slight misspellings of words

# Credits

[The Movie DataBase API](https://www.themoviedb.org/documentation/api) "This product uses the TMDb API but is not endorsed or certified by TMDb." 