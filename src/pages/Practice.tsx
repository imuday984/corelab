import { useEffect, useMemo, useState } from "react"; // Manage practice answers and the live assessment clock.
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"; // Connect quiz setup, results, and relevant learning material.
import { // Continue this clearly scoped calculation or control declaration.
    ArrowRight, // Continue this clearly scoped calculation or control declaration.
    Check, // Continue this clearly scoped calculation or control declaration.
    CheckCircle2, // Continue this clearly scoped calculation or control declaration.
    Clock3, // Continue this clearly scoped calculation or control declaration.
    HelpCircle, // Continue this clearly scoped calculation or control declaration.
    RotateCcw, // Continue this clearly scoped calculation or control declaration.
    Sparkles, // Continue this clearly scoped calculation or control declaration.
    Target, // Continue this clearly scoped calculation or control declaration.
    XCircle, // Continue this clearly scoped calculation or control declaration.
} from "lucide-react"; // Use a consistent visual language for outcomes.
import { useWorkspace } from "../lib/store"; // Save attempts and scores through the same data layer as the dashboard.
import type { Attempt, Difficulty, Question, Topic } from "../../shared/types"; // Keep practice behavior aligned with curriculum types.

const levels: Difficulty[] = ["Easy", "Medium", "Hard"]; // Keep every checkpoint difficulty directly accessible.

function CheckpointQuestion({ topic, question }: { topic: Topic; question: Question }) { // Continue this clearly scoped calculation or control declaration.
    // Isolate one answer form and its feedback.
    const { attempt, workspace, notify } = useWorkspace(); // Read real attempt history and the shared submission action.
    const [answer, setAnswer] = useState(""); // Preserve the learner's in-progress response.
    const [showHint, setShowHint] = useState(false); // Reveal assistance only when requested.
    const [compared, setCompared] = useState(false); // Keep descriptive reference answers hidden until an answer exists.
    const [result, setResult] = useState<Attempt | null>(null); // Display the outcome of this submission.
    const [busy, setBusy] = useState(false); // Prevent accidental duplicate attempts.
    const history = workspace.attempts.filter((item) => item.questionId === question.id); // Preserve previous attempts separately from the current form.
    async function submit(selfRating?: boolean) { // Continue this clearly scoped calculation or control declaration.
        // Save an answer while leaving MCQ correctness to the server.
        if (!answer.trim() || busy) return; // Require a meaningful response before creating an attempt.
        setBusy(true); // Disable submission while the request runs.
        try { // Run the operation while preserving a recoverable error path.
            const saved = await attempt(topic.id, question.id, answer, selfRating); // Calculate or retain this value for the current render.
            setResult(saved); // Update the corresponding local interface state.
            setCompared(true); // Update the corresponding local interface state.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Your answer could not be saved."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Show the recorded result or a useful error.
            setBusy(false); // Update the corresponding local interface state.
        } // Restore the controls after the request completes.
    } // Finish the answer submission handler.
    function restart() { // Continue this clearly scoped calculation or control declaration.
        setResult(null); // Update the corresponding local interface state.
        setCompared(false); // Update the corresponding local interface state.
        setAnswer(""); // Update the corresponding local interface state.
        setShowHint(false); // Update the corresponding local interface state.
    } // Clear only the current form while retaining history.
    return ( // Return the value or interface produced by this function.
        // Render one accessible checkpoint form.
        <article className="panel checkpoint-question"> {/* Keep this learning item self-contained. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Separate each question into its own study card. */}
            <div className="row-between"> {/* Group this section of the interface. */}
                <span className={`badge difficulty-${question.difficulty.toLowerCase()}`}> {/* Display this compact piece of interface information. */}
                    {question.difficulty} ·{" "} {/* Render this expression using the current application state. */}
                    {question.type === "mcq" // Render this expression using the current application state.
                        ? "Multiple choice" // Choose the content appropriate to the current state.
                        : question.type === "sql" // Choose the content appropriate to the current state.
                          ? "SQL practice" // Choose the content appropriate to the current state.
                          : "Written response"} {/* Choose the content appropriate to the current state. */}
                </span> {/* Finish this interface element. */}
                <span className="muted small"> {/* Display this compact piece of interface information. */}
                    {history.length} {history.length === 1 ? "attempt" : "attempts"} {/* Render this expression using the current application state. */}
                </span> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Describe the task and retained attempt count. */}
            <h3>{question.prompt}</h3> {/* Present the exact curriculum question. */}
            {question.type === "mcq" ? ( // Render this expression using the current application state.
                <fieldset className="answer-options"> {/* Group related answer choices accessibly. */}
                    <legend className="sr-only">Choose your answer</legend> {/* Name this group of related answer choices. */}
                    {question.options?.map((option, index) => ( // Render this expression using the current application state.
                        <label // Associate an accessible name with this control.
                            key={option} // Give React a stable identity for this repeated item.
                            className={`answer-option ${answer === option ? "selected" : ""}`} // Apply the shared presentation styles to this element.
                        > {/* Display this part of the current learning interface. */}
                            <input // Collect the learner input shown here.
                                type="radio" // Select the appropriate native form control behavior.
                                name={question.id} // Keep related native answer inputs grouped together.
                                value={option} // Keep the displayed control value synchronized with state.
                                checked={answer === option} // Reflect the current selection in this native radio control.
                                disabled={!!result || busy} // Prevent this action while its required conditions are unmet.
                                onChange={() => setAnswer(option)} // Update local form state when this value changes.
                            /> {/* Display this part of the current learning interface. */}
                            <span className="option-letter">{String.fromCharCode(65 + index)}</span> {/* Display this compact piece of interface information. */}
                            <span>{option}</span> {/* Display this compact piece of interface information. */}
                        </label> // Finish this interface element.
                    ))} {/* Finish this rendered expression or container. */}
                </fieldset> // Finish this interface element.
            ) : ( // Continue this clearly scoped calculation or control declaration.
                <label className="form-field"> {/* Associate an accessible name with this control. */}
                    <span className="small muted">Your answer</span> {/* Display this compact piece of interface information. */}
                    <textarea // Allow the learner to write and edit a response.
                        className="textarea" // Apply the shared presentation styles to this element.
                        rows={question.type === "sql" ? 7 : 5} // Reserve a comfortable initial height for written responses.
                        value={answer} // Keep the displayed control value synchronized with state.
                        onChange={(event) => setAnswer(event.target.value)} // Update local form state when this value changes.
                        disabled={!!result || busy} // Prevent this action while its required conditions are unmet.
                        placeholder={ // Suggest the kind of response expected by this field.
                            question.type === "sql" // Continue this clearly scoped calculation or control declaration.
                                ? "Write your SQL query here…" // Choose the content appropriate to the current state.
                                : "Explain your reasoning in your own words…" // Choose the content appropriate to the current state.
                        } // Finish the current expression or code block.
                    /> {/* Display this part of the current learning interface. */}
                </label> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Keep MCQ options and written answers keyboard accessible. */}
            {showHint && ( // Render this expression using the current application state.
                <p className="hint-box"> {/* Explain the adjacent learning content or action. */}
                    <HelpCircle size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    {question.hint} {/* Render this expression using the current application state. */}
                </p> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Offer the author-provided hint without changing correctness. */}
            <div className="action-buttons"> {/* Group this section of the interface. */}
                <button className="button ghost" onClick={() => setShowHint(!showHint)}> {/* Offer this explicit learner action. */}
                    <HelpCircle size={15} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    {showHint ? "Hide hint" : "Show hint"} {/* Render this expression using the current application state. */}
                </button> {/* Finish this interface element. */}
                {!result && question.type === "mcq" && ( // Render this expression using the current application state.
                    <button // Offer this explicit learner action.
                        className="button primary" // Apply the shared presentation styles to this element.
                        disabled={!answer || busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => void submit()} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        {busy ? "Checking…" : "Check answer"} {/* Render this expression using the current application state. */}
                        <ArrowRight size={15} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    </button> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
                {!result && question.type !== "mcq" && !compared && ( // Render this expression using the current application state.
                    <button // Offer this explicit learner action.
                        className="button primary" // Apply the shared presentation styles to this element.
                        disabled={!answer.trim()} // Prevent this action while its required conditions are unmet.
                        onClick={() => { // Run this action when the learner activates the control.
                            setCompared(true); // Update the corresponding local interface state.
                            void submit(); // Continue this clearly scoped calculation or control declaration.
                        }} // Finish the current expression or code block.
                    > {/* Display this part of the current learning interface. */}
                        Save and compare <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                    </button> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Keep grading explicit instead of marking any submitted answer correct. */}
            {compared && ( // Render this expression using the current application state.
                <div // Group this section of the interface.
                    className={`answer-feedback ${result?.correct === true ? "correct" : result?.correct === false ? "incorrect" : "ungraded"}`} // Apply the shared presentation styles to this element.
                > {/* Display this part of the current learning interface. */}
                    <h4> {/* Label this explanation or feedback message. */}
                        {result?.correct === true ? ( // Render this expression using the current application state.
                            <> {/* Group these related elements without adding a layout wrapper. */}
                                <CheckCircle2 size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                Correct answer {/* Display this part of the current learning interface. */}
                            </> // Finish this interface element.
                        ) : result?.correct === false ? ( // Continue this clearly scoped calculation or control declaration.
                            <> {/* Group these related elements without adding a layout wrapper. */}
                                <XCircle size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                Keep practicing {/* Display this part of the current learning interface. */}
                            </> // Finish this interface element.
                        ) : ( // Continue this clearly scoped calculation or control declaration.
                            <> {/* Group these related elements without adding a layout wrapper. */}
                                <Target size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                Compare your reasoning {/* Display this part of the current learning interface. */}
                            </> // Finish this interface element.
                        )} {/* Finish this rendered expression or container. */}
                    </h4> {/* Finish this interface element. */}
                    <p> {/* Explain the adjacent learning content or action. */}
                        <strong>Reference answer:</strong> {question.answer} {/* Emphasize this important value or label. */}
                    </p> {/* Finish this interface element. */}
                    <p>{question.explanation}</p> {/* Explain the adjacent learning content or action. */}
                    {question.type !== "mcq" && result?.correct == null && ( // Render this expression using the current application state.
                        <> {/* Group these related elements without adding a layout wrapper. */}
                            <p className="small muted"> {/* Explain the adjacent learning content or action. */}
                                Written responses are not automatically graded. Compare your reasoning, then {/* Display this part of the current learning interface. */}
                                record your own assessment. {/* Display this part of the current learning interface. */}
                            </p> {/* Finish this interface element. */}
                            <div className="action-buttons"> {/* Group this section of the interface. */}
                                <button // Offer this explicit learner action.
                                    className="button secondary" // Apply the shared presentation styles to this element.
                                    disabled={busy} // Prevent this action while its required conditions are unmet.
                                    onClick={() => void submit(false)} // Run this action when the learner activates the control.
                                > {/* Display this part of the current learning interface. */}
                                    Needs more practice {/* Display this part of the current learning interface. */}
                                </button> {/* Finish this interface element. */}
                                <button // Offer this explicit learner action.
                                    className="button secondary" // Apply the shared presentation styles to this element.
                                    disabled={busy} // Prevent this action while its required conditions are unmet.
                                    onClick={() => void submit(true)} // Run this action when the learner activates the control.
                                > {/* Display this part of the current learning interface. */}
                                    <Check size={15} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                    My answer is correct {/* Display this part of the current learning interface. */}
                                </button> {/* Finish this interface element. */}
                            </div> {/* Finish this interface element. */}
                        </> // Finish this interface element.
                    )} {/* Finish this rendered expression or container. */}
                    <button className="button ghost" onClick={restart}> {/* Offer this explicit learner action. */}
                        <RotateCcw size={14} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        Try again {/* Display this part of the current learning interface. */}
                    </button> {/* Finish this interface element. */}
                </div> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Explain the outcome and support deliberate descriptive self-assessment. */}
            {history.length > 0 && ( // Render this expression using the current application state.
                <details className="attempt-history"> {/* Keep supporting explanations expandable. */}
                    <summary>View attempt history ({history.length})</summary> {/* Provide the keyboard-accessible disclosure label. */}
                    {[...history] // Render this expression using the current application state.
                        .reverse() // Continue the transformation of this collection.
                        .slice(0, 8) // Continue the transformation of this collection.
                        .map((item) => ( // Continue the transformation of this collection.
                            <div key={item.id} className="history-item"> {/* Group this section of the interface. */}
                                <span className="small muted"> {/* Display this compact piece of interface information. */}
                                    {new Date(item.createdAt).toLocaleDateString()} ·{" "} {/* Render this expression using the current application state. */}
                                    {item.correct === null // Render this expression using the current application state.
                                        ? "Unassessed" // Choose the content appropriate to the current state.
                                        : item.correct // Choose the content appropriate to the current state.
                                          ? "Correct" // Choose the content appropriate to the current state.
                                          : "Needs practice"} {/* Choose the content appropriate to the current state. */}
                                </span> {/* Finish this interface element. */}
                                <p>{item.answer}</p> {/* Explain the adjacent learning content or action. */}
                            </div> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                </details> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Let learners review earlier reasoning without overwriting it. */}
        </article> // End the checkpoint question card.
    ); // Return this question's complete practice form.
} // Finish the individual checkpoint component.

export function CheckpointPanel({ topic }: { topic: Topic }) { // Continue this clearly scoped calculation or control declaration.
    // Reuse the same practice tabs on topic and checkpoint pages.
    const { workspace } = useWorkspace(); // Calculate recommendations from actual attempts.
    const [difficulty, setDifficulty] = useState<Difficulty>("Easy"); // Start with a recommendation while leaving all tabs accessible.
    const attempts = workspace.attempts.filter((item) => item.topicId === topic.id && item.correct !== null); // Exclude unassessed responses from accuracy.
    const questions = topic.questions.filter((question) => question.difficulty === difficulty); // Show the selected level's curriculum questions.
    const scored = attempts.filter((item) => item.difficulty === difficulty); // Compute level-specific performance.
    const accuracy = scored.length // Calculate or retain this value for the current render.
        ? Math.round((scored.filter((item) => item.correct).length / scored.length) * 100) // Choose the content appropriate to the current state.
        : null; // Use an empty state before sufficient evidence exists.
    return ( // Return the value or interface produced by this function.
        // Render difficulty selection and its matching questions.
        <section className="checkpoint-panel"> {/* Present a distinct section of study content. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep the embedded practice experience self-contained. */}
            <div className="panel practice-intro"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">UNDERSTANDING THROUGH PRACTICE</p> {/* Explain the adjacent learning content or action. */}
                    <h2>Put your knowledge to work.</h2> {/* Introduce this group of related information. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        Start with the basics or jump straight into a challenge. Every level is open. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <span className="practice-orbit"> {/* Display this compact piece of interface information. */}
                    <Target size={30} aria-hidden="true" /> {/* Render this reusable visual component. */}
                </span> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Explain accessible progression without forcing an order. */}
            <div className="tabs" role="tablist" aria-label="Checkpoint difficulty"> {/* Group this section of the interface. */}
                {levels.map((level) => ( // Render this expression using the current application state.
                    <button // Offer this explicit learner action.
                        className={`tab ${difficulty === level ? "active" : ""}`} // Apply the shared presentation styles to this element.
                        role="tab" // Declare this element’s semantic interaction role.
                        aria-selected={difficulty === level} // Expose the control state or purpose to assistive technology.
                        key={level} // Give React a stable identity for this repeated item.
                        onClick={() => setDifficulty(level)} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        {level} {/* Render this expression using the current application state. */}
                        <span className="tab-count"> {/* Display this compact piece of interface information. */}
                            {topic.questions.filter((question) => question.difficulty === level).length} {/* Render this expression using the current application state. */}
                        </span> {/* Finish this interface element. */}
                    </button> // Finish this interface element.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Show all difficulty levels as directly selectable tabs. */}
            <p className="muted small practice-summary"> {/* Explain the adjacent learning content or action. */}
                {accuracy === null // Render this expression using the current application state.
                    ? "No assessed attempts at this level yet. Your first answer starts the story." // Choose the content appropriate to the current state.
                    : `${accuracy}% accuracy across ${scored.length} assessed ${scored.length === 1 ? "attempt" : "attempts"}.`} {/* Choose the content appropriate to the current state. */}
                {accuracy !== null && // Render this expression using the current application state.
                    accuracy < 70 && // Continue this clearly scoped calculation or control declaration.
                    " Revisit the explanation and examples before trying again."} {/* Display this part of the current learning interface. */}
            </p>{" "} {/* Finish this interface element. */}
            {/* Recommend revision only from real evidence. */}
            <div className="question-stack"> {/* Group this section of the interface. */}
                {questions.map((question) => ( // Render this expression using the current application state.
                    <CheckpointQuestion // Render this reusable visual component.
                        key={`${topic.id}-${question.id}`} // Give React a stable identity for this repeated item.
                        topic={topic} // Continue this clearly scoped calculation or control declaration.
                        question={question} // Continue this clearly scoped calculation or control declaration.
                    /> // Continue this clearly scoped calculation or control declaration.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Preserve independent answer state for each stable question. */}
            {!questions.length && ( // Render this expression using the current application state.
                <div className="empty-state"> {/* Group this section of the interface. */}
                    There are no {difficulty.toLowerCase()} checkpoints for this topic yet. {/* Display this part of the current learning interface. */}
                </div> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Explain incomplete curriculum content honestly. */}
        </section> // End the practice panel.
    ); // Return the shared checkpoint interface.
} // Finish the reusable practice component.

export function CheckpointsPage() { // Continue this clearly scoped calculation or control declaration.
    // Allow focused practice across the curriculum.
    const { topics, subjects } = useWorkspace(); // Load complete curriculum metadata.
    const [subjectId, setSubjectId] = useState("all"); // Begin with the full subject catalog.
    const [topicId, setTopicId] = useState(topics[0]?.id ?? ""); // Select a useful initial topic.
    const filtered = topics.filter((topic) => subjectId === "all" || topic.subjectId === subjectId); // Restrict topic choices to the chosen subject.
    const current = filtered.find((topic) => topic.id === topicId) ?? filtered[0]; // Recover when changing subjects invalidates the current topic.
    return ( // Return the value or interface produced by this function.
        <div className="learning-page"> {/* Group this section of the interface. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">PRACTICE WITH PURPOSE</p> {/* Explain the adjacent learning content or action. */}
                    <h1>Check your understanding.</h1> {/* State the main purpose of this screen. */}
                    <p className="muted">Definitions are a start. Reasoning is what makes them stick.</p> {/* Explain the adjacent learning content or action. */}
                </div> {/* Finish this interface element. */}
            </div> {/* Finish this interface element. */}
            <div className="panel filter-bar"> {/* Group this section of the interface. */}
                <label className="form-field"> {/* Associate an accessible name with this control. */}
                    <span>Subject</span> {/* Display this compact piece of interface information. */}
                    <select // Let the learner choose among the available options.
                        className="select" // Apply the shared presentation styles to this element.
                        value={subjectId} // Keep the displayed control value synchronized with state.
                        onChange={(event) => setSubjectId(event.target.value)} // Update local form state when this value changes.
                    > {/* Display this part of the current learning interface. */}
                        <option value="all">All subjects</option> {/* Provide one valid selection value. */}
                        {subjects.map((subject) => ( // Render this expression using the current application state.
                            <option key={subject.id} value={subject.id}> {/* Provide one valid selection value. */}
                                {subject.title} {/* Render this expression using the current application state. */}
                            </option> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </select> {/* Finish this interface element. */}
                </label> {/* Finish this interface element. */}
                <label className="form-field grow"> {/* Associate an accessible name with this control. */}
                    <span>Topic</span> {/* Display this compact piece of interface information. */}
                    <select // Let the learner choose among the available options.
                        className="select" // Apply the shared presentation styles to this element.
                        value={current?.id ?? ""} // Keep the displayed control value synchronized with state.
                        onChange={(event) => setTopicId(event.target.value)} // Update local form state when this value changes.
                    > {/* Display this part of the current learning interface. */}
                        {filtered.map((topic) => ( // Render this expression using the current application state.
                            <option key={topic.id} value={topic.id}> {/* Provide one valid selection value. */}
                                {topic.title} {/* Render this expression using the current application state. */}
                            </option> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </select> {/* Finish this interface element. */}
                </label> {/* Finish this interface element. */}
                {current && ( // Render this expression using the current application state.
                    <Link className="button secondary" to={`/learn/${current.id}`}> {/* Connect this item to its application route. */}
                        Review learning material <ArrowRight size={14} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                    </Link> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </div> {/* Finish this interface element. */}
            {current && <CheckpointPanel key={current.id} topic={current} />} {/* Render this expression using the current application state. */}
        </div> // Finish this interface element.
    ); // Provide actual topic selection and reusable checkpoints.
} // Finish the global checkpoint page.

interface QuizQuestion { // Continue this clearly scoped calculation or control declaration.
    topic: Topic; // Define this field in the shared component or request contract.
    question: Question; // Define this field in the shared component or request contract.
} // Keep the question connected to its source topic for revision.

function shuffle<T>(items: T[]) { // Continue this clearly scoped calculation or control declaration.
    // Randomize questions using an unbiased Fisher–Yates shuffle.
    const result = [...items]; // Avoid mutating shared curriculum data.
    for (let index = result.length - 1; index > 0; index -= 1) { // Continue this clearly scoped calculation or control declaration.
        const random = Math.floor(Math.random() * (index + 1)); // Calculate or retain this value for the current render.
        [result[index], result[random]] = [result[random], result[index]]; // Continue this clearly scoped calculation or control declaration.
    } // Exchange each position with a uniformly chosen remaining position.
    return result; // Return a fresh randomized question order.
} // Finish the randomization helper.

export function QuizzesPage() { // Continue this clearly scoped calculation or control declaration.
    // Offer timed assessments and a conceptual mock interview mode.
    const { topics, subjects, workspace, submitQuiz, notify, demo, api } = useWorkspace(); // Load the question pool and retained assessment history.
    const [params] = useSearchParams(); // Support assessments launched from an individual topic.
    const navigate = useNavigate(); // Open the actual saved result after submission.
    const requestedTopic = topics.find((topic) => topic.id === params.get("topic")); // Resolve optional topic-specific context.
    const [subjectId, setSubjectId] = useState(requestedTopic?.subjectId ?? "all"); // Preselect the appropriate subject when launched from a lesson.
    const [difficulty, setDifficulty] = useState("all"); // Include all levels unless the learner narrows the assessment.
    const [mode, setMode] = useState<"quiz" | "interview">("quiz"); // Distinguish automatically scored MCQs from unscored interview rehearsal.
    const [questions, setQuestions] = useState<QuizQuestion[]>([]); // Freeze the randomized question set once an assessment starts.
    const [answers, setAnswers] = useState<Record<string, string>>({}); // Preserve selections while moving between questions.
    const [position, setPosition] = useState(0); // Present one question at a time.
    const [startedAt, setStartedAt] = useState<number | null>(null); // Record elapsed time independently of UI updates.
    const [seconds, setSeconds] = useState(0); // Update the visible assessment clock once per second.
    const [busy, setBusy] = useState(false); // Prevent duplicate result submissions.
    const [quizId, setQuizId] = useState<string | undefined>(); // Preserve the server-owned assessment identity for secure submission.
    const [reveal, setReveal] = useState(false); // Keep interview reference answers hidden during rehearsal.
    useEffect(() => { // Continue this clearly scoped calculation or control declaration.
        if (startedAt === null) return; // Handle this condition before continuing the normal flow.
        const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000); // Calculate or retain this value for the current render.
        return () => window.clearInterval(timer); // Return the value or interface produced by this function.
    }, [startedAt]); // Clean up the clock whenever the assessment ends or the screen unmounts.
    const pool = useMemo( // Calculate or retain this value for the current render.
        () => // Continue this clearly scoped calculation or control declaration.
            topics // Continue this clearly scoped calculation or control declaration.
                .filter((topic) => // Continue the transformation of this collection.
                    requestedTopic // Continue this clearly scoped calculation or control declaration.
                        ? topic.id === requestedTopic.id // Choose the content appropriate to the current state.
                        : subjectId === "all" || topic.subjectId === subjectId, // Choose the content appropriate to the current state.
                ) // Finish the current expression or code block.
                .flatMap((topic) => // Continue the transformation of this collection.
                    topic.questions // Continue this clearly scoped calculation or control declaration.
                        .filter( // Continue the transformation of this collection.
                            (question) => // Continue this clearly scoped calculation or control declaration.
                                (difficulty === "all" || question.difficulty === difficulty) && // Continue this clearly scoped calculation or control declaration.
                                (mode === "quiz" ? question.type === "mcq" : question.type !== "mcq"), // Continue this clearly scoped calculation or control declaration.
                        ) // Finish the current expression or code block.
                        .map((question) => ({ topic, question })), // Continue the transformation of this collection.
                ), // Finish the current expression or code block.
        [topics, requestedTopic, subjectId, difficulty, mode], // Continue this clearly scoped calculation or control declaration.
    ); // Build the assessment pool from real curriculum questions.
    async function start() { // Continue this clearly scoped calculation or control declaration.
        // Let the server select scored account questions while retaining independent local rehearsal.
        setBusy(true); // Prevent duplicate assessment creation.
        try { // Run the operation while preserving a recoverable error path.
            // Keep the setup screen available when an API request fails.
            let selected = shuffle(pool).slice(0, mode === "interview" ? 5 : 10); // Use honest device-local practice for anonymous sessions and mock interviews.
            let started = Date.now(); // Start the local rehearsal clock immediately.
            if (!demo && mode === "quiz") { // Handle this condition before continuing the normal flow.
                // Use a server-owned question selection for authenticated scored assessments.
                const session = await api<{ // Calculate or retain this value for the current render.
                    id: string; // Define this field in the shared component or request contract.
                    questions: (Question & { topicId: string })[]; // Define this field in the shared component or request contract.
                    startedAt: string; // Define this field in the shared component or request contract.
                    expiresAt: string; // Define this field in the shared component or request contract.
                }>("/quizzes/start", "POST", { // Finish this expression or rendered group.
                    subjectId, // Continue this clearly scoped calculation or control declaration.
                    ...(requestedTopic ? { topicId: requestedTopic.id } : {}), // Continue the transformation of this collection.
                    difficulty, // Continue this clearly scoped calculation or control declaration.
                    count: Math.min(pool.length, 10), // Define this field in the shared component or request contract.
                }); // Create one bounded timed assessment.
                selected = session.questions.flatMap((question) => { // Continue this clearly scoped calculation or control declaration.
                    const topic = topics.find((item) => item.id === question.topicId); // Calculate or retain this value for the current render.
                    return topic ? [{ topic, question }] : []; // Return the value or interface produced by this function.
                }); // Preserve each server-selected question's topic association.
                setQuizId(session.id); // Submit the exact server session instead of a client-selected question list.
                started = new Date(session.startedAt).getTime(); // Base elapsed time on the server-recorded start.
            } else setQuizId(undefined); // Keep anonymous practice separate from secured assessment sessions.
            setQuestions(selected); // Update the corresponding local interface state.
            setAnswers({}); // Update the corresponding local interface state.
            setPosition(0); // Update the corresponding local interface state.
            setSeconds(0); // Update the corresponding local interface state.
            setReveal(false); // Update the corresponding local interface state.
            setStartedAt(started); // Enter the focused assessment with clean answer state.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Unable to start this assessment."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Surface validation or service failures without losing setup choices.
            setBusy(false); // Update the corresponding local interface state.
        } // Restore the setup controls after initialization.
    } // Finish assessment initialization.

    async function finish() { // Continue this clearly scoped calculation or control declaration.
        // Save scored assessment results through the server.
        if (busy || !questions.length) return; // Avoid empty or duplicate assessment submissions.
        setBusy(true); // Disable the finish action while saving.
        try { // Run the operation while preserving a recoverable error path.
            const result = await submitQuiz({ // Calculate or retain this value for the current render.
                quizId, // Continue this clearly scoped calculation or control declaration.
                subjectId, // Continue this clearly scoped calculation or control declaration.
                ...(requestedTopic ? { topicId: requestedTopic.id } : {}), // Continue the transformation of this collection.
                answers: questions.map(({ topic, question }) => ({ // Define this field in the shared component or request contract.
                    topicId: topic.id, // Define this field in the shared component or request contract.
                    questionId: question.id, // Define this field in the shared component or request contract.
                    answer: answers[question.id] ?? "", // Define this field in the shared component or request contract.
                })), // Finish the current expression or code block.
                seconds: Math.max(1, Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000)), // Define this field in the shared component or request contract.
            }); // Finish the current expression or code block.
            setStartedAt(null); // Update the corresponding local interface state.
            navigate(`/quizzes/result/${result.id}`); // Continue this clearly scoped calculation or control declaration.
        } catch (error) { // Finish this expression or rendered group.
            notify( // Continue this clearly scoped calculation or control declaration.
                error instanceof Error // Continue this clearly scoped calculation or control declaration.
                    ? error.message // Choose the content appropriate to the current state.
                    : "Unable to save this assessment. Your answers are still here.", // Choose the content appropriate to the current state.
            ); // Finish the current expression or code block.
        } finally { // Finish this expression or rendered group.
            // Retain answers when the request fails.
            setBusy(false); // Update the corresponding local interface state.
        } // Restore the finish action after saving completes.
    } // Finish the quiz submission handler.
    const current = questions[position]; // Resolve the active question after initialization.
    if (startedAt !== null && current) // Handle this condition before continuing the normal flow.
        return ( // Return the value or interface produced by this function.
            // Replace setup with a focused one-question assessment view.
            <div className="learning-page quiz-workspace"> {/* Group this section of the interface. */}
                {" "} {/* Render this expression using the current application state. */}
                {/* Keep the active assessment free of dashboard clutter. */}
                <div className="page-heading"> {/* Group this section of the interface. */}
                    <div> {/* Group this section of the interface. */}
                        <p className="eyebrow">{mode === "quiz" ? "TIMED ASSESSMENT" : "MOCK INTERVIEW"}</p> {/* Explain the adjacent learning content or action. */}
                        <h1> {/* State the main purpose of this screen. */}
                            {requestedTopic?.title ?? // Render this expression using the current application state.
                                (subjectId === "all" // Continue this clearly scoped calculation or control declaration.
                                    ? "CS fundamentals" // Choose the content appropriate to the current state.
                                    : subjects.find((subject) => subject.id === subjectId)?.title)} {/* Choose the content appropriate to the current state. */}
                        </h1> {/* Finish this interface element. */}
                    </div> {/* Finish this interface element. */}
                    <span className="badge"> {/* Display this compact piece of interface information. */}
                        <Clock3 size={15} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} {/* Render this expression using the current application state. */}
                    </span> {/* Finish this interface element. */}
                </div>{" "} {/* Finish this interface element. */}
                {/* Show real elapsed time and assessment scope. */}
                <div className="row-between small muted"> {/* Group this section of the interface. */}
                    <span> {/* Display this compact piece of interface information. */}
                        Question {position + 1} of {questions.length} {/* Display this part of the current learning interface. */}
                    </span> {/* Finish this interface element. */}
                    <span>{Object.keys(answers).length} answered</span> {/* Display this compact piece of interface information. */}
                </div> {/* Finish this interface element. */}
                <div className="progress-track"> {/* Group this section of the interface. */}
                    <span // Display this compact piece of interface information.
                        className="progress-fill" // Apply the shared presentation styles to this element.
                        style={{ width: `${((position + 1) / questions.length) * 100}%` }} // Derive this visual value from the current learning data.
                    /> {/* Display this part of the current learning interface. */}
                </div>{" "} {/* Finish this interface element. */}
                {/* Indicate assessment position without revealing correctness. */}
                <section className="panel checkpoint-question"> {/* Present a distinct section of study content. */}
                    <div className="row-between"> {/* Group this section of the interface. */}
                        <span className="badge">{current.question.difficulty}</span> {/* Display this compact piece of interface information. */}
                        <span className="muted small">{current.topic.title}</span> {/* Display this compact piece of interface information. */}
                    </div> {/* Finish this interface element. */}
                    <h2>{current.question.prompt}</h2> {/* Introduce this group of related information. */}
                    {mode === "quiz" ? ( // Render this expression using the current application state.
                        <fieldset className="answer-options"> {/* Group related answer choices accessibly. */}
                            <legend className="sr-only">Select an answer for question {position + 1}</legend> {/* Name this group of related answer choices. */}
                            {current.question.options?.map((option, index) => ( // Render this expression using the current application state.
                                <label // Associate an accessible name with this control.
                                    className={`answer-option ${answers[current.question.id] === option ? "selected" : ""}`} // Apply the shared presentation styles to this element.
                                    key={option} // Give React a stable identity for this repeated item.
                                > {/* Display this part of the current learning interface. */}
                                    <input // Collect the learner input shown here.
                                        type="radio" // Select the appropriate native form control behavior.
                                        name={`quiz-${current.question.id}`} // Keep related native answer inputs grouped together.
                                        checked={answers[current.question.id] === option} // Reflect the current selection in this native radio control.
                                        onChange={() => // Update local form state when this value changes.
                                            setAnswers({ ...answers, [current.question.id]: option }) // Update the corresponding local interface state.
                                        } // Finish the current expression or code block.
                                    /> {/* Display this part of the current learning interface. */}
                                    <span className="option-letter">{String.fromCharCode(65 + index)}</span> {/* Display this compact piece of interface information. */}
                                    <span>{option}</span> {/* Display this compact piece of interface information. */}
                                </label> // Finish this interface element.
                            ))} {/* Finish this rendered expression or container. */}
                        </fieldset> // Finish this interface element.
                    ) : ( // Continue this clearly scoped calculation or control declaration.
                        <> {/* Group these related elements without adding a layout wrapper. */}
                            <label className="form-field"> {/* Associate an accessible name with this control. */}
                                <span>Your interview answer</span> {/* Display this compact piece of interface information. */}
                                <textarea // Allow the learner to write and edit a response.
                                    className="textarea" // Apply the shared presentation styles to this element.
                                    rows={7} // Reserve a comfortable initial height for written responses.
                                    value={answers[current.question.id] ?? ""} // Keep the displayed control value synchronized with state.
                                    onChange={(event) => // Update local form state when this value changes.
                                        setAnswers({ ...answers, [current.question.id]: event.target.value }) // Update the corresponding local interface state.
                                    } // Finish the current expression or code block.
                                    placeholder="Speak your answer aloud, then capture the main points…" // Suggest the kind of response expected by this field.
                                /> {/* Display this part of the current learning interface. */}
                            </label> {/* Finish this interface element. */}
                            <button className="button secondary" onClick={() => setReveal(!reveal)}> {/* Offer this explicit learner action. */}
                                {reveal ? "Hide reference" : "Compare with reference"} {/* Render this expression using the current application state. */}
                            </button> {/* Finish this interface element. */}
                            {reveal && ( // Render this expression using the current application state.
                                <div className="answer-feedback ungraded"> {/* Group this section of the interface. */}
                                    <p>{current.question.answer}</p> {/* Explain the adjacent learning content or action. */}
                                    <p>{current.question.explanation}</p> {/* Explain the adjacent learning content or action. */}
                                    <p className="small muted"> {/* Explain the adjacent learning content or action. */}
                                        Interview rehearsal is unscored. Your text stays in this session; use {/* Display this part of the current learning interface. */}
                                        checkpoints to save a self-assessed answer. {/* Display this part of the current learning interface. */}
                                    </p> {/* Finish this interface element. */}
                                </div> // Finish this interface element.
                            )} {/* Finish this rendered expression or container. */}
                        </> // Finish this interface element.
                    )} {/* Finish this rendered expression or container. */}
                    <div className="quiz-navigation"> {/* Group this section of the interface. */}
                        <button // Offer this explicit learner action.
                            className="button secondary" // Apply the shared presentation styles to this element.
                            disabled={position === 0 || busy} // Prevent this action while its required conditions are unmet.
                            onClick={() => { // Run this action when the learner activates the control.
                                setPosition(position - 1); // Update the corresponding local interface state.
                                setReveal(false); // Update the corresponding local interface state.
                            }} // Finish the current expression or code block.
                        > {/* Display this part of the current learning interface. */}
                            Previous {/* Display this part of the current learning interface. */}
                        </button> {/* Finish this interface element. */}
                        {position < questions.length - 1 ? ( // Render this expression using the current application state.
                            <button // Offer this explicit learner action.
                                className="button primary" // Apply the shared presentation styles to this element.
                                onClick={() => { // Run this action when the learner activates the control.
                                    setPosition(position + 1); // Update the corresponding local interface state.
                                    setReveal(false); // Update the corresponding local interface state.
                                }} // Finish the current expression or code block.
                            > {/* Display this part of the current learning interface. */}
                                Next question <ArrowRight size={16} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                            </button> // Finish this interface element.
                        ) : mode === "quiz" ? ( // Continue this clearly scoped calculation or control declaration.
                            <button className="button primary" disabled={busy} onClick={() => void finish()}> {/* Offer this explicit learner action. */}
                                {busy ? "Saving result…" : "Finish assessment"} {/* Render this expression using the current application state. */}
                            </button> // Finish this interface element.
                        ) : ( // Continue this clearly scoped calculation or control declaration.
                            <button // Offer this explicit learner action.
                                className="button primary" // Apply the shared presentation styles to this element.
                                onClick={() => { // Run this action when the learner activates the control.
                                    setStartedAt(null); // Update the corresponding local interface state.
                                    setQuestions([]); // Update the corresponding local interface state.
                                    notify( // Continue this clearly scoped calculation or control declaration.
                                        "Interview rehearsal completed. Review the reference points and revisit any difficult topics.", // Continue this clearly scoped calculation or control declaration.
                                    ); // Finish the current expression or code block.
                                }} // Finish the current expression or code block.
                            > {/* Display this part of the current learning interface. */}
                                Finish rehearsal <Check size={16} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                            </button> // Finish this interface element.
                        )} {/* Finish this rendered expression or container. */}
                    </div> {/* Finish this interface element. */}
                </section>{" "} {/* Finish this interface element. */}
                {/* Keep answers local until an assessment is explicitly submitted. */}
                <button // Offer this explicit learner action.
                    className="button ghost" // Apply the shared presentation styles to this element.
                    onClick={() => { // Run this action when the learner activates the control.
                        if (window.confirm("Leave this assessment? Unsubmitted answers will be cleared.")) { // Handle this condition before continuing the normal flow.
                            setStartedAt(null); // Update the corresponding local interface state.
                            setQuestions([]); // Update the corresponding local interface state.
                        } // Finish the current expression or code block.
                    }} // Finish the current expression or code block.
                > {/* Display this part of the current learning interface. */}
                    Leave assessment {/* Display this part of the current learning interface. */}
                </button>{" "} {/* Finish this interface element. */}
                {/* Protect the learner from accidentally discarding an active quiz. */}
            </div> // End the focused assessment view.
        ); // Return the active assessment when one exists.
    return ( // Return the value or interface produced by this function.
        // Show setup and real assessment history between sessions.
        <div className="learning-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep quiz configuration aligned with the rest of the application. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">TURN KNOWLEDGE INTO CONFIDENCE</p> {/* Explain the adjacent learning content or action. */}
                    <h1>A little pressure. A lot of progress.</h1> {/* State the main purpose of this screen. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        Assess your understanding, see the gaps, and make your next session count. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Explain the assessment's learning purpose. */}
            <section className="panel quiz-setup"> {/* Present a distinct section of study content. */}
                <div className="practice-orbit"> {/* Group this section of the interface. */}
                    <Sparkles size={30} aria-hidden="true" /> {/* Render this reusable visual component. */}
                </div> {/* Finish this interface element. */}
                <div> {/* Group this section of the interface. */}
                    <h2> {/* Introduce this group of related information. */}
                        {requestedTopic ? `${requestedTopic.title} assessment` : "Build your next assessment"} {/* Render this expression using the current application state. */}
                    </h2> {/* Finish this interface element. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        Randomized questions, a running timer, and explanations after submission. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <div className="filter-bar"> {/* Group this section of the interface. */}
                    <label className="form-field"> {/* Associate an accessible name with this control. */}
                        <span>Subject</span> {/* Display this compact piece of interface information. */}
                        <select // Let the learner choose among the available options.
                            className="select" // Apply the shared presentation styles to this element.
                            disabled={!!requestedTopic} // Prevent this action while its required conditions are unmet.
                            value={subjectId} // Keep the displayed control value synchronized with state.
                            onChange={(event) => setSubjectId(event.target.value)} // Update local form state when this value changes.
                        > {/* Display this part of the current learning interface. */}
                            <option value="all">Mixed CS fundamentals</option> {/* Provide one valid selection value. */}
                            {subjects.map((subject) => ( // Render this expression using the current application state.
                                <option key={subject.id} value={subject.id}> {/* Provide one valid selection value. */}
                                    {subject.title} {/* Render this expression using the current application state. */}
                                </option> // Finish this interface element.
                            ))} {/* Finish this rendered expression or container. */}
                        </select> {/* Finish this interface element. */}
                    </label> {/* Finish this interface element. */}
                    <label className="form-field"> {/* Associate an accessible name with this control. */}
                        <span>Difficulty</span> {/* Display this compact piece of interface information. */}
                        <select // Let the learner choose among the available options.
                            className="select" // Apply the shared presentation styles to this element.
                            value={difficulty} // Keep the displayed control value synchronized with state.
                            onChange={(event) => setDifficulty(event.target.value)} // Update local form state when this value changes.
                        > {/* Display this part of the current learning interface. */}
                            <option value="all">All levels</option> {/* Provide one valid selection value. */}
                            {levels.map((level) => ( // Render this expression using the current application state.
                                <option key={level}>{level}</option> // Provide one valid selection value.
                            ))} {/* Finish this rendered expression or container. */}
                        </select> {/* Finish this interface element. */}
                    </label> {/* Finish this interface element. */}
                    <label className="form-field"> {/* Associate an accessible name with this control. */}
                        <span>Practice mode</span> {/* Display this compact piece of interface information. */}
                        <select // Let the learner choose among the available options.
                            className="select" // Apply the shared presentation styles to this element.
                            value={mode} // Keep the displayed control value synchronized with state.
                            onChange={(event) => setMode(event.target.value as "quiz" | "interview")} // Update local form state when this value changes.
                        > {/* Display this part of the current learning interface. */}
                            <option value="quiz">Scored assessment</option> {/* Provide one valid selection value. */}
                            <option value="interview">Mock interview rehearsal</option> {/* Provide one valid selection value. */}
                        </select> {/* Finish this interface element. */}
                    </label> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <div className="row-between"> {/* Group this section of the interface. */}
                    <p className="muted small"> {/* Explain the adjacent learning content or action. */}
                        {Math.min(pool.length, mode === "interview" ? 5 : 10)} questions ·{" "} {/* Render this expression using the current application state. */}
                        {mode === "quiz" ? "MCQ · scored after submission" : "Written · unscored rehearsal"} {/* Render this expression using the current application state. */}
                    </p> {/* Finish this interface element. */}
                    <button // Offer this explicit learner action.
                        className="button primary" // Apply the shared presentation styles to this element.
                        disabled={!pool.length || busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => void start()} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        Start {mode === "quiz" ? "assessment" : "rehearsal"} {/* Display this part of the current learning interface. */}
                        <ArrowRight size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    </button> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                {!pool.length && ( // Render this expression using the current application state.
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        No questions match this combination. Try another difficulty or mode. {/* Display this part of the current learning interface. */}
                    </p> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </section>{" "} {/* Finish this interface element. */}
            {/* Configure a real question pool and explain how results are assessed. */}
            <section className="panel"> {/* Present a distinct section of study content. */}
                <div className="panel-header"> {/* Group this section of the interface. */}
                    <h2>Your assessment history</h2> {/* Introduce this group of related information. */}
                    <span className="muted small">{workspace.quizzes.length} completed</span> {/* Display this compact piece of interface information. */}
                </div> {/* Finish this interface element. */}
                {workspace.quizzes.length ? ( // Render this expression using the current application state.
                    <div className="topic-list"> {/* Group this section of the interface. */}
                        {[...workspace.quizzes].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).map((quiz) => ( // Render this expression using the current application state.
                            <Link className="topic-row" key={quiz.id} to={`/quizzes/result/${quiz.id}`}> {/* Connect this item to its application route. */}
                                <span className="topic-row-icon"> {/* Display this compact piece of interface information. */}
                                    <Target size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                </span> {/* Finish this interface element. */}
                                <span className="topic-row-main"> {/* Display this compact piece of interface information. */}
                                    <strong> {/* Emphasize this important value or label. */}
                                        {quiz.topicId // Render this expression using the current application state.
                                            ? topics.find((topic) => topic.id === quiz.topicId)?.title // Choose the content appropriate to the current state.
                                            : quiz.subjectId === "all" // Choose the content appropriate to the current state.
                                              ? "Mixed CS fundamentals" // Choose the content appropriate to the current state.
                                              : subjects.find((subject) => subject.id === quiz.subjectId) // Choose the content appropriate to the current state.
                                                    ?.title} {/* Choose the content appropriate to the current state. */}
                                    </strong> {/* Finish this interface element. */}
                                    <small> {/* Present secondary context without hiding it. */}
                                        {new Date(quiz.createdAt).toLocaleDateString()} · {quiz.total}{" "} {/* Render this expression using the current application state. */}
                                        questions · {Math.floor(quiz.seconds / 60)}m {quiz.seconds % 60}s {/* Display this part of the current learning interface. */}
                                    </small> {/* Finish this interface element. */}
                                </span> {/* Finish this interface element. */}
                                <span className="badge">{quiz.score}%</span> {/* Display this compact piece of interface information. */}
                                <ArrowRight size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                            </Link> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </div> // Finish this interface element.
                ) : ( // Continue this clearly scoped calculation or control declaration.
                    <div className="empty-state"> {/* Group this section of the interface. */}
                        <Target size={30} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        <h3>Your first assessment is a fresh start.</h3> {/* Label this specific learning item. */}
                        <p className="muted"> {/* Explain the adjacent learning content or action. */}
                            Complete an assessment to see your accuracy, explanations, and revision {/* Display this part of the current learning interface. */}
                            recommendations here. {/* Display this part of the current learning interface. */}
                        </p> {/* Finish this interface element. */}
                    </div> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </section>{" "} {/* Finish this interface element. */}
            {/* List preserved results instead of placeholder quiz performance. */}
        </div> // End the quiz setup screen.
    ); // Return setup and assessment history.
} // Finish the quiz and interview page.

export function QuizResultPage() { // Continue this clearly scoped calculation or control declaration.
    // Explain an actual submitted assessment and its next learning steps.
    const { id } = useParams(); // Resolve the saved attempt identifier from the route.
    const { workspace, topics, setProgress, notify } = useWorkspace(); // Read the result and connect mistakes to revision.
    const result = workspace.quizzes.find((quiz) => quiz.id === id); // Restrict results to the current user's workspace.
    if (!result) // Handle this condition before continuing the normal flow.
        return ( // Return the value or interface produced by this function.
            <div className="empty-state"> {/* Group this section of the interface. */}
                Assessment result not found. <Link to="/quizzes">View your assessments</Link> {/* Display this part of the current learning interface. */}
            </div> // Finish this interface element.
        ); // Handle unavailable or another user's result safely.
    const weakIds = [ // Calculate or retain this value for the current render.
        ...new Set(result.answers.filter((answer) => !answer.correct).map((answer) => answer.topicId)), // Continue the transformation of this collection.
    ]; // Recommend only topics with actual incorrect answers.
    return ( // Return the value or interface produced by this function.
        <div className="learning-page"> {/* Group this section of the interface. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">ASSESSMENT COMPLETE</p> {/* Explain the adjacent learning content or action. */}
                    <h1> {/* State the main purpose of this screen. */}
                        {result.score >= 80 // Render this expression using the current application state.
                            ? "Your understanding is growing." // Choose the content appropriate to the current state.
                            : "Now you know what comes next."} {/* Choose the content appropriate to the current state. */}
                    </h1> {/* Finish this interface element. */}
                    <p className="muted">Every attempt gives your next study session a clearer direction.</p> {/* Explain the adjacent learning content or action. */}
                </div> {/* Finish this interface element. */}
                <Link to="/quizzes" className="button primary"> {/* Connect this item to its application route. */}
                    Practice again <ArrowRight size={16} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                </Link> {/* Finish this interface element. */}
            </div> {/* Finish this interface element. */}
            <div className="stats-grid"> {/* Group this section of the interface. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Accuracy</span> {/* Display this compact piece of interface information. */}
                    <strong>{result.score}%</strong> {/* Emphasize this important value or label. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Correct answers</span> {/* Display this compact piece of interface information. */}
                    <strong> {/* Emphasize this important value or label. */}
                        {result.correct} {/* Render this expression using the current application state. */}
                        <small> / {result.total}</small> {/* Present secondary context without hiding it. */}
                    </strong> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Incorrect answers</span> {/* Display this compact piece of interface information. */}
                    <strong>{result.total - result.correct}</strong> {/* Emphasize this important value or label. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Time taken</span> {/* Display this compact piece of interface information. */}
                    <strong> {/* Emphasize this important value or label. */}
                        {Math.floor(result.seconds / 60)}m {result.seconds % 60}s {/* Render this expression using the current application state. */}
                    </strong> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
            </div> {/* Finish this interface element. */}
            {weakIds.length > 0 && ( // Render this expression using the current application state.
                <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                    <h2>Your next revision topics</h2> {/* Introduce this group of related information. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        These topics contain an incorrect or unanswered question from this assessment. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                    <div className="revision-recommendations"> {/* Group this section of the interface. */}
                        {weakIds.map((topicId) => ( // Render this expression using the current application state.
                            <div className="topic-row" key={topicId}> {/* Group this section of the interface. */}
                                <Link className="topic-row-main text-link" to={`/learn/${topicId}`}> {/* Connect this item to its application route. */}
                                    {topics.find((topic) => topic.id === topicId)?.title ?? topicId} {/* Render this expression using the current application state. */}
                                </Link> {/* Finish this interface element. */}
                                <button // Offer this explicit learner action.
                                    className="button secondary" // Apply the shared presentation styles to this element.
                                    onClick={() => // Run this action when the learner activates the control.
                                        void setProgress(topicId, "Needs Revision") // Continue this clearly scoped calculation or control declaration.
                                            .then(() => notify("Topic added to your revision list.")) // Continue the transformation of this collection.
                                            .catch((error) => notify(error.message)) // Continue the transformation of this collection.
                                    } // Finish the current expression or code block.
                                > {/* Display this part of the current learning interface. */}
                                    Add to revision {/* Display this part of the current learning interface. */}
                                </button> {/* Finish this interface element. */}
                            </div> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </div> {/* Finish this interface element. */}
                </section> // Finish this interface element.
            )} {/* Finish this rendered expression or container. */}
            <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                <h2>Review every answer</h2> {/* Introduce this group of related information. */}
                {result.answers.map((answer, index) => { // Render this expression using the current application state.
                    const topic = topics.find((item) => item.id === answer.topicId); // Calculate or retain this value for the current render.
                    const question = topic?.questions.find((item) => item.id === answer.questionId); // Calculate or retain this value for the current render.
                    return ( // Return the value or interface produced by this function.
                        <article className="result-question" key={`${answer.questionId}-${index}`}> {/* Keep this learning item self-contained. */}
                            <span // Display this compact piece of interface information.
                                className={`badge ${answer.correct ? "difficulty-easy" : "difficulty-hard"}`} // Apply the shared presentation styles to this element.
                            > {/* Display this part of the current learning interface. */}
                                {answer.correct ? "Correct" : "Needs revision"} {/* Render this expression using the current application state. */}
                            </span> {/* Finish this interface element. */}
                            <h3> {/* Label this specific learning item. */}
                                {index + 1}. {question?.prompt ?? "Question unavailable"} {/* Render this expression using the current application state. */}
                            </h3> {/* Finish this interface element. */}
                            <p> {/* Explain the adjacent learning content or action. */}
                                <strong>Your answer:</strong> {answer.answer || "No answer selected"} {/* Emphasize this important value or label. */}
                            </p> {/* Finish this interface element. */}
                            <p> {/* Explain the adjacent learning content or action. */}
                                <strong>Reference answer:</strong> {question?.answer} {/* Emphasize this important value or label. */}
                            </p> {/* Finish this interface element. */}
                            <p className="muted">{question?.explanation}</p> {/* Explain the adjacent learning content or action. */}
                            <Link to={`/learn/${answer.topicId}`} className="text-link"> {/* Connect this item to its application route. */}
                                Review {topic?.title ?? "topic"} {/* Display this part of the current learning interface. */}
                                <ArrowRight size={14} aria-hidden="true" /> {/* Render this reusable visual component. */}
                            </Link> {/* Finish this interface element. */}
                        </article> // Finish this interface element.
                    ); // Finish the current expression or code block.
                })} {/* Finish this rendered expression or container. */}
            </section> {/* Finish this interface element. */}
        </div> // Finish this interface element.
    ); // Connect scoring, explanations, and specific revision actions.
} // Finish the assessment result screen.
