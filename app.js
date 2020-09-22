const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["First", "Second", "Third"];
// const workItems = [];

mongoose.connect(`mongodb+srv://admin-ankit:${process.env.DBKEY}@cluster0.dqsvv.mongodb.net/todolistDB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "No name specified!"]
    }
});

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "No name specified!"]
    },
    items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: "Welcome to Todolist-v2"
});

const item2 = new Item({
    name: "Hit the + button to add the new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
    let day = date.getDate();

    Item.find((err, foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added to db!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: day, newListItems: foundItems });
        }
    });
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect(`/${customListName}`);
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });


});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName == date.getDate()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect(`/${listName}`);
        });
    }
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === date.getDate()) {
        Item.findByIdAndRemove(checkedItemId, err => {
            if (err)
                console.log(err);
            else {
                console.log("Successfully deleted record");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
            if (!err)
                res.redirect(`/${listName}`);
        });
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, () => {
    console.log('Server started on port 5000');
})