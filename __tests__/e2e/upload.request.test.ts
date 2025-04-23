import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("GET /uploads/:id", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/uploads/aead6a26-8029-4518-b72e-8fbd8b7dfeb7");
    expect(res.status).toBe(200);
  });
});
