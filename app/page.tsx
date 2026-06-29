"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  QUESTIONS,
  evaluate,
  type Answers,
  type Result,
  type GuidanceLine,
} from "@/lib/engine";
import { saveCheckIn } from "@/lib/saveCheckIn";
import { getName, setName } from "@/lib/name";
import styles from "./checkin.module.css";

/**
 * The real logo: the tree-of-life meditator (seated in lotus, a tree up the
 * spine with seven chakra dots, in a thin circle, warm sepia). Extracted from
 * the approved design comp; transparent-background 922×922 PNG in /public.
 */
const LOGO_SRC = "/logo.png";

/**
 * The wisdom epigraph set quietly beneath each result — a line of classical
 * wisdom, cited. Kept as a swappable shape so it can later rotate from the
 * curated `knowledge/wisdom.md` collection. Only public-domain classical lines
 * go here verbatim, with a verified attribution (see wisdom.md's rules).
 */
const EPIGRAPH = {
  text: "Like increases like; opposites restore balance.",
  attribution: "Aṣṭāṅga Hṛdaya, Sūtrasthāna 1.13½",
} as const;

/** The legal note — separate from the wisdom, never sharing its weight. */
const DISCLAIMER = "Lifestyle guidance inspired by Ayurveda — not medical advice.";

/** The screens of the one minute. A small, explicit state machine. */
type Screen =
  | { kind: "loading" } // resolving the stored name on mount (no flash of the wrong screen)
  | { kind: "naming" } // first visit: "What shall we call you?"
  | { kind: "intro" }
  | { kind: "question"; step: number }
  | { kind: "note"; result: Result } // the open door — an optional note in their own words
  | { kind: "result"; result: Result };

export default function CheckInPage() {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [name, setNameState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

  // Resolve the stored name once, on the client. localStorage is browser-only,
  // so we start in "loading" and pick naming vs intro after mount — no flash.
  useEffect(() => {
    const stored = getName();
    setNameState(stored);
    setScreen(stored ? { kind: "intro" } : { kind: "naming" });
  }, []);

  function submitName(raw: string) {
    const cleaned = setName(raw); // tidies + persists; null if empty
    if (!cleaned) return;
    setNameState(cleaned);
    setScreen({ kind: "intro" });
  }

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

    // Last answer in — compute the calm result, then open the door: an optional
    // note in their own words, before the reading. We defer persistence to the
    // note step so the words are saved with the check-in.
    const result = evaluate(next);
    setScreen({ kind: "note", result });
  }

  function back(step: number) {
    if (step > 0) setScreen({ kind: "question", step: step - 1 });
    else setScreen({ kind: "intro" });
  }

  // The open door: persist the check-in (with any free-text note in their own
  // words) and reveal the reading. Fire-and-forget — it never blocks the minute.
  function finishWithNote(result: Result, note: string) {
    setScreen({ kind: "result", result });
    void saveCheckIn({
      answers,
      qualities: result.tally,
      outcome: result.outcome,
      note: note || undefined,
    });
  }

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        {screen.kind === "naming" && <Naming onSubmit={submitName} />}
        {screen.kind === "intro" && <Intro name={name} onBegin={begin} />}
        {screen.kind === "question" && (
          <QuestionView
            step={screen.step}
            onChoose={choose}
            onBack={() => back(screen.step)}
          />
        )}
        {screen.kind === "note" && (
          <NoteView
            onContinue={(note) => finishWithNote(screen.result, note)}
            onSkip={() => finishWithNote(screen.result, "")}
          />
        )}
        {screen.kind === "result" && (
          <ResultView result={screen.result} onAgain={() => setScreen({ kind: "intro" })} />
        )}
      </div>
    </main>
  );
}

/** First visit — a single gentle field: "What shall we call you?" Matches the
 *  comp's onboarding (logo, wordmark, serif prompt, underlined input, CTA). */
function Naming({ onSubmit }: { onSubmit: (raw: string) => void }) {
  const [value, setValue] = useState("");
  const ready = value.trim().length > 0;

  return (
    <div className={`${styles.center} fade`}>
      <Image
        src={LOGO_SRC}
        alt="Ayurser — the tree of life"
        width={104}
        height={104}
        priority
        className={styles.namingMark}
      />
      <p className={styles.introWordmark}>Ayurser</p>
      <h2 className={`serif ${styles.namingPrompt}`}>What shall we call you?</h2>
      <input
        className={styles.nameInput}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && ready) onSubmit(value);
        }}
        placeholder="your name"
        aria-label="Your name"
        maxLength={40}
        autoComplete="given-name"
        autoFocus
      />
      <button className={styles.btn} onClick={() => onSubmit(value)} disabled={!ready}>
        Continue
      </button>
    </div>
  );
}

/** Screen 1 — the home / settling open. The greeting leads (big serif), with
 *  "How do you feel today?" beneath (smaller sage italic). The logo breathes,
 *  then Begin; the teaser is pinned to the bottom (matching the comp's home). */
function Intro({ name, onBegin }: { name: string | null; onBegin: () => void }) {
  const greeting = name ? `Welcome back, ${name}.` : "Welcome back.";
  return (
    <div className={`${styles.intro} fade`}>
      <div className={styles.introGroup}>
        <Image
          src={LOGO_SRC}
          alt="Ayurser — the tree of life"
          width={120}
          height={120}
          priority
          className={styles.settleMark}
        />
        <p className={styles.introWordmark}>Ayurser</p>
        <h1 className={`serif ${styles.introHeading}`}>{greeting}</h1>
        <p className={styles.lede}>How do you feel today?</p>
        <button className={styles.btn} onClick={onBegin}>
          Begin today&rsquo;s check-in
        </button>
      </div>
      <Teaser className={styles.introTeaser} />
    </div>
  );
}

/** The quiet footer teaser — kept, honestly "coming soon". Shared by the intro
 *  (pinned to the bottom) and the result screen. */
function Teaser({ className }: { className?: string }) {
  return (
    <div className={className ? `${styles.teaser} ${className}` : styles.teaser}>
      <div className={styles.teaserLinks}>
        <span className={styles.teaserLink}>Wisdom</span>
        <span className={styles.teaserDot} aria-hidden />
        <span className={styles.teaserLink}>Find a practitioner</span>
      </div>
      <p className={styles.teaserSoon}>Coming soon</p>
    </div>
  );
}

const STEP_WORDS = ["One", "Two", "Three", "Four", "Five"] as const;

/** Screen 2 — one of our five real questions, quiet progress, gentle back. */
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
    <div className="rise" key={step}>
      <div className={styles.seg} aria-hidden>
        {QUESTIONS.map((q, i) => (
          <span
            key={q.key}
            className={i === step ? styles.active : i < step ? styles.on : undefined}
          />
        ))}
      </div>
      <p className={styles.stepLabel}>
        {STEP_WORDS[step]} of {QUESTIONS.length}
      </p>
      <h2 className={`serif ${styles.question}`}>{question.prompt}</h2>
      <div className={styles.options}>
        {question.options.map((option, i) => (
          <button key={option.label} className={styles.opt} onClick={() => onChoose(step, i)}>
            {option.label}
          </button>
        ))}
      </div>
      <div>
        <button className={styles.back} onClick={onBack}>
          &larr;&nbsp;&nbsp;Back
        </button>
      </div>
    </div>
  );
}

/** The open door — after the five taps, an optional line in their own words.
 *  "How do you feel today?" answered in language, not just multiple choice.
 *  Never required: Continue (with or without words) and Skip both lead to the
 *  reading. We capture it now; the cited scan that reads these words comes next. */
function NoteView({
  onContinue,
  onSkip,
}: {
  onContinue: (note: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="rise">
      <h2 className={`serif ${styles.question}`}>Anything else?</h2>
      <p className={styles.noteSub}>
        In your own words &mdash; how you feel today. Only if you&rsquo;d like.
      </p>
      <textarea
        className={styles.noteField}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="a little bloated, skin feels dry, mind is busy…"
        aria-label="Anything else, in your own words"
        rows={4}
        maxLength={1000}
        autoFocus
      />
      <button className={styles.btn} onClick={() => onContinue(value.trim())}>
        Continue
      </button>
      <div>
        <button className={styles.back} onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}

/** Screen 3 — the result: read-out, one loud anchor, the quiet quartet, the
 *  epigraph, and the separated disclaimer. Plus the Wisdom card + teaser. */
function ResultView({ result, onAgain }: { result: Result; onAgain: () => void }) {
  const { guidance } = result;
  const [wisdomOpen, setWisdomOpen] = useState(false);

  return (
    <div className="fade">
      <div className={styles.card}>
        {/* The logo, small and faint, in the top-right corner of the card. */}
        <Image
          src={LOGO_SRC}
          alt=""
          width={40}
          height={40}
          aria-hidden
          className={styles.cardMark}
        />

        {/* The read-out — weather, not a label. */}
        <p className={styles.readKicker}>Today&rsquo;s reading</p>
        <p className={styles.readout}>{guidance.readout}</p>

        {/* ONE anchor, loud, in its own warm panel. */}
        <div className={styles.anchor}>
          <p className={styles.anchorKicker}>One thing today</p>
          <p className={styles.anchorText}>{guidance.anchor.text}</p>
          <Detail line={guidance.anchor} />
        </div>

        {/* The supporting quartet, quiet. */}
        <div className={styles.sections}>
          <GuidanceRow label="Eat" line={guidance.eat} />
          <GuidanceRow label="Ritual" line={guidance.ritual} />
          <GuidanceRow label="Breath" line={guidance.breath} />
          <GuidanceRow label="Move" line={guidance.move} />
        </div>

        {/* Wisdom, set as wisdom: a quiet serif epigraph, room to breathe. */}
        <figure className={styles.epigraph}>
          <blockquote className={styles.epigraphText}>&ldquo;{EPIGRAPH.text}&rdquo;</blockquote>
          <figcaption className={styles.epigraphCite}>{EPIGRAPH.attribution}</figcaption>
        </figure>

        {/* The legal note: separate, smaller, muted — clearly the footnote. */}
        <p className={styles.disclaimer}>{DISCLAIMER}</p>
      </div>

      {/* The opt-in "Wisdom" card — the dosha explainer lives BEHIND this tap,
          never up front. Experience first, explanation second. */}
      <div className={styles.wisdom}>
        <button
          type="button"
          className={styles.wisdomToggle}
          aria-expanded={wisdomOpen}
          onClick={() => setWisdomOpen((v) => !v)}
        >
          <span className={styles.wisdomTitle}>Wisdom — why we asked those questions</span>
          <span className={styles.wisdomCaret}>{wisdomOpen ? "–" : "+"}</span>
        </button>
        {wisdomOpen && (
          <div className={`${styles.wisdomBody} fade`}>
            <p>
              Ayurveda reads the body through its qualities. Sleep, energy, the body,
              digestion and the mind are five quiet windows onto how you&rsquo;re faring
              right now.
            </p>
            <p>
              When several lean dry and light, the day reads <em>wind-like</em> (Vata);
              warm and sharp reads <em>fire-like</em> (Pitta); heavy and slow,{" "}
              <em>earth-like</em> (Kapha). These three forces move through all of us —
              you&rsquo;re a blend, with one or two that tend to lead.
            </p>
            <p>
              Your <em>Prakriti</em> is your nature — the constitution you were born with.
              Your <em>Vikriti</em> is your weather — how that nature is faring today. We
              read the weather; we won&rsquo;t pin your nature from a few taps. That&rsquo;s
              a practitioner&rsquo;s trained eye.
            </p>
          </div>
        )}
      </div>

      {/* Practitioner teaser — kept, honestly "coming soon". */}
      <Teaser />

      <div className={styles.again}>
        <button className={styles.btn} onClick={onAgain}>
          Done
        </button>
      </div>
    </div>
  );
}

/** A quiet supporting line: Eat / Ritual / Breath / Move, with tappable depth. */
function GuidanceRow({ label, line }: { label: string; line: GuidanceLine }) {
  return (
    <div className={styles.row}>
      <div className={styles.lab}>{label}</div>
      <div className={styles.body}>
        <p className={styles.bodyText}>{line.text}</p>
        <Detail line={line} />
      </div>
    </div>
  );
}

/**
 * The restrained "More" affordance. Hidden until tapped: a subtle underlined
 * accent link reveals the paraphrased detail + its citation. No clutter.
 */
function Detail({ line }: { line: GuidanceLine }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.more}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Less" : "More"}
      </button>
      {open && (
        <div className={`${styles.detail} fade`}>
          <p className={styles.detailBody}>{line.detail}</p>
          {line.source !== "—" && <p className={styles.detailSrc}>{line.source}</p>}
        </div>
      )}
    </>
  );
}
