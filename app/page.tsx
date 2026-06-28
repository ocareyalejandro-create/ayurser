"use client";

import { useState } from "react";
import {
  QUESTIONS,
  evaluate,
  type Answers,
  type Result,
  type GuidanceLine,
} from "@/lib/engine";
import { saveCheckIn } from "@/lib/saveCheckIn";
import styles from "./checkin.module.css";

/** The screens of the one minute. A small, explicit state machine. */
type Screen =
  | { kind: "intro" }
  | { kind: "question"; step: number }
  | { kind: "result"; result: Result };

export default function CheckInPage() {
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [answers, setAnswers] = useState<Answers>({});

  function begin() {
    setAnswers({});
    setScreen({ kind: "question", step: 0 });
  }

  function choose(step: number, optionIndex: number) {
    const question = QUESTIONS[step]!;
    const next: Answers = { ...answers, [question.key]: optionIndex };
    setAnswers(next);

    if (step < QUESTIONS.length - 1) {
      setScreen({ kind: "question", step: step + 1 });
      return;
    }

    // Last answer in — compute the calm result and show it. Persistence is
    // fire-and-forget: it must never block or break the minute.
    const result = evaluate(next);
    setScreen({ kind: "result", result });
    void saveCheckIn({
      answers: next,
      qualities: result.tally,
      outcome: result.outcome,
    });
  }

  function back(step: number) {
    if (step > 0) setScreen({ kind: "question", step: step - 1 });
    else setScreen({ kind: "intro" });
  }

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        {screen.kind === "intro" && <Intro onBegin={begin} />}
        {screen.kind === "question" && (
          <QuestionView
            step={screen.step}
            onChoose={choose}
            onBack={() => back(screen.step)}
          />
        )}
        {screen.kind === "result" && (
          <ResultView result={screen.result} onAgain={() => setScreen({ kind: "intro" })} />
        )}
      </div>
    </main>
  );
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className={`${styles.center} fade`}>
      <p className={styles.kicker}>Ayurser</p>
      <h1 className="serif">
        How are you
        <br />
        today?
      </h1>
      <p className={styles.quiet} style={{ marginTop: 18 }}>
        A one-minute check-in.
      </p>
      <button className={styles.btn} onClick={onBegin}>
        Begin
      </button>
    </div>
  );
}

function QuestionView({
  step,
  onChoose,
  onBack,
}: {
  step: number;
  onChoose: (step: number, optionIndex: number) => void;
  onBack: () => void;
}) {
  const question = QUESTIONS[step]!;
  return (
    <div className="fade" key={step}>
      <div className={styles.seg} aria-hidden>
        {QUESTIONS.map((q, i) => (
          <span key={q.key} className={i <= step ? styles.on : undefined} />
        ))}
      </div>
      <p className={styles.kicker}>
        Question {step + 1} of {QUESTIONS.length}
      </p>
      <h2 className={`serif ${styles.question}`}>{question.prompt}</h2>
      {question.options.map((option, i) => (
        <button key={option.label} className={styles.opt} onClick={() => onChoose(step, i)}>
          {option.label}
        </button>
      ))}
      <div>
        <button className={styles.back} onClick={onBack}>
          &larr;&nbsp;&nbsp;Back
        </button>
      </div>
    </div>
  );
}

function ResultView({ result, onAgain }: { result: Result; onAgain: () => void }) {
  const { guidance } = result;
  return (
    <div className="fade">
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <p className={styles.kicker}>Today</p>
          <h2 className={`serif ${styles.focus}`}>{guidance.focus}</h2>
          <p className={styles.quiet} style={{ marginTop: 14 }}>
            {guidance.readout}
          </p>
        </div>

        {/* ONE anchor, loud. The single frictionless thing for the morning. */}
        <Anchor line={guidance.anchor} />

        {/* The supporting quartet, quiet. */}
        <GuidanceRow label="Eat" line={guidance.eat} />
        <GuidanceRow label="Ritual" line={guidance.ritual} />
        <GuidanceRow label="Breath" line={guidance.breath} />
        <GuidanceRow label="Move" line={guidance.move} />

        {/* SEAM: the opt-in "why did we ask?" learn card lands here in a later
            phase. Experience first, explanation second — not built now. */}

        <p className={styles.foot}>
          Like increases like; opposites restore balance.
          <br />— Ashtanga Hridaya, Sutrasthana 1.13 · Lifestyle guidance inspired by Ayurveda,
          not medical advice.
        </p>
      </div>

      <div className={styles.again}>
        <button className={styles.btn} onClick={onAgain}>
          Again
        </button>
      </div>
    </div>
  );
}

/** The loud anchor: the one thing to do this morning, with tappable depth. */
function Anchor({ line }: { line: GuidanceLine }) {
  const why = useWhy();
  return (
    <div className={styles.anchor}>
      <p className={styles.anchorKicker}>One thing</p>
      <p className={`serif ${styles.anchorText}`}>{line.text}</p>
      <WhyToggle line={line} {...why} />
    </div>
  );
}

/** A quiet supporting line: Eat / Ritual / Breath / Move, with tappable depth. */
function GuidanceRow({ label, line }: { label: string; line: GuidanceLine }) {
  const why = useWhy();
  return (
    <div className={styles.row}>
      <div className={styles.lab}>{label}</div>
      <div className={styles.body}>
        {line.text}
        <WhyToggle line={line} {...why} />
      </div>
    </div>
  );
}

/** Local open/closed state for one expandable depth panel. */
function useWhy() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((v) => !v) };
}

/**
 * The restrained "More" affordance. Hidden until tapped: a subtle underlined
 * link reveals the paraphrased detail + its attribution. No clutter, no jargon.
 */
function WhyToggle({
  line,
  open,
  toggle,
}: {
  line: GuidanceLine;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={styles.why}
        aria-expanded={open}
        onClick={toggle}
      >
        {open ? "Less" : "More"}
      </button>
      {open && (
        <div className={`${styles.detail} fade`}>
          <p className={styles.detailBody}>{line.detail}</p>
          {line.source !== "—" && <p className={styles.detailSrc}>— {line.source}</p>}
        </div>
      )}
    </>
  );
}
