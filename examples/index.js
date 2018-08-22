const applyLog = require('../')
const config = require('./logger.config')

applyLog(config)

const CustomNumber = require('./modules/CustomNumber')
const double = require('./modules/function')
const asyncDouble = require('./modules/asyncFunction')
const numberUtils = require('./modules/pojo')
const CustomString = require('./modules/CustomString')
const customString = require('./modules/instance')
const bCustomString = new CustomString('B')

const main = async () => {
    const customNumber = new CustomNumber(2)

    const examples = {
        a : double(2),
        b : await asyncDouble(2),
        c : await CustomNumber.asyncDouble(2),
        d : await customNumber.asyncDoubleInstance(),
        e : await numberUtils.asyncDouble(2),
        f : await customString.asyncDoubleInstance(),
        // np apply logs for:
        g : await bCustomString.asyncDoubleInstance()
    }

    return examples
}

main().then(console.log)
