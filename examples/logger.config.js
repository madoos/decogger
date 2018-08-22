module.exports = {
    logger    : log => console.log('global log', log), // global logger
    logErrors : e => console.log('SPECIFIC LOG FOR ERRORS', e), // if is true use default global logger
    modules   : [
        {
            module : require('./modules/asyncFunction'),
            tag    : 'module.asyncFunction',
            io     : true,
            time   : true,
            logger : log => console.log('specific log for async function', log)
        },
        {
            module        : require('./modules/CustomNumber'),
            tag           : 'module.CustomNumber',
            io            : true,
            time          : true,
            isConstructor : true
        },
        {
            module : require('./modules/function'),
            tag    : 'module.function',
            io     : true,
            time   : true
        },
        {
            module : require('./modules/pojo'),
            tag    : 'module.pojo',
            io     : true,
            time   : true,
            logger : log => console.log('specific log for POJOs', log)
        },

        {
            module : require('./modules/instance'),
            tag    : 'module.instance.of.CustomString',
            io     : true,
            time   : true,
            logger : log =>
                console.log('specific log instance of CustomString', log)
        },

        {
            module : require('./modules/deepModule'),
            tag    : 'module.deep.module.async.double',
            io     : true,
            time   : true,
            logger : log =>
                console.log('specific log for deep async double', log)
        }
    ]
}
