const express = require('express')

// setting admin credential
const credential = {
	email: 'admin@gmail.com',
	password: 'adminPass'
};

const adminLogin_get = (req, res) => {
	res.render('admin-pages/adminLoginPage')
}

const adminLogin_post = (req, res) => {
	const { email, password } = req.body
	if (credential.email === email && credential.password === password) {
		req.session.adminLogged = true
		res.redirect('/admin-dashboard')
	} else {
		res.redirect('/user-login')
	}
}

const adminLogout = (req, res) => {
	req.session.destroy()
	res.redirect('/user-login')
}

module.exports = {
	adminLogin_get,
	adminLogin_post,
	adminLogout

}