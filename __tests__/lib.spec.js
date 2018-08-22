const R = require('ramda')
const lib = require('../lib')
const isObject = x => typeof x === 'object' && x !== null

describe('Lib internal test', () => {
    [null, undefined, {}, ['Array'], 5].forEach(param => {
        test(`.tap should return function with '${
            isObject(param) ? JSON.stringify(param) : param
        }' input`, done => {
            const applyDone = lib.tap(() => setTimeout(done, 20))
            expect(applyDone).toBeInstanceOf(Function)
            const data = applyDone(param)
            expect(data).toEqual(param)
        })
    })

    test('.clone should clone objects', () => {
        const obj = {
            a : 'a',
            b : R.identity,
            c : []
        }

        expect(lib.clone(null)).toEqual(null)
        expect(lib.clone(obj)).toEqual(obj)
    })

    test('.isFunction should return a boolean', () => {
        expect(lib.isFunction(() => {})).toEqual(true)
        expect(lib.isFunction(function() {})).toEqual(true)
        expect(lib.isFunction({})).toEqual(false)
        expect(lib.isFunction([])).toEqual(false)
    })

    test('.isObject should return a boolean', () => {
        expect(lib.isObject({})).toEqual(true)
        expect(lib.isObject(() => {})).toEqual(false)
        expect(lib.isObject(function() {})).toEqual(false)
    })

    test('.isInstance should return a true with objects different to {}', () => {
        const X = function() {
            this.x = 'x'
        }

        class Y {
            constructor() {
                this.y = 'y'
            }
        }

        expect(lib.isInstance({})).toEqual(false)
        expect(lib.isInstance([])).toEqual(true)
        expect(lib.isInstance(new X())).toEqual(true)
        expect(lib.isInstance(new Y())).toEqual(true)
    })

    test('.getModulesToTrace should return a WeakMap', () => {
        const _module = {}
        const modules = lib.getModulesToTrace([
            {
                module : _module,
                a      : true,
                b      : false
            }
        ])
        const config = modules.get(_module)

        expect(config).toEqual({
            a : true,
            b : false
        })
    })

    test('.doLog should make and object and log', () => {
        const keys = ['function', 'tag']
        const timeKeys = ['start', 'end', 'executionTime']
        const ioKeys = ['input', 'output']

        const log1 = lib.doLog({
            fnName : 'fn',
            start  : Date.now(),
            input  : 'foo',
            output : 'baz',
            config : {
                io     : true,
                time   : true,
                tag    : 'some.tag',
                logger : R.identity
            }
        })

        keys.concat(timeKeys, ioKeys).forEach(k =>
            expect(log1).toHaveProperty(k)
        )

        const log2 = lib.doLog({
            fnName : 'fn',
            start  : Date.now(),
            input  : 'foo',
            output : 'baz',
            config : {
                io     : false,
                time   : true,
                tag    : 'some.tag',
                logger : R.identity
            }
        })

        keys.concat(timeKeys).forEach(k => expect(log2).toHaveProperty(k))

        const log3 = lib.doLog({
            fnName : 'fn',
            start  : Date.now(),
            input  : 'foo',
            output : 'baz',
            config : {
                io     : true,
                time   : false,
                tag    : 'some.tag',
                logger : R.identity
            }
        })

        keys.concat(ioKeys).forEach(k => expect(log3).toHaveProperty(k))

        const log4 = lib.doLog({
            fnName : 'fn',
            start  : Date.now(),
            input  : 'foo',
            output : 'baz',
            config : {
                io     : false,
                time   : false,
                tag    : 'some.tag',
                logger : R.identity
            }
        })

        keys.forEach(k => expect(log4).toHaveProperty(k))
        ioKeys.concat(timeKeys).forEach(k => expect(log4).not.toHaveProperty(k))

        const log5 = lib.doLog({
            fnName : 'fn',
            start  : Date.now(),
            input  : 'foo',
            output : 'baz',
            config : {
                io     : false,
                time   : false,
                tag    : 'some.tag',
                logger : false
            }
        })

        expect(log5).toEqual(undefined)
    })

    test('.selectLogger should select config logger or global logger', () => {
        const globalLogger = () => {}
        const configs = [{ logger : R.identity }, { logger : false }, {}]
        const result = configs.map(lib.selectLogger(globalLogger))
        expect(result[0].logger).toEqual(R.identity)
        expect(result[1].logger).toEqual(globalLogger)
        expect(result[2].logger).toEqual(globalLogger)
    })

    test('.applyLogsForFunction should apply log and execute fn without context', done => {
        const double = x => x * 2
        const config = {
            io     : true,
            time   : true,
            logger : log => {
                expect(log.output).toEqual(4)
                expect(log.function).toEqual('double')
                setTimeout(done, 20)
            }
        }

        const fn = lib.applyLogsForFunction(double, config)
        expect(fn).toBeInstanceOf(Function)
        const result = fn(2)
        expect(result).toEqual(4)
    })

    test('.applyLogsForFunction should apply log and execute fn with context', done => {
        const context = {
            two : 2,
            double(x) {
                return x * this.two
            }
        }
        const config = {
            io     : true,
            time   : true,
            logger : log => {
                expect(log.output).toEqual(4)
                expect(log.function).toEqual('double')
                setTimeout(done, 20)
            }
        }

        context.double = lib.applyLogsForFunction(context.double, config)

        expect(context.double).toBeInstanceOf(Function)
        const result = context.double(2)
        expect(result).toEqual(4)
    })

    test('.traceErrorsWith should trace new Error()', done => {
        const EXPECTED_MESSAGE = 'some message'
        let times = 0

        lib.traceErrorsWith(e => {
            expect(e).toBeInstanceOf(Error)
            if (++times === 5) {
                done()
            }
        })

        new Error(EXPECTED_MESSAGE)
        process.emit('uncaughtException', new Error(EXPECTED_MESSAGE))
        process.emit('uncaughtRejection', new Error(EXPECTED_MESSAGE))
    })

    test('.applyLogsForObject should apply log for each function in object without context', () => {
        const obj = {
            prop   : 'foo',
            double : x => x * 2,
            plus   : x => x + 1
        }

        const config = {
            io   : true,
            time : true
        }

        config.logger = log => {
            expect(log.output).toEqual(4)
            expect(log.function).toEqual('double')
        }

        const objTraced = lib.applyLogsForObject(obj, config)
        expect(objTraced).toHaveProperty('prop')

        objTraced.double(2)

        config.logger = log => {
            expect(log.output).toEqual(2)
            expect(log.function).toEqual('plus')
        }

        objTraced.plus(1)
    })

    test('.applyLogsForObject should apply log for each function in object with context', () => {
        const obj = {
            TWO    : 2,
            double : function(x) {
                return x * this.TWO
            },
            ONE  : 1,
            plus : function(x) {
                return x + this.ONE
            }
        }

        const config = {
            io   : true,
            time : true
        }

        config.logger = log => {
            expect(log.output).toEqual(4)
            expect(log.function).toEqual('double')
        }

        const objTraced = lib.applyLogsForObject(obj, config)

        expect(objTraced).toHaveProperty('ONE')
        expect(objTraced).toHaveProperty('TWO')

        objTraced.double(2)

        config.logger = log => {
            expect(log.output).toEqual(2)
            expect(log.function).toEqual('plus')
        }

        objTraced.plus(1)
    })

    test('.applyLogsForConstructor should apply logs for static methods and prototype methods', done => {
        class Test {
            constructor(x) {
                this.two = x
            }

            static double(x) {
                return x * 2
            }

            double(x) {
                return x * this.two
            }
        }

        const config = {
            io            : true,
            time          : true,
            isConstructor : true
        }

        let times = 0

        config.logger = log => {
            expect(log.output).toEqual(4)
            expect(log.function).toEqual('double')
            if (++times === 2) {
                done()
            }
        }

        lib.applyLogsForConstructor(Test, config)

        expect(Test).toEqual(Test)
        Test.double(2)
        const test = new Test(2)
        test.double(2)
    })

    test('.applyLogsForInstances should apply logs for instances without modifying the class', done => {
        class Test {
            constructor() {
                this.two = 2
            }

            static double(x) {
                return x * 2
            }

            double(x) {
                return x * this.two
            }
        }

        let times = 0

        const config = {
            io     : true,
            time   : true,
            logger : log => {
                expect(log.output).toEqual(6)
                if (++times === 2) {
                    setTimeout(done, 20)
                }
            }
        }

        const instance = new Test()
        const instanceWithLogs = lib.applyLogsForInstances(instance, config)
        expect(instanceWithLogs).toEqual(instance)
        const otherInstance = new Test()
        expect(otherInstance.double(1)).toEqual(2)
        times++
        expect(instanceWithLogs.double(3)).toEqual(6)
    })

    test('.applyTraces should apply logs for sync function', done => {
        const double = x => x * 2

        const doubleWithLogs = lib.applyTraces(double, {
            io   : true,
            time : true,
            logger(log) {
                expect(log.function).toEqual('double')
                expect(log.output).toEqual(8)
                setTimeout(done, 20)
            }
        })

        const result = doubleWithLogs(4)
        expect(result).toEqual(8)
    })

    test('.applyTraces should apply logs for async function', async done => {
        const double = x => Promise.resolve(x * 2)

        const doubleWithLogs = lib.applyTraces(double, {
            io   : true,
            time : true,
            logger(log) {
                expect(log.function).toEqual('double')
                expect(log.output).toEqual(2)
                setTimeout(done, 20)
            }
        })

        const result = await doubleWithLogs(1)
        expect(result).toEqual(2)
    })

    test('.applyTraces should apply logs for constructors and instances', async done => {
        class Test {
            constructor() {
                this.two = 2
            }

            static double(x) {
                return x * 2
            }

            double(x) {
                return x * this.two
            }

            async asyncDouble(x) {
                return Promise.resolve(this.double(x))
            }
        }

        const instanceBeforeApplyLogs = new Test()

        let times = 0
        const TestWitLogs = lib.applyTraces(Test, {
            io            : true,
            time          : true,
            isConstructor : true,
            logger(log) {
                expect(log.output).toEqual(2)
                if (++times === 4) {
                    setTimeout(done, 20)
                }
            }
        })

        expect(TestWitLogs).toEqual(Test)
        const instance = new Test()

        const result = instanceBeforeApplyLogs.double(1)
        const staticResult = Test.double(1)
        const instanceResult = instance.double(1)
        const asyncResult = await instance.asyncDouble(1)
        expect(result).toEqual(2)
        expect(staticResult).toEqual(2)
        expect(instanceResult).toEqual(2)
        expect(asyncResult).toEqual(2)
    })

    test('.applyTraces should ignore primitive data types', () => {
        const config = {
            io            : true,
            time          : true,
            isConstructor : true,
            logger        : R.identity
        }

        expect(lib.applyTraces(4, config)).toEqual(4)
        expect(lib.applyTraces('data', config)).toEqual('data')
        expect(lib.applyTraces(true, config)).toEqual(true)
        expect(lib.applyTraces(null, config)).toEqual(null)
        expect(lib.applyTraces(undefined, config)).toEqual(undefined)
    })

    test('.applyTraces should apply logs for POJOs', done => {
        const config = {
            io     : true,
            time   : true,
            logger : log => {
                expect(log.output).toEqual(4)
                setTimeout(done, 20)
            }
        }

        const obj = { double : x => x * 2 }
        const objWithLogs = lib.applyTraces(obj, config)
        expect(obj).toEqual(objWithLogs)
        const result = objWithLogs.double(2)
        expect(result).toEqual(4)
    })

    test('.applyTraces should apply logs for instances without modifying the class', done => {
        class Test {
            constructor() {
                this.two = 2
            }

            static double(x) {
                return x * 2
            }

            double(x) {
                return x * this.two
            }
        }

        let times = 0

        const config = {
            io     : true,
            time   : true,
            logger : log => {
                expect(log.output).toEqual(6)
                if (++times === 2) {
                    setTimeout(done, 20)
                }
            }
        }

        const instance = new Test()
        const instanceWithLogs = lib.applyTraces(instance, config)
        expect(instanceWithLogs).toEqual(instance)
        const otherInstance = new Test()
        expect(otherInstance.double(1)).toEqual(2)
        times++
        expect(instanceWithLogs.double(3)).toEqual(6)
    })

    test('.wrapRequire should return a function to apply logs for require implementation,', done => {
        const _module = {
            double : x => x * 2
        }

        const _require = path => _module

        const config = {
            logger : log => {
                expect(log.output).toEqual(20)
                setTimeout(done, 20)
            },
            logErrors : false,
            modules   : [
                {
                    io     : true,
                    time   : true,
                    module : _module
                }
            ]
        }

        const requireWrapped = lib.wrapRequire(_require, config)
        const moduleWrapped = requireWrapped('./some/path')

        expect(moduleWrapped.double(10)).toEqual(20)
    })

    test('.wrapRequire should return a function to apply logs for require implementation with specific logger,', done => {
        const _module = {
            double : x => x * 2
        }

        const _require = path => _module

        const config = {
            logger    : R.identity,
            logErrors : false,
            modules   : [
                {
                    io     : true,
                    time   : true,
                    module : _module,
                    logger : log => {
                        expect(log.output).toEqual(40)
                        setTimeout(done, 20)
                    }
                }
            ]
        }

        const requireWrapped = lib.wrapRequire(_require, config)
        const moduleWrapped = requireWrapped('./some/path')

        expect(moduleWrapped.double(20)).toEqual(40)
    })

    test('.wrapRequire should return a function to ignore not config modules,', () => {
        const moduleForWrap = {
            double : x => x * 2
        }

        const moduleWithoutLogs = {
            double : x => x * 2
        }

        const _require = path =>
            ({
                withLogs    : moduleForWrap,
                withoutLogs : moduleWithoutLogs
            }[path])

        const config = {
            logger    : R.identity,
            logErrors : false,
            modules   : [
                {
                    io     : true,
                    time   : true,
                    module : moduleForWrap
                }
            ]
        }

        const requireWrapped = lib.wrapRequire(_require, config)
        expect(requireWrapped('withoutLogs')).toEqual(moduleWithoutLogs)
    })
})
