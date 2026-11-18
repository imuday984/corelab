import { useMemo, useState } from "react"; // Keep filtering and lesson note editing local to each screen.
import { Link, useParams } from "react-router-dom"; // Connect subjects, lessons, and their breadcrumbs.
import { // Continue this clearly scoped calculation or control declaration.
    ArrowLeft, // Continue this clearly scoped calculation or control declaration.
    ArrowRight, // Continue this clearly scoped calculation or control declaration.
    Bookmark, // Continue this clearly scoped calculation or control declaration.
    BookOpen, // Continue this clearly scoped calculation or control declaration.
    Check, // Continue this clearly scoped calculation or control declaration.
    ChevronRight, // Continue this clearly scoped calculation or control declaration.
    Clock3, // Continue this clearly scoped calculation or control declaration.
    Code2, // Continue this clearly scoped calculation or control declaration.
    Layers3, // Continue this clearly scoped calculation or control declaration.
    Search, // Continue this clearly scoped calculation or control declaration.
} from "lucide-react"; // Reuse consistent accessible interface icons.
import { useWorkspace } from "../lib/store"; // Read curriculum and learner-owned state through the shared provider.
import { CheckpointPanel } from "./Practice"; // Embed the same checkpoint experience used by the practice screen.
import type { Subject, Topic } from "../../shared/types"; // Keep presentation aligned with the shared content contract.
import "./learning.css"; // Apply responsive styles shared by these learning screens.

function statusFor(topicId: string, progress: ReturnType<typeof useWorkspace>["workspace"]["progress"]) { // Continue this clearly scoped calculation or control declaration.
    // Resolve a lesson's state without modifying it.
    return progress.find((item) => item.topicId === topicId)?.status ?? "Not Started"; // Unvisited lessons begin with an honest empty state.
} // Finish the status lookup helper.

export function SubjectCard({ subject }: { subject: Subject }) { // Continue this clearly scoped calculation or control declaration.
    // Render one reusable curriculum card.
    const { topics, workspace } = useWorkspace(); // Access lessons and this learner's progress.
    const lessons = topics.filter((topic) => topic.subjectId === subject.id); // Restrict counts to the displayed subject.
    const complete = lessons.filter((topic) => // Calculate or retain this value for the current render.
        ["Completed", "Mastered"].includes(statusFor(topic.id, workspace.progress)), // Continue this clearly scoped calculation or control declaration.
    ).length; // Count completed learning separately from started lessons.
    const percent = lessons.length ? Math.round((complete / lessons.length) * 100) : 0; // Avoid division by zero for an expandable curriculum.
    const next = // Calculate or retain this value for the current render.
        lessons.find( // Continue this clearly scoped calculation or control declaration.
            (topic) => !["Completed", "Mastered"].includes(statusFor(topic.id, workspace.progress)), // Continue this clearly scoped calculation or control declaration.
        ) ?? lessons[0]; // Resume the first unfinished topic.
    const ids = new Set(lessons.map((topic) => topic.id)); // Build a fast membership check for checkpoint totals.
    const correct = workspace.attempts.filter((attempt) => ids.has(attempt.topicId) && attempt.correct); // Count only attempts with an actual correct result.
    return ( // Return the value or interface produced by this function.
        // Keep each visible section readable and independently editable.
        <article className="panel curriculum-card"> {/* Keep this learning item self-contained. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Display one subject as a semantic article. */}
            <div className="subject-card-top"> {/* Group this section of the interface. */}
                <span // Display this compact piece of interface information.
                    className="subject-icon" // Apply the shared presentation styles to this element.
                    style={{ color: subject.color, background: `${subject.color}16` }} // Derive this visual value from the current learning data.
                > {/* Display this part of the current learning interface. */}
                    <Layers3 size={22} aria-hidden="true" /> {/* Render this reusable visual component. */}
                </span> {/* Finish this interface element. */}
                <span className="badge">{lessons.length} topics</span> {/* Display this compact piece of interface information. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Show the accent icon and topic count. */}
            <Link to={`/subjects/${subject.id}`} className="subject-card-title"> {/* Connect this item to its application route. */}
                {subject.title} {/* Render this expression using the current application state. */}
            </Link>{" "} {/* Finish this interface element. */}
            {/* Open the organized subject syllabus. */}
            <p className="muted subject-description">{subject.description}</p>{" "} {/* Explain the adjacent learning content or action. */}
            {/* Explain the subject's practical purpose. */}
            <div className="row-between small"> {/* Group this section of the interface. */}
                <span className="muted">Learning progress</span> {/* Display this compact piece of interface information. */}
                <strong>{percent}%</strong> {/* Emphasize this important value or label. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Pair progress color with a readable value. */}
            <div // Group this section of the interface.
                className="progress-track" // Apply the shared presentation styles to this element.
                role="progressbar" // Declare this element’s semantic interaction role.
                aria-label={`${subject.title} completion`} // Expose the control state or purpose to assistive technology.
                aria-valuenow={percent} // Expose the control state or purpose to assistive technology.
                aria-valuemin={0} // Expose the control state or purpose to assistive technology.
                aria-valuemax={100} // Expose the control state or purpose to assistive technology.
            > {/* Display this part of the current learning interface. */}
                <span className="progress-fill" style={{ width: `${percent}%`, background: subject.color }} /> {/* Display this compact piece of interface information. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Expose completion to assistive technology. */}
            <div className="row-between small muted"> {/* Group this section of the interface. */}
                <span> {/* Display this compact piece of interface information. */}
                    {complete} of {lessons.length} completed {/* Render this expression using the current application state. */}
                </span> {/* Finish this interface element. */}
                <span>{new Set(lessons.map((topic) => topic.module)).size} modules</span> {/* Display this compact piece of interface information. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Show useful counts without invented statistics. */}
            <div className="checkpoint-counts"> {/* Group this section of the interface. */}
                {(["Easy", "Medium", "Hard"] as const).map((difficulty) => ( // Render this expression using the current application state.
                    <span key={difficulty}> {/* Display this compact piece of interface information. */}
                        <i className={`difficulty-dot ${difficulty.toLowerCase()}`} /> {/* Render this reusable visual component. */}
                        {new Set(correct.filter((attempt) => attempt.difficulty === difficulty).map((attempt) => attempt.questionId)).size} {difficulty} {/* Render this expression using the current application state. */}
                    </span> // Finish this interface element.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Break successful practice down by level. */}
            {next && ( // Render this expression using the current application state.
                <Link className="button secondary full-width" to={`/learn/${next.id}`}> {/* Connect this item to its application route. */}
                    Continue learning <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                </Link> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Offer the next useful learning action. */}
        </article> // End the subject card.
    ); // Return the subject article.
} // Finish the reusable card component.

export function SubjectsPage() { // Continue this clearly scoped calculation or control declaration.
    // List all six subjects with meaningful search.
    const { subjects } = useWorkspace(); // Load subject metadata from the shared curriculum.
    const [search, setSearch] = useState(""); // Remember the user's current filter.
    const filtered = subjects.filter((subject) => // Calculate or retain this value for the current render.
        `${subject.title} ${subject.description}`.toLowerCase().includes(search.toLowerCase()), // Continue this clearly scoped calculation or control declaration.
    ); // Match title and description without case sensitivity.
    return ( // Return the value or interface produced by this function.
        // Render the subject directory.
        <div className="learning-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Constrain the curriculum to the app's content width. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">YOUR LEARNING PATH</p> {/* Explain the adjacent learning content or action. */}
                    <h1>Build your fundamentals.</h1> {/* State the main purpose of this screen. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        Six core subjects. One stronger foundation for your next interview. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Introduce the learner's next task. */}
            <label className="search-field"> {/* Associate an accessible name with this control. */}
                <Search size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                <input // Collect the learner input shown here.
                    aria-label="Search subjects" // Expose the control state or purpose to assistive technology.
                    placeholder="Search subjects…" // Suggest the kind of response expected by this field.
                    value={search} // Keep the displayed control value synchronized with state.
                    onChange={(event) => setSearch(event.target.value)} // Update local form state when this value changes.
                /> {/* Display this part of the current learning interface. */}
            </label>{" "} {/* Finish this interface element. */}
            {/* Provide keyboard-accessible subject search. */}
            <div className="curriculum-grid"> {/* Group this section of the interface. */}
                {filtered.map((subject) => ( // Render this expression using the current application state.
                    <SubjectCard key={subject.id} subject={subject} /> // Render this reusable visual component.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Lay out all matching subjects responsively. */}
            {!filtered.length && ( // Render this expression using the current application state.
                <div className="empty-state">No subjects match “{search}”. Try a broader search.</div> // Group this section of the interface.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Explain an empty search result. */}
        </div> // End the directory container.
    ); // Return the subject directory.
} // Finish the subject listing page.

export function SubjectPage() { // Continue this clearly scoped calculation or control declaration.
    // Show modules and topics inside one subject.
    const { subjectId } = useParams(); // Read the stable subject identifier from the route.
    const { subjects, topics, workspace } = useWorkspace(); // Share the same content and progress as the dashboard.
    const [search, setSearch] = useState(""); // Keep topic filtering independent of global navigation.
    const subject = subjects.find((item) => item.id === subjectId); // Resolve the requested subject safely.
    const lessons = topics.filter( // Calculate or retain this value for the current render.
        (topic) => topic.subjectId === subjectId && topic.title.toLowerCase().includes(search.toLowerCase()), // Continue this clearly scoped calculation or control declaration.
    ); // Search only within this subject.
    const modules = [...new Set(lessons.map((topic) => topic.module))]; // Preserve curriculum ordering while grouping lessons.
    if (!subject) // Handle this condition before continuing the normal flow.
        return ( // Return the value or interface produced by this function.
            <div className="empty-state"> {/* Group this section of the interface. */}
                Subject not found. <Link to="/subjects">View all subjects</Link> {/* Display this part of the current learning interface. */}
            </div> // Finish this interface element.
        ); // Recover gracefully from an unknown route.
    return ( // Return the value or interface produced by this function.
        // Render the organized subject syllabus.
        <div className="learning-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep syllabus spacing consistent. */}
            <Link to="/subjects" className="text-link"> {/* Connect this item to its application route. */}
                <ArrowLeft size={15} aria-hidden="true" /> All subjects {/* Render this reusable visual component. */}
            </Link>{" "} {/* Finish this interface element. */}
            {/* Offer a clear route back to the curriculum. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">THE CURRICULUM</p> {/* Explain the adjacent learning content or action. */}
                    <h1>{subject.title}</h1> {/* State the main purpose of this screen. */}
                    <p className="muted">{subject.description}</p> {/* Explain the adjacent learning content or action. */}
                </div> {/* Finish this interface element. */}
                <span className="badge"> {/* Display this compact piece of interface information. */}
                    {modules.length} modules · {lessons.length} topics {/* Render this expression using the current application state. */}
                </span> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Summarize the subject's organization. */}
            <label className="search-field"> {/* Associate an accessible name with this control. */}
                <Search size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                <input // Collect the learner input shown here.
                    aria-label="Search topics in this subject" // Expose the control state or purpose to assistive technology.
                    placeholder="Find a topic in this subject…" // Suggest the kind of response expected by this field.
                    value={search} // Keep the displayed control value synchronized with state.
                    onChange={(event) => setSearch(event.target.value)} // Update local form state when this value changes.
                /> {/* Display this part of the current learning interface. */}
            </label>{" "} {/* Finish this interface element. */}
            {/* Help learners find a specific concept. */}
            <div className="module-stack"> {/* Group this section of the interface. */}
                {modules.map((module, index) => ( // Render this expression using the current application state.
                    // Render modules in their original learning order.
                    <section className="panel module-panel" key={module}> {/* Present a distinct section of study content. */}
                        {" "} {/* Render this expression using the current application state. */}
                        {/* Group closely related lessons semantically. */}
                        <div className="panel-header"> {/* Group this section of the interface. */}
                            <h2> {/* Introduce this group of related information. */}
                                <span className="module-number">{String(index + 1).padStart(2, "0")}</span> {/* Display this compact piece of interface information. */}
                                {module} {/* Render this expression using the current application state. */}
                            </h2> {/* Finish this interface element. */}
                            <span className="muted small"> {/* Display this compact piece of interface information. */}
                                {lessons.filter((topic) => topic.module === module).length} topics {/* Render this expression using the current application state. */}
                            </span> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Make module order easy to scan. */}
                        <div className="topic-list"> {/* Group this section of the interface. */}
                            {lessons // Render this expression using the current application state.
                                .filter((topic) => topic.module === module) // Continue the transformation of this collection.
                                .map((topic) => ( // Continue the transformation of this collection.
                                    <Link className="topic-row" key={topic.id} to={`/learn/${topic.id}`}> {/* Connect this item to its application route. */}
                                        <span className="topic-row-icon"> {/* Display this compact piece of interface information. */}
                                            <BookOpen size={17} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                        </span> {/* Finish this interface element. */}
                                        <span className="topic-row-main"> {/* Display this compact piece of interface information. */}
                                            <strong>{topic.title}</strong> {/* Emphasize this important value or label. */}
                                            <small> {/* Present secondary context without hiding it. */}
                                                {topic.minutes} min read · {topic.difficulty} {/* Render this expression using the current application state. */}
                                            </small> {/* Finish this interface element. */}
                                        </span> {/* Finish this interface element. */}
                                        <span // Display this compact piece of interface information.
                                            className={`badge status-${statusFor(topic.id, workspace.progress).toLowerCase().replaceAll(" ", "-")}`} // Apply the shared presentation styles to this element.
                                        > {/* Display this part of the current learning interface. */}
                                            {statusFor(topic.id, workspace.progress)} {/* Render this expression using the current application state. */}
                                        </span> {/* Finish this interface element. */}
                                        <ChevronRight size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                    </Link> // Finish this interface element.
                                ))} {/* Finish this rendered expression or container. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Connect each lesson to its actual progress state. */}
                    </section> // End this module section.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Finish the module list. */}
            {!modules.length && ( // Render this expression using the current application state.
                <div className="empty-state"> {/* Group this section of the interface. */}
                    No matching topics. Clear your search to see the full syllabus. {/* Display this part of the current learning interface. */}
                </div> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Handle filtered empty results. */}
        </div> // End the subject page container.
    ); // Return the complete syllabus view.
} // Finish the subject detail component.

function SqlExample({ topic }: { topic: Topic }) { // Continue this clearly scoped calculation or control declaration.
    // Display runnable SQL problem data independently of prose.
    if (!topic.sql) return null; // Skip SQL-specific UI for conceptual lessons.
    return ( // Return the value or interface produced by this function.
        // Render sample tables and expected output clearly.
        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Group SQL challenge details in one study card. */}
            <h2>Practice database</h2> {/* Introduce concrete sample records. */}
            {topic.sql.tables.map((table) => ( // Render this expression using the current application state.
                <div className="data-table-wrap" key={table.name}> {/* Group this section of the interface. */}
                    <h3>{table.name}</h3> {/* Label this specific learning item. */}
                    <table> {/* Present sample database records as a semantic table. */}
                        <thead> {/* Group the sample table column headings. */}
                            <tr> {/* Render one sample data row. */}
                                {table.columns.map((column) => ( // Render this expression using the current application state.
                                    <th key={column} scope="col"> {/* Name this sample table column. */}
                                        {column} {/* Render this expression using the current application state. */}
                                    </th> // Finish this interface element.
                                ))} {/* Finish this rendered expression or container. */}
                            </tr> {/* Finish this interface element. */}
                        </thead> {/* Finish this interface element. */}
                        <tbody> {/* Group the sample database records. */}
                            {table.rows.map((row, index) => ( // Render this expression using the current application state.
                                <tr key={index}> {/* Render one sample data row. */}
                                    {row.map((cell, cellIndex) => ( // Render this expression using the current application state.
                                        <td key={cellIndex}>{cell}</td> // Show the corresponding sample record value.
                                    ))} {/* Finish this rendered expression or container. */}
                                </tr> // Finish this interface element.
                            ))} {/* Finish this rendered expression or container. */}
                        </tbody> {/* Finish this interface element. */}
                    </table> {/* Finish this interface element. */}
                </div> // Finish this interface element.
            ))}{" "} {/* Display this part of the current learning interface. */}
            {/* Keep column headings accessible and tables scrollable on mobile. */}
            <h3>Expected output</h3> {/* Label this specific learning item. */}
            <pre>{topic.sql.expected.map((row) => row.join("  |  ")).join("\n")}</pre>{" "} {/* Preserve the formatting of this example or result. */}
            {/* Show the result learners should obtain. */}
            <details className="interview-question"> {/* Keep supporting explanations expandable. */}
                <summary>Reveal solution and compare</summary> {/* Provide the keyboard-accessible disclosure label. */}
                <pre> {/* Preserve the formatting of this example or result. */}
                    <code>{topic.sql.solution}</code> {/* Distinguish code from the surrounding explanation. */}
                </pre> {/* Finish this interface element. */}
                {topic.sql.alternative && ( // Render this expression using the current application state.
                    <> {/* Group these related elements without adding a layout wrapper. */}
                        <h4>Alternative approach</h4> {/* Label this explanation or feedback message. */}
                        <pre> {/* Preserve the formatting of this example or result. */}
                            <code>{topic.sql.alternative}</code> {/* Distinguish code from the surrounding explanation. */}
                        </pre> {/* Finish this interface element. */}
                    </> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </details>{" "} {/* Finish this interface element. */}
            {/* Hide the reference query until requested. */}
        </section> // End the SQL challenge card.
    ); // Return the optional practice data section.
} // Finish the SQL example renderer.

function LessonNotes({ topic }: { topic: Topic }) { // Continue this clearly scoped calculation or control declaration.
    // Keep note editing small and reusable.
    const { workspace, saveNote, notify } = useWorkspace(); // Access this learner's private notes and save method.
    const existing = workspace.notes.find((note) => note.topicId === topic.id)?.text ?? ""; // Load the saved note for this topic.
    const [text, setText] = useState(existing); // Hold unsaved edits locally.
    const [saving, setSaving] = useState(false); // Prevent duplicate saves while a request runs.
    async function save() { // Continue this clearly scoped calculation or control declaration.
        // Persist the learner's note with visible feedback.
        setSaving(true); // Disable the save control during the request.
        try { // Run the operation while preserving a recoverable error path.
            await saveNote(topic.id, text); // Wait for this data operation before continuing.
            notify(text.trim() ? "Your study note was saved." : "Your study note was cleared."); // Continue this clearly scoped calculation or control declaration.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Unable to save your note."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Report success or the actual error.
            setSaving(false); // Update the corresponding local interface state.
        } // Restore the save control after completion.
    } // Finish the note save handler.
    return ( // Return the value or interface produced by this function.
        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
            <h2>Your study notes</h2> {/* Introduce this group of related information. */}
            <p className="muted small">Capture an example, a connection, or a question to revisit.</p> {/* Explain the adjacent learning content or action. */}
            <label className="sr-only" htmlFor="lesson-note"> {/* Associate an accessible name with this control. */}
                Personal notes for {topic.title} {/* Display this part of the current learning interface. */}
            </label> {/* Finish this interface element. */}
            <textarea // Allow the learner to write and edit a response.
                id="lesson-note" // Connect this control to its visible or screen-reader label.
                className="textarea" // Apply the shared presentation styles to this element.
                rows={6} // Reserve a comfortable initial height for written responses.
                value={text} // Keep the displayed control value synchronized with state.
                onChange={(event) => setText(event.target.value)} // Update local form state when this value changes.
                placeholder="Explain the concept in your own words…" // Suggest the kind of response expected by this field.
            /> {/* Display this part of the current learning interface. */}
            <button className="button secondary" disabled={saving || text === existing} onClick={save}> {/* Offer this explicit learner action. */}
                {saving ? "Saving…" : "Save note"} {/* Render this expression using the current application state. */}
            </button> {/* Finish this interface element. */}
        </section> // Finish this interface element.
    ); // Present a labeled note editor with explicit saving.
} // Finish the topic note editor.

export function TopicPage() { // Continue this clearly scoped calculation or control declaration.
    // Assemble the full learning experience around one structured topic.
    const { topicId } = useParams(); // Read the lesson identifier from the URL.
    const { topics, subjects, workspace, setProgress, toggleBookmark, notify } = useWorkspace(); // Connect learning actions to the learner's workspace.
    const [activeTab, setActiveTab] = useState<"learn" | "practice" | "notes">("learn"); // Switch between three focused lesson tasks.
    const [busy, setBusy] = useState(false); // Prevent repeated progress updates.
    const topic = topics.find((item) => item.id === topicId); // Resolve the requested curriculum topic.
    const siblings = useMemo( // Calculate or retain this value for the current render.
        () => topics.filter((item) => item.subjectId === topic?.subjectId), // Continue this clearly scoped calculation or control declaration.
        [topics, topic?.subjectId], // Continue this clearly scoped calculation or control declaration.
    ); // Limit previous and next links to the same subject.
    if (!topic) // Handle this condition before continuing the normal flow.
        return ( // Return the value or interface produced by this function.
            <div className="empty-state"> {/* Group this section of the interface. */}
                Topic not found. <Link to="/subjects">Explore the curriculum</Link> {/* Display this part of the current learning interface. */}
            </div> // Finish this interface element.
        ); // Avoid a broken screen when a topic is unavailable.
    const subject = subjects.find((item) => item.id === topic.subjectId); // Find the subject used in the breadcrumb.
    const index = siblings.findIndex((item) => item.id === topic.id); // Locate neighboring curriculum topics.
    const status = statusFor(topic.id, workspace.progress); // Display this lesson's real learning state.
    const bookmarked = workspace.bookmarks.includes(topic.id); // Keep the bookmark control in sync with saved state.
    async function changeStatus(next: "In Progress" | "Completed" | "Needs Revision") { // Continue this clearly scoped calculation or control declaration.
        // Update learning state without awarding unsupported mastery.
        setBusy(true); // Block duplicate progress mutations.
        try { // Run the operation while preserving a recoverable error path.
            await setProgress(topic!.id, next); // Wait for this data operation before continuing.
            notify( // Continue this clearly scoped calculation or control declaration.
                next === "Completed" // Continue this clearly scoped calculation or control declaration.
                    ? "Reading completed. Practice and an assessment establish mastery." // Choose the content appropriate to the current state.
                    : `Topic marked ${next.toLowerCase()}.`, // Choose the content appropriate to the current state.
            ); // Finish the current expression or code block.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Could not update your progress."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Explain what the action actually means.
            setBusy(false); // Update the corresponding local interface state.
        } // Restore the controls after the request.
    } // Finish the topic status handler.
    return ( // Return the value or interface produced by this function.
        // Render one fully connected lesson page.
        <div className="learning-page lesson-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep the lesson readable at large and small widths. */}
            <nav aria-label="Breadcrumb" className="breadcrumb"> {/* Expose the navigation context to assistive technology. */}
                <Link to="/subjects">Subjects</Link> {/* Connect this item to its application route. */}
                <ChevronRight size={13} aria-hidden="true" /> {/* Render this reusable visual component. */}
                <Link to={`/subjects/${topic.subjectId}`}>{subject?.shortTitle ?? topic.subjectId}</Link> {/* Connect this item to its application route. */}
                <ChevronRight size={13} aria-hidden="true" /> {/* Render this reusable visual component. */}
                <span>{topic.module}</span> {/* Display this compact piece of interface information. */}
            </nav>{" "} {/* Finish this interface element. */}
            {/* Show where the lesson belongs in the curriculum. */}
            <div className="page-heading"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <p className="eyebrow">{topic.module}</p> {/* Explain the adjacent learning content or action. */}
                    <h1>{topic.title}</h1> {/* State the main purpose of this screen. */}
                    <div className="lesson-meta"> {/* Group this section of the interface. */}
                        <span className="badge">{topic.difficulty}</span> {/* Display this compact piece of interface information. */}
                        <span> {/* Display this compact piece of interface information. */}
                            <Clock3 size={14} aria-hidden="true" /> {topic.minutes} min read {/* Render this reusable visual component. */}
                        </span> {/* Finish this interface element. */}
                        <span>{status}</span> {/* Display this compact piece of interface information. */}
                    </div> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <button // Offer this explicit learner action.
                    className={`button ${bookmarked ? "primary" : "secondary"}`} // Apply the shared presentation styles to this element.
                    onClick={() => void toggleBookmark(topic.id).catch((error) => notify(error.message))} // Run this action when the learner activates the control.
                    aria-pressed={bookmarked} // Expose the control state or purpose to assistive technology.
                > {/* Display this part of the current learning interface. */}
                    <Bookmark size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    {bookmarked ? "Bookmarked" : "Bookmark"} {/* Render this expression using the current application state. */}
                </button> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Surface context and a persistent saved action. */}
            <div className="tabs lesson-tabs" role="tablist" aria-label="Lesson sections"> {/* Group this section of the interface. */}
                {( // Render this expression using the current application state.
                    [ // Continue this clearly scoped calculation or control declaration.
                        { id: "learn", label: "Learning material", icon: BookOpen }, // Render this expression using the current application state.
                        { id: "practice", label: "Checkpoints", icon: Code2 }, // Render this expression using the current application state.
                        { id: "notes", label: "My notes", icon: Bookmark }, // Render this expression using the current application state.
                    ] as const // Continue this clearly scoped calculation or control declaration.
                ).map((tab) => ( // Continue this clearly scoped calculation or control declaration.
                    <button // Offer this explicit learner action.
                        key={tab.id} // Give React a stable identity for this repeated item.
                        role="tab" // Declare this element’s semantic interaction role.
                        aria-selected={activeTab === tab.id} // Expose the control state or purpose to assistive technology.
                        className={`tab ${activeTab === tab.id ? "active" : ""}`} // Apply the shared presentation styles to this element.
                        onClick={() => setActiveTab(tab.id)} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        <tab.icon size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        {tab.label} {/* Render this expression using the current application state. */}
                    </button> // Finish this interface element.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Keep all difficulty levels and notes directly accessible. */}
            {activeTab === "learn" && ( // Render this expression using the current application state.
                <div className="lesson-layout"> {/* Group this section of the interface. */}
                    <article className="lesson-content"> {/* Keep this learning item self-contained. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <p className="eyebrow">THE BIG PICTURE</p> {/* Explain the adjacent learning content or action. */}
                            <h2>Understand the concept</h2> {/* Introduce this group of related information. */}
                            <p className="lesson-prose">{topic.overview}</p> {/* Explain the adjacent learning content or action. */}
                        </section> {/* Finish this interface element. */}
                        {topic.sections.map((section, sectionIndex) => ( // Render this expression using the current application state.
                            <section // Present a distinct section of study content.
                                className="panel lesson-section" // Apply the shared presentation styles to this element.
                                key={`${section.title}-${sectionIndex}`} // Give React a stable identity for this repeated item.
                            > {/* Display this part of the current learning interface. */}
                                <h2>{section.title}</h2> {/* Introduce this group of related information. */}
                                <p className="lesson-prose">{section.body}</p> {/* Explain the adjacent learning content or action. */}
                            </section> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                        {topic.diagram && ( // Render this expression using the current application state.
                            <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                                <h2>Visual walkthrough</h2> {/* Introduce this group of related information. */}
                                <ol className="concept-flow"> {/* Present these steps in their meaningful order. */}
                                    {topic.diagram.map((step, stepIndex) => ( // Render this expression using the current application state.
                                        <li key={stepIndex}> {/* Render this item in the surrounding list. */}
                                            <span>{String(stepIndex + 1).padStart(2, "0")}</span> {/* Display this compact piece of interface information. */}
                                            {step} {/* Render this expression using the current application state. */}
                                        </li> // Finish this interface element.
                                    ))} {/* Finish this rendered expression or container. */}
                                </ol> {/* Finish this interface element. */}
                            </section> // Finish this interface element.
                        )} {/* Finish this rendered expression or container. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <h2>A practical example</h2> {/* Introduce this group of related information. */}
                            <pre className="example-code"> {/* Preserve the formatting of this example or result. */}
                                <code>{topic.example}</code> {/* Distinguish code from the surrounding explanation. */}
                            </pre> {/* Finish this interface element. */}
                        </section> {/* Finish this interface element. */}
                        <SqlExample topic={topic} /> {/* Render this reusable visual component. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <h2>Think like an interviewer</h2> {/* Introduce this group of related information. */}
                            <p className="muted">Try answering aloud before expanding the reference.</p> {/* Explain the adjacent learning content or action. */}
                            {topic.interview.map((item, itemIndex) => ( // Render this expression using the current application state.
                                <details className="interview-question" key={itemIndex}> {/* Keep supporting explanations expandable. */}
                                    <summary>{item.question}</summary> {/* Provide the keyboard-accessible disclosure label. */}
                                    <p className="lesson-prose">{item.answer}</p> {/* Explain the adjacent learning content or action. */}
                                    <div className="followup"> {/* Group this section of the interface. */}
                                        <strong>A common follow-up</strong> {/* Emphasize this important value or label. */}
                                        <p>{item.followUp}</p> {/* Explain the adjacent learning content or action. */}
                                    </div> {/* Finish this interface element. */}
                                </details> // Finish this interface element.
                            ))} {/* Finish this rendered expression or container. */}
                        </section> {/* Finish this interface element. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <h2>Read the references</h2> {/* Introduce this group of related information. */}
                            <p className="muted small"> {/* Explain the adjacent learning content or action. */}
                                Use these independent references to verify and deepen your understanding. {/* Display this part of the current learning interface. */}
                            </p> {/* Finish this interface element. */}
                            <ul className="resource-list"> {/* List related study points or references. */}
                                {topic.resources.map((resource) => ( // Render this expression using the current application state.
                                    <li key={resource.url}> {/* Render this item in the surrounding list. */}
                                        <a href={resource.url} target="_blank" rel="noreferrer"> {/* Open the independent reference linked here. */}
                                            {resource.title} {/* Render this expression using the current application state. */}
                                            <ArrowRight size={14} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                        </a> {/* Finish this interface element. */}
                                    </li> // Finish this interface element.
                                ))} {/* Finish this rendered expression or container. */}
                            </ul> {/* Finish this interface element. */}
                        </section> {/* Finish this interface element. */}
                    </article> {/* Finish this interface element. */}
                    <aside className="lesson-aside"> {/* Display supporting quick-reference information. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <p className="eyebrow">QUICK REVISION</p> {/* Explain the adjacent learning content or action. */}
                            <h2>Keep these in mind</h2> {/* Introduce this group of related information. */}
                            <ul className="revision-points"> {/* List related study points or references. */}
                                {topic.revision.map((point, pointIndex) => ( // Render this expression using the current application state.
                                    <li key={pointIndex}> {/* Render this item in the surrounding list. */}
                                        <Check size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                        <span>{point}</span> {/* Display this compact piece of interface information. */}
                                    </li> // Finish this interface element.
                                ))} {/* Finish this rendered expression or container. */}
                            </ul> {/* Finish this interface element. */}
                        </section> {/* Finish this interface element. */}
                        <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                            <h2>Make it stick.</h2> {/* Introduce this group of related information. */}
                            <p className="muted small"> {/* Explain the adjacent learning content or action. */}
                                Reading is the first step. Checkpoints and assessments show what you {/* Display this part of the current learning interface. */}
                                understand. {/* Display this part of the current learning interface. */}
                            </p> {/* Finish this interface element. */}
                            <button // Offer this explicit learner action.
                                className="button primary full-width" // Apply the shared presentation styles to this element.
                                onClick={() => setActiveTab("practice")} // Run this action when the learner activates the control.
                            > {/* Display this part of the current learning interface. */}
                                Practice this topic <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                            </button> {/* Finish this interface element. */}
                            <Link className="button secondary full-width" to={`/quizzes?topic=${topic.id}`}> {/* Connect this item to its application route. */}
                                Take topic assessment {/* Display this part of the current learning interface. */}
                            </Link> {/* Finish this interface element. */}
                        </section> {/* Finish this interface element. */}
                    </aside> {/* Finish this interface element. */}
                </div> // Finish this interface element.
            )}{" "} {/* Display this part of the current learning interface. */}
            {/* Render topic-specific explanations, visual steps, examples, and trusted references. */}
            {activeTab === "practice" && <CheckpointPanel topic={topic} />}{" "} {/* Render this expression using the current application state. */}
            {/* Reuse the graded practice interface for this lesson. */}
            {activeTab === "notes" && <LessonNotes key={topic.id} topic={topic} />}{" "} {/* Render this expression using the current application state. */}
            {/* Reset the note editor when the route changes. */}
            <section className="panel learning-actions"> {/* Present a distinct section of study content. */}
                <div> {/* Group this section of the interface. */}
                    <strong>Your learning, your pace.</strong> {/* Emphasize this important value or label. */}
                    <p className="muted small">Mastery comes from your checkpoint and assessment results.</p> {/* Explain the adjacent learning content or action. */}
                </div> {/* Finish this interface element. */}
                <div className="action-buttons"> {/* Group this section of the interface. */}
                    <button // Offer this explicit learner action.
                        className="button secondary" // Apply the shared presentation styles to this element.
                        disabled={busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => void changeStatus("In Progress")} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        Mark started {/* Display this part of the current learning interface. */}
                    </button> {/* Finish this interface element. */}
                    <button // Offer this explicit learner action.
                        className="button secondary" // Apply the shared presentation styles to this element.
                        disabled={busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => void changeStatus("Needs Revision")} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        Add to revision {/* Display this part of the current learning interface. */}
                    </button> {/* Finish this interface element. */}
                    <button // Offer this explicit learner action.
                        className="button primary" // Apply the shared presentation styles to this element.
                        disabled={busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => void changeStatus("Completed")} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        <Check size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        Complete reading {/* Display this part of the current learning interface. */}
                    </button> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
            </section>{" "} {/* Finish this interface element. */}
            {/* Offer explicit progress actions without treating a click as mastery. */}
            <div className="lesson-pagination"> {/* Group this section of the interface. */}
                {index > 0 ? ( // Render this expression using the current application state.
                    <Link className="button ghost" to={`/learn/${siblings[index - 1].id}`}> {/* Connect this item to its application route. */}
                        <ArrowLeft size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        <span>{siblings[index - 1].title}</span> {/* Display this compact piece of interface information. */}
                    </Link> // Finish this interface element.
                ) : ( // Continue this clearly scoped calculation or control declaration.
                    <span /> // Display this compact piece of interface information.
                )} {/* Finish this rendered expression or container. */}
                {index < siblings.length - 1 && ( // Render this expression using the current application state.
                    <Link className="button ghost" to={`/learn/${siblings[index + 1].id}`}> {/* Connect this item to its application route. */}
                        <span>{siblings[index + 1].title}</span> {/* Display this compact piece of interface information. */}
                        <ArrowRight size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    </Link> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Keep previous and next lessons within reach. */}
        </div> // End the learning page.
    ); // Return the connected topic experience.
} // Finish the full topic page.
