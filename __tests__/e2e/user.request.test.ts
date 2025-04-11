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

describe("PUT /user/verify", () => {
  it("should return 404 for invalid code", async () => {
    const res = await axiosBase.put("/user/verify", {
      email: "n3Vt2@example.com",
      code: "123456",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /user/login", () => {
  it("should return 200", async () => {
    const res = await axiosBase.post("/user/login", {
      email: "kauacomtil021@gmail.com",
      password: "Kaua10052006",
    });

    const data = res.data;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.auth_token).toBe("string");
  });

  it("should return 400", async () => {
    const res = await axiosBase.post("/user/login", {
      email: "kauacomtil021@gmail.com",
      password: "Not1sThisPassword",
    });

    expect(res.status).toBe(400);
  });
});
