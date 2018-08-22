const { resolveWithDelay } = require('./utils')
const DELAY = 1000

module.exports = function double(x) {
    return resolveWithDelay(x * 2, DELAY)
}
