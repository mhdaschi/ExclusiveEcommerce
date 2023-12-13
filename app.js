const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');

const cacheControlMiddleware = require('./middlewares/cacheControlMiddleware');
const userMiddleware = require('./middlewares/userCheck')
const adminMiddleware = require('./middlewares/admincheck')


const adminRouter = require('./router/admin-router'); 
const userRouter = require('./router/user-router'); 

const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets and files
app.use(express.static('public'))
app.use(express.static('uploads'))
app.set('view engine', 'ejs');

const sessionSecret = uuidv4();

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

// Cache headers
app.use(cacheControlMiddleware);
// app.use(userMiddleware)
// app.use(adminMiddleware)

// Use the routers
app.use('/', adminRouter);
app.use('/', userRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
