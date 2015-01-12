var request = require('supertest')(require('../app'));
var should = require('should');
var Test = require('../lib/model');
var fixtures = require('./lib/fixtures');
var mongoose = require('mongoose');

describe("Tests  ", function() {

    var test = fixtures.test.default;

    it("Should index.", function(done) {
        var url = '/';
        request.get(url)
            .expect('Content-Type', /json/)
            .expect(200, function(err, res) {
                should.not.exist(err);
                done();
            });

    });

    it("Should create the resource successfully", function(done) {
        var url = '/';
        request.post(url)
            .send(test)
            .expect('Content-Type', /json/)
            .expect(200, function(err, res) {
                should.not.exist(err);
                done();
            });
    });

});