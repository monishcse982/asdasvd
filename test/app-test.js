import { should, use, request } from "chai";
import chaiHttp from "chai-http";

import app from "../app.js";

should();
use(chaiHttp);

/* Test the /GET route */
describe("app index route", () => {
  it("it should GET /", (done) => {
    request(app)
      .get("/")
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it("it should handle 404 error", (done) => {
    request(app)
      .get("/notExist")
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
