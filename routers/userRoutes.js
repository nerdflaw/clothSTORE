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

// router.use(blockedUserMiddleware)
router.get('/', adminAuthorization, userAccessControler.homepage)

router.get('/user-list-flash-sales', userAccessControler.userListFlashSales_get)
router.post('/user-list-flash-sales', userAccessControler.userListFlashSales_post)

router.get('/user-list-featured-products', userAccessControler.userListFeaturedProducts_get)
router.post('/user-list-featured-products', userAccessControler.userListFeaturedProducts_post)

router.get('/user-list-new-arrivals', userAccessControler.userListNewArrivals_get)
router.post('/user-list-new-arrivals', userAccessControler.userListNewArrivals_post)

router.get('/user-list-popular-products', userAccessControler.userListPopularProducts_get)
router.post('/user-list-popular-products', userAccessControler.userListPopularProducts_post)

router.get('/user-list-average-rated', userAccessControler.userListAverageRated_get)
router.post('/user-list-average-rated', userAccessControler.userListAverageRated_post)

router.get('/user-signup', errorHandlerMiddleware(userAccessControler.userSignUp_get))
router.post('/user-signup', errorHandlerMiddleware(userAccessControler.userSignUpOTP_post));
router.get('/user-signup-otp-validate', errorHandlerMiddleware(userAccessControler.userSignUpOTPValidate_get));
router.post('/user-signup-otp-validate', errorHandlerMiddleware(userAccessControler.userSignUpOTPValidate_post));

router.get('/user-dashboard', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboard))
router.get('/user-dashboard-address-book', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardAddressBook_get))
router.get('/user-dashboard-cart', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardCart_get))
// router.get('/user-dashboard-payment-options', errorHandlerMiddleware(userDashboardControler.userDashboardPaymentOptions_get))
router.get('/user-dashboard-orders', errorHandlerMiddleware(userDashboardControler.userDashboardOrders_get))
// router.get('/generate-invoice/:id', errorHandlerMiddleware(userDashboardControler.userGenerateInvoice_get))
router.get('/user-download-Invoice/:id', errorHandlerMiddleware(userDashboardControler.userDownloadInvoice_get))
router.get('/user-filter-order-status', errorHandlerMiddleware(userDashboardControler.userFilterOrderStatus_get))
router.post('/user-filter-order-status', errorHandlerMiddleware(userDashboardControler.userFilterOrderStatus_post))
router.post('/user-add-review', errorHandlerMiddleware(userDashboardControler.userDashboardOrdersAddReview_get))
router.get('/user-dashboard-returns', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardReturns_get))
router.get('/user-dashboard-cancellations', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardCancellations_get))
router.get('/user-add-wish-list/:id',userAuthentication, errorHandlerMiddleware(userDashboardControler.userWishList_get))
router.get('/user-checkout',userAuthentication, errorHandlerMiddleware(userDashboardControler.userCheckout_get))
router.post('/user-cancel-product', errorHandlerMiddleware(userDashboardControler.userCancelCartProduct_post))
router.post('/updateQuantity', errorHandlerMiddleware(userDashboardControler.userChangeQuantity_post))
router.post('/updateQuantity-place-order', errorHandlerMiddleware(userDashboardControler.updateQuantityPlaceOrder_post))
router.post('/user-cancel-product-place-order', errorHandlerMiddleware(userDashboardControler.userCancelCartProductOnPlaceorder_post))
router.post('/user-apply-coupon-place-order', errorHandlerMiddleware(userDashboardControler.userApplyCouponPlaceOrder_post))
router.post('/user-remove-coupon-place-order', errorHandlerMiddleware(userDashboardControler.userRemoveCouponPlaceOrder_post))
router.post('/user-place-order/:id',userAuthentication, errorHandlerMiddleware(userDashboardControler.userPlaceOrder_post))
router.post('/verify/payment', errorHandlerMiddleware(userDashboardControler.userVerifyPayment_post))
router.post('/retry/payment', errorHandlerMiddleware(userDashboardControler.userRetryPayment_post))
router.post('/change/payment/status', errorHandlerMiddleware(userDashboardControler.userChangePaymentStatus_post))
router.post('/user-cancel-single-product', errorHandlerMiddleware(userDashboardControler.userCancelSingleOrder_post))
router.post('/user-cancel-whole-products', errorHandlerMiddleware(userDashboardControler.userCancelWholeOrder_post))
router.post('/user-return-whole-products', errorHandlerMiddleware(userDashboardControler.userReturnWholeOrder_post))

router.get('/user-dashboard-wish-lists', userAuthentication, errorHandlerMiddleware(userDashboardControler.userDashboardWishists_get))
router.get('/user-add-address', errorHandlerMiddleware(userDashboardControler.userAddAddress_get))
router.post('/user-add-address', errorHandlerMiddleware(userDashboardControler.userAddAddress_post))
router.get('/user-add-address-on-place-order', errorHandlerMiddleware(userDashboardControler.userAddAddressOnPayment_get))
router.post('/user-add-address-on-place-order', errorHandlerMiddleware(userDashboardControler.userAddAddressOnPayment_post))
router.post('/user-edit-address', errorHandlerMiddleware(userDashboardControler.userEditAddress_post))
router.post('/user-delete-address/:id', errorHandlerMiddleware(userDashboardControler.userDeleteAddress_post))
router.post('/user-get-details-by-pincode', errorHandlerMiddleware(userDashboardControler.userGetPincodeDatails_post))
router.get('/user-search', errorHandlerMiddleware(userDashboardControler.userSearch_get))
router.post('/user-search', errorHandlerMiddleware(userDashboardControler.userSearch_post))

router.get('/user-login', errorHandlerMiddleware(userAccessControler.userLogin_get))
router.post('/user-login', errorHandlerMiddleware(userAccessControler.userLogin_post));

//google authentication codes.
// router.get('/user-login-google', errorHandlerMiddleware(userAccessControler.userLoginGoogle_get))
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

router.get('/user-list-all-products', userAuthentication, errorHandlerMiddleware(userViewProducts.userListAllproducts_get))
router.post('/user-list-all-products', errorHandlerMiddleware(userViewProducts.userListAllproducts_post))
router.get('/user-view-product-details/:id', errorHandlerMiddleware(userViewProducts.userViewProductDetails))
router.get('/user-select-product-details/:id', errorHandlerMiddleware(userViewProducts.userSelectProductDetails))
router.post('/user-add-to-cart', errorHandlerMiddleware(userViewProducts.userAddToCart_post))
router.get('/user-list-product-reviews/:id', errorHandlerMiddleware(userViewProducts.userListProductReviews))

//forgot password part
router.get('/user-forgot-password', errorHandlerMiddleware(userForgotPassword.userForgotPassword_get))
router.post('/user-forgot-password', errorHandlerMiddleware(userForgotPassword.userForgotPassword_post));
router.post('/check-old-password', errorHandlerMiddleware(userDashboardControler.userCheckOldPassword_post))
router.get('/user-otp-validation', errorHandlerMiddleware(userForgotPassword.userValidateOTP_get));
router.post('/user-otp-validation', errorHandlerMiddleware(userForgotPassword.userValidateOTP_post));
router.get('/user-reset-password', errorHandlerMiddleware(userForgotPassword.userResetPassword_get))
router.post('/user-reset-password', errorHandlerMiddleware(userForgotPassword.userResetPassword_post))
router.post('/user-change-password', errorHandlerMiddleware(userForgotPassword.userChangePassword_post))
router.get('/user-resend-otp', errorHandlerMiddleware(userForgotPassword.userResendOTP_post));
router.get('/user-resend-otp-validation', errorHandlerMiddleware(userForgotPassword.userValidateResendOTP_get));
router.post('/user-resend-otp-validation', errorHandlerMiddleware(userForgotPassword.userValidateResendOTP_post));

router.get('/user-view-brandwise/:id', errorHandlerMiddleware(userAccessCategoryController.userAccessBrandWise_get))
router.post('/user-view-brandwise-filter/:id', errorHandlerMiddleware(userAccessCategoryController.userAccessBrandWiseFilter_post))

router.get('/user-signout', errorHandlerMiddleware(userAccessControler.userSignout))

module.exports = router