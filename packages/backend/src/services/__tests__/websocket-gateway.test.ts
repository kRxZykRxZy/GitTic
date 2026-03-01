import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertSingleActiveWebSocketGateway,
  closeWebSocketGateway,
  createWebSocketGateway,
  getWebSocketGatewayInstanceCount,
} from "../websocket-gateway.js";

describe("websocket-gateway singleton lifecycle", () => {
  afterEach(() => {
    closeWebSocketGateway();
  });

  it("keeps exactly one active WebSocket gateway instance after startup", () => {
    const server = http.createServer();

    createWebSocketGateway(server);

    expect(getWebSocketGatewayInstanceCount()).toBe(1);
    expect(() => assertSingleActiveWebSocketGateway()).not.toThrow();

    server.close();
  });

  it("throws on accidental double initialization", () => {
    const server = http.createServer();

    createWebSocketGateway(server);

    expect(() => createWebSocketGateway(server)).toThrow(
      "WebSocket gateway has already been initialized",
    );

    server.close();
  });
});
