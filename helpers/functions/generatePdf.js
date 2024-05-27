const puppeteer = require('puppeteer');
const generatePdf = async (url, filePath) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle2' });
	await page.pdf({ path: filePath, printBackground: true, format: 'A4', landscape: true });
	await browser.close();
};

module.exports = generatePdf;