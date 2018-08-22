const Module = require('module')
const originalRequire = Module.prototype.require
const { isFunction, traceErrorsWith, wrapRequire } = require('./lib')

const applyLogs = config => {
    const _config = Object.assign(
        {
            logger    : false,
            logErrors : false,
            modules   : []
        },
        config
    )
    const { logErrors, logger } = _config

    if (isFunction(logErrors)) {
        traceErrorsWith(logErrors)
    } else if (logErrors && isFunction(logger)) {
        traceErrorsWith(logger)
    }

    Module.prototype.require = wrapRequire(originalRequire, _config)
}

module.exports = applyLogs
