import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

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

  it("should return 404 for duplicate email", async () => {
    const res = await axiosBase.post("/user/create", {
      name: "John Doe",
      email: "kauacomtil021@gmail.com",
      password: "Kaua129837",
    });

    expect(res.status).toBe(409);
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

describe("GET /user/auth", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/user/auth", {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlN2RjMWQ1LTAwNDMtNGE2MC1iMjA2LTljYzYyZTk2NjRmMiIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ1Mjc3NjcxLCJleHAiOjE3NTMwNTM2NzF9.PaTwJ3_ww4QKBbjH9dq7R7aLbVEpd84OVwkBb72o5mk",
      },
    });

    const data = res.data;

    expect(res.status).toBe(200);
    expect(typeof data.id).toBe("string");
    expect(typeof data.name).toBe("string");
    expect(typeof data.email).toBe("string");
    expect(typeof data.avatarUrl).toBe("string");
    expect(data.verification).toBe(true);
    expect(typeof data.createdAt).toBe("string");
    expect(typeof data.updateAt).toBe("string");
    expect(typeof data.lastLogin).toBe("string");
    expect(Array.isArray(data.enterprises)).toBe(true);
  });

  it("should return 401", async () => {
    const res = await axiosBase.get("/user/auth"); // no token

    expect(res.status).toBe(401);
  });

  it("should return 200", async () => {
    const res = await axiosBase.get("/user/auth", {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIzNzdiNmamLWNkZDctNGE3Ni05NmMwLTc3MjEwNGM0MTZjOCIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ0Mzk5MzYyLCJleHAiOjE3NTIxNzUzNjJ9.UziZ6GPYzPEX_kX4FTAGBFVmqQIQm7rni3vZ3nqUA0k",
      },
    });

    expect(res.status).toBe(404);
  });
});

describe("POST /user/reedem", () => {
  it("should return 200", async () => {
    const res = await axiosBase.post("/user/reedem", {
      email: "kauacomtil021@gmail.com",
    });

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it("should return 404", async () => {
    const res = await axiosBase.post("/user/reedem", {
      email: "9128319831293819238jdwadjawlkdj@gmail.com",
    });

    expect(res.status).toBe(404);
  });
});

describe("POST /user/reedem", () => {
  it("should return 404 not user", async () => {
    const res = await axiosBase.put("/user/reedem/IJDKADD", {
      email: "9128319831293819238jdwadjawlkdj@gmail.com",
      password: "123456Kaun",
    });

    expect(res.status).toBe(404);
  });

  it("should return 404 code not found", async () => {
    const res = await axiosBase.put("/user/reedem/IJDKAcDD", {
      email: "kauacomtil021@gmail.com",
      password: "123456Kaun",
    });

    expect(res.status).toBe(404);
  });
});

describe("POST /user/invoices", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get("/user/invoices", {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlN2RjMWQ1LTAwNDMtNGE2MC1iMjA2LTljYzYyZTk2NjRmMiIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ1Mjc3NjcxLCJleHAiOjE3NTMwNTM2NzF9.PaTwJ3_ww4QKBbjH9dq7R7aLbVEpd84OVwkBb72o5mk",
      },
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

describe("POST /user/edit", () => {
  it("should return 200", async () => {
    const formdata = new FormData();
    formdata.append("name", "Kauã");

    const res = await axiosBase.put("/user/edit", formdata, {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlN2RjMWQ1LTAwNDMtNGE2MC1iMjA2LTljYzYyZTk2NjRmMiIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ1Mjc3NjcxLCJleHAiOjE3NTMwNTM2NzF9.PaTwJ3_ww4QKBbjH9dq7R7aLbVEpd84OVwkBb72o5mk",
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("update");
    expect(res.data.update).toHaveProperty("name");
  });

  it("should return 404", async () => {
    const formdata = new FormData();
    formdata.append("name", "Kauã");

    const res = await axiosBase.put("/user/edit", formdata, {
      headers: {
        Authorization: "Bearer dwad",
      },
    });

    expect(res.status).toBe(404);
  });
});
