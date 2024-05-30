const express = require('express')
const passport = require('passport');
const router = express.Router();
require('../passport');
const userAuthentication = require('../middlewares/userAuthenticationMiddleware')
const userAuthorization = require('../middlewares/userAuthorizationMiddleware')
const adminAuthentication = require('../middlewares/adminAuthenticationMiddleware')
const adminAuthorization = require('../middlewares/adminAuthorizationMiddleware')
const errorHandlerMiddleware = require('../middlewares/errorHandlingMiddleware')
const userAccessControler = require('../controlers/userControlers/userAccessControler')
const userDashboardControler = require('../controlers/userControlers/userDashboardControler')
const userViewProducts = require('../controlers/userControlers/userViewProducts')
const userAccessCategoryController = require('../controlers/userControlers/userAccessBrandController')
const userForgotPassword = require('./forgotPassword')
const blockedUserMiddleware = require('../middlewares/blockedUserMiddleware');

router.use(passport.initialize());
router.use(passport.session());
// adminAuthorization, userAuthorization
// if user is logged in redirect to user's dashboard else goto next route

// adminAuthentication, userAuthentication
// if user is logged in next process else redirect to login page

router.get('/', adminAuthorization, userAccessControler.homepage)
router.post('/activate-wallet', adminAuthorization, userAccessControler.userActivateWallet)


router.get('/user-list-flash-sales', adminAuthorization, userAccessControler.userListFlashSales_get)
router.post('/user-list-flash-sales', adminAuthorization, userAccessControler.userListFlashSales_post)

router.get('/user-list-featured-products', adminAuthorization, userAccessControler.userListFeaturedProducts_get)
router.post('/user-list-featured-products', adminAuthorization, userAccessControler.userListFeaturedProducts_post)

router.get('/user-list-new-arrivals', adminAuthorization, userAccessControler.userListNewArrivals_get)
router.post('/user-list-new-arrivals', adminAuthorization, userAccessControler.userListNewArrivals_post)

router.get('/user-list-popular-products', adminAuthorization, userAccessControler.userListPopularProducts_get)
router.post('/user-list-popular-products', adminAuthorization, userAccessControler.userListPopularProducts_post)

router.get('/user-list-average-rated', adminAuthorization, userAccessControler.userListAverageRated_get)
router.post('/user-list-average-rated', adminAuthorization, userAccessControler.userListAverageRated_post)

router.get('/user-signup', adminAuthorization, errorHandlerMiddleware(userAccessControler.userSignUp_get))
router.post('/user-signup', adminAuthorization, errorHandlerMiddleware(userAccessControler.userSignUpOTP_post));
router.get('/user-signup-otp-validate', adminAuthorization, errorHandlerMiddleware(userAccessControler.userSignUpOTPValidate_get));
router.post('/user-signup-otp-validate', adminAuthorization, errorHandlerMiddleware(userAccessControler.userSignUpOTPValidate_post));

router.get('/user-dashboard', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboard))
router.get('/user-dashboard-address-book', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardAddressBook_get))
router.get('/user-dashboard-wallet', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardWallet_get))
router.get('/user-dashboard-cart', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardCart_get))
router.get('/user-dashboard-orders', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardOrders_get))
router.get('/user-download-Invoice/:id', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDownloadInvoice_get))
router.get('/user-filter-order-status', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userFilterOrderStatus_get))
router.post('/user-filter-order-status', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userFilterOrderStatus_post))
router.post('/user-add-review', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardOrdersAddReview_get))
router.get('/user-dashboard-returns', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardReturns_get))
router.get('/user-dashboard-cancellations', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardCancellations_get))
router.get('/user-add-wish-list/:id', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userWishList_get))
router.get('/user-checkout', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCheckout_get))
router.post('/user-cancel-product', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCancelCartProduct_post))
router.post('/updateQuantity', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userChangeQuantity_post))
router.post('/updateQuantity-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.updateQuantityPlaceOrder_post))
router.post('/user-cancel-product-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCancelCartProductOnPlaceorder_post))
router.post('/user-apply-coupon-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userApplyCouponPlaceOrder_post))
router.post('/user-remove-coupon-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userRemoveCouponPlaceOrder_post))
router.post('/user-place-order/:id', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userPlaceOrder_post))
router.post('/verify/payment', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userVerifyPayment_post))
router.post('/retry/payment', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userRetryPayment_post))
router.post('/change/payment/status', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userChangePaymentStatus_post))
router.post('/user-cancel-single-product', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCancelSingleOrder_post))
router.post('/user-cancel-whole-products', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCancelWholeOrder_post))
router.post('/user-return-whole-products', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userReturnWholeOrder_post))

router.get('/user-dashboard-wish-lists', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardWishists_get))
router.get('/user-add-address', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userAddAddress_get))
router.post('/user-add-address', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userAddAddress_post))
router.get('/user-add-address-on-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userAddAddressOnPayment_get))
router.post('/user-add-address-on-place-order', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userAddAddressOnPayment_post))
router.post('/user-edit-address', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userEditAddress_post))
router.post('/user-delete-address/:id', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userDeleteAddress_post))
router.post('/user-get-details-by-pincode', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userGetPincodeDatails_post))
router.get('/user-search', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userSearch_get))
router.post('/user-search', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userSearch_post))

router.get('/user-login', userAuthorization, adminAuthorization, errorHandlerMiddleware(userAccessControler.userLogin_get))
router.post('/user-login', adminAuthorization, errorHandlerMiddleware(userAccessControler.userLogin_post));

//auth
router.get('/auth/google', passport.authenticate('google', {
	scope: ['email', 'profile']
}));
//auth callback
router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/auth/success',
	failureRedirect: '/auth/failure'
}))
// on success authentication
router.get('/auth/success', errorHandlerMiddleware(userAccessControler.userLoginGoogleSuccess_get))
// on failed authentication 
router.get('/auth/failure', errorHandlerMiddleware(userAccessControler.userLoginGoogleFailed_get))

router.get('/user-list-all-products', adminAuthorization, errorHandlerMiddleware(userViewProducts.userListAllproducts_get))
router.post('/user-list-all-products', adminAuthorization, errorHandlerMiddleware(userViewProducts.userListAllproducts_post))
router.get('/user-view-product-details/:id', adminAuthorization, errorHandlerMiddleware(userViewProducts.userViewProductDetails))
router.get('/user-select-product-details/:id', adminAuthorization, errorHandlerMiddleware(userViewProducts.userSelectProductDetails))
router.post('/user-add-to-cart', adminAuthorization, userAuthentication, errorHandlerMiddleware(userViewProducts.userAddToCart_post))
router.get('/user-list-product-reviews/:id', adminAuthorization, userAuthentication, errorHandlerMiddleware(userViewProducts.userListProductReviews))

//forgot password part
router.get('/user-forgot-password', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userForgotPassword_get))
router.post('/user-forgot-password', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userForgotPassword_post));
router.post('/check-old-password', adminAuthorization, userAuthentication, errorHandlerMiddleware(userDashboardControler.userCheckOldPassword_post))
router.get('/user-otp-validation', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userValidateOTP_get));
router.post('/user-otp-validation', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userValidateOTP_post));
router.get('/user-reset-password', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userResetPassword_get))
router.post('/user-reset-password', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userResetPassword_post))
router.post('/user-change-password', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userChangePassword_post))
router.get('/user-resend-otp', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userResendOTP_post));
router.get('/user-resend-otp-validation', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userValidateResendOTP_get));
router.post('/user-resend-otp-validation', adminAuthorization, errorHandlerMiddleware(userForgotPassword.userValidateResendOTP_post));

router.get('/user-view-brandwise/:id', adminAuthorization, errorHandlerMiddleware(userAccessCategoryController.userAccessBrandWise_get))
router.post('/user-view-brandwise-filter/:id', adminAuthorization, errorHandlerMiddleware(userAccessCategoryController.userAccessBrandWiseFilter_post))

router.get('/user-signout', adminAuthorization, errorHandlerMiddleware(userAccessControler.userSignout))

module.exports = router