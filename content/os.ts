// Operating-system lessons explain concrete mechanisms, tradeoffs, and worked scheduling or memory examples.
import type { Topic } from '../shared/types'; // Use the shared curriculum contract consumed by the API and React.
import { makeLessons, withHardQuiz, type LessonSeed, type HardQuizSeed } from './oop-os-helper'; // Expand the named records without hardcoding content in components.
const processReference = 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf'; // Reference the freely available Operating Systems: Three Easy Pieces textbook.
const concurrencyReference = 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf'; // Use the textbook's concurrency introduction for thread concepts.
const memoryReference = 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf'; // Use the textbook's virtual-memory introduction for address-space concepts.
const storageReference = 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-implementation.pdf'; // Use the textbook's file-system implementation chapter.
const seeds: LessonSeed[] = [ // Keep every requested topic editable as a separate curriculum record.
    { // Compare the resource container with its execution units.
        title: 'Process vs Thread', // Name the comparison.
        module: 'Process Management', // Place it in the process fundamentals module.
        definition: 'A process owns an execution environment and address space; a thread is an execution stream that shares its process resources with sibling threads.', // Define both concepts.
        mechanism: 'Each thread has its own program counter, register state, and stack. Threads in one process generally share code, heap, and open files. Separate processes normally have isolated virtual address spaces and communicate through explicit interprocess mechanisms.', // Explain shared and private state.
        example: 'A browser can isolate tabs in separate processes to contain failures. A server process may use several worker threads that share a connection pool but keep separate stacks for local calls.', // Give concrete architecture examples.
        misconception: 'Every thread in one process has its own completely isolated heap and independent copy of all process files.', // Identify the address-space misconception.
        appliedQuestion: 'Two threads in the same process update one heap counter. What must the design consider?', // Test sharing awareness.
        appliedAnswer: 'They share the counter, so concurrent updates need an appropriate synchronization strategy.', // Identify the coordination requirement.
        appliedWrong: 'No coordination is needed because every thread has a private copy of the heap counter.', // Offer false isolation.
        hardQuestion: 'Why is switching threads often cheaper than switching processes, and when can this comparison be misleading?', // Ask for nuanced cost reasoning.
        hardAnswer: 'Threads in the same process can retain the address-space context, avoiding some page-table changes and TLB disruption. Both switches still save and restore execution state and can disturb caches. Actual costs depend on hardware, kernel design, working sets, and whether threads belong to the same process; process isolation can still be worth its overhead.', // Explain costs without an absolute claim.
        followUp: 'Which thread data must remain private even when the heap is shared?', // Extend the comparison.
        resource: concurrencyReference, // Link to the independent textbook.
    }, // Finish the process and thread comparison.
    { // Describe the scheduler-visible execution lifecycle.
        title: 'Process States', // Name the lifecycle concept.
        module: 'Process Management', // Group scheduling fundamentals.
        definition: 'A basic process lifecycle distinguishes new, ready, running, blocked or waiting, and terminated states according to execution eligibility.', // Define the common states.
        mechanism: 'Ready means eligible but waiting for CPU time. Running means executing on a CPU. A process becomes blocked when it cannot proceed until an event such as I/O completion. Completion of that event usually moves it to ready, not immediately to running.', // Explain key transitions.
        example: 'A running process requests a disk read and blocks. The scheduler runs another ready process. When the disk completes, the waiting process becomes ready and must be dispatched before continuing execution.', // Give an I/O transition example.
        misconception: 'A ready process is waiting for disk I/O and therefore cannot be scheduled on a CPU.', // Distinguish ready and blocked.
        appliedQuestion: 'An I/O operation completes for a blocked process while another process is using the only CPU. What normally happens next?', // Test transition reasoning.
        appliedAnswer: 'The process becomes ready and waits for a scheduling decision.', // State the normal transition.
        appliedWrong: 'It necessarily becomes running immediately without a scheduling decision.', // Offer a forced-transition misconception.
        hardQuestion: 'Why should blocked processes not remain on the normal ready queue?', // Ask about scheduler correctness.
        hardAnswer: 'A blocked process cannot make progress until its awaited condition changes. Dispatching it wastes CPU time or forces repeated checks. Separate wait structures let event completion make the process runnable once, while the ready queue contains candidates eligible to execute. Real kernels can have additional sleep, stopped, and zombie states.', // Explain progress and implementation detail.
        followUp: 'What event can move a running process back to ready?', // Ask about preemption.
        resource: processReference, // Link to the process chapter.
        diagram: ['New → Ready → Running → Terminated', 'Running → Blocked: wait for I/O or an event', 'Blocked → Ready: awaited event completes', 'Running → Ready: time slice expires or preemption occurs'], // Supply a readable state-transition diagram.
    }, // Finish the process-state lesson.
    { // Explain the kernel record describing an execution environment.
        title: 'Process Control Block', // Name the operating-system data structure.
        module: 'Process Management', // Group process implementation details.
        definition: 'A process control block is the kernel’s record of a process, including identity, execution state, scheduling information, and references to owned resources.', // Define the PCB.
        mechanism: 'The record may contain or reference saved registers, memory mappings, credentials, file tables, accounting, and parent-child relations. Real kernels split this information across several structures; per-thread execution state is often stored separately from process-wide resources.', // Avoid implying one universal structure layout.
        example: 'When the scheduler stops process P, the kernel saves enough execution context to resume P later and keeps P’s memory and file references reachable through its process-related structures.', // Connect data to scheduling.
        misconception: 'A process control block is the user program’s source code stored on disk.', // Distinguish kernel metadata and program text.
        appliedQuestion: 'Where does the kernel retain information needed to resume a process after descheduling it?', // Test purpose.
        appliedAnswer: 'In kernel-managed process and thread control structures containing saved execution context.', // Identify the right structures.
        appliedWrong: 'Only in the program’s source-code file, which is recompiled on every switch.', // Offer a restart misconception.
        hardQuestion: 'Why do modern kernels often separate process-wide and thread-specific control information?', // Ask about resource sharing.
        hardAnswer: 'Threads share process-wide resources such as an address space and open-file table but need independent registers, stacks, scheduler state, and wait conditions. Separating these responsibilities avoids duplicating shared resources and supports scheduling each thread independently. The exact structure names and boundaries are kernel-specific.', // Explain the design.
        followUp: 'Which fields must be updated during a context switch?', // Connect the data structure with the next lesson.
        resource: processReference, // Link to the textbook.
    }, // Finish the PCB lesson.
    { // Explain suspending and resuming execution streams.
        title: 'Context Switching', // Name the execution mechanism.
        module: 'Process Management', // Group CPU and scheduler mechanisms.
        definition: 'A context switch saves one execution stream’s state and restores another so the CPU can resume a different thread or process.', // Define the operation.
        mechanism: 'The kernel saves registers and execution position, changes scheduler and possibly address-space state, then restores the selected stream. A mode switch enters or leaves kernel privilege; it need not select a different thread and is not synonymous with a context switch.', // Distinguish context and privilege changes.
        example: 'A timer interrupt reaches the kernel, which may save A’s registers and load B’s registers before returning to user mode. If A is selected again, the interrupt caused a mode transition without switching to B.', // Give both possible outcomes.
        misconception: 'Every system call necessarily performs a context switch to a different user process.', // Correct the system-call confusion.
        appliedQuestion: 'A system call enters the kernel and immediately returns to the same thread. Must a context switch have occurred?', // Ask a precise distinction.
        appliedAnswer: 'No; a privilege-mode transition can occur without selecting another execution stream.', // State the independent concepts.
        appliedWrong: 'Yes; every change in CPU privilege is a switch to a different process.', // Offer the false equivalence.
        hardQuestion: 'Why can excessive context switching reduce throughput even if register saves are fast?', // Ask about indirect costs.
        hardAnswer: 'Switches consume kernel CPU time and disrupt instruction caches, data caches, branch predictors, and sometimes TLB state. Short time slices can spend a large fraction of execution on these overheads rather than useful work. The best scheduling granularity balances responsiveness, fairness, and working-set locality.', // Explain performance tradeoffs.
        followUp: 'How might a time slice that is too large affect interactive latency?', // Connect overhead to scheduling policy.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf', // Link to the execution-mechanism chapter.
    }, // Finish the context-switch lesson.
    { // Introduce scheduling metrics and policy goals.
        title: 'CPU Scheduling', // Name the policy area.
        module: 'Process Management', // Group scheduling algorithms.
        definition: 'CPU scheduling selects an eligible execution stream for a CPU according to policy goals such as response time, throughput, fairness, and deadlines.', // Define scheduling.
        mechanism: 'Preemptive policies can interrupt a running task; nonpreemptive policies wait for blocking or completion. Turnaround equals completion minus arrival, response equals first execution minus arrival, and waiting counts time spent ready rather than running. No single policy optimizes every workload and goal.', // Explain metrics and tradeoffs.
        example: 'For a job arriving at time 2, first running at 5, and completing at 12, response time is 3 and turnaround time is 10. Waiting time additionally depends on how much time it ran and whether it blocked.', // Give a worked metric example.
        misconception: 'Response time and turnaround time are always identical for every scheduling policy and workload.', // Distinguish metrics.
        appliedQuestion: 'A task arrives at time 3, first runs at 7, and finishes at 15. What are response and turnaround times?', // Test calculation.
        appliedAnswer: 'Response time is 4 units and turnaround time is 12 units.', // Provide the arithmetic.
        appliedWrong: 'Response time is 12 units and turnaround time is 4 units.', // Offer the swapped metrics.
        hardQuestion: 'Why can an algorithm with excellent average turnaround still be poor for an interactive system?', // Ask about goals.
        hardAnswer: 'Average turnaround can hide long delays before a particular user receives any response and can favor predictable short jobs. Interactive workloads often require low response latency and fairness even at a small throughput cost. Assess tail latency, starvation risk, context-switch overhead, and workload assumptions alongside averages.', // Explain metric limitations.
        followUp: 'Which metric becomes central in a hard real-time system?', // Extend to deadlines.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf', // Link to scheduling policy details.
    }, // Finish the scheduling overview.
    { // Explain arrival-order CPU scheduling.
        title: 'FCFS', // Keep the required algorithm name.
        module: 'Process Management', // Distinguish CPU FCFS from disk FCFS.
        definition: 'First-Come, First-Served CPU scheduling runs ready jobs in arrival order and is normally nonpreemptive.', // Define the policy.
        mechanism: 'A FIFO ready queue makes the policy simple. A long CPU-bound job can delay many short jobs, producing the convoy effect. For CPU-burst examples with no I/O, a job’s waiting time is its start time minus its arrival time.', // Explain queue and cost.
        example: 'All jobs arrive at time 0 in order A(8), B(2), C(1). FCFS starts them at 0, 8, and 10, so waiting times are 0, 8, and 10; average waiting is 6 units.', // Work the arithmetic explicitly.
        misconception: 'FCFS automatically preempts a long running job as soon as a shorter job becomes ready.', // Contrast FCFS and shortest-remaining policies.
        appliedQuestion: 'A(8), B(2), and C(1) arrive at time 0 in that order with no I/O. What is FCFS average waiting time?', // Test the worked schedule.
        appliedAnswer: '6 time units, from waiting times 0, 8, and 10.', // State the correct average.
        appliedWrong: '1 time unit, because FCFS always rearranges jobs from shortest to longest.', // Offer sorting confusion.
        hardQuestion: 'What is the convoy effect, and why can it harm mixed CPU and I/O workloads?', // Ask about a workload phenomenon.
        hardAnswer: 'Short or I/O-bound tasks wait behind a long CPU-bound task under nonpreemptive FCFS. Their I/O requests are delayed, so I/O devices may be idle while the CPU-bound task runs, followed by a burst in which many jobs block for I/O. Preemption or differentiated scheduling can improve responsiveness and device overlap.', // Explain the chain of effects.
        followUp: 'How does round robin change the response-time behavior?', // Connect policies.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf', // Link to the textbook schedule discussion.
    }, // Finish CPU FCFS.
    { // Explain shortest-job selection and its assumptions.
        title: 'SJF', // Keep the required algorithm name.
        module: 'Process Management', // Group CPU scheduling algorithms.
        definition: 'Shortest Job First chooses the ready job with the smallest predicted CPU burst; its standard form is nonpreemptive.', // Define the selection rule.
        mechanism: 'With all jobs available and exact known lengths, SJF minimizes average waiting time for the simple single-burst model. Real systems estimate future bursts. Its preemptive relative is shortest remaining time first, and long jobs can starve if short jobs keep arriving.', // State the assumptions and limits.
        example: 'For jobs A(8), B(2), and C(1) all available at time 0, SJF runs C, B, A. Waiting times are 0, 1, and 3, averaging 4/3 units.', // Supply a worked example.
        misconception: 'Shortest Job First can know every future CPU burst exactly and therefore has no practical prediction problem.', // Highlight estimation.
        appliedQuestion: 'A(8), B(2), and C(1) are all ready. Which order does nonpreemptive SJF choose?', // Ask selection.
        appliedAnswer: 'C, then B, then A, by increasing CPU burst length.', // State the correct order.
        appliedWrong: 'A, then B, then C, regardless of burst length.', // Offer FCFS confusion.
        hardQuestion: 'Why is SJF’s optimality claim not enough to make it universally best?', // Ask about applicability.
        hardAnswer: 'The proof relies on a particular workload model and known service times. Actual CPU bursts are uncertain, arrivals vary, fairness matters, and long jobs may starve. A system may prefer preemptive or feedback-based policies that approximate short-job preference while accounting for response, estimates, and aging.', // Explain the gap between model and system.
        followUp: 'How does shortest remaining time first react to a newly arriving short task?', // Extend to the preemptive version.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf', // Link to scheduling analysis.
    }, // Finish SJF.
    { // Explain time slicing for responsiveness.
        title: 'Round Robin', // Name the policy.
        module: 'Process Management', // Group CPU algorithms.
        definition: 'Round robin gives each ready task up to one time quantum before moving an unfinished task to the back of the ready queue.', // Define time slicing.
        mechanism: 'A timer enables preemption when the quantum expires. A small quantum improves initial responsiveness but increases switching overhead. A very large quantum approaches FCFS behavior for jobs that finish within their slice.', // Explain the tuning tradeoff.
        example: 'A(5) and B(3) arrive together in that order, with quantum 2 and no switch cost. The sequence is A 0–2, B 2–4, A 4–6, B 6–7, A 7–8.', // Give a full worked schedule.
        misconception: 'Reducing the time quantum to nearly zero always increases useful CPU throughput without any cost.', // Address overhead.
        appliedQuestion: 'With A(5), B(3), quantum 2, and zero switch cost, when does B first run?', // Test the schedule.
        appliedAnswer: 'At time 2, after A uses its first quantum.', // State the response time.
        appliedWrong: 'At time 5, because round robin never preempts A.', // Offer FCFS behavior.
        hardQuestion: 'How would you choose a time quantum for an interactive workload?', // Ask practical tuning.
        hardAnswer: 'Choose a quantum large relative to context-switch overhead but small enough for acceptable response latency across the expected ready-queue length. Measure workload distributions, tail latency, and throughput rather than assuming the smallest value is best. Blocking tasks may yield before using their full quantum.', // Explain measurements and tradeoffs.
        followUp: 'What happens when the quantum exceeds every job’s CPU burst?', // Probe the FCFS limit.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf', // Link to textbook analysis.
    }, // Finish round robin.
    { // Explain priority ordering and aging.
        title: 'Priority Scheduling', // Name the algorithm family.
        module: 'Process Management', // Group CPU scheduling policies.
        definition: 'Priority scheduling chooses an eligible task according to assigned priority and may be preemptive or nonpreemptive.', // Define the policy without assuming one numeric convention.
        mechanism: 'The scheduler must define whether a larger or smaller number means higher priority. Static priorities can starve lower-priority work. Aging raises waiting tasks over time. Priority inversion is a different problem in which a high-priority task waits for a resource held by a lower-priority task.', // Explain conventions and two failure modes.
        example: 'Assume smaller numbers mean higher priority. Ready tasks A(priority 3), B(priority 1), and C(priority 2) run B, C, A if no new jobs arrive. Aging can increase A’s effective priority while it waits.', // Give an explicit convention.
        misconception: 'Priority scheduling cannot starve any task because low-priority jobs always run before higher-priority arrivals.', // Identify starvation.
        appliedQuestion: 'In a scheduler where smaller numbers mean higher priority, which ready task runs first: A(3), B(1), or C(2)?', // Test the stated convention.
        appliedAnswer: 'B, because priority 1 is highest under the stated rule.', // Supply the correct selection.
        appliedWrong: 'A, because a larger number must always mean higher priority in every operating system.', // Highlight differing conventions.
        hardQuestion: 'How do aging and priority inheritance solve different problems?', // Ask for a nuanced distinction.
        hardAnswer: 'Aging gradually raises the priority of a task that waits too long, reducing starvation from repeated higher-priority arrivals. Priority inheritance temporarily boosts a resource holder to the priority of a blocked higher-priority waiter, mitigating priority inversion. Aging targets scheduling fairness; inheritance targets lock-mediated blocking.', // Explain both mechanisms.
        followUp: 'Can priority inheritance remove every source of unbounded latency?', // Extend to real-time constraints.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf', // Link to dynamic-priority discussion.
    }, // Finish priority scheduling.
    { // Compare parallel work within and across process containers.
        title: 'Multithreading vs Multiprocessing', // Name the comparison.
        module: 'Process Management', // Group concurrency architecture choices.
        definition: 'Multithreading uses multiple execution streams within a process; multiprocessing uses separate processes that can run concurrently and, with sufficient cores, in parallel.', // Define both approaches.
        mechanism: 'Threads share memory conveniently but require synchronization and share a failure boundary. Processes provide stronger address-space isolation but need IPC or explicit shared memory. Language runtimes may impose additional restrictions, such as a global interpreter lock in some Python implementations.', // Explain system and runtime factors.
        example: 'An image-processing pipeline can use processes to exploit CPU cores and isolate crashes. A network server can use threads for overlapping blocked I/O, while an event loop is another possible concurrency model.', // Give workload examples without overclaiming.
        misconception: 'Creating many threads guarantees CPU-parallel speedup in every language runtime and on a single-core machine.', // Correct concurrency versus parallelism.
        appliedQuestion: 'A task needs strong isolation from another worker’s memory corruption. Which starting point is usually stronger?', // Ask architecture judgment.
        appliedAnswer: 'Separate processes, because their virtual address spaces are normally isolated.', // Identify the isolation boundary.
        appliedWrong: 'Threads sharing the same process heap, because shared memory prevents corruption from spreading.', // Offer false protection.
        hardQuestion: 'What factors determine whether threads or processes are better for a CPU-bound worker pool?', // Ask a tradeoff analysis.
        hardAnswer: 'Consider runtime restrictions, available cores, data-sharing needs, serialization and IPC costs, memory overhead, startup cost, and failure isolation. CPU-bound work needs true parallel execution to scale across cores; threads may or may not provide that in a given runtime. Benchmark the real task and account for coordination and copying.', // Explain practical decision criteria.
        followUp: 'When can shared memory reduce process-based IPC cost?', // Extend to hybrid designs.
        resource: concurrencyReference, // Link to the concurrency chapter.
    }, // Finish the architecture comparison.
    { // Explain privilege separation and system calls.
        title: 'User Mode vs Kernel Mode', // Name the privilege comparison.
        module: 'Process Management', // Complete process fundamentals.
        definition: 'User mode restricts privileged operations, while kernel mode allows the operating system to manage protected hardware and system resources.', // Define privilege levels.
        mechanism: 'Hardware privilege checks and memory protection limit what user code can do. A system call uses a controlled entry into kernel code, which validates arguments and permissions before performing work. Interrupts and faults can also enter the kernel; not every entry changes the running process.', // Explain controlled transitions.
        example: 'An application cannot freely overwrite a device control register. It requests a file read through a system call, and the kernel checks the file descriptor, user buffer, and access rights before coordinating the device operation.', // Give a realistic boundary.
        misconception: 'User-mode code may execute any privileged instruction as long as it is written in a compiled language.', // Correct language versus hardware privilege.
        appliedQuestion: 'How should a user application request a protected file or device operation?', // Test system-call purpose.
        appliedAnswer: 'Through a controlled operating-system API that enters kernel code and checks permissions.', // Identify the boundary.
        appliedWrong: 'By directly bypassing hardware privilege checks from ordinary user code.', // Offer an impossible permission bypass.
        hardQuestion: 'Why must a kernel validate pointers and lengths supplied by a user process?', // Ask about trust boundaries.
        hardAnswer: 'The caller can be buggy or hostile and may supply unmapped addresses, protected kernel addresses, overflowing lengths, or buffers that change concurrently. Kernel code must use appropriate safe-copy and validation mechanisms so invalid requests do not corrupt privileged memory or crash the system. Authentication and access checks are separate from pointer validity.', // Explain memory and authorization concerns.
        followUp: 'Is a mode switch necessarily a context switch?', // Reinforce a key distinction.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf', // Link to execution-control mechanisms.
    }, // Finish the privilege lesson.
    { // Define the protected region of shared-state access.
        title: 'Critical Section', // Name the synchronization concept.
        module: 'Synchronization', // Begin the synchronization module.
        definition: 'A critical section accesses shared state whose invariant requires controlled concurrent execution, commonly mutual exclusion.', // Define the region by its invariant.
        mechanism: 'A correct synchronization design seeks mutual exclusion, progress, and an appropriate fairness or bounded-waiting guarantee. The protected region must cover the complete invariant-preserving operation; locking only a read or only a write can leave a race.', // Explain correctness conditions.
        example: 'Transferring money requires decrementing one account and incrementing another as one protected operation relative to competing transfers. Locking only the final balance assignment leaves the read-compute-write sequence exposed.', // Give an invariant-focused example.
        misconception: 'Protecting only the final assignment always makes a multi-step shared-state update atomic.', // Address incomplete locking.
        appliedQuestion: 'Two threads perform read, increment, write on a shared counter. Which part should mutual exclusion protect?', // Ask about the scope.
        appliedAnswer: 'The entire read-modify-write operation, unless an appropriate atomic operation replaces it.', // Identify the atomic unit.
        appliedWrong: 'Only the last write, while allowing both reads and calculations to race.', // Offer insufficient coverage.
        hardQuestion: 'Why can expanding a critical section improve correctness but reduce performance?', // Ask about scope tradeoffs.
        hardAnswer: 'A larger region can protect a multi-field invariant and prevent interleavings that violate it, but it also serializes more work and increases contention. Keep the invariant protected while moving unrelated computation and slow I/O outside when safe. Splitting locks requires a clear lock order and proof that intermediate states remain acceptable.', // Balance correctness and throughput.
        followUp: 'How would you identify the invariant before choosing a lock?', // Encourage deliberate synchronization.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf', // Link to lock design.
    }, // Finish the critical-section lesson.
    { // Explain timing-dependent incorrect shared-state behavior.
        title: 'Race Conditions', // Name the concurrency failure.
        module: 'Synchronization', // Group shared-state hazards.
        definition: 'A race condition occurs when correctness depends on the timing or ordering of concurrent operations that are not adequately coordinated.', // Define the broad concept.
        mechanism: 'A read-modify-write sequence can interleave even if individual loads and stores are atomic. A data race is a narrower language-memory-model term involving conflicting unsynchronized memory accesses; not every high-level race requires a low-level data race.', // Distinguish related terms.
        example: 'Two threads both read counter=5, each computes 6, and both write 6. Two increments occurred, but the result is 6 rather than 7. A mutex or suitable atomic fetch-add prevents this lost update.', // Give a worked interleaving.
        misconception: 'If individual integer reads and writes are atomic, every multi-step increment is automatically race-free.', // Correct compound-operation reasoning.
        appliedQuestion: 'Two unsynchronized threads read 5 and both write 6 after incrementing. Which effect occurred?', // Ask about the observed result.
        appliedAnswer: 'A lost update caused by interleaving a non-atomic read-modify-write sequence.', // Name the failure.
        appliedWrong: 'Correct serialization, because two increments from 5 must always end at 6.', // Offer incorrect arithmetic.
        hardQuestion: 'Can a program be free of data races and still have a race condition?', // Ask a nuanced concurrency question.
        hardAnswer: 'Yes. A check-then-act sequence may use individually synchronized operations but fail to make the combined decision atomic. For example, two callers can each observe that a concurrent map lacks a key and both perform an external side effect before inserting it. Use a compound atomic operation or a higher-level protocol matching the invariant.', // Explain a logical race.
        followUp: 'Why might a race disappear when logging is added?', // Connect timing to reproducibility.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf', // Link to concurrency analysis.
    }, // Finish the race-condition lesson.
    { // Compare ownership locks with resource permits.
        title: 'Mutex vs Semaphore', // Name the comparison.
        module: 'Synchronization', // Group synchronization primitives.
        definition: 'A mutex normally provides owner-based exclusive access, while a semaphore counts permits and coordinates resource availability or signaling.', // Define the distinct semantics.
        mechanism: 'A mutex is generally unlocked by the thread that acquired it. A counting semaphore decrements on acquisition and increments on release, with waiting when no permit is available. Semaphore signaling can be performed by a different execution stream when its API permits, making it useful beyond simple exclusion.', // Explain ownership and counting.
        example: 'Use a mutex to protect one shared map update. Use a semaphore initialized to 5 to limit active database requests to five. A semaphore used as a signal can begin at zero until another worker posts an event.', // Give three concrete uses.
        misconception: 'A counting semaphore always has exactly one owner and can represent only one available resource.', // Distinguish from a mutex.
        appliedQuestion: 'A worker pool may use at most five concurrent database connections. Which primitive directly represents the capacity?', // Ask resource counting.
        appliedAnswer: 'A counting semaphore initialized with five permits.', // Match the requirement.
        appliedWrong: 'A mutex whose locked state somehow counts all five connections independently.', // Show an inadequate model.
        hardQuestion: 'Why is replacing every mutex with a binary semaphore not always equivalent?', // Ask ownership nuance.
        hardAnswer: 'A mutex often enforces ownership, may integrate with priority inheritance, and can expose debugging or recursive-lock semantics. A binary semaphore models a one-permit state and may allow cross-thread signaling without ownership. Those differences affect misuse detection, scheduling behavior, and the protocol, even when both can enforce exclusion in a simple example.', // Explain semantic differences.
        followUp: 'What happens if a semaphore permit is released twice accidentally?', // Explore counting errors.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', // Link to semaphore details.
    }, // Finish the mutex and semaphore comparison.
    { // Distinguish one-permit and multi-permit synchronization.
        title: 'Binary vs Counting Semaphore', // Name the comparison.
        module: 'Synchronization', // Group semaphore variants.
        definition: 'A binary semaphore represents at most one permit or signal, while a counting semaphore represents multiple available permits.', // Define the state space.
        mechanism: 'Acquire consumes a permit or waits; release makes a permit available subject to the API’s rules. A binary semaphore can coordinate an event or exclusion, while a counting semaphore models a bounded resource pool. Ownership and fairness are not inherent guarantees of the counting idea.', // Explain operations and limits.
        example: 'A printer-ready signal can use a binary semaphore. A parking lot with 20 spaces can use a counting semaphore initialized to 20, acquiring before entry and releasing exactly once after departure.', // Provide concrete uses.
        misconception: 'A counting semaphore initialized to 20 allows an unlimited number of simultaneous successful acquisitions without releases.', // Correct permit exhaustion.
        appliedQuestion: 'A counting semaphore begins with three permits. Three workers acquire without releasing. What happens to a fourth acquire?', // Ask about available capacity.
        appliedAnswer: 'It waits or fails according to the API because no permit remains.', // State the exhaustion behavior.
        appliedWrong: 'It always succeeds and leaves three permits unchanged.', // Offer no-accounting behavior.
        hardQuestion: 'What invariants should a bounded-resource semaphore protocol preserve?', // Ask about protocol design.
        hardAnswer: 'Every successful acquisition must have one corresponding release after the resource is no longer in use, including error paths. The number of active users must not exceed capacity, and releases must not invent permits for acquisitions that failed. Use structured cleanup and, where supported, bounded-semaphore checks to detect over-release.', // Explain leak and over-release prevention.
        followUp: 'Why can a leaked permit eventually block the whole pool?', // Connect accounting and liveness.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', // Link to textbook semantics.
    }, // Finish the semaphore comparison.
    { // Explain structured exclusion and condition waiting.
        title: 'Monitors and Locks', // Name the synchronization structures.
        module: 'Synchronization', // Group structured coordination.
        definition: 'A lock controls entry to protected code, while a monitor combines protected state, mutual exclusion, and condition-based coordination around that state.', // Define the relation.
        mechanism: 'Condition-variable wait atomically releases the associated lock and waits; before returning it reacquires the lock. Check the predicate in a while loop because wakeups can be spurious or another thread can consume the condition first. A notification is not a stored permit.', // Explain correct condition use.
        example: 'A bounded queue protects its buffer with one lock. A consumer executes while (queue.empty()) notEmpty.wait(lock), then removes an item while still holding the lock. A producer signals after changing the queue state.', // Give the classic correct pattern.
        misconception: 'A condition-variable notification permanently stores a permit even when no thread is waiting.', // Distinguish notifications from semaphores.
        appliedQuestion: 'Why should a consumer recheck queue.empty() in a while loop after a condition wait returns?', // Ask predicate reasoning.
        appliedAnswer: 'The predicate may still be false because of spurious wakeups or competing consumers.', // State the correct reason.
        appliedWrong: 'Waiting guarantees the queue contains an item forever, so rechecking is unnecessary.', // Offer the guarantee misconception.
        hardQuestion: 'Why must releasing the lock and beginning the condition wait be coordinated atomically?', // Ask about lost wakeups.
        hardAnswer: 'If a thread checks a false predicate, releases the lock, and only later begins waiting, another thread can change the state and notify in between. The first thread can then sleep after the notification with no future wakeup. The condition-wait API closes this gap when used with the same lock protecting the predicate.', // Explain the dangerous interleaving.
        followUp: 'When should notify-all be preferred over notify-one?', // Extend to multiple predicates or consumers.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf', // Link to condition-variable analysis.
    }, // Finish the monitor lesson.
    { // Explain coordinating bounded-buffer capacity and data availability.
        title: 'Producer-Consumer Problem', // Name the classic concurrency scenario.
        module: 'Synchronization', // Group synchronization applications.
        definition: 'The producer-consumer problem coordinates producers adding items and consumers removing items from a shared buffer without overflow, underflow, or corrupted state.', // Define the safety requirements.
        mechanism: 'A bounded buffer needs both mutual exclusion for internal structure and waiting for not-full and not-empty predicates. With semaphores, empty counts free slots, full counts available items, and a mutex protects buffer mutations. Never wait for capacity while holding a lock needed by the worker that can create it.', // Explain an established solution.
        example: 'For a buffer of capacity 4, initialize empty=4 and full=0. A producer acquires empty, locks and inserts, unlocks, then releases full. A consumer symmetrically acquires full before locking and removing.', // Provide the operation sequence.
        misconception: 'A single mutex alone can make a consumer remove an item from an empty bounded buffer correctly without any waiting protocol.', // Separate exclusion and availability.
        appliedQuestion: 'A bounded buffer has capacity four and starts empty. What are the initial empty and full semaphore counts?', // Test initialization.
        appliedAnswer: 'empty is 4 and full is 0.', // Supply the valid counts.
        appliedWrong: 'empty is 0 and full is 4, because empty means unavailable slots.', // Offer inverted meanings.
        hardQuestion: 'How can a producer-consumer implementation deadlock by acquiring primitives in the wrong order?', // Ask for liveness reasoning.
        hardAnswer: 'If a consumer holds the buffer mutex while waiting on full when the buffer is empty, a producer may be unable to acquire that mutex to insert an item and signal full. Wait for the resource-count semaphore before acquiring the structural mutex, or use a condition wait that releases the mutex atomically.', // Explain the cycle and repair.
        followUp: 'How do you shut down blocked consumers when production has ended?', // Invite practical lifecycle handling.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', // Link to the bounded-buffer treatment.
    }, // Finish the producer-consumer lesson.
    { // Explain shared reading and exclusive writing.
        title: 'Readers-Writers Problem', // Name the classic coordination problem.
        module: 'Synchronization', // Group synchronization applications.
        definition: 'The readers-writers problem permits concurrent readers of shared data while requiring writers to have exclusive access.', // Define the access rule.
        mechanism: 'Read-write locks distinguish shared and exclusive acquisition. Reader-preference can starve writers; writer-preference can delay readers; fair policies try to bound waiting. Read-heavy does not automatically mean faster because lock bookkeeping and cache traffic can outweigh parallelism.', // Explain policy and performance.
        example: 'A configuration table has many read-only lookups and occasional reloads. Concurrent readers can inspect one stable version, while a writer needs exclusive access to replace or mutate the protected version.', // Provide a realistic workload.
        misconception: 'A readers-writers lock permits several writers to mutate the same protected data simultaneously.', // Correct exclusivity.
        appliedQuestion: 'Three readers hold a read lock. A writer requests the write lock. What must be true before it enters?', // Ask about exclusion.
        appliedAnswer: 'All active readers must release, and no other writer may hold the lock.', // State the access condition.
        appliedWrong: 'The writer may immediately mutate concurrently because read locks block only other readers.', // Offer reversed semantics.
        hardQuestion: 'Why can reader-preference starve a writer, and what does a fairer implementation change?', // Ask about scheduling policy.
        hardAnswer: 'If new readers can always join while any reader is active, the reader count may never reach zero and the writer can wait indefinitely. A writer-aware or fair policy stops admitting some new readers once a writer is queued, allowing the active set to drain. This improves bounded waiting but can reduce reader throughput or increase reader latency.', // Explain starvation and its tradeoff.
        followUp: 'When might an ordinary mutex outperform a read-write lock?', // Encourage measurement.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', // Link to textbook discussion.
    }, // Finish the readers-writers lesson.
    { // Explain resource-ordering deadlock with a concrete model.
        title: 'Dining Philosophers Problem', // Name the classic scenario.
        module: 'Synchronization', // Complete the synchronization examples.
        definition: 'Dining philosophers models competing workers that each need two shared resources, illustrating deadlock, starvation, and coordination tradeoffs.', // Define what the model teaches.
        mechanism: 'If every philosopher acquires the left fork and waits for the right, a circular wait can form. Solutions include globally ordering forks, limiting the number competing for forks, or using a coordinator. Deadlock freedom alone does not guarantee that every philosopher eventually eats.', // Explain several solution families.
        example: 'Number the forks and always acquire the lower-numbered fork before the higher-numbered one. The resulting global resource order prevents a cycle of workers each waiting for a lower-ranked resource.', // Give an ordering solution.
        misconception: 'Letting every philosopher hold their left fork forever while waiting for the right guarantees progress.', // Identify the deadlocking protocol.
        appliedQuestion: 'All five philosophers hold their left fork and wait for their right. What is the key problem?', // Ask about the state.
        appliedAnswer: 'A circular wait can deadlock the group because no philosopher can acquire the second fork.', // Identify the liveness failure.
        appliedWrong: 'All philosophers can immediately eat because holding any one fork satisfies the two-fork requirement.', // Offer an invalid resource requirement.
        hardQuestion: 'Why does a global ordering of forks prevent this deadlock?', // Ask for a proof idea.
        hardAnswer: 'Require acquisitions in strictly increasing resource order. A circular wait would require the final waiting edge to return to a lower resource while every edge increases, which is impossible. This breaks circular wait, one necessary deadlock condition. Fair admission is still needed if starvation freedom is required.', // State the ordering argument.
        followUp: 'Can a deadlock-free solution still starve one philosopher?', // Distinguish liveness guarantees.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf', // Link to concurrency failure analysis.
    }, // Finish dining philosophers.
    { // Explain the Coffman conditions and their scope.
        title: 'Four Necessary Conditions', // Name the deadlock criterion.
        module: 'Deadlocks', // Begin deadlock theory.
        definition: 'Deadlock requires mutual exclusion, hold-and-wait, no forced preemption of held resources, and circular wait in the classical resource model.', // State all four conditions.
        mechanism: 'Mutual exclusion limits sharing; hold-and-wait retains resources while requesting more; no preemption prevents forced reclaim; circular wait forms a dependency cycle. Breaking any required condition prevents that class of deadlock. With multiple instances per resource type, a graph cycle alone is not always sufficient.', // Explain necessity without overclaiming sufficiency.
        example: 'Thread A holds lock X and waits for Y, while thread B holds Y and waits for X. Locks are exclusive, each thread holds one while waiting, locks are not forcibly taken, and the waits form a cycle.', // Give a minimal deadlock.
        misconception: 'Circular wait is unnecessary for classical resource deadlock when all other Coffman conditions hold.', // Test all conditions.
        appliedQuestion: 'A holds X and waits for Y; B holds Y and waits for X. Which Coffman condition is directly shown by the dependency loop?', // Ask graph reasoning.
        appliedAnswer: 'Circular wait.', // Name the loop condition.
        appliedWrong: 'Guaranteed preemption of held locks.', // Offer the opposite of a required condition.
        hardQuestion: 'Does the presence of all four conditions prove every system execution is already deadlocked?', // Ask a precise necessity distinction.
        hardAnswer: 'No. They describe necessary characteristics enabling deadlock in the model; merely allowing them does not mean a particular state is deadlocked. Analyze actual allocations and waits. For single-instance resource types, a wait cycle can establish deadlock; multiple instances require more detailed availability reasoning.', // Distinguish possibility and actual state.
        followUp: 'Which condition does globally ordering lock acquisition break?', // Connect prevention.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf', // Link to established concurrency material.
        diagram: ['Thread A holds X → waits for Y', 'Thread B holds Y → waits for X', 'A → B → A forms a circular wait'], // Visualize the two-thread cycle.
    }, // Finish the conditions lesson.
    { // Explain structurally eliminating a required condition.
        title: 'Deadlock Prevention', // Name the policy family.
        module: 'Deadlocks', // Group deadlock handling strategies.
        definition: 'Deadlock prevention imposes rules that make at least one necessary deadlock condition impossible.', // Define prevention.
        mechanism: 'Examples include acquiring all required resources together to avoid hold-and-wait or imposing a total resource order to avoid circular wait. Some resources cannot be safely preempted or shared, so not every condition is practical to break. Prevention can reduce concurrency or resource utilization.', // Explain mechanisms and cost.
        example: 'Assign every lock a rank and require code paths to acquire locks in increasing rank. If locks A and B have ranks 1 and 2, both transfer directions acquire A before B instead of choosing account order independently.', // Give an enforceable rule.
        misconception: 'Deadlock prevention requires detecting an existing cycle and killing a process after the deadlock has formed.', // Distinguish detection and recovery.
        appliedQuestion: 'A system requires every thread to acquire locks in ascending global rank. Which condition does this prevent?', // Ask about the rule.
        appliedAnswer: 'Circular wait, because a cycle would require ranks to decrease somewhere.', // Explain the condition.
        appliedWrong: 'Mutual exclusion, because ranked locks can now be held by unlimited writers.', // Offer unrelated semantics.
        hardQuestion: 'What tradeoffs arise when requiring a job to acquire all resources before it starts?', // Ask about hold-and-wait prevention.
        hardAnswer: 'It prevents holding a subset while waiting for more, but jobs must know their needs in advance. Resources can sit idle while reserved, and a job needing many resources may wait a long time even if it could have done useful work with a subset. Reservation can lower utilization and create starvation unless admission is fair.', // Explain costs.
        followUp: 'When is global lock ordering difficult to maintain across modules?', // Invite implementation reasoning.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf', // Link to prevention examples.
    }, // Finish deadlock prevention.
    { // Explain preserving a provably safe allocation state.
        title: 'Deadlock Avoidance', // Name the policy family.
        module: 'Deadlocks', // Group handling strategies.
        definition: 'Deadlock avoidance examines each proposed allocation and grants it only when the resulting state remains safe under known resource-demand assumptions.', // Define avoidance.
        mechanism: 'A safe state has at least one order in which every process can obtain its remaining declared resources, finish, and release them. An unsafe state is not necessarily already deadlocked. Algorithms such as Banker’s need declared maximum demands and reliable allocation bookkeeping.', // Explain the safety concept.
        example: 'If only one resource unit is available, granting it to one process may leave no process able to finish. An avoidance policy can defer the request when preserving that unit allows another process to complete and release enough resources.', // Demonstrate prospective decision making.
        misconception: 'An unsafe state means every process is already deadlocked at the instant the state is identified.', // Distinguish unsafe and deadlocked.
        appliedQuestion: 'A resource state has no provable completion sequence under declared maximum demands. Must it already be deadlocked?', // Ask the key distinction.
        appliedAnswer: 'No; it is unsafe, meaning deadlock may become possible depending on future requests.', // State the correct implication.
        appliedWrong: 'Yes; unsafe and currently deadlocked are identical definitions.', // Offer the false equivalence.
        hardQuestion: 'Why is deadlock avoidance difficult for many general-purpose applications?', // Ask about assumptions.
        hardAnswer: 'Programs often cannot declare accurate maximum resource demands, and resources or processes may appear dynamically. Repeated safety checks add overhead, and overly conservative estimates can delay work unnecessarily. The technique is more practical when resource classes, demand limits, and release behavior are controlled and known.', // Explain practical limits.
        followUp: 'How does avoidance differ from preventing circular wait by design?', // Compare prospective and structural approaches.
        resource: 'https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html', // Link to university deadlock notes.
    }, // Finish deadlock avoidance.
    { // Explain finding and recovering from an existing deadlock.
        title: 'Deadlock Detection', // Name the strategy.
        module: 'Deadlocks', // Group handling strategies.
        definition: 'Deadlock detection permits potentially risky allocations and periodically analyzes current waits to identify a deadlocked set.', // Define detection.
        mechanism: 'For single-instance resource types, a wait-for graph cycle identifies a deadlock. Multiple resource instances require an allocation-and-availability algorithm. Detection must be paired with recovery such as aborting work, rolling back transactions, or safely reclaiming resources.', // Explain algorithms and recovery.
        example: 'A database sees transaction T1 waiting for a row held by T2 and T2 waiting for a row held by T1. It chooses a victim, rolls that transaction back, and lets the other proceed.', // Provide a practical example.
        misconception: 'Detecting a deadlock automatically resolves it without aborting, rolling back, or reclaiming any resource.', // Distinguish diagnosis and repair.
        appliedQuestion: 'A database detects T1 → T2 → T1 in its lock wait-for graph. What additional step is needed?', // Test recovery.
        appliedAnswer: 'Choose and execute a recovery action, commonly aborting and rolling back a victim transaction.', // State the needed response.
        appliedWrong: 'Ignore the cycle because drawing the graph has already released both locks.', // Offer a no-op misconception.
        hardQuestion: 'What factors should influence victim selection during deadlock recovery?', // Ask about policy.
        hardAnswer: 'Consider work already done, rollback cost, held resources, transaction importance, and how often a task has previously been chosen. Always aborting the cheapest or youngest job may starve it under repeated contention. Recovery must restore data invariants, release resources safely, and document which operations are retried.', // Explain fairness and consistency.
        followUp: 'Why is a generic timeout weaker evidence than a detected wait cycle?', // Distinguish slow work and deadlock.
        resource: 'https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html', // Link to university analysis.
    }, // Finish deadlock detection.
    { // Work through safety testing for declared resource demands.
        title: "Banker's Algorithm", // Name the avoidance algorithm.
        module: 'Deadlocks', // Complete the deadlock algorithms.
        definition: 'Banker’s algorithm avoids unsafe allocations by checking whether all processes can finish in some sequence using available resources and declared remaining needs.', // Define the test.
        mechanism: 'Compute Need = Max − Allocation. Start Work at Available, find an unfinished process whose Need is no greater than Work in every resource dimension, simulate its completion, and add its Allocation to Work. A request is granted only after tentative allocation passes this safety test and stays within the process’s declared maximum.', // Explain the complete safety loop.
        example: 'For one resource type, Available=1; P1 holds 1 and needs 1 more; P2 holds 2 and needs 2 more. P1 can finish with Work=1, then release its allocated 1, making Work=2; P2 can then finish. The state is safe in order P1, P2.', // Give a valid simple example.
        misconception: 'A process can be simulated as finished whenever its total maximum exceeds Available, without checking its remaining Need.', // Correct the comparison.
        appliedQuestion: 'Available=1; P1 Allocation=1, Need=1; P2 Allocation=2, Need=2. Which process can finish first in the safety test?', // Ask a worked step.
        appliedAnswer: 'P1, after which its released allocation lets Work reach 2 for P2.', // State the safe sequence.
        appliedWrong: 'Neither, because the test compares every process’s total allocation against zero.', // Offer an invalid condition.
        hardQuestion: 'Why does the safety test add Allocation rather than Max when simulating completion?', // Ask for accounting reasoning.
        hardAnswer: 'Work already represents available units. Simulating the remaining need temporarily consumes resources and completion returns those same borrowed units plus the process’s preexisting allocation, so the net change is exactly Allocation. Adding Max without subtracting Need would invent resources and can falsely label an unsafe state safe.', // Explain resource conservation.
        followUp: 'What fails if a process requests more than its declared maximum?', // Probe the algorithm's assumption.
        resource: 'https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html', // Link to a detailed algorithm reference.
    }, // Finish Banker’s algorithm.
    { // Compare fixed-size translation with logical memory regions.
        title: 'Paging vs Segmentation', // Name the memory-model comparison.
        module: 'Memory Management', // Begin the memory module.
        definition: 'Paging divides virtual memory into fixed-size pages mapped to frames; segmentation divides an address space into variable-size logical regions with bounds and permissions.', // Define both schemes.
        mechanism: 'Paging translates a page number and offset through page tables, avoiding external fragmentation at the frame level but leaving possible internal waste in a final page. Classical segmentation uses a segment identifier and offset checked against a limit, which can produce external fragmentation. Systems can combine both ideas.', // Explain translation and fragmentation.
        example: 'With 4 KiB pages, virtual address 0x1234 has page number 1 and offset 0x234. A segment-based model might instead represent a code segment and a stack segment with distinct sizes and access rights.', // Give a concrete address split.
        misconception: 'Paging requires every process’s entire virtual address space to occupy one physically contiguous block.', // Correct contiguity assumptions.
        appliedQuestion: 'With 4 KiB pages, which parts of virtual address 0x1234 identify the page and byte offset?', // Test address decomposition.
        appliedAnswer: 'Page number 1 and offset 0x234.', // State the correct split.
        appliedWrong: 'Page number 0x1234 and zero offset, because every byte is a whole page.', // Offer an incorrect granularity.
        hardQuestion: 'Why does paging reduce external fragmentation while still allowing internal fragmentation?', // Ask for allocation reasoning.
        hardAnswer: 'Any free frame can hold any page, so a process does not require a contiguous physical hole large enough for its whole address space. A page is nevertheless allocated at fixed granularity, so the final partially used page can contain unused bytes. Page tables and physical-contiguity requirements for other subsystems still have their own overheads.', // Explain the two kinds of waste.
        followUp: 'What tradeoffs arise when increasing page size?', // Extend to page-table and TLB costs.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf', // Link to the paging chapter.
    }, // Finish paging and segmentation.
    { // Explain address-space abstraction and demand paging.
        title: 'Virtual Memory', // Name the system abstraction.
        module: 'Memory Management', // Group memory virtualization concepts.
        definition: 'Virtual memory gives each process a protected virtual address space whose mappings need not correspond to one contiguous or fully resident physical-memory region.', // Define virtual memory beyond swap.
        mechanism: 'The memory-management unit translates addresses using mappings maintained by the kernel. Pages may be resident, shared, file-backed, unmapped, or temporarily stored elsewhere. A page fault is a controlled exception for a missing or disallowed mapping; some faults are resolved and others become access violations.', // Explain translation and fault outcomes.
        example: 'A process maps a large executable but initially faults in only the pages it actually uses. Two processes can map the same read-only library frames while keeping private writable data and independent virtual addresses.', // Give demand-paging and sharing examples.
        misconception: 'Virtual memory is only a synonym for disk swap and provides no isolation or address translation.', // Correct the narrow definition.
        appliedQuestion: 'Two processes use the same virtual address 0x4000. Must they access the same physical bytes?', // Ask about address spaces.
        appliedAnswer: 'No; each process can map that virtual address to different physical frames.', // State independent mappings.
        appliedWrong: 'Yes; a virtual address globally identifies one physical byte in every process.', // Offer a flat-address misconception.
        hardQuestion: 'Why can a page fault occur even when the machine has plenty of free physical memory?', // Ask about fault causes.
        hardAnswer: 'The mapping may be demand-zero or file-backed and not yet populated, may be copy-on-write, or may violate permissions or refer to an unmapped address. Free RAM does not imply every valid virtual page already has a resident frame. The fault handler examines the mapping and access type before deciding whether to allocate, load, copy, or reject.', // Explain major categories.
        followUp: 'How does copy-on-write support efficient process creation?', // Extend to sharing.
        resource: memoryReference, // Link to the address-space chapter.
    }, // Finish virtual memory.
    { // Explain per-page mapping metadata and multilevel lookup.
        title: 'Page Tables', // Name the translation structure.
        module: 'Memory Management', // Group translation mechanisms.
        definition: 'A page table records mappings from virtual page numbers to physical frames together with validity, permission, and other memory-management metadata.', // Define mapping contents.
        mechanism: 'A page-table entry can encode present, writable, executable, accessed, and dirty information depending on architecture. Multilevel page tables allocate lower levels only for used address ranges, reducing sparse-address-space overhead at the cost of additional page-walk steps.', // Explain fields and hierarchy.
        example: 'For 4 KiB pages, translation preserves the low 12-bit offset and replaces the virtual page number with the mapped frame number. A write to a read-only entry triggers a protection fault rather than an ordinary permitted store.', // Give translation behavior.
        misconception: 'Page tables translate byte offsets independently and discard the offset inside each page.', // Correct page granularity.
        appliedQuestion: 'A 4 KiB page maps virtual page 7 to physical frame 20. What happens to an offset of 100 bytes?', // Test translation.
        appliedAnswer: 'The offset stays 100, so the address refers to byte 100 within frame 20.', // Preserve the offset.
        appliedWrong: 'The offset becomes 20 because every translation replaces all address bits with the frame number.', // Offer total-address replacement.
        hardQuestion: 'Why do large virtual address spaces commonly use multilevel page tables?', // Ask about sparse allocation.
        hardAnswer: 'A flat table reserves an entry for every possible virtual page even when most ranges are unused. A hierarchy omits entire unused subtrees and allocates lower-level tables on demand. The tradeoff is more memory accesses on a TLB miss, which hardware walkers, caches, and larger pages can mitigate.', // Explain the space-time tradeoff.
        followUp: 'How does a TLB change the cost of walking page tables?', // Connect the next concept.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-smalltables.pdf', // Link to page-table design.
    }, // Finish page tables.
    { // Introduce choosing a victim under memory pressure.
        title: 'Page Replacement Algorithms', // Name the policy area.
        module: 'Memory Management', // Group memory-replacement policies.
        definition: 'A page replacement algorithm chooses which resident page to evict when a demanded page needs a frame and no suitable free frame is available.', // Define the decision.
        mechanism: 'Policies trade fault rate against bookkeeping, dirty-page writeback cost, locality, and fairness. FIFO uses arrival age, LRU uses recent references, and OPT uses future references as an unattainable benchmark. A replacement decision must preserve dirty data and update mappings consistently.', // Explain evaluation criteria.
        example: 'With three frames and references A, B, C, A, D, the arrival order and recent-use order differ before D arrives. FIFO evicts A, while LRU evicts B, illustrating that policy depends on different history.', // Compare policies on one trace.
        misconception: 'Every replacement policy chooses the same victim whenever the number of frames is the same.', // Correct policy equivalence.
        appliedQuestion: 'Three frames contain A, B, C loaded in that order, and A was just referenced. On a fault for D, how can FIFO and LRU differ?', // Test policy history.
        appliedAnswer: 'FIFO can evict A, while LRU evicts B because A was recently used.', // State the differing victims.
        appliedWrong: 'Both must evict A because every policy ignores access history.', // Offer the false invariant.
        hardQuestion: 'Why is minimizing page-fault count not the only practical replacement objective?', // Ask about real costs.
        hardAnswer: 'Faults and evictions have unequal costs: a clean file-backed page can be discarded while a dirty anonymous page may require writeback. Policies also consume CPU and metadata, affect locality across processes, and may face real-time latency limits. Evaluate total system cost and workload behavior rather than a single count.', // Explain cost-aware policy.
        followUp: 'How can a dirty bit influence a practical victim choice?', // Extend to metadata.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', // Link to replacement policy analysis.
    }, // Finish the replacement overview.
    { // Explain first-in eviction and Belady's anomaly.
        title: 'FIFO', // Name the required replacement algorithm.
        module: 'Memory Management', // Distinguish it from unrelated FIFO scheduling.
        definition: 'FIFO page replacement evicts the page that entered memory earliest, regardless of how recently it has been accessed.', // Define the policy.
        mechanism: 'Maintain a queue of page arrivals and evict from its head. Hits do not move a page to the back. The policy is simple but can evict a frequently used old page and can exhibit Belady’s anomaly, where adding frames increases faults for some reference strings.', // Explain queue semantics and anomaly.
        example: 'Frames hold A, B, C in arrival order. Accessing A is a hit and does not change FIFO order. A subsequent reference to D evicts A even though A was just used.', // Give a short trace.
        misconception: 'A FIFO hit always moves the referenced page to the newest position, exactly like LRU.', // Distinguish recency from arrival.
        appliedQuestion: 'A, B, C were loaded in that order. A is hit, then D faults. Which page does FIFO evict?', // Test the trace.
        appliedAnswer: 'A, because it is still the oldest loaded page.', // Apply FIFO.
        appliedWrong: 'B, because the hit on A necessarily refreshed FIFO arrival age.', // Offer LRU behavior.
        hardQuestion: 'What does Belady’s anomaly tell you about FIFO replacement?', // Ask about a surprising property.
        hardAnswer: 'For some reference strings, increasing available frames can increase the number of FIFO faults. FIFO lacks the stack-inclusion property that guarantees larger-memory contents include the smaller-memory set after each reference. Therefore, more memory does not monotonically improve every FIFO trace, though it often helps ordinary workloads.', // Explain the implication carefully.
        followUp: 'Which common policies are stack algorithms and avoid this anomaly?', // Connect LRU and OPT.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', // Link to policy analysis.
    }, // Finish FIFO page replacement.
    { // Explain recency-based eviction and tracking overhead.
        title: 'LRU', // Name the required policy.
        module: 'Memory Management', // Group replacement algorithms.
        definition: 'Least Recently Used replacement evicts the resident page whose last reference is farthest in the past.', // Define the recency rule.
        mechanism: 'Exact LRU updates ordering on every access, which can be expensive for hardware-managed memory. Practical systems often approximate recency using accessed bits, clock algorithms, or aging. LRU relies on temporal locality and can perform poorly on scans larger than available memory.', // Explain cost and workload assumptions.
        example: 'With pages A, B, C loaded, a hit on A changes recency to B, C, A from oldest to newest. A new D therefore evicts B, unlike FIFO, which would still evict A.', // Work through the ordering.
        misconception: 'LRU evicts the page loaded earliest even if that page was accessed one instruction ago.', // Contrast FIFO.
        appliedQuestion: 'Pages A, B, C are resident; their last accesses are at times 9, 4, and 7. Which does exact LRU evict?', // Ask direct recency selection.
        appliedAnswer: 'B, whose last reference at time 4 is oldest.', // Select the least recent.
        appliedWrong: 'A, because its reference at time 9 is the newest.', // Offer reversed ordering.
        hardQuestion: 'Why do operating systems often approximate rather than implement exact LRU?', // Ask about instrumentation.
        hardAnswer: 'Exact ordering would require observing and updating metadata for every memory reference, introducing substantial hardware or software overhead. Accessed bits and periodic sampling provide cheaper estimates. Approximate policies trade some optimal recency information for practical performance, and their behavior must be evaluated against real access patterns.', // Explain feasibility.
        followUp: 'How does a clock algorithm use accessed bits as a recency approximation?', // Extend to implementation.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', // Link to textbook details.
    }, // Finish LRU.
    { // Explain the future-aware lower-bound benchmark.
        title: 'Optimal Page Replacement', // Name OPT explicitly.
        module: 'Memory Management', // Group replacement algorithms.
        definition: 'Optimal page replacement evicts the page whose next use lies farthest in the future, producing a minimum fault count for a known reference trace and fixed frame count.', // Define the benchmark and assumptions.
        mechanism: 'A page never referenced again is an ideal victim. Exact future references are not generally available online, so OPT is primarily an offline comparison baseline. The benchmark minimizes fault count in its model and does not automatically minimize dirty-write or latency cost.', // Explain practicality and objective.
        example: 'Resident pages are A, B, C; future references are B, A, D, C. If a new page must be loaded now, C is used farthest in the future among the resident pages and is the OPT victim.', // Give a future-use example.
        misconception: 'A normal operating system can always know every application’s exact future references and implement OPT without prediction.', // Correct future knowledge.
        appliedQuestion: 'Resident A is used next step, B in ten steps, and C never again. Which page does OPT evict?', // Test the rule.
        appliedAnswer: 'C, because it has no future use.', // Select the ideal victim.
        appliedWrong: 'A, because the page needed soonest should always be removed first.', // Offer the opposite policy.
        hardQuestion: 'Why is OPT useful even though it cannot generally run as an online operating-system policy?', // Ask about evaluation.
        hardAnswer: 'Recorded traces reveal future accesses during offline analysis, allowing OPT to establish a lower bound on page faults under the same memory model. Comparing LRU or FIFO with that bound shows how much room remains for improvement. Keep frame count, initial state, and trace assumptions identical for a meaningful comparison.', // Explain benchmarking discipline.
        followUp: 'Would minimizing page faults necessarily minimize elapsed I/O time?', // Extend to unequal fault costs.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', // Link to the replacement-policy chapter.
    }, // Finish OPT.
    { // Explain repeated faults when working sets exceed memory.
        title: 'Thrashing', // Name the memory-pressure failure.
        module: 'Memory Management', // Group demand-paging behavior.
        definition: 'Thrashing occurs when a workload spends excessive time paging because the actively needed working sets cannot be retained in available memory.', // Define the phenomenon.
        mechanism: 'Frequent evictions remove pages that are needed again shortly, creating repeated faults and I/O. Adding more runnable work can worsen pressure even while CPU utilization looks low. Remedies include reducing multiprogramming, allocating more memory to active working sets, or changing access patterns.', // Explain the feedback loop and remedies.
        example: 'Three processes each repeatedly touch a 2 GiB working set, but only 3 GiB is available for their pages. Interleaving all three can continually evict each other’s hot pages and spend most time waiting for storage.', // Give a concrete capacity mismatch.
        misconception: 'When low CPU utilization is caused by thrashing, adding unlimited memory-hungry processes always fixes throughput.', // Correct the harmful response.
        appliedQuestion: 'Page faults and storage activity are high while useful CPU work collapses after adding processes. What is a plausible first diagnosis?', // Ask symptom interpretation.
        appliedAnswer: 'Thrashing caused by combined active working sets exceeding available frames.', // Identify the likely cause.
        appliedWrong: 'Too much physical memory, which always causes additional page faults.', // Offer inverted causality.
        hardQuestion: 'Why can increasing the degree of multiprogramming reduce rather than improve throughput?', // Ask about resource competition.
        hardAnswer: 'Additional active processes increase the aggregate working set. Once memory cannot retain their frequently used pages, page faults serialize progress on slow storage and evict other useful pages. The CPU can spend less time doing work despite more runnable demand. Admission control and working-set-aware allocation can restore useful overlap.', // Explain the nonlinear effect.
        followUp: 'How would you distinguish thrashing from CPU saturation using measurements?', // Encourage operational reasoning.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', // Link to memory-pressure discussion.
    }, // Finish thrashing.
    { // Explain caching of virtual-to-physical translations.
        title: 'TLB', // Name the translation cache.
        module: 'Memory Management', // Group address-translation performance.
        definition: 'A translation lookaside buffer caches recent virtual-page translations and associated permissions to avoid repeated page-table walks.', // Define the TLB.
        mechanism: 'A TLB hit can supply a frame mapping quickly. A TLB miss triggers a page-table walk or software handling depending on architecture; it is not itself a page fault if a valid resident mapping exists. Address-space identifiers can distinguish entries from different processes.', // Separate translation misses and missing pages.
        example: 'A process scans many bytes within one 4 KiB page. Once that page’s translation is cached, subsequent accesses can reuse it. Crossing enough distinct pages to exceed TLB capacity may cause translation misses even when all data remains in RAM.', // Give locality and capacity examples.
        misconception: 'Every TLB miss means the requested page must be fetched from disk.', // Correct the common conflation.
        appliedQuestion: 'A translation is absent from the TLB, but the page table maps a present, permitted RAM page. Must disk I/O occur?', // Ask about miss handling.
        appliedAnswer: 'No; a page-table walk can refill the TLB without a demand-page disk read.', // State the distinction.
        appliedWrong: 'Yes; translation-cache misses always require swapping the page in.', // Offer page-fault confusion.
        hardQuestion: 'How can larger pages improve TLB reach, and what costs can they introduce?', // Ask for tradeoffs.
        hardAnswer: 'With the same number of entries, larger pages cover more bytes, reducing misses for large working sets. Costs can include greater internal fragmentation, more expensive allocation or copying, and coarser protection or sharing granularity. The best choice depends on access patterns, memory pressure, and hardware support.', // Explain coverage and costs.
        followUp: 'How can address-space identifiers reduce context-switch TLB overhead?', // Extend to process switching.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf', // Link to the TLB chapter.
    }, // Finish the TLB lesson.
    { // Distinguish unused space inside blocks from holes between allocations.
        title: 'Internal vs External Fragmentation', // Name the allocation comparison.
        module: 'Memory Management', // Complete memory fundamentals.
        definition: 'Internal fragmentation is unused space inside an allocated unit; external fragmentation is free space split into holes that cannot satisfy a required contiguous allocation.', // Define the two categories.
        mechanism: 'Fixed-size allocation rounds a request up and can waste space within the final unit. Variable-size contiguous allocation can leave separated free holes even when total free bytes are sufficient. Compaction can address some external fragmentation but has movement and reference-update costs.', // Explain sources and remedies.
        example: 'A 6 KiB request using 4 KiB pages occupies 8 KiB, leaving 2 KiB internal waste. Two free 3 KiB holes cannot satisfy one contiguous 5 KiB request despite 6 KiB being free: that is external fragmentation.', // Give two worked examples.
        misconception: 'Two nonadjacent free holes must satisfy any single contiguous request smaller than their combined size.', // Identify contiguity requirements.
        appliedQuestion: 'A 6 KiB allocation uses two 4 KiB pages. What is its unused space inside those pages?', // Test rounding.
        appliedAnswer: '2 KiB of internal fragmentation.', // State the waste.
        appliedWrong: '6 KiB of external fragmentation because pages are always contiguous.', // Offer the wrong category and amount.
        hardQuestion: 'Why does paging not eliminate every fragmentation concern in a complete operating system?', // Ask for system scope.
        hardAnswer: 'Paging allows noncontiguous frames for ordinary virtual pages, reducing external fragmentation for that allocation model, but partially used pages still create internal waste. Kernel structures, huge pages, DMA, and other requirements can need contiguous physical ranges and face additional fragmentation. Distinguish the allocator and granularity being discussed.', // Explain subsystem differences.
        followUp: 'How does smaller allocation granularity affect metadata overhead?', // Extend to tradeoffs.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-freespace.pdf', // Link to allocator discussion.
    }, // Finish the fragmentation comparison.
    { // Introduce mapping file offsets to storage blocks.
        title: 'File Allocation Methods', // Name the storage topic.
        module: 'File Systems and Disk Management', // Begin the storage module.
        definition: 'File allocation methods determine how a file’s logical blocks map to storage locations and how the system records that mapping.', // Define allocation.
        mechanism: 'Contiguous allocation stores neighboring blocks together, linked allocation follows block pointers, and indexed allocation consults a separate mapping structure. Practical file systems often combine extents, indexes, caching, and allocation heuristics rather than using one textbook model exclusively.', // Explain the main families.
        example: 'A video played sequentially benefits from nearby large extents, while random reads in a database file need efficient offset-to-block lookup. Allocation decisions affect locality, growth, metadata size, and recovery complexity.', // Connect layout to workload.
        misconception: 'Every file system stores every file as exactly one permanent contiguous region with no metadata.', // Correct an oversimplification.
        appliedQuestion: 'Which allocation family uses an external table or index to map a file’s logical blocks to data blocks?', // Test classification.
        appliedAnswer: 'Indexed allocation.', // Name the mapping approach.
        appliedWrong: 'Pure linked allocation, which never needs to traverse links for random access.', // Offer a false property.
        hardQuestion: 'Which workload and device properties should guide a file-allocation design?', // Ask for tradeoff analysis.
        hardAnswer: 'Consider sequential versus random access, typical file sizes, growth, free-space fragmentation, metadata overhead, crash consistency, and device behavior. HDDs strongly reward reduced seeks, while SSDs remove mechanical seeks but still benefit from batching and sensible write patterns. Extents can combine compact metadata with good sequential locality.', // Explain workload-driven choices.
        followUp: 'Why are extents useful for large files?', // Extend to practical designs.
        resource: storageReference, // Link to the textbook implementation chapter.
    }, // Finish the allocation overview.
    { // Explain one-range file storage and extent growth.
        title: 'Contiguous Allocation', // Name the allocation method.
        module: 'File Systems and Disk Management', // Group file-layout methods.
        definition: 'Contiguous allocation stores a file in consecutive storage blocks, allowing a logical block number to be translated from a starting block and offset.', // Define the layout.
        mechanism: 'Metadata can record a start block and length, making sequential and direct access simple. Growing the file may require adjacent free space, relocation, or additional extents. Variable-sized contiguous regions can create external fragmentation.', // Explain mapping and growth cost.
        example: 'A file starts at block 100 and occupies eight blocks. Its zero-based logical block 3 is at physical block 103. If block 108 is occupied, extending the single contiguous run becomes difficult.', // Give address arithmetic and growth.
        misconception: 'A single contiguous file can always grow indefinitely without nearby free space or relocation.', // Address growth constraints.
        appliedQuestion: 'A contiguous file begins at block 100. Where is its zero-based logical block 3?', // Test direct calculation.
        appliedAnswer: 'Physical block 103.', // Supply the correct location.
        appliedWrong: 'Physical block 300, because the starting block is multiplied by the logical index.', // Offer wrong arithmetic.
        hardQuestion: 'How do extents relax the limitations of single-run contiguous allocation?', // Ask about a practical evolution.
        hardAnswer: 'An extent records one contiguous run, and a file may have several extents. This preserves compact mappings and sequential locality within runs while allowing growth in another region when adjacent space is unavailable. Highly fragmented growth can still create many extents and increase lookup or I/O overhead.', // Explain the compromise.
        followUp: 'What allocation strategy could reduce the number of future extents?', // Extend to preallocation.
        resource: storageReference, // Link to the storage reference.
    }, // Finish contiguous allocation.
    { // Explain a file as a chain of blocks.
        title: 'Linked Allocation', // Name the allocation method.
        module: 'File Systems and Disk Management', // Group file-layout methods.
        definition: 'Linked allocation represents a file as a chain of blocks, with each link identifying the next block in the file.', // Define the structure.
        mechanism: 'A file can grow by linking a free block without requiring adjacent space. Pure on-block linked allocation has inefficient random access because reaching a later block requires following earlier links. Pointer damage can break traversal, and pointer storage consumes capacity.', // Explain benefits and limitations.
        example: 'A file’s data may occupy blocks 9 → 27 → 4 → 51. Reading the third block requires following the chain from 9 through 27 to 4 unless extra indexing or caching is available.', // Show noncontiguous order.
        misconception: 'Pure linked allocation locates an arbitrary file block by one constant-time arithmetic calculation without any auxiliary index.', // Distinguish from contiguous mapping.
        appliedQuestion: 'For chain 9 → 27 → 4 → 51, which physical block holds the zero-based logical block 2?', // Test following links.
        appliedAnswer: 'Block 4, reached after following two links from the first block.', // State the correct block.
        appliedWrong: 'Block 11, obtained by adding 2 to the first block regardless of links.', // Offer contiguous arithmetic.
        hardQuestion: 'How does a file allocation table change the cost profile of linked allocation?', // Ask about FAT.
        hardAnswer: 'The links are stored in a separate table rather than embedded only in data blocks. Caching the table allows traversal without reading each intervening data block, improving access, but following the logical chain still costs steps unless additional indexing is used. The table itself consumes memory and storage and must be kept consistent.', // Explain the optimization and its limits.
        followUp: 'What happens if a link forms a cycle because of corruption?', // Explore integrity.
        resource: storageReference, // Link to implementation details.
    }, // Finish linked allocation.
    { // Explain direct block lookup through a separate index.
        title: 'Indexed Allocation', // Name the allocation method.
        module: 'File Systems and Disk Management', // Group file-layout methods.
        definition: 'Indexed allocation stores pointers to a file’s data blocks in a separate index so logical blocks can be located without following a data-block chain.', // Define the mapping.
        mechanism: 'A single index block is simple but limits file size and can waste space for tiny files. Multilevel indexes or inode-style direct and indirect pointers scale to larger files. Looking up an uncached indirect block may require additional I/O before accessing data.', // Explain scale and overhead.
        example: 'An index contains [9, 27, 4, 51]. Zero-based logical block 2 maps directly to physical block 4 through the third entry. A large file may need another level when one index block no longer holds all pointers.', // Give a worked index lookup.
        misconception: 'Indexed allocation eliminates all metadata storage and always needs zero extra reads for an uncached indirect block.', // Correct overhead assumptions.
        appliedQuestion: 'An index stores [9, 27, 4, 51]. Which physical block corresponds to logical block 2?', // Test indexed addressing.
        appliedAnswer: 'Block 4, selected by index entry 2.', // State the direct mapping.
        appliedWrong: 'Block 11, because an index must ignore its entries and use contiguous arithmetic.', // Offer the wrong model.
        hardQuestion: 'Why combine direct pointers with single and double indirect pointers in an inode?', // Ask about balancing small and large files.
        hardAnswer: 'Direct pointers let common small files reach data with little indexing overhead. Indirect levels provide enough addressability for large files without allocating a giant fixed table for every file. The tradeoff is extra metadata and potentially more I/O for blocks reached through deeper levels, mitigated by caching.', // Explain the hybrid design.
        followUp: 'How would block size and pointer width determine maximum indexed file size?', // Invite capacity calculation.
        resource: storageReference, // Link to the textbook inode discussion.
    }, // Finish indexed allocation.
    { // Introduce mechanical request ordering and modern device caveats.
        title: 'Disk Scheduling', // Name the storage policy area.
        module: 'File Systems and Disk Management', // Group head-movement algorithms.
        definition: 'Disk scheduling orders pending storage requests to balance latency, throughput, fairness, and, for HDDs, mechanical positioning costs.', // Define the policy and device scope.
        mechanism: 'HDD access includes seek, rotational delay, and transfer time. Textbook FCFS, SSTF, SCAN, and C-SCAN mainly model cylinder movement and simplify other costs. SSDs have no mechanical head; modern controllers and queues need different latency, fairness, and parallelism considerations.', // Explain the model's limits.
        example: 'With an HDD head at cylinder 50 and requests at 10, 45, and 90, request order changes total movement and who waits longest. On an SSD, those cylinder-distance calculations do not represent mechanical cost.', // Give a device-specific example.
        misconception: 'SSD performance is dominated by physically moving a magnetic head between cylinders exactly as on an HDD.', // Correct the device mismatch.
        appliedQuestion: 'Which device characteristic makes seek-distance-based scheduling directly meaningful?', // Test model applicability.
        appliedAnswer: 'A mechanically moving HDD head whose positioning time depends on request location.', // Identify the relevant mechanism.
        appliedWrong: 'An SSD controller moving a mechanical head across flash cylinders.', // Offer an inapplicable model.
        hardQuestion: 'Why can minimizing total HDD head movement fail to minimize every request’s latency?', // Ask about fairness.
        hardAnswer: 'A movement-minimizing policy may repeatedly serve nearby requests while distant ones wait, especially under continuous arrivals. Rotational position and request size also affect latency beyond cylinder distance. A production policy must balance efficiency, deadlines, batching, and starvation protection rather than optimize only one simplified metric.', // Explain the multiobjective problem.
        followUp: 'How does a deadline policy limit starvation?', // Extend to practical schedulers.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf', // Link to the HDD chapter.
    }, // Finish the disk-scheduling overview.
    { // Explain servicing disk requests by arrival order.
        title: 'FCFS', // Preserve the required disk algorithm name.
        module: 'File Systems and Disk Management', // Distinguish it from CPU FCFS.
        definition: 'FCFS disk scheduling services pending requests in arrival order without reordering them to reduce head movement.', // Define the disk policy.
        mechanism: 'The rule is simple and preserves queue order, but alternating distant requests can cause excessive seeks on an HDD. Total modeled movement is the sum of absolute distances between the starting head and successive requested cylinders.', // Explain calculation and cost.
        example: 'Start at cylinder 50 with arrival-order requests 10, 90, 20. Movement is |50−10| + |10−90| + |90−20| = 40 + 80 + 70 = 190 cylinders.', // Work through the arithmetic.
        misconception: 'FCFS disk scheduling always selects the closest pending cylinder before serving earlier arrivals.', // Distinguish from SSTF.
        appliedQuestion: 'Starting at 50, FCFS serves 10, 90, 20 in arrival order. What is total head movement?', // Test the example.
        appliedAnswer: '190 cylinders.', // State the correct sum.
        appliedWrong: '90 cylinders, because FCFS silently sorts requests by distance.', // Offer a false reorder.
        hardQuestion: 'What fairness advantage does FCFS provide, and what performance cost can it impose?', // Ask a policy comparison.
        hardAnswer: 'A request is not indefinitely bypassed by later arrivals under ordinary bounded service assumptions, because arrival order is preserved. However, that order may cause long seeks and poor throughput. Fair queue order does not imply a uniformly small response time, especially when earlier operations are slow or numerous.', // Explain fairness without overclaiming.
        followUp: 'How would SSTF reorder the same starting queue?', // Connect the next policy.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf', // Link to HDD scheduling.
    }, // Finish disk FCFS.
    { // Explain closest-request-first disk scheduling.
        title: 'SSTF', // Name Shortest Seek Time First.
        module: 'File Systems and Disk Management', // Group disk algorithms.
        definition: 'Shortest Seek Time First selects a pending request closest to the current HDD head position under a seek-distance model.', // Define selection.
        mechanism: 'Recompute proximity after each completed request. This often reduces movement compared with FCFS but may starve distant requests if nearby ones continually arrive. It does not account for every rotational or controller cost unless the model is extended.', // Explain tradeoffs and scope.
        example: 'Start at 50 with pending requests 10, 45, 90. SSTF chooses 45 first, then 10, then 90 because distances are recalculated after reaching 45. Total movement is 5 + 35 + 80 = 120 cylinders.', // Work a trace.
        misconception: 'SSTF guarantees every distant request is served within a fixed number of arrivals regardless of workload.', // Highlight starvation.
        appliedQuestion: 'An HDD head is at 50 with pending requests 10, 45, and 90. Which does SSTF choose first?', // Test nearest selection.
        appliedAnswer: '45, which is only five cylinders away.', // Select the closest.
        appliedWrong: '90, because SSTF always prefers the highest cylinder number.', // Offer wrong ordering.
        hardQuestion: 'Construct a scenario in which SSTF starves a request.', // Ask for liveness reasoning.
        hardAnswer: 'Place an old request far from the current head, then continuously introduce requests near the head before the nearby queue drains. Each new local request is preferred over the far request, so its wait can remain unbounded. Aging, deadlines, or a sweeping policy can provide better service guarantees.', // Explain a starvation construction.
        followUp: 'Does reduced total movement necessarily imply fair waiting times?', // Reinforce the policy tradeoff.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf', // Link to HDD policy analysis.
    }, // Finish SSTF.
    { // Explain bidirectional elevator-style head movement.
        title: 'SCAN', // Name the elevator algorithm.
        module: 'File Systems and Disk Management', // Group disk policies.
        definition: 'SCAN services requests while moving in one direction toward a disk endpoint, then reverses and services requests in the opposite direction.', // Define the textbook policy.
        mechanism: 'A direction must be specified before computing order or movement. Classical SCAN goes to the physical endpoint before reversal; LOOK reverses at the last pending request instead. Sweeping reduces the chance that new nearby requests indefinitely prevent progress toward farther positions.', // Distinguish SCAN and LOOK.
        example: 'Cylinders range 0–199, the head is at 50 and moving upward, and requests are 20, 70, 150. SCAN services 70 and 150, continues to 199, then reverses toward 20. Counting movement through the last request gives 149 + 179 = 328 cylinders.', // Give endpoints and direction explicitly.
        misconception: 'SCAN and LOOK always move identically because both necessarily reverse at the last pending request rather than the endpoint.', // Correct the variant distinction.
        appliedQuestion: 'In classical SCAN, moving upward with no more requests before endpoint 199, where does the head reverse?', // Ask the defining behavior.
        appliedAnswer: 'At the physical endpoint 199, under the classical SCAN definition.', // State endpoint reversal.
        appliedWrong: 'Always at the last pending request, which is specifically LOOK behavior.', // Contrast the variant.
        hardQuestion: 'Why must a SCAN numerical problem specify the initial direction and cylinder range?', // Ask about well-defined calculations.
        hardAnswer: 'Direction determines which requests are encountered before reversal, and the physical endpoint determines how far classical SCAN travels before turning. Without both, request order and total movement are underdetermined. Also state whether movement is counted only through the last serviced request or for a complete sweep.', // Explain necessary assumptions.
        followUp: 'How would LOOK change the worked example’s movement?', // Extend to the optimized variant.
        resource: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf', // Link to disk scheduling background.
    }, // Finish SCAN.
    { // Explain unidirectional servicing with a circular return.
        title: 'C-SCAN', // Name Circular SCAN.
        module: 'File Systems and Disk Management', // Complete the required storage algorithms.
        definition: 'Circular SCAN services requests in one direction, reaches an endpoint, returns to the other endpoint without servicing on the return, and resumes the same service direction.', // Define the circular sweep.
        mechanism: 'Treating cylinders as a circular service order can make waiting behavior more uniform than bidirectional SCAN. The physical return still costs movement on an HDD even though no requests are served during it. C-LOOK wraps between extreme pending requests instead of physical endpoints.', // Explain cost and the related variant.
        example: 'Cylinders are 0–199, head 50 moving upward, requests 20, 70, 150. Service 70 and 150, move to 199, return to 0, then service 20. Through the last request, total movement is 149 + 199 + 20 = 368 cylinders.', // Provide a complete counted trace.
        misconception: 'The circular return from the highest cylinder to zero is physically free on an HDD because no requests are served during it.', // Correct movement accounting.
        appliedQuestion: 'Does an HDD C-SCAN calculation normally count the endpoint-to-endpoint return movement?', // Ask about the wrap cost.
        appliedAnswer: 'Yes, when total physical head movement is requested; the unserviced return still moves the head.', // State the physical cost.
        appliedWrong: 'No; an unserviced return teleports the mechanical head with zero distance.', // Offer an impossible wrap.
        hardQuestion: 'Compare SCAN and C-SCAN in service direction, waiting behavior, and return cost.', // Ask for a complete comparison.
        hardAnswer: 'SCAN services in both directions and reverses at endpoints; C-SCAN services in one direction and makes an unserviced wrap back. Circular service can reduce position-dependent differences in waiting, but the return still adds mechanical travel. Neither is universally faster, and results depend on arrivals, endpoints, direction, and the metric used.', // Explain tradeoffs without absolute claims.
        followUp: 'How does C-LOOK avoid some endpoint travel?', // Connect the related policy.
        resource: 'https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/10_MassStorage.html', // Link to university storage-scheduling notes.
    }, // Finish C-SCAN.
]; // Finish the full Operating Systems curriculum.
const hardQuizSeeds: HardQuizSeed[] = [ // Add objectively graded Hard scenarios without removing descriptive interview questions.
    { // Test why a signaled condition is not a reserved resource.
        topicTitle: 'Monitors and Locks', // Attach this scenario to condition-variable coordination.
        prompt: 'Two consumers wait for a nonempty queue. One item is inserted and a waiting consumer is signaled, but another consumer removes it first. What must the awakened consumer do after reacquiring the lock?', // Describe a valid competing-consumer interleaving.
        options: ['Remove an item without checking because a signal permanently reserves one for that thread.', 'Recheck the queue predicate in a loop and wait again if the queue is empty.', 'Skip reacquiring the lock because a signal makes every later access atomic.'], // Contrast predicate-based and notification-based reasoning.
        answer: 'Recheck the queue predicate in a loop and wait again if the queue is empty.', // Choose the correct monitor pattern.
        explanation: 'A notification says the condition may have changed; it is not an ownership transfer of an item. Another consumer can run before the awakened thread reacquires the lock. Checking while (queue.empty()) under the associated lock handles this race and spurious wakeups.', // Explain why a while loop is necessary even without a spurious notification.
        hint: 'The signaled thread still has to compete to reacquire the lock.', // Focus the critical timing gap.
    }, // Finish the monitor Hard MCQ.
    { // Test correct resource accounting in a tentative Banker grant.
        topicTitle: "Banker's Algorithm", // Attach the safety scenario.
        prompt: 'One resource type has Available=1. P1 holds 1 and still needs 1; P2 holds 2 and still needs 2. If the available unit is tentatively granted to P2, what does the safety test conclude?', // Provide a complete single-resource state.
        options: ['Safe, because P2 now holds three units even though it still needs one.', 'Unsafe, because Available becomes 0 while both P1 and P2 still need 1 and neither can finish.', 'Already permanently deadlocked in every possible real execution, which is the exact definition of unsafe.'], // Distinguish safety, allocation count, and actual deadlock.
        answer: 'Unsafe, because Available becomes 0 while both P1 and P2 still need 1 and neither can finish.', // Apply the Need <= Work check.
        explanation: 'The tentative grant changes P2’s allocation from 2 to 3 and remaining need from 2 to 1, while Work becomes 0. P1 and P2 both need one more unit, so neither can be simulated as completing. Reject the grant to preserve the original safe sequence P1, then P2; unsafe is not synonymous with already deadlocked.', // Work through the tentative state.
        hint: 'Update Available, Allocation, and remaining Need together before searching for a process that can complete.', // Identify the required accounting.
    }, // Finish the Banker Hard MCQ.
    { // Test a TLB miss versus a resident-page fault.
        topicTitle: 'TLB', // Attach the translation-cache scenario.
        prompt: 'After a TLB flush, an access misses the TLB. Its page-table entry is present, writable, and points to a resident frame. Under this model, what is needed for an ordinary permitted write?', // Specify permissions and residency.
        options: ['A translation refill or page-table walk, without a demand-page disk read.', 'A compulsory disk read because every translation-cache miss means the page is absent.', 'Allocation of a new virtual address space because a TLB can never be refilled.'], // Separate cached metadata from page residency.
        answer: 'A translation refill or page-table walk, without a demand-page disk read.', // Select the valid translation path.
        explanation: 'The page is already resident and the access is permitted. The missing cached translation can be reconstructed from the page tables. Whether refill is hardware- or software-managed depends on architecture, but a TLB miss by itself does not imply storage I/O.', // Explain architecture-independent essentials.
        hint: 'A TLB caches translations, while residency is represented by the mapping and frame state.', // Distinguish the two layers.
    }, // Finish the TLB Hard MCQ.
    { // Test exact LRU ordering after a hit and subsequent replacements.
        topicTitle: 'LRU', // Attach the reference-trace scenario.
        prompt: 'Three frames start empty. Exact LRU processes A, B, C, A, D, B. Which resident page is evicted on the final reference to B?', // Provide the full reference sequence.
        options: ['A, because it was the earliest page initially loaded.', 'C, because after D replaces B the recency order is C, A, D from oldest to newest.', 'D, because the most recently loaded page is always the LRU victim.'], // Contrast arrival, recency, and newest-first behavior.
        answer: 'C, because after D replaces B the recency order is C, A, D from oldest to newest.', // Select the least recently used resident page.
        explanation: 'After A, B, C the order is A, B, C. The hit on A changes it to B, C, A. D evicts B and leaves C, A, D. The final B faults and evicts C, the oldest last-reference among those residents.', // Work through every recency update.
        hint: 'Move a page to newest on a hit, not only when it is initially loaded.', // Highlight the distinguishing operation.
    }, // Finish the LRU Hard MCQ.
    { // Test the limits of cycle detection with multiple instances.
        topicTitle: 'Four Necessary Conditions', // Attach the deadlock-model scenario.
        prompt: 'A resource-allocation graph contains a cycle, but at least one resource type has multiple instances. Which conclusion is justified from the cycle alone?', // State the model limitation.
        options: ['The cycle always proves every process in the system is deadlocked.', 'The cycle rules out all deadlock because multiple instances make waiting impossible.', 'Deadlock is possible, but allocation and availability must be analyzed before concluding an actual deadlock.'], // Distinguish necessary evidence from sufficient proof.
        answer: 'Deadlock is possible, but allocation and availability must be analyzed before concluding an actual deadlock.', // State the correct limited inference.
        explanation: 'With single-instance resource types, a resource-allocation cycle can establish deadlock. Multiple instances may permit another holder outside the cycle to finish and release a unit, breaking the wait. A cycle remains important evidence, but the full allocation-and-availability state matters.', // Explain how an available completion can resolve a cycle.
        hint: 'Consider whether another instance can become available from a process that is not stuck in the cycle.', // Supply the reasoning direction.
    }, // Finish the deadlock Hard MCQ.
]; // Finish the selected OS Hard quiz records.
export const osTopics: Topic[] = withHardQuiz(makeLessons('os', seeds), hardQuizSeeds); // Export all structured OS lessons and representative objectively graded Hard practice.
