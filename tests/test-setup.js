const chai = require('chai');
// const spies = require('chai-spies');
// const fuzzy = require('chai-fuzzy');
const asPromised = require('chai-as-promised');

// chai.use(spies);
// chai.use(fuzzy);
chai.use(asPromised);

global['chai'] = chai;
global['expect'] = chai.expect;
