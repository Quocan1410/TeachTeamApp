import { countActiveSelectedForRole } from "./coursePositionCounts";

describe("countActiveSelectedForRole", () => {
  it("counts selected applications for a role", async () => {
    const getCount = jest.fn().mockResolvedValue(3);
    const andWhere = jest.fn().mockReturnThis();
    const where = jest.fn().mockReturnThis();
    const innerJoin = jest.fn().mockReturnThis();
    const createQueryBuilder = jest.fn().mockReturnValue({
      innerJoin,
      where,
      andWhere,
      getCount,
    });
    const repo = { createQueryBuilder };

    await expect(
      countActiveSelectedForRole(repo as never, "course-1", "tutor", "app-9")
    ).resolves.toBe(3);
    expect(createQueryBuilder).toHaveBeenCalledWith("application");
    expect(andWhere).toHaveBeenCalledWith(
      "application.id != :applicationId",
      expect.objectContaining({ applicationId: "app-9" })
    );
  });

  it("uses getRepository when given an entity manager", async () => {
    const getCount = jest.fn().mockResolvedValue(1);
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount,
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      }),
    };

    await expect(
      countActiveSelectedForRole(manager as never, "course-1", "lab_assistant")
    ).resolves.toBe(1);
    expect(manager.getRepository).toHaveBeenCalled();
  });
});
