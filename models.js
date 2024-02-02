const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

const itemSchema = new mongoose.Schema({
    itemName: String
})

module.exports.Item = mongoose.model('Item', itemSchema)


const listSchema = new mongoose.Schema({
    listName: String,
    listItems: [itemSchema]
})

module.exports.List = mongoose.model('List', listSchema)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    items: [itemSchema],
    lists: [listSchema]
})

userSchema.plugin(findOrCreate);

module.exports.User = mongoose.model('User', userSchema);
