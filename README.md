# decogger

Centralizes the tracking of logs in a single point.

- [Motivation](#motivation)
- [Install](#install)
- [Features](#features)
- [How does it work](#how-does-it-work)
- [Configuration](#configuration-options)
- [Log structure](#log-structure)

## Motivation

Normally when we have to get logs to report the status of the applications we have to mess up many functions adding code logs.

That makes it more difficult to test and change the dependency of the logger because we have to look for it manually in all the code.

```javascript
// in user.js

const logger = require("some-logger")
const DB = require("./DB")

const byId = async id => {
  logger.info(`Getting user with id: ${id}`)
  const user = await DB.User.find({ id })
  logger.info(`obtained user: ${user.name}`)
  return user
}

module.exports = {
  byId
}
```

```javascript
// in main.js

const user = require("./src/user")
const someUser = await user.byId(1) // get logs
```

It could be interesting to have the logs of decoupled functions and inputs of the code

```javascript
// in user.js

const DB = require("./DB")

const byId = async id => {
  const user = await DB.User.find({ id })
  return user
}

module.exports = {
  byId
}
```

```javascript
// in main.js

const decogger = require("decogger")
const config = require("./logger.config.js")
decogger(config) // apply logs for modules in configuration

const user = require("./src/user")
const someUser = await user.byId(1)

/*
when the method is executed, a log is automatically obtained in a single point previously defined

{ 
  function: 'byId',
  tag: 'src.user',
  start: 1534967702289,
  end: 1534967702289,
  executionTime: 234,
  input: [ 1 ],
  output: {
      id: 1
      name: Sara,
      email: sara@email.com,
  }
}

*/
```

```javascript
// logger.config.js

const logger = require("some-logger")

module.exports = {
  logger: log => logger.info(log),
  modules: [
    {
      module: require("./src/user"),
      tag: "src.user",
      io: true,
      time: true
    }
  ]
}
```

## Install

To install:

    npm i -S decogger

## Features

- [Define a global logger](#define-a-global-logger)
- [Define a specific logger for each module](#define-a-specific-logger-for-each-module)
- [Tracking all errors and unhandled errors](#tracking-all-errors-and-unhandled-errors)
- [Tracking constructors and instances](#tracking-constructors-and-instances)
- [Tracking instances](#configuration-options)
- [Gets execution time](#configuration-options)
- [Get input and output of the methods](#configuration-options)

## How does it work

- If the module is a function the function is doctorate with the log configuration
- If the module is an object(POJOs) or class instance all properties that are functions are decorated
- If the module is a constructor function all the static methods and all the props that are functions in each instance are decorated
- if the module is a primitive data type it does not do anything

## Configuration options

```javascript
module.exports = {
  logger: console.log // function to define the global logger
  logErrors: console.error // define the function to log errors and unhandled errors, if is true it will use the global logger
  modules: [
    // each module log definition
      {
        module: require('some-module'), // the module to apply logs
        logger: (log) => console.log('specific logger', log) // define the specific logger of this module
        tag: 'some-module', // tag to show in the log
        isConstructor: false // define the logs for the static methods of the class and each of its instances
        io: true, // Defines if the input parameters and the returned value for the method are shown in the log
        time: true, // define if the execution time of a method is shown
        omit: ['_privateMethod'] // if the module is an object, it defines which methods do not apply the logs. It can be an array or a predicate
    },
    {
      // this module will use the global logger
        module: require('other-module'),
        tag: 'other-module', // tag to show in the log
        isConstructor: true
        io: true,
        time: true,
        omit: (methodName, method, obj) => (
                    methodName.includes('_') &&
                    typeof method === 'function' &&
                    typeof obj === 'object'
                ) // using a predicate
    }
  ]
}
```

## Log structure

```javascript
{
  function: 'double', // the name of function executed
  tag: 'module.function', // te tag defined by "tag" config
  start: 1534973718974, // time in milliseconds of start method execution, defined by 'time' config
  end: 1534973718978, // time in milliseconds of end method execution, defined by 'time' config
  executionTime: 16, // time in milliseconds of method execution time , defined by 'time' config
  input: [ 2 ], // arguments of the call to the method, defined by 'io' config
  output: 4 // result of the call to the method, defined by 'io' config
}
```

## Define a global logger

```javascript
// the global logger will be used for all modules that do not contain their specific logger.

module.exports = {
  logger: log => console.log("Global logger", log) // global logger
  modules: [{
      module: require('some-module'),
      tag: 'some-module',
      io: true,
      time: true
  }]
}
```

```javascript
// if the global logger is different to a function, and there are no specific loggers defined no action is executed

module.exports = {
  logger: false // global logger
  modules: [{
      module: require('some-module'),
      tag: 'some-module',
      io: true,
      time: true
  }]
}
```

## Define a specific logger for each module

```javascript
// the specific logger will be used for the module. If logger is not defined, use the global logger
.

module.exports = {
  logger: log => console.log("Global logger", log) // global logger
  modules: [{
      module: require('some-module'), // will use the global logger
      tag: 'some-module'
      io: true,
      time: true
  },
  {
      module: require('other-module'),
      tag: 'other-module'
      io: true,
      time: true,
      logger: (log) => console.log('specific logger for other-module', log) // will use the specific logger

  }]
}
```

```javascript
// if the specific logger is different to a function, and dont have global loggers defined does not execute any action

module.exports = {
  logger: false // global logger
  modules: [{
      module: require('some-module'),
      tag: 'some-module',
      io: true,
      time: true,
      logger: false // specific logger
  }]
}
```

## Tracking all errors and unhandled errors

```javascript
// Will capture all new errors or unhandled errors with the global logger

module.exports = {
  logger: log => console.log(log), // global logger
  logErrors: true, // activate error capture
  modules: [
    {
      module: require("some-module"),
      tag: "some-module",
      io: true,
      time: true
    }
  ]
}
```

```javascript
// in main.js

const decogger = require("decogger")
const config = require("./logger.config.js")
decogger(config) // apply logs for modules in configuration

new Error("some message")

/*
global logger capture the error or events uncaughtException and uncaughtRejection

    Error: some message
    at Object.construct (/git/core/logger/lib/index.js:136:43)
    at main (/git/core/logger/examples/index.js:30:17)
    at <anonymous>
*/
```

```javascript
// logErrors can be a specific function to log errors

module.exports = {
  logger: log => console.log(log), // global logger
  logErrors: e => console.error(e), // will be used to log errors
  modules: [
    {
      module: require("some-module"),
      tag: "some-module",
      io: true,
      time: true
    }
  ]
}
```

## Tracking constructors and instances

```javascript
// in CustomNumber.js
module.exports = class CustomNumber {
  constructor(n) {
    this.value = n
  }

  double() {
    return this.value * 2
  }

  static asyncDouble(n) {
    return Promise.resolve(n * 2)
  }
}
```

```javascript
module.exports = {
  logger: log => console.log(log),
  modules: [
    {
      module: require("./CustomNumber"),
      tag: "CustomNumber",
      io: true,
      time: true,
      isConstructor: true // enable the logs for the static methods and all the instances of the class
    }
  ]
}
```

```javascript
// in main.js

const decogger = require("decogger")
const config = require("./logger.config.js")
decogger(config)

const CustomNumber = require("./CustomNumber")
const five = new CustomNumber(5)

five.double() // apply logs
await CustomNumber.asyncDouble(5) // apply logs
```
