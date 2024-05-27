const express = require('express')


// adminLogin_get, adminLogin_post, adminLogout

// setting admin credential
const credential = {
	email: 'admin@gmail.com',
	password: 'admin'
};


const adminLogin_get = (req, res) => {
	res.render('admin-pages/adminLoginPage')
}

const adminLogin_post = (req, res) => {
	try {
		if (req.body.adminLogged) {
			res.redirect('/admin-dashboard')
		} else {
			const { email, password } = req.body
			if (credential.email === email && credential.password === password) {
				req.session.adminLogged = true
				res.redirect('/admin-dashboard')
			} else {
				res.redirect('/user-login')
			}
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server errror')
	}
}

const adminLogout = (req, res) => {
	try {
		if (req.body.adminLogged) {
			res.redirect('/admin-dashboard')
		} else {
			req.session.destroy()
			res.redirect('/user-login')
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server errror')
	}
}

module.exports = {
	adminLogin_get,
	adminLogin_post,
	adminLogout

}