import { createApp, connectWithRetry } from "../../src/server/server";
import SecurityService from "../../src/services/SecurityService";
import logger from "../../src/server/Logger";
import * as typeorm from "typeorm";
import sinon, { SinonSandbox, SinonStub } from "sinon";

describe("App", () => {
  const sandbox: SinonSandbox = sinon.createSandbox();
  const mockConnection: SinonStub = sandbox.stub(typeorm, "createConnection");
  sandbox.stub(SecurityService);
  sandbox.stub(logger, "info");
  sandbox.stub(logger, "error");

  beforeEach(() => {
    sandbox.reset();
    process.env.SECRET = "test";
  });

  afterEach(() => {
    delete process.env.SECRET;
  });

  test("Does not throw when creating app", async () => {
    console.log("# before create app")
    await createApp();
    expect(mockConnection.callCount).toBe(1);
  });

  test("Connect with retry catches expection and retries", async () => {
    const clock: any = sinon.useFakeTimers();
    mockConnection.onCall(0).throws("Could not connect");
    mockConnection.onCall(1).returns({});
    connectWithRetry();
    await clock.tickAsync(5000);
    expect(mockConnection.callCount).toBe(2);
  });
});
