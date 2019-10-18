//Setup Required Variables

var Table = require('cli-table2');
var mysql = require('mysql');
var inquirer = require('inquirer');

//Connect to SQL database

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazondb"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    startPrompt();
});

//Inquirer introduction

function startPrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Welcome to Bamazon! Would you like to view our inventory?",
        default: true

    }]).then(function(user) {
        if (user.confirm === true) {
            inventory();
        } else {
            console.log("Thank you! Come back soon!");
        }
    });
}

//Inventory

function inventory() {

    var table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [10, 30, 30, 30, 30]
    });

    listInventory();

    function listInventory() {

        connection.query("SELECT * FROM products", function(err, res) {
            for (var i = 0; i < res.length; i++) {

                var itemId = res[i].ItemID,
                    productName = res[i].ProductName,
                    departmentName = res[i].DepartmentName,
                    price = res[i].Price,
                    stockQuantity = res[i].StockQuantity;

              table.push(
                  [itemId, productName, departmentName, price, stockQuantity]
            );
          }
            console.log("");
            console.log("====================================================== Current Bamazon Inventory ======================================================");
            console.log("");
            console.log(table.toString());
            console.log("");
            continuePrompt();
        });
    }
}

//Inquirer user purchase

function continuePrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "continue",
        message: "Would you like to purchase an item?",
        default: true

    }]).then(function(user) {
        if (user.continue === true) {
            selectionPrompt();
        } else {
            console.log("Thank you!");
        }
    });
}

//Item selection and Quantity desired

function selectionPrompt() {

    inquirer.prompt([{

            type: "input",
            name: "inputId",
            message: "Please enter the ID number of the item you would like to purchase.",
        },
        {
            type: "input",
            name: "inputNumber",
            message: "How many units of this item would you like to purchase?",

        }
    ]).then(function(userPurchase) {

        //connect to database to find stock_quantity in database. If user quantity input is greater than stock, decline purchase.

        connection.query("SELECT * FROM products WHERE itemId=?", userPurchase.inputId, function(err, res) {
            for (var i = 0; i < res.length; i++) {

                if (userPurchase.inputNumber > res[i].StockQuantity) {

                    console.log("===================================================");
                    console.log("So Sorry! Not enough in stock.");
                    console.log("===================================================");
                    startPrompt();

                } else {
                    //list item information for user for confirm prompt
                    console.log("===================================");
                    console.log("Dope! We can fulfull your order.");
                    console.log("===================================");
                    console.log("You've selected:");
                    console.log("----------------");
                    console.log("Item: " + res[i].ProductName);
                    console.log("Department: " + res[i].DepartmentName);
                    console.log("Price: " + res[i].Price);
                    console.log("Quantity: " + userPurchase.inputNumber);
                    console.log("----------------");
                    console.log("Total: " + res[i].Price * userPurchase.inputNumber);
                    console.log("===================================");

                    var newStock = (res[i].StockQuantity - userPurchase.inputNumber);
                    var purchaseId = (userPurchase.inputId);
                    //console.log(newStock);
                    confirmPrompt(newStock, purchaseId);
                }
            }
        });
    });
}

//Confirm Purchase

function confirmPrompt(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirmPurchase",
        message: "Are you sure you would like to purchase this item and quantity?",
        default: true

    }]).then(function(userConfirm) {
        if (userConfirm.confirmPurchase === true) {

            //if user confirms purchase, update mysql database with new stock quantity by subtracting user quantity purchased.

            connection.query("UPDATE products SET ? WHERE ?", [{
                StockQuantity: newStock
            }, {
                ItemID: purchaseId
            }], function(err, res) {});

            console.log("=================================");
            console.log("Transaction completed. You Rock!.");
            console.log("=================================");
            startPrompt();
        } else {
            console.log("=================================");
            console.log("Maybe next time!");
            console.log("=================================");
            startPrompt();
        }
    });
}