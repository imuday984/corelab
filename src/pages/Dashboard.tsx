import { Link } from "react-router-dom"; // Navigate between real application screens.
import { // Continue this clearly scoped calculation or control declaration.
    ArrowRight, // Continue this clearly scoped calculation or control declaration.
    BookOpen, // Continue this clearly scoped calculation or control declaration.
    CheckCheck, // Continue this clearly scoped calculation or control declaration.
    Flame, // Continue this clearly scoped calculation or control declaration.
    Clock3, // Continue this clearly scoped calculation or control declaration.
    CalendarDays, // Continue this clearly scoped calculation or control declaration.
    ChevronRight, // Continue this clearly scoped calculation or control declaration.
    Target, // Continue this clearly scoped calculation or control declaration.
    Sparkles, // Continue this clearly scoped calculation or control declaration.
    CircleHelp, // Continue this clearly scoped calculation or control declaration.
    Play, // Continue this clearly scoped calculation or control declaration.
    RotateCcw, // Continue this clearly scoped calculation or control declaration.
    Check, // Continue this clearly scoped calculation or control declaration.
} from "lucide-react"; // Keep dashboard actions easy to recognize.
import { useWorkspace } from "../lib/store"; // Read actual curriculum and learning activity.
import { overviewMetrics, subjectMetrics } from "../lib/metrics"; // Keep progress formulas outside presentation.
import { SubjectIcon } from "../components/SubjectIcon"; // Reuse the subject's visual identity.
export default function Dashboard() { // Continue this clearly scoped calculation or control declaration.
    // Present the central learning workspace.
    const { workspace, topics, subjects, demo } = useWorkspace(); // Select the current learner's saved data.
    const metrics = overviewMetrics(topics, workspace); // Calculate truthful dashboard measures.
    const recent = [...workspace.progress].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // Order lessons by their most recent activity.
    const current = // Calculate or retain this value for the current render.
        topics.find((topic) => topic.id === recent.find((item) => item.status === "In Progress")?.topicId) || // Continue this clearly scoped calculation or control declaration.
        topics[0]; // Resume a started lesson or recommend the first foundation.
    const currentSubject = subjects.find((subject) => subject.id === current?.subjectId) || subjects[0]; // Display the recommended lesson's subject.
    const due = workspace.progress.filter( // Calculate or retain this value for the current render.
        (item) => // Continue this clearly scoped calculation or control declaration.
            item.status === "Needs Revision" || (item.reviewAt && new Date(item.reviewAt) <= new Date()), // Continue this clearly scoped calculation or control declaration.
    ); // Select reviews that need attention now.
    const today = // Calculate or retain this value for the current render.
        workspace.activity.find((item) => item.date === new Date().toISOString().slice(0, 10))?.count || 0; // Count today's real study actions.
    const goal = workspace.settings.dailyGoal; // Use the learner's chosen daily goal.
    const cells = Array.from({ length: 98 }, (_, index) => { // Calculate or retain this value for the current render.
        const day = new Date(); // Calculate or retain this value for the current render.
        day.setUTCDate(day.getUTCDate() - 97 + index); // Continue this clearly scoped calculation or control declaration.
        const date = day.toISOString().slice(0, 10); // Calculate or retain this value for the current render.
        return { date, count: workspace.activity.find((item) => item.date === date)?.count || 0 }; // Return the value or interface produced by this function.
    }); // Build fourteen weeks of real activity.
    return ( // Return the value or interface produced by this function.
        // Keep the dashboard organized around the next learning action.
        <div className="dashboard-page"> {/* Group this section of the interface. */}
            {" "} {/* Render this expression using the current application state. */}
            {/* Wrap the complete dashboard. */}
            <div className="dashboard-heading"> {/* Group this section of the interface. */}
                {" "} {/* Render this expression using the current application state. */}
                {/* Pair the page welcome with a useful current date. */}
                <div> {/* Group this section of the interface. */}
                    <div className="eyebrow"> {/* Group this section of the interface. */}
                        <span className="live-dot" /> YOUR LEARNING WORKSPACE {/* Display this compact piece of interface information. */}
                    </div> {/* Finish this interface element. */}
                    <h1> {/* State the main purpose of this screen. */}
                        Small steps. <span>Strong fundamentals.</span> {/* Display this part of the current learning interface. */}
                    </h1> {/* Finish this interface element. */}
                    <p className="muted"> {/* Explain the adjacent learning content or action. */}
                        {demo // Render this expression using the current application state.
                            ? "Build the knowledge. Practice with purpose. Walk into interviews with confidence." // Choose the content appropriate to the current state.
                            : `Welcome back, ${workspace.user?.name.split(" ")[0]}. Keep your momentum going.`} {/* Choose the content appropriate to the current state. */}
                    </p> {/* Finish this interface element. */}
                </div>{" "} {/* Finish this interface element. */}
                {/* Explain the product's daily purpose. */}
                <div className="date-chip"> {/* Group this section of the interface. */}
                    <CalendarDays size={15} /> {/* Render this reusable visual component. */}
                    <span> {/* Display this compact piece of interface information. */}
                        {new Intl.DateTimeFormat("en", { // Render this expression using the current application state.
                            month: "short", // Define this field in the shared component or request contract.
                            day: "numeric", // Define this field in the shared component or request contract.
                            year: "numeric", // Define this field in the shared component or request contract.
                            timeZone: "Asia/Kolkata", // Define this field in the shared component or request contract.
                        }).format(new Date())} {/* Finish this expression or rendered group. */}
                    </span> {/* Finish this interface element. */}
                </div>{" "} {/* Finish this interface element. */}
                {/* Show the user's client-local date. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Finish the dashboard heading. */}
            <section className="stats-grid dashboard-stats" aria-label="Learning statistics"> {/* Present a distinct section of study content. */}
                {" "} {/* Render this expression using the current application state. */}
                {/* Summarize actual progress in four compact measures. */}
                {[ // Render this expression using the current application state.
                    { // Render this expression using the current application state.
                        label: "Overall progress", // Define this field in the shared component or request contract.
                        value: `${metrics.completion}%`, // Define this field in the shared component or request contract.
                        detail: `${metrics.completed} of ${topics.length} topics completed`, // Define this field in the shared component or request contract.
                        icon: BookOpen, // Define this field in the shared component or request contract.
                        color: "violet", // Define this field in the shared component or request contract.
                    }, // Finish the current expression or code block.
                    { // Render this expression using the current application state.
                        label: "Checkpoints cleared", // Define this field in the shared component or request contract.
                        value: metrics.correct.toString().padStart(2, "0"), // Define this field in the shared component or request contract.
                        detail: `${topics.reduce((sum, topic) => sum + topic.questions.length, 0)} opportunities to put it to the test`, // Define this field in the shared component or request contract.
                        icon: CheckCheck, // Define this field in the shared component or request contract.
                        color: "green", // Define this field in the shared component or request contract.
                    }, // Finish the current expression or code block.
                    { // Render this expression using the current application state.
                        label: "Learning streak", // Define this field in the shared component or request contract.
                        value: `${metrics.streak}`, // Define this field in the shared component or request contract.
                        detail: metrics.streak // Define this field in the shared component or request contract.
                            ? "Keep the learning habit going" // Choose the content appropriate to the current state.
                            : "Your next chapter starts today", // Choose the content appropriate to the current state.
                        icon: Flame, // Define this field in the shared component or request contract.
                        color: "amber", // Define this field in the shared component or request contract.
                    }, // Finish the current expression or code block.
                    { // Render this expression using the current application state.
                        label: "Interview readiness", // Define this field in the shared component or request contract.
                        value: `${metrics.readiness}%`, // Define this field in the shared component or request contract.
                        detail: "A measure of learning, built on evidence", // Define this field in the shared component or request contract.
                        icon: Target, // Define this field in the shared component or request contract.
                        color: "blue", // Define this field in the shared component or request contract.
                    }, // Finish the current expression or code block.
                ].map((stat) => ( // Continue this clearly scoped calculation or control declaration.
                    <div className="stat-card" key={stat.label}> {/* Group this section of the interface. */}
                        <div className="stat-top"> {/* Group this section of the interface. */}
                            <span>{stat.label}</span> {/* Display this compact piece of interface information. */}
                            <stat.icon size={17} className={`text-${stat.color}`} /> {/* Render this reusable visual component. */}
                        </div> {/* Finish this interface element. */}
                        <div className="stat-value"> {/* Group this section of the interface. */}
                            {stat.value} {/* Render this expression using the current application state. */}
                            {stat.label === "Learning streak" && <small>days</small>} {/* Render this expression using the current application state. */}
                        </div> {/* Finish this interface element. */}
                        <p>{stat.detail}</p> {/* Explain the adjacent learning content or action. */}
                        <div className={`stat-rule ${stat.color}`} /> {/* Group this section of the interface. */}
                    </div> // Finish this interface element.
                ))}{" "} {/* Display this part of the current learning interface. */}
                {/* Render real metrics without sample performance. */}
            </section>{" "} {/* Finish this interface element. */}
            {/* Finish the statistics row. */}
            <div className="dashboard-main-grid"> {/* Group this section of the interface. */}
                {" "} {/* Render this expression using the current application state. */}
                {/* Balance the next lesson and curriculum with a focused right rail. */}
                <div className="dashboard-primary"> {/* Group this section of the interface. */}
                    {" "} {/* Render this expression using the current application state. */}
                    {/* Keep the curriculum prominent. */}
                    <section className="continue-card"> {/* Present a distinct section of study content. */}
                        {" "} {/* Render this expression using the current application state. */}
                        {/* Recommend one clear next step. */}
                        <div className="continue-content"> {/* Group this section of the interface. */}
                            <div className="eyebrow"> {/* Group this section of the interface. */}
                                <span className="tiny-play"> {/* Display this compact piece of interface information. */}
                                    <Play size={10} fill="currentColor" /> {/* Render this reusable visual component. */}
                                </span> {/* Finish this interface element. */}
                                {recent.length ? "PICK UP WHERE YOU LEFT OFF" : "YOUR FIRST STEP STARTS HERE"} {/* Render this expression using the current application state. */}
                            </div> {/* Finish this interface element. */}
                            <div className="continue-subject"> {/* Group this section of the interface. */}
                                {currentSubject?.shortTitle} {/* Render this expression using the current application state. */}
                                <ChevronRight size={12} /> {/* Render this reusable visual component. */}
                                <span>{current?.module}</span> {/* Display this compact piece of interface information. */}
                            </div> {/* Finish this interface element. */}
                            <h2>{current?.title || "Explore the fundamentals"}</h2> {/* Introduce this group of related information. */}
                            <p>Turn the concept into understanding, then put it into practice.</p> {/* Explain the adjacent learning content or action. */}
                            <div className="continue-footer"> {/* Group this section of the interface. */}
                                <Link // Connect this item to its application route.
                                    to={current ? `/learn/${current.id}` : "/subjects"} // Set the destination for this application link.
                                    className="button primary" // Apply the shared presentation styles to this element.
                                > {/* Display this part of the current learning interface. */}
                                    {recent.length ? "Continue learning" : "Start learning"} {/* Render this expression using the current application state. */}
                                    <ArrowRight size={15} /> {/* Render this reusable visual component. */}
                                </Link> {/* Finish this interface element. */}
                                <span> {/* Display this compact piece of interface information. */}
                                    <Clock3 size={13} /> {/* Render this reusable visual component. */}
                                    {current?.minutes || 8} min read {/* Render this expression using the current application state. */}
                                </span> {/* Finish this interface element. */}
                                <span className="difficulty-tag">{current?.difficulty || "Easy"}</span> {/* Display this compact piece of interface information. */}
                            </div> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Connect the next lesson directly to its reader. */}
                        <div className="code-art" aria-hidden="true"> {/* Group this section of the interface. */}
                            <div className="art-window"> {/* Group this section of the interface. */}
                                <div className="art-dots"> {/* Group this section of the interface. */}
                                    <i /> {/* Render this reusable visual component. */}
                                    <i /> {/* Render this reusable visual component. */}
                                    <i /> {/* Render this reusable visual component. */}
                                </div> {/* Finish this interface element. */}
                                <div className="art-code"> {/* Group this section of the interface. */}
                                    <span className="code-muted">// build your foundation</span>
                                    <br /> {/* Render this reusable visual component. */}
                                    <span className="code-purple">class</span>{" "} {/* Display this compact piece of interface information. */}
                                    <span className="code-gold">FutureYou</span> {"{"} {/* Display this compact piece of interface information. */}
                                    <br /> {/* Render this reusable visual component. */}
                                    &nbsp; <span className="code-purple">learn</span>() {"{"} {/* Choose the content appropriate to the current state. */}
                                    <br /> {/* Render this reusable visual component. */}
                                    &nbsp; &nbsp; <span className="code-blue">return</span>{" "} {/* Choose the content appropriate to the current state. */}
                                    <span className="code-green">confidence</span>;<br /> {/* Display this compact piece of interface information. */}
                                    &nbsp; {"}"} {/* Choose the content appropriate to the current state. */}
                                    <br /> {/* Render this reusable visual component. */}
                                    {"}"} {/* Render this expression using the current application state. */}
                                </div> {/* Finish this interface element. */}
                            </div> {/* Finish this interface element. */}
                            <div className="art-badge"> {/* Group this section of the interface. */}
                                <Check size={13} /> One concept at a time. {/* Render this reusable visual component. */}
                            </div> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Illustrate the learning theme without external assets. */}
                    </section>{" "} {/* Finish this interface element. */}
                    {/* Finish the next-lesson card. */}
                    <div className="section-heading"> {/* Group this section of the interface. */}
                        <div> {/* Group this section of the interface. */}
                            <h2> {/* Introduce this group of related information. */}
                                Your learning paths <span className="count-badge">6 subjects</span> {/* Display this part of the current learning interface. */}
                            </h2> {/* Finish this interface element. */}
                            <p>Six foundations. One confident you.</p> {/* Explain the adjacent learning content or action. */}
                        </div> {/* Finish this interface element. */}
                        <Link className="text-link" to="/subjects"> {/* Connect this item to its application route. */}
                            View curriculum <ArrowRight size={14} /> {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                    </div>{" "} {/* Finish this interface element. */}
                    {/* Introduce the subject grid. */}
                    <div className="dashboard-subject-grid"> {/* Group this section of the interface. */}
                        {" "} {/* Render this expression using the current application state. */}
                        {/* Give each subject equal visual weight. */}
                        {subjects.map((subject) => { // Render this expression using the current application state.
                            const data = subjectMetrics(subject, topics, workspace); // Calculate or retain this value for the current render.
                            return ( // Return the value or interface produced by this function.
                                <Link // Connect this item to its application route.
                                    to={`/subjects/${subject.id}`} // Set the destination for this application link.
                                    className="subject-card" // Apply the shared presentation styles to this element.
                                    key={subject.id} // Give React a stable identity for this repeated item.
                                > {/* Display this part of the current learning interface. */}
                                    <div className="subject-card-top"> {/* Group this section of the interface. */}
                                        <SubjectIcon subject={subject} /> {/* Render this reusable visual component. */}
                                        <span className="subject-topic-count">{data.total} topics</span> {/* Display this compact piece of interface information. */}
                                    </div> {/* Finish this interface element. */}
                                    <h3> {/* Label this specific learning item. */}
                                        {subject.shortTitle === "Networks" // Render this expression using the current application state.
                                            ? "Computer Networks" // Choose the content appropriate to the current state.
                                            : subject.shortTitle === "OOPs" // Choose the content appropriate to the current state.
                                              ? "Object-Oriented Programming" // Choose the content appropriate to the current state.
                                              : subject.shortTitle} {/* Choose the content appropriate to the current state. */}
                                    </h3> {/* Finish this interface element. */}
                                    <p>{subject.description}</p> {/* Explain the adjacent learning content or action. */}
                                    <div className="subject-progress-label"> {/* Group this section of the interface. */}
                                        <span> {/* Display this compact piece of interface information. */}
                                            {data.completed} / {data.total} completed {/* Render this expression using the current application state. */}
                                        </span> {/* Finish this interface element. */}
                                        <strong>{data.percent}%</strong> {/* Emphasize this important value or label. */}
                                    </div> {/* Finish this interface element. */}
                                    <div // Group this section of the interface.
                                        className="progress-track" // Apply the shared presentation styles to this element.
                                        role="progressbar" // Declare this element’s semantic interaction role.
                                        aria-label={`${subject.title} progress`} // Expose the control state or purpose to assistive technology.
                                        aria-valuenow={data.percent} // Expose the control state or purpose to assistive technology.
                                        aria-valuemin={0} // Expose the control state or purpose to assistive technology.
                                        aria-valuemax={100} // Expose the control state or purpose to assistive technology.
                                    > {/* Display this part of the current learning interface. */}
                                        <div // Group this section of the interface.
                                            className="progress-fill" // Apply the shared presentation styles to this element.
                                            style={{ width: `${data.percent}%`, background: subject.color }} // Derive this visual value from the current learning data.
                                        /> {/* Display this part of the current learning interface. */}
                                    </div> {/* Finish this interface element. */}
                                    <div className="subject-card-bottom"> {/* Group this section of the interface. */}
                                        <div className="difficulty-counts"> {/* Group this section of the interface. */}
                                            <span> {/* Display this compact piece of interface information. */}
                                                <i className="easy-dot" /> {/* Render this reusable visual component. */}
                                                {data.levels[0]} Easy {/* Render this expression using the current application state. */}
                                            </span> {/* Finish this interface element. */}
                                            <span> {/* Display this compact piece of interface information. */}
                                                <i className="medium-dot" /> {/* Render this reusable visual component. */}
                                                {data.levels[1]} Med {/* Render this expression using the current application state. */}
                                            </span> {/* Finish this interface element. */}
                                            <span> {/* Display this compact piece of interface information. */}
                                                <i className="hard-dot" /> {/* Render this reusable visual component. */}
                                                {data.levels[2]} Hard {/* Render this expression using the current application state. */}
                                            </span> {/* Finish this interface element. */}
                                        </div> {/* Finish this interface element. */}
                                        <ArrowRight size={15} /> {/* Render this reusable visual component. */}
                                    </div> {/* Finish this interface element. */}
                                </Link> // Finish this interface element.
                            ); // Finish the current expression or code block.
                        })}{" "} {/* Finish this expression or rendered group. */}
                        {/* Render actual topic and checkpoint totals from curriculum records. */}
                    </div>{" "} {/* Finish this interface element. */}
                    {/* Finish the subject grid. */}
                    <section className="panel activity-panel"> {/* Present a distinct section of study content. */}
                        {" "} {/* Render this expression using the current application state. */}
                        {/* Show activity with honest empty dates. */}
                        <div className="panel-header"> {/* Group this section of the interface. */}
                            <div> {/* Group this section of the interface. */}
                                <h2>Consistency is your superpower</h2> {/* Introduce this group of related information. */}
                                <p className="muted">Every concept, checkpoint, and revision counts.</p> {/* Explain the adjacent learning content or action. */}
                            </div> {/* Finish this interface element. */}
                            <Link className="text-link" to="/analytics"> {/* Connect this item to its application route. */}
                                Activity <ArrowRight size={14} /> {/* Display this part of the current learning interface. */}
                            </Link> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Connect the overview to detailed analytics. */}
                        <div className="activity-body"> {/* Group this section of the interface. */}
                            <div className="activity-labels"> {/* Group this section of the interface. */}
                                <span>Mon</span> {/* Display this compact piece of interface information. */}
                                <span>Wed</span> {/* Display this compact piece of interface information. */}
                                <span>Fri</span> {/* Display this compact piece of interface information. */}
                            </div> {/* Finish this interface element. */}
                            <div className="activity-cells"> {/* Group this section of the interface. */}
                                {cells.map((cell) => ( // Render this expression using the current application state.
                                    <div // Group this section of the interface.
                                        key={cell.date} // Give React a stable identity for this repeated item.
                                        className={`activity-cell level-${Math.min(cell.count, 4)}`} // Apply the shared presentation styles to this element.
                                        title={`${cell.date}: ${cell.count} learning actions`} // Continue this clearly scoped calculation or control declaration.
                                    /> // Continue this clearly scoped calculation or control declaration.
                                ))} {/* Finish this rendered expression or container. */}
                            </div> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Reflect saved actions without simulated heatmap data. */}
                        <div className="activity-legend"> {/* Group this section of the interface. */}
                            <span> {/* Display this compact piece of interface information. */}
                                {workspace.activity.reduce((sum, item) => sum + item.count, 0)} learning {/* Render this expression using the current application state. */}
                                actions in your workspace {/* Display this part of the current learning interface. */}
                            </span> {/* Finish this interface element. */}
                            <div> {/* Group this section of the interface. */}
                                Less <i /> {/* Display this part of the current learning interface. */}
                                <i /> {/* Render this reusable visual component. */}
                                <i /> {/* Render this reusable visual component. */}
                                <i /> More {/* Render this reusable visual component. */}
                            </div> {/* Finish this interface element. */}
                        </div>{" "} {/* Finish this interface element. */}
                        {/* Explain what the heatmap measures. */}
                    </section>{" "} {/* Finish this interface element. */}
                    {/* Finish activity visualization. */}
                </div>{" "} {/* Finish this interface element. */}
                {/* Finish the primary dashboard column. */}
                <aside className="dashboard-rail"> {/* Display supporting quick-reference information. */}
                    {" "} {/* Render this expression using the current application state. */}
                    {/* Surface goals, revision, and readiness alongside the curriculum. */}
                    <section className="panel daily-goal"> {/* Present a distinct section of study content. */}
                        <div className="panel-header"> {/* Group this section of the interface. */}
                            <h2>Make today count</h2> {/* Introduce this group of related information. */}
                            <span className="goal-icon"> {/* Display this compact piece of interface information. */}
                                <Flame size={17} /> {/* Render this reusable visual component. */}
                            </span> {/* Finish this interface element. */}
                        </div> {/* Finish this interface element. */}
                        <p className="muted">A little progress, every single day.</p> {/* Explain the adjacent learning content or action. */}
                        <div className="goal-progress"> {/* Group this section of the interface. */}
                            <strong> {/* Emphasize this important value or label. */}
                                {Math.min(today, goal)} {/* Render this expression using the current application state. */}
                                <span> / {goal}</span> {/* Display this compact piece of interface information. */}
                            </strong> {/* Finish this interface element. */}
                            <span>daily learning actions</span> {/* Display this compact piece of interface information. */}
                        </div> {/* Finish this interface element. */}
                        <div className="progress-track"> {/* Group this section of the interface. */}
                            <div // Group this section of the interface.
                                className="progress-fill" // Apply the shared presentation styles to this element.
                                style={{ width: `${Math.min((today / goal) * 100, 100)}%` }} // Derive this visual value from the current learning data.
                            /> {/* Display this part of the current learning interface. */}
                        </div> {/* Finish this interface element. */}
                        <div className="goal-habits"> {/* Group this section of the interface. */}
                            <span> {/* Display this compact piece of interface information. */}
                                <span className={today > 0 ? "habit-check checked" : "habit-check"}> {/* Display this compact piece of interface information. */}
                                    {today > 0 && <Check size={11} />} {/* Render this expression using the current application state. */}
                                </span>{" "} {/* Finish this interface element. */}
                                Learn something new {/* Display this part of the current learning interface. */}
                            </span> {/* Finish this interface element. */}
                            <span> {/* Display this compact piece of interface information. */}
                                <span className={today > 1 ? "habit-check checked" : "habit-check"}> {/* Display this compact piece of interface information. */}
                                    {today > 1 && <Check size={11} />} {/* Render this expression using the current application state. */}
                                </span>{" "} {/* Finish this interface element. */}
                                Put it into practice {/* Display this part of the current learning interface. */}
                            </span> {/* Finish this interface element. */}
                            <span> {/* Display this compact piece of interface information. */}
                                <span className={today > 2 ? "habit-check checked" : "habit-check"}> {/* Display this compact piece of interface information. */}
                                    {today > 2 && <Check size={11} />} {/* Render this expression using the current application state. */}
                                </span>{" "} {/* Finish this interface element. */}
                                Revisit a concept {/* Display this part of the current learning interface. */}
                            </span> {/* Finish this interface element. */}
                        </div> {/* Finish this interface element. */}
                        <Link to="/settings" className="text-link"> {/* Connect this item to its application route. */}
                            Personalize your goal <ChevronRight size={13} /> {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                    </section>{" "} {/* Finish this interface element. */}
                    {/* Keep daily habits concrete and configurable. */}
                    <section className="panel revision-preview"> {/* Present a distinct section of study content. */}
                        <div className="panel-header"> {/* Group this section of the interface. */}
                            <h2>Time for a refresh</h2> {/* Introduce this group of related information. */}
                            <RotateCcw size={16} className="muted" /> {/* Render this reusable visual component. */}
                        </div> {/* Finish this interface element. */}
                        <p className="muted">Make what you learn stick.</p> {/* Explain the adjacent learning content or action. */}
                        {due.length ? ( // Render this expression using the current application state.
                            due.slice(0, 3).map((item) => { // Continue this clearly scoped calculation or control declaration.
                                const topic = topics.find((topic) => topic.id === item.topicId); // Calculate or retain this value for the current render.
                                return ( // Return the value or interface produced by this function.
                                    <Link // Connect this item to its application route.
                                        className="revision-mini" // Apply the shared presentation styles to this element.
                                        key={item.topicId} // Give React a stable identity for this repeated item.
                                        to={`/learn/${item.topicId}`} // Set the destination for this application link.
                                    > {/* Display this part of the current learning interface. */}
                                        <span className="revision-dot" /> {/* Display this compact piece of interface information. */}
                                        <div> {/* Group this section of the interface. */}
                                            <strong>{topic?.title}</strong> {/* Emphasize this important value or label. */}
                                            <small>Ready for revision</small> {/* Present secondary context without hiding it. */}
                                        </div> {/* Finish this interface element. */}
                                        <ChevronRight size={14} /> {/* Render this reusable visual component. */}
                                    </Link> // Finish this interface element.
                                ); // Finish the current expression or code block.
                            }) // Finish the current expression or code block.
                        ) : ( // Continue this clearly scoped calculation or control declaration.
                            <div className="revision-zero"> {/* Group this section of the interface. */}
                                <div className="revision-illustration"> {/* Group this section of the interface. */}
                                    <RotateCcw size={23} /> {/* Render this reusable visual component. */}
                                </div> {/* Finish this interface element. */}
                                <strong>A fresh start. A clear mind.</strong> {/* Emphasize this important value or label. */}
                                <p> {/* Explain the adjacent learning content or action. */}
                                    Topics you save for revision will {/* Display this part of the current learning interface. */}
                                    <br /> {/* Render this reusable visual component. */}
                                    find their way here. {/* Display this part of the current learning interface. */}
                                </p> {/* Finish this interface element. */}
                            </div> // Finish this interface element.
                        )} {/* Finish this rendered expression or container. */}
                        <Link to="/revision" className="button secondary full-width"> {/* Connect this item to its application route. */}
                            Open revision center <ArrowRight size={14} /> {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                    </section>{" "} {/* Finish this interface element. */}
                    {/* Give empty revisions a useful explanation. */}
                    <section className="readiness-card"> {/* Present a distinct section of study content. */}
                        <div className="readiness-title"> {/* Group this section of the interface. */}
                            <Sparkles size={16} /> {/* Render this reusable visual component. */}
                            <span>PREPARE WITH PURPOSE</span> {/* Display this compact piece of interface information. */}
                        </div> {/* Finish this interface element. */}
                        <h3> {/* Label this specific learning item. */}
                            Understanding beats {/* Display this part of the current learning interface. */}
                            <br /> {/* Render this reusable visual component. */}
                            memorizing. Every time. {/* Display this part of the current learning interface. */}
                        </h3> {/* Finish this interface element. */}
                        <p> {/* Explain the adjacent learning content or action. */}
                            Learn it. Explain it. Apply it. {/* Display this part of the current learning interface. */}
                            <br /> {/* Render this reusable visual component. */}
                            That’s how confidence is built. {/* Display this part of the current learning interface. */}
                        </p> {/* Finish this interface element. */}
                        <Link to="/quizzes" className="text-link"> {/* Connect this item to its application route. */}
                            Try a quick assessment <ArrowRight size={14} /> {/* Display this part of the current learning interface. */}
                        </Link> {/* Finish this interface element. */}
                        <span className="readiness-watermark" aria-hidden="true"> {/* Display this compact piece of interface information. */}
                            {"{ }"} {/* Render this expression using the current application state. */}
                        </span> {/* Finish this interface element. */}
                    </section>{" "} {/* Finish this interface element. */}
                    {/* Encourage evidence-based practice. */}
                    <div className="rail-footnote"> {/* Group this section of the interface. */}
                        <CircleHelp size={14} /> {/* Render this reusable visual component. */}
                        <span> {/* Display this compact piece of interface information. */}
                            Readiness reflects your learning activity. {/* Display this part of the current learning interface. */}
                            <br /> {/* Render this reusable visual component. */}
                            <Link to="/analytics">See how it’s calculated</Link> {/* Connect this item to its application route. */}
                        </span> {/* Finish this interface element. */}
                    </div>{" "} {/* Finish this interface element. */}
                    {/* Clarify that readiness is a learning score. */}
                </aside>{" "} {/* Finish this interface element. */}
                {/* Finish the focused right rail. */}
            </div>{" "} {/* Finish this interface element. */}
            {/* Finish the dashboard content grid. */}
            <footer className="workspace-footer"> {/* Render this reusable visual component. */}
                <span>Built for the curious. Designed for your next chapter.</span> {/* Display this compact piece of interface information. */}
                <span>Learn → Practice → Revise → Master</span> {/* Display this compact piece of interface information. */}
            </footer>{" "} {/* Finish this interface element. */}
            {/* Reinforce the learning cycle unobtrusively. */}
        </div> // Finish the dashboard wrapper.
    ); // Return the complete dashboard.
} // Finish the dashboard component.
