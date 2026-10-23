// CJS stub for @physio/db used in jest unit tests.
// Real imports are mocked at the NestJS DI level in each test.
const PrismaClient = function () {};
PrismaClient.prototype.$connect = () => Promise.resolve();
PrismaClient.prototype.$disconnect = () => Promise.resolve();
PrismaClient.prototype.$queryRaw = () => Promise.resolve([]);

module.exports = {
    PrismaClient,
    prisma: new PrismaClient(),
    Prisma: {},
};
