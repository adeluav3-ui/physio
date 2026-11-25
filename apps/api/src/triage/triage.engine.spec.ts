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
        expect(r.ruleIds).not.toContain("flag.pain_high");
    });

    it("pain 8 triggers pain_high → FLAG", () => {
        const r = evaluate({ painScore: 8, redFlagAnswers: allFalse });
        expect(r.level).toBe("FLAG");
        expect(r.ruleIds).toContain("flag.pain_high");
    });

    it("pain 10 triggers pain_high → FLAG", () => {
        const r = evaluate({ painScore: 10, redFlagAnswers: allFalse });
        expect(r.level).toBe("FLAG");
    });
});

describe("triage engine — FLAG cases", () => {
    it("post_op_planned only → FLAG", () => {
        const r = evaluate({ painScore: 3, redFlagAnswers: { ...allFalse, post_op_planned: true } });
        expect(r.level).toBe("FLAG");
        expect(r.ruleIds).toContain("flag.post_op_planned");
    });

    it("mobility_limited only → FLAG", () => {
        const r = evaluate({ painScore: 3, redFlagAnswers: { ...allFalse, mobility_limited: true } });
        expect(r.level).toBe("FLAG");
        expect(r.ruleIds).toContain("flag.mobility_limited");
    });

    it("pain_high + FLAG trigger → still FLAG (no IN_PERSON_REQUIRED)", () => {
        const r = evaluate({
            painScore: 9,
            redFlagAnswers: { ...allFalse, mobility_limited: true },
        });
        expect(r.level).toBe("FLAG");
    });
});

describe("triage engine — IN_PERSON_REQUIRED cases (one flag per test)", () => {
    const inPersonFlags: [string, string][] = [
        ["major_trauma", "in_person.major_trauma"],
        ["neuro_progressive_weakness", "in_person.neuro_progressive_weakness"],
        ["neuro_bladder_bowel", "in_person.neuro_bladder_bowel"],
        ["neuro_saddle_numbness", "in_person.neuro_saddle_numbness"],
        ["cardioresp", "in_person.cardioresp"],
        ["systemic", "in_person.systemic"],
        ["post_op_complication", "in_person.post_op_complication"],
        ["severe_worsening", "in_person.severe_worsening"],
    ];

    test.each(inPersonFlags)("flag %s fires rule %s → IN_PERSON_REQUIRED", (flagId, ruleId) => {
        const r = evaluate({
            painScore: 3,
            redFlagAnswers: { ...allFalse, [flagId]: true },
        });
        expect(r.level).toBe("IN_PERSON_REQUIRED");
        expect(r.ruleIds).toContain(ruleId);
    });
});

describe("triage engine — IN_PERSON_REQUIRED wins over FLAG", () => {
    it("IN_PERSON_REQUIRED + FLAG flags together → IN_PERSON_REQUIRED", () => {
        const r = evaluate({
            painScore: 3,
            redFlagAnswers: { ...allFalse, major_trauma: true, post_op_planned: true },
        });
        expect(r.level).toBe("IN_PERSON_REQUIRED");
    });

    it("IN_PERSON_REQUIRED flag + pain_high → IN_PERSON_REQUIRED", () => {
        const r = evaluate({
            painScore: 9,
            redFlagAnswers: { ...allFalse, major_trauma: true },
        });
        expect(r.level).toBe("IN_PERSON_REQUIRED");
    });
});
