require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
//1. mongoose connection
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true });
//2. Schema  for user data collection
const userSchema = new mongoose.Schema({email:String,password:String});
// //3. secret string
// const secret = "Thisisourlittlesecret.";
//4. password encryption
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
//5. creating a model
const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const newUser = new User({email:req.body.username,password:req.body.password});
  newUser.save(function(err){
    if(!err){
      res.render("secrets");
    }else {
      console.log(err);
    }
  });
});
app.post("/login",function(req,res){
  const email = req.body.username;
  const password = req.body.password ;
  User.findOne({email:email},function(err,foundUser){
    if(!err){
      if(foundUser.password===password){
        res.render("secrets");
      }else{
        // res.render("login");
      }
    }else{
      console.log(err);
    }
  });
});




























app.listen(3006,function(req,res){
  console.log("Yuhu");
});
