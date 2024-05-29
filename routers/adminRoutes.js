const express = require('express')
const router = express.Router();
const productControler = require('../controlers/adminControlers/productControler');
const brandControler = require('../controlers/adminControlers/brandControler');
const userControler = require('../controlers/adminControlers/userControler');
const categoryControler = require('../controlers/adminControlers/categoryControler');
const sizeControlers = require('../controlers/adminControlers/sizeControlers');
const adminDashboardControler = require('../controlers/adminControlers/dashboardControler');
const adminAccessControler = require('../controlers/adminControlers/adminAccessControler');
const adminColorControler = require('../controlers/adminControlers/colorControler');
const couponControler = require ('../controlers/adminControlers/couponControler')
const orderControler = require ('../controlers/adminControlers/orderControler')
const availabilityCheckControler = require('../controlers/adminControlers/availabilityCheckControler')
const adminAuthentication = require('../middlewares/adminAuthenticationMiddleware')
const errorHandlerMiddleware = require('../middlewares/errorHandlingMiddleware')
const multerFile = require('../upload/upload');

// adminAuthorization
// if user is logged in redirect to user's dashboard else goto next route

// adminAuthentication
// if user is logged in next process else redirect to login page

router.get('/admin-dashboard', adminAuthentication, adminDashboardControler.adminDashboard)
router.get('/sales-report',adminAuthentication, adminDashboardControler.salesReport_get)
router.get('/generate-chart',adminAuthentication, adminDashboardControler.showChartOnDashboard_get)

router.get('/admin-user-management',adminAuthentication, userControler.adminUserControler)
router.post('/admin/block-user/:id',adminAuthentication, userControler.adminBlockUserControler);
router.post('/admin/unblock-user/:id',adminAuthentication, userControler.adminUnblockUserControler);

router.get('/admin-product-management',
	adminAuthentication,
	errorHandlerMiddleware(productControler.adminProductManagement))

router.get('/admin-add-product',
	adminAuthentication,
	errorHandlerMiddleware(productControler.adminAddProduct_get))

router.post('/admin-add-product',
	adminAuthentication,
	multerFile.upload.fields([
		{ name: 'productImage1', maxCount: 1 },
		{ name: 'productImage2', maxCount: 1 },
		{ name: 'productImage3', maxCount: 1 },
		{ name: 'productImage4', maxCount: 1 },
	]),
	errorHandlerMiddleware(productControler.adminAddProduct_post));

router.post('/admin-add-product-check',adminAuthentication, errorHandlerMiddleware(productControler.adminAddProductCheck_get));

router.get('/admin-edit-product/:id',
	adminAuthentication,
	errorHandlerMiddleware(productControler.adminEditProduct_get));

router.post('/admin-edit-product/:id',
	adminAuthentication,
	multerFile.upload.fields([
		{ name: 'newProductImage1', maxCount: 1 },
		{ name: 'newProductImage2', maxCount: 1 },
		{ name: 'newProductImage3', maxCount: 1 },
		{ name: 'newProductImage4', maxCount: 1 }
	  ]),
	productControler.adminEditProduct_post);

router.post('/admin/enable-product/:id',adminAuthentication, productControler.adminEnableProduct_post);
router.post('/admin/disable-product/:id',adminAuthentication, productControler.adminDisableProduct_post);

router.get('/admin-brand-management',adminAuthentication, brandControler.adminBrandManagement)
router.get('/admin-add-brand',adminAuthentication, brandControler.adminAddBrand_get)
router.post('/admin-add-brand',adminAuthentication, brandControler.adminAddBrand_post);
router.get('/admin-edit-brand/:id',adminAuthentication, brandControler.adminEditBrand_get);
router.post('/admin-edit-brand/:id',adminAuthentication, brandControler.adminEditBrand_post);
router.post('/admin/enable-brand/:id',adminAuthentication, brandControler.adminEnableBrand_post);
router.post('/admin/disable-brand/:id',adminAuthentication, brandControler.adminDisableBrand_post);

router.get('/admin-category-management',adminAuthentication, categoryControler.adminCategoryManagement)
router.get('/admin-add-category',adminAuthentication, categoryControler.adminAddCategory_get)
router.post('/admin-add-category',adminAuthentication, categoryControler.adminAddCategory_post);
router.get('/admin-edit-category/:id',adminAuthentication, categoryControler.adminEditCategory_get);
router.post('/admin-edit-category/:id',adminAuthentication, categoryControler.adminEditCategory_post);
router.post('/admin/enable-category/:id',adminAuthentication, categoryControler.adminEnableCategory_post);
router.post('/admin/disable-category/:id',adminAuthentication, categoryControler.adminDisableCategory_post);

router.get('/admin-color-management',adminAuthentication, adminColorControler.adminColorManagement)
router.get('/admin-add-color',adminAuthentication, adminColorControler.adminAddColor_get)
router.post('/admin-add-color',adminAuthentication, adminColorControler.adminAddColor_post);
router.get('/admin-add-criteria-check',adminAuthentication, availabilityCheckControler.adminCriteriaCheck_get);
router.get('/admin-edit-color/:id',adminAuthentication, adminColorControler.adminEditColor_get);
router.post('/admin-edit-color/:id',adminAuthentication, adminColorControler.adminEditColor_post);
router.post('/admin/enable-color/:id',adminAuthentication, adminColorControler.adminEnableColor_post);
router.post('/admin/disable-color/:id',adminAuthentication, adminColorControler.adminDisableColor_post);

router.get('/admin-size-management',adminAuthentication, sizeControlers.adminSizeManagement)
router.get('/admin-add-size',adminAuthentication, sizeControlers.adminAddSize_get)
router.post('/admin-add-size',adminAuthentication, sizeControlers.adminAddSize_post);
router.get('/admin-edit-size/:id',adminAuthentication, sizeControlers.adminEditSize_get);
router.post('/admin-edit-size/:id',adminAuthentication, sizeControlers.adminEditSize_post);
router.post('/admin/enable-size/:id',adminAuthentication, sizeControlers.adminEnableSize_post);
router.post('/admin/disable-size/:id',adminAuthentication, sizeControlers.adminDisableSize_post);

router.get('/admin-coupon-management',adminAuthentication, couponControler.adminCouponManagement)
router.get('/admin-add-coupon',adminAuthentication, couponControler.adminAddCoupon_get)
router.post('/admin-add-coupon',adminAuthentication, couponControler.adminAddCoupon_post);
router.get('/admin-edit-coupon/:id',adminAuthentication, couponControler.adminEditCoupon_get);
router.post('/admin-edit-coupon/:id',adminAuthentication, couponControler.adminEditCoupon_post);
router.post('/admin/enable-coupon/:id',adminAuthentication, couponControler.adminEnableCoupon_post);
router.post('/admin/disable-coupon/:id',adminAuthentication, couponControler.adminDisableCoupon_post);

router.get('/admin-order-management',adminAuthentication, orderControler.adminOrderManagement);
router.get('/admin-order-management-search',adminAuthentication, orderControler.adminOrderManagementSearch_get);
router.get('/view-order-details/:id',adminAuthentication, orderControler.adminViewOrderDetails_get);

router.post('/admin-change-order-status/:orderId',
	adminAuthentication,
	errorHandlerMiddleware(orderControler.adminChangeOrderStatus_post))

router.get('/admin-logout',adminAuthentication, adminAccessControler.adminLogout)

// Rendering 404 error page
router.use((req, res) => {
	try {
		res.status(404).render('admin-pages/404', { title: '404 Error' });
	} catch (error) {
		console.error(500);
		res.status(500).send('Internal server error')
	}
})

module.exports = router;