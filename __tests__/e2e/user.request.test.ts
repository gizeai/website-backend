import axiosBase from "../utils/axiosBase";

describe("POST /user/create", () => {
  it("should return 200 for valid name", async () => {
    const res = await axiosBase.post("/user/create", {
      name: "John Doe",
      email: "n3Vt2@example.com",
      password: "Kaua129837",
    });

    expect(res.status).toBe(200);
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
