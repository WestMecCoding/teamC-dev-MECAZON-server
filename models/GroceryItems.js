const mongoose = require('mongoose')


const GrocerySchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, "Item name is required"],
        trim: true
    },
    food_group: {
        type: String,
        required: [true, "Food Group is required"],
        enum: ["fruits", 'vegetables', ' proteins', 'dairy', 'grains', 'nuts']
    },
    price_in_usd: {
        type: Number,
        required: [true, 'Price is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0
    },
    calories_per_100g: {
        type: Number,
        required: [true, 'Calories are required'],
        min: 0
    }
})

module.exports = mongoose.model('GroceryItems', GrocerySchema)


