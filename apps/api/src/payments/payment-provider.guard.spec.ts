// Tests the getPaymentProvider environment guard.
// We require the real source directly (relative path) to bypass the @physio/payments mock.
const REAL = "../../../../packages/payments/src/index";

describe("getPaymentProvider environment guard", () => {
    const orig = {
        NODE_ENV: process.env.NODE_ENV,
        BYPASS: process.env.PAYSTACK_TEST_BYPASS,
        KEY: process.env.PAYSTACK_SECRET_KEY,
    };

    afterEach(() => {
        process.env.NODE_ENV = orig.NODE_ENV;
        if (orig.BYPASS !== undefined) process.env.PAYSTACK_TEST_BYPASS = orig.BYPASS;
        else delete process.env.PAYSTACK_TEST_BYPASS;
        if (orig.KEY !== undefined) process.env.PAYSTACK_SECRET_KEY = orig.KEY;
        else delete process.env.PAYSTACK_SECRET_KEY;
    });

    function load() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(REAL) as { getPaymentProvider: () => { constructor: { name: string } } };
    }

    it("returns StubPaymentProvider when NODE_ENV=test and BYPASS=1", () => {
        process.env.NODE_ENV = "test";
        process.env.PAYSTACK_TEST_BYPASS = "1";
        delete process.env.PAYSTACK_SECRET_KEY;
        const provider = load().getPaymentProvider();
        expect(provider.constructor.name).toBe("StubPaymentProvider");
    });

    it("returns StubPaymentProvider when NODE_ENV=development and BYPASS=1", () => {
        process.env.NODE_ENV = "development";
        process.env.PAYSTACK_TEST_BYPASS = "1";
        delete process.env.PAYSTACK_SECRET_KEY;
        const provider = load().getPaymentProvider();
        expect(provider.constructor.name).toBe("StubPaymentProvider");
    });

    it("throws when BYPASS=1 in NODE_ENV=production", () => {
        process.env.NODE_ENV = "production";
        process.env.PAYSTACK_TEST_BYPASS = "1";
        expect(() => load().getPaymentProvider()).toThrow(/not allowed in NODE_ENV="production"/);
    });

    it("throws when BYPASS=1 in NODE_ENV=staging", () => {
        process.env.NODE_ENV = "staging";
        process.env.PAYSTACK_TEST_BYPASS = "1";
        expect(() => load().getPaymentProvider()).toThrow(/not allowed in NODE_ENV="staging"/);
    });

    it("BYPASS=0 does not activate stub even in test env", () => {
        process.env.NODE_ENV = "test";
        process.env.PAYSTACK_TEST_BYPASS = "0";
        process.env.PAYSTACK_SECRET_KEY = "sk_test_dummy";
        const provider = load().getPaymentProvider();
        expect(provider.constructor.name).toBe("PaystackProvider");
    });
});
