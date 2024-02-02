const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const ejs = require('ejs');
const _ = require('lodash')
const {Item, List, User} = require('./models')
const passport = require('passport');
const {Strategy} = require('passport-local');
const session = require('express-session');
const bcrypt = require('bcrypt')
const saltRounds = 10

const app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// getting our app to use express session
app.use(session({
    secret: 'This is our little secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // set to true if your app is served over HTTPS
        httpOnly: true,
        expires: false, // session cookie, expires when the browser is closed
    },
}))

// app.use(session({
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }
// }))

app.use(passport.initialize());
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

// compare password
function comparePassword(password, hashed){

    return bcrypt.compareSync(password, hashed);
}

// passport config
passport.use(new Strategy(
    async function(username, password, done) {
        try{
            const user = await User.findOne({ email: username })
            
            if(!user) return done(null, false);
            if(!comparePassword(password, user.password)) return done(null, false);
            return done(null, user);

        } catch(error){
            return done(error, false);
        }

        
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
	try {
		const findUser = await User.findById(id);
		if (!findUser) throw new Error("User Not Found");
		done(null, findUser);
	} catch (err) {
		done(err, null);
	}
});

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



app.get('/home', async function(req, res){

    if(req.isAuthenticated()){
        const user = await User.findById(req.user._id)
            if(user.items.length === 0){
                
                user.items.push(...defaultItems)
                await user.save();
                res.redirect('/home')
            } else {
    
                res.render('home', {currentDate: currentDate, listTitle:"defaultList", items: user.items})
            }
        
    } else {
        res.redirect("/login");
    }
    
})

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
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})


// can we use res.render() in post? if yes then why do we use redirect in post and get instead of render
app.post('/home', async function(req, res){

    if(req.isAuthenticated()){

        const newItem = req.body.newItem
        const listName = req.body.listName
        // console.log("listname: " + listName);
    
        const item = new Item({
            itemName: newItem
        })
    
        const foundUser = await User.findById(req.user._id);    
        if(newItem != ''){
            if(listName == 'defaultList'){
                foundUser.items.push(item)
                foundUser.save().then(function(){
                    res.redirect('/home')
                })
            } else {
    
                const list = foundUser.lists.find(function(list){
                    return list.listName === listName
                })
                list.listItems.push(item);
                foundUser.save().then( function(){
                    res.redirect('/lists/' + listName)
                })
            }
        }

    } else {

        res.redirect("/login")
    }

})

app.post('/delete', async function(req, res){

    if(req.isAuthenticated()){
        const itemID = req.body.checkbox
        const listName = req.body.listName
        const userId = req.user._id;
    
    
        if(listName === 'defaultList'){   
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $pull: { items: { _id: itemID } } },
                { new: true }
            );
            
            res.redirect('/home')
            
        } else {
    
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, 'lists.listName': listName },
                { $pull: { 'lists.$.listItems': { _id: itemID } } },
                { new: true }
            );
    
            
             res.redirect('/lists/' + listName)
            
        } 
    } else {
        res.redirect("/login");
    }
 
})

app.post('/newList', async function(req, res){

    if(req.isAuthenticated()){
        // can use custom list 
        const newListName = _.lowerCase(req.body.newListName)


        const foundUser = await User.findById(req.user._id); 


        if(foundUser.lists.length !== 0){ 

            const foundList = foundUser.lists.find(function(list){
                return list.listName === newListName
            })

            if( foundList === undefined ){
                const list = new List({
                    listName: newListName,
                    listItems: defaultItems
                })
        
                foundUser.lists.push(list);
                foundUser.save().then(function(){
        
                    console.log("List Created Sucessfully!")
                })
            }
        } else {

            const list = new List({
                listName: newListName,
                listItems: defaultItems
            })
        
            foundUser.lists.push(list);
        
        
            foundUser.save().then(function(){
        
                console.log("List Created Sucessfully!")
            })

        }

        res.redirect('/lists/' + newListName)
    } else {
        res.redirect("login")
    }

    
})

app.get('/lists/:newListName', async function(req,res){

    if(req.isAuthenticated()){
        const requestedList = _.lowerCase(req.params.newListName)

        const foundUser = await User.findById(req.user._id);

        const foundList = foundUser.lists.find(function(list){
            return list.listName === requestedList
        })
         res.render('Home',{capitalizeFirstLetter: capitalizeFirstLetter, listTitle: foundList.listName, items: foundList.listItems});  

    } else {

        res.redirect("login")
    }

})


app.post("/register", async function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    const userFound = await User.findOne({email: username})
    if(userFound){
        return res.redirect('login')
    }

    const hash = bcrypt.hashSync(password, saltRounds);

    const user = {
        email: username,
        password: hash
    }
    const newUser = await User.create(user);

    passport.authenticate('local')(req, res, function(){
        res.redirect("/home");
    });

});

app.post("/login", passport.authenticate("local", {failureRedirect: "/register", successRedirect: "/home"}));

app.listen(3000, function(){
    console.log("Server is listening on port 3000")
})



// Issues
// cant handle lists that are of more then one word
// cant handle  kebab casing
// if we create list consisting of two word it will only get first word of the list name
// in the post route "/home", where we are adding new list items