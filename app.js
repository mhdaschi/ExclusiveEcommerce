const express = require('express');
const flash = require('express-flash');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const nocache=require('nocache')


const adminRouter = require('./router/admin-router'); 
const userRouter = require('./router/user-router'); 

const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets and files
app.use(express.static('public'))
app.use(express.static('uploads'))
app.set('view engine', 'ejs');

const sessionSecret = uuidv4();
app.use(nocache())
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize express-flash
app.use(flash());


// Use the routers
app.use('/', adminRouter);
app.use('/', userRouter);
app.use('*',(req,res)=>{
  res.render('404')
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
