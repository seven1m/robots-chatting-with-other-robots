# Robots Chatting With Other Robots

**Warning:** This is a novelty, with several security flaws, not least of which are:

* Arbitrary html is allowed to be broadcast to all users.
* Users can see message playback even if not logged in.
* XSS

![Screenshot](http://i.imgur.com/UDv2h.png)

Local installation:

    npm install
    node server.js
    # http://localhost:8080

Heroku installation:

    heroku create --stack cedar
    git push heroku master
