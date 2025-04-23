import EnterpriseMetrics from "../../src/managers/EnterpriseMetrics"

const enterpriseTest = {
    "id": "ebfd70c7-efd1-4246-9d46-56227e47f220",
    "userId": "ce7dc1d5-0043-4a60-b206-9cc62e9664f2",
    "name": "Novo nome",
    "colors": "Roxo e azul",
    "font": "inter",
    "language": "pt",
    "keywords": [],
    "active": true,
    "infos": "",
    "personality": "",
    "credits": 100,
    "plan": "FLASH",
    "metrics": "{}",
    "createdAt": new Date("2025-04-22T16:35:46.771Z"),
    "updateAt": new Date("2025-04-23T13:12:11.225Z"),
    "expireAt": new Date("2026-04-27T16:35:46.770Z"),
    "lastCreditsUpdate": new Date("2025-04-22T16:35:46.770Z"),
}

describe("Validate Enterprise logs manager", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enterpriseMetrics = new EnterpriseMetrics(enterpriseTest as any);
  
  it("should be valid instance", () => {
    expect(enterpriseMetrics).toBeInstanceOf(EnterpriseMetrics)
    expect(EnterpriseMetrics.prototype).toHaveProperty("getMetrics");
    expect(EnterpriseMetrics.prototype).toHaveProperty("setMetrics");
    expect(EnterpriseMetrics.prototype).toHaveProperty("increment");
    expect(EnterpriseMetrics.prototype).toHaveProperty("decrement");
    expect(EnterpriseMetrics.prototype).toHaveProperty("getMonthMetrics");
    expect(EnterpriseMetrics.prototype).toHaveProperty("save");
  })

  it ("should get metrics", () => {
    expect(Object.keys(enterpriseMetrics.getMetrics())).toHaveLength(0);
  })

  it ("should increment metric", () => {
    enterpriseMetrics.increment({
      credits: 10
    })

    expect(Object.keys(enterpriseMetrics.getMetrics())).toHaveLength(1);
  })

  it ("should decrement metric", () => {
    enterpriseMetrics.decrement({
      credits: 5
    })

    expect(Object.keys(enterpriseMetrics.getMetrics())).toHaveLength(1);
    expect(enterpriseMetrics.getMonthMetrics().credits).toBe(5);
  })
})