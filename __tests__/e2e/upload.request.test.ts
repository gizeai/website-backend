import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("GET /uploads/:id", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/uploads/c337b707-d812-4fb1-8226-47a21d85b4b2");
    expect(res.status).toBe(200);
  });
});
