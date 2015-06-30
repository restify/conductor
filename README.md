# restify-conductor

<!-- [![NPM Version](https://img.shields.io/npm/v/errors.svg)](https://npmjs.org/package/errors) -->
[![Build Status](https://travis-ci.org/restify/conductor.svg?branch=master)](https://travis-ci.org/restify/conductor)
[![Coverage Status](https://coveralls.io/repos/restify/conductor/badge.svg?branch=master)](https://coveralls.io/r/restify/conductor?branch=master)
[![Dependency Status](https://david-dm.org/restify/conductor.svg)](https://david-dm.org/restify/conductor)
[![devDependency Status](https://david-dm.org/restify/conductor/dev-status.svg)](https://david-dm.org/restify/conductor#info=devDependencies)
[![bitHound Score](https://www.bithound.io/github/restify/conductor/badges/score.svg)](https://www.bithound.io/github/restify/conductor/master)

> an abstraction framework for building composable endpoints in restify


## Getting Started

Install the module with: `npm install restify-conductor`


## Why?

Restify, like other Node.js frameworks, provides built in support for
[Connect](https://github.com/senchalabs/connect) style handlers. This simple
yet elegant solution works well for many scenarios. But sometimes, as
complexity in your application grows, it can become increasingly difficult to
share and manage. This module alleviates those pain points by providing a
`Conductor` construct, which serves as an orchestration layer on top of your
handler stack, as well as providing some nice built-in support for fetching
remote resources. This construct also allows easing "moving" of an entire page
from one URL to another, which can be otherwise non-trivial.

The top 5 reasons for using restify-conductor:

* You want to decouple an endpoint's logic from the URL it is installed to.
* You want to easily move a page from one URL to another.
* Your site is large and complex with many pages sharing similar context and
  handler stacks.
* You have long (15, 20+) handler stacks, and when the handler stacks change,
  you want to be able to change it at only one place.
* You want to be able to reuse existing stacks, but customize their behavior as
  needed on a per URL basis instead of having to rewrite the entire handler but
  with one line slightly different.
* You want to be able to serve two completely different responses to the same
  URL, based on user state (e.g., home page for logged in vs logged out),
  __without__ redirecting.


## Basic Usage

### Handlers

Assuming you have a Restify server, you can install `Conductor` objects at a
given endpoint:

```js
var restify = require('restify');
var rc = require('restify-conductor');

var server = restify.createServer();

var simpleConductor = rc.createConductor({
    name: 'simpleConductor',
    handlers: [
        function render(req, res, next) {
            res.send(200, 'hello world!');
            return next();
        }
    ]
});

rc.get('/foo', simpleConductor, server);
```

This conductor has only one handler, a render function that renders 'hello
world!' to the client. Like other frameworks, you can pass in multiple handlers
which will run in serial.


### Props

We can extend this conductor object with the concept of `props`, or immuatable
properties. Simply pass in a function to the `createConductor` method, and it
will be invoked at creation time. The object returned by the props function is
immutable over the lifetime of the server. You can access these props from your
handlers:


```js

var propsConductor = rc.createConductor({
    name: 'propsConductor',
    props: function() {
        return {
            blacklistQueries: ['foo']
        };
    },
    handlers: [
        function validateQuery(req, res, next) {
            // retrieve props via helper.
            var blacklist = rc.getProps(req, 'blacklistQueries');

            // check if the search query is in the allowed list
            var query = req.query.search;
            if (blacklist.indexOf(query) === -1) {
                // if it is, return a 500
                return next(new restify.errors.InternalServerError('blacklisted query!'));
            }

            // otherwise, we're good!
            return next();
        },
        function render(req, res, next) {
            // respond with the valid query
            res.render(req.query);
        }
    ]
});

rc.get('/props', propsConductor, server);
```

Looking at this example, we _could_ just hard code the value of blacklistQueries
into the handler. But using props allows us to easily share this handler across
other conductors that may have different values for the blacklist.


### Models

restify-conductor also comes with first class support for the concept of
models. Models are sources of data needed by your conductor. The source of the
model data can be anything. It can be the request (e.g., user agent parsing),
or a data store of some kind (Redis, mySQL), or even a remote data source.

The Model construct provides a lifecycle of methods available to you to act on the data.

* `before` {Function} - a function invoked before the request for your data
  source is made
* `isValid` {Function} - a function invoked to ensure validity of your payload
* `after` {Function} - a function invoked after the isValid check to do
  additional manipulation or storage of your data
* `fallback` {Function} - a function that allows you to set model data in the
  event the request fails


Creating models is easy:

```js
// a model whose data source is the request
var userAgent = rc.createModel({
    name: 'userAgent',
    data: req.headers['user-agent']
});


// a model whose data source is coming from a remote location
var ipModel = rc.createModel({
    name: 'ip',
    host: 'jsonip.com',
    isValid: function(data) {
        // validate the payload coming back, it should have two fields.
        return (data.hasOwnProperty('ip') && data.hasOwnProperty('about'));
    }
});
```

You can then consume them in your conductor. The default behavior is to fetch all
models specified in the models config in parallel:


```js
var modelConductor = new Conductor({
    name: 'modelConductor',
    models: [ userAgent, ip ],
    handlers: [
        rc.handlers.buildModels(), // fetch models in parallel
        function render(req, res, next) {
            // now we can access the models
            var uaModel = rc.getModel(req, 'userAgent'),
                ipModel = rc.getModel(req, 'ip');

            // put together a payload.
            var out = {
                userAgentModel: uaModel.data,
                ipModel: ipModel.data
            };

            res.render(out, next);
        }
    ]
});
```

It is also possible to fetch multiple models in serial, if you have models
dependent on the output of another async model. To do so, you can pass an object
into models instead, with each key of the object specifying an array of models.
This allows you to address each 'bucket' of models using the key:


```js
var seriesModelConductor = rc.createConductor({
    name: 'seriesModelConductor',
    models: {
        bucketA: [ ip, userAgent ],
        bucketB: [ date ]
    },
    handlers: [
        rc.handlers.buildModels('bucketA'), // fetch bucketA models in parallel
        function check(req, res, next) {
            var ipModel = rc.getModels(req, 'ip');
            var uaModel = rc.getModels(req, 'userAgent');

            // the ip and user agent models are done!
            assert.ok(ipModel);
            assert.ok(uaModel);

            return next();
        },
        rc.handlers.buildModels('bucketB'),  // then, fetch bucketB in parallel
        function render(req, res, next) {
            var allModels = rc.getModels(req);

            // make sure we got three models
            assert.equal(_.size(allModels), 3);
        }
    ]
});

```


### Inheritance/Composition

Conductors can also be inherited from. Inheriting from another conductor
automatically gives you the same props and handlers as the parent conductor.
Props can be mutated by the inheriting conductor, but handlers cannot. However,
handlers can be appended and prepended to. Let's look at props first.

```js
// here is our parent conductor
var parentConductor = rc.createConductor({
    name: 'parent',
    props: function() {
        return {
            count: 0,
            candies: [ 'twix', 'snickers', 'kit kat' ]
        };
    }
});

// now we inherit by specifying a deps config
var childConductor = rc.createConductor({
    name: 'child',
    deps: [ parentConductor ],
    props: function(inheritedProps) {
        // children conductor are provided with the parent props.
        // you can choose to mutate this object for the child conductor.

        // note that mutating inheritedProps does NOT affect the parent
        // conductor's props!
        inheritedProps.count += 1;
        inheritedProps.candies = inheritedProps.candies.concat('butterfinger');

        // like the parent conductor, this returned value will become immutable
        return inheritedProps;
    },
    handlers: [
        function render(req, res, next) {
            var props = rc.getProps(req);

            res.render(props, next);
            // => will render:
            // {
            //      count: 1,
            //      candies: [ 'twix', 'snickers', 'kit kat', 'butterfinger' ]
            // }
        }
    ]
});
```

Handlers can also be inherited, and appended to:

```js
var parentConductor = rc.createConductor({
    name: 'parent',
    handlers: [ addName ]
});

var childConductor = rc.createConductor({
    name: 'child',
    deps: [ parentConductor ],
    handlers: [ render ]
});

// => resulting handler stack:
// [ addName, render ]
```

It is possible to prepend and insert handlers arbitrarily into the handler
stack, by using the concept of handler 'blocks'. By changing handlers to an
array of arrays, we can implicitly specify ordering of different handler stacks
when doing inheritance:


```js
var parentConductor = rc.createConductor({
    name: 'parent',
    handlers: [
        [],
        addName
    ]
});

var childConductor = rc.createConductor({
    name: 'child',
    deps: [ parentConductor ],
    handlers: [
        addRequestId,
        [],
        render
    ]
});

// => resulting handler stack:
// [ addRequestId, addName, render ]

```

However, using the array index as an implicit ordering mechanism can be a bit
confusing, so it is recommended to use an object with numerical keys. Using
numerical keys also makes it easy to insert handlers inbetween existing
'blocks'. Note that duplicated keys are appended to:


```js
var parentConductor = rc.createConductor({
    name: 'parent',
    handlers: {
        10: [ addName ]
    }
});

var childConductor = rc.createConductor({
    name: 'child',
    deps: [ parentConductor ],
    handlers: {
        5:  [ addRequestId ],
        10: [ addTimestamp ],
        15: [ render ]
    }
});


// => the merged handlers:
// {
//      5:  [ addRequestId ],
//      10: [ addName, addTimestamp ],
//      15: [ render ]
//
// }

// => and the resulting execution order of the handler stack:
// [ addRequestId, addName, addTimestamp, render ]

```


## Composition

Because `deps` is an array, you can also opt for flatter trees using more
compositional conductors:

```js
var compositionConductor = new Conductor({
    name: 'compositionConductor',
    deps: [ baseCondcutor, anotherConductor, yetAnotherConductor ]
});
```

Using a compositional pattern may make easier to see at a glance what the
handler stacks look like, with the trade off of being slightly less DRY. It will
be up to you to determine what works best for your application.

In any case, both these inheritance and composition pattern allow for some very
powerful constructs. It also allows you to easily move conductors from one URL
path to another completely transparently.


## Conductor Sharding

You may sometimes want to render a different page under the same URL. A great
example is the root URL, '/'. If the user is logged in, you want to be able to
serve a logged in experience. If the user is logged out, you want to serve them
a login page. However, the URL needs to stay the same in both cases.

restify-constructor provides this capability through sharding. Consider the two
pages above, let's mount the logged in experience at /home, and the logged out
experience at /login:

```js
rc.get('/home', homeConductor);
rc.get('/login', loginConductor);

// how do we handle this scenario?
// rc.get('/', ?)
```

With shards, you can reuse existing conductors by simply "sharding" to them:

```js
var shardConductor = rc.createConductor({
    name: 'shardConductor',
    models: [ userInfo ],
    handlers: {
        10: [
            rc.buildModels()
        ],
        20: [
            function shard(req, res, next) {
                // fetch the userInfo model we just built.
                var userModel = rc.getModels(req, 'userInfo');

                if (userModel.data.isLoggedIn === true) {
                    rc.shardConductor(req, homeConductor);
                } else {
                    rc.shardConductor(req, loginConductor);
                }

                return next();
            }
        ]
    }
})

rc.get('/', shardConductor);
```

Note that in this example we sharded the conductor at index 20. That means the
request will continue to flow through the handler stacks defined at
homeConductor and loginConductor starting from the next index _higher_ than 20.
In other words, __if homeConductor or loginConductor have handlers defined at
any indicies lower than 20, they will NOT be run__. They will only be run in
the non sharded scenario, where the user directly hits /home or /login.

One of the main advantages of sharding is that there is no redirect. You can
serve the desired experience directly within the same request, by simply
reusing existing conductors.


## API

_(Coming soon)_


## Contributing

Add unit tests for any new or changed functionality. Ensure that ESLint passes.

To start contributing, install the git pre-push hooks:

```sh
npm run githook
```

Before committing, run the prepush hook:

```sh
npm run prepush
```

## License

Copyright (c) 2015 Netflix, Inc.

Licensed under the MIT license.
