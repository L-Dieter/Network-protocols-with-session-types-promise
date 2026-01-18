import assert from "assert";
import { checkPayload } from "../../check/checkPayload";

// test the checkPayload() function for different inputs and types 
describe("checkPayload()", function () {
    describe("#case false (wrong input)", function () {
        it("should be different from { type: 'string' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "string" }), false);
        });
        it("should be different from { type: 'number' }", function () {
            assert.equal(checkPayload(JSON.parse('"test"'), { type: "number" }), false);
        });
        it("should be different from { type: 'bool' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "bool" }), false);
        });
        it("should be different from { type: 'null' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "null" }), false);
        });
        it("should be different from { type: 'union', components: [{ type: 'null' }] }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "union", components: [{ type: "null" }] }), false);
        });
        it("should be different from { type: 'record' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "record", payload: { "number": { type: "number" }, "string": { type: "string" } } }), false);
        });
        it("should be called without def { type: 'ref' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "ref", name: 'test2' }), false);
        });
        it("should be different from { type: 'tuple' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "tuple", payload: [{ type: "number" }, { type: "ref", name: 'test2' }]}), false);
        });
        it("should be different from { type: 'union' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "union", components: [{ type: "number" }, { type: "ref", name: 'test2' }]}), false);
        });
        it("should be the same name as an existing def { type: 'def' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "def", name: 'test', payload: { type: "def", name: 'test', payload: { type: "any" } }}), false);
        });
        it("should be different from { type: 'array', payload: { type: 'string' } }", function () {
            assert.equal(checkPayload(JSON.parse("[1]"), { type: "array", payload: { type: "string" } }), false);
        });
    });
    describe("#case true (right input)", function () {
        it("should be of type { type: 'string' }", function () {
            assert.equal(checkPayload(JSON.parse('"ok"'), { type: "string" }), true);
        });
        it("should be of type { type: 'number' }", function () {
            assert.equal(checkPayload(JSON.parse("1"), { type: "number" }), true);
        });
        it("should be of type { type: 'any' }", function () {
            assert.equal(checkPayload(JSON.parse("true"), { type: "any" }), true);
        });
        it("should be of type { type: 'bool' }", function () {
            assert.equal(checkPayload(JSON.parse("true"), { type: "bool" }), true);
        });
        it("should be of type { type: 'null' }", function () {
            assert.equal(checkPayload(JSON.parse("null"), { type: "null" }), true);
        });
        it("should be of one type given by { type: 'union', components: [{ type: 'number' }, { type: 'bool' }, { type: 'string' }] }", function () {
            // first component
            assert.equal(checkPayload(JSON.parse("1"), { type: "union", components: [{ type: "number" }, { type: "bool" }, { type: "string" }] }), true);
            // second component
            assert.equal(checkPayload(JSON.parse("true"), { type: "union", components: [{ type: "number" }, { type: "bool" }, { type: "string" }] }), true);
            // third component
            assert.equal(checkPayload(JSON.parse('"ok"'), { type: "union", components: [{ type: "number" }, { type: "bool" }, { type: "string" }] }), true);
        });
        it("should be of type { type: 'record', payload: { 'number': { type: 'number' }, 'string': { type: 'string' } } }", function () {
            assert.equal(checkPayload(JSON.parse('{ "number": 1, "string": "works" }'), { type: "record", payload: { "number": { type: "number" }, "string": { type: "string" } } }), true);
        });
        it("should be using a reference", function () {
            // use a ref after a def
            assert.equal(checkPayload(JSON.parse('[1, [2, "ok"]]'), { type: "def", name: 'test', payload: { type: "tuple", payload: [{ type: "number"}, { type: "union", components: [{ type: "string"}, { type: "ref", name: 'test' }]}]}}), true);
            // only def
            assert.equal(checkPayload(JSON.parse("1"), { type: "def", name: 'test2', payload: { type: "any" } }), true);
        });
        it("should be of type { type: 'tuple', payload: [{ type: 'number' }, { type: 'string' }] }", function () {
            assert.equal(checkPayload(JSON.parse('[1, "ok"]'), { type: "tuple", payload: [{ type: "number" }, { type: "string" }] }), true);
        });
        it("should be of type { type: 'array', payload: { type: 'string' } }", function () {
            // only one element
            assert.equal(checkPayload(JSON.parse('["test"]'), { type: "array", payload: { type: "string" } }), true);
            // multiple elements
            assert.equal(checkPayload(JSON.parse('["test", "test2"]'), { type: "array", payload: { type: "string" } }), true);
        });
    });
});
