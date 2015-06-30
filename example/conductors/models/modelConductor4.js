'use strict';

var rc = require('../../../lib');


// you can also create custom models that can do anything.
// just implement a get() method, which gives you a callback on completion.

var asyncModel = rc.createModel({
    name: 'asyncModel',
    get: function(cb) {
        setTimeout(function fakeAsync() {
            cb(null, {
                hello: 'world',
                async: true
            });
        }, 1000);
    }
});




module.exports = rc.createConductor({
    name: 'modelConductor4',
    models: [ asyncModel ],
    handlers: [
        [
            rc.handlers.buildModels(),
            function render(req, res, next) {
                var model = rc.getModels(req, 'asyncModel');

                // render the model data
                res.send(200, model.data);
                return next();
            }
        ]
    ]
});
