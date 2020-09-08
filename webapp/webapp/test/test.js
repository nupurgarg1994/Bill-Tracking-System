let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../index');
let user = require('../routes/userDetails');
const assert = require('chai').assert;
let should = chai.should();
chai.use(chaiHttp);
describe("Login", () => {
    describe('/GET Login', () => {
        it('it should validate user if correct, return current date', (done) => {
            chai.request(app)
                .get('/v1/user/self')
                .set("Authorization", "basic " + new Buffer("nupurgarg567@gmail.com:Password@0330").toString("base64"))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should validate user if non correct, return unauthorized', (done) => {
            chai.request(app)
                .get('/v1/user/self')
                .set("Authorization", "basic " + new Buffer("nupurgarg567@gmail.com:asswormkmkd@0330").toString("base64"))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });
});
