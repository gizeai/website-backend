import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("GET /uploads/:id", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/uploads/15ac6444-6785-4505-8dee-a8f90dbde693");
    expect(res.status).toBe(200);
  });
});
