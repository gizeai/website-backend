import EnterpriseLogs from "../../src/managers/EnterpriseLogs"

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
    "logs": [],
}

describe("Validate Enterprise logs manager", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enterpriseLogs = new EnterpriseLogs(enterpriseTest as any);
  
  it("should be valid instance", () => {
    expect(enterpriseLogs).toBeInstanceOf(EnterpriseLogs)
    expect(EnterpriseLogs.prototype).toHaveProperty("addLogs");
    expect(EnterpriseLogs.prototype).toHaveProperty("getLogs");
    expect(EnterpriseLogs.prototype).toHaveProperty("getNewLogs");
    expect(EnterpriseLogs.prototype).toHaveProperty("setNewLogs");
    expect(EnterpriseLogs.prototype).toHaveProperty("save");
  })

  it ("should get logs", () => {
    expect(enterpriseLogs.getLogs()).toHaveLength(0);
  })

  it ("should add logs", () => {
    enterpriseLogs.addLogs({
      tag: "NEW_SUBUSER",
      title: "Novo subusuário",
      userId: "ce7dc1d5-0043-4a60-b206-9cc62e9664f2",
      userName: 'Kauã Braz'
    })

    expect(enterpriseLogs.getNewLogs()).toHaveLength(1);
  })

  it ("should set logs", async () => {
    expect(enterpriseLogs.getNewLogs()).toHaveLength(1);

    enterpriseLogs.setNewLogs([])

    expect(enterpriseLogs.getNewLogs()).toHaveLength(0);
  })
})