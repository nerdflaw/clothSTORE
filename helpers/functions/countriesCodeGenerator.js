const countryCodes = require('country-codes-list');

function getCustomList(customProperty) {
  const customList = {};

  for (const countryCode in countryCodes.customList('countryCode')) {
    const country = countryCodes.customList('countryCode')[countryCode];
    const customValue = country[customProperty];
    customList[countryCode] = customValue;
  }

  return customList;
}

module.exports = {
  getCustomList,
};
