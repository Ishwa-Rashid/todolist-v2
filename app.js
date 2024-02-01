const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const _ = require('lodash')
const itemAndList = require('./Item')
const Item = itemAndList.itemModel
const List = itemAndList.listModel
const User = require('./User')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')


const app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: 'This is our little secret',
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())

app.set("view engine", "ejs")

// to get current date
const today = new Date()

const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
}

const currentDate = today.toLocaleDateString("en-US", options)


// To capitalize list tile inside index template
const capitalizeFirstLetter = (string) => {
    return _.upperFirst(string);
};


// Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB')

// default items
const item1 = new Item({
    itemName: 'Welcome to your todolist!'
})

const item2 = new Item({
    itemName: 'Hit the + button to add a new item.'
})

const item3 = new Item({
    itemName: "<-- Hit this to delete an item."
})
const defaultItems = [item1, item2, item3]


async function saveDefaultItems(){

    await Item.insertMany(defaultItems)
    console.log("Inserted Successfully!")
}

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/', function(req, res){

    res.render('index')
})

app.get('/register', function(req, res){

    res.render('register')

})

app.get('/login', function(req, res){

    res.render('login')

})

app.get("/logout", function(req, res){

    req.logout();
    res.redirect("/");
})

app.get('/home', function(req, res){

    // console.log("else")
    if(req.isAuthenticated()){
        
        Item.find().then(function(foundItems){
            if(foundItems.length === 0){
                saveDefaultItems();
                res.redirect('/home')
            } else {
    
                res.render('home', {currentDate: currentDate, listTitle:"defaultList", items: foundItems})
            }
    
        })

    } else {

        res.redirect('/login')
    }

})

app.post('/register', function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err)
            res.render('register')
        } else {
            passport.authenticate('local')(req, res, function(){
    
                res.redirect('/home')
            })
        }
    })

})

app.post('/login', function(req, res){

    const username = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: username,
        password: password
    })

    req.login(user, function(err){
        if(err){
            console.log(err)
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/home')
            })
        }
    })


})

// can we use res.render() in post? if yes then why do we use redirect in post and get instead of render
app.post('/', function(req, res){
    
    const newItem = req.body.newItem
    const listName = req.body.listName

    const item = new Item({
        itemName: newItem
    })

    if(newItem != ''){
        if(listName == 'defaultList'){
            item.save().then(function(){
                res.redirect('/')
            })
        } else {

            List.findOne({listName: listName}).then(function(foundList){
                foundList.listItems.push(item)
                foundList.save().then( function(){
                res.redirect('/lists/' + listName)

                })
            })

        }
    }
})

app.post('/delete', function(req, res){
    const itemID = req.body.checkbox
    console.log(itemID)
    const listName = req.body.listName
    if(listName === 'defaultList'){
        Item.findByIdAndDelete(itemID).then(function(){
            res.redirect('/home')

        })

    } else {

        List.findOne({listName: listName}).then(function(foundList){
            foundList.listItems.pull(itemID)
            foundList.save().then(function(){
                console.log("saved")
                res.redirect('/lists/' + listName)
            })
        })
    }
   
})

app.post('/newList', function(req, res){
    // can use custom list 
    const newListName = _.lowerCase(req.body.newListName)

    async function saveDefaultItems(){

        await Item.insertMany(defaultItems)
        console.log("Inserted Successfully!")
    }
    
    List.findOne({listName: newListName}).then(function(foundList){
        if( foundList === null){
            const list = new List({
                listName: newListName,
                listItems: defaultItems
            })

            list.save().then(function(){

            })
        }

        res.redirect('/lists/' + newListName)
    })

})

app.get('/lists/:newListName', function(req,res){

    if(req.isAuthenticated()){

        const requestedList = _.lowerCase(req.params.newListName)

        List.findOne({listName: requestedList}).then(function(foundList){
    
            res.render('home',{capitalizeFirstLetter: capitalizeFirstLetter, listTitle: foundList.listName, items: foundList.listItems});
        })

    } else {

        res.redirect('/login')
    }

})
  


app.listen(3000, function(){
    console.log("Server is listening on port 3000")
})






// Issues
// cant handle lists that are of more then one word
// cant handle  kebab casing