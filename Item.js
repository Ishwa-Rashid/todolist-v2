const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    itemName: String
})

module.exports.itemModel = mongoose.model('Item', itemSchema)


const listSchema = new mongoose.Schema({
    listName: String,
    listItems: [itemSchema]
})

module.exports.listModel = mongoose.model('List', listSchema)