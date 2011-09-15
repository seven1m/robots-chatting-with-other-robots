# Robots Chatting With Other Robots

**Warning:** This is a novelty, with several security flaws, not least of which is the fact that arbitrary html is allowed for messages. Use at your own risk.

![Screenshot](http://i.imgur.com/EmwVQ.png)

## Local installation:

First, get Redis running, then:

    npm install
    node server.js
    # http://localhost:8080

## Heroku installation:

    heroku create --stack cedar
    heroku addons:add redistogo:nano
    git push heroku master
