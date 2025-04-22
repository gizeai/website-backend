import axios from "axios";

const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});


describe("POST /enterprise/create", () => {
  it("should return 200", async () => {
    const res = await axiosBase.post("/enterprise/create", {
      name: "Teste de empresa",
      plan: "flash",
      recurrence: "month"
    }, {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlN2RjMWQ1LTAwNDMtNGE2MC1iMjA2LTljYzYyZTk2NjRmMiIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ1Mjc3NjcxLCJleHAiOjE3NTMwNTM2NzF9.PaTwJ3_ww4QKBbjH9dq7R7aLbVEpd84OVwkBb72o5mk",
      },
    });

    const data = res.data;

    expect(res.status).toBe(201);
    expect(typeof data.invoice).toBe("string");
  });

  it("should return 400", async () => {
    const res = await axiosBase.post("/enterprise/create", {
      plan: "flash",
      recurrence: "month"
    }, {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlN2RjMWQ1LTAwNDMtNGE2MC1iMjA2LTljYzYyZTk2NjRmMiIsImVtYWlsIjoia2F1YWNvbXRpbDAyMUBnbWFpbC5jb20iLCJuYW1lIjoiS2F1YSBCcmF6IiwiaWF0IjoxNzQ1Mjc3NjcxLCJleHAiOjE3NTMwNTM2NzF9.PaTwJ3_ww4QKBbjH9dq7R7aLbVEpd84OVwkBb72o5mk",
      },
    });

    expect(res.status).toBe(400);
  });
});