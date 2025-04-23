import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

beforeAll(async () => {
  const res = await axiosBase.post("/user/login", {
    email: "kauacomtil021@gmail.com",
    password: "Kaua10052006",
  });

  const data = res.data;

  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(typeof data.auth_token).toBe("string");

  process.env.AUTH_TOKEN = data.auth_token;
});
