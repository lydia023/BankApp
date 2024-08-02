const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const app = express();

//create mysql connection
const connection = mysql.createConnection({
    //host: "localhost",
    //user: "root",
    //password: "",
    //database: "c237_bankingapp"
    host: "sql.freedb.tech",
    user: "freedb_lydia023",
    password: "aqg2aURfd8q9$!T",
    database: "freedb_c237_bankingapp"
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

//setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images"); //directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

//set up view engine
app.set("view engine", "ejs");
//enable static files
app.use(express.static("public"));
//cookie
app.use(cookieParser());
//enable form processing
app.use(express.urlencoded({
    extended: false
}));

// Define the ensureAuthenticated middleware check if user is logged in
function ensureAuthenticated(req, res, next) {
    if (req.cookies.user_id) { //check if theres a cookie named user_id in the request
        return next(); //if user_id cookie exist calls next to continue to route 
    }
    res.redirect('/login'); //if no cookie
}

//middleware to ensure isAuthenticated
app.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.cookies.user_id; //set to true if it exist
    next();
});

//money tracking route
app.get("/moneyTracking", ensureAuthenticated, (req, res) => {
    res.render("moneyTracking");
});

app.post("/addExpense", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const { amount, description, date } = req.body;
    console.log("Add Expense Data:", { userID, amount, description, date });
    
    const sql = "INSERT INTO expenses (userID, amount, description, date) VALUES (?, ?, ?, ?)";
    connection.query(sql, [userID, amount, description, date], (error, results) => {
        if (error) {
            console.error("Error adding expense:", error);
            return res.status(500).send("Error adding expense");
        }
        res.redirect("/moneyTracking");
    });
});

app.post("/addIncome", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const { amount, description, date } = req.body;
    console.log("Add Income Data:", { userID, amount, description, date });
    
    const sql = "INSERT INTO income (userID, amount, description, date) VALUES (?, ?, ?, ?)";
    connection.query(sql, [userID, amount, description, date], (error, results) => {
        if (error) {
            console.error("Error adding income:", error);
            return res.status(500).send("Error adding income");
        }
        res.redirect("/moneyTracking");
    });
});

app.post("/addSavings", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const { amount, description, date } = req.body;
    console.log("Add Savings Data:", { userID, amount, description, date });
    
    const sql = "INSERT INTO savings (userID, amount, description, date) VALUES (?, ?, ?, ?)";
    connection.query(sql, [userID, amount, description, date], (error, results) => {
        if (error) {
            console.error("Error adding savings:", error);
            return res.status(500).send("Error adding savings");
        }
        res.redirect("/moneyTracking");
    });
});



// budgeting route
app.get("/budgetPlanner", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const userQuery = "SELECT * FROM users WHERE userID = ?";
    
    // Query the database for user details and related financial data
    connection.query(userQuery, [userID], (error, userResults) => {
        if (error) {
            console.error("Error executing user query", error.message);
            return res.status(500).send("Error retrieving user by ID");
        }
        
        const user = userResults[0]; // Assuming user is the first result or undefined/null if not found
        
        // Render the budgetPlanner.ejs template with user data (even if user is null/undefined)
        res.render("budgetPlanner", {
            user: user // Pass the user object to the template
        });
    });
});

app.post("/budgetPlanner", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const {monthlyIncome, foodExpenses, transportExpenses, miscExpenses, updatedDate} = req.body;
    console.log("Add Budget Data:", {userID, monthlyIncome, foodExpenses, transportExpenses, miscExpenses, updatedDate});
    
    const sql = "INSERT INTO budgets (userID, monthlyIncome, foodExpenses, transportExpenses, miscExpenses, updatedDate) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql, [userID, monthlyIncome, foodExpenses, transportExpenses, miscExpenses, updatedDate], (error, results) => {
        if (error) {
            console.error("Error adding budget:", error);
            return res.status(500).send("Error adding budget");
        }
        res.redirect("/dashboard");
    });
});

//targetSetting route
app.get("/targetSetting", ensureAuthenticated, (req, res) => {
    res.render("targetSetting");
});

// Handle POST request to add a new target
app.post("/targetSetting", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    const { amount, description, startDate, deadline } = req.body;
    console.log("Add Target Data:", { userID, amount, description, startDate, deadline });

    const sql = "INSERT INTO targets (userID, amount, description, date, deadline) VALUES (?, ?, ?, ?, ?)";
    connection.query(sql, [userID, amount, description, startDate, deadline], (error, results) => {
        if (error) {
            console.error("Error adding target:", error);
            return res.status(500).send("Error adding target");
        }
        res.redirect("/dashboard");
    });
});


//contact route
app.get("/contact", (req, res) => {
    res.render("contact");
});

//login route
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const {username, password} = req.body;
    connection.query("SELECT * FROM users WHERE username = ? and password =?",
    [username, password],
    (error, results) => {
        if (error) {
            console.error("Error query error:", error.message);
            return res.status(500).send("Error retrieving user by ID");
        }
        if (results.length > 0) {
            const user = results[0];
            //set a cookie to indicate the user is logged in
            res.cookie("user_id", user.userID);
            res.redirect("/dashboard"); //redirect to dashboard or protected page
        } else {
            res.send("Invalid username or password"); //handle authentication failure
        }
    });
});

// Dashboard route
app.get("/dashboard", ensureAuthenticated, (req, res) => {
    const userID = req.cookies.user_id;
    
    const userQuery = "SELECT * FROM users WHERE userID = ?";
    const expensesQuery = "SELECT * FROM expenses WHERE userID = ?";
    const incomeQuery = "SELECT * FROM income WHERE userID = ?";
    const savingsQuery = "SELECT * FROM savings WHERE userID = ?";
    const budgetsQuery = "SELECT * FROM budgets WHERE userID = ?";
    const targetsQuery = "SELECT * FROM targets WHERE userID = ?";
    
    // Query the database for user details and related financial data
    connection.query(userQuery, [userID], (error, userResults) => {
        if (error) {
            console.error("Error executing user query", error.message);
            return res.status(500).send("Error retrieving user by ID");
        }
        
        if (userResults.length > 0) {
            const user = userResults[0];
            
            // Fetch expenses
            connection.query(expensesQuery, [userID], (error, expenseResults) => {
                if (error) {
                    console.error("Error executing expenses query", error.message);
                    return res.status(500).send("Error retrieving expenses");
                }
                
                // Fetch income
                connection.query(incomeQuery, [userID], (error, incomeResults) => {
                    if (error) {
                        console.error("Error executing income query", error.message);
                        return res.status(500).send("Error retrieving income");
                    }
                    
                    // Fetch savings
                    connection.query(savingsQuery, [userID], (error, savingsResults) => {
                        if (error) {
                            console.error("Error executing savings query", error.message);
                            return res.status(500).send("Error retrieving savings");
                        }
                        
                        // Fetch budgets
                        connection.query(budgetsQuery, [userID], (error, budgetsResults) => {
                            if (error) {
                                console.error("Error executing budgets query", error.message);
                                return res.status(500).send("Error retrieving budgets");
                            }
                            
                            // Fetch targets
                            connection.query(targetsQuery, [userID], (error, targetsResults) => {
                                if (error) {
                                    console.error("Error executing targets query", error.message);
                                    return res.status(500).send("Error retrieving targets");
                                }
                                
                                // Render dashboard with fetched data
                                res.render("dashboard", {
                                    user: user,
                                    expenses: expenseResults,
                                    income: incomeResults,
                                    savings: savingsResults,
                                    budgets: budgetsResults,
                                    targets: targetsResults
                                });
                            });
                        });
                    });
                });
            });
        } else {
            res.redirect("/login"); // Redirect to login if user not found
        }
    });
});

//logout route - clear session or token
app.post("/logout", (req, res) => {
    res.clearCookie("user_id");
    res.redirect("/login"); // redirect to login page after logout
});

//define routes
app.get("/", (req, res) => {
    connection.query("SELECT * FROM users", (error, results) => {
        if (error) throw error;
        res.render("index", {users: results}); //render HTML page with data
    });
});

//create route to retrieve one user by id
app.get("/user/:id", ensureAuthenticated, (req, res) => {
    const userID = req.params.id;
    const sql = "SELECT * FROM users WHERE userID = ?";
    connection.query(sql, [userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving user by ID");
        }
        if (results.length > 0) {
            res.render("user", {user: results[0]});
        } else {
            res.status(404).send("User not found");
        }
    });
});

//route to add into the database
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", upload.single("image"), (req, res) => {
    const {username, password, name} = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; //save only the filename
    } else {
        image = null;
    }

    const sql = "INSERT INTO users (username, password, name, image) VALUES (?, ?, ?, ?)";
    connection.query(sql, [username, password, name, image], (error, results) => {
        if (error) {
            console.error("Error adding user:", error);
            res.status(500).send("Error adding user");
        } else {
            res.redirect("/");
        }
    });
});

//retrieve existing data from database, displayed to user in a form to see what information is currently stored
app.get("/editUser/:id", ensureAuthenticated, (req, res) => {
    const userID = req.params.id
    const sql = "SELECT * FROM users WHERE userID = ?";
    connection.query(sql, [userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving user by ID");
        }
        if (results.length > 0) {
            res.render("editUser", {user: results[0]});
        } else {
            res.status(404).send("User not found");
        }
    });
});

//update corresponding record in database with new data provided
app.post("/editUser/:id", upload.single("image"), ensureAuthenticated, (req, res) => {
    const userID = req.params.id;
    const {name} = req.body;
    let image = req.body.currentImage; //retrieve current image filename
    if (req.file) { //if new image is uploaded
        image = req.file.filename; //set image to be new image filename
    }

    const sql = "UPDATE users SET name = ?, image = ? WHERE userID = ?";
    connection.query(sql, [name, image, userID], (error, results) => {
        if (error) {
            console.error("Error updating user:", error);
            res.status(500).send("Error updating user");
        } else {
            res.redirect("/dashboard");
        }
    });
});

// Retrieve existing data from the database to display to the user in a form
app.get("/editExpense/:id", ensureAuthenticated, (req, res) => {
    const expenseID = req.params.id; // Correcting variable name to expenseID
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie

    const sql = "SELECT * FROM expenses WHERE expenseID = ? AND userID = ?";
    connection.query(sql, [expenseID, userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving expense by ID");
        }
        if (results.length > 0) {
            res.render("editExpense", { expense: results[0] }); // Pass the expense object to the template
        } else {
            res.status(404).send("Expense not found");
        }
    });
});

// Update the corresponding record in the database with new data provided
app.post("/editExpense/:id", ensureAuthenticated, (req, res) => {
    const expenseID = req.params.id; // Correcting variable name to expenseID
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie
    const { amount, description, date} = req.body;

    const sql = "UPDATE expenses SET amount = ?, description = ?, date = ? WHERE expenseID = ? AND userID = ?";
    connection.query(sql, [amount, description, date, expenseID, userID], (error, results) => {
        if (error) {
            console.error("Error updating expense:", error);
            return res.status(500).send("Error updating expense");
        } else {
            res.redirect("/dashboard");
        }
    });
});

// income Retrieve existing data from the database to display to the user in a form
app.get("/editIncome/:id", ensureAuthenticated, (req, res) => {
    const incomeID = req.params.id;
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie
    const sql = "SELECT * FROM income WHERE incomeID = ? AND userID = ?";
    connection.query(sql, [incomeID, userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving income by ID");
        }
        if (results.length > 0) {
            res.render("editIncome", { income: results[0] });
        } else {
            res.status(404).send("Income not found");
        }
    });
});

// Update corresponding record in the database with new data provided
app.post("/editIncome/:id", ensureAuthenticated, (req, res) => {
    const incomeID = req.params.id;
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie
    const { amount, description, date} = req.body;

    const sql = "UPDATE income SET amount = ?, description = ?, date = ? WHERE incomeID = ? AND userID = ?";
    connection.query(sql, [amount, description, date, incomeID, userID], (error, results) => {
        if (error) {
            console.error("Error updating income:", error);
            res.status(500).send("Error updating income");
        } else {
            res.redirect("/dashboard");
        }
    });
});

// savings Retrieve existing data from the database to display to the user in a form
app.get("/editSaving/:id", ensureAuthenticated, (req, res) => {
    const savingsID = req.params.id;
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie
    const sql = "SELECT * FROM savings WHERE savingsID = ? AND userID = ?";
    connection.query(sql, [savingsID, userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving savings by ID");
        }
        if (results.length > 0) {
            res.render("editSaving", { savings: results[0] });
        } else {
            res.status(404).send("Savings not found");
        }
    });
});

// Update corresponding record in the database with new data provided
app.post("/editSaving/:id", ensureAuthenticated, (req, res) => {
    const savingsID = req.params.id;
    const userID = req.cookies.user_id; // Assuming the user ID is stored in a cookie
    const { amount, description, date} = req.body;

    const sql = "UPDATE savings SET amount = ?, description = ?, date = ? WHERE savingsID = ? AND userID = ?";
    connection.query(sql, [amount, description, date, savingsID, userID], (error, results) => {
        if (error) {
            console.error("Error updating savings:", error);
            res.status(500).send("Error updating savings");
        } else {
            res.redirect("/dashboard");
        }
    });
});

// budget Retrieve existing data from the database to display to the user in a form
app.get("/editBudget/:id", ensureAuthenticated, (req, res) => {
    const budgetID = req.params.id;
    
    const userID = req.cookies.user_id; // Assuming userID is stored in cookies

    const sql = "SELECT * FROM budgets WHERE budgetID = ? AND userID = ?";
    connection.query(sql, [budgetID, userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving budget by ID");
        }
        if (results.length > 0) {
            res.render("editBudget", { budget: results[0] });
        } else {
            res.status(404).send("Budget not found");
        }
    });
});

// Update corresponding record in the database with new data provided
app.post("/editBudget/:id", ensureAuthenticated, (req, res) => {
    const budgetID = req.params.id;
    const userID = req.cookies.user_id; // Assuming userID is stored in cookies
    const { amount, description, date, deadline } = req.body;

    const sql = "UPDATE budgets SET amount = ?, description = ?, date = NOW(), deadline = ? WHERE budgetID = ? AND userID = ?";
    connection.query(sql, [amount, description, date, deadline, budgetID, userID], (error, results) => {
        if (error) {
            console.error("Error updating budget:", error);
            res.status(500).send("Error updating budget");
        } else {
            res.redirect("/dashboard");
        }
    });
});

// Retrieve existing data from the database to display to the user in a form
app.get("/editTarget/:id", ensureAuthenticated, (req, res) => {
    const targetID = req.params.id;
    const userID = req.cookies.user_id; // Assuming userID is stored in cookies

    const sql = "SELECT * FROM targets WHERE targetID = ? AND userID = ?";
    connection.query(sql, [targetID, userID], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving target by ID");
        }
        if (results.length > 0) {
            res.render("editTarget", { target: results[0] });
        } else {
            res.status(404).send("Target not found");
        }
    });
});

// target Update corresponding record in the database with new data provided
app.post("/editTarget/:id", ensureAuthenticated, (req, res) => {
    const targetID = req.params.id;
    const userID = req.cookies.user_id; // Assuming userID is stored in cookies
    const { amount, description, date, deadline } = req.body;

    const sql = "UPDATE targets SET amount = ?, description = ?, date = ?, deadline = ? WHERE targetID = ? AND userID = ?";
    connection.query(sql, [amount, description, date, deadline, targetID, userID], (error, results) => {
        if (error) {
            console.error("Error updating target:", error);
            res.status(500).send("Error updating target");
        } else {
            res.redirect("/dashboard");
        }
    });
});


////////////////////////////////////DELETE/////////////////////////
// Delete expense from database
app.get("/deleteExpense/:id", ensureAuthenticated, (req, res) => {
    const expenseID = req.params.id;
    const sql = "DELETE FROM expenses WHERE expenseID = ?";
    connection.query(sql, [expenseID], (error, results) => {
        if (error) {
            console.error("Error deleting expense:", error);
            res.status(500).send("Error deleting expense");
        } else {
            res.redirect("/dashboard"); // Redirect to the money tracking page after deletion
        }
    });
});

// Delete income from database
app.get("/deleteIncome/:id", ensureAuthenticated, (req, res) => {
    const incomeID = req.params.id;
    const sql = "DELETE FROM incomes WHERE incomeID = ?";
    connection.query(sql, [incomeID], (error, results) => {
        if (error) {
            console.error("Error deleting income:", error);
            res.status(500).send("Error deleting income");
        } else {
            res.redirect("/moneyTracking"); // Redirect to the money tracking page after deletion
        }
    });
});

// Delete savings from database
app.get("/deleteSavings/:id", ensureAuthenticated, (req, res) => {
    const savingsID = req.params.id;
    const sql = "DELETE FROM savings WHERE savingsID = ?";
    connection.query(sql, [savingsID], (error, results) => {
        if (error) {
            console.error("Error deleting savings:", error);
            res.status(500).send("Error deleting savings");
        } else {
            res.redirect("/moneyTracking"); // Redirect to the money tracking page after deletion
        }
    });
});

// Delete budget from database
app.get("/deleteBudget/:id", ensureAuthenticated, (req, res) => {
    const budgetID = req.params.id;
    const sql = "DELETE FROM budgets WHERE budgetID = ?";
    connection.query(sql, [budgetID], (error, results) => {
        if (error) {
            console.error("Error deleting budget:", error);
            res.status(500).send("Error deleting budget");
        } else {
            res.redirect("/dashboard"); // Redirect to the budget planner page after deletion
        }
    });
});

// Delete target from database
app.get("/deleteTarget/:id", ensureAuthenticated, (req, res) => {
    const targetID = req.params.id;
    const sql = "DELETE FROM targets WHERE targetID = ?";
    connection.query(sql, [targetID], (error, results) => {
        if (error) {
            console.error("Error deleting target:", error);
            res.status(500).send("Error deleting target");
        } else {
            res.redirect("/dashboard"); // Redirect to the target setting page after deletion
        }
    });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

