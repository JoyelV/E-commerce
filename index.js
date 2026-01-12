const mongoose = require('mongoose');
const nocache = require('nocache');
const express = require('express');
const session = require('express-session');
var path = require('path');
require('dotenv').config();
const passport = require('passport');
const { initializingPassport } = require("./config/passportConfig");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");

initializingPassport(passport);

mongoose.connect(process.env.MONGO_URI);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(nocache());

app.use(
  session({
    name: "session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user_id = req.session.user_id;
  next();
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/home');
  });

app.use("/", userRoute);
app.use("/admin", adminRoute);

const PORT = process.env.PORT || 4002;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
