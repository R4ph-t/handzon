import { Check, X } from "lucide-react";
import { useId, useState } from "react";
import { useProgress } from "~/lib/progress/useProgress";

interface Props {
  question: string;
  options: string[];
  answer: number | number[];
  explanation?: string;
  id?: string;
  multi?: boolean;
}

export default function Quiz({ question, options, answer, explanation, id, multi }: Props) {
  const reactId = useId();
  const questionId = id ?? `quiz:${reactId}:${question.slice(0, 40)}`;
  const { state, recordQuiz } = useProgress();

  const previous = state.quizzes[questionId];
  const [chosen, setChosen] = useState<number[]>(previous?.chosen ?? []);
  const [submitted, setSubmitted] = useState<boolean>(!!previous);

  const correctSet = new Set(Array.isArray(answer) ? answer : [answer]);
  const expectMulti = multi ?? Array.isArray(answer);

  function toggle(i: number) {
    if (submitted) return;
    if (expectMulti) {
      setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
    } else {
      setChosen([i]);
    }
  }

  function submit() {
    const sorted = [...chosen].sort((a, b) => a - b);
    const correct = sorted.length === correctSet.size && sorted.every((v) => correctSet.has(v));
    recordQuiz(questionId, sorted, correct);
    setSubmitted(true);
  }

  function reset() {
    setChosen([]);
    setSubmitted(false);
  }

  return (
    <fieldset className="quiz" disabled={submitted}>
      <legend className="quiz-q">{question}</legend>
      <div className="quiz-options">
        {options.map((opt, i) => {
          const isChosen = chosen.includes(i);
          const isCorrect = submitted && correctSet.has(i);
          const wasWrong = submitted && isChosen && !correctSet.has(i);
          return (
            <label
              key={i}
              className={[
                "quiz-opt",
                isChosen ? "is-chosen" : "",
                isCorrect ? "is-correct" : "",
                wasWrong ? "is-wrong" : "",
              ].join(" ")}
            >
              <input
                type={expectMulti ? "checkbox" : "radio"}
                name={questionId}
                checked={isChosen}
                onChange={() => toggle(i)}
              />
              <span
                className={`quiz-opt-toggle quiz-opt-toggle--${expectMulti ? "multi" : "single"}`}
                aria-hidden="true"
              >
                {isCorrect ? <Check size={12} /> : wasWrong ? <X size={12} /> : null}
              </span>
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
      <div className="quiz-actions">
        {!submitted && (
          <button type="button" onClick={submit} disabled={chosen.length === 0}>
            Check
          </button>
        )}
        {submitted && (
          <button type="button" onClick={reset}>
            Try again
          </button>
        )}
        {submitted && (
          <span className={previous?.correct ? "quiz-msg ok" : "quiz-msg no"}>
            {previous?.correct ? "Correct" : "Not quite"}
          </span>
        )}
      </div>
      {submitted && explanation && <p className="quiz-exp">{explanation}</p>}
    </fieldset>
  );
}
