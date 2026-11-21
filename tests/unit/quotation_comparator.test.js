import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    CATEGORIES,
    normalizeNumber,
    areNumbersEqual,
    normalizeString
} from "../../src/utils/quotationComparator.js";

describe("Quotation Comparator Utilities Tests", () => {
    test("CATEGORIES: should define standard comparison categories", () => {
        assert.equal(CATEGORIES.CUSTOMER_ORDER, "Customer / Order Details");
        assert.equal(CATEGORIES.LINE_ITEMS, "Line Items");
        assert.equal(CATEGORIES.TECHNICAL_SPECS, "Dimensions and Technical Specifications");
        assert.equal(CATEGORIES.COMMERCIAL_TAX, "Commercial Charges and Tax");
        assert.equal(CATEGORIES.TERMS_REMARKS, "Payment and Delivery Terms");
    });

    test("normalizeNumber: should parse currency strings and handle null/empty correctly", () => {
        assert.equal(normalizeNumber("₹1,250.50"), 1250.5);
        assert.equal(normalizeNumber("$500"), 500);
        assert.equal(normalizeNumber("18%"), 18);
        assert.equal(normalizeNumber(42), 42);
        assert.equal(normalizeNumber(""), null);
        assert.equal(normalizeNumber(null), null);
        assert.equal(normalizeNumber(undefined), null);
        assert.equal(normalizeNumber("invalid"), null);
    });

    test("areNumbersEqual: should compare floating-point numbers within precision epsilon", () => {
        assert.equal(areNumbersEqual(10.00001, 10.00002), true);
        assert.equal(areNumbersEqual(10.5, 10.5), true);
        assert.equal(areNumbersEqual("₹100", 100), true);
        assert.equal(areNumbersEqual(null, null), true);
        assert.equal(areNumbersEqual(100, 200), false);
        assert.equal(areNumbersEqual(null, 100), false);
    });

    test("normalizeString: should collapse whitespace and trim cleanly", () => {
        assert.equal(normalizeString("  hello   world  "), "hello world");
        assert.equal(normalizeString("test\n\tstring"), "test string");
        assert.equal(normalizeString(null), "");
        assert.equal(normalizeString(undefined), "");
    });
});
