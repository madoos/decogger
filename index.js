const Module = require('module')
const originalRequire = Module.prototype.require
const { isFunction, traceErrorsWith, wrapRequire } = require('./lib')

const applyLogs = options => {
    const config = Object.assign(
        {
            logger    : false,
            logErrors : false,
            modules   : []
        },
        options
    )
    const { logErrors, logger } = config

    if (isFunction(logErrors)) {
        traceErrorsWith(logErrors)
    } else if (logErrors && isFunction(logger)) {
        traceErrorsWith(logger)
    }

    Module.prototype.require = wrapRequire(originalRequire, config)
}

module.exports = applyLogs
