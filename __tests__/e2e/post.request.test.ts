import axios from "axios";


const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  validateStatus: () => true,
});

describe("POST /enterprise/:id/post", () => {
  it("should return 200", async () => {
    const res = await axiosBase.get(`/enterprise/${process.env.TEST_ENTERPRISE_ID}/post`, {
      headers: {
        Authorization:
          `Bearer ${process.env.TEST_AUTH_TOKEN}`,
      },
    });

    const data = res.data;

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);

    const post = data[0];

    if (post) {
      expect(typeof post.id).toBe("string");
      expect(typeof post.enterpriseId).toBe("string");
      expect(typeof post.title).toBe("string");
      expect(typeof post.promptSent).toBe("string");
      expect(typeof post.artModel).toBe("string");
      expect(typeof post.type).toBe("string");
      expect(typeof post.instructions).toBe("string");
      expect(post.responseBody).toBeDefined();
      expect(Array.isArray(post.responseTags)).toBe(true);
      expect(Array.isArray(post.responseAttachment)).toBe(true);
      expect(typeof post.edits).toBe("number");
      expect(typeof post.creditsUsed).toBe("number");
      expect(typeof post.iaModel).toBe("string");
      expect(typeof post.feedback).toBe("string");
      expect(typeof post.createdAt).toBe("string");
      expect(typeof post.updateAt).toBe("string");
    }
  });

  it("should return 404 Enterprise Not Found", async () => {
    const res = await axiosBase.get(`/enterprise/aaaaaa/post`, {
      headers: {
        Authorization:
          `Bearer ${process.env.TEST_AUTH_TOKEN}`,
      },
    });

    expect(res.status).toBe(404);
  });

  it("should return 404 User Not Found", async () => {
    const res = await axiosBase.get(`/enterprise/${process.env.TEST_ENTERPRISE_ID}/post`, {
      headers: {
        Authorization:
          `Bearer aaaa`,
      },
    });

    expect(res.status).toBe(404);
  });
})