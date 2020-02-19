const config = require('anux-package/configs/wallaby');

module.exports = config({
  include: [
    { pattern: 'package.json', load: false },
    { pattern: 'tests/*.json', load: false },
  ],
});
