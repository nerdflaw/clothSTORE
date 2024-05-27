const countries = require('countries-list').countries;

function getCountryData() {
  return Object.entries(countries).map(([code, name]) => ({
    code: code.toLowerCase(),
    name: name,
  }));
}

module.exports = getCountryData 
