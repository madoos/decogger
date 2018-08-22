const R = require('ramda')
const isPromise = require('is-promise')
const isFunction = R.is(Function)
const isObject = x => typeof x === 'object' && x !== null
const isInstance = x =>
    isObject(x) && Object.getPrototypeOf(x) !== Object.prototype

const removeEmptyKeys = R.pickBy(R.complement(R.isNil))

const tap = f => x => {
    f(x)
    return x
}

const getModulesToTrace = R.pipe(
    R.map(conf => [conf.module, R.omit(['module'], conf)]),
    pairs => new WeakMap(pairs)
)

const doLog = ({ fnName, start, config, input, output }) => {
    const { tag, time, io, logger } = config

    if (isFunction(logger)) {
        const end = Date.now()

        const log = removeEmptyKeys({
            function      : fnName,
            tag           : tag,
            start         : time ? start : null,
            end           : time ? end : null,
            executionTime : time ? end - start : null,
            input         : io ? input : null,
            output        : io ? output : null
        })

        return logger(log)
    }
}

const selectLogger = R.curry((globalLogger, config) => {
    if (!isFunction(R.prop('logger', config))) {
        config.logger = globalLogger
    }

    return config
})

const applyLogsForFunction = (config, f) => {
    const fWrapper = function(...args) {
        const data = f.apply(this, args)

        const tapLog = tap(res =>
            doLog({
                config,
                fnName : f.name,
                start  : Date.now(),
                input  : args,
                output : res
            })
        )

        return isPromise(data) ? data.then(tapLog) : tapLog(data)
    }

    const suffix = R.isEmpty(f.name) ? 'loggerWrapped' : 'loggerWrapped'
    Object.defineProperty(fWrapper, 'name', {
        value    : `${f.name}${suffix}`,
        writable : false
    })

    return fWrapper
}

const applyLogsForObject = (config, obj) => {
    return Object.getOwnPropertyNames(obj).reduce((src, key) => {
        const prop = src[key]
        if (isFunction(prop) && prop !== 'constructor') {
            src[key] = applyLogsForFunction(config, prop)
        }
        return src
    }, obj)
}

const applyLogsForConstructor = (config, Constructor) => {
    applyLogsForObject(config, Constructor)
    applyLogsForObject(config, Constructor.prototype)
    return Constructor
}

const applyTraces = (_module, config) => {
    if (isObject(_module)) {
        return applyLogsForObject(config, _module)
    } else if (config.isConstructor && isFunction(_module)) {
        return applyLogsForConstructor(config, _module)
    } else if (isFunction(_module)) {
        return applyLogsForFunction(config, _module)
    }

    return _module
}

const traceErrorsWith = log => {
    Error = new Proxy(Error, {
        construct(_Error, args) {
            const errorInstance = new _Error(...args)
            log(errorInstance)
            return errorInstance
        }
    })

    process.on('uncaughtException', log)
    process.on('uncaughtRejection', log)
}

const wrapRequire = (globalConfig, _require) => {
    return function requireWrapper(...args) {
        const { modules, logger } = globalConfig

        const modulesToTrace = getModulesToTrace(
            modules.map(selectLogger(logger))
        )
        const requiredModule = _require.apply(this, args)

        if (modulesToTrace.has(requiredModule)) {
            const config = modulesToTrace.get(requiredModule)
            const moduleWithTraces = applyTraces(requiredModule, config)
            return moduleWithTraces
        }

        return requiredModule
    }
}

module.exports = {
    tap,
    isFunction,
    isObject,
    isInstance,
    removeEmptyKeys,
    getModulesToTrace,
    doLog,
    selectLogger,
    applyLogsForFunction,
    applyLogsForObject,
    applyLogsForConstructor,
    applyTraces,
    traceErrorsWith,
    wrapRequire
}
