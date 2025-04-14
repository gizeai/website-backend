import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("GET /uploads/:id", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/uploads/17ac5967-fc64-4a47-83b0-68b0fa6c13de");
    expect(res.status).toBe(200);
  });
});
