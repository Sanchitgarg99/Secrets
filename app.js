require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
//1. mongoose connection
mongoose.connect("mongodb+srv://sanchitgarg:Sunchit573@cluster0.njmem.mongodb.net/userDB",{useNewUrlParser:true, useUnifiedTopology: true });

mongoose.set("useCreateIndex",true);
//2. Schema  for user data collection
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//3. creating a model
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://gentle-peak-11148.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id,username:profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});
app.get("/auth/google",
  passport.authenticate("google",{scope:["email","profile"]}));
app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
   function(req, res) {
  res.redirect("/secrets");
});

app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        res.render("secrets",{userWithSecrets:foundUser});
      }
    }
  });
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});
app.post("/submit",function(req,res){
  const submittedsecret = req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedsecret;
        foundUser.save(function(){
        res.redirect("/secrets");
      });
        }
      }
    });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});
app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});





app.listen(process.env.PORT || 3006,function(req,res){
  console.log("Yuhu");
});
