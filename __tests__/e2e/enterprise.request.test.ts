import axios from "axios";


const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("POST /enterprise/create and GET /enterprise", () => {
  it("should return 200", async () => {
    const res = await axiosBase.post("/enterprise/create", {
      name: "Teste de empresa",
      plan: "flash",
      recurrence: "month"
    }, {
      headers: {
        Authorization:
          `Bearer ${process.env.AUTH_TOKEN}`,
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
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    expect(res.status).toBe(400);
  });

  it("should GET /enterprise return 200", async () => {
    const res = await axiosBase.get("/enterprise",{
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    const data = res.data;

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(0);
  })

  let enterpriseId: string | null = null;

  it("should GET /enterprise?unactiveEnterprise=true return 200", async () => {
    const res = await axiosBase.get("/enterprise?unactiveEnterprise=true",{
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    const data = res.data;

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const enterprise = data[0];

    enterpriseId = enterprise.id

    expect(typeof enterprise.id).toBe("string");
    expect(typeof enterprise.name).toBe("string");
    expect(typeof enterprise.credits).toBe("number");
    expect(typeof enterprise.active).toBe("boolean");
    expect(typeof enterprise.plan).toBe("string");
    expect(enterprise._count).toHaveProperty("posts");
    expect(enterprise._count.posts).toBe(0);
  })

  it("should return 404", async () => {
    const res = await axiosBase.get("/enterprise?unactiveEnterprise=true");
    expect(res.status).toBe(401);
  })

  it("should return 200", async () => {
    const res = await axiosBase.get("/user/invoices", {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);

    const invoice = res.data[0];

    expect(typeof invoice.id).toBe("string");
    expect(typeof invoice.publicId).toBe("number");
    expect(typeof invoice.enterpriseId).toBe("string");
    expect(typeof invoice.enterpriseName).toBe("string");
    expect(typeof invoice.status).toBe("string");
    expect(typeof invoice.action).toBe("string");
    expect(typeof invoice.recurrence).toBe("string");
    expect(typeof invoice.plan).toBe("string");
    expect(typeof invoice.value).toBe("number");
    expect(typeof invoice.currency).toBe("string");
    expect(typeof invoice.discount).toBe("number");
    expect(invoice.paidAt).toBe(null);
    expect(invoice.paidWith).toBe(null);
    expect(invoice.paidValue).toBe(null);
    expect(invoice.paidCoupon).toBe(null);
    expect(invoice.paidBy).toBe(null);
    expect(invoice.paymentUrl).toBe(null);
    expect(invoice.paymentUrlExpire).toBe(null);
    expect(typeof invoice.expireAt).toBe("string");
    expect(typeof invoice.createdAt).toBe("string");
  });

  it("should /enterprise/:id/edit return 200", async () => {
    const res = await axiosBase.put(`/enterprise/${enterpriseId}/edit`, {
      name: "Novo nome"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(200);
    expect(res.data.update).toBe(true);
  })

  it("should /enterprise/:id/edit return 404", async () => {
    const res = await axiosBase.put(`/enterprise/dawdaiwodjoawid/edit`, {
      name: "Novo nome"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(404);
  })
});

describe("ADDSUBUSER /enterprise/:id/subuser", () => {
  it("should /enterprise/:id/subuser/create return 201", async () => {
    const res = await axiosBase.post(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/create`, {
      email: "kauabd137@gmail.com",
      permission: "ADMINISTRATOR"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(201);
    expect(res.data.created).toBe(true);
  })

  it("should /enterprise/:id/subuser/create return 409", async () => {
    const res = await axiosBase.post(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/create`, {
      email: "kauabd137@gmail.com",
      permission: "ADMINISTRATOR"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(409);
  })

  it("should /enterprise/:id/subuser/create return 400", async () => {
    const res = await axiosBase.post(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/create`, {
      email: "kauacomtil021@gmail.com",
      permission: "ADMINISTRATOR"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(400);
  })

   it("should /enterprise/:id/subuser/edit return 200", async () => {
    const res = await axiosBase.put(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/edit`, {
      email: "kauabd137@gmail.com",
      permission: "USER"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })


    expect(res.status).toBe(200);
    expect(res.data.updated).toBe(true);
  })

  it("should /enterprise/:id/subuser/edit return 404", async () => {
    const res = await axiosBase.put(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/edit`, {
      email: "kauabdawdawdawdawdawd137@gmail.com",
      permission: "USER"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(404);
  })

  it("should /enterprise/:id/subuser/edit return 200 of set ADMINISTRATOR", async () => {
    const res = await axiosBase.put(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/edit`, {
      email: "kauabd137@gmail.com",
      permission: "ADMINISTRATOR"
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(200);
    expect(res.data.updated).toBe(true);
  })

  it("should /enterprise/:id/subuser/delete return 200", async () => {
    const res = await axiosBase.post(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/delete`, {
      email: "kauabd137@gmail.com",
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(200);
    expect(res.data.deleted).toBe(true);
  })

  it("should /enterprise/:id/subuser/delete return 404", async () => {
    const res = await axiosBase.post(`/enterprise/ebfd70c7-efd7-4246-9d46-56227e47f220/subuser/delete`, {
      email: "kauabd137@gmail.com",
    }, {
      headers: {
        Authorization:
           `Bearer ${process.env.AUTH_TOKEN}`,
      },
    })

    expect(res.status).toBe(404);
  })
})