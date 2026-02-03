# pmd-max-temp
A Node.js program that parses a web page of Pakistan Meteorological Department and extracts maximum temperature of my city and stores in a database.

## Installation

1. Clone this repository
2. npm install
3. Create an .env file and store your database URI in variable DB_URI
4. Cron task: 0 18,19,20,21,22 * * * /home/adil/.nvm/versions/node/v22.17.1/bin/node --env-file=/var/www/html/pmd-max-temp/.env /var/www/html/pmd-max-temp/main.js

## Usage

1. node --env-file=.env main.js

Tested on Ubuntu v25 and Node.js v22
