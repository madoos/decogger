const resolveWithDelay = (x, delay) =>
    new Promise(resolve => setTimeout(() => resolve(x), delay))

module.exports = {
    resolveWithDelay
}
