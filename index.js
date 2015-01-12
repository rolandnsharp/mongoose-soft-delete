var mongoose = require('mongoose');
var schema = mongoose.schema;
var _ = require('lodash');
var hooks = require('hooks');

// the pre query hook was lifted from: https://github.com/LearnBoost/mongoose/issues/1252

for (var k in hooks) {
    mongoose.Model.prototype[k] = mongoose.Model[k] = hooks[k];
}

mongoose.Model.hook('query', function (query, cb) {
    console.log("calling internal callback after pre query hooks");
    cb();
});

mongoose.Query.prototype.exec = _.wrap(mongoose.Query.prototype.exec, function (exec) {
    // console.log("wrapped exec method executing..");
    var self = this;
    var args = arguments;
    this.model.prototype.query(this, function(){
        // console.log("working after pre query call back");
        return exec.apply(self, [].slice.call(args, 1));
    });
});

//add any other methods you want to have pre query access
_.each(['find', 'findOne', 'count'], function (method) {
    mongoose.Model[method] = _.wrap(mongoose.Model[method], function (fn) {
        var args = [].slice.call(arguments);
        // if callback exist convert that in to exec style execution and forward to exec wrapper
        // so that we can have access to query object
        if (_.isFunction(args[args.length - 1])) {
            var cb = args.pop();
            return fn.apply(this, [].slice.call(args, 1)).exec(cb);
        }
        // if just find execute it, because user will any way call exec at the end for results
        return fn.apply(this, [].slice.call(arguments, 1));
    });
});

module.exports = function(schema, options) {

    schema.add({
        deleted: Boolean,
        deletedAt: {
            type: Date
        }
    });

    // what is this first argument 'something' ?
    schema.pre('query', function(something, query, next) {
        query.where({ deleted: { '$ne': true } });
        next();
    });

    schema.pre('save', function(next, thing) {
        // console.log(this.constructor);
        if (!this.deleted) {
            this.deleted = false;
        }
        next();
    });

    schema.statics.hardRemove = function(one, two, three) {
        return this.collection.remove.apply(one, two, three);
    };

    schema.statics.remove = function(first, second) {
        var callback;
        var conditions;

        if(typeof first === 'function') {
            callback = first;
            conditions = {};
        } else {
            callback = second;
            conditions = {
                _id: first._id
            };
        }

        if (typeof callback !== 'function') {
            throw ('Wrong arguments!');
        }

        var update = {
            deleted: true,
            deletedAt: new Date()
        };

        this.update(conditions, update, function(err, numberAffected) {
            if (err) {
                return callback(err);
            }
            if (numberAffected === 0) {
                return callback('Wrong arguments!');
            }
            callback(null);

        });
    };

    // @TODO test methods
    // schema.methods.remove = function (first, second) {
    //     var callback = typeof first === 'function' ? first : second,
    //         deletedBy = second !== undefined ? first : null;

    //     if (typeof callback !== 'function') {
    //         throw ('Wrong arguments!');
    //     }

    //     this.deleted = true;
    //     this.deletedAt = new Date();

    //     this.save(callback);
    // };

};