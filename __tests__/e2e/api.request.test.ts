import app from "../../src/app";
import request from "supertest";

describe("GET /", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
  });

  it("should a valid json", async () => {
    const res = await request(app).get("/api");
    expect(res.type).toBe("application/json");

    const data = res.body;

    expect(data).toHaveProperty("update_at");
    expect(data).toHaveProperty("dependencies");
    expect(data).toHaveProperty("webserver");

    expect(data.dependencies).toHaveProperty("database");
    expect(data.dependencies.database.db).toBe("postgres");
    expect(typeof data.dependencies.database.db).toBe("string");
    expect(typeof data.dependencies.database.version).toBe("string");
    expect(typeof data.dependencies.database.max_connections).toBe("number");
    expect(data.dependencies.database.opened_connections).toBe(1);

    expect(data.dependencies.database.latency).toHaveProperty("first_query");
    expect(data.dependencies.database.latency).toHaveProperty("second_query");
    expect(data.dependencies.database.latency).toHaveProperty("third_query");

    expect(typeof data.dependencies.database.latency.first_query).toBe("number");
    expect(typeof data.dependencies.database.latency.second_query).toBe("number");
    expect(typeof data.dependencies.database.latency.third_query).toBe("number");

    expect(data.webserver).toHaveProperty("node_version");
    expect(data.webserver).toHaveProperty("uptime");
    expect(data.webserver).toHaveProperty("timezone");

    expect(typeof data.webserver.node_version).toBe("string");
    expect(typeof data.webserver.uptime).toBe("number");
    expect(typeof data.webserver.timezone).toBe("string");
  });
});
