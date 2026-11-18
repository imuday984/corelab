import { useState } from "react"; // Keep filters and note edits local to their screens.
import { Link } from "react-router-dom"; // Reconnect saved content to its original learning material.
import { // Continue this clearly scoped calculation or control declaration.
    ArrowRight, // Continue this clearly scoped calculation or control declaration.
    Bookmark, // Continue this clearly scoped calculation or control declaration.
    CalendarCheck, // Continue this clearly scoped calculation or control declaration.
    Check, // Continue this clearly scoped calculation or control declaration.
    FileText, // Continue this clearly scoped calculation or control declaration.
    Search, // Continue this clearly scoped calculation or control declaration.
    Target, // Continue this clearly scoped calculation or control declaration.
    Trash2, // Continue this clearly scoped calculation or control declaration.
    TrendingUp, // Continue this clearly scoped calculation or control declaration.
} from "lucide-react"; // Give common learning actions recognizable icons.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"; // Plot actual subject and activity statistics accessibly alongside text summaries.
import { useWorkspace } from "../lib/store"; // Read and mutate only the current learner's private workspace.
import type { Topic } from "../../shared/types"; // Preserve the curriculum's stable topic contract.

function PageHeader({ // Continue this clearly scoped calculation or control declaration.
    eyebrow, // Continue this clearly scoped calculation or control declaration.
    title, // Continue this clearly scoped calculation or control declaration.
    description, // Continue this clearly scoped calculation or control declaration.
}: { // Finish this expression or rendered group.
    eyebrow: string; // Define this field in the shared component or request contract.
    title: string; // Define this field in the shared component or request contract.
    description: string; // Define this field in the shared component or request contract.
}) { // Finish this expression or rendered group.
    // Keep related library screens visually consistent.
    return ( // Return the value or interface produced by this function.
        <div className="page-heading"> {/* Group this section of the interface. */}
            <div> {/* Group this section of the interface. */}
                <p className="eyebrow">{eyebrow}</p> {/* Explain the adjacent learning content or action. */}
                <h1>{title}</h1> {/* State the main purpose of this screen. */}
                <p className="muted">{description}</p> {/* Explain the adjacent learning content or action. */}
            </div> {/* Finish this interface element. */}
        </div> // Finish this interface element.
    ); // Present the screen's main learning task early.
} // Finish the shared page heading.

export function RevisionPage() { // Continue this clearly scoped calculation or control declaration.
    // Connect spaced repetition and weak-area review.
    const { workspace, topics, completeRevision, notify } = useWorkspace(); // Load real review dates and assessment evidence.
    const [tab, setTab] = useState<"due" | "weak" | "all">("due"); // Let learners choose a focused revision list.
    const [busy, setBusy] = useState<string | null>(null); // Disable only the review currently being updated.
    const now = new Date(); // Compare schedules with the learner's current time.
    const revision = workspace.progress.filter( // Calculate or retain this value for the current render.
        (progress) => progress.status === "Needs Revision" || progress.reviewAt, // Continue this clearly scoped calculation or control declaration.
    ); // Include scheduled and explicitly requested review topics.
    const due = revision.filter( // Calculate or retain this value for the current render.
        (progress) => // Continue this clearly scoped calculation or control declaration.
            progress.status === "Needs Revision" || (progress.reviewAt && new Date(progress.reviewAt) <= now), // Continue this clearly scoped calculation or control declaration.
    ); // Highlight overdue and due-now topics.
    const latestEvidence = new Map<string, { topicId: string; correct: boolean | null; createdAt: string }>(); // Keep weak areas based on the newest answer rather than permanent historical mistakes.
    for (const attempt of workspace.attempts) { // Read every retained checkpoint attempt without deleting history.
        const previous = latestEvidence.get(attempt.questionId); // Compare this response with the most recent known evidence.
        if (!previous || attempt.createdAt >= previous.createdAt) latestEvidence.set(attempt.questionId, attempt); // Let a later assessed response replace an older mistake.
    } // Finish checkpoint evidence selection.
    for (const quiz of workspace.quizzes) { // Include recent assessment answers in the same evidence map.
        for (const answer of quiz.answers) { // Evaluate each question independently of its assessment neighbors.
            const previous = latestEvidence.get(answer.questionId); // Read the latest checkpoint or assessment evidence for this question.
            if (!previous || quiz.createdAt >= previous.createdAt) latestEvidence.set(answer.questionId, { topicId: answer.topicId, correct: answer.correct, createdAt: quiz.createdAt }); // Resolve old errors when a later answer demonstrates understanding.
        } // Finish this assessment's question evidence.
    } // Finish combined latest-evidence selection.
    const weakIds = new Set([...latestEvidence.values()].filter(evidence => evidence.correct === false).map(evidence => evidence.topicId)); // Recommend topics that still contain a current incorrect answer.
    const items = // Calculate or retain this value for the current render.
        tab === "weak" // Continue this clearly scoped calculation or control declaration.
            ? topics.filter((topic) => weakIds.has(topic.id)) // Choose the content appropriate to the current state.
            : topics.filter((topic) => // Choose the content appropriate to the current state.
                  (tab === "due" ? due : revision).some((progress) => progress.topicId === topic.id), // Continue this clearly scoped calculation or control declaration.
              ); // Resolve the selected list to actual curriculum content.
    async function review(topicId: string) { // Continue this clearly scoped calculation or control declaration.
        // Complete this repetition and schedule the next interval.
        setBusy(topicId); // Prevent duplicate updates for this topic.
        try { // Run the operation while preserving a recoverable error path.
            await completeRevision(topicId); // Wait for this data operation before continuing.
            notify("Revision complete. Your next review has been scheduled."); // Continue this clearly scoped calculation or control declaration.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Could not update this revision."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Report the durable operation's result.
            setBusy(null); // Update the corresponding local interface state.
        } // Restore the review controls.
    } // Finish the review completion handler.
    return ( // Return the value or interface produced by this function.
        // Render a focused revision workspace.
        <div className="learning-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep revision content aligned with the main workspace. */}
            <PageHeader // Render this reusable visual component.
                eyebrow="REMEMBER MORE, RELEARN LESS" // Continue this clearly scoped calculation or control declaration.
                title="Keep your knowledge fresh." // Continue this clearly scoped calculation or control declaration.
                description="Revisit the right concept at the right time. Small reviews build lasting understanding." // Continue this clearly scoped calculation or control declaration.
            />{" "} {/* Display this part of the current learning interface. */}
            {/* Explain the purpose of scheduled revision. */}
            <div className="stats-grid"> {/* Group this section of the interface. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Ready for review</span> {/* Display this compact piece of interface information. */}
                    <strong>{due.length}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">Due and marked for revision</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Topics to strengthen</span> {/* Display this compact piece of interface information. */}
                    <strong>{weakIds.size}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">From incorrect answers</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Scheduled topics</span> {/* Display this compact piece of interface information. */}
                    <strong>{revision.length}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">Your spaced repetition queue</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Summarize real revision evidence with clear labels. */}
            <div className="tabs" role="tablist" aria-label="Revision filters"> {/* Group this section of the interface. */}
                {( // Render this expression using the current application state.
                    [ // Continue this clearly scoped calculation or control declaration.
                        { id: "due", label: `To review (${due.length})` }, // Render this expression using the current application state.
                        { id: "weak", label: `Weak topics (${weakIds.size})` }, // Render this expression using the current application state.
                        { id: "all", label: "All scheduled" }, // Render this expression using the current application state.
                    ] as const // Continue this clearly scoped calculation or control declaration.
                ).map((item) => ( // Continue this clearly scoped calculation or control declaration.
                    <button // Offer this explicit learner action.
                        role="tab" // Declare this element’s semantic interaction role.
                        aria-selected={tab === item.id} // Expose the control state or purpose to assistive technology.
                        key={item.id} // Give React a stable identity for this repeated item.
                        className={`tab ${tab === item.id ? "active" : ""}`} // Apply the shared presentation styles to this element.
                        onClick={() => setTab(item.id)} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        {item.label} {/* Render this expression using the current application state. */}
                    </button> // Finish this interface element.
                ))} {/* Finish this rendered expression or container. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Let learners inspect due topics and weak evidence separately. */}
            <section className="panel"> {/* Present a distinct section of study content. */}
                <div className="panel-header"> {/* Group this section of the interface. */}
                    <h2> {/* Introduce this group of related information. */}
                        {tab === "due" // Render this expression using the current application state.
                            ? "Your next reviews" // Choose the content appropriate to the current state.
                            : tab === "weak" // Choose the content appropriate to the current state.
                              ? "Concepts that need another look" // Choose the content appropriate to the current state.
                              : "Your revision schedule"} {/* Choose the content appropriate to the current state. */}
                    </h2> {/* Finish this interface element. */}
                    <span className="muted small">1 → 3 → 7 → 14 → 30 days</span> {/* Display this compact piece of interface information. */}
                </div> {/* Finish this interface element. */}
                {items.length ? ( // Render this expression using the current application state.
                    <div className="topic-list"> {/* Group this section of the interface. */}
                        {items.map((topic) => { // Render this expression using the current application state.
                            const progress = workspace.progress.find((item) => item.topicId === topic.id); // Calculate or retain this value for the current render.
                            return ( // Return the value or interface produced by this function.
                                <div className="topic-row" key={topic.id}> {/* Group this section of the interface. */}
                                    <span className="topic-row-icon"> {/* Display this compact piece of interface information. */}
                                        <CalendarCheck size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                    </span> {/* Finish this interface element. */}
                                    <Link to={`/learn/${topic.id}`} className="topic-row-main"> {/* Connect this item to its application route. */}
                                        <strong>{topic.title}</strong> {/* Emphasize this important value or label. */}
                                        <small> {/* Present secondary context without hiding it. */}
                                            {progress?.reviewAt // Render this expression using the current application state.
                                                ? `Review ${new Date(progress.reviewAt).toLocaleDateString()} · repetition ${(progress.reviewStep ?? 0) + 1}` // Choose the content appropriate to the current state.
                                                : "Review your explanation, then practice again"} {/* Choose the content appropriate to the current state. */}
                                        </small> {/* Finish this interface element. */}
                                    </Link> {/* Finish this interface element. */}
                                    <Link className="button ghost" to={`/learn/${topic.id}`}> {/* Connect this item to its application route. */}
                                        Review {/* Display this part of the current learning interface. */}
                                    </Link> {/* Finish this interface element. */}
                                    <button // Offer this explicit learner action.
                                        className="button secondary" // Apply the shared presentation styles to this element.
                                        disabled={busy === topic.id} // Prevent this action while its required conditions are unmet.
                                        onClick={() => void review(topic.id)} // Run this action when the learner activates the control.
                                    > {/* Display this part of the current learning interface. */}
                                        <Check size={15} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                        {busy === topic.id ? "Saving…" : "Reviewed"} {/* Render this expression using the current application state. */}
                                    </button> {/* Finish this interface element. */}
                                </div> // Finish this interface element.
                            ); // Finish the current expression or code block.
                        })} {/* Finish this rendered expression or container. */}
                    </div> // Finish this interface element.
                ) : ( // Continue this clearly scoped calculation or control declaration.
                    <div className="empty-state"> {/* Group this section of the interface. */}
                        <CalendarCheck size={32} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        <h3>{tab === "due" ? "You are all caught up." : "Your revision list is clear."}</h3> {/* Label this specific learning item. */}
                        <p className="muted"> {/* Explain the adjacent learning content or action. */}
                            Complete a topic or add one to revision from its learning page. Incorrect practice {/* Display this part of the current learning interface. */}
                            answers also help identify weak areas. {/* Display this part of the current learning interface. */}
                        </p> {/* Finish this interface element. */}
                        <Link to="/subjects" className="button secondary"> {/* Connect this item to its application route. */}
                            Explore subjects <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                    </div> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </section>{" "} {/* Finish this interface element. */}
            {/* Offer useful empty states and functional review completion. */}
            <p className="muted small"> {/* Explain the adjacent learning content or action. */}
                A review is your own confirmation that you revisited the material. Mastery still depends on {/* Display this part of the current learning interface. */}
                checkpoint and assessment performance. {/* Display this part of the current learning interface. */}
            </p>{" "} {/* Finish this interface element. */}
            {/* Explain the limit of a self-reported revision event. */}
        </div> // End the revision workspace.
    ); // Return the complete revision center.
} // Finish the revision page.

export function BookmarksPage() { // Continue this clearly scoped calculation or control declaration.
    // Collect saved concepts without duplicating curriculum content.
    const { topics, subjects, workspace, toggleBookmark, notify } = useWorkspace(); // Load saved topic identifiers and the associated content.
    const [search, setSearch] = useState(""); // Let learners quickly filter their saved library.
    const saved = topics.filter( // Calculate or retain this value for the current render.
        (topic) => // Continue this clearly scoped calculation or control declaration.
            workspace.bookmarks.includes(topic.id) && // Continue this clearly scoped calculation or control declaration.
            `${topic.title} ${topic.module}`.toLowerCase().includes(search.toLowerCase()), // Continue this clearly scoped calculation or control declaration.
    ); // Resolve only bookmarked topics matching the search.
    return ( // Return the value or interface produced by this function.
        <div className="learning-page"> {/* Group this section of the interface. */}
            <PageHeader // Render this reusable visual component.
                eyebrow="YOUR PERSONAL REFERENCE SHELF" // Continue this clearly scoped calculation or control declaration.
                title="Good concepts. Kept close." // Continue this clearly scoped calculation or control declaration.
                description="Return to the ideas, explanations, and questions you want to keep within reach." // Continue this clearly scoped calculation or control declaration.
            /> {/* Display this part of the current learning interface. */}
            <label className="search-field"> {/* Associate an accessible name with this control. */}
                <Search size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                <input // Collect the learner input shown here.
                    aria-label="Search bookmarked topics" // Expose the control state or purpose to assistive technology.
                    value={search} // Keep the displayed control value synchronized with state.
                    onChange={(event) => setSearch(event.target.value)} // Update local form state when this value changes.
                    placeholder="Search your saved topics…" // Suggest the kind of response expected by this field.
                /> {/* Display this part of the current learning interface. */}
            </label> {/* Finish this interface element. */}
            <section className="panel"> {/* Present a distinct section of study content. */}
                <div className="panel-header"> {/* Group this section of the interface. */}
                    <h2>Bookmarked concepts</h2> {/* Introduce this group of related information. */}
                    <span className="muted small">{saved.length} saved</span> {/* Display this compact piece of interface information. */}
                </div> {/* Finish this interface element. */}
                {saved.length ? ( // Render this expression using the current application state.
                    <div className="topic-list"> {/* Group this section of the interface. */}
                        {saved.map((topic) => ( // Render this expression using the current application state.
                            <div className="topic-row" key={topic.id}> {/* Group this section of the interface. */}
                                <span className="topic-row-icon"> {/* Display this compact piece of interface information. */}
                                    <Bookmark size={17} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                </span> {/* Finish this interface element. */}
                                <Link className="topic-row-main" to={`/learn/${topic.id}`}> {/* Connect this item to its application route. */}
                                    <strong>{topic.title}</strong> {/* Emphasize this important value or label. */}
                                    <small> {/* Present secondary context without hiding it. */}
                                        { // Render this expression using the current application state.
                                            subjects.find((subject) => subject.id === topic.subjectId) // Continue this clearly scoped calculation or control declaration.
                                                ?.shortTitle // Choose the content appropriate to the current state.
                                        }{" "} {/* Finish this expression or rendered group. */}
                                        · {topic.module} · {topic.minutes} min read {/* Display this part of the current learning interface. */}
                                    </small> {/* Finish this interface element. */}
                                </Link> {/* Finish this interface element. */}
                                <button // Offer this explicit learner action.
                                    className="button ghost" // Apply the shared presentation styles to this element.
                                    aria-label={`Remove ${topic.title} from bookmarks`} // Expose the control state or purpose to assistive technology.
                                    onClick={() => // Run this action when the learner activates the control.
                                        void toggleBookmark(topic.id).catch((error) => notify(error.message)) // Continue this clearly scoped calculation or control declaration.
                                    } // Finish the current expression or code block.
                                > {/* Display this part of the current learning interface. */}
                                    <Trash2 size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                </button> {/* Finish this interface element. */}
                                <Link className="button secondary" to={`/learn/${topic.id}`}> {/* Connect this item to its application route. */}
                                    Open topic <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                                </Link> {/* Finish this interface element. */}
                            </div> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </div> // Finish this interface element.
                ) : ( // Continue this clearly scoped calculation or control declaration.
                    <div className="empty-state"> {/* Group this section of the interface. */}
                        <Bookmark size={32} aria-hidden="true" /> {/* Render this reusable visual component. */}
                        <h3> {/* Label this specific learning item. */}
                            {search // Render this expression using the current application state.
                                ? "No saved topics match your search." // Choose the content appropriate to the current state.
                                : "Start your own reference shelf."} {/* Choose the content appropriate to the current state. */}
                        </h3> {/* Finish this interface element. */}
                        <p className="muted">Use the bookmark button on any lesson to save it here.</p> {/* Explain the adjacent learning content or action. */}
                        <Link className="button secondary" to="/subjects"> {/* Connect this item to its application route. */}
                            Explore the curriculum {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                    </div> // Finish this interface element.
                )} {/* Finish this rendered expression or container. */}
            </section> {/* Finish this interface element. */}
        </div> // Finish this interface element.
    ); // Connect the saved list to learning and deletion actions.
} // Finish the bookmarks page.

function NoteCard({ topic, initialText }: { topic: Topic; initialText: string }) { // Continue this clearly scoped calculation or control declaration.
    // Isolate local editing state for each persisted note.
    const { saveNote, notify } = useWorkspace(); // Use the shared API-backed note mutation.
    const [text, setText] = useState(initialText); // Preserve edits until the learner saves or clears them.
    const [busy, setBusy] = useState(false); // Block duplicate note mutations.
    async function save(value: string) { // Continue this clearly scoped calculation or control declaration.
        // Persist or clear a note explicitly.
        setBusy(true); // Disable controls while saving.
        try { // Run the operation while preserving a recoverable error path.
            await saveNote(topic.id, value); // Wait for this data operation before continuing.
            notify(value.trim() ? "Note saved." : "Note deleted."); // Continue this clearly scoped calculation or control declaration.
        } catch (error) { // Finish this expression or rendered group.
            notify(error instanceof Error ? error.message : "Your note could not be saved."); // Continue this clearly scoped calculation or control declaration.
        } finally { // Finish this expression or rendered group.
            // Report actual persistence results.
            setBusy(false); // Update the corresponding local interface state.
        } // Restore controls when the mutation finishes.
    } // Finish the note mutation handler.
    return ( // Return the value or interface produced by this function.
        <article className="panel note-card"> {/* Keep this learning item self-contained. */}
            <div className="row-between"> {/* Group this section of the interface. */}
                <div> {/* Group this section of the interface. */}
                    <span className="eyebrow">{topic.module}</span> {/* Display this compact piece of interface information. */}
                    <h2> {/* Introduce this group of related information. */}
                        <Link to={`/learn/${topic.id}`}>{topic.title}</Link> {/* Connect this item to its application route. */}
                    </h2> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <FileText size={20} aria-hidden="true" /> {/* Render this reusable visual component. */}
            </div> {/* Finish this interface element. */}
            <label className="sr-only" htmlFor={`note-${topic.id}`}> {/* Associate an accessible name with this control. */}
                Personal note for {topic.title} {/* Display this part of the current learning interface. */}
            </label> {/* Finish this interface element. */}
            <textarea // Allow the learner to write and edit a response.
                className="textarea" // Apply the shared presentation styles to this element.
                id={`note-${topic.id}`} // Connect this control to its visible or screen-reader label.
                value={text} // Keep the displayed control value synchronized with state.
                onChange={(event) => setText(event.target.value)} // Update local form state when this value changes.
                rows={7} // Reserve a comfortable initial height for written responses.
            /> {/* Display this part of the current learning interface. */}
            <div className="row-between"> {/* Group this section of the interface. */}
                <Link to={`/learn/${topic.id}`} className="text-link"> {/* Connect this item to its application route. */}
                    Revisit topic <ArrowRight size={14} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                </Link> {/* Finish this interface element. */}
                <div className="action-buttons"> {/* Group this section of the interface. */}
                    <button // Offer this explicit learner action.
                        className="button ghost" // Apply the shared presentation styles to this element.
                        aria-label={`Delete note for ${topic.title}`} // Expose the control state or purpose to assistive technology.
                        disabled={busy} // Prevent this action while its required conditions are unmet.
                        onClick={() => { // Run this action when the learner activates the control.
                            if (window.confirm("Delete this study note?")) void save(""); // Handle this condition before continuing the normal flow.
                        }} // Finish the current expression or code block.
                    > {/* Display this part of the current learning interface. */}
                        <Trash2 size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    </button> {/* Finish this interface element. */}
                    <button // Offer this explicit learner action.
                        className="button secondary" // Apply the shared presentation styles to this element.
                        disabled={busy || text === initialText} // Prevent this action while its required conditions are unmet.
                        onClick={() => void save(text)} // Run this action when the learner activates the control.
                    > {/* Display this part of the current learning interface. */}
                        {busy ? "Saving…" : "Save changes"} {/* Render this expression using the current application state. */}
                    </button> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
            </div> {/* Finish this interface element. */}
        </article> // Finish this interface element.
    ); // Keep editing, saving, and deletion explicit and accessible.
} // Finish the individual note editor.

export function NotesPage() { // Continue this clearly scoped calculation or control declaration.
    // Collect personal explanations and interview preparation notes.
    const { topics, workspace } = useWorkspace(); // Read only this learner's notes and their source lessons.
    const [search, setSearch] = useState(""); // Filter notes by title and content.
    const [newTopicId, setNewTopicId] = useState(""); // Support creating a note for an existing curriculum topic.
    const saved = workspace.notes.filter( // Calculate or retain this value for the current render.
        (note) => // Continue this clearly scoped calculation or control declaration.
            note.text.trim() && // Continue this clearly scoped calculation or control declaration.
            `${topics.find((topic) => topic.id === note.topicId)?.title ?? ""} ${note.text}` // Continue this clearly scoped calculation or control declaration.
                .toLowerCase() // Continue the transformation of this collection.
                .includes(search.toLowerCase()), // Continue the transformation of this collection.
    ); // Keep the saved library searchable by both concept and wording.
    const newTopic = topics.find((topic) => topic.id === newTopicId); // Resolve the optional new-note editor.
    return ( // Return the value or interface produced by this function.
        <div className="learning-page"> {/* Group this section of the interface. */}
            <PageHeader // Render this reusable visual component.
                eyebrow="THINK IT THROUGH. WRITE IT DOWN." // Continue this clearly scoped calculation or control declaration.
                title="Your words. Your understanding." // Continue this clearly scoped calculation or control declaration.
                description="Build a personal study notebook, one explanation and one useful connection at a time." // Continue this clearly scoped calculation or control declaration.
            /> {/* Display this part of the current learning interface. */}
            <div className="filter-bar"> {/* Group this section of the interface. */}
                <label className="search-field grow"> {/* Associate an accessible name with this control. */}
                    <Search size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    <input // Collect the learner input shown here.
                        aria-label="Search personal notes" // Expose the control state or purpose to assistive technology.
                        value={search} // Keep the displayed control value synchronized with state.
                        onChange={(event) => setSearch(event.target.value)} // Update local form state when this value changes.
                        placeholder="Search your notes…" // Suggest the kind of response expected by this field.
                    /> {/* Display this part of the current learning interface. */}
                </label> {/* Finish this interface element. */}
                <label className="form-field"> {/* Associate an accessible name with this control. */}
                    <span className="sr-only">Create a note for a topic</span> {/* Display this compact piece of interface information. */}
                    <select // Let the learner choose among the available options.
                        className="select" // Apply the shared presentation styles to this element.
                        value={newTopicId} // Keep the displayed control value synchronized with state.
                        onChange={(event) => setNewTopicId(event.target.value)} // Update local form state when this value changes.
                    > {/* Display this part of the current learning interface. */}
                        <option value="">+ Add a note for a topic</option> {/* Provide one valid selection value. */}
                        {topics // Render this expression using the current application state.
                            .filter( // Continue the transformation of this collection.
                                (topic) => // Continue this clearly scoped calculation or control declaration.
                                    !workspace.notes.some( // Continue this clearly scoped calculation or control declaration.
                                        (note) => note.topicId === topic.id && note.text.trim(), // Continue this clearly scoped calculation or control declaration.
                                    ), // Finish the current expression or code block.
                            ) // Finish the current expression or code block.
                            .map((topic) => ( // Continue the transformation of this collection.
                                <option key={topic.id} value={topic.id}> {/* Provide one valid selection value. */}
                                    {topic.title} {/* Render this expression using the current application state. */}
                                </option> // Finish this interface element.
                            ))} {/* Finish this rendered expression or container. */}
                    </select> {/* Finish this interface element. */}
                </label> {/* Finish this interface element. */}
            </div> {/* Finish this interface element. */}
            {newTopic && // Render this expression using the current application state.
                !workspace.notes.some((note) => note.topicId === newTopic.id && note.text.trim()) && ( // Continue this clearly scoped calculation or control declaration.
                    <NoteCard key={`new-${newTopic.id}`} topic={newTopic} initialText="" /> // Render this reusable visual component.
                )} {/* Finish this rendered expression or container. */}
            <div className="notes-grid"> {/* Group this section of the interface. */}
                {saved.map((note) => { // Render this expression using the current application state.
                    const topic = topics.find((item) => item.id === note.topicId); // Calculate or retain this value for the current render.
                    return topic ? ( // Return the value or interface produced by this function.
                        <NoteCard // Render this reusable visual component.
                            key={`${note.topicId}-${note.updatedAt}`} // Give React a stable identity for this repeated item.
                            topic={topic} // Continue this clearly scoped calculation or control declaration.
                            initialText={note.text} // Continue this clearly scoped calculation or control declaration.
                        /> // Continue this clearly scoped calculation or control declaration.
                    ) : null; // Continue this clearly scoped calculation or control declaration.
                })} {/* Finish this rendered expression or container. */}
            </div> {/* Finish this interface element. */}
            {!saved.length && !newTopic && ( // Render this expression using the current application state.
                <div className="panel empty-state"> {/* Group this section of the interface. */}
                    <FileText size={32} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    <h3> {/* Label this specific learning item. */}
                        {search ? "No notes match that search." : "A notebook waiting for your first idea."} {/* Render this expression using the current application state. */}
                    </h3> {/* Finish this interface element. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        Choose a topic above or open the My notes tab in any lesson to write your first note. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                    <Link to="/subjects" className="button secondary"> {/* Connect this item to its application route. */}
                        Find a concept to study {/* Display this part of the current learning interface. */}
                    </Link> {/* Finish this interface element. */}
                </div> // Finish this interface element.
            )} {/* Finish this rendered expression or container. */}
        </div> // Finish this interface element.
    ); // Show actual notes and a direct topic-based creation workflow.
} // Finish the personal notes library.

export function AnalyticsPage() { // Continue this clearly scoped calculation or control declaration.
    // Explain progress and readiness using transparent evidence.
    const { workspace, topics, subjects } = useWorkspace(); // Use the same real learning events as the rest of the application.
    const completed = workspace.progress.filter((progress) => // Calculate or retain this value for the current render.
        ["Completed", "Mastered"].includes(progress.status), // Continue this clearly scoped calculation or control declaration.
    ).length; // Count completed reading and demonstrated mastery states.
    const mastered = workspace.progress.filter((progress) => progress.status === "Mastered").length; // Keep mastery distinct from completion.
    const assessed = workspace.attempts.filter((attempt) => attempt.correct !== null); // Exclude unassessed descriptive answers from accuracy.
    const checkpointAccuracy = assessed.length // Calculate or retain this value for the current render.
        ? Math.round((assessed.filter((attempt) => attempt.correct).length / assessed.length) * 100) // Choose the content appropriate to the current state.
        : 0; // Calculate accuracy from actual recorded attempts.
    const totalQuestions = workspace.quizzes.reduce((sum, quiz) => sum + quiz.total, 0); // Weight assessment accuracy by question count.
    const quizAccuracy = totalQuestions // Calculate or retain this value for the current render.
        ? Math.round((workspace.quizzes.reduce((sum, quiz) => sum + quiz.correct, 0) / totalQuestions) * 100) // Choose the content appropriate to the current state.
        : 0; // Avoid averaging differently sized quizzes equally.
    const reviews = workspace.progress.filter((progress) => progress.reviewStep > 0).length; // Count topics with at least one completed revision.
    const completion = topics.length ? (completed / topics.length) * 100 : 0; // Normalize reading completion over the actual curriculum size.
    const mastery = topics.length ? (mastered / topics.length) * 100 : 0; // Normalize mastered topics independently of reading.
    const consistency = workspace.progress.length ? (reviews / workspace.progress.length) * 100 : 0; // Measure revision coverage across started topics.
    const readiness = Math.round( // Calculate or retain this value for the current render.
        completion * 0.25 + // Continue this clearly scoped calculation or control declaration.
            checkpointAccuracy * 0.25 + // Continue this clearly scoped calculation or control declaration.
            quizAccuracy * 0.25 + // Continue this clearly scoped calculation or control declaration.
            mastery * 0.15 + // Continue this clearly scoped calculation or control declaration.
            consistency * 0.1, // Continue this clearly scoped calculation or control declaration.
    ); // Keep the preparation index transparent and reproducible.
    const subjectData = subjects.map((subject) => { // Calculate or retain this value for the current render.
        const ids = new Set( // Calculate or retain this value for the current render.
            topics.filter((topic) => topic.subjectId === subject.id).map((topic) => topic.id), // Continue this clearly scoped calculation or control declaration.
        ); // Finish the current expression or code block.
        const done = workspace.progress.filter( // Calculate or retain this value for the current render.
            (progress) => ids.has(progress.topicId) && ["Completed", "Mastered"].includes(progress.status), // Continue this clearly scoped calculation or control declaration.
        ).length; // Continue this clearly scoped calculation or control declaration.
        return { // Return the value or interface produced by this function.
            name: subject.shortTitle, // Define this field in the shared component or request contract.
            completion: ids.size ? Math.round((done / ids.size) * 100) : 0, // Define this field in the shared component or request contract.
            completed: done, // Define this field in the shared component or request contract.
            total: ids.size, // Define this field in the shared component or request contract.
            color: subject.color, // Define this field in the shared component or request contract.
        }; // Finish the current expression or code block.
    }); // Build each subject's chart from its own topic denominator.
    const levelData = (["Easy", "Medium", "Hard"] as const).map((level) => { // Calculate or retain this value for the current render.
        const attempts = assessed.filter((attempt) => attempt.difficulty === level); // Calculate or retain this value for the current render.
        return { // Return the value or interface produced by this function.
            level, // Continue this clearly scoped calculation or control declaration.
            accuracy: attempts.length // Define this field in the shared component or request contract.
                ? Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100) // Choose the content appropriate to the current state.
                : 0, // Choose the content appropriate to the current state.
            count: attempts.length, // Define this field in the shared component or request contract.
        }; // Finish the current expression or code block.
    }); // Compare difficulty performance without filling in missing evidence.
    return ( // Return the value or interface produced by this function.
        // Render concise analytics with numerical explanations.
        <div className="learning-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Keep all analytics within the shared application layout. */}
            <PageHeader // Render this reusable visual component.
                eyebrow="MEASURE THE WORK THAT MATTERS" // Continue this clearly scoped calculation or control declaration.
                title="See your understanding grow." // Continue this clearly scoped calculation or control declaration.
                description="A clear picture of what you have studied, practiced, and retained." // Continue this clearly scoped calculation or control declaration.
            />{" "} {/* Display this part of the current learning interface. */}
            {/* Lead with the purpose of the evidence. */}
            <div className="stats-grid"> {/* Group this section of the interface. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Reading completion</span> {/* Display this compact piece of interface information. */}
                    <strong>{Math.round(completion)}%</strong> {/* Emphasize this important value or label. */}
                    <small className="muted"> {/* Present secondary context without hiding it. */}
                        {completed} of {topics.length} topics {/* Render this expression using the current application state. */}
                    </small> {/* Finish this interface element. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Checkpoint accuracy</span> {/* Display this compact piece of interface information. */}
                    <strong>{assessed.length ? `${checkpointAccuracy}%` : "—"}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">{assessed.length} assessed attempts</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Assessment accuracy</span> {/* Display this compact piece of interface information. */}
                    <strong>{totalQuestions ? `${quizAccuracy}%` : "—"}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">{workspace.quizzes.length} completed assessments</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
                <div className="stat-card"> {/* Group this section of the interface. */}
                    <span className="muted">Topics mastered</span> {/* Display this compact piece of interface information. */}
                    <strong>{mastered}</strong> {/* Emphasize this important value or label. */}
                    <small className="muted">Earned through performance</small> {/* Present secondary context without hiding it. */}
                </div> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Show measured values and explicit empty states. */}
            <div className="split-grid analytics-grid"> {/* Group this section of the interface. */}
                <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                    <div className="panel-header"> {/* Group this section of the interface. */}
                        <h2>Subject completion</h2> {/* Introduce this group of related information. */}
                        <TrendingUp size={18} aria-hidden="true" /> {/* Render this reusable visual component. */}
                    </div> {/* Finish this interface element. */}
                    <div // Group this section of the interface.
                        className="chart-container" // Apply the shared presentation styles to this element.
                        role="img" // Declare this element’s semantic interaction role.
                        aria-label={subjectData.map((item) => `${item.name}: ${item.completion}%`).join(", ")} // Expose the control state or purpose to assistive technology.
                    > {/* Display this part of the current learning interface. */}
                        <ResponsiveContainer width="100%" height={260}> {/* Render this reusable visual component. */}
                            <BarChart // Render this reusable visual component.
                                data={subjectData} // Continue this clearly scoped calculation or control declaration.
                                margin={{ top: 10, right: 10, bottom: 10, left: -20 }} // Continue this clearly scoped calculation or control declaration.
                            > {/* Display this part of the current learning interface. */}
                                <CartesianGrid stroke="var(--line, #292a34)" vertical={false} /> {/* Render this reusable visual component. */}
                                <XAxis // Render this reusable visual component.
                                    dataKey="name" // Continue this clearly scoped calculation or control declaration.
                                    tick={{ fill: "var(--muted, #9b9ca8)", fontSize: 11 }} // Continue this clearly scoped calculation or control declaration.
                                    axisLine={false} // Continue this clearly scoped calculation or control declaration.
                                    tickLine={false} // Continue this clearly scoped calculation or control declaration.
                                /> {/* Display this part of the current learning interface. */}
                                <YAxis // Render this reusable visual component.
                                    domain={[0, 100]} // Continue this clearly scoped calculation or control declaration.
                                    tick={{ fill: "var(--muted, #9b9ca8)", fontSize: 11 }} // Continue this clearly scoped calculation or control declaration.
                                    axisLine={false} // Continue this clearly scoped calculation or control declaration.
                                    tickLine={false} // Continue this clearly scoped calculation or control declaration.
                                    tickFormatter={(value) => `${value}%`} // Continue this clearly scoped calculation or control declaration.
                                /> {/* Display this part of the current learning interface. */}
                                <Tooltip // Render this reusable visual component.
                                    contentStyle={{ // Continue this clearly scoped calculation or control declaration.
                                        background: "var(--surface, #18191f)", // Define this field in the shared component or request contract.
                                        border: "1px solid var(--line, #292a34)", // Define this field in the shared component or request contract.
                                        borderRadius: 10, // Define this field in the shared component or request contract.
                                        color: "var(--text, #f4f3f8)", // Define this field in the shared component or request contract.
                                    }} // Finish the current expression or code block.
                                    formatter={(value) => [`${value}%`, "Completion"]} // Continue this clearly scoped calculation or control declaration.
                                    cursor={{ fill: "rgba(164,154,255,.05)" }} // Continue this clearly scoped calculation or control declaration.
                                /> {/* Display this part of the current learning interface. */}
                                <Bar // Render this reusable visual component.
                                    dataKey="completion" // Continue this clearly scoped calculation or control declaration.
                                    fill="#a49aff" // Continue this clearly scoped calculation or control declaration.
                                    radius={[5, 5, 0, 0]} // Continue this clearly scoped calculation or control declaration.
                                    maxBarSize={36} // Continue this clearly scoped calculation or control declaration.
                                /> {/* Display this part of the current learning interface. */}
                            </BarChart> {/* Finish this interface element. */}
                        </ResponsiveContainer> {/* Finish this interface element. */}
                    </div> {/* Finish this interface element. */}
                    <div className="subject-stat-list"> {/* Group this section of the interface. */}
                        {subjectData.map((item) => ( // Render this expression using the current application state.
                            <div className="row-between small" key={item.name}> {/* Group this section of the interface. */}
                                <span>{item.name}</span> {/* Display this compact piece of interface information. */}
                                <span className="muted"> {/* Display this compact piece of interface information. */}
                                    {item.completed}/{item.total} topics · {item.completion}% {/* Render this expression using the current application state. */}
                                </span> {/* Finish this interface element. */}
                            </div> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </div> {/* Finish this interface element. */}
                </section> {/* Finish this interface element. */}
                <section className="panel lesson-section readiness-explanation"> {/* Present a distinct section of study content. */}
                    <p className="eyebrow">PREPARATION INDEX</p> {/* Explain the adjacent learning content or action. */}
                    <div className="readiness-number"> {/* Group this section of the interface. */}
                        {readiness} {/* Render this expression using the current application state. */}
                        <span>/100</span> {/* Display this compact piece of interface information. */}
                    </div> {/* Finish this interface element. */}
                    <h2>Interview readiness</h2> {/* Introduce this group of related information. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        This is a study progress indicator. It does not predict placement or interview {/* Display this part of the current learning interface. */}
                        success. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                    <details className="interview-question"> {/* Keep supporting explanations expandable. */}
                        <summary>How this score is calculated</summary> {/* Provide the keyboard-accessible disclosure label. */}
                        <ul className="formula-list"> {/* List related study points or references. */}
                            <li>25% reading completion: {Math.round(completion)}%</li> {/* Render this item in the surrounding list. */}
                            <li>25% checkpoint accuracy: {checkpointAccuracy}%</li> {/* Render this item in the surrounding list. */}
                            <li>25% assessment accuracy: {quizAccuracy}%</li> {/* Render this item in the surrounding list. */}
                            <li>15% topic mastery: {Math.round(mastery)}%</li> {/* Render this item in the surrounding list. */}
                            <li>10% revision coverage: {Math.round(consistency)}%</li> {/* Render this item in the surrounding list. */}
                        </ul> {/* Finish this interface element. */}
                        <p className="small muted"> {/* Explain the adjacent learning content or action. */}
                            Missing assessment evidence contributes zero. Mastery thresholds are configurable {/* Display this part of the current learning interface. */}
                            in Settings. {/* Display this part of the current learning interface. */}
                        </p> {/* Finish this interface element. */}
                    </details> {/* Finish this interface element. */}
                    <Link to="/quizzes" className="button primary"> {/* Connect this item to its application route. */}
                        Test your understanding <ArrowRight size={15} aria-hidden="true" /> {/* Display this part of the current learning interface. */}
                    </Link> {/* Finish this interface element. */}
                </section> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Pair each chart with text and explain the preparation score's limits. */}
            <div className="split-grid"> {/* Group this section of the interface. */}
                <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                    <h2>Performance by difficulty</h2> {/* Introduce this group of related information. */}
                    <div className="level-performance"> {/* Group this section of the interface. */}
                        {levelData.map((item) => ( // Render this expression using the current application state.
                            <div key={item.level}> {/* Group this section of the interface. */}
                                <div className="row-between"> {/* Group this section of the interface. */}
                                    <strong>{item.level}</strong> {/* Emphasize this important value or label. */}
                                    <span className="muted small"> {/* Display this compact piece of interface information. */}
                                        {item.count // Render this expression using the current application state.
                                            ? `${item.accuracy}% · ${item.count} attempts` // Choose the content appropriate to the current state.
                                            : "No assessed attempts"} {/* Choose the content appropriate to the current state. */}
                                    </span> {/* Finish this interface element. */}
                                </div> {/* Finish this interface element. */}
                                <div className="progress-track"> {/* Group this section of the interface. */}
                                    <span className="progress-fill" style={{ width: `${item.accuracy}%` }} /> {/* Display this compact piece of interface information. */}
                                </div> {/* Finish this interface element. */}
                            </div> // Finish this interface element.
                        ))} {/* Finish this rendered expression or container. */}
                    </div> {/* Finish this interface element. */}
                    <p className="muted small"> {/* Explain the adjacent learning content or action. */}
                        Written checkpoint answers include your explicit self-assessment. Submitted text alone {/* Display this part of the current learning interface. */}
                        is never counted as correct. {/* Display this part of the current learning interface. */}
                    </p> {/* Finish this interface element. */}
                </section> {/* Finish this interface element. */}
                <section className="panel lesson-section"> {/* Present a distinct section of study content. */}
                    <h2>Recent learning activity</h2> {/* Introduce this group of related information. */}
                    {workspace.activity.length ? ( // Render this expression using the current application state.
                        <div className="topic-list"> {/* Group this section of the interface. */}
                            {[...workspace.activity] // Render this expression using the current application state.
                                .sort((left, right) => right.date.localeCompare(left.date)) // Continue the transformation of this collection.
                                .slice(0, 7) // Continue the transformation of this collection.
                                .map((item) => ( // Continue the transformation of this collection.
                                    <div className="topic-row" key={item.date}> {/* Group this section of the interface. */}
                                        <span className="topic-row-icon"> {/* Display this compact piece of interface information. */}
                                            <Target size={16} aria-hidden="true" /> {/* Render this reusable visual component. */}
                                        </span> {/* Finish this interface element. */}
                                        <span className="topic-row-main"> {/* Display this compact piece of interface information. */}
                                            {new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { // Render this expression using the current application state.
                                                weekday: "short", // Define this field in the shared component or request contract.
                                                month: "short", // Define this field in the shared component or request contract.
                                                day: "numeric", // Define this field in the shared component or request contract.
                                            })} {/* Finish this rendered expression or container. */}
                                        </span> {/* Finish this interface element. */}
                                        <span className="badge">{item.count} actions</span> {/* Display this compact piece of interface information. */}
                                    </div> // Finish this interface element.
                                ))} {/* Finish this rendered expression or container. */}
                        </div> // Finish this interface element.
                    ) : ( // Continue this clearly scoped calculation or control declaration.
                        <div className="empty-state"> {/* Group this section of the interface. */}
                            <p className="muted"> {/* Explain the adjacent learning content or action. */}
                                Your first topic, checkpoint, or assessment will start your activity history. {/* Display this part of the current learning interface. */}
                            </p> {/* Finish this interface element. */}
                        </div> // Finish this interface element.
                    )} {/* Finish this rendered expression or container. */}
                </section> {/* Finish this interface element. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Tie learning patterns to recorded events instead of decorative chart data. */}
        </div> // End the analytics workspace.
    ); // Return the transparent learning analytics.
} // Finish the analytics page.
