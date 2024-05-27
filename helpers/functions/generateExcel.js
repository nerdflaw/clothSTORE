const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Function to generate Excel file
const generateExcel = (data, filePath) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
  xlsx.writeFile(workbook, filePath);
};
module.exports = generateExcel;