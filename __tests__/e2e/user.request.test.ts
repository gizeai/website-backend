import axiosBase from "../utils/axiosBase";

describe("POST /user/create", () => {
  it("should return 200 for valid name", async () => {
    const res = await axiosBase.post("/user/create", {
      name: "John Doe",
      email: "n3Vt2@example.com",
      password: "Kaua129837",
    });

    expect(res.status).toBe(201);
    expect(res.data.created).toBe(true);
  });

  it("should return 400 for invalid name", async () => {
    const res = await axiosBase.post("/user/create", {
      name: "J",
      email: "n3Vt2@example.com",
      password: "Kaua129837",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /user/verify", () => {
  it("should return 404 for invalid code", async () => {
    const res = await axiosBase.put("/user/verify", {
      email: "n3Vt2@example.com",
      code: "123456",
    });

    expect(res.status).toBe(400);
  });
});
