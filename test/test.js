var expect = chai.expect;

describe("bar", function () {
  it("foo", function () {
    var foo = "bar";
    
    
    expect(foo).to.be.a('string');
    expect(foo).to.equal('bar');
    expect(foo).to.have.length(3);
  });
});

