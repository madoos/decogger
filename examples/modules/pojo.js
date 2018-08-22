const { resolveWithDelay } = require('./utils')
const DELAY = 1000

module.exports = {
    asyncDouble : x => resolveWithDelay(x * 2, DELAY),
    asyncTriple : x => resolveWithDelay(x * 3, DELAY),
    plus        : x => x + 1
}
