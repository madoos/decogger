const R = require('ramda')
const isPromise = require('is-promise')
const isFunction = R.is(Function)
const isObject = x => typeof x === 'object' && x !== null
const isInstance = x =>
    isObject(x) && Object.getPrototypeOf(x) !== Object.prototype

const clone = obj => {
    if (!isObject(obj)) {
        return obj
    }
    const copy = new obj.constructor()

    return Object.getOwnPropertyNames(obj).reduce((src, key) => {
        src[key] = obj[key]
        return src
    }, copy)
}

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

const applyLogsForFunction = (f, config) => {
    const fWrapper = function(...args) {
        const data = f.apply(this, args)
        const start = Date.now()

        const tapLog = tap(res =>
            doLog({
                config,
                start,
                fnName : f.name,
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

const applyLogsForObject = (obj, config) => {
    const _config = Object.assign({ omit : () => false }, config)

    return Object.getOwnPropertyNames(obj).reduce((src, key) => {
        const prop = src[key]

        const isOmitted = isFunction(_config.omit)
            ? _config.omit(key, prop, obj)
            : _config.omit.includes(key)

        if (!isOmitted && isFunction(prop) && prop !== 'constructor') {
            src[key] = applyLogsForFunction(prop, _config)
        }
        return src
    }, obj)
}

const applyLogsForConstructor = (Constructor, config) => {
    applyLogsForObject(Constructor, config)
    applyLogsForObject(Constructor.prototype, config)
    return Constructor
}

const applyLogsForInstances = (instance, config) => {
    applyLogsForObject(instance, config)
    const proto = Object.getPrototypeOf(instance)
    Object.setPrototypeOf(instance, applyLogsForObject(clone(proto), config))
    return instance
}

const applyTraces = (_module, config) => {
    if (isInstance(_module)) {
        return applyLogsForInstances(_module, config)
    } else if (isObject(_module)) {
        return applyLogsForObject(_module, config)
    } else if (config.isConstructor && isFunction(_module)) {
        return applyLogsForConstructor(_module, config)
    } else if (isFunction(_module)) {
        return applyLogsForFunction(_module, config)
    }

    return _module
}

const traceErrorsWith = log => {
    Error = new Proxy(Error, {
        construct(_Error, args) {
            const errorInstance = Reflect.construct(_Error, args)
            log(errorInstance)
            return errorInstance
        }
    })

    process.on('uncaughtException', log)
    process.on('uncaughtRejection', log)
}

const wrapRequire = (_require, globalConfig) => {
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
    clone,
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
    applyLogsForInstances,
    applyTraces,
    traceErrorsWith,
    wrapRequire
}
