const express = require('express');
const adminRouter = require('./routers/adminRoutes')
const userRouter = require('./routers/userRoutes')
const fetchUserMiddleware = require('./middlewares/userMiddleware')
const fetchAdminMiddleware = require('./middlewares/adminMiddleware')
const fetchBrandsMiddleware = require('./middlewares/brandMiddleware')
const fetchProductsMiddleware = require('./middlewares/productsMiddleware')
const fetchCartsMiddleware = require('./middlewares/cartMiddleware')
const fetchWishlistsMiddleware = require('./middlewares/wishlistMiddleware')
const fetchWalletMiddleware = require('./middlewares/userWalletMiddlewar')
const fetchGrandTotalMiddleware = require('./middlewares/cartGrandTotalMiddleware')
const fetchAddressesMiddleware = require('./middlewares/addressMiddleware')
const fetchOrderGrandTotalMiddleware = require('./middlewares/orderGrandTotal&TotalMiddleware')
const blockedUserMiddleware = require('./middlewares/blockedUserMiddleware')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const session = require('express-session');
require('dotenv').config();
const mongoose = require('mongoose');
const uuid = require('uuid')
const noCache = require('nocache')
const flash = require('connect-flash')
// const { PORT_NUMBER, HOST_NAME } = process.env; 

const PORT = process.env.PORT_NUMBER
const HOST = process.env.HOST_NAME

const sessionSecret = uuid.v4();

const app = express();

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store")
    next();
});

// Enable CORS for all routes
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

// middleware and static files
app.use(express.static('public'))
app.use(express.static('partials'))

app.use(noCache())

// logger to the console
app.use(morgan('dev'))

// creating a session
app.use(
    session({
        secret: sessionSecret, // Change this to a strong, secret key
        // name: 'my-session-cookie', // Set a custom name for the session cookie (optional)
        resave: false, // Don't save the session if it hasn't been modified
        saveUninitialized: true, // Save new sessions that haven't been initialized
        cookie: {
            // secure: true, // Ensure the session cookie is sent over HTTPS only
            httpOnly: true, // Prevent client-side JavaScript from accessing the session cookie
            maxAge: 3600000, // Set the session to expire after 1 hour (in milliseconds)
            // sameSite: 'strict', // Protect against Cross-Site Request Forgery (CSRF) attacks
        },
    })
);
//flash messaging
app.use(flash());
// app.use(blockedUserMiddleware);
app.use(fetchUserMiddleware);
app.use(fetchAdminMiddleware);
app.use(fetchProductsMiddleware);
app.use(fetchBrandsMiddleware);
app.use(fetchCartsMiddleware);
app.use(fetchWishlistsMiddleware);
app.use(fetchWalletMiddleware);
app.use(fetchGrandTotalMiddleware);
app.use(fetchAddressesMiddleware);
app.use(fetchOrderGrandTotalMiddleware);

// user routes
app.use(userRouter)

// admin routes
app.use(adminRouter)

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Internal Server Error');
});

// listening to port
app.listen(PORT, () => {
	console.log(`Sever is running in http://${HOST}:${PORT}`);
});
