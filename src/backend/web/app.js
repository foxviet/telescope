const path = require('path');
const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const healthcheck = require('express-healthcheck');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');

const { typeDefs, resolvers } = require('./graphql');
const logger = require('../utils/logger');
const authentication = require('./authentication');
const router = require('./routes');

const secret = authentication.init(passport);
const app = express();

// Add the Apollo server to app and define the `/graphql` endpoint
const server = new ApolloServer({
  typeDefs,
  resolvers,
});
server.applyMiddleware({ app, path: '/graphql' });

// Template rendering for legacy "planet" view of posts
app.engine('handlebars', expressHandlebars());
app.set('views', path.join(__dirname, 'planet/views'));
app.set('view engine', 'handlebars');

// Add our logger to the app
app.set('logger', logger);
app.use(logger);

// Setup Passport SAML based Authentication
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// TODO: why is resave false?
app.use(session({ secret, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Allow CORS on our routes
app.use(cors());
// Provide a standard `/health` endpoint to check on state of the app
app.use('/health', healthcheck());
// Include our router with all endpoints
app.use('/', router);

module.exports = app;
