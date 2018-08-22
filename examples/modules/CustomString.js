const { resolveWithDelay } = require('./utils')
const DELAY = 1000

module.exports = class CustomString {
    constructor(s) {
        this.value = s
    }

    asyncDoubleInstance() {
        return resolveWithDelay(this.value + this.value, DELAY)
    }

    asyncTripleInstance() {
        return resolveWithDelay(this.value + this.value + this.value, DELAY)
    }

    plusInstance() {
        return this.value + 'plus'
    }

    static asyncDouble(n) {
        return resolveWithDelay(n + n, DELAY)
    }

    static asyncTriple(n) {
        return resolveWithDelay(n + n + n, DELAY)
    }

    static plus(n) {
        return n + 'plus'
    }
}
