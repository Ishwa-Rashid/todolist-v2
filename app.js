const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')

const app = express()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.set("view engine", "ejs")

const items = ['Item 1', 'Item 2', 'Item 3'];
// const workItems = ['Work 1', 'Work 2', 'Work 3'];
const lists = []
const today = new Date()

const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
}

const currentDate = today.toLocaleDateString("en-US", options)

const capitalizeFirstLetter = (string) => {
    return _.upperFirst(string);
};

app.get('/', function(req, res){
    // res.sendFile(__dirname + "/index.html")
    // res.render('index', {currentDate: currentDate, listTitle:"defaultList" ,items: items})
    res.render('index', {currentDate: currentDate, capitalizeFirstLetter: capitalizeFirstLetter,listTitle:"defaultList" ,items: items})

})

// app.get('/work', function(req, res){

//     const listTitle = "Work"
//     res.render('index', {currentDate: currentDate, listTitle: listTitle, items: workItems})
// })

app.post('/', function(req, res){
    
    const newItem = req.body.newItem
    const listName = req.body.listName

    console.log(newItem)
    console.log(listName)

    if(newItem != ''){
        if(listName == 'defaultList'){
            items.push(newItem)  
            res.redirect('/')
        } else {

            lists.forEach(function(list){
                if(_.lowerCase(list.name) === _.lowerCase(listName)){
                    list.newListItems.push(newItem)
                    res.redirect('/lists/' + _.lowerCase(list.name))
                }
            })
            // workItems.push(newItem)  
            // res.redirect('/work')
        }
    }


})

app.post('/newList', function(req, res){
    const newListName = req.body.newListName
    console.log(newListName)
    const newList = {
        name: newListName,
        newListItems: []
    }
    lists.push(newList)
    res.redirect('/lists/' + _.lowerCase(newListName))

})

app.get('/lists/:newListName', function(req,res){

    const requestedList = _.lowerCase(req.params.newListName)
  
    lists.forEach(function(list){
      const storedList = _.lowerCase(list.name)
      if(requestedList === storedList ){
  
        // res.render('index',{currentDate: currentDate, listTitle: list.name, items: list.newListItems});
        res.render('index',{currentDate: currentDate, capitalizeFirstLetter: capitalizeFirstLetter, listTitle: list.name, items: list.newListItems});


      }
    })
})
  


app.listen(3000, function(){
    console.log("Server is listening on port 3000")
})






// Issues
// cant handle lists that are of more then one word
// cant handle  kebab casing