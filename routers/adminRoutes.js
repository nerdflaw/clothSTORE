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

// router.get('/user-login', adminAccessControler.adminLogin_get)
// router.post('/user-login', adminAccessControler.adminLogin_post)
router.get('/admin-dashboard', adminDashboardControler.adminDashboard)
router.get('/sales-report', adminDashboardControler.salesReport_get)
router.get('/download-sales-report', adminDashboardControler.adminSalesReportDownload_get)
router.get('/generate-chart', adminDashboardControler.showChartOnDashboard_get)
router.get('/generate-sales-report', adminDashboardControler.adminGenerateSalesReportDownload_get)

router.get('/admin-user-management', userControler.adminUserControler)
router.post('/admin/block-user/:id', userControler.adminBlockUserControler);
router.post('/admin/unblock-user/:id', userControler.adminUnblockUserControler);

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

router.post('/admin-add-product-check', errorHandlerMiddleware(productControler.adminAddProductCheck_get));

router.get('/admin-delete-product/:id',
	adminAuthentication,
	errorHandlerMiddleware(productControler.adminDeleteProduct));

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

router.post('/admin/enable-product/:id', productControler.adminEnableProduct_post);
router.post('/admin/disable-product/:id', productControler.adminDisableProduct_post);

router.get('/admin-brand-management', brandControler.adminBrandManagement)
router.get('/admin-add-brand', brandControler.adminAddBrand_get)
router.post('/admin-add-brand', brandControler.adminAddBrand_post);
router.get('/admin-delete-brand/:id', brandControler.adminDeleteBrand);
router.get('/admin-edit-brand/:id', brandControler.adminEditBrand_get);
router.post('/admin-edit-brand/:id', brandControler.adminEditBrand_post);
router.post('/admin/enable-brand/:id', brandControler.adminEnableBrand_post);
router.post('/admin/disable-brand/:id', brandControler.adminDisableBrand_post);

router.get('/admin-category-management', categoryControler.adminCategoryManagement)
router.get('/admin-add-category', categoryControler.adminAddCategory_get)
router.post('/admin-add-category', categoryControler.adminAddCategory_post);
router.get('/admin-delete-category/:id', categoryControler.adminDeleteCategory);
router.get('/admin-edit-category/:id', categoryControler.adminEditCategory_get);
router.post('/admin-edit-category/:id', categoryControler.adminEditCategory_post);
router.post('/admin/enable-category/:id', categoryControler.adminEnableCategory_post);
router.post('/admin/disable-category/:id', categoryControler.adminDisableCategory_post);

router.get('/admin-color-management', adminColorControler.adminColorManagement)
router.get('/admin-add-color', adminColorControler.adminAddColor_get)
router.post('/admin-add-color', adminColorControler.adminAddColor_post);
router.get('/admin-add-criteria-check', availabilityCheckControler.adminCriteriaCheck_get);
router.get('/admin-delete-color/:id', adminColorControler.adminDeleteColor);
router.get('/admin-edit-color/:id', adminColorControler.adminEditColor_get);
router.post('/admin-edit-color/:id', adminColorControler.adminEditColor_post);
router.post('/admin/enable-color/:id', adminColorControler.adminEnableColor_post);
router.post('/admin/disable-color/:id', adminColorControler.adminDisableColor_post);

router.get('/admin-size-management', sizeControlers.adminSizeManagement)
router.get('/admin-add-size', sizeControlers.adminAddSize_get)
router.post('/admin-add-size', sizeControlers.adminAddSize_post);
router.get('/admin-delete-size/:id', sizeControlers.adminDeleteSize);
router.get('/admin-edit-size/:id', sizeControlers.adminEditSize_get);
router.post('/admin-edit-size/:id', sizeControlers.adminEditSize_post);
router.post('/admin/enable-size/:id', sizeControlers.adminEnableSize_post);
router.post('/admin/disable-size/:id', sizeControlers.adminDisableSize_post);

router.get('/admin-coupon-management', couponControler.adminCouponManagement)
router.get('/admin-add-coupon', couponControler.adminAddCoupon_get)
router.post('/admin-add-coupon', couponControler.adminAddCoupon_post);
router.get('/admin-edit-coupon/:id', couponControler.adminEditCoupon_get);
router.post('/admin-edit-coupon/:id', couponControler.adminEditCoupon_post);
router.post('/admin/enable-coupon/:id', couponControler.adminEnableCoupon_post);
router.post('/admin/disable-coupon/:id', couponControler.adminDisableCoupon_post);

router.get('/admin-order-management', orderControler.adminOrderManagement);
router.get('/admin-order-management-search', orderControler.adminOrderManagementSearch_get);
router.get('/view-order-details/:id', orderControler.adminViewOrderDetails_get);

router.post('/admin-change-order-status/:orderId',
	// adminAuthentication,
	errorHandlerMiddleware(orderControler.adminChangeOrderStatus_post))

router.get('/admin-logout', adminAccessControler.adminLogout)

// next week tasks

router.get('/admin-transactions', (req, res) => {
	res.render('admin-pages/adminTransactionsPage')
})

router.get('/admin-manage-admin', (req, res) => {
	res.render('admin-pages/adminManageAdminPage')
})

router.get('/admin-add-brand', (req, res) => {
	res.render('admin-pages/adminAddBrandPage')
})

router.get('/admin-add-banner', (req, res) => {
	res.render('admin-pages/adminAddBannerPage')
})

router.get('/admin-add-coupon', (req, res) => {
	res.render('admin-pages/adminAddCouponPage')
})

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