const { resolveWithDelay } = require('./utils')
const DELAY = 1000

module.exports = class CustomNumber {
    constructor(n) {
        this.value = n
    }

    asyncDoubleInstance() {
        return resolveWithDelay(this.value * 2, DELAY)
    }

    asyncTripleInstance() {
        return resolveWithDelay(this.value * 3, DELAY)
    }

    plusInstance() {
        return this.value + 1
    }

    static asyncDouble(n) {
        return resolveWithDelay(n * 2, DELAY)
    }

    static asyncTriple(n) {
        return resolveWithDelay(n * 3, DELAY)
    }

    static plus(n) {
        return n + 1
    }
}
