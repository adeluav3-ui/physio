import { evaluate } from "./triage.engine.js";

const noFlags: Record<string, boolean> = {};
const allFalse: Record<string, boolean> = {
    major_trauma: false,
    neuro_progressive_weakness: false,
    neuro_bladder_bowel: false,
    neuro_saddle_numbness: false,
    cardioresp: false,
    systemic: false,
    post_op_complication: false,
    severe_worsening: false,
    post_op_planned: false,
    mobility_limited: false,
};

describe("triage engine — GREEN", () => {
    it("returns GREEN when no flags and pain 0", () => {
        const r = evaluate({ painScore: 0, redFlagAnswers: allFalse });
        expect(r.level).toBe("GREEN");
    });

    it("returns GREEN when no flags and pain 7 (boundary below pain_high)", () => {
        const r = evaluate({ painScore: 7, redFlagAnswers: allFalse });
        expect(r.level).toBe("GREEN");
    });

    it("returns GREEN with empty redFlagAnswers and pain 5", () => {
        const r = evaluate({ painScore: 5, redFlagAnswers: noFlags });
        expect(r.level).toBe("GREEN");
        expect(r.ruleIds).toHaveLength(0);
    });
});

describe("triage engine — pain_high boundary", () => {
    it("pain 7 does NOT trigger pain_high → GREEN", () => {
        const r = evaluate({ painScore: 7, redFlagAnswers: allFalse });
        expect(r.level).toBe("GREEN");
        expect(r.ruleIds).not.toContain("amber.pain_high");
    });

    it("pain 8 triggers pain_high → AMBER", () => {
        const r = evaluate({ painScore: 8, redFlagAnswers: allFalse });
        expect(r.level).toBe("AMBER");
        expect(r.ruleIds).toContain("amber.pain_high");
    });

    it("pain 10 triggers pain_high → AMBER", () => {
        const r = evaluate({ painScore: 10, redFlagAnswers: allFalse });
        expect(r.level).toBe("AMBER");
    });
});

describe("triage engine — AMBER cases", () => {
    it("post_op_planned only → AMBER", () => {
        const r = evaluate({ painScore: 3, redFlagAnswers: { ...allFalse, post_op_planned: true } });
        expect(r.level).toBe("AMBER");
        expect(r.ruleIds).toContain("amber.post_op_planned");
    });

    it("mobility_limited only → AMBER", () => {
        const r = evaluate({ painScore: 3, redFlagAnswers: { ...allFalse, mobility_limited: true } });
        expect(r.level).toBe("AMBER");
        expect(r.ruleIds).toContain("amber.mobility_limited");
    });

    it("pain_high + AMBER flag → still AMBER (no RED)", () => {
        const r = evaluate({
            painScore: 9,
            redFlagAnswers: { ...allFalse, mobility_limited: true },
        });
        expect(r.level).toBe("AMBER");
    });
});

describe("triage engine — RED cases (one flag per test)", () => {
    const redFlags: [string, string][] = [
        ["major_trauma", "red.major_trauma"],
        ["neuro_progressive_weakness", "red.neuro_progressive_weakness"],
        ["neuro_bladder_bowel", "red.neuro_bladder_bowel"],
        ["neuro_saddle_numbness", "red.neuro_saddle_numbness"],
        ["cardioresp", "red.cardioresp"],
        ["systemic", "red.systemic"],
        ["post_op_complication", "red.post_op_complication"],
        ["severe_worsening", "red.severe_worsening"],
    ];

    test.each(redFlags)("flag %s fires rule %s → RED", (flagId, ruleId) => {
        const r = evaluate({
            painScore: 3,
            redFlagAnswers: { ...allFalse, [flagId]: true },
        });
        expect(r.level).toBe("RED");
        expect(r.ruleIds).toContain(ruleId);
    });
});

describe("triage engine — RED wins over AMBER", () => {
    it("RED + AMBER flags together → RED", () => {
        const r = evaluate({
            painScore: 3,
            redFlagAnswers: { ...allFalse, major_trauma: true, post_op_planned: true },
        });
        expect(r.level).toBe("RED");
    });

    it("RED flag + pain_high → RED", () => {
        const r = evaluate({
            painScore: 9,
            redFlagAnswers: { ...allFalse, major_trauma: true },
        });
        expect(r.level).toBe("RED");
    });
});
