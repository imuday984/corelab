// server/db.ts
var row = async (db, sql, ...values) => db.prepare(sql).bind(...values).first();
var rows = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).all()).results;
var write = (db, sql, ...values) => db.prepare(sql).bind(...values).run();

// server/security.ts
var encoder = new TextEncoder();
var hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
var unhex = (value) => Uint8Array.from(value.match(/.{2}/g) || [], (byte) => parseInt(byte, 16));
var token = () => hex(crypto.getRandomValues(new Uint8Array(32)));
var digest = async (value) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
async function hashPassword(password, salt = token()) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const result = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unhex(salt), iterations: 1e5, hash: "SHA-256" }, material, 256);
  return `pbkdf2-sha256$100000$${salt}$${hex(new Uint8Array(result))}`;
}
async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256" || parts[1] !== "100000") return false;
  const candidate = await hashPassword(password, parts[2]);
  const a = encoder.encode(candidate);
  const b = encoder.encode(stored);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index] || 0) ^ (b[index] || 0);
  return difference === 0;
}
function sessionCookie(value, request, clear = false) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `cs_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 60 * 60 * 24 * 30}${secure}`;
}
function readSession(request) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("cs_session="))?.slice(11) || null;
}

// content/oop-os-helper.ts
function makeLessons(subjectId, seeds3) {
  return seeds3.map((seed) => {
    const slug = seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const moduleSlug = seed.module.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id2 = `${subjectId}-${moduleSlug}-${slug}`;
    const basicOptions = [seed.definition, seed.misconception];
    const appliedOptions = [seed.appliedWrong, seed.appliedAnswer];
    return {
      // Assemble the lesson expected by the learning page.
      id: id2,
      // Connect checkpoints and learner progress to this lesson.
      title: seed.title,
      // Render the curriculum title without abbreviating it.
      subjectId,
      // Associate the lesson with Object-Oriented Programming or Operating Systems.
      module: seed.module,
      // Place the lesson under its authored module heading.
      minutes: seed.module === "Core Concepts" ? 5 : 7,
      // Give a modest reading estimate for the concise reference material.
      difficulty: seed.module === "Core Concepts" || seed.module === "Process Management" ? "Easy" : "Medium",
      // Suggest a starting level without locking any practice.
      overview: seed.definition,
      // Introduce the concept before its details.
      sections: [
        // Organize the lesson into focused blocks.
        { title: "How it works", body: seed.mechanism },
        // Explain the implementation or conceptual mechanism.
        { title: "A practical application", body: seed.example },
        // Connect the mechanism to a concrete example.
        { title: "A common misconception", body: `Misconception: ${seed.misconception}

Correction: ${seed.definition}` }
        // Explicitly distinguish the misleading statement from the correct concept.
      ],
      // Finish the structured explanation.
      example: seed.example,
      // Make the worked example available in the dedicated example panel.
      interview: [{ question: seed.hardQuestion, answer: seed.hardAnswer, followUp: seed.followUp }],
      // Provide a complete expandable interview answer.
      revision: [seed.definition, seed.appliedAnswer, seed.hardAnswer],
      // Preserve the most useful points for focused revision.
      resources: [{ title: "Independent reference and further reading", url: seed.resource }],
      // Encourage checking the explanation against established documentation.
      questions: [
        // Keep all difficulty levels immediately accessible.
        { id: `${id2}-easy`, difficulty: "Easy", type: "mcq", prompt: `Which statement correctly explains ${seed.title}?`, options: basicOptions, answer: seed.definition, explanation: seed.mechanism, hint: "Compare the definition with the misconception discussed in the lesson." },
        // Check the specific concept rather than whether the page was opened.
        { id: `${id2}-medium`, difficulty: "Medium", type: "mcq", prompt: seed.appliedQuestion, options: appliedOptions, answer: seed.appliedAnswer, explanation: seed.example, hint: seed.definition },
        // Test the authored practical scenario with an objectively scored answer.
        { id: `${id2}-hard`, difficulty: "Hard", type: "descriptive", prompt: seed.hardQuestion, answer: seed.hardAnswer, explanation: seed.hardAnswer, hint: seed.followUp }
        // Require an explicit comparison with the reference answer instead of automatically accepting prose.
      ],
      // Finish this lesson's checkpoint collection.
      ...seed.diagram ? { diagram: seed.diagram } : {}
      // Include a visual sequence only where it explains the topic.
    };
  });
}
function withHardQuiz(topics2, extraQuestions) {
  return topics2.map((topic) => {
    const extra = extraQuestions.find((question2) => question2.topicTitle === topic.title);
    if (!extra) return topic;
    const question = {
      // Build a checkpoint using the same contract as existing questions.
      id: `${topic.id}-hard-mcq`,
      // Avoid colliding with the existing descriptive Hard checkpoint.
      difficulty: "Hard",
      // Make the checkpoint available to filtered Hard quizzes.
      type: "mcq",
      // Enable objective grading on the server.
      prompt: extra.prompt,
      // Present the specific reasoning scenario.
      options: extra.options,
      // Render the authored choices.
      answer: extra.answer,
      // Match exactly one authored choice during scoring.
      explanation: extra.explanation,
      // Explain the conclusion after submission.
      hint: extra.hint
      // Support learning before grading.
    };
    return { ...topic, questions: [...topic.questions, question] };
  });
}

// content/oop.ts
var reference = "https://docs.oracle.com/javase/tutorial/java/concepts/";
var designReference = "https://refactoring.guru/design-patterns";
var seeds = [
  // Keep one self-contained, named record for every required concept.
  {
    // Introduce the relationship between a class declaration and a runtime instance.
    title: "Classes and Objects",
    // Name this core concept.
    module: "Core Concepts",
    // Place it at the start of the OOP curriculum.
    definition: "A class defines a type with state and behavior; an object is a runtime instance with its own identity and instance state.",
    // Define the concept precisely.
    mechanism: "Instance fields belong to an object, while static members belong to the class. A constructor establishes valid initial state. Two objects may have equal field values while remaining distinct objects, so identity and value equality must be considered separately.",
    // Explain ownership, construction, and identity.
    example: "A BankAccount class declares a balance and deposit(amount). Creating alice = new BankAccount() and bob = new BankAccount() creates two independent balances. Calling alice.deposit(50) should not change bob.balance.",
    // Supply a concrete, editable example.
    misconception: "Creating two instances of a class always makes their instance fields share the same storage.",
    // Provide a topic-specific misconception.
    appliedQuestion: "Two BankAccount objects start with a zero instance balance. Depositing 50 into the first should produce which balances?",
    // Test understanding through state changes.
    appliedAnswer: "The first balance becomes 50 and the second remains zero.",
    // Identify the correct behavior.
    appliedWrong: "Both balances become 50 because the class definition is shared.",
    // Offer a plausible state-sharing error.
    hardQuestion: "When should a bank account use value equality, and when should identity be compared?",
    // Ask a realistic interview question.
    hardAnswer: "Use identity to decide whether two references denote the exact same in-memory account object. Use a carefully defined value or domain identity comparison, usually a stable account identifier, to recognize the same persisted account across separate objects. Comparing mutable balance fields alone is unsafe because unrelated accounts can have identical balances.",
    // Provide a concise answer with its reasoning.
    followUp: "What changes if the balance field is declared static?",
    // Invite a deeper ownership discussion.
    resource: reference
    // Link to the independent conceptual reference.
  },
  // Finish the classes and objects lesson.
  {
    // Explain protecting representation behind valid operations.
    title: "Encapsulation",
    // Name the concept.
    module: "Core Concepts",
    // Group it with the foundational OOP principles.
    definition: "Encapsulation groups state with its operations and controls access so an object can preserve its invariants.",
    // Define the principle without equating it with getters alone.
    mechanism: "A private field prevents arbitrary external writes, but a public setter that accepts every value can still break the invariant. Good APIs expose meaningful operations, validate transitions, and avoid leaking mutable internal collections.",
    // Explain how invariants are enforced.
    example: "A Wallet keeps balance private and exposes withdraw(amount), which rejects negative amounts and insufficient funds. Returning a copy or read-only view of its transactions prevents callers from editing internal history.",
    // Demonstrate effective encapsulation.
    misconception: "Adding an unrestricted setter for every private field automatically preserves all object invariants.",
    // Identify a common superficial implementation.
    appliedQuestion: "A private balance has a setter that accepts negative amounts. What should improve the design?",
    // Test applied API judgment.
    appliedAnswer: "Expose validated deposit and withdraw operations and reject invalid transitions.",
    // State the safe operation-based design.
    appliedWrong: "Make balance public so every caller can enforce the rules independently.",
    // Show the representation leak.
    hardQuestion: "Why can returning a private List directly violate encapsulation?",
    // Ask about indirect mutation.
    hardAnswer: "Private access controls the field reference, not the referenced object. A caller can mutate the returned list and bypass validation. Return an immutable snapshot, an unmodifiable view with clearly documented live behavior, or narrowly scoped query methods. Consider whether contained elements are themselves mutable.",
    // Explain shallow and transitive exposure.
    followUp: "How does an immutable snapshot differ from an unmodifiable live view?",
    // Extend the discussion.
    resource: reference
    // Provide authoritative background reading.
  },
  // Finish the encapsulation lesson.
  {
    // Explain specialization through a subtype relation.
    title: "Inheritance",
    // Name the concept.
    module: "Core Concepts",
    // Keep the fundamental mechanisms together.
    definition: "Inheritance allows a derived type to reuse or specialize a base type while supporting a meaningful is-a relationship.",
    // Define inheritance and its intent.
    mechanism: "A subclass inherits accessible behavior and can override designated methods. Constructors and private members follow language-specific rules. Inheritance couples the subclass to the base contract, so composition is often better when the relationship is merely uses-a.",
    // Explain extension and coupling.
    example: "A SavingsAccount can extend Account when every supported operation still respects the Account contract. A Car should generally contain an Engine rather than extend Engine, because a car is not an engine.",
    // Give a suitable and unsuitable relation.
    misconception: "Inheritance should be used whenever two classes happen to contain similar fields.",
    // Distinguish reuse from valid subtyping.
    appliedQuestion: "Should a Car extend Engine merely to reuse start()?",
    // Ask a concrete modeling question.
    appliedAnswer: "Usually no; Car should hold an Engine and delegate because the relationship is has-a.",
    // Recommend composition for the example.
    appliedWrong: "Yes; any opportunity to reuse one method justifies an is-a relationship.",
    // Offer the common misuse.
    hardQuestion: "How can changing a base class silently break an otherwise unchanged subclass?",
    // Examine fragile base classes.
    hardAnswer: "A base class can change the order in which overridable methods are called or introduce a new call to an overridable method. The subclass may rely on old call sequences or partially initialized state. Favor stable contracts, avoid calling overridable methods during construction, and use composition when independent evolution matters.",
    // Explain behavioral coupling.
    followUp: "What does the Liskov substitution principle require of an override?",
    // Connect to the advanced principle.
    resource: reference
    // Link to the official tutorial.
  },
  // Finish the inheritance lesson.
  {
    // Distinguish common inheritance graph shapes.
    title: "Types of Inheritance",
    // Name the taxonomy.
    module: "Core Concepts",
    // Group the language fundamentals.
    definition: "Single, multilevel, hierarchical, multiple, and hybrid inheritance describe the shape of relationships between base and derived types.",
    // Define the categories.
    mechanism: "Single inheritance has one direct base; multilevel inheritance forms a chain; hierarchical inheritance has several children of one base. Multiple inheritance has several direct bases and may create ambiguity. Java permits one class superclass but multiple interfaces; C++ supports multiple class inheritance.",
    // Explain language-specific support.
    example: "Animal \u2192 Mammal \u2192 Dog is multilevel. Animal \u2192 Dog and Animal \u2192 Cat is hierarchical. A C++ class implementing both Printer and Scanner behavior is a multiple-inheritance example when both are class bases.",
    // Provide distinct graph examples.
    misconception: "Java classes can directly extend any number of concrete superclass types.",
    // Address a specific language misconception.
    appliedQuestion: "Animal has subclasses Dog and Cat. Which inheritance shape is present?",
    // Test classification.
    appliedAnswer: "Hierarchical inheritance, because multiple derived types share one base.",
    // Name the correct shape.
    appliedWrong: "Multilevel inheritance, because Dog and Cat both exist.",
    // Contrast sibling and chain structures.
    hardQuestion: "Why do languages often allow multiple interface inheritance while restricting multiple class inheritance?",
    // Examine design tradeoffs.
    hardAnswer: "Interfaces typically separate behavioral contracts from mutable instance representation. Multiple class bases can introduce duplicate base state, conflicting implementations, and complicated initialization. Interfaces reduce these concerns, although default methods can still create implementation conflicts requiring explicit resolution.",
    // Explain state and ambiguity.
    followUp: "How does C++ virtual inheritance address duplicate base subobjects?",
    // Connect the taxonomy to the diamond problem.
    resource: "https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html"
    // Link to the language documentation.
  },
  // Finish the inheritance taxonomy lesson.
  {
    // Explain using one contract with different implementations.
    title: "Polymorphism",
    // Name the OOP principle.
    module: "Core Concepts",
    // Group it with the four core principles.
    definition: "Polymorphism lets code use a common interface while different concrete values provide type-appropriate behavior.",
    // Define the abstraction.
    mechanism: "Subtype polymorphism dispatches overridden operations according to an object\u2019s runtime type. Parametric polymorphism uses type parameters such as List<T>. Overloading is often called ad-hoc polymorphism because the compiler selects among differently typed operations.",
    // Distinguish important forms.
    example: "A list of Shape references can contain Circle and Rectangle objects. Calling area() through each Shape reference executes the corresponding implementation without an if-chain over concrete shape types.",
    // Show interface-based behavior.
    misconception: "Polymorphism requires checking every concrete object type with an if statement before calling its operation.",
    // Identify a brittle alternative.
    appliedQuestion: "How can a drawing program add Triangle without editing a switch over every shape?",
    // Ask about extensibility.
    appliedAnswer: "Program against Shape and let Triangle implement the shared drawing operation.",
    // Use the contract.
    appliedWrong: "Require every caller to inspect the runtime class and manually choose a drawing formula.",
    // Show the alternative coupling.
    hardQuestion: "What is the difference between subtype and parametric polymorphism?",
    // Ask for conceptual depth.
    hardAnswer: "Subtype polymorphism chooses behavior through a shared type contract and concrete implementations, such as Shape.area(). Parametric polymorphism writes an algorithm independently of a concrete type, such as List<T>. They can coexist: a generic collection may hold values implementing a common interface.",
    // Compare the mechanisms.
    followUp: "Which parts of a generic program still need type constraints?",
    // Extend into constrained generics.
    resource: "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html"
    // Link to Oracle's polymorphism discussion.
  },
  // Finish the polymorphism lesson.
  {
    // Compare compiler selection with virtual dispatch.
    title: "Compile-time vs Runtime Polymorphism",
    // Name the comparison.
    module: "Core Concepts",
    // Place it after the broad principle.
    definition: "Compile-time polymorphism resolves an operation using static type information; runtime subtype polymorphism dispatches an override using the actual object type.",
    // Define both mechanisms.
    mechanism: "For overloaded methods, argument types visible to the compiler select the signature. For a selected virtual instance method, runtime dispatch can then choose an override. Java static methods are hidden rather than overridden; C++ requires virtual for dynamic dispatch through a base.",
    // Explain the two-stage selection.
    example: "If Animal a = new Dog(), an overloaded visit(Animal) is selected over visit(Dog) when the argument expression is a. Calling a.speak() can still execute Dog.speak() when speak is overridden.",
    // Demonstrate the difference precisely.
    misconception: "An overloaded method is always chosen from the runtime type of its arguments.",
    // Address overload resolution.
    appliedQuestion: "For Animal a = new Dog(), which visit overload is chosen when visit(Animal) and visit(Dog) both exist?",
    // Ask a concrete resolution question.
    appliedAnswer: "visit(Animal), because overload resolution uses the static type of the expression a.",
    // Explain the compiler decision.
    appliedWrong: "visit(Dog), because all overloaded calls dynamically inspect argument objects.",
    // Supply the misconception.
    hardQuestion: "Can one method call involve both overload resolution and runtime overriding?",
    // Ask about the combined process.
    hardAnswer: "Yes. The compiler first chooses an accessible overload using static argument and receiver types. If that selected instance method supports virtual dispatch, runtime lookup chooses the overriding implementation on the receiver object. Dynamic dispatch does not rerun overload selection using argument runtime types.",
    // Separate signature selection from implementation selection.
    followUp: "How would static methods change the example in Java?",
    // Invite the hiding distinction.
    resource: "https://docs.oracle.com/javase/tutorial/java/IandI/override.html"
    // Provide an independent reference.
  },
  // Finish the dispatch comparison lesson.
  {
    // Explain exposing essential behavior while hiding detail.
    title: "Abstraction",
    // Name the principle.
    module: "Core Concepts",
    // Group the fundamental design ideas.
    definition: "Abstraction presents the essential contract of a concept while hiding implementation details that callers do not need.",
    // Define what callers depend on.
    mechanism: "A good abstraction specifies observable behavior, preconditions, postconditions, and meaningful failures. Interfaces and abstract classes can express it, but a poor contract remains leaky even when implemented with an interface keyword.",
    // Explain semantic contracts.
    example: "A PaymentGateway exposes charge(amount, token) and a documented result. The application does not depend on the provider\u2019s HTTP retry loop, encryption implementation, or connection pool.",
    // Use a practical service boundary.
    misconception: "Using an abstract keyword automatically creates a clear and stable abstraction.",
    // Separate syntax from design.
    appliedQuestion: "Which detail should a PaymentGateway caller generally depend on?",
    // Test boundary selection.
    appliedAnswer: "The charge contract and documented success or failure result.",
    // Keep the essential interface.
    appliedWrong: "The provider\u2019s private connection-pool implementation and retry-loop variables.",
    // Show accidental implementation coupling.
    hardQuestion: "How does abstraction differ from encapsulation?",
    // Ask the frequent interview comparison.
    hardAnswer: "Abstraction chooses the useful external model and contract; encapsulation controls access to representation and enforces invariants. A collection interface is an abstraction. Keeping its backing array private and validating updates is encapsulation. They reinforce each other but describe different design concerns.",
    // State both roles and one example.
    followUp: "Give an example of an abstraction that leaks implementation details.",
    // Encourage concrete reasoning.
    resource: reference
    // Link to the foundational tutorial.
  },
  // Finish the abstraction lesson.
  {
    // Compare interface contracts with shared abstract implementation.
    title: "Abstract Class vs Interface",
    // Name the comparison.
    module: "Core Concepts",
    // Group the language fundamentals.
    definition: "An abstract class can share instance state and implementation; an interface primarily defines a role that otherwise unrelated types can implement.",
    // State the design distinction.
    mechanism: "Java abstract classes may have constructors, instance fields, and nonpublic methods. Interfaces can include abstract, default, static, and private helper methods in modern Java, but no mutable per-instance fields. A class can implement several interfaces while extending only one class.",
    // Explain current Java capabilities.
    example: "AbstractDocument can centralize document state and save logic. Printable is a separate capability implemented by Document and ShippingLabel, even when those classes do not share a useful superclass.",
    // Demonstrate state versus capability.
    misconception: "Modern Java interfaces can contain only abstract methods and can never include implementation.",
    // Correct an outdated claim.
    appliedQuestion: "Unrelated classes need a common Printable capability but different state models. Which is usually a good fit?",
    // Test modeling judgment.
    appliedAnswer: "An interface, because the shared requirement is a role rather than common instance representation.",
    // Choose a capability contract.
    appliedWrong: "Force all classes into a shared concrete hierarchy even if their state models conflict.",
    // Offer unnecessary inheritance.
    hardQuestion: "When would you prefer an abstract class over an interface?",
    // Ask about the tradeoff.
    hardAnswer: "Choose an abstract class when closely related subclasses need shared instance state, construction rules, or a controlled template implementation. Prefer an interface for a public capability implemented by unrelated types or when multiple roles are needed. Consider binary evolution, default-method conflicts, and the cost of consuming the single superclass slot.",
    // Balance several constraints.
    followUp: "How are conflicting interface default methods resolved?",
    // Explore the remaining ambiguity.
    resource: "https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html"
    // Link to the language reference.
  },
  // Finish the abstract class and interface comparison.
  {
    // Distinguish method signatures from overridden contracts.
    title: "Method Overloading vs Overriding",
    // Name the comparison.
    module: "Core Concepts",
    // Group it with dispatch concepts.
    definition: "Overloading provides methods with the same name and different parameter lists; overriding replaces inherited virtual behavior with a compatible subclass implementation.",
    // Define each mechanism.
    mechanism: "Return type alone does not create a Java overload. An override must preserve the inherited signature, may use a covariant return type, and cannot reduce accessibility. Java checked exceptions in an override cannot be broadened beyond the inherited contract.",
    // Explain important validity rules.
    example: "print(String) and print(int) are overloads. Dog.speak() implementing Animal.speak() is an override. Writing speak(int volume) in Dog adds an overload rather than overriding speak().",
    // Give three unambiguous examples.
    misconception: "Changing only a Java method\u2019s return type creates a valid overload.",
    // Address a frequent compiler error.
    appliedQuestion: "Animal declares speak(). Dog adds speak(int volume). What did Dog add?",
    // Test signature reasoning.
    appliedAnswer: "An overload, because the parameter list differs from speak().",
    // Identify the new signature.
    appliedWrong: "An override, because any subclass method with the same name overrides its parent.",
    // Offer name-only reasoning.
    hardQuestion: "Why should an override not reduce visibility or strengthen caller preconditions?",
    // Ask about substitutability.
    hardAnswer: "Callers written against the base contract must remain valid when the object is replaced by a subtype. Reduced visibility breaks accessible calls at the type boundary, while stronger preconditions reject inputs promised by the base. Language rules enforce some structural constraints; behavioral substitutability still needs design and tests.",
    // Connect compiler rules and behavioral contracts.
    followUp: "What is a covariant return type?",
    // Extend the signature discussion.
    resource: "https://docs.oracle.com/javase/tutorial/java/IandI/override.html"
    // Link to overriding documentation.
  },
  // Finish the overloading and overriding lesson.
  {
    // Explain access boundaries in Java.
    title: "Access Modifiers",
    // Name the language feature.
    module: "Core Concepts",
    // Group basic representation controls.
    definition: "Access modifiers define which callers may reference a declaration; Java provides public, protected, package-private, and private member access.",
    // Enumerate the visibility levels.
    mechanism: "Public exposes an API broadly; package-private omits a keyword and restricts access to the package; private limits access to the declaring top-level nest. Protected adds subclass access with cross-package restrictions. Visibility does not make mutable objects thread-safe.",
    // Explain the rules and their limits.
    example: "Keep a class\u2019s mutable cache private, expose a public lookup method, and leave a helper used only by sibling package classes package-private. A public getter should still avoid exposing a mutable cache map.",
    // Show deliberate API boundaries.
    misconception: "A private field automatically becomes safe for concurrent mutation by multiple threads.",
    // Separate access control and synchronization.
    appliedQuestion: "A helper should be used only by classes in the same Java package. Which access level fits?",
    // Test the appropriate visibility.
    appliedAnswer: "Package-private access, declared by omitting an access modifier.",
    // Choose the least required visibility.
    appliedWrong: "Public access, because all helpers must be accessible from every package.",
    // Offer unnecessary exposure.
    hardQuestion: "Why should public API surface generally be kept small?",
    // Ask about maintainability.
    hardAnswer: "External callers can depend on each public contract, so changing or removing it becomes a compatibility concern. A smaller surface preserves freedom to change representation, centralizes invariant checks, and reduces accidental coupling. Public visibility is a design commitment, not a shortcut for making a compiler error disappear.",
    // Explain practical consequences.
    followUp: "How does protected access differ inside and outside the declaring package?",
    // Probe a precise edge case.
    resource: "https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html"
    // Link to official access-control guidance.
  },
  // Finish the access modifiers lesson.
  {
    // Compare compile-time and runtime method target binding.
    title: "Static vs Dynamic Binding",
    // Name the comparison.
    module: "Core Concepts",
    // Connect binding with earlier dispatch lessons.
    definition: "Static binding resolves a target without runtime subtype dispatch, while dynamic binding chooses an overriding implementation from the receiver\u2019s runtime type.",
    // Define the mechanisms.
    mechanism: "Java instance methods normally dispatch virtually unless excluded by the language rules; static methods are selected by the reference type and are hidden rather than overridden. In C++, nonvirtual calls bind statically, while virtual calls through a base can dispatch dynamically.",
    // Keep language differences explicit.
    example: "Base b = new Derived(); b.virtualOperation() can invoke Derived\u2019s override. A Java static Base.label() selected through a Base-typed expression remains Base.label(), which is why static methods should be called with the class name.",
    // Contrast the two behaviors.
    misconception: "Declaring a method static enables runtime overriding through subclass instances.",
    // Correct the terminology.
    appliedQuestion: "A C++ base pointer refers to a Derived object, but show() is not virtual. Which method is selected by ptr->show()?",
    // Ask a precise C++ question.
    appliedAnswer: "The base implementation selected from the pointer\u2019s static type.",
    // Apply the nonvirtual rule.
    appliedWrong: "The derived implementation merely because the object was allocated as Derived.",
    // Offer runtime-type-only reasoning.
    hardQuestion: "Does virtual dispatch always imply an actual indirect call at runtime?",
    // Ask an optimization-aware question.
    hardAnswer: "No. The language defines observable dispatch behavior, but a compiler may devirtualize a call when it can prove the concrete target and preserve semantics. Final classes, whole-program analysis, and runtime profiling can help. Optimization does not change which implementation the program is required to behave as if it invoked.",
    // Distinguish semantics and optimization.
    followUp: "Why does marking a class final sometimes help optimization?",
    // Extend the proof discussion.
    resource: "https://en.cppreference.com/w/cpp/language/virtual.html"
    // Link to a well-established language reference.
  },
  // Finish the binding lesson.
  {
    // Explain aliasing in copied object graphs.
    title: "Deep Copy vs Shallow Copy",
    // Name the comparison.
    module: "Core Concepts",
    // Group the state and identity concepts.
    definition: "A shallow copy duplicates the outer object but shares referenced nested objects; a deep copy recursively duplicates the relevant mutable object graph.",
    // Define both strategies.
    mechanism: "Copy depth must follow ownership semantics. Deep copying must handle shared subgraphs and cycles, often with an identity map. Immutable values can usually be shared. External resources such as sockets do not have a generally meaningful automatic deep copy.",
    // Explain graph and resource limits.
    example: "Copying a Person with an Address reference shallowly means both people reference the same Address. Updating the copied address changes the original view. A deep copy creates a distinct Address while safely sharing immutable strings.",
    // Demonstrate aliasing.
    misconception: "A shallow copy recursively creates independent versions of every nested mutable object.",
    // Identify the false assumption.
    appliedQuestion: "After a shallow copy of Person, changing copy.address.city also changes original.address.city. Why?",
    // Ask about the observed effect.
    appliedAnswer: "Both Person objects share the same nested Address reference.",
    // Identify aliasing.
    appliedWrong: "The copy operation independently duplicated Address and then synchronized the two cities.",
    // Offer an implausible copying model.
    hardQuestion: "How can a deep-copy algorithm correctly handle a cyclic graph?",
    // Ask an implementation question.
    hardAnswer: "Maintain a map from original object identities to their allocated copies. Allocate and register a copy before recursively copying its outgoing references. Reuse a registered copy when revisiting an object. This terminates cycles and preserves intentional sharing inside the copied graph.",
    // Describe the correct traversal.
    followUp: "When should an immutable nested object be shared rather than copied?",
    // Connect copy policy to immutability.
    resource: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#clone()"
    // Link to the clone contract.
  },
  // Finish the copying lesson.
  {
    // Introduce the five complementary design principles.
    title: "SOLID Principles",
    // Name the principle collection.
    module: "Advanced Concepts",
    // Begin the advanced design section.
    definition: "SOLID groups five object-oriented design principles for managing change: single responsibility, open-closed, Liskov substitution, interface segregation, and dependency inversion.",
    // Expand the acronym accurately.
    mechanism: "The principles address different sources of coupling. SRP groups code by reason to change; OCP supports extension; LSP preserves subtype contracts; ISP keeps client dependencies narrow; DIP points high-level policies toward abstractions. They are design heuristics and must be balanced against simplicity.",
    // Explain the role of each principle.
    example: "An order service depends on a Payment interface, keeps tax calculations separate from email delivery, and accepts new gateway implementations without changing order policy. Its gateway implementations honor the same error and charge semantics.",
    // Show several principles working together.
    misconception: "SOLID requires creating an interface and a class hierarchy for every function, even when no useful variation exists.",
    // Warn against mechanical abstraction.
    appliedQuestion: "A report generator mixes formatting, database queries, and email delivery. Which SOLID concern is most immediately visible?",
    // Ask about a concrete design smell.
    appliedAnswer: "Single responsibility: these concerns change for different reasons and can be separated.",
    // Identify the strongest match.
    appliedWrong: "Liskov substitution is necessarily broken even though no subtype contract exists.",
    // Avoid applying the wrong principle.
    hardQuestion: "Can applying SOLID too aggressively make a small program worse?",
    // Ask for engineering judgment.
    hardAnswer: "Yes. Speculative interfaces, indirection, and hierarchies add navigation and maintenance costs. Apply a principle when it resolves an observed change boundary, testability need, or contract problem. Prefer a simple design until variation or coupling justifies a new boundary, and evaluate the resulting design rather than counting interfaces.",
    // Describe a balanced approach.
    followUp: "Which recurring change in your project would justify extracting an interface?",
    // Ask for a practical example.
    resource: "https://web.archive.org/web/20241109020017/http://www.objectmentor.com/resources/articles/Principles_and_Patterns.pdf"
    // Provide the original principle discussion through an archive.
  },
  // Finish the SOLID overview.
  {
    // Explain grouping behavior by its reason to change.
    title: "Single Responsibility Principle",
    // Name SRP explicitly.
    module: "Advanced Concepts",
    // Group the SOLID principles together.
    definition: "The single responsibility principle says a module should have one reason to change, meaning responsibility to one coherent actor or policy area.",
    // Define the principle beyond function size.
    mechanism: "Responsibility is about change sources rather than the number of methods. Keep behavior that changes together cohesive and separate policies that evolve independently. Splitting every method into a new class can reduce cohesion rather than improve it.",
    // Explain a useful boundary.
    example: "A PayslipCalculator computes payroll rules, a PayslipRepository persists records, and a PayslipPrinter formats output. A layout change should not risk altering payroll calculations.",
    // Give a familiar separation.
    misconception: "Single responsibility means every class must contain exactly one method.",
    // Correct the common slogan.
    appliedQuestion: "Payroll legislation and PDF branding change independently. Should their implementations share one tightly coupled class?",
    // Ask about reasons to change.
    appliedAnswer: "Separate payroll policy from PDF presentation so each change has a focused boundary.",
    // Apply SRP.
    appliedWrong: "Keep them inseparable because both features mention payslips.",
    // Offer grouping by noun alone.
    hardQuestion: "How do you identify a reason to change before splitting a class?",
    // Ask how to apply SRP.
    hardAnswer: "Look at actors requesting changes, existing change history, domain boundaries, and whether edits repeatedly affect unrelated methods. Separate independently evolving policies while retaining cohesive data and behavior. A small class is not automatically single-responsibility, and a larger class can be cohesive.",
    // Ground the judgment in evidence.
    followUp: "What costs can excessive class splitting introduce?",
    // Encourage balanced design.
    resource: "https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html"
    // Link to the principle author's explanation.
  },
  // Finish the SRP lesson.
  {
    // Explain extension at stable variation points.
    title: "Open-Closed Principle",
    // Name OCP.
    module: "Advanced Concepts",
    // Group the SOLID principles together.
    definition: "The open-closed principle favors extending behavior through stable variation points rather than repeatedly modifying established policy code.",
    // State the principle in practical language.
    mechanism: "Interfaces, composition, strategies, and data-driven rules can isolate expected variation. No design can be closed against every possible change. Choose a boundary based on credible extension needs and keep fixes and contract evolution possible.",
    // Explain scope and mechanisms.
    example: "A shipping calculator consumes a ShippingStrategy. Adding a bicycle courier strategy extends available delivery pricing without editing the checkout workflow\u2019s decision tree.",
    // Demonstrate a variation point.
    misconception: "Open-closed means existing source code must never be edited, even to repair a defect.",
    // Correct an absolute interpretation.
    appliedQuestion: "New shipping methods repeatedly add branches to checkout(). What would improve extension?",
    // Ask about a concrete trigger.
    appliedAnswer: "Move shipping-specific pricing behind a strategy contract used by checkout.",
    // Isolate the variation.
    appliedWrong: "Add another shipping-specific branch to every caller whenever a method is added.",
    // Show repeated policy edits.
    hardQuestion: "How do you avoid overengineering while applying the open-closed principle?",
    // Ask about the tradeoff.
    hardAnswer: "Identify the axis that already varies, such as payment providers, and introduce a stable contract only there. Keep uncommon or speculative variations direct until evidence appears. Measure whether adding an implementation can be localized without weakening type contracts or spreading conditionals.",
    // State the evidence-based approach.
    followUp: "When is a data table simpler than a class hierarchy?",
    // Explore alternative extension mechanisms.
    resource: "https://refactoring.guru/design-patterns/strategy"
    // Link to a concrete implementation pattern.
  },
  // Finish the OCP lesson.
  {
    // Explain behavioral subtype compatibility.
    title: "Liskov Substitution Principle",
    // Name LSP.
    module: "Advanced Concepts",
    // Keep the SOLID principles adjacent.
    definition: "The Liskov substitution principle requires a subtype to preserve the observable promises of its base contract when used through that contract.",
    // Define behavioral substitutability.
    mechanism: "A subtype must not demand stronger preconditions or provide weaker postconditions. It must preserve invariants and relevant history constraints. Matching method signatures is necessary for many languages but not sufficient for behavioral substitution.",
    // Explain contract dimensions.
    example: "If a base collection contract promises add() succeeds for valid items, a ReadOnlyCollection subtype that throws for every add() violates that writable contract. Prefer a separate read-only interface rather than pretending unsupported mutation works.",
    // Give a precise contract failure.
    misconception: "Any subclass accepted by the compiler automatically satisfies behavioral substitutability.",
    // Separate type checking and semantics.
    appliedQuestion: "A base method accepts every nonnegative amount, but an override rejects amounts below 100. What changed?",
    // Test contract reasoning.
    appliedAnswer: "The override strengthened the precondition and can break callers relying on the base contract.",
    // Identify the violation.
    appliedWrong: "The override necessarily improves substitutability because it validates more strictly.",
    // Offer the validation misconception.
    hardQuestion: "Why can a mutable Square subtype of mutable Rectangle violate LSP?",
    // Ask the canonical scenario carefully.
    hardAnswer: "If Rectangle promises independently settable width and height, a Square override that forces both dimensions to change breaks that promise. A client setting width to 5 while expecting height to remain 4 can no longer reason from the Rectangle contract. Immutable shapes or interfaces exposing only area can avoid this particular conflict.",
    // Explain the required base promise and alternative.
    followUp: "Would immutable Square and Rectangle types have the same setter problem?",
    // Explore the role of mutability.
    resource: "https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf"
    // Link to the formal behavioral-subtyping paper.
  },
  // Finish the LSP lesson.
  {
    // Explain small contracts shaped by their clients.
    title: "Interface Segregation Principle",
    // Name ISP.
    module: "Advanced Concepts",
    // Group related principles.
    definition: "The interface segregation principle says clients should not depend on operations they do not use.",
    // Define the principle.
    mechanism: "Split broad interfaces into cohesive roles based on client needs. Implementations can support several roles, while each caller depends only on the capability it requires. This avoids meaningless methods and reduces the impact of unrelated interface changes.",
    // Describe the client-focused boundary.
    example: "Separate Printer.print(), Scanner.scan(), and Fax.send(). A basic printer implements Printer without throwing UnsupportedOperationException from scan() and fax methods it never supported.",
    // Demonstrate role interfaces.
    misconception: "Every device must implement one giant interface containing every operation any device might support.",
    // Show the broad-contract problem.
    appliedQuestion: "A simple printer is forced to implement scan() by throwing an exception. What design is preferable?",
    // Ask about the contract smell.
    appliedAnswer: "Separate printing and scanning interfaces and depend on only the required role.",
    // Apply ISP.
    appliedWrong: "Require callers to catch unsupported-operation errors from every interface method.",
    // Offer runtime detection of poor contracts.
    hardQuestion: "How is interface segregation different from simply making every interface tiny?",
    // Ask for nuance.
    hardAnswer: "Segregation follows coherent client roles rather than an arbitrary method limit. Two methods that clients consistently need together may belong in one interface. Excessive fragmentation can force callers to coordinate many pieces and obscure invariants, so cohesion and actual dependency patterns guide the split.",
    // Explain the practical criterion.
    followUp: "Can a class implement several role interfaces without violating SRP?",
    // Connect role and responsibility concepts.
    resource: "https://refactoring.guru/design-patterns/adapter"
    // Link to a relevant independent interface example.
  },
  // Finish the ISP lesson.
  {
    // Explain policy depending on abstractions rather than mechanisms.
    title: "Dependency Inversion Principle",
    // Name DIP.
    module: "Advanced Concepts",
    // Complete the SOLID group.
    definition: "Dependency inversion makes high-level policy and low-level details depend on abstractions rather than making policy depend directly on concrete mechanisms.",
    // Define dependency direction.
    mechanism: "The policy-facing interface expresses what the high-level module needs. A low-level adapter implements that contract. Dependency injection supplies a chosen implementation, but injection alone does not guarantee that a suitable abstraction or dependency direction exists.",
    // Distinguish inversion and injection.
    example: "OrderService accepts an OrderStore contract. A PostgreSQLOrderStore implements it, while tests inject an in-memory store. OrderService contains order policy without importing database-client classes.",
    // Show policy and adapter boundaries.
    misconception: "Passing a concrete database client through a constructor automatically guarantees dependency inversion.",
    // Correct injection-only thinking.
    appliedQuestion: "OrderService imports a vendor database driver and calls vendor-specific methods. How can policy be decoupled?",
    // Ask about a concrete dependency.
    appliedAnswer: "Define an OrderStore contract around policy needs and implement the vendor calls in an adapter.",
    // Apply inversion.
    appliedWrong: "Spread driver calls across more business classes so every class shares the dependency.",
    // Show increased coupling.
    hardQuestion: "What is the difference between dependency injection and dependency inversion?",
    // Ask the frequent comparison.
    hardAnswer: "Injection is a construction technique: dependencies are supplied from outside rather than created internally. Inversion is an architectural principle about source dependencies pointing toward abstractions and policy. You can inject a concrete low-level class without inverting the dependency, or invert a dependency using factories and other assembly mechanisms.",
    // Separate mechanism and principle.
    followUp: "Which module should own an interface that expresses business policy needs?",
    // Extend the architectural discussion.
    resource: "https://martinfowler.com/articles/injection.html"
    // Link to a detailed independent explanation.
  },
  // Finish the DIP lesson.
  {
    // Explain repeated-base ambiguity in multiple inheritance.
    title: "Diamond Problem",
    // Name the inheritance edge case.
    module: "Advanced Concepts",
    // Group advanced language mechanisms.
    definition: "The diamond problem occurs when two inheritance paths reach a common base, potentially duplicating its state or making member selection ambiguous.",
    // Define the graph problem.
    mechanism: "In C++, ordinary inheritance can create two Base subobjects through Left and Right. Virtual inheritance makes the common virtual base shared and the most-derived class initializes it. Java default-method conflicts require explicit resolution when neither inherited implementation is more specific.",
    // Explain both languages accurately.
    example: "TeachingAssistant inherits Student and Employee, both derived from Person. Without virtual inheritance in C++, the assistant may hold two separate Person subobjects and ambiguous Person fields.",
    // Give the diamond graph.
    misconception: "Multiple inheritance always produces exactly one shared copy of every common base automatically.",
    // Identify the unsafe assumption.
    appliedQuestion: "In C++, Left and Right both inherit Base normally, and Final inherits both. How many Base subobjects are normally present?",
    // Ask about duplicated representation.
    appliedAnswer: "Two Base subobjects, one through each nonvirtual inheritance path.",
    // State the usual layout semantics.
    appliedWrong: "Exactly one, because C++ always merges duplicate base classes.",
    // Offer automatic-merging confusion.
    hardQuestion: "Does virtual inheritance solve every ambiguity in a diamond hierarchy?",
    // Ask for the remaining tradeoff.
    hardAnswer: "No. It shares the virtual base subobject, addressing duplicate base representation. Conflicting overrides or names can still require an explicit final override or qualified access, and construction becomes more complex because the most-derived class initializes virtual bases. Composition may express the domain more clearly.",
    // Distinguish state duplication and behavior ambiguity.
    followUp: "Who initializes a C++ virtual base in a multilevel diamond?",
    // Probe construction ownership.
    resource: "https://en.cppreference.com/w/cpp/language/derived_class.html",
    // Link to the C++ inheritance reference.
    diagram: ["Person", "\u2199 Student    Employee \u2198", "TeachingAssistant reaches Person by two paths"]
    // Show the repeated-base shape compactly.
  },
  // Finish the diamond lesson.
  {
    // Explain one common implementation of dynamic dispatch.
    title: "Virtual Functions and Vtables",
    // Name the implementation concept.
    module: "Advanced Concepts",
    // Group advanced dispatch internals.
    definition: "Virtual functions support dynamic dispatch; many C++ implementations use per-class virtual tables and per-object virtual pointers to select overrides.",
    // Define the mechanism without promising a mandated layout.
    mechanism: "A virtual call commonly loads a function pointer through a vtable slot. The C++ standard specifies behavior rather than requiring this representation. Multiple inheritance can need pointer adjustments, and deleting a derived object through a base pointer requires an appropriate virtual destructor.",
    // Explain implementation and lifetime details.
    example: "Shape* s = new Circle(); s->area() dispatches to Circle::area() when Shape::area is virtual. If ownership deletes through Shape*, declare virtual ~Shape() so the full derived destruction chain is valid.",
    // Provide a practical lifetime example.
    misconception: "The C++ standard requires every object, including objects with no virtual methods, to contain exactly one vtable pointer.",
    // Correct overgeneralized layout claims.
    appliedQuestion: "A derived object will be deleted through a C++ base pointer. What should its polymorphic base normally declare?",
    // Test lifetime safety.
    appliedAnswer: "A virtual destructor so deletion invokes the correct derived destruction behavior.",
    // State the necessary design.
    appliedWrong: "Only a nonvirtual destructor, because virtual methods already make deletion universally safe.",
    // Offer a common lifetime mistake.
    hardQuestion: "Why should virtual dispatch from a constructor not be used to invoke fully derived behavior?",
    // Ask about object construction.
    hardAnswer: "During C++ base construction, the derived portion has not been initialized, and virtual dispatch resolves within the currently constructing class rather than a not-yet-constructed derived class. Other languages differ in dispatch semantics but still risk observing uninitialized derived state. Constructors should establish their own invariants without relying on overridable behavior.",
    // Explain language-specific behavior and general risk.
    followUp: "When can a compiler devirtualize a virtual call?",
    // Connect optimization knowledge.
    resource: "https://en.cppreference.com/w/cpp/language/virtual.html"
    // Link to the language reference.
  },
  // Finish the vtable lesson.
  {
    // Compare three strengths of object relationships.
    title: "Association vs Aggregation vs Composition",
    // Name the comparison.
    module: "Advanced Concepts",
    // Group object-modeling relationships.
    definition: "Association is a general relationship, aggregation is a weak whole-part relationship, and composition represents stronger ownership with a part\u2019s lifetime tied to its whole.",
    // Define the modeling distinction.
    mechanism: "These are domain and lifecycle semantics rather than automatic consequences of a field declaration. Aggregated parts can exist independently or be shared. Composed parts are conceptually owned by one whole, although a language may enforce or merely document that ownership.",
    // Explain semantics and enforcement.
    example: "A Teacher associated with Student does not own the student. A Team aggregates Players who can leave and join another team. An Order composes OrderLines that have no independent domain lifecycle outside that order.",
    // Provide distinct examples.
    misconception: "Any class field referencing another object automatically proves composition and exclusive ownership.",
    // Correct syntax-only classification.
    appliedQuestion: "Players continue to exist after their Team is dissolved. Which whole-part relationship best fits?",
    // Test lifetime reasoning.
    appliedAnswer: "Aggregation, because the parts have an independent lifecycle.",
    // Choose weak ownership.
    appliedWrong: "Composition, because dissolving a team must destroy every player.",
    // Offer a mismatched domain model.
    hardQuestion: "How can implementation choices enforce composition rather than merely document it?",
    // Ask about ownership implementation.
    hardAnswer: "Control construction and exposure of the part, prevent independent reassignment or sharing when the domain forbids it, and tie persistence or cleanup to the aggregate root. Unique ownership types can enforce some constraints in languages such as C++. Garbage collection alone handles memory reachability and does not establish domain ownership.",
    // Explain API, persistence, and memory distinctions.
    followUp: "How does domain lifetime differ from garbage-collection lifetime?",
    // Invite an important follow-up.
    resource: "https://www.uml-diagrams.org/association.html"
    // Link to a UML relationship reference.
  },
  // Finish the object-relationship lesson.
  {
    // Introduce patterns as named reusable design approaches.
    title: "Design Patterns",
    // Name the pattern overview.
    module: "Advanced Concepts",
    // Place it before specific patterns.
    definition: "A design pattern is a named, reusable approach to a recurring design problem, with a context, structure, and tradeoffs rather than a copy-paste implementation.",
    // Define patterns accurately.
    mechanism: "Creational patterns manage object construction, structural patterns compose interfaces and objects, and behavioral patterns organize communication and algorithms. Choose a pattern from the problem and constraints; applying more patterns does not necessarily improve a design.",
    // Explain the catalogue and decision process.
    example: "Use Strategy when pricing algorithms must vary independently, Adapter when integrating an incompatible provider interface, and Observer when several consumers respond to changes. Each addresses a different source of variation.",
    // Relate patterns to concrete needs.
    misconception: "A codebase is better simply because it uses the largest possible number of named patterns.",
    // Warn against pattern-driven complexity.
    appliedQuestion: "A third-party API exposes an incompatible method signature, but existing callers should keep their own interface. Which pattern fits?",
    // Ask a concrete selection question.
    appliedAnswer: "Adapter, because it translates between the existing and external interfaces.",
    // Match problem and pattern.
    appliedWrong: "Singleton, because interface mismatch is solved by allowing only one provider object.",
    // Contrast an unrelated pattern.
    hardQuestion: "What should be documented when introducing a design pattern?",
    // Ask about maintainable design.
    hardAnswer: "Document the concrete problem, the variation or coupling it addresses, the participating roles, and the costs introduced. Explain why a simpler direct implementation is insufficient. Pattern names help communication, but their domain-specific intent and lifecycle behavior remain essential.",
    // Explain reviewable rationale.
    followUp: "What evidence would justify removing a pattern later?",
    // Encourage evolution rather than dogma.
    resource: designReference
    // Link to the pattern catalogue.
  },
  // Finish the pattern overview.
  {
    // Explain controlled single-instance access and its costs.
    title: "Singleton",
    // Name the creational pattern.
    module: "Design Patterns",
    // Group the individual patterns.
    definition: "Singleton restricts a class to one instance within a defined scope and provides access to that instance.",
    // Specify that the scope matters.
    mechanism: "Initialization must be safe under concurrency. Lazy initialization needs language-appropriate synchronization; Java class initialization or an enum can provide safe construction. A singleton is still shared mutable state and does not automatically make its methods thread-safe.",
    // Explain construction and state risks.
    example: "A process-wide immutable configuration snapshot can be shared safely. A mutable singleton shopping cart would incorrectly mix unrelated users and make tests depend on global state.",
    // Show a reasonable and harmful use.
    misconception: "A singleton automatically makes every field and method thread-safe and creates one instance across all machines.",
    // Correct concurrency and distributed-scope claims.
    appliedQuestion: "Should a web application store every user\u2019s current cart in one mutable Singleton cart?",
    // Test user-state isolation.
    appliedAnswer: "No; carts must be scoped by user or session rather than one shared global cart.",
    // Explain the ownership boundary.
    appliedWrong: "Yes; a single global instance automatically isolates concurrent users.",
    // Offer the global-state mistake.
    hardQuestion: "Why is singleton often harder to test than an injected dependency?",
    // Ask about hidden coupling.
    hardAnswer: "Callers obtain a hidden global dependency, tests may share mutable state across runs, and replacement can require special reset hooks. Injecting a narrow interface makes ownership and lifetime explicit and permits independent test doubles. If one instance is required, the application\u2019s composition root can still manage a singleton lifetime without hardwiring global access.",
    // Distinguish lifetime from access pattern.
    followUp: "Does one singleton per process guarantee uniqueness across a distributed deployment?",
    // Highlight scope.
    resource: "https://refactoring.guru/design-patterns/singleton"
    // Link to pattern details.
  },
  // Finish the singleton lesson.
  {
    // Explain moving construction decisions behind a boundary.
    title: "Factory",
    // Name the creational pattern.
    module: "Design Patterns",
    // Group individual patterns.
    definition: "A factory centralizes object creation behind a method or object so callers depend on a product contract rather than construction details.",
    // Define the broad factory idea.
    mechanism: "A simple factory selects products with explicit logic. Factory Method lets subclasses customize a creation operation, while Abstract Factory creates related product families. These variations have different structures and should not be treated as identical.",
    // Distinguish related pattern names.
    example: 'PaymentGatewayFactory.create("card") returns a PaymentGateway implementation. Checkout consumes charge() without knowing the provider\u2019s constructor arguments, credential wiring, or connection setup.',
    // Give a construction boundary.
    misconception: "Every function returning an object is necessarily the GoF Factory Method pattern with subclass-based creation.",
    // Avoid collapsing all factories into one form.
    appliedQuestion: "Several callers repeat provider-specific constructor setup. Where should that setup move?",
    // Test centralization.
    appliedAnswer: "Into a factory or composition boundary that returns the common product interface.",
    // Isolate construction.
    appliedWrong: "Into duplicated constructor branches inside every business method.",
    // Show the duplication problem.
    hardQuestion: "How do Factory Method and Abstract Factory differ?",
    // Ask a precise pattern comparison.
    hardAnswer: "Factory Method provides an overridable creation operation, often in a creator superclass, for a product. Abstract Factory supplies an object exposing creation operations for a compatible family of products. The former varies one construction hook through inheritance; the latter groups related creation through a factory interface and composition.",
    // Explain structure and purpose.
    followUp: "When is a plain constructor simpler and sufficient?",
    // Encourage proportional design.
    resource: "https://refactoring.guru/design-patterns/factory-method"
    // Link to the specific pattern explanation.
  },
  // Finish the factory lesson.
  {
    // Explain subscription-based change notification.
    title: "Observer",
    // Name the behavioral pattern.
    module: "Design Patterns",
    // Group individual patterns.
    definition: "Observer defines a subscription relationship in which a publisher notifies registered subscribers about events or state changes.",
    // Define the communication model.
    mechanism: "Subscribers register and unregister through a clear lifecycle. Notifications may push event data or ask subscribers to read state. Ordering, reentrancy, exception handling, and synchronous versus asynchronous delivery must be specified; the pattern alone guarantees none of them.",
    // Explain operational details.
    example: "An order publisher emits OrderPlaced. Email and inventory subscribers react independently. A short-lived UI component should unsubscribe when disposed so a long-lived publisher does not retain it unnecessarily.",
    // Give service and lifecycle examples.
    misconception: "Observer guarantees delivery order, exactly-once processing, and automatic cleanup for every subscriber.",
    // Correct unsupported guarantees.
    appliedQuestion: "A closed UI component remains referenced by a long-lived publisher. What subscription practice helps?",
    // Test lifecycle awareness.
    appliedAnswer: "Unsubscribe or dispose the listener when the component\u2019s lifecycle ends.",
    // Release the reference.
    appliedWrong: "Add more listeners each time the component opens and never remove them.",
    // Show the leak pattern.
    hardQuestion: "What failure modes should be considered in a synchronous observer implementation?",
    // Ask for engineering depth.
    hardAnswer: "A slow subscriber blocks publication, an exception may prevent later notifications unless isolated, reentrant callbacks can mutate the subscription collection, and subscribers may observe partially updated state. Define snapshot iteration, exception policy, event timing, and lifecycle cleanup. Use asynchronous delivery only with explicit ordering and consistency expectations.",
    // Explain concrete failure modes.
    followUp: "How would asynchronous notifications change consistency and error handling?",
    // Extend to distributed events.
    resource: "https://refactoring.guru/design-patterns/observer"
    // Link to pattern details.
  },
  // Finish the observer lesson.
  {
    // Explain interchangeable algorithms through composition.
    title: "Strategy",
    // Name the behavioral pattern.
    module: "Design Patterns",
    // Group individual patterns.
    definition: "Strategy encapsulates interchangeable algorithms behind a shared contract and lets a context delegate to a selected implementation.",
    // Define the pattern.
    mechanism: "The context owns policy-independent workflow and delegates the variable step. Strategies can be objects or functions, can be injected, and may be chosen at construction or runtime. The shared contract must specify inputs, outputs, and side effects consistently.",
    // Explain structure and compatibility.
    example: "Checkout delegates shipping price to StandardShipping or ExpressShipping. Both accept the same package data and return a price in the same currency and units, so the checkout workflow stays unchanged.",
    // Give a complete use case.
    misconception: "Strategy requires the context to copy every algorithm into its own growing conditional statement.",
    // Contrast delegation and branching.
    appliedQuestion: "Pricing algorithms change independently from checkout flow. Which design best isolates that variation?",
    // Ask for application.
    appliedAnswer: "Inject a pricing strategy and delegate the calculation through a stable contract.",
    // Apply composition.
    appliedWrong: "Duplicate checkout flow once for every pricing algorithm.",
    // Offer coupled variants.
    hardQuestion: "How is Strategy different from State when both use delegated objects?",
    // Ask a structural lookalike comparison.
    hardAnswer: "Strategy selects among interchangeable ways to perform a task; the choice usually represents an external policy or configuration. State represents behavior that changes with the context\u2019s internal lifecycle, often including transitions between states. Their object structure can resemble each other, but intent and transition ownership differ.",
    // Explain intent rather than syntax.
    followUp: "When can a function replace a dedicated strategy class?",
    // Discuss simpler representations.
    resource: "https://refactoring.guru/design-patterns/strategy"
    // Link to pattern details.
  },
  // Finish the strategy lesson.
  {
    // Explain extending behavior by wrapping the same interface.
    title: "Decorator",
    // Name the structural pattern.
    module: "Design Patterns",
    // Group individual patterns.
    definition: "Decorator adds behavior by wrapping an object while preserving the same client-facing contract, allowing wrappers to be composed.",
    // Define the pattern.
    mechanism: "A decorator implements the component interface and delegates to a wrapped component before or after adding behavior. Wrapper order can affect results. Preserve observable contracts and consider lifecycle propagation, identity, and error handling across the chain.",
    // Explain composition and caveats.
    example: "An OutputStream can be wrapped with buffering and then compression. Callers still write bytes through the stream interface, while the wrappers add distinct behavior without a subclass for every feature combination.",
    // Give a real library example.
    misconception: "Decorator\u2019s main purpose is to translate an incompatible interface into an unrelated client interface.",
    // Distinguish it from Adapter.
    appliedQuestion: "You need optional logging and retry behavior around one service without a subclass for each combination. What fits?",
    // Ask about combinations.
    appliedAnswer: "Composable decorators that implement the same service contract and wrap one another.",
    // Use wrapping.
    appliedWrong: "One inheritance class for every possible combination of all optional features.",
    // Show combinatorial inheritance.
    hardQuestion: "Why can decorator order change behavior even when the interface remains the same?",
    // Ask about semantics.
    hardAnswer: "Each wrapper changes the sequence of operations around the inner call. Logging outside retry may record one logical request, while logging inside retry may record every physical attempt. Caching outside authorization can be dangerous unless cache keys and access rules preserve the contract. Document ordering and test the intended chain.",
    // Explain with concrete chains.
    followUp: "How should close() or dispose() propagate through a wrapper chain?",
    // Explore lifecycle.
    resource: "https://refactoring.guru/design-patterns/decorator"
    // Link to pattern details.
  },
  // Finish the decorator lesson.
  {
    // Explain translating incompatible external interfaces.
    title: "Adapter",
    // Name the structural pattern.
    module: "Design Patterns",
    // Complete the required pattern group.
    definition: "Adapter translates an existing interface into the contract a client expects so otherwise incompatible components can work together.",
    // Define the pattern.
    mechanism: "An object adapter wraps the existing component and converts arguments, results, and errors. Translation must preserve units and behavioral promises, not merely rename methods. Class adapters use inheritance where language rules permit it.",
    // Explain semantic translation.
    example: "Your app expects charge(cents): Receipt, while a provider exposes makePayment(decimalDollars): VendorResult. A provider adapter converts cents to dollars, maps errors, and produces the application Receipt type.",
    // Give a unit-sensitive example.
    misconception: "An adapter only needs to rename methods and may ignore incompatible units, errors, or side effects.",
    // Correct shallow adaptation.
    appliedQuestion: "Your internal charge API accepts cents, but a vendor accepts decimal dollars. What must the adapter do?",
    // Ask about semantic conversion.
    appliedAnswer: "Convert units precisely and map results and errors to the internal contract.",
    // Preserve the caller's semantics.
    appliedWrong: "Pass the integer cent amount unchanged as dollars and only rename the method.",
    // Show a severe unit mismatch.
    hardQuestion: "How does Adapter differ from Decorator and Facade?",
    // Ask for a three-way distinction.
    hardAnswer: "Adapter changes the interface expected by a client to make an existing component compatible. Decorator preserves an interface while adding behavior around a component. Facade provides a simpler entry point over a subsystem. Their implementations may all use wrapping, but the intended contract relationship differs.",
    // Explain intent and contract.
    followUp: "What should happen if the vendor cannot satisfy a required internal guarantee?",
    // Probe impossible adaptation.
    resource: "https://refactoring.guru/design-patterns/adapter"
    // Link to pattern details.
  }
  // Finish the adapter lesson.
];
var hardQuizSeeds = [
  // Add scored Hard practice to representative concepts while retaining descriptive questions.
  {
    // Test a subtle leak through mutable objects inside a read-only collection.
    topicTitle: "Encapsulation",
    // Attach this scenario to the representation-boundary lesson.
    prompt: "A class returns an unmodifiable List<Address> view, but Address has public setters. Which invariant risk remains?",
    // Ask about transitive mutability.
    options: ["Clients can mutate Address elements even though structural list changes are blocked.", "No state can change because an unmodifiable list recursively freezes all elements.", "The list necessarily contains deep copies because it is unmodifiable."],
    // Distinguish container immutability from object-graph immutability.
    answer: "Clients can mutate Address elements even though structural list changes are blocked.",
    // Select the correct remaining risk.
    explanation: "An unmodifiable list controls additions, removals, and replacements through that view. It does not automatically make referenced elements immutable or copy them. Use immutable element values or appropriate defensive copies when the invariant requires stronger isolation.",
    // Explain the exact guarantee.
    hint: "Separate the mutability of the collection from the mutability of each referenced element."
    // Guide the reasoning without selecting an option.
  },
  // Finish the encapsulation Hard MCQ.
  {
    // Test compatibility of an override’s accepted inputs.
    topicTitle: "Liskov Substitution Principle",
    // Attach this scenario to behavioral subtyping.
    prompt: "Base.withdraw accepts any amount in [0, balance]. A subtype rejects amounts below 100 while keeping the same method signature. Which assessment is correct?",
    // Make the base promise explicit.
    options: ["The subtype preserves LSP because its parameter types match.", "The subtype strengthens a precondition and can violate LSP for callers using the base contract.", "The subtype only weakens a postcondition, so preconditions are irrelevant."],
    // Offer distinct contract interpretations.
    answer: "The subtype strengthens a precondition and can violate LSP for callers using the base contract.",
    // Identify the stronger input requirement.
    explanation: "A caller allowed by the base contract to withdraw 50 must still be valid when using a subtype through the base type. The new minimum rejects a previously valid input. Structural signature compatibility does not prove behavioral substitutability.",
    // Explain the concrete counterexample.
    hint: "Consider a caller that withdraws 50 from a balance of 500."
    // Supply a valid base-case witness.
  },
  // Finish the LSP Hard MCQ.
  {
    // Test correct copying of shared and cyclic object graphs.
    topicTitle: "Deep Copy vs Shallow Copy",
    // Attach the graph-copy scenario.
    prompt: "Nodes A and B reference one another, and two root fields both reference A. Which deep-copy technique both terminates and preserves this internal sharing?",
    // Ask for two correctness properties.
    options: ["Recursively allocate a fresh copy every time any reference is encountered.", "Replace every repeated reference with null without tracking source identity.", "Register each original object identity with its copy before recursively copying its outgoing references."],
    // Contrast graph-aware and tree-only algorithms.
    answer: "Register each original object identity with its copy before recursively copying its outgoing references.",
    // Select the identity-map technique.
    explanation: "Registering before traversal lets a back edge find the already allocated copy, terminating the cycle. Reusing that same copy for repeated references also preserves alias relationships within the copied graph while separating it from the original mutable graph.",
    // Explain termination and alias preservation.
    hint: "A graph can revisit an object before recursion has finished copying it."
    // Highlight why registration timing matters.
  },
  // Finish the deep-copy Hard MCQ.
  {
    // Test deletion semantics rather than merely dispatch syntax.
    topicTitle: "Virtual Functions and Vtables",
    // Attach the C++ lifetime scenario.
    prompt: "In ordinary C++, Base has a public nonvirtual destructor and Derived extends Base. For Base* p = new Derived(); delete p; what is the consequence?",
    // State the ordinary deletion case explicitly.
    options: ["It is always safe because the compiler automatically treats every base destructor as virtual.", "The deletion has undefined behavior because the base destructor is not virtual.", "It is guaranteed to call only Derived\u2019s destructor and leave Base untouched."],
    // Offer the correct language-level guarantee and two false ones.
    answer: "The deletion has undefined behavior because the base destructor is not virtual.",
    // State the ordinary C++ rule.
    explanation: "Deleting a derived object through a base pointer ordinarily requires a virtual base destructor. Without it, the language does not merely promise a partial cleanup sequence; behavior is undefined. A polymorphic owning base should normally expose a suitable virtual destructor.",
    // Explain why a seemingly partial cleanup answer is insufficient.
    hint: "Ask what the language guarantees when static and dynamic pointed-to types differ during deletion."
    // Direct attention to lifetime rules.
  },
  // Finish the destructor Hard MCQ.
  {
    // Test wrapper ordering with a real retry scenario.
    topicTitle: "Decorator",
    // Attach the composition-order lesson.
    prompt: "A call succeeds on its third physical attempt. Retry wraps a Logging decorator, so each retry invokes Logging. How many per-invocation log entries does Logging produce?",
    // Define the nesting and count assumption.
    options: ["One, because every decorator always observes only the logical outer operation.", "Zero, because a decorator inside retry cannot see attempts.", "Three, because Logging is invoked once for each physical attempt."],
    // Contrast inner and outer placement.
    answer: "Three, because Logging is invoked once for each physical attempt.",
    // Count the three inner invocations.
    explanation: "Retry(Logging(Service)) repeats the inner logging-wrapped call three times. Logging(Retry(Service)) could log one outer invocation instead, depending on its logging policy. The interface can remain the same while composition order changes observable behavior.",
    // Explain both possible wrapper orders.
    hint: "Trace which object Retry invokes every time it attempts the operation."
    // Encourage following the call chain.
  }
  // Finish the decorator Hard MCQ.
];
var oopTopics = withHardQuiz(makeLessons("oop", seeds), hardQuizSeeds);

// content/os.ts
var processReference = "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf";
var concurrencyReference = "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf";
var memoryReference = "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf";
var storageReference = "https://pages.cs.wisc.edu/~remzi/OSTEP/file-implementation.pdf";
var seeds2 = [
  // Keep every requested topic editable as a separate curriculum record.
  {
    // Compare the resource container with its execution units.
    title: "Process vs Thread",
    // Name the comparison.
    module: "Process Management",
    // Place it in the process fundamentals module.
    definition: "A process owns an execution environment and address space; a thread is an execution stream that shares its process resources with sibling threads.",
    // Define both concepts.
    mechanism: "Each thread has its own program counter, register state, and stack. Threads in one process generally share code, heap, and open files. Separate processes normally have isolated virtual address spaces and communicate through explicit interprocess mechanisms.",
    // Explain shared and private state.
    example: "A browser can isolate tabs in separate processes to contain failures. A server process may use several worker threads that share a connection pool but keep separate stacks for local calls.",
    // Give concrete architecture examples.
    misconception: "Every thread in one process has its own completely isolated heap and independent copy of all process files.",
    // Identify the address-space misconception.
    appliedQuestion: "Two threads in the same process update one heap counter. What must the design consider?",
    // Test sharing awareness.
    appliedAnswer: "They share the counter, so concurrent updates need an appropriate synchronization strategy.",
    // Identify the coordination requirement.
    appliedWrong: "No coordination is needed because every thread has a private copy of the heap counter.",
    // Offer false isolation.
    hardQuestion: "Why is switching threads often cheaper than switching processes, and when can this comparison be misleading?",
    // Ask for nuanced cost reasoning.
    hardAnswer: "Threads in the same process can retain the address-space context, avoiding some page-table changes and TLB disruption. Both switches still save and restore execution state and can disturb caches. Actual costs depend on hardware, kernel design, working sets, and whether threads belong to the same process; process isolation can still be worth its overhead.",
    // Explain costs without an absolute claim.
    followUp: "Which thread data must remain private even when the heap is shared?",
    // Extend the comparison.
    resource: concurrencyReference
    // Link to the independent textbook.
  },
  // Finish the process and thread comparison.
  {
    // Describe the scheduler-visible execution lifecycle.
    title: "Process States",
    // Name the lifecycle concept.
    module: "Process Management",
    // Group scheduling fundamentals.
    definition: "A basic process lifecycle distinguishes new, ready, running, blocked or waiting, and terminated states according to execution eligibility.",
    // Define the common states.
    mechanism: "Ready means eligible but waiting for CPU time. Running means executing on a CPU. A process becomes blocked when it cannot proceed until an event such as I/O completion. Completion of that event usually moves it to ready, not immediately to running.",
    // Explain key transitions.
    example: "A running process requests a disk read and blocks. The scheduler runs another ready process. When the disk completes, the waiting process becomes ready and must be dispatched before continuing execution.",
    // Give an I/O transition example.
    misconception: "A ready process is waiting for disk I/O and therefore cannot be scheduled on a CPU.",
    // Distinguish ready and blocked.
    appliedQuestion: "An I/O operation completes for a blocked process while another process is using the only CPU. What normally happens next?",
    // Test transition reasoning.
    appliedAnswer: "The process becomes ready and waits for a scheduling decision.",
    // State the normal transition.
    appliedWrong: "It necessarily becomes running immediately without a scheduling decision.",
    // Offer a forced-transition misconception.
    hardQuestion: "Why should blocked processes not remain on the normal ready queue?",
    // Ask about scheduler correctness.
    hardAnswer: "A blocked process cannot make progress until its awaited condition changes. Dispatching it wastes CPU time or forces repeated checks. Separate wait structures let event completion make the process runnable once, while the ready queue contains candidates eligible to execute. Real kernels can have additional sleep, stopped, and zombie states.",
    // Explain progress and implementation detail.
    followUp: "What event can move a running process back to ready?",
    // Ask about preemption.
    resource: processReference,
    // Link to the process chapter.
    diagram: ["New \u2192 Ready \u2192 Running \u2192 Terminated", "Running \u2192 Blocked: wait for I/O or an event", "Blocked \u2192 Ready: awaited event completes", "Running \u2192 Ready: time slice expires or preemption occurs"]
    // Supply a readable state-transition diagram.
  },
  // Finish the process-state lesson.
  {
    // Explain the kernel record describing an execution environment.
    title: "Process Control Block",
    // Name the operating-system data structure.
    module: "Process Management",
    // Group process implementation details.
    definition: "A process control block is the kernel\u2019s record of a process, including identity, execution state, scheduling information, and references to owned resources.",
    // Define the PCB.
    mechanism: "The record may contain or reference saved registers, memory mappings, credentials, file tables, accounting, and parent-child relations. Real kernels split this information across several structures; per-thread execution state is often stored separately from process-wide resources.",
    // Avoid implying one universal structure layout.
    example: "When the scheduler stops process P, the kernel saves enough execution context to resume P later and keeps P\u2019s memory and file references reachable through its process-related structures.",
    // Connect data to scheduling.
    misconception: "A process control block is the user program\u2019s source code stored on disk.",
    // Distinguish kernel metadata and program text.
    appliedQuestion: "Where does the kernel retain information needed to resume a process after descheduling it?",
    // Test purpose.
    appliedAnswer: "In kernel-managed process and thread control structures containing saved execution context.",
    // Identify the right structures.
    appliedWrong: "Only in the program\u2019s source-code file, which is recompiled on every switch.",
    // Offer a restart misconception.
    hardQuestion: "Why do modern kernels often separate process-wide and thread-specific control information?",
    // Ask about resource sharing.
    hardAnswer: "Threads share process-wide resources such as an address space and open-file table but need independent registers, stacks, scheduler state, and wait conditions. Separating these responsibilities avoids duplicating shared resources and supports scheduling each thread independently. The exact structure names and boundaries are kernel-specific.",
    // Explain the design.
    followUp: "Which fields must be updated during a context switch?",
    // Connect the data structure with the next lesson.
    resource: processReference
    // Link to the textbook.
  },
  // Finish the PCB lesson.
  {
    // Explain suspending and resuming execution streams.
    title: "Context Switching",
    // Name the execution mechanism.
    module: "Process Management",
    // Group CPU and scheduler mechanisms.
    definition: "A context switch saves one execution stream\u2019s state and restores another so the CPU can resume a different thread or process.",
    // Define the operation.
    mechanism: "The kernel saves registers and execution position, changes scheduler and possibly address-space state, then restores the selected stream. A mode switch enters or leaves kernel privilege; it need not select a different thread and is not synonymous with a context switch.",
    // Distinguish context and privilege changes.
    example: "A timer interrupt reaches the kernel, which may save A\u2019s registers and load B\u2019s registers before returning to user mode. If A is selected again, the interrupt caused a mode transition without switching to B.",
    // Give both possible outcomes.
    misconception: "Every system call necessarily performs a context switch to a different user process.",
    // Correct the system-call confusion.
    appliedQuestion: "A system call enters the kernel and immediately returns to the same thread. Must a context switch have occurred?",
    // Ask a precise distinction.
    appliedAnswer: "No; a privilege-mode transition can occur without selecting another execution stream.",
    // State the independent concepts.
    appliedWrong: "Yes; every change in CPU privilege is a switch to a different process.",
    // Offer the false equivalence.
    hardQuestion: "Why can excessive context switching reduce throughput even if register saves are fast?",
    // Ask about indirect costs.
    hardAnswer: "Switches consume kernel CPU time and disrupt instruction caches, data caches, branch predictors, and sometimes TLB state. Short time slices can spend a large fraction of execution on these overheads rather than useful work. The best scheduling granularity balances responsiveness, fairness, and working-set locality.",
    // Explain performance tradeoffs.
    followUp: "How might a time slice that is too large affect interactive latency?",
    // Connect overhead to scheduling policy.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf"
    // Link to the execution-mechanism chapter.
  },
  // Finish the context-switch lesson.
  {
    // Introduce scheduling metrics and policy goals.
    title: "CPU Scheduling",
    // Name the policy area.
    module: "Process Management",
    // Group scheduling algorithms.
    definition: "CPU scheduling selects an eligible execution stream for a CPU according to policy goals such as response time, throughput, fairness, and deadlines.",
    // Define scheduling.
    mechanism: "Preemptive policies can interrupt a running task; nonpreemptive policies wait for blocking or completion. Turnaround equals completion minus arrival, response equals first execution minus arrival, and waiting counts time spent ready rather than running. No single policy optimizes every workload and goal.",
    // Explain metrics and tradeoffs.
    example: "For a job arriving at time 2, first running at 5, and completing at 12, response time is 3 and turnaround time is 10. Waiting time additionally depends on how much time it ran and whether it blocked.",
    // Give a worked metric example.
    misconception: "Response time and turnaround time are always identical for every scheduling policy and workload.",
    // Distinguish metrics.
    appliedQuestion: "A task arrives at time 3, first runs at 7, and finishes at 15. What are response and turnaround times?",
    // Test calculation.
    appliedAnswer: "Response time is 4 units and turnaround time is 12 units.",
    // Provide the arithmetic.
    appliedWrong: "Response time is 12 units and turnaround time is 4 units.",
    // Offer the swapped metrics.
    hardQuestion: "Why can an algorithm with excellent average turnaround still be poor for an interactive system?",
    // Ask about goals.
    hardAnswer: "Average turnaround can hide long delays before a particular user receives any response and can favor predictable short jobs. Interactive workloads often require low response latency and fairness even at a small throughput cost. Assess tail latency, starvation risk, context-switch overhead, and workload assumptions alongside averages.",
    // Explain metric limitations.
    followUp: "Which metric becomes central in a hard real-time system?",
    // Extend to deadlines.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    // Link to scheduling policy details.
  },
  // Finish the scheduling overview.
  {
    // Explain arrival-order CPU scheduling.
    title: "FCFS",
    // Keep the required algorithm name.
    module: "Process Management",
    // Distinguish CPU FCFS from disk FCFS.
    definition: "First-Come, First-Served CPU scheduling runs ready jobs in arrival order and is normally nonpreemptive.",
    // Define the policy.
    mechanism: "A FIFO ready queue makes the policy simple. A long CPU-bound job can delay many short jobs, producing the convoy effect. For CPU-burst examples with no I/O, a job\u2019s waiting time is its start time minus its arrival time.",
    // Explain queue and cost.
    example: "All jobs arrive at time 0 in order A(8), B(2), C(1). FCFS starts them at 0, 8, and 10, so waiting times are 0, 8, and 10; average waiting is 6 units.",
    // Work the arithmetic explicitly.
    misconception: "FCFS automatically preempts a long running job as soon as a shorter job becomes ready.",
    // Contrast FCFS and shortest-remaining policies.
    appliedQuestion: "A(8), B(2), and C(1) arrive at time 0 in that order with no I/O. What is FCFS average waiting time?",
    // Test the worked schedule.
    appliedAnswer: "6 time units, from waiting times 0, 8, and 10.",
    // State the correct average.
    appliedWrong: "1 time unit, because FCFS always rearranges jobs from shortest to longest.",
    // Offer sorting confusion.
    hardQuestion: "What is the convoy effect, and why can it harm mixed CPU and I/O workloads?",
    // Ask about a workload phenomenon.
    hardAnswer: "Short or I/O-bound tasks wait behind a long CPU-bound task under nonpreemptive FCFS. Their I/O requests are delayed, so I/O devices may be idle while the CPU-bound task runs, followed by a burst in which many jobs block for I/O. Preemption or differentiated scheduling can improve responsiveness and device overlap.",
    // Explain the chain of effects.
    followUp: "How does round robin change the response-time behavior?",
    // Connect policies.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    // Link to the textbook schedule discussion.
  },
  // Finish CPU FCFS.
  {
    // Explain shortest-job selection and its assumptions.
    title: "SJF",
    // Keep the required algorithm name.
    module: "Process Management",
    // Group CPU scheduling algorithms.
    definition: "Shortest Job First chooses the ready job with the smallest predicted CPU burst; its standard form is nonpreemptive.",
    // Define the selection rule.
    mechanism: "With all jobs available and exact known lengths, SJF minimizes average waiting time for the simple single-burst model. Real systems estimate future bursts. Its preemptive relative is shortest remaining time first, and long jobs can starve if short jobs keep arriving.",
    // State the assumptions and limits.
    example: "For jobs A(8), B(2), and C(1) all available at time 0, SJF runs C, B, A. Waiting times are 0, 1, and 3, averaging 4/3 units.",
    // Supply a worked example.
    misconception: "Shortest Job First can know every future CPU burst exactly and therefore has no practical prediction problem.",
    // Highlight estimation.
    appliedQuestion: "A(8), B(2), and C(1) are all ready. Which order does nonpreemptive SJF choose?",
    // Ask selection.
    appliedAnswer: "C, then B, then A, by increasing CPU burst length.",
    // State the correct order.
    appliedWrong: "A, then B, then C, regardless of burst length.",
    // Offer FCFS confusion.
    hardQuestion: "Why is SJF\u2019s optimality claim not enough to make it universally best?",
    // Ask about applicability.
    hardAnswer: "The proof relies on a particular workload model and known service times. Actual CPU bursts are uncertain, arrivals vary, fairness matters, and long jobs may starve. A system may prefer preemptive or feedback-based policies that approximate short-job preference while accounting for response, estimates, and aging.",
    // Explain the gap between model and system.
    followUp: "How does shortest remaining time first react to a newly arriving short task?",
    // Extend to the preemptive version.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    // Link to scheduling analysis.
  },
  // Finish SJF.
  {
    // Explain time slicing for responsiveness.
    title: "Round Robin",
    // Name the policy.
    module: "Process Management",
    // Group CPU algorithms.
    definition: "Round robin gives each ready task up to one time quantum before moving an unfinished task to the back of the ready queue.",
    // Define time slicing.
    mechanism: "A timer enables preemption when the quantum expires. A small quantum improves initial responsiveness but increases switching overhead. A very large quantum approaches FCFS behavior for jobs that finish within their slice.",
    // Explain the tuning tradeoff.
    example: "A(5) and B(3) arrive together in that order, with quantum 2 and no switch cost. The sequence is A 0\u20132, B 2\u20134, A 4\u20136, B 6\u20137, A 7\u20138.",
    // Give a full worked schedule.
    misconception: "Reducing the time quantum to nearly zero always increases useful CPU throughput without any cost.",
    // Address overhead.
    appliedQuestion: "With A(5), B(3), quantum 2, and zero switch cost, when does B first run?",
    // Test the schedule.
    appliedAnswer: "At time 2, after A uses its first quantum.",
    // State the response time.
    appliedWrong: "At time 5, because round robin never preempts A.",
    // Offer FCFS behavior.
    hardQuestion: "How would you choose a time quantum for an interactive workload?",
    // Ask practical tuning.
    hardAnswer: "Choose a quantum large relative to context-switch overhead but small enough for acceptable response latency across the expected ready-queue length. Measure workload distributions, tail latency, and throughput rather than assuming the smallest value is best. Blocking tasks may yield before using their full quantum.",
    // Explain measurements and tradeoffs.
    followUp: "What happens when the quantum exceeds every job\u2019s CPU burst?",
    // Probe the FCFS limit.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    // Link to textbook analysis.
  },
  // Finish round robin.
  {
    // Explain priority ordering and aging.
    title: "Priority Scheduling",
    // Name the algorithm family.
    module: "Process Management",
    // Group CPU scheduling policies.
    definition: "Priority scheduling chooses an eligible task according to assigned priority and may be preemptive or nonpreemptive.",
    // Define the policy without assuming one numeric convention.
    mechanism: "The scheduler must define whether a larger or smaller number means higher priority. Static priorities can starve lower-priority work. Aging raises waiting tasks over time. Priority inversion is a different problem in which a high-priority task waits for a resource held by a lower-priority task.",
    // Explain conventions and two failure modes.
    example: "Assume smaller numbers mean higher priority. Ready tasks A(priority 3), B(priority 1), and C(priority 2) run B, C, A if no new jobs arrive. Aging can increase A\u2019s effective priority while it waits.",
    // Give an explicit convention.
    misconception: "Priority scheduling cannot starve any task because low-priority jobs always run before higher-priority arrivals.",
    // Identify starvation.
    appliedQuestion: "In a scheduler where smaller numbers mean higher priority, which ready task runs first: A(3), B(1), or C(2)?",
    // Test the stated convention.
    appliedAnswer: "B, because priority 1 is highest under the stated rule.",
    // Supply the correct selection.
    appliedWrong: "A, because a larger number must always mean higher priority in every operating system.",
    // Highlight differing conventions.
    hardQuestion: "How do aging and priority inheritance solve different problems?",
    // Ask for a nuanced distinction.
    hardAnswer: "Aging gradually raises the priority of a task that waits too long, reducing starvation from repeated higher-priority arrivals. Priority inheritance temporarily boosts a resource holder to the priority of a blocked higher-priority waiter, mitigating priority inversion. Aging targets scheduling fairness; inheritance targets lock-mediated blocking.",
    // Explain both mechanisms.
    followUp: "Can priority inheritance remove every source of unbounded latency?",
    // Extend to real-time constraints.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf"
    // Link to dynamic-priority discussion.
  },
  // Finish priority scheduling.
  {
    // Compare parallel work within and across process containers.
    title: "Multithreading vs Multiprocessing",
    // Name the comparison.
    module: "Process Management",
    // Group concurrency architecture choices.
    definition: "Multithreading uses multiple execution streams within a process; multiprocessing uses separate processes that can run concurrently and, with sufficient cores, in parallel.",
    // Define both approaches.
    mechanism: "Threads share memory conveniently but require synchronization and share a failure boundary. Processes provide stronger address-space isolation but need IPC or explicit shared memory. Language runtimes may impose additional restrictions, such as a global interpreter lock in some Python implementations.",
    // Explain system and runtime factors.
    example: "An image-processing pipeline can use processes to exploit CPU cores and isolate crashes. A network server can use threads for overlapping blocked I/O, while an event loop is another possible concurrency model.",
    // Give workload examples without overclaiming.
    misconception: "Creating many threads guarantees CPU-parallel speedup in every language runtime and on a single-core machine.",
    // Correct concurrency versus parallelism.
    appliedQuestion: "A task needs strong isolation from another worker\u2019s memory corruption. Which starting point is usually stronger?",
    // Ask architecture judgment.
    appliedAnswer: "Separate processes, because their virtual address spaces are normally isolated.",
    // Identify the isolation boundary.
    appliedWrong: "Threads sharing the same process heap, because shared memory prevents corruption from spreading.",
    // Offer false protection.
    hardQuestion: "What factors determine whether threads or processes are better for a CPU-bound worker pool?",
    // Ask a tradeoff analysis.
    hardAnswer: "Consider runtime restrictions, available cores, data-sharing needs, serialization and IPC costs, memory overhead, startup cost, and failure isolation. CPU-bound work needs true parallel execution to scale across cores; threads may or may not provide that in a given runtime. Benchmark the real task and account for coordination and copying.",
    // Explain practical decision criteria.
    followUp: "When can shared memory reduce process-based IPC cost?",
    // Extend to hybrid designs.
    resource: concurrencyReference
    // Link to the concurrency chapter.
  },
  // Finish the architecture comparison.
  {
    // Explain privilege separation and system calls.
    title: "User Mode vs Kernel Mode",
    // Name the privilege comparison.
    module: "Process Management",
    // Complete process fundamentals.
    definition: "User mode restricts privileged operations, while kernel mode allows the operating system to manage protected hardware and system resources.",
    // Define privilege levels.
    mechanism: "Hardware privilege checks and memory protection limit what user code can do. A system call uses a controlled entry into kernel code, which validates arguments and permissions before performing work. Interrupts and faults can also enter the kernel; not every entry changes the running process.",
    // Explain controlled transitions.
    example: "An application cannot freely overwrite a device control register. It requests a file read through a system call, and the kernel checks the file descriptor, user buffer, and access rights before coordinating the device operation.",
    // Give a realistic boundary.
    misconception: "User-mode code may execute any privileged instruction as long as it is written in a compiled language.",
    // Correct language versus hardware privilege.
    appliedQuestion: "How should a user application request a protected file or device operation?",
    // Test system-call purpose.
    appliedAnswer: "Through a controlled operating-system API that enters kernel code and checks permissions.",
    // Identify the boundary.
    appliedWrong: "By directly bypassing hardware privilege checks from ordinary user code.",
    // Offer an impossible permission bypass.
    hardQuestion: "Why must a kernel validate pointers and lengths supplied by a user process?",
    // Ask about trust boundaries.
    hardAnswer: "The caller can be buggy or hostile and may supply unmapped addresses, protected kernel addresses, overflowing lengths, or buffers that change concurrently. Kernel code must use appropriate safe-copy and validation mechanisms so invalid requests do not corrupt privileged memory or crash the system. Authentication and access checks are separate from pointer validity.",
    // Explain memory and authorization concerns.
    followUp: "Is a mode switch necessarily a context switch?",
    // Reinforce a key distinction.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf"
    // Link to execution-control mechanisms.
  },
  // Finish the privilege lesson.
  {
    // Define the protected region of shared-state access.
    title: "Critical Section",
    // Name the synchronization concept.
    module: "Synchronization",
    // Begin the synchronization module.
    definition: "A critical section accesses shared state whose invariant requires controlled concurrent execution, commonly mutual exclusion.",
    // Define the region by its invariant.
    mechanism: "A correct synchronization design seeks mutual exclusion, progress, and an appropriate fairness or bounded-waiting guarantee. The protected region must cover the complete invariant-preserving operation; locking only a read or only a write can leave a race.",
    // Explain correctness conditions.
    example: "Transferring money requires decrementing one account and incrementing another as one protected operation relative to competing transfers. Locking only the final balance assignment leaves the read-compute-write sequence exposed.",
    // Give an invariant-focused example.
    misconception: "Protecting only the final assignment always makes a multi-step shared-state update atomic.",
    // Address incomplete locking.
    appliedQuestion: "Two threads perform read, increment, write on a shared counter. Which part should mutual exclusion protect?",
    // Ask about the scope.
    appliedAnswer: "The entire read-modify-write operation, unless an appropriate atomic operation replaces it.",
    // Identify the atomic unit.
    appliedWrong: "Only the last write, while allowing both reads and calculations to race.",
    // Offer insufficient coverage.
    hardQuestion: "Why can expanding a critical section improve correctness but reduce performance?",
    // Ask about scope tradeoffs.
    hardAnswer: "A larger region can protect a multi-field invariant and prevent interleavings that violate it, but it also serializes more work and increases contention. Keep the invariant protected while moving unrelated computation and slow I/O outside when safe. Splitting locks requires a clear lock order and proof that intermediate states remain acceptable.",
    // Balance correctness and throughput.
    followUp: "How would you identify the invariant before choosing a lock?",
    // Encourage deliberate synchronization.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf"
    // Link to lock design.
  },
  // Finish the critical-section lesson.
  {
    // Explain timing-dependent incorrect shared-state behavior.
    title: "Race Conditions",
    // Name the concurrency failure.
    module: "Synchronization",
    // Group shared-state hazards.
    definition: "A race condition occurs when correctness depends on the timing or ordering of concurrent operations that are not adequately coordinated.",
    // Define the broad concept.
    mechanism: "A read-modify-write sequence can interleave even if individual loads and stores are atomic. A data race is a narrower language-memory-model term involving conflicting unsynchronized memory accesses; not every high-level race requires a low-level data race.",
    // Distinguish related terms.
    example: "Two threads both read counter=5, each computes 6, and both write 6. Two increments occurred, but the result is 6 rather than 7. A mutex or suitable atomic fetch-add prevents this lost update.",
    // Give a worked interleaving.
    misconception: "If individual integer reads and writes are atomic, every multi-step increment is automatically race-free.",
    // Correct compound-operation reasoning.
    appliedQuestion: "Two unsynchronized threads read 5 and both write 6 after incrementing. Which effect occurred?",
    // Ask about the observed result.
    appliedAnswer: "A lost update caused by interleaving a non-atomic read-modify-write sequence.",
    // Name the failure.
    appliedWrong: "Correct serialization, because two increments from 5 must always end at 6.",
    // Offer incorrect arithmetic.
    hardQuestion: "Can a program be free of data races and still have a race condition?",
    // Ask a nuanced concurrency question.
    hardAnswer: "Yes. A check-then-act sequence may use individually synchronized operations but fail to make the combined decision atomic. For example, two callers can each observe that a concurrent map lacks a key and both perform an external side effect before inserting it. Use a compound atomic operation or a higher-level protocol matching the invariant.",
    // Explain a logical race.
    followUp: "Why might a race disappear when logging is added?",
    // Connect timing to reproducibility.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf"
    // Link to concurrency analysis.
  },
  // Finish the race-condition lesson.
  {
    // Compare ownership locks with resource permits.
    title: "Mutex vs Semaphore",
    // Name the comparison.
    module: "Synchronization",
    // Group synchronization primitives.
    definition: "A mutex normally provides owner-based exclusive access, while a semaphore counts permits and coordinates resource availability or signaling.",
    // Define the distinct semantics.
    mechanism: "A mutex is generally unlocked by the thread that acquired it. A counting semaphore decrements on acquisition and increments on release, with waiting when no permit is available. Semaphore signaling can be performed by a different execution stream when its API permits, making it useful beyond simple exclusion.",
    // Explain ownership and counting.
    example: "Use a mutex to protect one shared map update. Use a semaphore initialized to 5 to limit active database requests to five. A semaphore used as a signal can begin at zero until another worker posts an event.",
    // Give three concrete uses.
    misconception: "A counting semaphore always has exactly one owner and can represent only one available resource.",
    // Distinguish from a mutex.
    appliedQuestion: "A worker pool may use at most five concurrent database connections. Which primitive directly represents the capacity?",
    // Ask resource counting.
    appliedAnswer: "A counting semaphore initialized with five permits.",
    // Match the requirement.
    appliedWrong: "A mutex whose locked state somehow counts all five connections independently.",
    // Show an inadequate model.
    hardQuestion: "Why is replacing every mutex with a binary semaphore not always equivalent?",
    // Ask ownership nuance.
    hardAnswer: "A mutex often enforces ownership, may integrate with priority inheritance, and can expose debugging or recursive-lock semantics. A binary semaphore models a one-permit state and may allow cross-thread signaling without ownership. Those differences affect misuse detection, scheduling behavior, and the protocol, even when both can enforce exclusion in a simple example.",
    // Explain semantic differences.
    followUp: "What happens if a semaphore permit is released twice accidentally?",
    // Explore counting errors.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"
    // Link to semaphore details.
  },
  // Finish the mutex and semaphore comparison.
  {
    // Distinguish one-permit and multi-permit synchronization.
    title: "Binary vs Counting Semaphore",
    // Name the comparison.
    module: "Synchronization",
    // Group semaphore variants.
    definition: "A binary semaphore represents at most one permit or signal, while a counting semaphore represents multiple available permits.",
    // Define the state space.
    mechanism: "Acquire consumes a permit or waits; release makes a permit available subject to the API\u2019s rules. A binary semaphore can coordinate an event or exclusion, while a counting semaphore models a bounded resource pool. Ownership and fairness are not inherent guarantees of the counting idea.",
    // Explain operations and limits.
    example: "A printer-ready signal can use a binary semaphore. A parking lot with 20 spaces can use a counting semaphore initialized to 20, acquiring before entry and releasing exactly once after departure.",
    // Provide concrete uses.
    misconception: "A counting semaphore initialized to 20 allows an unlimited number of simultaneous successful acquisitions without releases.",
    // Correct permit exhaustion.
    appliedQuestion: "A counting semaphore begins with three permits. Three workers acquire without releasing. What happens to a fourth acquire?",
    // Ask about available capacity.
    appliedAnswer: "It waits or fails according to the API because no permit remains.",
    // State the exhaustion behavior.
    appliedWrong: "It always succeeds and leaves three permits unchanged.",
    // Offer no-accounting behavior.
    hardQuestion: "What invariants should a bounded-resource semaphore protocol preserve?",
    // Ask about protocol design.
    hardAnswer: "Every successful acquisition must have one corresponding release after the resource is no longer in use, including error paths. The number of active users must not exceed capacity, and releases must not invent permits for acquisitions that failed. Use structured cleanup and, where supported, bounded-semaphore checks to detect over-release.",
    // Explain leak and over-release prevention.
    followUp: "Why can a leaked permit eventually block the whole pool?",
    // Connect accounting and liveness.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"
    // Link to textbook semantics.
  },
  // Finish the semaphore comparison.
  {
    // Explain structured exclusion and condition waiting.
    title: "Monitors and Locks",
    // Name the synchronization structures.
    module: "Synchronization",
    // Group structured coordination.
    definition: "A lock controls entry to protected code, while a monitor combines protected state, mutual exclusion, and condition-based coordination around that state.",
    // Define the relation.
    mechanism: "Condition-variable wait atomically releases the associated lock and waits; before returning it reacquires the lock. Check the predicate in a while loop because wakeups can be spurious or another thread can consume the condition first. A notification is not a stored permit.",
    // Explain correct condition use.
    example: "A bounded queue protects its buffer with one lock. A consumer executes while (queue.empty()) notEmpty.wait(lock), then removes an item while still holding the lock. A producer signals after changing the queue state.",
    // Give the classic correct pattern.
    misconception: "A condition-variable notification permanently stores a permit even when no thread is waiting.",
    // Distinguish notifications from semaphores.
    appliedQuestion: "Why should a consumer recheck queue.empty() in a while loop after a condition wait returns?",
    // Ask predicate reasoning.
    appliedAnswer: "The predicate may still be false because of spurious wakeups or competing consumers.",
    // State the correct reason.
    appliedWrong: "Waiting guarantees the queue contains an item forever, so rechecking is unnecessary.",
    // Offer the guarantee misconception.
    hardQuestion: "Why must releasing the lock and beginning the condition wait be coordinated atomically?",
    // Ask about lost wakeups.
    hardAnswer: "If a thread checks a false predicate, releases the lock, and only later begins waiting, another thread can change the state and notify in between. The first thread can then sleep after the notification with no future wakeup. The condition-wait API closes this gap when used with the same lock protecting the predicate.",
    // Explain the dangerous interleaving.
    followUp: "When should notify-all be preferred over notify-one?",
    // Extend to multiple predicates or consumers.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf"
    // Link to condition-variable analysis.
  },
  // Finish the monitor lesson.
  {
    // Explain coordinating bounded-buffer capacity and data availability.
    title: "Producer-Consumer Problem",
    // Name the classic concurrency scenario.
    module: "Synchronization",
    // Group synchronization applications.
    definition: "The producer-consumer problem coordinates producers adding items and consumers removing items from a shared buffer without overflow, underflow, or corrupted state.",
    // Define the safety requirements.
    mechanism: "A bounded buffer needs both mutual exclusion for internal structure and waiting for not-full and not-empty predicates. With semaphores, empty counts free slots, full counts available items, and a mutex protects buffer mutations. Never wait for capacity while holding a lock needed by the worker that can create it.",
    // Explain an established solution.
    example: "For a buffer of capacity 4, initialize empty=4 and full=0. A producer acquires empty, locks and inserts, unlocks, then releases full. A consumer symmetrically acquires full before locking and removing.",
    // Provide the operation sequence.
    misconception: "A single mutex alone can make a consumer remove an item from an empty bounded buffer correctly without any waiting protocol.",
    // Separate exclusion and availability.
    appliedQuestion: "A bounded buffer has capacity four and starts empty. What are the initial empty and full semaphore counts?",
    // Test initialization.
    appliedAnswer: "empty is 4 and full is 0.",
    // Supply the valid counts.
    appliedWrong: "empty is 0 and full is 4, because empty means unavailable slots.",
    // Offer inverted meanings.
    hardQuestion: "How can a producer-consumer implementation deadlock by acquiring primitives in the wrong order?",
    // Ask for liveness reasoning.
    hardAnswer: "If a consumer holds the buffer mutex while waiting on full when the buffer is empty, a producer may be unable to acquire that mutex to insert an item and signal full. Wait for the resource-count semaphore before acquiring the structural mutex, or use a condition wait that releases the mutex atomically.",
    // Explain the cycle and repair.
    followUp: "How do you shut down blocked consumers when production has ended?",
    // Invite practical lifecycle handling.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"
    // Link to the bounded-buffer treatment.
  },
  // Finish the producer-consumer lesson.
  {
    // Explain shared reading and exclusive writing.
    title: "Readers-Writers Problem",
    // Name the classic coordination problem.
    module: "Synchronization",
    // Group synchronization applications.
    definition: "The readers-writers problem permits concurrent readers of shared data while requiring writers to have exclusive access.",
    // Define the access rule.
    mechanism: "Read-write locks distinguish shared and exclusive acquisition. Reader-preference can starve writers; writer-preference can delay readers; fair policies try to bound waiting. Read-heavy does not automatically mean faster because lock bookkeeping and cache traffic can outweigh parallelism.",
    // Explain policy and performance.
    example: "A configuration table has many read-only lookups and occasional reloads. Concurrent readers can inspect one stable version, while a writer needs exclusive access to replace or mutate the protected version.",
    // Provide a realistic workload.
    misconception: "A readers-writers lock permits several writers to mutate the same protected data simultaneously.",
    // Correct exclusivity.
    appliedQuestion: "Three readers hold a read lock. A writer requests the write lock. What must be true before it enters?",
    // Ask about exclusion.
    appliedAnswer: "All active readers must release, and no other writer may hold the lock.",
    // State the access condition.
    appliedWrong: "The writer may immediately mutate concurrently because read locks block only other readers.",
    // Offer reversed semantics.
    hardQuestion: "Why can reader-preference starve a writer, and what does a fairer implementation change?",
    // Ask about scheduling policy.
    hardAnswer: "If new readers can always join while any reader is active, the reader count may never reach zero and the writer can wait indefinitely. A writer-aware or fair policy stops admitting some new readers once a writer is queued, allowing the active set to drain. This improves bounded waiting but can reduce reader throughput or increase reader latency.",
    // Explain starvation and its tradeoff.
    followUp: "When might an ordinary mutex outperform a read-write lock?",
    // Encourage measurement.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"
    // Link to textbook discussion.
  },
  // Finish the readers-writers lesson.
  {
    // Explain resource-ordering deadlock with a concrete model.
    title: "Dining Philosophers Problem",
    // Name the classic scenario.
    module: "Synchronization",
    // Complete the synchronization examples.
    definition: "Dining philosophers models competing workers that each need two shared resources, illustrating deadlock, starvation, and coordination tradeoffs.",
    // Define what the model teaches.
    mechanism: "If every philosopher acquires the left fork and waits for the right, a circular wait can form. Solutions include globally ordering forks, limiting the number competing for forks, or using a coordinator. Deadlock freedom alone does not guarantee that every philosopher eventually eats.",
    // Explain several solution families.
    example: "Number the forks and always acquire the lower-numbered fork before the higher-numbered one. The resulting global resource order prevents a cycle of workers each waiting for a lower-ranked resource.",
    // Give an ordering solution.
    misconception: "Letting every philosopher hold their left fork forever while waiting for the right guarantees progress.",
    // Identify the deadlocking protocol.
    appliedQuestion: "All five philosophers hold their left fork and wait for their right. What is the key problem?",
    // Ask about the state.
    appliedAnswer: "A circular wait can deadlock the group because no philosopher can acquire the second fork.",
    // Identify the liveness failure.
    appliedWrong: "All philosophers can immediately eat because holding any one fork satisfies the two-fork requirement.",
    // Offer an invalid resource requirement.
    hardQuestion: "Why does a global ordering of forks prevent this deadlock?",
    // Ask for a proof idea.
    hardAnswer: "Require acquisitions in strictly increasing resource order. A circular wait would require the final waiting edge to return to a lower resource while every edge increases, which is impossible. This breaks circular wait, one necessary deadlock condition. Fair admission is still needed if starvation freedom is required.",
    // State the ordering argument.
    followUp: "Can a deadlock-free solution still starve one philosopher?",
    // Distinguish liveness guarantees.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf"
    // Link to concurrency failure analysis.
  },
  // Finish dining philosophers.
  {
    // Explain the Coffman conditions and their scope.
    title: "Four Necessary Conditions",
    // Name the deadlock criterion.
    module: "Deadlocks",
    // Begin deadlock theory.
    definition: "Deadlock requires mutual exclusion, hold-and-wait, no forced preemption of held resources, and circular wait in the classical resource model.",
    // State all four conditions.
    mechanism: "Mutual exclusion limits sharing; hold-and-wait retains resources while requesting more; no preemption prevents forced reclaim; circular wait forms a dependency cycle. Breaking any required condition prevents that class of deadlock. With multiple instances per resource type, a graph cycle alone is not always sufficient.",
    // Explain necessity without overclaiming sufficiency.
    example: "Thread A holds lock X and waits for Y, while thread B holds Y and waits for X. Locks are exclusive, each thread holds one while waiting, locks are not forcibly taken, and the waits form a cycle.",
    // Give a minimal deadlock.
    misconception: "Circular wait is unnecessary for classical resource deadlock when all other Coffman conditions hold.",
    // Test all conditions.
    appliedQuestion: "A holds X and waits for Y; B holds Y and waits for X. Which Coffman condition is directly shown by the dependency loop?",
    // Ask graph reasoning.
    appliedAnswer: "Circular wait.",
    // Name the loop condition.
    appliedWrong: "Guaranteed preemption of held locks.",
    // Offer the opposite of a required condition.
    hardQuestion: "Does the presence of all four conditions prove every system execution is already deadlocked?",
    // Ask a precise necessity distinction.
    hardAnswer: "No. They describe necessary characteristics enabling deadlock in the model; merely allowing them does not mean a particular state is deadlocked. Analyze actual allocations and waits. For single-instance resource types, a wait cycle can establish deadlock; multiple instances require more detailed availability reasoning.",
    // Distinguish possibility and actual state.
    followUp: "Which condition does globally ordering lock acquisition break?",
    // Connect prevention.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf",
    // Link to established concurrency material.
    diagram: ["Thread A holds X \u2192 waits for Y", "Thread B holds Y \u2192 waits for X", "A \u2192 B \u2192 A forms a circular wait"]
    // Visualize the two-thread cycle.
  },
  // Finish the conditions lesson.
  {
    // Explain structurally eliminating a required condition.
    title: "Deadlock Prevention",
    // Name the policy family.
    module: "Deadlocks",
    // Group deadlock handling strategies.
    definition: "Deadlock prevention imposes rules that make at least one necessary deadlock condition impossible.",
    // Define prevention.
    mechanism: "Examples include acquiring all required resources together to avoid hold-and-wait or imposing a total resource order to avoid circular wait. Some resources cannot be safely preempted or shared, so not every condition is practical to break. Prevention can reduce concurrency or resource utilization.",
    // Explain mechanisms and cost.
    example: "Assign every lock a rank and require code paths to acquire locks in increasing rank. If locks A and B have ranks 1 and 2, both transfer directions acquire A before B instead of choosing account order independently.",
    // Give an enforceable rule.
    misconception: "Deadlock prevention requires detecting an existing cycle and killing a process after the deadlock has formed.",
    // Distinguish detection and recovery.
    appliedQuestion: "A system requires every thread to acquire locks in ascending global rank. Which condition does this prevent?",
    // Ask about the rule.
    appliedAnswer: "Circular wait, because a cycle would require ranks to decrease somewhere.",
    // Explain the condition.
    appliedWrong: "Mutual exclusion, because ranked locks can now be held by unlimited writers.",
    // Offer unrelated semantics.
    hardQuestion: "What tradeoffs arise when requiring a job to acquire all resources before it starts?",
    // Ask about hold-and-wait prevention.
    hardAnswer: "It prevents holding a subset while waiting for more, but jobs must know their needs in advance. Resources can sit idle while reserved, and a job needing many resources may wait a long time even if it could have done useful work with a subset. Reservation can lower utilization and create starvation unless admission is fair.",
    // Explain costs.
    followUp: "When is global lock ordering difficult to maintain across modules?",
    // Invite implementation reasoning.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf"
    // Link to prevention examples.
  },
  // Finish deadlock prevention.
  {
    // Explain preserving a provably safe allocation state.
    title: "Deadlock Avoidance",
    // Name the policy family.
    module: "Deadlocks",
    // Group handling strategies.
    definition: "Deadlock avoidance examines each proposed allocation and grants it only when the resulting state remains safe under known resource-demand assumptions.",
    // Define avoidance.
    mechanism: "A safe state has at least one order in which every process can obtain its remaining declared resources, finish, and release them. An unsafe state is not necessarily already deadlocked. Algorithms such as Banker\u2019s need declared maximum demands and reliable allocation bookkeeping.",
    // Explain the safety concept.
    example: "If only one resource unit is available, granting it to one process may leave no process able to finish. An avoidance policy can defer the request when preserving that unit allows another process to complete and release enough resources.",
    // Demonstrate prospective decision making.
    misconception: "An unsafe state means every process is already deadlocked at the instant the state is identified.",
    // Distinguish unsafe and deadlocked.
    appliedQuestion: "A resource state has no provable completion sequence under declared maximum demands. Must it already be deadlocked?",
    // Ask the key distinction.
    appliedAnswer: "No; it is unsafe, meaning deadlock may become possible depending on future requests.",
    // State the correct implication.
    appliedWrong: "Yes; unsafe and currently deadlocked are identical definitions.",
    // Offer the false equivalence.
    hardQuestion: "Why is deadlock avoidance difficult for many general-purpose applications?",
    // Ask about assumptions.
    hardAnswer: "Programs often cannot declare accurate maximum resource demands, and resources or processes may appear dynamically. Repeated safety checks add overhead, and overly conservative estimates can delay work unnecessarily. The technique is more practical when resource classes, demand limits, and release behavior are controlled and known.",
    // Explain practical limits.
    followUp: "How does avoidance differ from preventing circular wait by design?",
    // Compare prospective and structural approaches.
    resource: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html"
    // Link to university deadlock notes.
  },
  // Finish deadlock avoidance.
  {
    // Explain finding and recovering from an existing deadlock.
    title: "Deadlock Detection",
    // Name the strategy.
    module: "Deadlocks",
    // Group handling strategies.
    definition: "Deadlock detection permits potentially risky allocations and periodically analyzes current waits to identify a deadlocked set.",
    // Define detection.
    mechanism: "For single-instance resource types, a wait-for graph cycle identifies a deadlock. Multiple resource instances require an allocation-and-availability algorithm. Detection must be paired with recovery such as aborting work, rolling back transactions, or safely reclaiming resources.",
    // Explain algorithms and recovery.
    example: "A database sees transaction T1 waiting for a row held by T2 and T2 waiting for a row held by T1. It chooses a victim, rolls that transaction back, and lets the other proceed.",
    // Provide a practical example.
    misconception: "Detecting a deadlock automatically resolves it without aborting, rolling back, or reclaiming any resource.",
    // Distinguish diagnosis and repair.
    appliedQuestion: "A database detects T1 \u2192 T2 \u2192 T1 in its lock wait-for graph. What additional step is needed?",
    // Test recovery.
    appliedAnswer: "Choose and execute a recovery action, commonly aborting and rolling back a victim transaction.",
    // State the needed response.
    appliedWrong: "Ignore the cycle because drawing the graph has already released both locks.",
    // Offer a no-op misconception.
    hardQuestion: "What factors should influence victim selection during deadlock recovery?",
    // Ask about policy.
    hardAnswer: "Consider work already done, rollback cost, held resources, transaction importance, and how often a task has previously been chosen. Always aborting the cheapest or youngest job may starve it under repeated contention. Recovery must restore data invariants, release resources safely, and document which operations are retried.",
    // Explain fairness and consistency.
    followUp: "Why is a generic timeout weaker evidence than a detected wait cycle?",
    // Distinguish slow work and deadlock.
    resource: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html"
    // Link to university analysis.
  },
  // Finish deadlock detection.
  {
    // Work through safety testing for declared resource demands.
    title: "Banker's Algorithm",
    // Name the avoidance algorithm.
    module: "Deadlocks",
    // Complete the deadlock algorithms.
    definition: "Banker\u2019s algorithm avoids unsafe allocations by checking whether all processes can finish in some sequence using available resources and declared remaining needs.",
    // Define the test.
    mechanism: "Compute Need = Max \u2212 Allocation. Start Work at Available, find an unfinished process whose Need is no greater than Work in every resource dimension, simulate its completion, and add its Allocation to Work. A request is granted only after tentative allocation passes this safety test and stays within the process\u2019s declared maximum.",
    // Explain the complete safety loop.
    example: "For one resource type, Available=1; P1 holds 1 and needs 1 more; P2 holds 2 and needs 2 more. P1 can finish with Work=1, then release its allocated 1, making Work=2; P2 can then finish. The state is safe in order P1, P2.",
    // Give a valid simple example.
    misconception: "A process can be simulated as finished whenever its total maximum exceeds Available, without checking its remaining Need.",
    // Correct the comparison.
    appliedQuestion: "Available=1; P1 Allocation=1, Need=1; P2 Allocation=2, Need=2. Which process can finish first in the safety test?",
    // Ask a worked step.
    appliedAnswer: "P1, after which its released allocation lets Work reach 2 for P2.",
    // State the safe sequence.
    appliedWrong: "Neither, because the test compares every process\u2019s total allocation against zero.",
    // Offer an invalid condition.
    hardQuestion: "Why does the safety test add Allocation rather than Max when simulating completion?",
    // Ask for accounting reasoning.
    hardAnswer: "Work already represents available units. Simulating the remaining need temporarily consumes resources and completion returns those same borrowed units plus the process\u2019s preexisting allocation, so the net change is exactly Allocation. Adding Max without subtracting Need would invent resources and can falsely label an unsafe state safe.",
    // Explain resource conservation.
    followUp: "What fails if a process requests more than its declared maximum?",
    // Probe the algorithm's assumption.
    resource: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html"
    // Link to a detailed algorithm reference.
  },
  // Finish Banker’s algorithm.
  {
    // Compare fixed-size translation with logical memory regions.
    title: "Paging vs Segmentation",
    // Name the memory-model comparison.
    module: "Memory Management",
    // Begin the memory module.
    definition: "Paging divides virtual memory into fixed-size pages mapped to frames; segmentation divides an address space into variable-size logical regions with bounds and permissions.",
    // Define both schemes.
    mechanism: "Paging translates a page number and offset through page tables, avoiding external fragmentation at the frame level but leaving possible internal waste in a final page. Classical segmentation uses a segment identifier and offset checked against a limit, which can produce external fragmentation. Systems can combine both ideas.",
    // Explain translation and fragmentation.
    example: "With 4 KiB pages, virtual address 0x1234 has page number 1 and offset 0x234. A segment-based model might instead represent a code segment and a stack segment with distinct sizes and access rights.",
    // Give a concrete address split.
    misconception: "Paging requires every process\u2019s entire virtual address space to occupy one physically contiguous block.",
    // Correct contiguity assumptions.
    appliedQuestion: "With 4 KiB pages, which parts of virtual address 0x1234 identify the page and byte offset?",
    // Test address decomposition.
    appliedAnswer: "Page number 1 and offset 0x234.",
    // State the correct split.
    appliedWrong: "Page number 0x1234 and zero offset, because every byte is a whole page.",
    // Offer an incorrect granularity.
    hardQuestion: "Why does paging reduce external fragmentation while still allowing internal fragmentation?",
    // Ask for allocation reasoning.
    hardAnswer: "Any free frame can hold any page, so a process does not require a contiguous physical hole large enough for its whole address space. A page is nevertheless allocated at fixed granularity, so the final partially used page can contain unused bytes. Page tables and physical-contiguity requirements for other subsystems still have their own overheads.",
    // Explain the two kinds of waste.
    followUp: "What tradeoffs arise when increasing page size?",
    // Extend to page-table and TLB costs.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf"
    // Link to the paging chapter.
  },
  // Finish paging and segmentation.
  {
    // Explain address-space abstraction and demand paging.
    title: "Virtual Memory",
    // Name the system abstraction.
    module: "Memory Management",
    // Group memory virtualization concepts.
    definition: "Virtual memory gives each process a protected virtual address space whose mappings need not correspond to one contiguous or fully resident physical-memory region.",
    // Define virtual memory beyond swap.
    mechanism: "The memory-management unit translates addresses using mappings maintained by the kernel. Pages may be resident, shared, file-backed, unmapped, or temporarily stored elsewhere. A page fault is a controlled exception for a missing or disallowed mapping; some faults are resolved and others become access violations.",
    // Explain translation and fault outcomes.
    example: "A process maps a large executable but initially faults in only the pages it actually uses. Two processes can map the same read-only library frames while keeping private writable data and independent virtual addresses.",
    // Give demand-paging and sharing examples.
    misconception: "Virtual memory is only a synonym for disk swap and provides no isolation or address translation.",
    // Correct the narrow definition.
    appliedQuestion: "Two processes use the same virtual address 0x4000. Must they access the same physical bytes?",
    // Ask about address spaces.
    appliedAnswer: "No; each process can map that virtual address to different physical frames.",
    // State independent mappings.
    appliedWrong: "Yes; a virtual address globally identifies one physical byte in every process.",
    // Offer a flat-address misconception.
    hardQuestion: "Why can a page fault occur even when the machine has plenty of free physical memory?",
    // Ask about fault causes.
    hardAnswer: "The mapping may be demand-zero or file-backed and not yet populated, may be copy-on-write, or may violate permissions or refer to an unmapped address. Free RAM does not imply every valid virtual page already has a resident frame. The fault handler examines the mapping and access type before deciding whether to allocate, load, copy, or reject.",
    // Explain major categories.
    followUp: "How does copy-on-write support efficient process creation?",
    // Extend to sharing.
    resource: memoryReference
    // Link to the address-space chapter.
  },
  // Finish virtual memory.
  {
    // Explain per-page mapping metadata and multilevel lookup.
    title: "Page Tables",
    // Name the translation structure.
    module: "Memory Management",
    // Group translation mechanisms.
    definition: "A page table records mappings from virtual page numbers to physical frames together with validity, permission, and other memory-management metadata.",
    // Define mapping contents.
    mechanism: "A page-table entry can encode present, writable, executable, accessed, and dirty information depending on architecture. Multilevel page tables allocate lower levels only for used address ranges, reducing sparse-address-space overhead at the cost of additional page-walk steps.",
    // Explain fields and hierarchy.
    example: "For 4 KiB pages, translation preserves the low 12-bit offset and replaces the virtual page number with the mapped frame number. A write to a read-only entry triggers a protection fault rather than an ordinary permitted store.",
    // Give translation behavior.
    misconception: "Page tables translate byte offsets independently and discard the offset inside each page.",
    // Correct page granularity.
    appliedQuestion: "A 4 KiB page maps virtual page 7 to physical frame 20. What happens to an offset of 100 bytes?",
    // Test translation.
    appliedAnswer: "The offset stays 100, so the address refers to byte 100 within frame 20.",
    // Preserve the offset.
    appliedWrong: "The offset becomes 20 because every translation replaces all address bits with the frame number.",
    // Offer total-address replacement.
    hardQuestion: "Why do large virtual address spaces commonly use multilevel page tables?",
    // Ask about sparse allocation.
    hardAnswer: "A flat table reserves an entry for every possible virtual page even when most ranges are unused. A hierarchy omits entire unused subtrees and allocates lower-level tables on demand. The tradeoff is more memory accesses on a TLB miss, which hardware walkers, caches, and larger pages can mitigate.",
    // Explain the space-time tradeoff.
    followUp: "How does a TLB change the cost of walking page tables?",
    // Connect the next concept.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-smalltables.pdf"
    // Link to page-table design.
  },
  // Finish page tables.
  {
    // Introduce choosing a victim under memory pressure.
    title: "Page Replacement Algorithms",
    // Name the policy area.
    module: "Memory Management",
    // Group memory-replacement policies.
    definition: "A page replacement algorithm chooses which resident page to evict when a demanded page needs a frame and no suitable free frame is available.",
    // Define the decision.
    mechanism: "Policies trade fault rate against bookkeeping, dirty-page writeback cost, locality, and fairness. FIFO uses arrival age, LRU uses recent references, and OPT uses future references as an unattainable benchmark. A replacement decision must preserve dirty data and update mappings consistently.",
    // Explain evaluation criteria.
    example: "With three frames and references A, B, C, A, D, the arrival order and recent-use order differ before D arrives. FIFO evicts A, while LRU evicts B, illustrating that policy depends on different history.",
    // Compare policies on one trace.
    misconception: "Every replacement policy chooses the same victim whenever the number of frames is the same.",
    // Correct policy equivalence.
    appliedQuestion: "Three frames contain A, B, C loaded in that order, and A was just referenced. On a fault for D, how can FIFO and LRU differ?",
    // Test policy history.
    appliedAnswer: "FIFO can evict A, while LRU evicts B because A was recently used.",
    // State the differing victims.
    appliedWrong: "Both must evict A because every policy ignores access history.",
    // Offer the false invariant.
    hardQuestion: "Why is minimizing page-fault count not the only practical replacement objective?",
    // Ask about real costs.
    hardAnswer: "Faults and evictions have unequal costs: a clean file-backed page can be discarded while a dirty anonymous page may require writeback. Policies also consume CPU and metadata, affect locality across processes, and may face real-time latency limits. Evaluate total system cost and workload behavior rather than a single count.",
    // Explain cost-aware policy.
    followUp: "How can a dirty bit influence a practical victim choice?",
    // Extend to metadata.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    // Link to replacement policy analysis.
  },
  // Finish the replacement overview.
  {
    // Explain first-in eviction and Belady's anomaly.
    title: "FIFO",
    // Name the required replacement algorithm.
    module: "Memory Management",
    // Distinguish it from unrelated FIFO scheduling.
    definition: "FIFO page replacement evicts the page that entered memory earliest, regardless of how recently it has been accessed.",
    // Define the policy.
    mechanism: "Maintain a queue of page arrivals and evict from its head. Hits do not move a page to the back. The policy is simple but can evict a frequently used old page and can exhibit Belady\u2019s anomaly, where adding frames increases faults for some reference strings.",
    // Explain queue semantics and anomaly.
    example: "Frames hold A, B, C in arrival order. Accessing A is a hit and does not change FIFO order. A subsequent reference to D evicts A even though A was just used.",
    // Give a short trace.
    misconception: "A FIFO hit always moves the referenced page to the newest position, exactly like LRU.",
    // Distinguish recency from arrival.
    appliedQuestion: "A, B, C were loaded in that order. A is hit, then D faults. Which page does FIFO evict?",
    // Test the trace.
    appliedAnswer: "A, because it is still the oldest loaded page.",
    // Apply FIFO.
    appliedWrong: "B, because the hit on A necessarily refreshed FIFO arrival age.",
    // Offer LRU behavior.
    hardQuestion: "What does Belady\u2019s anomaly tell you about FIFO replacement?",
    // Ask about a surprising property.
    hardAnswer: "For some reference strings, increasing available frames can increase the number of FIFO faults. FIFO lacks the stack-inclusion property that guarantees larger-memory contents include the smaller-memory set after each reference. Therefore, more memory does not monotonically improve every FIFO trace, though it often helps ordinary workloads.",
    // Explain the implication carefully.
    followUp: "Which common policies are stack algorithms and avoid this anomaly?",
    // Connect LRU and OPT.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    // Link to policy analysis.
  },
  // Finish FIFO page replacement.
  {
    // Explain recency-based eviction and tracking overhead.
    title: "LRU",
    // Name the required policy.
    module: "Memory Management",
    // Group replacement algorithms.
    definition: "Least Recently Used replacement evicts the resident page whose last reference is farthest in the past.",
    // Define the recency rule.
    mechanism: "Exact LRU updates ordering on every access, which can be expensive for hardware-managed memory. Practical systems often approximate recency using accessed bits, clock algorithms, or aging. LRU relies on temporal locality and can perform poorly on scans larger than available memory.",
    // Explain cost and workload assumptions.
    example: "With pages A, B, C loaded, a hit on A changes recency to B, C, A from oldest to newest. A new D therefore evicts B, unlike FIFO, which would still evict A.",
    // Work through the ordering.
    misconception: "LRU evicts the page loaded earliest even if that page was accessed one instruction ago.",
    // Contrast FIFO.
    appliedQuestion: "Pages A, B, C are resident; their last accesses are at times 9, 4, and 7. Which does exact LRU evict?",
    // Ask direct recency selection.
    appliedAnswer: "B, whose last reference at time 4 is oldest.",
    // Select the least recent.
    appliedWrong: "A, because its reference at time 9 is the newest.",
    // Offer reversed ordering.
    hardQuestion: "Why do operating systems often approximate rather than implement exact LRU?",
    // Ask about instrumentation.
    hardAnswer: "Exact ordering would require observing and updating metadata for every memory reference, introducing substantial hardware or software overhead. Accessed bits and periodic sampling provide cheaper estimates. Approximate policies trade some optimal recency information for practical performance, and their behavior must be evaluated against real access patterns.",
    // Explain feasibility.
    followUp: "How does a clock algorithm use accessed bits as a recency approximation?",
    // Extend to implementation.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    // Link to textbook details.
  },
  // Finish LRU.
  {
    // Explain the future-aware lower-bound benchmark.
    title: "Optimal Page Replacement",
    // Name OPT explicitly.
    module: "Memory Management",
    // Group replacement algorithms.
    definition: "Optimal page replacement evicts the page whose next use lies farthest in the future, producing a minimum fault count for a known reference trace and fixed frame count.",
    // Define the benchmark and assumptions.
    mechanism: "A page never referenced again is an ideal victim. Exact future references are not generally available online, so OPT is primarily an offline comparison baseline. The benchmark minimizes fault count in its model and does not automatically minimize dirty-write or latency cost.",
    // Explain practicality and objective.
    example: "Resident pages are A, B, C; future references are B, A, D, C. If a new page must be loaded now, C is used farthest in the future among the resident pages and is the OPT victim.",
    // Give a future-use example.
    misconception: "A normal operating system can always know every application\u2019s exact future references and implement OPT without prediction.",
    // Correct future knowledge.
    appliedQuestion: "Resident A is used next step, B in ten steps, and C never again. Which page does OPT evict?",
    // Test the rule.
    appliedAnswer: "C, because it has no future use.",
    // Select the ideal victim.
    appliedWrong: "A, because the page needed soonest should always be removed first.",
    // Offer the opposite policy.
    hardQuestion: "Why is OPT useful even though it cannot generally run as an online operating-system policy?",
    // Ask about evaluation.
    hardAnswer: "Recorded traces reveal future accesses during offline analysis, allowing OPT to establish a lower bound on page faults under the same memory model. Comparing LRU or FIFO with that bound shows how much room remains for improvement. Keep frame count, initial state, and trace assumptions identical for a meaningful comparison.",
    // Explain benchmarking discipline.
    followUp: "Would minimizing page faults necessarily minimize elapsed I/O time?",
    // Extend to unequal fault costs.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    // Link to the replacement-policy chapter.
  },
  // Finish OPT.
  {
    // Explain repeated faults when working sets exceed memory.
    title: "Thrashing",
    // Name the memory-pressure failure.
    module: "Memory Management",
    // Group demand-paging behavior.
    definition: "Thrashing occurs when a workload spends excessive time paging because the actively needed working sets cannot be retained in available memory.",
    // Define the phenomenon.
    mechanism: "Frequent evictions remove pages that are needed again shortly, creating repeated faults and I/O. Adding more runnable work can worsen pressure even while CPU utilization looks low. Remedies include reducing multiprogramming, allocating more memory to active working sets, or changing access patterns.",
    // Explain the feedback loop and remedies.
    example: "Three processes each repeatedly touch a 2 GiB working set, but only 3 GiB is available for their pages. Interleaving all three can continually evict each other\u2019s hot pages and spend most time waiting for storage.",
    // Give a concrete capacity mismatch.
    misconception: "When low CPU utilization is caused by thrashing, adding unlimited memory-hungry processes always fixes throughput.",
    // Correct the harmful response.
    appliedQuestion: "Page faults and storage activity are high while useful CPU work collapses after adding processes. What is a plausible first diagnosis?",
    // Ask symptom interpretation.
    appliedAnswer: "Thrashing caused by combined active working sets exceeding available frames.",
    // Identify the likely cause.
    appliedWrong: "Too much physical memory, which always causes additional page faults.",
    // Offer inverted causality.
    hardQuestion: "Why can increasing the degree of multiprogramming reduce rather than improve throughput?",
    // Ask about resource competition.
    hardAnswer: "Additional active processes increase the aggregate working set. Once memory cannot retain their frequently used pages, page faults serialize progress on slow storage and evict other useful pages. The CPU can spend less time doing work despite more runnable demand. Admission control and working-set-aware allocation can restore useful overlap.",
    // Explain the nonlinear effect.
    followUp: "How would you distinguish thrashing from CPU saturation using measurements?",
    // Encourage operational reasoning.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    // Link to memory-pressure discussion.
  },
  // Finish thrashing.
  {
    // Explain caching of virtual-to-physical translations.
    title: "TLB",
    // Name the translation cache.
    module: "Memory Management",
    // Group address-translation performance.
    definition: "A translation lookaside buffer caches recent virtual-page translations and associated permissions to avoid repeated page-table walks.",
    // Define the TLB.
    mechanism: "A TLB hit can supply a frame mapping quickly. A TLB miss triggers a page-table walk or software handling depending on architecture; it is not itself a page fault if a valid resident mapping exists. Address-space identifiers can distinguish entries from different processes.",
    // Separate translation misses and missing pages.
    example: "A process scans many bytes within one 4 KiB page. Once that page\u2019s translation is cached, subsequent accesses can reuse it. Crossing enough distinct pages to exceed TLB capacity may cause translation misses even when all data remains in RAM.",
    // Give locality and capacity examples.
    misconception: "Every TLB miss means the requested page must be fetched from disk.",
    // Correct the common conflation.
    appliedQuestion: "A translation is absent from the TLB, but the page table maps a present, permitted RAM page. Must disk I/O occur?",
    // Ask about miss handling.
    appliedAnswer: "No; a page-table walk can refill the TLB without a demand-page disk read.",
    // State the distinction.
    appliedWrong: "Yes; translation-cache misses always require swapping the page in.",
    // Offer page-fault confusion.
    hardQuestion: "How can larger pages improve TLB reach, and what costs can they introduce?",
    // Ask for tradeoffs.
    hardAnswer: "With the same number of entries, larger pages cover more bytes, reducing misses for large working sets. Costs can include greater internal fragmentation, more expensive allocation or copying, and coarser protection or sharing granularity. The best choice depends on access patterns, memory pressure, and hardware support.",
    // Explain coverage and costs.
    followUp: "How can address-space identifiers reduce context-switch TLB overhead?",
    // Extend to process switching.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf"
    // Link to the TLB chapter.
  },
  // Finish the TLB lesson.
  {
    // Distinguish unused space inside blocks from holes between allocations.
    title: "Internal vs External Fragmentation",
    // Name the allocation comparison.
    module: "Memory Management",
    // Complete memory fundamentals.
    definition: "Internal fragmentation is unused space inside an allocated unit; external fragmentation is free space split into holes that cannot satisfy a required contiguous allocation.",
    // Define the two categories.
    mechanism: "Fixed-size allocation rounds a request up and can waste space within the final unit. Variable-size contiguous allocation can leave separated free holes even when total free bytes are sufficient. Compaction can address some external fragmentation but has movement and reference-update costs.",
    // Explain sources and remedies.
    example: "A 6 KiB request using 4 KiB pages occupies 8 KiB, leaving 2 KiB internal waste. Two free 3 KiB holes cannot satisfy one contiguous 5 KiB request despite 6 KiB being free: that is external fragmentation.",
    // Give two worked examples.
    misconception: "Two nonadjacent free holes must satisfy any single contiguous request smaller than their combined size.",
    // Identify contiguity requirements.
    appliedQuestion: "A 6 KiB allocation uses two 4 KiB pages. What is its unused space inside those pages?",
    // Test rounding.
    appliedAnswer: "2 KiB of internal fragmentation.",
    // State the waste.
    appliedWrong: "6 KiB of external fragmentation because pages are always contiguous.",
    // Offer the wrong category and amount.
    hardQuestion: "Why does paging not eliminate every fragmentation concern in a complete operating system?",
    // Ask for system scope.
    hardAnswer: "Paging allows noncontiguous frames for ordinary virtual pages, reducing external fragmentation for that allocation model, but partially used pages still create internal waste. Kernel structures, huge pages, DMA, and other requirements can need contiguous physical ranges and face additional fragmentation. Distinguish the allocator and granularity being discussed.",
    // Explain subsystem differences.
    followUp: "How does smaller allocation granularity affect metadata overhead?",
    // Extend to tradeoffs.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-freespace.pdf"
    // Link to allocator discussion.
  },
  // Finish the fragmentation comparison.
  {
    // Introduce mapping file offsets to storage blocks.
    title: "File Allocation Methods",
    // Name the storage topic.
    module: "File Systems and Disk Management",
    // Begin the storage module.
    definition: "File allocation methods determine how a file\u2019s logical blocks map to storage locations and how the system records that mapping.",
    // Define allocation.
    mechanism: "Contiguous allocation stores neighboring blocks together, linked allocation follows block pointers, and indexed allocation consults a separate mapping structure. Practical file systems often combine extents, indexes, caching, and allocation heuristics rather than using one textbook model exclusively.",
    // Explain the main families.
    example: "A video played sequentially benefits from nearby large extents, while random reads in a database file need efficient offset-to-block lookup. Allocation decisions affect locality, growth, metadata size, and recovery complexity.",
    // Connect layout to workload.
    misconception: "Every file system stores every file as exactly one permanent contiguous region with no metadata.",
    // Correct an oversimplification.
    appliedQuestion: "Which allocation family uses an external table or index to map a file\u2019s logical blocks to data blocks?",
    // Test classification.
    appliedAnswer: "Indexed allocation.",
    // Name the mapping approach.
    appliedWrong: "Pure linked allocation, which never needs to traverse links for random access.",
    // Offer a false property.
    hardQuestion: "Which workload and device properties should guide a file-allocation design?",
    // Ask for tradeoff analysis.
    hardAnswer: "Consider sequential versus random access, typical file sizes, growth, free-space fragmentation, metadata overhead, crash consistency, and device behavior. HDDs strongly reward reduced seeks, while SSDs remove mechanical seeks but still benefit from batching and sensible write patterns. Extents can combine compact metadata with good sequential locality.",
    // Explain workload-driven choices.
    followUp: "Why are extents useful for large files?",
    // Extend to practical designs.
    resource: storageReference
    // Link to the textbook implementation chapter.
  },
  // Finish the allocation overview.
  {
    // Explain one-range file storage and extent growth.
    title: "Contiguous Allocation",
    // Name the allocation method.
    module: "File Systems and Disk Management",
    // Group file-layout methods.
    definition: "Contiguous allocation stores a file in consecutive storage blocks, allowing a logical block number to be translated from a starting block and offset.",
    // Define the layout.
    mechanism: "Metadata can record a start block and length, making sequential and direct access simple. Growing the file may require adjacent free space, relocation, or additional extents. Variable-sized contiguous regions can create external fragmentation.",
    // Explain mapping and growth cost.
    example: "A file starts at block 100 and occupies eight blocks. Its zero-based logical block 3 is at physical block 103. If block 108 is occupied, extending the single contiguous run becomes difficult.",
    // Give address arithmetic and growth.
    misconception: "A single contiguous file can always grow indefinitely without nearby free space or relocation.",
    // Address growth constraints.
    appliedQuestion: "A contiguous file begins at block 100. Where is its zero-based logical block 3?",
    // Test direct calculation.
    appliedAnswer: "Physical block 103.",
    // Supply the correct location.
    appliedWrong: "Physical block 300, because the starting block is multiplied by the logical index.",
    // Offer wrong arithmetic.
    hardQuestion: "How do extents relax the limitations of single-run contiguous allocation?",
    // Ask about a practical evolution.
    hardAnswer: "An extent records one contiguous run, and a file may have several extents. This preserves compact mappings and sequential locality within runs while allowing growth in another region when adjacent space is unavailable. Highly fragmented growth can still create many extents and increase lookup or I/O overhead.",
    // Explain the compromise.
    followUp: "What allocation strategy could reduce the number of future extents?",
    // Extend to preallocation.
    resource: storageReference
    // Link to the storage reference.
  },
  // Finish contiguous allocation.
  {
    // Explain a file as a chain of blocks.
    title: "Linked Allocation",
    // Name the allocation method.
    module: "File Systems and Disk Management",
    // Group file-layout methods.
    definition: "Linked allocation represents a file as a chain of blocks, with each link identifying the next block in the file.",
    // Define the structure.
    mechanism: "A file can grow by linking a free block without requiring adjacent space. Pure on-block linked allocation has inefficient random access because reaching a later block requires following earlier links. Pointer damage can break traversal, and pointer storage consumes capacity.",
    // Explain benefits and limitations.
    example: "A file\u2019s data may occupy blocks 9 \u2192 27 \u2192 4 \u2192 51. Reading the third block requires following the chain from 9 through 27 to 4 unless extra indexing or caching is available.",
    // Show noncontiguous order.
    misconception: "Pure linked allocation locates an arbitrary file block by one constant-time arithmetic calculation without any auxiliary index.",
    // Distinguish from contiguous mapping.
    appliedQuestion: "For chain 9 \u2192 27 \u2192 4 \u2192 51, which physical block holds the zero-based logical block 2?",
    // Test following links.
    appliedAnswer: "Block 4, reached after following two links from the first block.",
    // State the correct block.
    appliedWrong: "Block 11, obtained by adding 2 to the first block regardless of links.",
    // Offer contiguous arithmetic.
    hardQuestion: "How does a file allocation table change the cost profile of linked allocation?",
    // Ask about FAT.
    hardAnswer: "The links are stored in a separate table rather than embedded only in data blocks. Caching the table allows traversal without reading each intervening data block, improving access, but following the logical chain still costs steps unless additional indexing is used. The table itself consumes memory and storage and must be kept consistent.",
    // Explain the optimization and its limits.
    followUp: "What happens if a link forms a cycle because of corruption?",
    // Explore integrity.
    resource: storageReference
    // Link to implementation details.
  },
  // Finish linked allocation.
  {
    // Explain direct block lookup through a separate index.
    title: "Indexed Allocation",
    // Name the allocation method.
    module: "File Systems and Disk Management",
    // Group file-layout methods.
    definition: "Indexed allocation stores pointers to a file\u2019s data blocks in a separate index so logical blocks can be located without following a data-block chain.",
    // Define the mapping.
    mechanism: "A single index block is simple but limits file size and can waste space for tiny files. Multilevel indexes or inode-style direct and indirect pointers scale to larger files. Looking up an uncached indirect block may require additional I/O before accessing data.",
    // Explain scale and overhead.
    example: "An index contains [9, 27, 4, 51]. Zero-based logical block 2 maps directly to physical block 4 through the third entry. A large file may need another level when one index block no longer holds all pointers.",
    // Give a worked index lookup.
    misconception: "Indexed allocation eliminates all metadata storage and always needs zero extra reads for an uncached indirect block.",
    // Correct overhead assumptions.
    appliedQuestion: "An index stores [9, 27, 4, 51]. Which physical block corresponds to logical block 2?",
    // Test indexed addressing.
    appliedAnswer: "Block 4, selected by index entry 2.",
    // State the direct mapping.
    appliedWrong: "Block 11, because an index must ignore its entries and use contiguous arithmetic.",
    // Offer the wrong model.
    hardQuestion: "Why combine direct pointers with single and double indirect pointers in an inode?",
    // Ask about balancing small and large files.
    hardAnswer: "Direct pointers let common small files reach data with little indexing overhead. Indirect levels provide enough addressability for large files without allocating a giant fixed table for every file. The tradeoff is extra metadata and potentially more I/O for blocks reached through deeper levels, mitigated by caching.",
    // Explain the hybrid design.
    followUp: "How would block size and pointer width determine maximum indexed file size?",
    // Invite capacity calculation.
    resource: storageReference
    // Link to the textbook inode discussion.
  },
  // Finish indexed allocation.
  {
    // Introduce mechanical request ordering and modern device caveats.
    title: "Disk Scheduling",
    // Name the storage policy area.
    module: "File Systems and Disk Management",
    // Group head-movement algorithms.
    definition: "Disk scheduling orders pending storage requests to balance latency, throughput, fairness, and, for HDDs, mechanical positioning costs.",
    // Define the policy and device scope.
    mechanism: "HDD access includes seek, rotational delay, and transfer time. Textbook FCFS, SSTF, SCAN, and C-SCAN mainly model cylinder movement and simplify other costs. SSDs have no mechanical head; modern controllers and queues need different latency, fairness, and parallelism considerations.",
    // Explain the model's limits.
    example: "With an HDD head at cylinder 50 and requests at 10, 45, and 90, request order changes total movement and who waits longest. On an SSD, those cylinder-distance calculations do not represent mechanical cost.",
    // Give a device-specific example.
    misconception: "SSD performance is dominated by physically moving a magnetic head between cylinders exactly as on an HDD.",
    // Correct the device mismatch.
    appliedQuestion: "Which device characteristic makes seek-distance-based scheduling directly meaningful?",
    // Test model applicability.
    appliedAnswer: "A mechanically moving HDD head whose positioning time depends on request location.",
    // Identify the relevant mechanism.
    appliedWrong: "An SSD controller moving a mechanical head across flash cylinders.",
    // Offer an inapplicable model.
    hardQuestion: "Why can minimizing total HDD head movement fail to minimize every request\u2019s latency?",
    // Ask about fairness.
    hardAnswer: "A movement-minimizing policy may repeatedly serve nearby requests while distant ones wait, especially under continuous arrivals. Rotational position and request size also affect latency beyond cylinder distance. A production policy must balance efficiency, deadlines, batching, and starvation protection rather than optimize only one simplified metric.",
    // Explain the multiobjective problem.
    followUp: "How does a deadline policy limit starvation?",
    // Extend to practical schedulers.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf"
    // Link to the HDD chapter.
  },
  // Finish the disk-scheduling overview.
  {
    // Explain servicing disk requests by arrival order.
    title: "FCFS",
    // Preserve the required disk algorithm name.
    module: "File Systems and Disk Management",
    // Distinguish it from CPU FCFS.
    definition: "FCFS disk scheduling services pending requests in arrival order without reordering them to reduce head movement.",
    // Define the disk policy.
    mechanism: "The rule is simple and preserves queue order, but alternating distant requests can cause excessive seeks on an HDD. Total modeled movement is the sum of absolute distances between the starting head and successive requested cylinders.",
    // Explain calculation and cost.
    example: "Start at cylinder 50 with arrival-order requests 10, 90, 20. Movement is |50\u221210| + |10\u221290| + |90\u221220| = 40 + 80 + 70 = 190 cylinders.",
    // Work through the arithmetic.
    misconception: "FCFS disk scheduling always selects the closest pending cylinder before serving earlier arrivals.",
    // Distinguish from SSTF.
    appliedQuestion: "Starting at 50, FCFS serves 10, 90, 20 in arrival order. What is total head movement?",
    // Test the example.
    appliedAnswer: "190 cylinders.",
    // State the correct sum.
    appliedWrong: "90 cylinders, because FCFS silently sorts requests by distance.",
    // Offer a false reorder.
    hardQuestion: "What fairness advantage does FCFS provide, and what performance cost can it impose?",
    // Ask a policy comparison.
    hardAnswer: "A request is not indefinitely bypassed by later arrivals under ordinary bounded service assumptions, because arrival order is preserved. However, that order may cause long seeks and poor throughput. Fair queue order does not imply a uniformly small response time, especially when earlier operations are slow or numerous.",
    // Explain fairness without overclaiming.
    followUp: "How would SSTF reorder the same starting queue?",
    // Connect the next policy.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf"
    // Link to HDD scheduling.
  },
  // Finish disk FCFS.
  {
    // Explain closest-request-first disk scheduling.
    title: "SSTF",
    // Name Shortest Seek Time First.
    module: "File Systems and Disk Management",
    // Group disk algorithms.
    definition: "Shortest Seek Time First selects a pending request closest to the current HDD head position under a seek-distance model.",
    // Define selection.
    mechanism: "Recompute proximity after each completed request. This often reduces movement compared with FCFS but may starve distant requests if nearby ones continually arrive. It does not account for every rotational or controller cost unless the model is extended.",
    // Explain tradeoffs and scope.
    example: "Start at 50 with pending requests 10, 45, 90. SSTF chooses 45 first, then 10, then 90 because distances are recalculated after reaching 45. Total movement is 5 + 35 + 80 = 120 cylinders.",
    // Work a trace.
    misconception: "SSTF guarantees every distant request is served within a fixed number of arrivals regardless of workload.",
    // Highlight starvation.
    appliedQuestion: "An HDD head is at 50 with pending requests 10, 45, and 90. Which does SSTF choose first?",
    // Test nearest selection.
    appliedAnswer: "45, which is only five cylinders away.",
    // Select the closest.
    appliedWrong: "90, because SSTF always prefers the highest cylinder number.",
    // Offer wrong ordering.
    hardQuestion: "Construct a scenario in which SSTF starves a request.",
    // Ask for liveness reasoning.
    hardAnswer: "Place an old request far from the current head, then continuously introduce requests near the head before the nearby queue drains. Each new local request is preferred over the far request, so its wait can remain unbounded. Aging, deadlines, or a sweeping policy can provide better service guarantees.",
    // Explain a starvation construction.
    followUp: "Does reduced total movement necessarily imply fair waiting times?",
    // Reinforce the policy tradeoff.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf"
    // Link to HDD policy analysis.
  },
  // Finish SSTF.
  {
    // Explain bidirectional elevator-style head movement.
    title: "SCAN",
    // Name the elevator algorithm.
    module: "File Systems and Disk Management",
    // Group disk policies.
    definition: "SCAN services requests while moving in one direction toward a disk endpoint, then reverses and services requests in the opposite direction.",
    // Define the textbook policy.
    mechanism: "A direction must be specified before computing order or movement. Classical SCAN goes to the physical endpoint before reversal; LOOK reverses at the last pending request instead. Sweeping reduces the chance that new nearby requests indefinitely prevent progress toward farther positions.",
    // Distinguish SCAN and LOOK.
    example: "Cylinders range 0\u2013199, the head is at 50 and moving upward, and requests are 20, 70, 150. SCAN services 70 and 150, continues to 199, then reverses toward 20. Counting movement through the last request gives 149 + 179 = 328 cylinders.",
    // Give endpoints and direction explicitly.
    misconception: "SCAN and LOOK always move identically because both necessarily reverse at the last pending request rather than the endpoint.",
    // Correct the variant distinction.
    appliedQuestion: "In classical SCAN, moving upward with no more requests before endpoint 199, where does the head reverse?",
    // Ask the defining behavior.
    appliedAnswer: "At the physical endpoint 199, under the classical SCAN definition.",
    // State endpoint reversal.
    appliedWrong: "Always at the last pending request, which is specifically LOOK behavior.",
    // Contrast the variant.
    hardQuestion: "Why must a SCAN numerical problem specify the initial direction and cylinder range?",
    // Ask about well-defined calculations.
    hardAnswer: "Direction determines which requests are encountered before reversal, and the physical endpoint determines how far classical SCAN travels before turning. Without both, request order and total movement are underdetermined. Also state whether movement is counted only through the last serviced request or for a complete sweep.",
    // Explain necessary assumptions.
    followUp: "How would LOOK change the worked example\u2019s movement?",
    // Extend to the optimized variant.
    resource: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf"
    // Link to disk scheduling background.
  },
  // Finish SCAN.
  {
    // Explain unidirectional servicing with a circular return.
    title: "C-SCAN",
    // Name Circular SCAN.
    module: "File Systems and Disk Management",
    // Complete the required storage algorithms.
    definition: "Circular SCAN services requests in one direction, reaches an endpoint, returns to the other endpoint without servicing on the return, and resumes the same service direction.",
    // Define the circular sweep.
    mechanism: "Treating cylinders as a circular service order can make waiting behavior more uniform than bidirectional SCAN. The physical return still costs movement on an HDD even though no requests are served during it. C-LOOK wraps between extreme pending requests instead of physical endpoints.",
    // Explain cost and the related variant.
    example: "Cylinders are 0\u2013199, head 50 moving upward, requests 20, 70, 150. Service 70 and 150, move to 199, return to 0, then service 20. Through the last request, total movement is 149 + 199 + 20 = 368 cylinders.",
    // Provide a complete counted trace.
    misconception: "The circular return from the highest cylinder to zero is physically free on an HDD because no requests are served during it.",
    // Correct movement accounting.
    appliedQuestion: "Does an HDD C-SCAN calculation normally count the endpoint-to-endpoint return movement?",
    // Ask about the wrap cost.
    appliedAnswer: "Yes, when total physical head movement is requested; the unserviced return still moves the head.",
    // State the physical cost.
    appliedWrong: "No; an unserviced return teleports the mechanical head with zero distance.",
    // Offer an impossible wrap.
    hardQuestion: "Compare SCAN and C-SCAN in service direction, waiting behavior, and return cost.",
    // Ask for a complete comparison.
    hardAnswer: "SCAN services in both directions and reverses at endpoints; C-SCAN services in one direction and makes an unserviced wrap back. Circular service can reduce position-dependent differences in waiting, but the return still adds mechanical travel. Neither is universally faster, and results depend on arrivals, endpoints, direction, and the metric used.",
    // Explain tradeoffs without absolute claims.
    followUp: "How does C-LOOK avoid some endpoint travel?",
    // Connect the related policy.
    resource: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/10_MassStorage.html"
    // Link to university storage-scheduling notes.
  }
  // Finish C-SCAN.
];
var hardQuizSeeds2 = [
  // Add objectively graded Hard scenarios without removing descriptive interview questions.
  {
    // Test why a signaled condition is not a reserved resource.
    topicTitle: "Monitors and Locks",
    // Attach this scenario to condition-variable coordination.
    prompt: "Two consumers wait for a nonempty queue. One item is inserted and a waiting consumer is signaled, but another consumer removes it first. What must the awakened consumer do after reacquiring the lock?",
    // Describe a valid competing-consumer interleaving.
    options: ["Remove an item without checking because a signal permanently reserves one for that thread.", "Recheck the queue predicate in a loop and wait again if the queue is empty.", "Skip reacquiring the lock because a signal makes every later access atomic."],
    // Contrast predicate-based and notification-based reasoning.
    answer: "Recheck the queue predicate in a loop and wait again if the queue is empty.",
    // Choose the correct monitor pattern.
    explanation: "A notification says the condition may have changed; it is not an ownership transfer of an item. Another consumer can run before the awakened thread reacquires the lock. Checking while (queue.empty()) under the associated lock handles this race and spurious wakeups.",
    // Explain why a while loop is necessary even without a spurious notification.
    hint: "The signaled thread still has to compete to reacquire the lock."
    // Focus the critical timing gap.
  },
  // Finish the monitor Hard MCQ.
  {
    // Test correct resource accounting in a tentative Banker grant.
    topicTitle: "Banker's Algorithm",
    // Attach the safety scenario.
    prompt: "One resource type has Available=1. P1 holds 1 and still needs 1; P2 holds 2 and still needs 2. If the available unit is tentatively granted to P2, what does the safety test conclude?",
    // Provide a complete single-resource state.
    options: ["Safe, because P2 now holds three units even though it still needs one.", "Unsafe, because Available becomes 0 while both P1 and P2 still need 1 and neither can finish.", "Already permanently deadlocked in every possible real execution, which is the exact definition of unsafe."],
    // Distinguish safety, allocation count, and actual deadlock.
    answer: "Unsafe, because Available becomes 0 while both P1 and P2 still need 1 and neither can finish.",
    // Apply the Need <= Work check.
    explanation: "The tentative grant changes P2\u2019s allocation from 2 to 3 and remaining need from 2 to 1, while Work becomes 0. P1 and P2 both need one more unit, so neither can be simulated as completing. Reject the grant to preserve the original safe sequence P1, then P2; unsafe is not synonymous with already deadlocked.",
    // Work through the tentative state.
    hint: "Update Available, Allocation, and remaining Need together before searching for a process that can complete."
    // Identify the required accounting.
  },
  // Finish the Banker Hard MCQ.
  {
    // Test a TLB miss versus a resident-page fault.
    topicTitle: "TLB",
    // Attach the translation-cache scenario.
    prompt: "After a TLB flush, an access misses the TLB. Its page-table entry is present, writable, and points to a resident frame. Under this model, what is needed for an ordinary permitted write?",
    // Specify permissions and residency.
    options: ["A translation refill or page-table walk, without a demand-page disk read.", "A compulsory disk read because every translation-cache miss means the page is absent.", "Allocation of a new virtual address space because a TLB can never be refilled."],
    // Separate cached metadata from page residency.
    answer: "A translation refill or page-table walk, without a demand-page disk read.",
    // Select the valid translation path.
    explanation: "The page is already resident and the access is permitted. The missing cached translation can be reconstructed from the page tables. Whether refill is hardware- or software-managed depends on architecture, but a TLB miss by itself does not imply storage I/O.",
    // Explain architecture-independent essentials.
    hint: "A TLB caches translations, while residency is represented by the mapping and frame state."
    // Distinguish the two layers.
  },
  // Finish the TLB Hard MCQ.
  {
    // Test exact LRU ordering after a hit and subsequent replacements.
    topicTitle: "LRU",
    // Attach the reference-trace scenario.
    prompt: "Three frames start empty. Exact LRU processes A, B, C, A, D, B. Which resident page is evicted on the final reference to B?",
    // Provide the full reference sequence.
    options: ["A, because it was the earliest page initially loaded.", "C, because after D replaces B the recency order is C, A, D from oldest to newest.", "D, because the most recently loaded page is always the LRU victim."],
    // Contrast arrival, recency, and newest-first behavior.
    answer: "C, because after D replaces B the recency order is C, A, D from oldest to newest.",
    // Select the least recently used resident page.
    explanation: "After A, B, C the order is A, B, C. The hit on A changes it to B, C, A. D evicts B and leaves C, A, D. The final B faults and evicts C, the oldest last-reference among those residents.",
    // Work through every recency update.
    hint: "Move a page to newest on a hit, not only when it is initially loaded."
    // Highlight the distinguishing operation.
  },
  // Finish the LRU Hard MCQ.
  {
    // Test the limits of cycle detection with multiple instances.
    topicTitle: "Four Necessary Conditions",
    // Attach the deadlock-model scenario.
    prompt: "A resource-allocation graph contains a cycle, but at least one resource type has multiple instances. Which conclusion is justified from the cycle alone?",
    // State the model limitation.
    options: ["The cycle always proves every process in the system is deadlocked.", "The cycle rules out all deadlock because multiple instances make waiting impossible.", "Deadlock is possible, but allocation and availability must be analyzed before concluding an actual deadlock."],
    // Distinguish necessary evidence from sufficient proof.
    answer: "Deadlock is possible, but allocation and availability must be analyzed before concluding an actual deadlock.",
    // State the correct limited inference.
    explanation: "With single-instance resource types, a resource-allocation cycle can establish deadlock. Multiple instances may permit another holder outside the cycle to finish and release a unit, breaking the wait. A cycle remains important evidence, but the full allocation-and-availability state matters.",
    // Explain how an available completion can resolve a cycle.
    hint: "Consider whether another instance can become available from a process that is not stuck in the cycle."
    // Supply the reasoning direction.
  }
  // Finish the deadlock Hard MCQ.
];
var osTopics = withHardQuiz(makeLessons("os", seeds2), hardQuizSeeds2);

// content/dbms-data.json
var dbms_data_default = [
  {
    title: "What is a DBMS?",
    module: "Database Fundamentals",
    summary: "A database management system stores and retrieves persistent data while coordinating concurrent users and enforcing rules. It matters whenever application state must survive process restarts.",
    mechanism: "A DBMS combines a query processor, storage engine, buffer manager, transaction manager, and recovery machinery. SQL describes the requested result; the optimizer chooses an execution plan.",
    tradeoff: "A file can store records, but a DBMS provides coordinated access, indexes, constraints, and recovery. These features add operational overhead and do not remove the need for good schema design.",
    example: "Two checkout requests can reserve inventory in one transaction instead of independently overwriting a shared JSON file.",
    easy: [
      "Which responsibility belongs to a DBMS?",
      "Coordinating durable concurrent access",
      "Compiling every frontend component",
      "Replacing all application validation"
    ],
    medium: [
      "Why use a transaction for inventory reservation?",
      "To keep related stock updates atomic",
      "To make all queries execute without locks",
      "To eliminate the need for an index"
    ],
    hard: [
      "Why is replacing a DBMS with a shared JSON file risky for concurrent purchases?",
      "Read-modify-write races can lose updates; interrupted writes can corrupt the file. A DBMS provides transactions, concurrency control, constraints, and recovery, though inventory conditions still need an appropriate atomic update."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "DBMS vs RDBMS",
    module: "Database Fundamentals",
    summary: "An RDBMS is a database management system organized around relations, commonly represented as tables. DBMS is the broader category that also includes document, graph, and key-value systems.",
    mechanism: "Relational systems use rows, columns, keys, constraints, and relational operations such as selection, projection, and joins. SQL implementations differ and can also support JSON or graph-like data.",
    tradeoff: "Relational does not mean every relationship is automatically enforced: foreign keys and constraints must be declared. Nonrelational databases can also support transactions.",
    example: "An orders table references customers(id); a document store may embed order line items in one order document.",
    easy: [
      "Which statement is accurate?",
      "Every RDBMS is a DBMS",
      "Every DBMS stores only tables",
      "NoSQL systems cannot have transactions"
    ],
    medium: [
      "What actually enforces an order customer relationship in a relational schema?",
      "A declared foreign-key constraint",
      "The table name orders",
      "Using JSON in a SQL column"
    ],
    hard: [
      "Should a product choose an RDBMS simply because it needs transactions?",
      "Transaction needs are one factor, but several nonrelational systems also offer transactions. Compare relationships, query patterns, integrity constraints, scaling, consistency, and operational expertise."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Database Architecture",
    module: "Database Fundamentals",
    summary: "Database architecture separates how users see data from how it is logically organized and physically stored. This separation helps applications evolve without depending on storage details.",
    mechanism: "The three-schema model distinguishes external views, a conceptual schema, and an internal storage schema. Separately, one-tier, two-tier, and three-tier deployment describe where application logic and clients run.",
    tradeoff: "Do not confuse schema levels with deployment tiers. A three-tier web application may still expose many external views over one conceptual relational model.",
    example: "Browser \u2192 Express API \u2192 PostgreSQL is a three-tier deployment; a customer-facing view hides internal payment audit columns.",
    easy: [
      "Which schema level describes physical storage?",
      "Internal",
      "External",
      "Browser"
    ],
    medium: [
      "Does adding a REST API between browser and database define a schema level?",
      "No, it changes deployment tiers",
      "Yes, it creates the internal schema",
      "Yes, it eliminates the conceptual model"
    ],
    hard: [
      "How can an index change without breaking application queries?",
      "Indexes belong to physical organization, while queries refer to logical tables and columns. Physical data independence lets the DBMS change an access path while preserving the logical interface."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Database Schemas",
    module: "Database Fundamentals",
    summary: "A schema defines database structure: tables, columns, types, constraints, and relationships. In PostgreSQL, schema also means a named namespace within a database.",
    mechanism: "DDL creates and alters structure. A migration records an ordered structural change so development, testing, and production databases can evolve predictably.",
    tradeoff: "Schema changes can lock tables or invalidate application assumptions. Deploy additive changes first, migrate data separately, and remove old fields after all callers move.",
    example: "CREATE SCHEMA learning;\nCREATE TABLE learning.topic (id uuid PRIMARY KEY, title text NOT NULL);",
    easy: [
      "What does a relational schema describe?",
      "The structure and constraints of data",
      "Only the current row count",
      "Only a backup archive"
    ],
    medium: [
      "What is the safer first step when renaming a field used by running clients?",
      "Add the new field and support both during migration",
      "Drop the old field immediately",
      "Disable every constraint permanently"
    ],
    hard: [
      "Why separate a large data backfill from a schema migration?",
      "A long backfill can hold locks or exceed deployment time limits. A bounded schema change followed by resumable batches reduces risk and allows progress monitoring."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Primary Key",
    module: "Database Fundamentals",
    summary: "A primary key uniquely identifies every row and cannot contain NULL. It gives other tables and API records a stable identity.",
    mechanism: "A table has at most one primary-key constraint, which can span several columns. PostgreSQL creates a unique B-tree index for the primary key.",
    tradeoff: "A surrogate key remains stable when business attributes change. Natural keys can be appropriate when their uniqueness and stability are real domain guarantees.",
    example: "CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL);",
    easy: [
      "Can a primary-key column contain NULL?",
      "No",
      "Yes, for one row",
      "Only when indexed"
    ],
    medium: [
      "Why might a generated id be preferable to an email primary key?",
      "Email may change while row identity must remain stable",
      "Generated ids automatically validate email",
      "Email columns cannot be indexed"
    ],
    hard: [
      "Does choosing a UUID primary key make an email unique?",
      "No. The primary key constrains only the id. Add a separate UNIQUE constraint for email and define normalization and case-handling rules explicitly."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Foreign Key",
    module: "Database Fundamentals",
    summary: "A foreign key enforces that a referencing value corresponds to a candidate key in a referenced table. It prevents orphaned relationships.",
    mechanism: "A foreign key can reference a primary or suitable unique key. Nullable references permit absence unless NOT NULL is declared; ON DELETE determines how removal is handled.",
    tradeoff: "PostgreSQL does not automatically index the referencing column. An index may be needed for joins and efficient checks when parent rows are deleted.",
    example: "CREATE TABLE orders (id bigint PRIMARY KEY, customer_id bigint REFERENCES customers(id) ON DELETE RESTRICT);",
    easy: [
      "What does a foreign key prevent?",
      "An order referencing a nonexistent customer",
      "Two unrelated rows having equal prices",
      "Every possible query slowdown"
    ],
    medium: [
      "Why index orders.customer_id separately in PostgreSQL?",
      "To speed lookups and parent-row delete checks",
      "Foreign keys cannot work without such an index",
      "To allow NULL in the parent key"
    ],
    hard: [
      "When is ON DELETE CASCADE dangerous?",
      "Deleting a parent can remove many dependent records, possibly across several relationships. Choose it only when dependent rows have no independent retention requirement; otherwise restrict deletion or model soft deletion."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html",
    hardChoice: {
      prompt: "In PostgreSQL, orders.customer_id references customers.id. A parent deletion becomes slow as orders grows. Which targeted change can help without weakening integrity?",
      options: [
        "Add an index on orders.customer_id",
        "Remove the foreign key and trust every client",
        "Add an index only on orders.total"
      ],
      answer: "Add an index on orders.customer_id",
      explanation: "PostgreSQL does not automatically index the referencing side. An index on orders.customer_id helps locate dependent rows during parent deletion checks; the referenced unique key is already indexed.",
      hint: "Distinguish the referencing column from the referenced unique key."
    }
  },
  {
    title: "Candidate Key",
    module: "Database Fundamentals",
    summary: "A candidate key is a minimal set of attributes that uniquely identifies a row. Minimal means no proper subset can still guarantee uniqueness.",
    mechanism: "A relation can have several candidate keys. One is selected as the primary key; other candidate keys are commonly enforced using UNIQUE together with NOT NULL.",
    tradeoff: "SQL UNIQUE and mathematical candidate keys are not identical when NULL is allowed, because nullable uniqueness semantics depend on the database and constraint configuration.",
    example: "For employee(id, national_id, name), both id and national_id may be candidate keys if each is guaranteed unique and non-null.",
    easy: [
      "What makes a unique attribute set a candidate key?",
      "No attribute can be removed while preserving uniqueness",
      "It contains every table column",
      "It always has exactly two columns"
    ],
    medium: [
      "If email is UNIQUE but nullable, what extra rule better models a mandatory candidate key?",
      "NOT NULL",
      "ORDER BY",
      "ON DELETE CASCADE"
    ],
    hard: [
      "Are {student_id} and {student_id, name} both candidate keys when student_id is unique?",
      "Only {student_id} is minimal. The larger set is a super key, because name is unnecessary for unique identification."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Super Key",
    module: "Database Fundamentals",
    summary: "A super key is any set of attributes sufficient to uniquely identify a row. It can contain redundant attributes.",
    mechanism: "Every candidate key and primary key is a super key. Removing redundant attributes from a super key yields a candidate key when uniqueness is retained.",
    tradeoff: "Adding columns to an already unique set preserves uniqueness but usually adds no identification value and can make constraints more cumbersome.",
    example: "If id is unique, {id}, {id, email}, and {id, name} are super keys; only minimal sets are candidate keys.",
    easy: [
      "Which set is a super key if id is unique?",
      "The set {id, name}",
      "Only the set {name}",
      "Every column individually"
    ],
    medium: [
      "Why is {id, name} not minimal when id alone is unique?",
      "Name adds no identifying power",
      "Name must always be NULL",
      "Composite attributes cannot be keys"
    ],
    hard: [
      "Does a super key guarantee that each member attribute is individually unique?",
      "No. A composite super key may be unique only as a combination. For example, course_id and student_id can repeat individually while their pair identifies one enrollment."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Composite Key",
    module: "Database Fundamentals",
    summary: "A composite key identifies a row using more than one column. It naturally models identities such as one enrollment per student and course.",
    mechanism: "Uniqueness applies to the entire column combination, not to each column separately. Composite foreign keys must reference the corresponding combination in a consistent order.",
    tradeoff: "Composite keys encode domain rules directly but increase the size of referencing keys. A surrogate id plus a UNIQUE pair can preserve the rule with simpler references.",
    example: "CREATE TABLE enrollment (student_id bigint, course_id bigint, PRIMARY KEY (student_id, course_id));",
    easy: [
      "What is unique in a composite key (student_id, course_id)?",
      "The combination of both values",
      "Each student_id alone",
      "Each course_id alone"
    ],
    medium: [
      "How can a surrogate enrollment id retain the one-enrollment-per-course rule?",
      "Add UNIQUE(student_id, course_id)",
      "Index student_id without uniqueness",
      "Remove both foreign keys"
    ],
    hard: [
      "Can a student enroll in two courses when the primary key is (student_id, course_id)?",
      "Yes, because the pairs differ. The same student-course pair cannot repeat. This is appropriate for enrollment but may require adding term_id if re-enrollment across terms is allowed."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "ER Diagrams",
    module: "Database Fundamentals",
    summary: "An entity-relationship diagram models entities, attributes, and associations before or alongside the relational schema. It makes cardinality and optionality visible.",
    mechanism: "One-to-many relationships commonly become a foreign key on the many side. Many-to-many relationships become a junction table with references to both entities.",
    tradeoff: "An ER diagram communicates intent but does not enforce integrity. The resulting schema needs keys, nullability rules, uniqueness, and referential constraints.",
    example: "Student \u2500< Enrollment >\u2500 Course\nEnrollment(student_id, course_id, enrolled_at)",
    easy: [
      "How is a many-to-many relationship usually represented in tables?",
      "A junction table with two foreign keys",
      "A comma-separated list in each parent row",
      "A foreign key in neither table"
    ],
    medium: [
      "Which constraint models at most one profile per user?",
      "UNIQUE on profile.user_id",
      "An index on profile.bio",
      "A nullable profile name"
    ],
    hard: [
      "How would you model an optional manager for each employee?",
      "Use a nullable manager_id foreign key referencing employee(id). Add application or database logic to reject cycles if hierarchical acyclicity is required; a foreign key alone does not prevent cycles."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Functional Dependencies",
    module: "Normalization",
    summary: "A functional dependency X \u2192 Y means that any two valid rows agreeing on X must agree on Y. Dependencies describe domain rules, not coincidences in a small sample.",
    mechanism: "An attribute closure X+ contains every attribute implied by X using the known dependencies. Closure helps test keys and reason about decomposition.",
    tradeoff: "A dependency observed in current data may fail tomorrow unless it is a true business rule. Normalization decisions must start from valid domain dependencies.",
    example: "employee_id \u2192 employee_name, department_id\ndepartment_id \u2192 department_name\nTherefore employee_id \u2192 department_name transitively.",
    easy: [
      "What does X \u2192 Y mean?",
      "Equal X values imply equal Y values",
      "Every X is numerically smaller than Y",
      "Y is always a foreign key"
    ],
    medium: [
      "Why is a unique department name in a sample insufficient to prove name \u2192 id?",
      "The domain may allow future duplicate names",
      "Dependencies apply only to empty tables",
      "All sampled uniqueness is automatically a constraint"
    ],
    hard: [
      "Given A \u2192 B and B \u2192 C, what is A+ and why does it matter?",
      "A+ includes A, B, and C by transitivity. If those are all relation attributes, A is a super key; minimality must still be checked to call it a candidate key."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "1NF",
    module: "Normalization",
    summary: "First normal form represents each attribute value as a single value from its domain and avoids repeating groups in a relational design. Atomicity depends on the chosen domain and required operations.",
    mechanism: "Move repeating values that must be queried independently into related rows. A separate enrollment table represents multiple courses per student more consistently than course1, course2, course3 columns.",
    tradeoff: "A text address can be one value when treated as a whole; split its parts when the application needs to query them independently. Normalization is driven by data semantics.",
    example: 'Instead of student(id, courses="OS,DBMS"), use enrollment(student_id, course_id) with one row per relationship.',
    easy: [
      "Which design best represents independently queryable courses per student?",
      "One enrollment row per student-course pair",
      "Columns course1 through course20",
      "A comma-separated list requiring string parsing"
    ],
    medium: [
      "Must every string be split into individual characters to reach 1NF?",
      "No, atomicity depends on the domain",
      "Yes, strings are never atomic",
      "Only when a primary key exists"
    ],
    hard: [
      "Why is a comma-separated foreign-key list problematic?",
      "Individual elements cannot be constrained or joined as normal foreign keys without parsing. Rows in a junction table allow referential integrity, indexing, and independent updates."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "2NF",
    module: "Normalization",
    summary: "Second normal form requires 1NF and no non-prime attribute depending on only part of a candidate key. It addresses partial dependencies in composite-key designs.",
    mechanism: "A non-prime attribute belongs to no candidate key. With enrollment(student_id, course_id, student_name), student_name depends on student_id alone and violates 2NF.",
    tradeoff: "A relation with a single-attribute candidate key cannot have a dependency on a proper nonempty subset of that key, but it may still violate higher normal forms.",
    example: "Split enrollment(student_id, course_id) from student(student_id, student_name).",
    easy: [
      "Which dependency causes the classic 2NF violation?",
      "A non-prime attribute depending on part of a composite candidate key",
      "A primary key determining every attribute",
      "A foreign key referencing a unique parent"
    ],
    medium: [
      "Where should student_name go when enrollment has key (student_id, course_id)?",
      "In student keyed by student_id",
      "In a separate copy for every course",
      "In the course table keyed by course_id"
    ],
    hard: [
      "Why does replacing a composite primary key with a surrogate id not necessarily fix normalization?",
      "Candidate keys and domain dependencies still exist. If the student-course pair remains a candidate key, student_name still depends on its student_id part; normalization is not determined only by the chosen primary key."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "3NF",
    module: "Normalization",
    summary: "Third normal form reduces problematic transitive dependencies. Formally, for every nontrivial X \u2192 A, X must be a super key or A must be a prime attribute.",
    mechanism: "An employee table containing department_id and department_name repeats the department name because department_id determines it. Move department attributes into a department relation.",
    tradeoff: "The common phrase no transitive dependencies is a useful simplification for straightforward schemas, but the formal prime-attribute exception distinguishes 3NF from BCNF.",
    example: "employee(employee_id, department_id)\ndepartment(department_id, department_name)",
    easy: [
      "What is the usual fix for repeating department_name in every employee row?",
      "Move department details into a department table",
      "Duplicate the name in another employee column",
      "Remove employee identity"
    ],
    medium: [
      "Which determinant is acceptable in every nontrivial dependency under BCNF but not required by all 3NF cases?",
      "A super key",
      "A nullable column",
      "A foreign key by itself"
    ],
    hard: [
      "Why can the formal definition of 3NF allow a dependency whose determinant is not a super key?",
      "3NF permits it when the dependent attribute is prime, meaning it belongs to some candidate key. BCNF removes this exception and requires every nontrivial determinant to be a super key."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "BCNF",
    module: "Normalization",
    summary: "Boyce-Codd normal form requires every determinant of a nontrivial functional dependency to be a super key. It is stricter than 3NF.",
    mechanism: "Identify every valid functional dependency, then decompose when its left side is not a super key. A correct decomposition must preserve information through a lossless join.",
    tradeoff: "BCNF decomposition can lose dependency preservation, requiring joins or additional enforcement for some constraints. A dependency-preserving 3NF design can be a deliberate trade-off.",
    example: "In assignment(student, course, instructor), instructor \u2192 course can violate BCNF when an instructor teaches one course but serves many students.",
    easy: [
      "What does BCNF require for each nontrivial X \u2192 Y?",
      "X must be a super key",
      "Y must be nullable",
      "X must contain all columns"
    ],
    medium: [
      "What property can be lost during a BCNF decomposition?",
      "Dependency preservation",
      "All possible lossless joins",
      "The ability to store any primary key"
    ],
    hard: [
      "Why might an engineer choose 3NF over BCNF?",
      "A lossless 3NF decomposition can preserve dependencies that a BCNF decomposition does not. Enforcing a dependency across joins may be more expensive or operationally difficult than accepting controlled redundancy."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html",
    hardChoice: {
      prompt: "A lossless decomposition reaches BCNF but a business dependency can only be checked by joining relations. What trade-off has appeared?",
      options: [
        "Dependency preservation may have been lost",
        "Lossless joins are impossible in BCNF",
        "BCNF guarantees all dependencies stay local"
      ],
      answer: "Dependency preservation may have been lost",
      explanation: "BCNF requires each nontrivial determinant to be a super key. A lossless BCNF decomposition can fail to preserve every dependency, whereas a suitable 3NF synthesis can preserve dependencies.",
      hint: "Losslessness and dependency preservation are separate decomposition properties."
    }
  },
  {
    title: "Denormalization",
    module: "Normalization",
    summary: "Denormalization intentionally duplicates or precomputes data to improve a measured read workload. It trades simpler reads for more complex writes and consistency management.",
    mechanism: "Common examples include order totals, materialized aggregates, and copied display attributes. Each duplicated value needs an explicit refresh or transactional update strategy.",
    tradeoff: "Measure query plans before duplicating data. Indexes and query improvements may solve the issue without creating synchronization and invalidation problems.",
    example: "Store order.total_cents with line items only if the application updates the total transactionally or accepts documented eventual consistency.",
    easy: [
      "What is the main trade-off of denormalization?",
      "Faster reads with more complex consistency maintenance",
      "Automatic elimination of update anomalies",
      "Guaranteed smaller storage"
    ],
    medium: [
      "When is denormalization justified?",
      "A measured workload benefits and consistency rules are defined",
      "Whenever a table has a foreign key",
      "Before observing any query behavior"
    ],
    hard: [
      "How would you keep a cached account balance correct?",
      "Define its source of truth, update balance and ledger entries atomically when strict consistency is required, handle retries idempotently, and reconcile aggregates. An asynchronously refreshed balance needs a stated freshness bound."
    ],
    source: "https://www.postgresql.org/docs/current/ddl.html"
  },
  {
    title: "Primary Index",
    module: "Indexing",
    summary: "In textbook file organization, a primary index is built on the ordering key of a data file. In product documentation, primary-key index often means the unique index supporting a primary key.",
    mechanism: "An ordered-file primary index can be sparse because file order lets a block pointer lead to a local scan. PostgreSQL primary-key indexes are separate B-trees over heap tuples and are not automatically clustered storage.",
    tradeoff: "Always state the storage model. A PostgreSQL PRIMARY KEY does not continuously order table pages, while an InnoDB primary key is the clustered key.",
    example: "PostgreSQL: CREATE TABLE item(id bigint PRIMARY KEY); creates a unique B-tree but inserts still live in a heap-organized table.",
    easy: [
      "Does a PostgreSQL primary key automatically keep heap rows physically sorted forever?",
      "No",
      "Yes, in every database",
      "Only if the key is an integer"
    ],
    medium: [
      "Why can an ordered-file primary index be sparse?",
      "The data file order permits a short scan inside the located block",
      "Sparse indexes never require ordering",
      "Every key must have a separate duplicate pointer"
    ],
    hard: [
      "Compare primary-key storage in PostgreSQL and InnoDB.",
      "PostgreSQL typically stores table rows in a heap with a separate primary-key B-tree. InnoDB organizes row data by the clustered primary key, and secondary indexes include that key. Their I/O and key-size trade-offs differ."
    ],
    source: "https://www.postgresql.org/docs/current/indexes-unique.html"
  },
  {
    title: "Secondary Index",
    module: "Indexing",
    summary: "A secondary index provides an additional access path on attributes that do not define the underlying file order. It helps selective filters avoid scanning every row.",
    mechanism: "Index entries map searchable keys to row locations or primary keys depending on the storage engine. Multiple rows may share one secondary key.",
    tradeoff: "Each index consumes storage and adds write work. A low-selectivity predicate may still favor a table scan, especially when many random row fetches would be required.",
    example: "CREATE INDEX orders_customer_idx ON orders(customer_id); supports locating orders for a specific customer.",
    easy: [
      "What does a secondary index provide?",
      "Another searchable access path",
      "A second independent source of truth",
      "Guaranteed ordering for every SELECT"
    ],
    medium: [
      "Why might the optimizer ignore an index on a boolean column?",
      "The predicate may return too much of the table",
      "Boolean values cannot be indexed",
      "All secondary indexes are unique"
    ],
    hard: [
      "Why do many indexes slow bulk inserts?",
      "Every inserted row requires maintaining each relevant index, possibly splitting pages and generating additional WAL. Keep indexes that serve measured queries and integrity constraints."
    ],
    source: "https://www.postgresql.org/docs/current/indexes.html"
  },
  {
    title: "Clustering Index",
    module: "Indexing",
    summary: "A clustering index relates index order to physical row organization. Its exact meaning depends on the database engine and whether the organization is maintained automatically.",
    mechanism: "Range scans benefit when related rows share nearby pages. PostgreSQL CLUSTER rewrites a table using an index once; subsequent writes do not preserve that clustering automatically.",
    tradeoff: "A table can have only one physical row order at a time. Choose an order for important locality patterns while considering maintenance cost and competing access paths.",
    example: "CLUSTER orders USING orders_created_at_idx; rewrites PostgreSQL order rows in the index order at that time.",
    easy: [
      "What can improve when related rows are physically close?",
      "Range-scan locality",
      "Every unrelated lookup equally",
      "The number of logical table columns"
    ],
    medium: [
      "Does PostgreSQL CLUSTER continuously maintain physical order?",
      "No, it is a one-time rewrite",
      "Yes, after every insert",
      "Only when SELECT has no ORDER BY"
    ],
    hard: [
      "Why can a clustered time key help analytics but hurt another access pattern?",
      "Recent-time ranges can touch fewer neighboring pages, while random customer lookups may still scatter across those pages. Physical locality optimizes one main ordering, so secondary indexes and workload measurements remain necessary."
    ],
    source: "https://www.postgresql.org/docs/current/sql-cluster.html"
  },
  {
    title: "B-Tree vs B+ Tree",
    module: "Indexing",
    summary: "Balanced tree indexes keep lookup paths logarithmic. In the usual textbook distinction, B+ trees keep data entries in leaves and connect leaves for efficient ordered traversal.",
    mechanism: "Internal separator keys route a search to a child page. High fan-out keeps trees shallow; splits and merges preserve balance as entries change. Product terminology often calls a B+ style structure a B-tree.",
    tradeoff: "Ordered trees support equality and range predicates, whereas a hash index primarily supports equality. Page size, key width, and included columns affect fan-out and I/O.",
    example: "WHERE score BETWEEN 80 AND 90 can seek to the first matching leaf entry and walk adjacent entries.",
    easy: [
      "Where are data entries stored in the textbook B+ tree model?",
      "At leaf nodes",
      "Only at the root",
      "Only in a separate hash bucket"
    ],
    medium: [
      "Why are B+ trees well suited to range scans?",
      "Ordered leaves can be traversed sequentially",
      "They store no separator keys",
      "They require every key to be unique"
    ],
    hard: [
      "How does a wider index key affect a B+ tree?",
      "Fewer entries fit in each page, reducing fan-out and potentially increasing tree height and cache pressure. Prefix compression or narrower keys can improve space, but the design depends on engine capabilities."
    ],
    source: "https://www.postgresql.org/docs/current/btree.html"
  },
  {
    title: "Hash Index",
    module: "Indexing",
    summary: "A hash index maps keys to buckets using a hash function and is designed for equality lookups. It does not preserve key order.",
    mechanism: "Hash collisions place different keys into the same bucket or overflow structure. The index must compare actual values to distinguish collisions and may need bucket growth.",
    tradeoff: "Hash indexes do not normally accelerate less-than predicates, ordered results, or range scans. PostgreSQL B-tree indexes also support equality, so measure before choosing hash.",
    example: "CREATE INDEX session_token_hash_idx ON session_tokens USING hash(token_hash);",
    easy: [
      "Which predicate naturally matches a hash index?",
      "token_hash = a_specific_value",
      "created_at BETWEEN two_times",
      "ORDER BY user_name"
    ],
    medium: [
      "Why must actual keys be compared after hashing?",
      "Different keys can share a hash bucket",
      "Hash functions always produce unique values",
      "Hash indexes enforce every foreign key"
    ],
    hard: [
      "Would you use a hash index for a leaderboard score range?",
      "Usually no. Range and ordered access require an ordered structure such as a B-tree. A hash index can locate equal scores but cannot traverse score order efficiently."
    ],
    source: "https://www.postgresql.org/docs/current/hash-index.html"
  },
  {
    title: "Composite Index",
    module: "Indexing",
    summary: "A composite index stores an ordered key made from several columns. Column order should reflect the workload and index access rules.",
    mechanism: "A B-tree on (customer_id, created_at) groups entries by customer and then time. Equality on leading columns followed by a range is a common efficient pattern.",
    tradeoff: "A query filtering only a later column may be less efficient; some engines can use skip-scan or scan the index. Avoid treating the leftmost-prefix guideline as an absolute prohibition.",
    example: "CREATE INDEX orders_customer_time_idx ON orders(customer_id, created_at);\nSELECT * FROM orders WHERE customer_id = 8 AND created_at >= DATE '2026-01-01';",
    easy: [
      "What is the primary ordering of an index on (a, b)?",
      "First a, then b within each a",
      "First b, then a",
      "A random interleaving of both"
    ],
    medium: [
      "Which filter commonly fits (customer_id, created_at) well?",
      "customer_id equality plus a created_at range",
      "Only a function on an unrelated column",
      "An arbitrary JSON text substring"
    ],
    hard: [
      "Why might (status, created_at) be less suitable than (customer_id, created_at) for a customer history screen?",
      "The customer filter does not constrain the leading status column, so finding one customer may scan many entries. Choose leading columns using selectivity, equality predicates, sort needs, and measured execution plans."
    ],
    source: "https://www.postgresql.org/docs/current/indexes-multicolumn.html",
    hardChoice: {
      prompt: "An index is on (customer_id, created_at). Which query most directly uses a leading equality followed by an ordered range?",
      options: [
        "WHERE customer_id = 7 AND created_at >= DATE '2026-01-01'",
        "WHERE EXTRACT(YEAR FROM created_at) = 2026 with no customer predicate",
        "WHERE unrelated_comment LIKE '%urgent%'"
      ],
      answer: "WHERE customer_id = 7 AND created_at >= DATE '2026-01-01'",
      explanation: "The index groups entries by customer_id and orders created_at within each customer. Constraining the leading key by equality lets the range scan start and stop within that customer\u2019s section.",
      hint: "Read the index key order from left to right."
    }
  },
  {
    title: "Advantages and Disadvantages of Indexing",
    module: "Indexing",
    summary: "Indexes exchange storage and write maintenance for faster selected reads and constraint enforcement. Their value depends on actual queries and data distribution.",
    mechanism: "An index can reduce scanned rows, support ordering, or permit an index-only scan when visibility and covered-column requirements are met. The optimizer estimates these costs.",
    tradeoff: "Unused or redundant indexes increase insert, update, delete, vacuum, and backup costs. A covering index can improve reads but widens entries and may worsen write amplification.",
    example: "Use EXPLAIN (ANALYZE, BUFFERS) SELECT ... in a safe environment to compare actual time and page reads before and after an index.",
    easy: [
      "Which operation commonly becomes more expensive after adding many indexes?",
      "INSERT",
      "Reading a cached constant",
      "Parsing a table alias"
    ],
    medium: [
      "What evidence best supports adding an index?",
      "A representative execution plan and measured workload",
      "The table having a long name",
      "The frontend using a dark theme"
    ],
    hard: [
      "Why can an index-only scan still fetch heap pages in PostgreSQL?",
      "The index does not by itself establish whether a tuple is visible to the transaction. Pages not marked all-visible in the visibility map require heap visibility checks."
    ],
    source: "https://www.postgresql.org/docs/current/indexes-index-only-scans.html"
  },
  {
    title: "Transactions",
    module: "Transactions and Concurrency",
    summary: "A transaction groups operations into one unit of work that commits or rolls back together. It keeps related business changes consistent despite errors.",
    mechanism: "BEGIN starts an explicit transaction; COMMIT makes its effects durable under the configured durability settings; ROLLBACK discards uncommitted changes. Concurrency control determines which intermediate states are visible.",
    tradeoff: "Transactions should be short and avoid slow network calls while holding locks. An HTTP retry also needs idempotency because the client may not know whether a commit succeeded.",
    example: "BEGIN;\nUPDATE accounts SET balance = balance - 50 WHERE id = 1;\nUPDATE accounts SET balance = balance + 50 WHERE id = 2;\nCOMMIT;",
    easy: [
      "What does ROLLBACK do?",
      "Discards the transaction\u2019s uncommitted changes",
      "Deletes every committed table",
      "Commits only the first statement"
    ],
    medium: [
      "Why is a payment idempotency key useful even with transactions?",
      "A client may retry after an uncertain successful commit",
      "Transactions cannot update two rows",
      "It automatically increases the isolation level"
    ],
    hard: [
      "A client times out just after COMMIT. Should it blindly retry a transfer?",
      "No. The commit may have succeeded. Use a unique operation or idempotency key and query or safely replay that operation so the same transfer cannot be applied twice."
    ],
    source: "https://www.postgresql.org/docs/current/tutorial-transactions.html"
  },
  {
    title: "ACID Properties",
    module: "Transactions and Concurrency",
    summary: "ACID summarizes atomicity, consistency, isolation, and durability. These properties address different failure and concurrency concerns.",
    mechanism: "Atomicity prevents partial commits; consistency means enforced invariants hold before and after valid transactions; isolation controls interference; durability preserves acknowledged commits within configured guarantees.",
    tradeoff: "ACID consistency is not the same term as CAP consistency. A DBMS can enforce declared constraints but cannot infer all application business rules.",
    example: "A transfer must update both balances atomically, preserve the total through correct logic, isolate conflicting transactions, and survive a database restart after commit.",
    easy: [
      "Which ACID property prevents a half-completed transfer?",
      "Atomicity",
      "Isolation alone",
      "CAP availability"
    ],
    medium: [
      "Does ACID consistency automatically enforce an undeclared business rule?",
      "No, the rule must be expressed in constraints or correct transaction logic",
      "Yes, the DBMS infers business intent",
      "Only if the rule is written in a README"
    ],
    hard: [
      "Can a transaction be atomic yet permit a lost update?",
      "Yes. Atomicity concerns all-or-nothing effects within a transaction; insufficient concurrency control can still allow one transaction to overwrite another. Choose atomic updates, locks, versions, or suitable isolation."
    ],
    source: "https://www.postgresql.org/docs/current/transaction-iso.html"
  },
  {
    title: "Transaction Lifecycle",
    module: "Transactions and Concurrency",
    summary: "A transaction moves from active execution toward commit or abort, with recovery machinery ensuring that incomplete work is not treated as committed.",
    mechanism: "The textbook states are active, partially committed, committed, failed, and aborted. Write-ahead logging records recovery information before corresponding data pages must reach durable storage.",
    tradeoff: "A statement finishing is not equivalent to the transaction committing. In PostgreSQL, many statement errors leave the transaction aborted until ROLLBACK or recovery to a savepoint.",
    example: "BEGIN; SAVEPOINT before_item;\n-- A recoverable operation may fail.\nROLLBACK TO SAVEPOINT before_item;\nCOMMIT;",
    easy: [
      "Does a successful UPDATE necessarily mean the surrounding transaction committed?",
      "No",
      "Yes, in every explicit transaction",
      "Only if it modifies one row"
    ],
    medium: [
      "What can recover from a statement error without discarding all earlier transaction work?",
      "A previously established savepoint where supported",
      "An ORDER BY clause",
      "A second primary key"
    ],
    hard: [
      "Why can committed data survive without every changed table page being flushed immediately?",
      "A durable write-ahead log contains sufficient redo information. Recovery replays committed changes after a crash; the exact guarantees depend on WAL and synchronous commit configuration."
    ],
    source: "https://www.postgresql.org/docs/current/wal-intro.html"
  },
  {
    title: "Isolation Levels",
    module: "Transactions and Concurrency",
    summary: "Isolation levels define which effects of concurrent transactions a transaction may observe. Stronger isolation prevents more anomalies but can require waiting or retries.",
    mechanism: "SQL names Read Uncommitted, Read Committed, Repeatable Read, and Serializable. PostgreSQL maps Read Uncommitted to Read Committed; its Repeatable Read uses a stable snapshot but can still permit serialization anomalies.",
    tradeoff: "Serializable execution is equivalent to some serial order of committed transactions, not necessarily literal one-at-a-time processing. Applications must retry serialization failures.",
    example: "Two doctors must not both go off call based on a snapshot showing the other on call; serializable isolation can reject this write-skew pattern.",
    easy: [
      "What does Serializable aim to guarantee?",
      "Committed results equivalent to some serial transaction order",
      "Every transaction executes on one CPU thread",
      "No transaction ever retries"
    ],
    medium: [
      "Does PostgreSQL Repeatable Read prevent every serialization anomaly?",
      "No, write skew can remain",
      "Yes, it is identical to Serializable",
      "Only if SELECT has LIMIT"
    ],
    hard: [
      "How should an application handle a serialization failure?",
      "Roll back and retry the entire transaction using a bounded retry policy. Recompute all reads because retrying only the final write can preserve the invalid earlier assumptions."
    ],
    source: "https://www.postgresql.org/docs/current/transaction-iso.html",
    hardChoice: {
      prompt: "Two transactions each see that another doctor is on call, then each updates a different row to go off call. Which PostgreSQL strategy can reject this write-skew anomaly?",
      options: [
        "Serializable transactions with whole-transaction retries",
        "Repeatable Read alone guarantees this invariant",
        "Read Committed with two unrelated SELECT statements"
      ],
      answer: "Serializable transactions with whole-transaction retries",
      explanation: "A stable snapshot alone can allow both transactions to update different rows. PostgreSQL Serializable detects serialization anomalies and may abort one transaction, so the application must retry the entire transaction.",
      hint: "Protect the cross-row invariant rather than only repeating one row read."
    }
  },
  {
    title: "Dirty Reads",
    module: "Transactions and Concurrency",
    summary: "A dirty read observes another transaction\u2019s uncommitted data. The value may later disappear if that transaction rolls back.",
    mechanism: "A transaction updates a row but has not committed; a weaker reader sees that value and makes a decision. Rollback leaves the reader relying on data that never became committed.",
    tradeoff: "PostgreSQL does not expose dirty reads even when Read Uncommitted is requested. Avoid assuming identical isolation behavior across engines.",
    example: "Transaction A changes stock from 10 to 0 then rolls back; a dirty reader would incorrectly report sold out.",
    easy: [
      "What makes a read dirty?",
      "It sees another transaction\u2019s uncommitted change",
      "It uses an old committed snapshot",
      "It reads through an index"
    ],
    medium: [
      "What does PostgreSQL do for requested Read Uncommitted?",
      "It uses Read Committed semantics",
      "It exposes all uncommitted tuples",
      "It disables WAL"
    ],
    hard: [
      "Why is an old committed snapshot not a dirty read?",
      "A snapshot may be stale relative to the latest commit, but its visible data was committed. Dirty reads specifically depend on changes that are still uncommitted and might roll back."
    ],
    source: "https://www.postgresql.org/docs/current/transaction-iso.html"
  },
  {
    title: "Non-repeatable Reads",
    module: "Transactions and Concurrency",
    summary: "A non-repeatable read occurs when reading the same row again returns a different committed value because another transaction changed or deleted it.",
    mechanism: "At Read Committed, successive statements may use different snapshots. Another transaction can commit a row update between two SELECT statements.",
    tradeoff: "A stable transaction snapshot prevents this anomaly, but does not alone prevent every multi-row invariant violation or write-skew anomaly.",
    example: "SELECT price FROM products WHERE id=5; returns 20, then returns 25 later in the same Read Committed transaction.",
    easy: [
      "What changes in a non-repeatable read?",
      "A previously read row\u2019s committed value",
      "Only the SQL query text",
      "Only uncommitted data"
    ],
    medium: [
      "How does PostgreSQL Repeatable Read address repeated row reads?",
      "It uses a stable transaction snapshot",
      "It locks the whole database for every SELECT",
      "It removes all indexes"
    ],
    hard: [
      "Is locking just one product row enough for a rule involving all products?",
      "Not necessarily. A row lock protects that row from conflicting changes, but a multi-row invariant may need locking a broader logical resource or serializable isolation with retries."
    ],
    source: "https://www.postgresql.org/docs/current/transaction-iso.html"
  },
  {
    title: "Phantom Reads",
    module: "Transactions and Concurrency",
    summary: "A phantom read occurs when rerunning a predicate query returns a changed set of matching rows because another transaction inserted, deleted, or changed rows.",
    mechanism: "The anomaly concerns a predicate range rather than just one existing row. Locking currently matched rows may not prevent a new row from entering the range.",
    tradeoff: "Behavior is engine-specific: PostgreSQL Repeatable Read prevents phantom reads through a stable snapshot, although its level can still allow other serialization anomalies.",
    example: "SELECT COUNT(*) FROM bookings WHERE room_id=1 AND day=DATE '2026-11-17'; changes after another transaction inserts a matching booking.",
    easy: [
      "What distinguishes a phantom read from a changed-row read?",
      "The set matching a predicate changes",
      "A column becomes a primary key",
      "A transaction reads its own write"
    ],
    medium: [
      "Why may locking all currently matching booking rows be insufficient?",
      "A new row can be inserted into an uncovered predicate range",
      "SELECT cannot use predicates",
      "Locks always permit changes to the exact locked row"
    ],
    hard: [
      "How can you prevent two transactions from booking an initially empty slot?",
      "Use a unique or exclusion constraint that represents the invariant, lock a stable parent resource, or use serializable transactions with retries. Locking an empty result set alone does not lock a future row."
    ],
    source: "https://www.postgresql.org/docs/current/transaction-iso.html"
  },
  {
    title: "Lost Update Problem",
    module: "Transactions and Concurrency",
    summary: "A lost update occurs when concurrent read-modify-write operations overwrite each other because both were based on an earlier value.",
    mechanism: "Two clients read balance 100; one writes 110 and another writes 120. The intended two increments total 130, but one update is lost if both write absolute values without coordination.",
    tradeoff: "Use atomic arithmetic, SELECT FOR UPDATE in a transaction, optimistic version checks, or appropriate isolation. The correct choice depends on the business operation and conflict frequency.",
    example: "UPDATE counters SET value=value+1 WHERE id=7; avoids a client-side read followed by an absolute replacement for a simple increment.",
    easy: [
      "Which pattern commonly causes a lost update?",
      "Concurrent reads followed by unchecked absolute writes",
      "A single atomic increment statement",
      "A declared NOT NULL constraint"
    ],
    medium: [
      "How can a version column detect conflicting edits?",
      "UPDATE ... WHERE id=? AND version=? and check affected rows",
      "Ignore the update row count",
      "Use ORDER BY version without a predicate"
    ],
    hard: [
      "Why is an atomic increment insufficient for a transfer with an insufficient-funds rule?",
      "The operation must also enforce balance eligibility and coordinate both accounts transactionally. Use a conditional debit and check its result, then credit within the same transaction, with a stable lock order if locking multiple rows."
    ],
    source: "https://www.postgresql.org/docs/current/explicit-locking.html"
  },
  {
    title: "Two-Phase Locking",
    module: "Transactions and Concurrency",
    summary: "Two-phase locking separates a transaction into a growing phase that acquires locks and a shrinking phase that releases them without acquiring new locks. It provides conflict serializability under its assumptions.",
    mechanism: "Strict two-phase locking holds exclusive locks until commit or abort, avoiding dirty writes and cascading aborts. Transactions can still wait for each other.",
    tradeoff: "Two-phase locking can deadlock; deadlock detection or prevention is still required. It is unrelated to the distributed two-phase commit protocol.",
    example: "T1 locks account A, then account B; it performs both updates before releasing write locks at commit.",
    easy: [
      "What is forbidden after the shrinking phase begins in basic two-phase locking?",
      "Acquiring a new lock",
      "Releasing an existing lock",
      "Finishing the transaction"
    ],
    medium: [
      "Does two-phase locking automatically prevent deadlocks?",
      "No",
      "Yes, because it has two phases",
      "Only for transactions with indexes"
    ],
    hard: [
      "How is two-phase locking different from two-phase commit?",
      "Two-phase locking is a concurrency-control protocol for serializable schedules. Two-phase commit coordinates a distributed commit decision across participants and can block if the coordinator fails."
    ],
    source: "https://www.postgresql.org/docs/current/explicit-locking.html"
  },
  {
    title: "Optimistic vs Pessimistic Locking",
    module: "Transactions and Concurrency",
    summary: "Pessimistic concurrency control acquires locks before conflicting changes. Optimistic control allows work to proceed and detects conflicts before committing the result.",
    mechanism: "A version predicate provides optimistic conflict detection; SELECT FOR UPDATE provides a common pessimistic row-locking pattern. Conflicted optimistic updates must be retried or presented for resolution.",
    tradeoff: "Optimistic control suits rare conflicts and long user editing periods. Pessimistic locks can reduce wasted work under contention but should not be held while waiting for human input.",
    example: "UPDATE documents SET body=?, version=version+1 WHERE id=? AND version=?; zero affected rows means the edit was stale.",
    easy: [
      "What signals an optimistic version conflict?",
      "An update with the expected version affects zero rows",
      "The table has a foreign key",
      "A SELECT returns a string"
    ],
    medium: [
      "Which approach better fits a user editing a form for ten minutes?",
      "Version-based optimistic checking",
      "Holding a database row lock throughout typing",
      "Disabling all concurrent users"
    ],
    hard: [
      "When might pessimistic locking outperform optimistic retries?",
      "Under frequent conflicts with short critical sections, locking early can avoid repeatedly computing work that will be rejected. It still needs a consistent lock order, timeout handling, and short transactions."
    ],
    source: "https://www.postgresql.org/docs/current/explicit-locking.html"
  },
  {
    title: "Database Deadlocks",
    module: "Transactions and Concurrency",
    summary: "A database deadlock is a cycle of transactions waiting for locks held by one another. None can proceed until one is aborted or releases its locks.",
    mechanism: "A wait-for graph contains an edge when one transaction waits for another. A cycle indicates deadlock in the usual exclusive-lock model; the DBMS selects a victim and rolls it back.",
    tradeoff: "Acquire shared resources in a consistent order and keep transactions short. Applications should retry a deadlock victim\u2019s entire transaction safely.",
    example: "T1 locks account 1 then requests 2; T2 locks account 2 then requests 1. Lock both accounts in ascending id order to avoid that cycle.",
    easy: [
      "What characterizes a lock deadlock?",
      "A cycle of transactions waiting on each other",
      "Any query taking more than one second",
      "A read-only table with no sessions"
    ],
    medium: [
      "What practical rule reduces multi-row update deadlocks?",
      "Acquire row locks in a consistent order",
      "Randomize the lock order each time",
      "Keep transactions open while calling external APIs"
    ],
    hard: [
      "Why does adding a timeout not prove deadlock prevention?",
      "A timeout limits waiting but can abort a transaction even without a cycle. Deadlock prevention changes acquisition rules; detection recognizes cycles and chooses a victim."
    ],
    source: "https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS"
  },
  {
    title: "CAP Theorem",
    module: "Additional Concepts",
    summary: "During a network partition, a distributed read/write system cannot guarantee both linearizable consistency and availability for every request under the theorem\u2019s assumptions.",
    mechanism: "Consistency here means operations appear to occur atomically in a single real-time-respecting order. Availability requires every request received by a nonfailed node to eventually receive a successful response; partitions delay or drop communication.",
    tradeoff: "CAP is a choice during a partition, not a general pick-any-two menu. Outside partitions, systems still make latency, consistency, and operational trade-offs.",
    example: "If replicas cannot communicate, accepting conflicting writes on both sides favors availability; refusing some requests can preserve a single consistent order.",
    easy: [
      "When does the CAP trade-off become unavoidable?",
      "During a network partition",
      "Whenever a table has two columns",
      "Only during a SQL join"
    ],
    medium: [
      "What does the C in CAP refer to?",
      "Linearizable consistency",
      "Every declared business constraint",
      "Column compression"
    ],
    hard: [
      "Why is calling an entire database simply CP or AP incomplete?",
      "Behavior can depend on operation type, configuration, quorum rules, and failure mode. Explain what happens to reads and writes during a partition and what consistency contract remains outside it."
    ],
    source: "https://www.cs.cornell.edu/courses/cs5414/2014fa/papers/Gilbert_Lynch_CAP.pdf",
    hardChoice: {
      prompt: "Two healthy replicas are partitioned and cannot exchange messages. If both must return successful writes independently, which CAP guarantee cannot also be assured?",
      options: [
        "A single linearizable history respecting real-time order",
        "Local storage durability under every circumstance",
        "That the database has a query language"
      ],
      answer: "A single linearizable history respecting real-time order",
      explanation: "Without communication, independently successful conflicting writes cannot always preserve the single real-time-respecting order required by linearizability. CAP\u2019s unavoidable choice concerns availability versus linearizability during the partition.",
      hint: "CAP consistency means linearizability, not simply valid field types."
    }
  },
  {
    title: "Sharding",
    module: "Additional Concepts",
    summary: "Sharding distributes different subsets of a logical dataset across independent database partitions. It scales capacity by dividing ownership of data.",
    mechanism: "A shard key maps a record to a shard using ranges, hashing, or a directory. Routing, resharding, cross-shard queries, and transactions become explicit engineering concerns.",
    tradeoff: "A poor key creates hot shards or makes common queries scatter across all shards. Replication copies data; sharding divides data, and systems often use both.",
    example: "Shard orders by tenant_id when most requests remain within one tenant, while planning for exceptionally large tenants.",
    easy: [
      "What is the main distinction between sharding and replication?",
      "Sharding divides data; replication copies data",
      "Both always copy all data everywhere",
      "Replication removes all routing needs"
    ],
    medium: [
      "Which shard key can create a hot shard for append-only traffic?",
      "A monotonically increasing timestamp with naive range placement",
      "A well-distributed hash in every workload",
      "A random key by definition always fails"
    ],
    hard: [
      "How would you choose a shard key for a multi-tenant application?",
      "Start with frequent query predicates and tenant isolation, estimate tenant size and write skew, consider cross-tenant analytics, and plan key immutability and rebalancing. Tenant id alone may need an escape strategy for giant tenants."
    ],
    source: "https://www.mongodb.com/docs/manual/sharding/"
  },
  {
    title: "Replication",
    module: "Additional Concepts",
    summary: "Replication maintains copies of data on multiple nodes for availability, recovery, or read scaling. It does not automatically increase write capacity or eliminate stale reads.",
    mechanism: "A primary can stream changes to replicas synchronously or asynchronously. Synchronous acknowledgment can reduce data-loss windows but adds latency and depends on the selected quorum or replica policy.",
    tradeoff: "An asynchronously replicated reader can lag behind a recent write. Read-your-writes guarantees require routing or consistency mechanisms rather than assuming all copies are current.",
    example: "Send a user\u2019s post-save confirmation read to the primary, or wait for a replica to reach the write\u2019s log position.",
    easy: [
      "What can happen with asynchronous replication?",
      "A replica temporarily returns older committed data",
      "Every replica instantly confirms every write",
      "The primary has no persistent storage"
    ],
    medium: [
      "What trade-off often accompanies synchronous replication?",
      "Higher commit latency for stronger acknowledgment guarantees",
      "No communication overhead",
      "Guaranteed availability during every partition"
    ],
    hard: [
      "Why is failover not just changing a connection string?",
      "You must determine a safe new primary, prevent the old primary from accepting conflicting writes, account for replication lag, and redirect clients. Fencing and recovery policies prevent split brain."
    ],
    source: "https://www.postgresql.org/docs/current/high-availability.html"
  },
  {
    title: "Database Partitioning",
    module: "Additional Concepts",
    summary: "Partitioning splits one logical table into smaller physical pieces, commonly by ranges, lists, or hashes. Queries can skip irrelevant partitions when predicates allow pruning.",
    mechanism: "A partition key determines placement. Local indexes cover each partition, and the optimizer prunes partitions that cannot match a query; exact constraints vary by database engine.",
    tradeoff: "Partitioning is not the same as distributing shards across independent servers. Too many partitions add planning and maintenance overhead, and cross-partition uniqueness may have restrictions.",
    example: "Partition event_log by month so old months can be detached or dropped efficiently and recent queries scan fewer partitions.",
    easy: [
      "What is partition pruning?",
      "Skipping partitions that cannot satisfy a query",
      "Deleting every unmatched row",
      "Copying every partition to every server"
    ],
    medium: [
      "Why does a monthly time partition not automatically speed a query without a time filter?",
      "The query may need to inspect all partitions",
      "The table becomes impossible to query",
      "Partitioned tables cannot have indexes"
    ],
    hard: [
      "What should you check before requiring globally unique ids on a partitioned table?",
      "The engine\u2019s constraint rules: some require the partition key in a unique constraint because uniqueness is enforced by per-partition indexes. Choose the key design or a separate global identity mechanism accordingly."
    ],
    source: "https://www.postgresql.org/docs/current/ddl-partitioning.html"
  },
  {
    title: "Database Views",
    module: "Additional Concepts",
    summary: "A view gives a named query the appearance of a table. It can simplify repeated logic and expose a deliberate subset of data.",
    mechanism: "A regular view generally stores its query definition rather than a separate result set. A materialized view stores query results and needs an explicit refresh policy.",
    tradeoff: "A view is not automatically a performance optimization or a complete security boundary. Understand underlying permissions, security-invoker behavior, and whether updates are supported.",
    example: "CREATE VIEW active_students AS SELECT id, name FROM students WHERE active=true;",
    easy: [
      "What does a normal PostgreSQL view primarily store?",
      "A query definition",
      "A permanently frozen copy of all rows",
      "A second independent database server"
    ],
    medium: [
      "What extra maintenance does a materialized view require?",
      "Refreshing stored results when freshness is needed",
      "Dropping every source-table constraint",
      "Changing all primary keys each hour"
    ],
    hard: [
      "When would a materialized view help a dashboard?",
      "When expensive aggregates can be reused and some staleness is acceptable. Define the refresh cadence, concurrent refresh prerequisites, indexes, and the user-visible freshness contract."
    ],
    source: "https://www.postgresql.org/docs/current/sql-createview.html"
  },
  {
    title: "Stored Procedures",
    module: "Additional Concepts",
    summary: "Stored procedures package operations that execute inside the database. They can centralize data-intensive workflows and reduce application-to-database round trips.",
    mechanism: "PostgreSQL invokes procedures using CALL; functions are invoked in expressions or queries and have different capabilities. Transaction control inside procedures is allowed only in specific calling contexts.",
    tradeoff: "Database-side logic can improve locality but increases coupling to database tooling, privileges, and deployment practices. Use explicit permissions and versioned migrations for changes.",
    example: "CALL transfer_funds(1, 2, 50); can wrap a reviewed server-side workflow while the schema still enforces invariants.",
    easy: [
      "How is a PostgreSQL procedure invoked?",
      "CALL procedure_name(...)",
      "Only with SELECT * FROM",
      "By adding an index"
    ],
    medium: [
      "Why distinguish procedures from SQL functions?",
      "Their invocation and transaction-control capabilities differ",
      "Functions cannot read tables",
      "Procedures always bypass permissions"
    ],
    hard: [
      "What security risk arises in privileged database routines?",
      "Overbroad privileges or unsafe name resolution can expose unintended operations. Limit grants, validate inputs, use schema-qualified names, and configure a safe search_path for security-definer routines."
    ],
    source: "https://www.postgresql.org/docs/current/sql-createprocedure.html"
  }
];

// content/database-helper.ts
function buildDatabaseLessons(subjectId, seeds3) {
  return seeds3.map((seed) => {
    const id2 = `${subjectId}-${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const makeChoice = (level, input) => ({
      // Construct consistent multiple-choice metadata around topic-specific questions.
      id: `${id2}-${level.toLowerCase()}`,
      // Connect question attempts to this exact curriculum record.
      difficulty: level,
      // Keep Easy and Medium accessible without prerequisite locks.
      type: "mcq",
      // Ask the backend to score an exact choice rather than grade free text automatically.
      prompt: input[0],
      // Show the authored topic-specific checkpoint question.
      options: [input[1], input[2], input[3]],
      // Preserve the three meaningful choices; assessment code may shuffle their order.
      answer: input[1],
      // Keep the correct reference value independent of display order.
      explanation: level === "Easy" ? seed.mechanism : seed.tradeoff,
      // Explain the concept behind the answer after submission.
      hint: level === "Easy" ? seed.summary : seed.mechanism
      // Point the learner back to relevant material without grading their response.
    });
    return {
      // Return the complete learning material consumed by both API and React pages.
      id: id2,
      // Reuse this identifier for notes, bookmarks, progress, and attempts.
      title: seed.title,
      // Display the curriculum topic name.
      subjectId,
      // Associate this record with DBMS or NoSQL.
      module: seed.module,
      // Preserve the subject's module hierarchy.
      minutes: 7,
      // Give the learner a conservative estimate for reading and reflecting on this concise lesson.
      difficulty: seed.module.includes("Fundamentals") ? "Easy" : "Medium",
      // Suggest a starting level while keeping all questions available.
      overview: seed.summary,
      // Introduce the lesson in a concise paragraph.
      sections: [
        // Separate internal behavior from engineering consequences.
        { title: "How it works", body: seed.mechanism },
        // Explain the central mechanism with correct terminology.
        { title: "Design implications", body: seed.tradeoff }
        // Connect the theory to a practical design decision.
      ],
      // Finish the structured explanatory sections.
      example: seed.example,
      // Show a concrete example that can be discussed in an interview.
      interview: [{ question: seed.hard[0], answer: seed.hard[1], followUp: `Which assumption in this example would change your choice of ${seed.title.toLowerCase()}?` }],
      // Encourage the learner to justify trade-offs beyond memorized definitions.
      revision: [seed.summary, seed.tradeoff],
      // Preserve two concept-specific notes for later revision.
      resources: [{ title: "Reference documentation", url: seed.source }],
      // Provide an independent source to verify and extend the lesson.
      questions: [
        // Include all three difficulty levels in every lesson.
        makeChoice("Easy", seed.easy),
        // Check the core definition using a topic-specific question.
        makeChoice("Medium", seed.medium),
        // Test an applied design or behavior question.
        ...seed.hardChoice ? [{ ...seed.hardChoice, id: `${id2}-hard-mcq`, difficulty: "Hard", type: "mcq" }] : [],
        // Include an authored advanced multiple-choice scenario when this lesson supplies one.
        { id: `${id2}-hard`, difficulty: "Hard", type: "descriptive", prompt: seed.hard[0], answer: seed.hard[1], explanation: seed.hard[1], hint: seed.tradeoff }
        // Require explicit comparison with a reference answer before self-assessing a descriptive response.
      ]
      // Finish the checkpoint collection.
    };
  });
}

// content/dbms.ts
var dbmsTopics = buildDatabaseLessons("dbms", dbms_data_default);

// content/sql-data.json
var sql_data_default = [
  {
    id: "sql-sql-commands",
    title: "SQL Commands",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "SQL is a declarative language for defining, querying, modifying, and securing relational data. You describe the result rather than a particular iteration algorithm.",
    sections: [
      {
        title: "How it works",
        body: "CREATE defines database objects; SELECT reads rows; INSERT, UPDATE, and DELETE change data. GRANT and REVOKE manage privileges. COMMIT and ROLLBACK control transaction boundaries."
      },
      {
        title: "Practical considerations",
        body: "SQL dialects differ. PostgreSQL supports transactional DDL, while some other systems implicitly commit certain schema changes. Read your database documentation before assuming portable behavior."
      }
    ],
    example: "CREATE TABLE students (id integer PRIMARY KEY, name text NOT NULL);\nINSERT INTO students VALUES (1, 'Asha');\nSELECT name FROM students WHERE id = 1;",
    interview: [
      {
        question: "How would you safely change a large set of rows in production?",
        answer: "First SELECT the target rows with the intended predicate, inspect the execution plan and row count, then run a bounded UPDATE within a transaction. Validate the result before commit; account for locks, backups, and rollback cost.",
        followUp: "Why can a missing WHERE clause be dangerous?"
      }
    ],
    revision: [
      "SELECT",
      "UPDATE",
      "SQL dialects differ. PostgreSQL supports transactional DDL, while some other systems implicitly commit certain schema changes. Read your database documentation before assuming portable behavior."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-sql-commands-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which command retrieves rows?",
        options: [
          "SELECT",
          "CREATE",
          "GRANT",
          "COMMIT"
        ],
        answer: "SELECT",
        explanation: "CREATE defines database objects; SELECT reads rows; INSERT, UPDATE, and DELETE change data. GRANT and REVOKE manage privileges. COMMIT and ROLLBACK control transaction boundaries.",
        hint: "SQL is a declarative language for defining, querying, modifying, and securing relational data. You describe the result rather than a particular iteration algorithm."
      },
      {
        id: "sql-sql-commands-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which operation changes existing rows without redefining a table?",
        options: [
          "UPDATE",
          "ALTER DATABASE",
          "SELECT",
          "REVOKE"
        ],
        answer: "UPDATE",
        explanation: "SQL dialects differ. PostgreSQL supports transactional DDL, while some other systems implicitly commit certain schema changes. Read your database documentation before assuming portable behavior.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-sql-commands-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you safely change a large set of rows in production?",
        answer: "First SELECT the target rows with the intended predicate, inspect the execution plan and row count, then run a bounded UPDATE within a transaction. Validate the result before commit; account for locks, backups, and rollback cost.",
        explanation: "CREATE defines database objects; SELECT reads rows; INSERT, UPDATE, and DELETE change data. GRANT and REVOKE manage privileges. COMMIT and ROLLBACK control transaction boundaries. SQL dialects differ. PostgreSQL supports transactional DDL, while some other systems implicitly commit certain schema changes. Read your database documentation before assuming portable behavior.",
        hint: "Why can a missing WHERE clause be dangerous?"
      }
    ]
  },
  {
    id: "sql-ddl-dml-dcl-tcl",
    title: "DDL, DML, DCL, TCL",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "SQL command families separate schema definitions, row operations, privileges, and transaction management. This classification helps explain the effect and permission requirements of a statement.",
    sections: [
      {
        title: "How it works",
        body: "DDL includes CREATE, ALTER, and DROP. DML commonly includes INSERT, UPDATE, and DELETE; SELECT is sometimes classified separately as DQL. DCL includes GRANT and REVOKE. TCL includes COMMIT, ROLLBACK, and SAVEPOINT."
      },
      {
        title: "Practical considerations",
        body: "These are teaching categories rather than universal execution guarantees. In PostgreSQL most DDL can be rolled back, but CREATE DATABASE cannot run inside a transaction block."
      }
    ],
    example: "BEGIN;\nSAVEPOINT before_change;\nUPDATE accounts SET balance = balance - 50 WHERE id = 1;\nROLLBACK TO SAVEPOINT before_change;\nCOMMIT;",
    interview: [
      {
        question: "Why is DDL versus DML insufficient to predict rollback behavior?",
        answer: "The classification describes intent, not the engine\u2019s transaction semantics. For example PostgreSQL can roll back CREATE TABLE, while some databases implicitly commit DDL. Check the specific statement and engine.",
        followUp: "What happens to locks after rolling back to a savepoint?"
      }
    ],
    revision: [
      "DDL",
      "SAVEPOINT",
      "These are teaching categories rather than universal execution guarantees. In PostgreSQL most DDL can be rolled back, but CREATE DATABASE cannot run inside a transaction block."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-ddl-dml-dcl-tcl-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which family changes table structure?",
        options: [
          "DDL",
          "DCL",
          "TCL",
          "DQL"
        ],
        answer: "DDL",
        explanation: "DDL includes CREATE, ALTER, and DROP. DML commonly includes INSERT, UPDATE, and DELETE; SELECT is sometimes classified separately as DQL. DCL includes GRANT and REVOKE. TCL includes COMMIT, ROLLBACK, and SAVEPOINT.",
        hint: "SQL command families separate schema definitions, row operations, privileges, and transaction management. This classification helps explain the effect and permission requirements of a statement."
      },
      {
        id: "sql-ddl-dml-dcl-tcl-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which command establishes an intermediate rollback point?",
        options: [
          "SAVEPOINT",
          "GRANT",
          "SELECT",
          "DROP"
        ],
        answer: "SAVEPOINT",
        explanation: "These are teaching categories rather than universal execution guarantees. In PostgreSQL most DDL can be rolled back, but CREATE DATABASE cannot run inside a transaction block.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-ddl-dml-dcl-tcl-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why is DDL versus DML insufficient to predict rollback behavior?",
        answer: "The classification describes intent, not the engine\u2019s transaction semantics. For example PostgreSQL can roll back CREATE TABLE, while some databases implicitly commit DDL. Check the specific statement and engine.",
        explanation: "DDL includes CREATE, ALTER, and DROP. DML commonly includes INSERT, UPDATE, and DELETE; SELECT is sometimes classified separately as DQL. DCL includes GRANT and REVOKE. TCL includes COMMIT, ROLLBACK, and SAVEPOINT. These are teaching categories rather than universal execution guarantees. In PostgreSQL most DDL can be rolled back, but CREATE DATABASE cannot run inside a transaction block.",
        hint: "What happens to locks after rolling back to a savepoint?"
      }
    ]
  },
  {
    id: "sql-select",
    title: "SELECT",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "SELECT constructs a result set from source rows. Projection chooses columns or expressions; filtering, grouping, and ordering shape the result.",
    sections: [
      {
        title: "How it works",
        body: "A conceptual query order is FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, then LIMIT. The optimizer may execute a different physical plan while preserving semantics."
      },
      {
        title: "Practical considerations",
        body: "SELECT * couples consumers to schema changes and may fetch unnecessary data. A query without ORDER BY has no guaranteed row order, even if repeated executions appear stable."
      }
    ],
    example: "SELECT id, price * quantity AS total\nFROM order_items\nWHERE quantity > 0\nORDER BY total DESC;",
    interview: [
      {
        question: "Explain logical query processing versus physical execution.",
        answer: "Logical processing defines the meaning of clauses. An optimizer may reorder inner joins, push filters, and use indexes so long as the returned result obeys that meaning. Outer joins and volatile expressions constrain legal transformations.",
        followUp: "Why does a filter on the right side of a LEFT JOIN behave differently in WHERE?"
      }
    ],
    revision: [
      "Output expressions and columns",
      "No; WHERE is logically evaluated before the SELECT alias",
      "SELECT * couples consumers to schema changes and may fetch unnecessary data. A query without ORDER BY has no guaranteed row order, even if repeated executions appear stable."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-select-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What does the SELECT list choose?",
        options: [
          "Output expressions and columns",
          "Physical storage pages",
          "Index lock modes",
          "Transaction isolation"
        ],
        answer: "Output expressions and columns",
        explanation: "A conceptual query order is FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, then LIMIT. The optimizer may execute a different physical plan while preserving semantics.",
        hint: "SELECT constructs a result set from source rows. Projection chooses columns or expressions; filtering, grouping, and ordering shape the result."
      },
      {
        id: "sql-select-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Can a SELECT alias normally be used in the same query\u2019s WHERE clause?",
        options: [
          "No; WHERE is logically evaluated before the SELECT alias",
          "Yes, in all SQL engines",
          "Only when the alias is uppercase",
          "Only with LIMIT"
        ],
        answer: "No; WHERE is logically evaluated before the SELECT alias",
        explanation: "SELECT * couples consumers to schema changes and may fetch unnecessary data. A query without ORDER BY has no guaranteed row order, even if repeated executions appear stable.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-select-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Explain logical query processing versus physical execution.",
        answer: "Logical processing defines the meaning of clauses. An optimizer may reorder inner joins, push filters, and use indexes so long as the returned result obeys that meaning. Outer joins and volatile expressions constrain legal transformations.",
        explanation: "A conceptual query order is FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, then LIMIT. The optimizer may execute a different physical plan while preserving semantics. SELECT * couples consumers to schema changes and may fetch unnecessary data. A query without ORDER BY has no guaranteed row order, even if repeated executions appear stable.",
        hint: "Why does a filter on the right side of a LEFT JOIN behave differently in WHERE?"
      }
    ]
  },
  {
    id: "sql-where",
    title: "WHERE",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "WHERE retains rows whose predicate evaluates to TRUE before grouping. FALSE and UNKNOWN rows are excluded.",
    sections: [
      {
        title: "How it works",
        body: "Combine predicates with AND, OR, and NOT. SQL uses three-valued logic because comparisons involving NULL usually evaluate to UNKNOWN; use IS NULL rather than = NULL."
      },
      {
        title: "Practical considerations",
        body: "AND has higher precedence than OR. Explicit parentheses prevent accidental widening of a filter, especially in updates and authorization predicates."
      }
    ],
    example: "SELECT * FROM employees\nWHERE active = true AND (department = 'Engineering' OR department = 'Data');",
    interview: [
      {
        question: "Why can NOT IN unexpectedly return no rows when its subquery contains NULL?",
        answer: "NOT IN behaves like a conjunction of inequality comparisons. A NULL makes at least one comparison UNKNOWN, so candidate rows may not satisfy TRUE. Prefer NOT EXISTS with an explicit correlation when nullable values are possible.",
        followUp: "How does NOT EXISTS differ for nullable values?"
      }
    ],
    revision: [
      "Only rows where it evaluates to TRUE",
      "manager_id IS NULL",
      "AND has higher precedence than OR. Explicit parentheses prevent accidental widening of a filter, especially in updates and authorization predicates."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-where-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which rows pass a WHERE predicate?",
        options: [
          "Only rows where it evaluates to TRUE",
          "TRUE or UNKNOWN rows",
          "Only FALSE rows",
          "Every row with NULL"
        ],
        answer: "Only rows where it evaluates to TRUE",
        explanation: "Combine predicates with AND, OR, and NOT. SQL uses three-valued logic because comparisons involving NULL usually evaluate to UNKNOWN; use IS NULL rather than = NULL.",
        hint: "WHERE retains rows whose predicate evaluates to TRUE before grouping. FALSE and UNKNOWN rows are excluded."
      },
      {
        id: "sql-where-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "How should missing manager_id values be tested?",
        options: [
          "manager_id IS NULL",
          "manager_id = NULL",
          "manager_id <> NULL",
          "manager_id = 0"
        ],
        answer: "manager_id IS NULL",
        explanation: "AND has higher precedence than OR. Explicit parentheses prevent accidental widening of a filter, especially in updates and authorization predicates.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-where-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why can NOT IN unexpectedly return no rows when its subquery contains NULL?",
        answer: "NOT IN behaves like a conjunction of inequality comparisons. A NULL makes at least one comparison UNKNOWN, so candidate rows may not satisfy TRUE. Prefer NOT EXISTS with an explicit correlation when nullable values are possible.",
        explanation: "Combine predicates with AND, OR, and NOT. SQL uses three-valued logic because comparisons involving NULL usually evaluate to UNKNOWN; use IS NULL rather than = NULL. AND has higher precedence than OR. Explicit parentheses prevent accidental widening of a filter, especially in updates and authorization predicates.",
        hint: "How does NOT EXISTS differ for nullable values?"
      }
    ]
  },
  {
    id: "sql-order-by",
    title: "ORDER BY",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "ORDER BY gives a result set an explicit sort order. It is required when callers depend on which row appears first.",
    sections: [
      {
        title: "How it works",
        body: "Specify ASC or DESC for each expression independently. Add a unique tie-breaker when a stable order is needed. PostgreSQL supports NULLS FIRST and NULLS LAST."
      },
      {
        title: "Practical considerations",
        body: "Sorting can consume memory and spill to disk. A matching B-tree index may satisfy ordering, but only if its key directions and query conditions are compatible."
      }
    ],
    example: "SELECT id, salary FROM employees\nORDER BY salary DESC NULLS LAST, id ASC;",
    interview: [
      {
        question: "How can a database avoid an explicit sort for ORDER BY?",
        answer: "It may scan a compatible ordered index. For ORDER BY salary DESC, id ASC, an index with matching direction can help; selective filters, fetch cost, and LIMIT influence whether the optimizer chooses it.",
        followUp: "Why can a backwards scan fail to satisfy mixed sort directions?"
      }
    ],
    revision: [
      "ASC",
      "To make ordering deterministic among equal salaries",
      "Sorting can consume memory and spill to disk. A matching B-tree index may satisfy ordering, but only if its key directions and query conditions are compatible."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-order-by-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which direction is the default?",
        options: [
          "ASC",
          "DESC",
          "Random",
          "Insertion order"
        ],
        answer: "ASC",
        explanation: "Specify ASC or DESC for each expression independently. Add a unique tie-breaker when a stable order is needed. PostgreSQL supports NULLS FIRST and NULLS LAST.",
        hint: "ORDER BY gives a result set an explicit sort order. It is required when callers depend on which row appears first."
      },
      {
        id: "sql-order-by-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Why add id after salary when paging?",
        options: [
          "To make ordering deterministic among equal salaries",
          "To remove NULLs",
          "To eliminate duplicate salaries",
          "To force a hash join"
        ],
        answer: "To make ordering deterministic among equal salaries",
        explanation: "Sorting can consume memory and spill to disk. A matching B-tree index may satisfy ordering, but only if its key directions and query conditions are compatible.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-order-by-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How can a database avoid an explicit sort for ORDER BY?",
        answer: "It may scan a compatible ordered index. For ORDER BY salary DESC, id ASC, an index with matching direction can help; selective filters, fetch cost, and LIMIT influence whether the optimizer chooses it.",
        explanation: "Specify ASC or DESC for each expression independently. Add a unique tie-breaker when a stable order is needed. PostgreSQL supports NULLS FIRST and NULLS LAST. Sorting can consume memory and spill to disk. A matching B-tree index may satisfy ordering, but only if its key directions and query conditions are compatible.",
        hint: "Why can a backwards scan fail to satisfy mixed sort directions?"
      }
    ]
  },
  {
    id: "sql-distinct",
    title: "DISTINCT",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "DISTINCT removes duplicate rows from the projected result. Uniqueness applies to the entire selected tuple, not just its first column.",
    sections: [
      {
        title: "How it works",
        body: "SELECT DISTINCT city, country returns unique city-country pairs. The engine can use hashing or sorting. NULL values are considered equal for duplicate elimination."
      },
      {
        title: "Practical considerations",
        body: "DISTINCT can hide an incorrect join that multiplies rows. Fix the relationship or use EXISTS when asking whether a related record exists. PostgreSQL DISTINCT ON is a dialect-specific way to choose one row per key."
      }
    ],
    example: "SELECT DISTINCT department, city\nFROM employees\nORDER BY department, city;",
    interview: [
      {
        question: "When is EXISTS preferable to joining and adding DISTINCT?",
        answer: "When the question is whether at least one child exists. EXISTS expresses that directly and avoids generating a multiplied intermediate result. DISTINCT after a join may be expensive and can obscure a modeling error.",
        followUp: "Can DISTINCT change results if non-key child columns are selected?"
      }
    ],
    revision: [
      "The complete selected row",
      "Only when each department has exactly one distinct salary",
      "DISTINCT can hide an incorrect join that multiplies rows. Fix the relationship or use EXISTS when asking whether a related record exists. PostgreSQL DISTINCT ON is a dialect-specific way to choose one row per key."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-distinct-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What does DISTINCT compare?",
        options: [
          "The complete selected row",
          "Only the first selected column",
          "Only primary keys",
          "Physical row addresses"
        ],
        answer: "The complete selected row",
        explanation: "SELECT DISTINCT city, country returns unique city-country pairs. The engine can use hashing or sorting. NULL values are considered equal for duplicate elimination.",
        hint: "DISTINCT removes duplicate rows from the projected result. Uniqueness applies to the entire selected tuple, not just its first column."
      },
      {
        id: "sql-distinct-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Will DISTINCT department, salary return one row per department?",
        options: [
          "Only when each department has exactly one distinct salary",
          "Always",
          "Never, even with one salary",
          "Only when salary is NULL"
        ],
        answer: "Only when each department has exactly one distinct salary",
        explanation: "DISTINCT can hide an incorrect join that multiplies rows. Fix the relationship or use EXISTS when asking whether a related record exists. PostgreSQL DISTINCT ON is a dialect-specific way to choose one row per key.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-distinct-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "When is EXISTS preferable to joining and adding DISTINCT?",
        answer: "When the question is whether at least one child exists. EXISTS expresses that directly and avoids generating a multiplied intermediate result. DISTINCT after a join may be expensive and can obscure a modeling error.",
        explanation: "SELECT DISTINCT city, country returns unique city-country pairs. The engine can use hashing or sorting. NULL values are considered equal for duplicate elimination. DISTINCT can hide an incorrect join that multiplies rows. Fix the relationship or use EXISTS when asking whether a related record exists. PostgreSQL DISTINCT ON is a dialect-specific way to choose one row per key.",
        hint: "Can DISTINCT change results if non-key child columns are selected?"
      }
    ]
  },
  {
    id: "sql-limit",
    title: "LIMIT",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "LIMIT restricts the number of rows returned. It is useful for top-N queries and small pages but needs deterministic ordering to mean anything repeatable.",
    sections: [
      {
        title: "How it works",
        body: "ORDER BY establishes the sequence before LIMIT takes a prefix. OFFSET skips a prefix, so larger offsets often require more work. SQL-standard FETCH FIRST is another supported syntax."
      },
      {
        title: "Practical considerations",
        body: "Offset pagination can duplicate or skip results under concurrent inserts and deletions. Keyset pagination uses the last seen ordered key to find the next page more efficiently."
      }
    ],
    example: "SELECT id, created_at FROM events\nWHERE (created_at, id) < ('2026-01-01T00:00:00Z', 500)\nORDER BY created_at DESC, id DESC\nLIMIT 20;",
    interview: [
      {
        question: "Design stable pagination for events that share timestamps.",
        answer: "Order by created_at and a unique id. Carry both values in the cursor and use a lexicographic comparison matching the order. Index both columns. Define behavior for rows whose ordering values change during traversal.",
        followUp: "What trade-off does keyset pagination make for jumping to an arbitrary page?"
      }
    ],
    revision: [
      "No",
      "Keyset pagination using an indexed ordering key",
      "Offset pagination can duplicate or skip results under concurrent inserts and deletions. Keyset pagination uses the last seen ordered key to find the next page more efficiently."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-limit-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Does LIMIT 5 without ORDER BY guarantee the same five rows?",
        options: [
          "No",
          "Yes, oldest first",
          "Yes, primary-key order",
          "Yes, newest first"
        ],
        answer: "No",
        explanation: "ORDER BY establishes the sequence before LIMIT takes a prefix. OFFSET skips a prefix, so larger offsets often require more work. SQL-standard FETCH FIRST is another supported syntax.",
        hint: "LIMIT restricts the number of rows returned. It is useful for top-N queries and small pages but needs deterministic ordering to mean anything repeatable."
      },
      {
        id: "sql-limit-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which approach usually scales better for deep scrolling?",
        options: [
          "Keyset pagination using an indexed ordering key",
          "Increasing OFFSET forever",
          "Sorting in the browser",
          "SELECT * without an index"
        ],
        answer: "Keyset pagination using an indexed ordering key",
        explanation: "Offset pagination can duplicate or skip results under concurrent inserts and deletions. Keyset pagination uses the last seen ordered key to find the next page more efficiently.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-limit-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Design stable pagination for events that share timestamps.",
        answer: "Order by created_at and a unique id. Carry both values in the cursor and use a lexicographic comparison matching the order. Index both columns. Define behavior for rows whose ordering values change during traversal.",
        explanation: "ORDER BY establishes the sequence before LIMIT takes a prefix. OFFSET skips a prefix, so larger offsets often require more work. SQL-standard FETCH FIRST is another supported syntax. Offset pagination can duplicate or skip results under concurrent inserts and deletions. Keyset pagination uses the last seen ordered key to find the next page more efficiently.",
        hint: "What trade-off does keyset pagination make for jumping to an arbitrary page?"
      }
    ]
  },
  {
    id: "sql-aggregate-functions",
    title: "Aggregate Functions",
    subjectId: "sql",
    module: "SQL Fundamentals",
    minutes: 7,
    difficulty: "Easy",
    overview: "Aggregates summarize a group of rows into a value, such as COUNT, SUM, AVG, MIN, or MAX. Without GROUP BY the entire input is one group.",
    sections: [
      {
        title: "How it works",
        body: "COUNT(*) counts rows. COUNT(expression) counts non-NULL expressions. Most aggregates ignore NULL inputs; SUM over no rows returns NULL while COUNT returns zero."
      },
      {
        title: "Practical considerations",
        body: "AVG(price) is not necessarily the correct revenue-weighted average. Use SUM(price * quantity) / SUM(quantity) and guard against zero denominators when weights matter."
      }
    ],
    example: "SELECT COUNT(*) AS rows, COUNT(manager_id) AS with_manager,\n       AVG(salary) AS average_salary\nFROM employees;",
    interview: [
      {
        question: "How would you compute a weighted mean and handle empty input?",
        answer: "Use SUM(value * weight) / NULLIF(SUM(weight), 0), casting to a fractional numeric type when required. NULLIF prevents division by zero; COALESCE is appropriate only if a default is meaningful.",
        followUp: "Why can integer division silently alter the result?"
      }
    ],
    revision: [
      "COUNT(*)",
      "15",
      "AVG(price) is not necessarily the correct revenue-weighted average. Use SUM(price * quantity) / SUM(quantity) and guard against zero denominators when weights matter."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-aggregate-functions-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which expression counts every row?",
        options: [
          "COUNT(*)",
          "COUNT(nullable_column)",
          "SUM(*)",
          "AVG(*)"
        ],
        answer: "COUNT(*)",
        explanation: "COUNT(*) counts rows. COUNT(expression) counts non-NULL expressions. Most aggregates ignore NULL inputs; SUM over no rows returns NULL while COUNT returns zero.",
        hint: "Aggregates summarize a group of rows into a value, such as COUNT, SUM, AVG, MIN, or MAX. Without GROUP BY the entire input is one group."
      },
      {
        id: "sql-aggregate-functions-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "For values 10, NULL, 20, what is AVG(value)?",
        options: [
          "15",
          "10",
          "30",
          "NULL"
        ],
        answer: "15",
        explanation: "AVG(price) is not necessarily the correct revenue-weighted average. Use SUM(price * quantity) / SUM(quantity) and guard against zero denominators when weights matter.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-aggregate-functions-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you compute a weighted mean and handle empty input?",
        answer: "Use SUM(value * weight) / NULLIF(SUM(weight), 0), casting to a fractional numeric type when required. NULLIF prevents division by zero; COALESCE is appropriate only if a default is meaningful.",
        explanation: "COUNT(*) counts rows. COUNT(expression) counts non-NULL expressions. Most aggregates ignore NULL inputs; SUM over no rows returns NULL while COUNT returns zero. AVG(price) is not necessarily the correct revenue-weighted average. Use SUM(price * quantity) / SUM(quantity) and guard against zero denominators when weights matter.",
        hint: "Why can integer division silently alter the result?"
      }
    ]
  },
  {
    id: "sql-inner-join",
    title: "INNER JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "INNER JOIN combines rows whose join predicate is TRUE. Unmatched rows from either side are excluded.",
    sections: [
      {
        title: "How it works",
        body: "For every left row, all matching right rows contribute output rows. A one-to-many relationship therefore repeats left-side values. Join using stable keys rather than names unless names are truly unique."
      },
      {
        title: "Practical considerations",
        body: "Joining two one-to-many relationships can multiply rows and inflate aggregates. Aggregate each child first or carefully choose the intended grain."
      }
    ],
    example: "SELECT e.name, d.name AS department\nFROM employees e\nINNER JOIN departments d ON d.id = e.department_id;",
    interview: [
      {
        question: "Why can SUM(order.total) become wrong after joining order items?",
        answer: "Each order row repeats once per matching item. Summing the repeated total inflates revenue. Aggregate at order grain first or aggregate item amounts according to the intended metric.",
        followUp: "Why is SUM(DISTINCT order.total) not a general fix?"
      }
    ],
    revision: [
      "Rows satisfying the join predicate",
      "6",
      "Joining two one-to-many relationships can multiply rows and inflate aggregates. Aggregate each child first or carefully choose the intended grain."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-inner-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which rows survive an INNER JOIN?",
        options: [
          "Rows satisfying the join predicate",
          "All left rows",
          "Only unmatched rows",
          "All combinations"
        ],
        answer: "Rows satisfying the join predicate",
        explanation: "For every left row, all matching right rows contribute output rows. A one-to-many relationship therefore repeats left-side values. Join using stable keys rather than names unless names are truly unique.",
        hint: "INNER JOIN combines rows whose join predicate is TRUE. Unmatched rows from either side are excluded."
      },
      {
        id: "sql-inner-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "An employee has 2 projects and 3 skills; joining both child tables yields how many rows?",
        options: [
          "6",
          "2",
          "3",
          "5"
        ],
        answer: "6",
        explanation: "Joining two one-to-many relationships can multiply rows and inflate aggregates. Aggregate each child first or carefully choose the intended grain.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-inner-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why can SUM(order.total) become wrong after joining order items?",
        answer: "Each order row repeats once per matching item. Summing the repeated total inflates revenue. Aggregate at order grain first or aggregate item amounts according to the intended metric.",
        explanation: "For every left row, all matching right rows contribute output rows. A one-to-many relationship therefore repeats left-side values. Join using stable keys rather than names unless names are truly unique. Joining two one-to-many relationships can multiply rows and inflate aggregates. Aggregate each child first or carefully choose the intended grain.",
        hint: "Why is SUM(DISTINCT order.total) not a general fix?"
      }
    ]
  },
  {
    id: "sql-left-join",
    title: "LEFT JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "LEFT JOIN preserves every left-side row and attaches matching right-side data. When no match exists, right-side columns are NULL.",
    sections: [
      {
        title: "How it works",
        body: "The ON clause decides matching before null-extension. A later WHERE clause can remove the null-extended rows, changing the result into effectively an inner join for some predicates."
      },
      {
        title: "Practical considerations",
        body: "Use a known NOT NULL right key for anti-join checks. Testing a nullable business column for NULL can incorrectly classify matched rows as unmatched."
      }
    ],
    example: "SELECT c.id, o.id AS order_id\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';",
    interview: [
      {
        question: "Explain the difference between filtering a right table in ON and WHERE.",
        answer: "ON limits eligible matches while preserving unmatched left rows. WHERE runs after the join, so a condition such as right.status = paid rejects NULL-extended rows and loses customers without a paid order.",
        followUp: "How would you return only customers with no orders?"
      }
    ],
    revision: [
      "The left side",
      "In the ON clause",
      "Use a known NOT NULL right key for anti-join checks. Testing a nullable business column for NULL can incorrectly classify matched rows as unmatched."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-left-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which side is always preserved?",
        options: [
          "The left side",
          "The right side",
          "Both only when equal",
          "Neither"
        ],
        answer: "The left side",
        explanation: "The ON clause decides matching before null-extension. A later WHERE clause can remove the null-extended rows, changing the result into effectively an inner join for some predicates.",
        hint: "LEFT JOIN preserves every left-side row and attaches matching right-side data. When no match exists, right-side columns are NULL."
      },
      {
        id: "sql-left-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Where should o.status = paid go to retain customers with no paid orders?",
        options: [
          "In the ON clause",
          "Always in WHERE",
          "Only in HAVING",
          "In ORDER BY"
        ],
        answer: "In the ON clause",
        explanation: "Use a known NOT NULL right key for anti-join checks. Testing a nullable business column for NULL can incorrectly classify matched rows as unmatched.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-left-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Explain the difference between filtering a right table in ON and WHERE.",
        answer: "ON limits eligible matches while preserving unmatched left rows. WHERE runs after the join, so a condition such as right.status = paid rejects NULL-extended rows and loses customers without a paid order.",
        explanation: "The ON clause decides matching before null-extension. A later WHERE clause can remove the null-extended rows, changing the result into effectively an inner join for some predicates. Use a known NOT NULL right key for anti-join checks. Testing a nullable business column for NULL can incorrectly classify matched rows as unmatched.",
        hint: "How would you return only customers with no orders?"
      },
      {
        prompt: "A LEFT JOIN finds customers and their paid orders. Where should o.status = 'paid' go to retain customers with no paid orders?",
        options: [
          "In the JOIN ON condition",
          "Only in WHERE o.status = 'paid'",
          "In ORDER BY instead of the join"
        ],
        answer: "In the JOIN ON condition",
        explanation: "Filtering the right table in ON limits which orders match while preserving unmatched customers as NULL-extended rows. A WHERE predicate requiring o.status = paid removes those unmatched rows.",
        hint: "Consider when NULL-extended unmatched rows are created and filtered.",
        id: "sql-left-join-hard-mcq",
        difficulty: "Hard",
        type: "mcq"
      }
    ]
  },
  {
    id: "sql-right-join",
    title: "RIGHT JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "RIGHT JOIN preserves every right-side row, adding NULL left-side values when no matching row exists. It is the mirror image of LEFT JOIN.",
    sections: [
      {
        title: "How it works",
        body: "A RIGHT JOIN B is equivalent to B LEFT JOIN A when the selected columns and predicate are adjusted. Teams often standardize on LEFT JOIN for easier reading."
      },
      {
        title: "Practical considerations",
        body: "Column order changes with SELECT * when rewriting a join. Explicitly name selected columns to keep API output stable."
      }
    ],
    example: "SELECT e.name, d.name\nFROM employees e\nRIGHT JOIN departments d ON e.department_id = d.id;",
    interview: [
      {
        question: "When might you rewrite a RIGHT JOIN as a LEFT JOIN?",
        answer: "To make the primary entity appear first and improve consistency. Preserve the predicate, column aliases, and explicit projection; reassess subsequent joins because outer joins are not freely associative.",
        followUp: "Why can changing join parentheses affect outer-join results?"
      }
    ],
    revision: [
      "Every right-table row",
      "departments LEFT JOIN employees with the same predicate",
      "Column order changes with SELECT * when rewriting a join. Explicitly name selected columns to keep API output stable."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-right-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What does RIGHT JOIN preserve?",
        options: [
          "Every right-table row",
          "Every left-table row",
          "Only matching rows",
          "Only rows with NULL keys"
        ],
        answer: "Every right-table row",
        explanation: "A RIGHT JOIN B is equivalent to B LEFT JOIN A when the selected columns and predicate are adjusted. Teams often standardize on LEFT JOIN for easier reading.",
        hint: "RIGHT JOIN preserves every right-side row, adding NULL left-side values when no matching row exists. It is the mirror image of LEFT JOIN."
      },
      {
        id: "sql-right-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which rewrite preserves the same row semantics?",
        options: [
          "departments LEFT JOIN employees with the same predicate",
          "employees INNER JOIN departments",
          "employees CROSS JOIN departments",
          "departments INNER JOIN employees"
        ],
        answer: "departments LEFT JOIN employees with the same predicate",
        explanation: "Column order changes with SELECT * when rewriting a join. Explicitly name selected columns to keep API output stable.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-right-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "When might you rewrite a RIGHT JOIN as a LEFT JOIN?",
        answer: "To make the primary entity appear first and improve consistency. Preserve the predicate, column aliases, and explicit projection; reassess subsequent joins because outer joins are not freely associative.",
        explanation: "A RIGHT JOIN B is equivalent to B LEFT JOIN A when the selected columns and predicate are adjusted. Teams often standardize on LEFT JOIN for easier reading. Column order changes with SELECT * when rewriting a join. Explicitly name selected columns to keep API output stable.",
        hint: "Why can changing join parentheses affect outer-join results?"
      }
    ]
  },
  {
    id: "sql-full-outer-join",
    title: "FULL OUTER JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "FULL OUTER JOIN preserves unmatched rows from both sides as well as matched pairs. It is useful for reconciliation between datasets.",
    sections: [
      {
        title: "How it works",
        body: "A matching predicate creates pairs; left-only rows receive NULL right columns and right-only rows receive NULL left columns. COALESCE can choose a shared reporting key."
      },
      {
        title: "Practical considerations",
        body: "Support varies by engine. PostgreSQL supports FULL OUTER JOIN directly. NULL keys do not match each other under ordinary equality."
      }
    ],
    example: "SELECT COALESCE(a.sku, b.sku) AS sku, a.quantity AS old, b.quantity AS new\nFROM old_inventory a\nFULL OUTER JOIN new_inventory b ON b.sku = a.sku;",
    interview: [
      {
        question: "How would you reconcile inventory rows added, removed, or changed?",
        answer: "Full-join snapshots on a stable SKU, classify a missing NOT NULL key on either side as added or removed, and compare quantities with IS DISTINCT FROM to handle NULL safely.",
        followUp: "Why should a reconciliation key be unique within each snapshot?"
      }
    ],
    revision: [
      "Unmatched rows from both tables",
      "UNKNOWN, so they do not match",
      "Support varies by engine. PostgreSQL supports FULL OUTER JOIN directly. NULL keys do not match each other under ordinary equality."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-full-outer-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which unmatched rows are preserved?",
        options: [
          "Unmatched rows from both tables",
          "Only the left table",
          "Only the right table",
          "None"
        ],
        answer: "Unmatched rows from both tables",
        explanation: "A matching predicate creates pairs; left-only rows receive NULL right columns and right-only rows receive NULL left columns. COALESCE can choose a shared reporting key.",
        hint: "FULL OUTER JOIN preserves unmatched rows from both sides as well as matched pairs. It is useful for reconciliation between datasets."
      },
      {
        id: "sql-full-outer-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Two NULL join keys compared with = produce what?",
        options: [
          "UNKNOWN, so they do not match",
          "TRUE",
          "FALSE only in PostgreSQL",
          "An automatic shared group"
        ],
        answer: "UNKNOWN, so they do not match",
        explanation: "Support varies by engine. PostgreSQL supports FULL OUTER JOIN directly. NULL keys do not match each other under ordinary equality.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-full-outer-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you reconcile inventory rows added, removed, or changed?",
        answer: "Full-join snapshots on a stable SKU, classify a missing NOT NULL key on either side as added or removed, and compare quantities with IS DISTINCT FROM to handle NULL safely.",
        explanation: "A matching predicate creates pairs; left-only rows receive NULL right columns and right-only rows receive NULL left columns. COALESCE can choose a shared reporting key. Support varies by engine. PostgreSQL supports FULL OUTER JOIN directly. NULL keys do not match each other under ordinary equality.",
        hint: "Why should a reconciliation key be unique within each snapshot?"
      }
    ]
  },
  {
    id: "sql-cross-join",
    title: "CROSS JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "CROSS JOIN returns the Cartesian product: every row from one input paired with every row from the other. It deliberately has no match predicate.",
    sections: [
      {
        title: "How it works",
        body: "If inputs have m and n rows, the result has m \xD7 n rows. It is useful for generating combinations such as every date crossed with every store."
      },
      {
        title: "Practical considerations",
        body: "A missing join predicate can accidentally create a huge product. Estimate cardinality before executing and filter or aggregate at the right stage."
      }
    ],
    example: "SELECT d.day, s.store_id\nFROM calendar_days d\nCROSS JOIN stores s;",
    interview: [
      {
        question: "How can a calendar grid support reports with zero sales days?",
        answer: "Cross join stores with a bounded date calendar, then left join pre-aggregated sales on store and day. COALESCE missing totals to zero. Bound the date range to avoid unnecessary rows.",
        followUp: "Why aggregate sales before joining the grid?"
      }
    ],
    revision: [
      "20",
      "Generating every day-store combination",
      "A missing join predicate can accidentally create a huge product. Estimate cardinality before executing and filter or aggregate at the right stage."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-cross-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "How many rows result from inputs with 4 and 5 rows?",
        options: [
          "20",
          "9",
          "5",
          "4"
        ],
        answer: "20",
        explanation: "If inputs have m and n rows, the result has m \xD7 n rows. It is useful for generating combinations such as every date crossed with every store.",
        hint: "CROSS JOIN returns the Cartesian product: every row from one input paired with every row from the other. It deliberately has no match predicate."
      },
      {
        id: "sql-cross-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "When is a Cartesian product intentional?",
        options: [
          "Generating every day-store combination",
          "Looking up a single foreign key",
          "Removing duplicate rows",
          "Selecting unmatched rows only"
        ],
        answer: "Generating every day-store combination",
        explanation: "A missing join predicate can accidentally create a huge product. Estimate cardinality before executing and filter or aggregate at the right stage.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-cross-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How can a calendar grid support reports with zero sales days?",
        answer: "Cross join stores with a bounded date calendar, then left join pre-aggregated sales on store and day. COALESCE missing totals to zero. Bound the date range to avoid unnecessary rows.",
        explanation: "If inputs have m and n rows, the result has m \xD7 n rows. It is useful for generating combinations such as every date crossed with every store. A missing join predicate can accidentally create a huge product. Estimate cardinality before executing and filter or aggregate at the right stage.",
        hint: "Why aggregate sales before joining the grid?"
      }
    ]
  },
  {
    id: "sql-self-join",
    title: "SELF JOIN",
    subjectId: "sql",
    module: "Joins",
    minutes: 7,
    difficulty: "Medium",
    overview: "A self join references the same table through different aliases. It represents relationships between rows of the same entity, such as employees and managers.",
    sections: [
      {
        title: "How it works",
        body: "Each alias acts as an independent logical input. Join employee.manager_id to manager.id. Use LEFT JOIN when top-level employees with no manager should remain visible."
      },
      {
        title: "Practical considerations",
        body: "Aliases are necessary to disambiguate columns. A self join handles a fixed number of hierarchy levels; recursive CTEs traverse arbitrary depth."
      }
    ],
    example: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
    interview: [
      {
        question: "How would you extend a manager query to an arbitrary-depth reporting tree?",
        answer: "Use a recursive CTE with an anchor for root employees and a recursive step joining children. Track depth and detect cycles to avoid infinite recursion on invalid data.",
        followUp: "What constraints can prevent invalid manager relationships?"
      }
    ],
    revision: [
      "To distinguish the two table roles",
      "Use LEFT JOIN to the manager alias",
      "Aliases are necessary to disambiguate columns. A self join handles a fixed number of hierarchy levels; recursive CTEs traverse arbitrary depth."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-self-join-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Why are aliases needed?",
        options: [
          "To distinguish the two table roles",
          "To create duplicate tables",
          "To disable indexes",
          "To turn rows into columns"
        ],
        answer: "To distinguish the two table roles",
        explanation: "Each alias acts as an independent logical input. Join employee.manager_id to manager.id. Use LEFT JOIN when top-level employees with no manager should remain visible.",
        hint: "A self join references the same table through different aliases. It represents relationships between rows of the same entity, such as employees and managers."
      },
      {
        id: "sql-self-join-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "How do you retain employees without managers?",
        options: [
          "Use LEFT JOIN to the manager alias",
          "Use INNER JOIN",
          "Require m.id IS NOT NULL",
          "Use CROSS JOIN"
        ],
        answer: "Use LEFT JOIN to the manager alias",
        explanation: "Aliases are necessary to disambiguate columns. A self join handles a fixed number of hierarchy levels; recursive CTEs traverse arbitrary depth.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-self-join-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you extend a manager query to an arbitrary-depth reporting tree?",
        answer: "Use a recursive CTE with an anchor for root employees and a recursive step joining children. Track depth and detect cycles to avoid infinite recursion on invalid data.",
        explanation: "Each alias acts as an independent logical input. Join employee.manager_id to manager.id. Use LEFT JOIN when top-level employees with no manager should remain visible. Aliases are necessary to disambiguate columns. A self join handles a fixed number of hierarchy levels; recursive CTEs traverse arbitrary depth.",
        hint: "What constraints can prevent invalid manager relationships?"
      }
    ]
  },
  {
    id: "sql-group-by",
    title: "GROUP BY",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "GROUP BY partitions filtered rows by key values so aggregates can summarize each group. It defines the grain of a report.",
    sections: [
      {
        title: "How it works",
        body: "Every selected expression must be grouped, aggregated, or accepted through a supported functional dependency. PostgreSQL recognizes some dependencies, such as other columns of a grouped primary key."
      },
      {
        title: "Practical considerations",
        body: "Adding a column to GROUP BY changes the report grain and may increase row count. Keep the intended business entity explicit before joining and grouping."
      }
    ],
    example: "SELECT department_id, COUNT(*) AS employees, AVG(salary) AS mean_salary\nFROM employees\nGROUP BY department_id;",
    interview: [
      {
        question: "Why does joining before grouping sometimes inflate counts?",
        answer: "Join cardinality can repeat input entities. Define whether the metric counts employees, assignments, or joined rows; pre-aggregate children or use COUNT(DISTINCT stable_entity_id) when that matches the metric.",
        followUp: "How do NULL grouping keys behave?"
      }
    ],
    revision: [
      "The GROUP BY expressions",
      "One row per department-job-title pair",
      "Adding a column to GROUP BY changes the report grain and may increase row count. Keep the intended business entity explicit before joining and grouping."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-group-by-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What determines the groups?",
        options: [
          "The GROUP BY expressions",
          "ORDER BY direction",
          "Column storage order",
          "LIMIT value"
        ],
        answer: "The GROUP BY expressions",
        explanation: "Every selected expression must be grouped, aggregated, or accepted through a supported functional dependency. PostgreSQL recognizes some dependencies, such as other columns of a grouped primary key.",
        hint: "GROUP BY partitions filtered rows by key values so aggregates can summarize each group. It defines the grain of a report."
      },
      {
        id: "sql-group-by-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Grouping by department_id and job_title produces which grain?",
        options: [
          "One row per department-job-title pair",
          "One row per department",
          "One row per employee",
          "One row total"
        ],
        answer: "One row per department-job-title pair",
        explanation: "Adding a column to GROUP BY changes the report grain and may increase row count. Keep the intended business entity explicit before joining and grouping.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-group-by-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why does joining before grouping sometimes inflate counts?",
        answer: "Join cardinality can repeat input entities. Define whether the metric counts employees, assignments, or joined rows; pre-aggregate children or use COUNT(DISTINCT stable_entity_id) when that matches the metric.",
        explanation: "Every selected expression must be grouped, aggregated, or accepted through a supported functional dependency. PostgreSQL recognizes some dependencies, such as other columns of a grouped primary key. Adding a column to GROUP BY changes the report grain and may increase row count. Keep the intended business entity explicit before joining and grouping.",
        hint: "How do NULL grouping keys behave?"
      },
      {
        prompt: "Employees have salaries 100, 100, and 200 in one department. What does AVG(DISTINCT salary) return compared with AVG(salary)?",
        options: [
          "150 versus approximately 133.33",
          "Approximately 133.33 versus 150",
          "Both return 200"
        ],
        answer: "150 versus approximately 133.33",
        explanation: "DISTINCT removes the repeated salary value before the aggregate, so (100+200)/2 is 150. The ordinary average counts all three rows, giving 400/3.",
        hint: "DISTINCT changes the input values to the aggregate, not the output departments.",
        id: "sql-group-by-hard-mcq",
        difficulty: "Hard",
        type: "mcq"
      }
    ]
  },
  {
    id: "sql-having",
    title: "HAVING",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "HAVING filters groups after aggregation. WHERE filters individual rows before groups are built.",
    sections: [
      {
        title: "How it works",
        body: "Use WHERE for row conditions and HAVING for aggregate conditions such as COUNT(*) > 5. A predicate on a grouping key can often be moved earlier without changing semantics."
      },
      {
        title: "Practical considerations",
        body: "Filtering by salary in WHERE changes the employees included in averages; HAVING AVG(salary) filters whole department averages instead. The two answer different questions."
      }
    ],
    example: "SELECT department_id, AVG(salary) AS average_salary\nFROM employees\nWHERE active = true\nGROUP BY department_id\nHAVING AVG(salary) > 80000;",
    interview: [
      {
        question: "Explain why WHERE salary > 80000 differs from HAVING AVG(salary) > 80000.",
        answer: "WHERE excludes lower-paid employees before averaging. HAVING computes each full group average and then retains qualifying groups. A department can qualify under one query and fail the other.",
        followUp: "When can a HAVING predicate safely move to WHERE?"
      }
    ],
    revision: [
      "HAVING",
      "HAVING COUNT(*) >= 10",
      "Filtering by salary in WHERE changes the employees included in averages; HAVING AVG(salary) filters whole department averages instead. The two answer different questions."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-having-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which clause filters groups?",
        options: [
          "HAVING",
          "WHERE",
          "FROM",
          "LIMIT"
        ],
        answer: "HAVING",
        explanation: "Use WHERE for row conditions and HAVING for aggregate conditions such as COUNT(*) > 5. A predicate on a grouping key can often be moved earlier without changing semantics.",
        hint: "HAVING filters groups after aggregation. WHERE filters individual rows before groups are built."
      },
      {
        id: "sql-having-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "To return departments with at least ten employees, use what?",
        options: [
          "HAVING COUNT(*) >= 10",
          "WHERE COUNT(*) >= 10",
          "ORDER BY COUNT(*) = 10",
          "SELECT COUNT(*) WHERE department_id"
        ],
        answer: "HAVING COUNT(*) >= 10",
        explanation: "Filtering by salary in WHERE changes the employees included in averages; HAVING AVG(salary) filters whole department averages instead. The two answer different questions.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-having-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Explain why WHERE salary > 80000 differs from HAVING AVG(salary) > 80000.",
        answer: "WHERE excludes lower-paid employees before averaging. HAVING computes each full group average and then retains qualifying groups. A department can qualify under one query and fail the other.",
        explanation: "Use WHERE for row conditions and HAVING for aggregate conditions such as COUNT(*) > 5. A predicate on a grouping key can often be moved earlier without changing semantics. Filtering by salary in WHERE changes the employees included in averages; HAVING AVG(salary) filters whole department averages instead. The two answer different questions.",
        hint: "When can a HAVING predicate safely move to WHERE?"
      }
    ]
  },
  {
    id: "sql-subqueries",
    title: "Subqueries",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "A subquery is a query nested inside another SQL statement. It can supply a scalar, a relation, or an existence test.",
    sections: [
      {
        title: "How it works",
        body: "A scalar subquery must return at most one row and one column; zero rows yield NULL. IN tests membership, EXISTS tests whether at least one row exists, and FROM subqueries create derived tables."
      },
      {
        title: "Practical considerations",
        body: "A scalar subquery returning multiple rows fails. Use an aggregate, a unique predicate, or a relational join when multiple matches are valid."
      }
    ],
    example: "SELECT name FROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);",
    interview: [
      {
        question: "When would you choose EXISTS instead of IN?",
        answer: "EXISTS naturally expresses a correlated existence condition and avoids NOT IN\u2019s NULL trap for anti-joins. Performance depends on optimizer transformations, indexes, and cardinalities rather than a universal rule.",
        followUp: "Can the optimizer turn a subquery into a semi-join?"
      }
    ],
    revision: [
      "NULL",
      "EXISTS",
      "A scalar subquery returning multiple rows fails. Use an aggregate, a unique predicate, or a relational join when multiple matches are valid."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-subqueries-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What does a zero-row scalar subquery produce?",
        options: [
          "NULL",
          "Zero",
          "An empty string",
          "An automatic error"
        ],
        answer: "NULL",
        explanation: "A scalar subquery must return at most one row and one column; zero rows yield NULL. IN tests membership, EXISTS tests whether at least one row exists, and FROM subqueries create derived tables.",
        hint: "A subquery is a query nested inside another SQL statement. It can supply a scalar, a relation, or an existence test."
      },
      {
        id: "sql-subqueries-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which construct directly tests whether related rows exist?",
        options: [
          "EXISTS",
          "ORDER BY",
          "COUNT DISTINCT only",
          "LIMIT NULL"
        ],
        answer: "EXISTS",
        explanation: "A scalar subquery returning multiple rows fails. Use an aggregate, a unique predicate, or a relational join when multiple matches are valid.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-subqueries-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "When would you choose EXISTS instead of IN?",
        answer: "EXISTS naturally expresses a correlated existence condition and avoids NOT IN\u2019s NULL trap for anti-joins. Performance depends on optimizer transformations, indexes, and cardinalities rather than a universal rule.",
        explanation: "A scalar subquery must return at most one row and one column; zero rows yield NULL. IN tests membership, EXISTS tests whether at least one row exists, and FROM subqueries create derived tables. A scalar subquery returning multiple rows fails. Use an aggregate, a unique predicate, or a relational join when multiple matches are valid.",
        hint: "Can the optimizer turn a subquery into a semi-join?"
      }
    ]
  },
  {
    id: "sql-correlated-subqueries",
    title: "Correlated Subqueries",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "A correlated subquery refers to columns from its outer query. Its meaning depends on the current outer row.",
    sections: [
      {
        title: "How it works",
        body: "For each outer employee, a subquery may compare salary against that employee\u2019s department average. Although logically repeated, an optimizer can sometimes decorrelate the work."
      },
      {
        title: "Practical considerations",
        body: "Missing indexes or repeated scans can make correlated subqueries expensive. Compare execution plans with a join to a pre-aggregated table or a window function."
      }
    ],
    example: "SELECT e.name FROM employees e\nWHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.department_id = e.department_id);",
    interview: [
      {
        question: "Why is \u201Ca correlated subquery always executes once per outer row\u201D misleading?",
        answer: "That describes logical evaluation, not necessarily physical work. The optimizer may decorrelate to a join or cache equivalent work, but some plans retain repeated parameterized scans. Inspect EXPLAIN ANALYZE.",
        followUp: "Which index helps an EXISTS lookup on employee_id?"
      }
    ],
    revision: [
      "It references an outer-query column",
      "AVG(salary) OVER (PARTITION BY department_id)",
      "Missing indexes or repeated scans can make correlated subqueries expensive. Compare execution plans with a join to a pre-aggregated table or a window function."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-correlated-subqueries-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What makes a subquery correlated?",
        options: [
          "It references an outer-query column",
          "It contains ORDER BY",
          "It returns many rows",
          "It uses a primary key"
        ],
        answer: "It references an outer-query column",
        explanation: "For each outer employee, a subquery may compare salary against that employee\u2019s department average. Although logically repeated, an optimizer can sometimes decorrelate the work.",
        hint: "A correlated subquery refers to columns from its outer query. Its meaning depends on the current outer row."
      },
      {
        id: "sql-correlated-subqueries-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which alternative can compute department averages without a correlated scalar subquery?",
        options: [
          "AVG(salary) OVER (PARTITION BY department_id)",
          "DISTINCT salary only",
          "LIMIT department_id",
          "A CROSS JOIN without a condition"
        ],
        answer: "AVG(salary) OVER (PARTITION BY department_id)",
        explanation: "Missing indexes or repeated scans can make correlated subqueries expensive. Compare execution plans with a join to a pre-aggregated table or a window function.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-correlated-subqueries-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why is \u201Ca correlated subquery always executes once per outer row\u201D misleading?",
        answer: "That describes logical evaluation, not necessarily physical work. The optimizer may decorrelate to a join or cache equivalent work, but some plans retain repeated parameterized scans. Inspect EXPLAIN ANALYZE.",
        explanation: "For each outer employee, a subquery may compare salary against that employee\u2019s department average. Although logically repeated, an optimizer can sometimes decorrelate the work. Missing indexes or repeated scans can make correlated subqueries expensive. Compare execution plans with a join to a pre-aggregated table or a window function.",
        hint: "Which index helps an EXISTS lookup on employee_id?"
      }
    ]
  },
  {
    id: "sql-union-vs-union-all",
    title: "UNION vs UNION ALL",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "UNION combines compatible result sets and removes duplicate rows. UNION ALL concatenates them while preserving duplicates.",
    sections: [
      {
        title: "How it works",
        body: "Inputs must have the same number of columns with compatible types. Column names normally come from the first query. A final ORDER BY sorts the combined result."
      },
      {
        title: "Practical considerations",
        body: "UNION requires duplicate elimination and can cost more than UNION ALL. Choose based on semantics rather than using UNION by habit."
      }
    ],
    example: "SELECT email FROM customers\nUNION ALL\nSELECT email FROM prospects;",
    interview: [
      {
        question: "How do UNION and JOIN differ conceptually?",
        answer: "UNION stacks compatible rows vertically, while JOIN combines columns by relating rows. UNION ALL preserves multiplicity; UNION removes duplicate projected tuples. A join can multiply rows according to matches.",
        followUp: "How is ordering scoped in a compound query?"
      }
    ],
    revision: [
      "UNION ALL",
      "UNION ALL",
      "UNION requires duplicate elimination and can cost more than UNION ALL. Choose based on semantics rather than using UNION by habit."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-union-vs-union-all-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which operator preserves duplicate rows?",
        options: [
          "UNION ALL",
          "UNION",
          "INTERSECT",
          "DISTINCT"
        ],
        answer: "UNION ALL",
        explanation: "Inputs must have the same number of columns with compatible types. Column names normally come from the first query. A final ORDER BY sorts the combined result.",
        hint: "UNION combines compatible result sets and removes duplicate rows. UNION ALL concatenates them while preserving duplicates."
      },
      {
        id: "sql-union-vs-union-all-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "When sources are guaranteed disjoint and duplicates must remain, prefer what?",
        options: [
          "UNION ALL",
          "UNION with an extra DISTINCT",
          "CROSS JOIN",
          "FULL OUTER JOIN"
        ],
        answer: "UNION ALL",
        explanation: "UNION requires duplicate elimination and can cost more than UNION ALL. Choose based on semantics rather than using UNION by habit.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-union-vs-union-all-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How do UNION and JOIN differ conceptually?",
        answer: "UNION stacks compatible rows vertically, while JOIN combines columns by relating rows. UNION ALL preserves multiplicity; UNION removes duplicate projected tuples. A join can multiply rows according to matches.",
        explanation: "Inputs must have the same number of columns with compatible types. Column names normally come from the first query. A final ORDER BY sorts the combined result. UNION requires duplicate elimination and can cost more than UNION ALL. Choose based on semantics rather than using UNION by habit.",
        hint: "How is ordering scoped in a compound query?"
      }
    ]
  },
  {
    id: "sql-case-statements",
    title: "CASE Statements",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "CASE computes a value conditionally inside an expression. It is useful for labels, buckets, and conditional aggregates.",
    sections: [
      {
        title: "How it works",
        body: "Searched CASE tests predicates in order and returns the first matching result. Simple CASE compares one expression to listed values. Without ELSE, no match returns NULL."
      },
      {
        title: "Practical considerations",
        body: "All result branches need compatible types. NULL comparisons require IS NULL, and CASE should not be assumed to prevent every planner-time evaluation error in every context."
      }
    ],
    example: "SELECT name, CASE WHEN salary >= 100000 THEN 'Senior band' WHEN salary >= 60000 THEN 'Mid band' ELSE 'Entry band' END AS pay_band\nFROM employees;",
    interview: [
      {
        question: "How can CASE implement conditional counting?",
        answer: "SUM(CASE WHEN status = paid THEN 1 ELSE 0 END) counts qualifying rows; PostgreSQL COUNT(*) FILTER (WHERE status = paid) expresses the same intent clearly. Be precise about NULL behavior.",
        followUp: "When does COUNT(CASE WHEN ... THEN 1 END) work?"
      }
    ],
    revision: [
      "The first true branch",
      "NULL",
      "All result branches need compatible types. NULL comparisons require IS NULL, and CASE should not be assumed to prevent every planner-time evaluation error in every context."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-case-statements-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which branch is selected when several predicates are true?",
        options: [
          "The first true branch",
          "The last true branch",
          "Every branch",
          "A random branch"
        ],
        answer: "The first true branch",
        explanation: "Searched CASE tests predicates in order and returns the first matching result. Simple CASE compares one expression to listed values. Without ELSE, no match returns NULL.",
        hint: "CASE computes a value conditionally inside an expression. It is useful for labels, buckets, and conditional aggregates."
      },
      {
        id: "sql-case-statements-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "What does CASE return with no true branch and no ELSE?",
        options: [
          "NULL",
          "Zero",
          "FALSE always",
          "An exception always"
        ],
        answer: "NULL",
        explanation: "All result branches need compatible types. NULL comparisons require IS NULL, and CASE should not be assumed to prevent every planner-time evaluation error in every context.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-case-statements-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How can CASE implement conditional counting?",
        answer: "SUM(CASE WHEN status = paid THEN 1 ELSE 0 END) counts qualifying rows; PostgreSQL COUNT(*) FILTER (WHERE status = paid) expresses the same intent clearly. Be precise about NULL behavior.",
        explanation: "Searched CASE tests predicates in order and returns the first matching result. Simple CASE compares one expression to listed values. Without ELSE, no match returns NULL. All result branches need compatible types. NULL comparisons require IS NULL, and CASE should not be assumed to prevent every planner-time evaluation error in every context.",
        hint: "When does COUNT(CASE WHEN ... THEN 1 END) work?"
      }
    ]
  },
  {
    id: "sql-null-handling",
    title: "NULL Handling",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "NULL represents an unknown or absent value, not zero or an empty string. SQL\u2019s three-valued logic makes explicit handling essential.",
    sections: [
      {
        title: "How it works",
        body: "Use IS NULL, IS NOT NULL, COALESCE for defaults, and NULLIF to turn a chosen value into NULL. PostgreSQL IS DISTINCT FROM provides a null-safe inequality comparison."
      },
      {
        title: "Practical considerations",
        body: "COALESCE can collapse meaningful distinctions. A missing price is not necessarily a zero price. Define defaults at the business level, and be careful with nullable columns in NOT IN."
      }
    ],
    example: "SELECT revenue / NULLIF(orders, 0) AS average_order_value,\n       COALESCE(display_name, username) AS label\nFROM customer_metrics;",
    interview: [
      {
        question: "Explain why COALESCE(SUM(amount), 0) differs from SUM(COALESCE(amount, 0)) for empty input.",
        answer: "The first replaces the aggregate\u2019s NULL result with zero. The second replaces NULL values within existing rows, but SUM over no input rows still returns NULL. Empty sets and NULL-valued rows are different cases.",
        followUp: "How does COUNT(column) treat NULL?"
      }
    ],
    revision: [
      "IS NULL",
      "UNKNOWN",
      "COALESCE can collapse meaningful distinctions. A missing price is not necessarily a zero price. Define defaults at the business level, and be careful with nullable columns in NOT IN."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-null-handling-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which predicate correctly checks for NULL?",
        options: [
          "IS NULL",
          "= NULL",
          "<> NULL",
          "= 0"
        ],
        answer: "IS NULL",
        explanation: "Use IS NULL, IS NOT NULL, COALESCE for defaults, and NULLIF to turn a chosen value into NULL. PostgreSQL IS DISTINCT FROM provides a null-safe inequality comparison.",
        hint: "NULL represents an unknown or absent value, not zero or an empty string. SQL\u2019s three-valued logic makes explicit handling essential."
      },
      {
        id: "sql-null-handling-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "What is NULL = NULL under ordinary equality?",
        options: [
          "UNKNOWN",
          "TRUE",
          "FALSE in every context",
          "A syntax error"
        ],
        answer: "UNKNOWN",
        explanation: "COALESCE can collapse meaningful distinctions. A missing price is not necessarily a zero price. Define defaults at the business level, and be careful with nullable columns in NOT IN.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-null-handling-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Explain why COALESCE(SUM(amount), 0) differs from SUM(COALESCE(amount, 0)) for empty input.",
        answer: "The first replaces the aggregate\u2019s NULL result with zero. The second replaces NULL values within existing rows, but SUM over no input rows still returns NULL. Empty sets and NULL-valued rows are different cases.",
        explanation: "Use IS NULL, IS NOT NULL, COALESCE for defaults, and NULLIF to turn a chosen value into NULL. PostgreSQL IS DISTINCT FROM provides a null-safe inequality comparison. COALESCE can collapse meaningful distinctions. A missing price is not necessarily a zero price. Define defaults at the business level, and be careful with nullable columns in NOT IN.",
        hint: "How does COUNT(column) treat NULL?"
      },
      {
        prompt: "A NOT IN subquery returns values (1, NULL). For candidate value 2, what is 2 NOT IN (1, NULL) under SQL three-valued logic?",
        options: [
          "UNKNOWN, so WHERE excludes it",
          "TRUE, because 2 differs from 1",
          "FALSE only if 2 itself is NULL"
        ],
        answer: "UNKNOWN, so WHERE excludes it",
        explanation: "The comparison against NULL is unknown. The compound NOT IN predicate cannot establish that 2 differs from every returned value, so it evaluates to unknown. NOT EXISTS with an explicit equality is often safer for anti-joins.",
        hint: "Compare the candidate with every value, including the unknown one.",
        id: "sql-null-handling-hard-mcq",
        difficulty: "Hard",
        type: "mcq"
      }
    ]
  },
  {
    id: "sql-constraints",
    title: "Constraints",
    subjectId: "sql",
    module: "Intermediate SQL",
    minutes: 7,
    difficulty: "Medium",
    overview: "Constraints enforce data invariants at the database boundary, protecting data regardless of which application writes it.",
    sections: [
      {
        title: "How it works",
        body: "PRIMARY KEY identifies rows uniquely and disallows NULL. FOREIGN KEY enforces referential integrity. UNIQUE prevents duplicates, NOT NULL requires a value, and CHECK accepts only TRUE or UNKNOWN."
      },
      {
        title: "Practical considerations",
        body: "A CHECK such as price > 0 does not itself reject NULL, because UNKNOWN passes a CHECK. Add NOT NULL when the value is required. Index foreign-key referencing columns when workload warrants it."
      }
    ],
    example: "CREATE TABLE products (\n id bigint PRIMARY KEY,\n sku text UNIQUE NOT NULL,\n price numeric NOT NULL CHECK (price > 0)\n);",
    interview: [
      {
        question: "Why are application checks alone insufficient for uniqueness?",
        answer: "Concurrent requests can both observe no existing row and then insert duplicates. A database UNIQUE constraint arbitrates atomically; catch its violation and return a suitable application error.",
        followUp: "How do you handle a race while creating a unique username?"
      }
    ],
    revision: [
      "FOREIGN KEY",
      "No; add NOT NULL to require a value",
      "A CHECK such as price > 0 does not itself reject NULL, because UNKNOWN passes a CHECK. Add NOT NULL when the value is required. Index foreign-key referencing columns when workload warrants it."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-constraints-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which constraint connects a child row to an existing parent?",
        options: [
          "FOREIGN KEY",
          "CHECK",
          "ORDER BY",
          "DEFAULT"
        ],
        answer: "FOREIGN KEY",
        explanation: "PRIMARY KEY identifies rows uniquely and disallows NULL. FOREIGN KEY enforces referential integrity. UNIQUE prevents duplicates, NOT NULL requires a value, and CHECK accepts only TRUE or UNKNOWN.",
        hint: "Constraints enforce data invariants at the database boundary, protecting data regardless of which application writes it."
      },
      {
        id: "sql-constraints-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Does CHECK (price > 0) alone reject NULL?",
        options: [
          "No; add NOT NULL to require a value",
          "Yes, always",
          "Only for integers",
          "Only with a primary key"
        ],
        answer: "No; add NOT NULL to require a value",
        explanation: "A CHECK such as price > 0 does not itself reject NULL, because UNKNOWN passes a CHECK. Add NOT NULL when the value is required. Index foreign-key referencing columns when workload warrants it.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-constraints-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why are application checks alone insufficient for uniqueness?",
        answer: "Concurrent requests can both observe no existing row and then insert duplicates. A database UNIQUE constraint arbitrates atomically; catch its violation and return a suitable application error.",
        explanation: "PRIMARY KEY identifies rows uniquely and disallows NULL. FOREIGN KEY enforces referential integrity. UNIQUE prevents duplicates, NOT NULL requires a value, and CHECK accepts only TRUE or UNKNOWN. A CHECK such as price > 0 does not itself reject NULL, because UNKNOWN passes a CHECK. Add NOT NULL when the value is required. Index foreign-key referencing columns when workload warrants it.",
        hint: "How do you handle a race while creating a unique username?"
      }
    ]
  },
  {
    id: "sql-window-functions",
    title: "Window Functions",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "Window functions compute values across related rows without collapsing them. They support ranking, running totals, and comparisons within partitions.",
    sections: [
      {
        title: "How it works",
        body: "OVER defines PARTITION BY, ORDER BY, and an optional frame. Aggregates used as window functions operate on the current frame, while ranking functions use peer relationships."
      },
      {
        title: "Practical considerations",
        body: "An ORDER BY window default frame can surprise you: in PostgreSQL it includes peers through the current row. Use an explicit ROWS frame for row-by-row running totals and deterministic tie-breakers."
      }
    ],
    example: "SELECT id, department_id, salary,\n SUM(salary) OVER (PARTITION BY department_id ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total\nFROM employees;",
    interview: [
      {
        question: "Why might LAST_VALUE return the current row instead of the partition\u2019s final value?",
        answer: "With the default ordered frame, the frame commonly ends at the current peer group. LAST_VALUE reads the last row of that frame. Specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING for the whole partition.",
        followUp: "How do ROWS and RANGE treat equal ordering keys?"
      }
    ],
    revision: [
      "No, they retain individual rows",
      "PARTITION BY department_id",
      "An ORDER BY window default frame can surprise you: in PostgreSQL it includes peers through the current row. Use an explicit ROWS frame for row-by-row running totals and deterministic tie-breakers."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-window-functions-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Do window functions collapse rows like GROUP BY?",
        options: [
          "No, they retain individual rows",
          "Yes, always",
          "Only with SUM",
          "Only with PARTITION BY"
        ],
        answer: "No, they retain individual rows",
        explanation: "OVER defines PARTITION BY, ORDER BY, and an optional frame. Aggregates used as window functions operate on the current frame, while ranking functions use peer relationships.",
        hint: "Window functions compute values across related rows without collapsing them. They support ranking, running totals, and comparisons within partitions."
      },
      {
        id: "sql-window-functions-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which clause separates independent windows by department?",
        options: [
          "PARTITION BY department_id",
          "GROUP ALL",
          "HAVING department_id",
          "LIMIT department_id"
        ],
        answer: "PARTITION BY department_id",
        explanation: "An ORDER BY window default frame can surprise you: in PostgreSQL it includes peers through the current row. Use an explicit ROWS frame for row-by-row running totals and deterministic tie-breakers.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-window-functions-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why might LAST_VALUE return the current row instead of the partition\u2019s final value?",
        answer: "With the default ordered frame, the frame commonly ends at the current peer group. LAST_VALUE reads the last row of that frame. Specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING for the whole partition.",
        explanation: "OVER defines PARTITION BY, ORDER BY, and an optional frame. Aggregates used as window functions operate on the current frame, while ranking functions use peer relationships. An ORDER BY window default frame can surprise you: in PostgreSQL it includes peers through the current row. Use an explicit ROWS frame for row-by-row running totals and deterministic tie-breakers.",
        hint: "How do ROWS and RANGE treat equal ordering keys?"
      },
      {
        prompt: "Rows have scores 100, 100, and 90. With ORDER BY score DESC and the default PostgreSQL window frame, what can SUM(score) OVER (...) return for the first two peer rows?",
        options: [
          "200 for each of the two score-100 rows",
          "100 then 200 solely because they were displayed in that order",
          "90 for both score-100 rows"
        ],
        answer: "200 for each of the two score-100 rows",
        explanation: "The default RANGE frame extends through the current row\u2019s peers, so both 100-score rows include the same peer group totaling 200. Use an explicit ROWS frame and a deterministic ordering when row-by-row accumulation is required.",
        hint: "The default frame treats equal ORDER BY values as peers.",
        id: "sql-window-functions-hard-mcq",
        difficulty: "Hard",
        type: "mcq"
      }
    ]
  },
  {
    id: "sql-row-number",
    title: "ROW_NUMBER",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "ROW_NUMBER assigns a unique sequence number within each partition according to its window ordering. It is ideal when exactly one row per rank is needed.",
    sections: [
      {
        title: "How it works",
        body: "Each row gets 1, 2, 3, and so on. Equal ordering keys still receive different numbers; add a unique tie-breaker to make the choice reproducible."
      },
      {
        title: "Practical considerations",
        body: "To filter the window result, wrap it in a CTE or derived table because WHERE is evaluated before window output. PostgreSQL has no QUALIFY clause in current supported versions."
      }
    ],
    example: "WITH ranked AS (\n SELECT *, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, id) AS rn FROM employees\n) SELECT * FROM ranked WHERE rn <= 3;",
    interview: [
      {
        question: "When should ROW_NUMBER be chosen over RANK?",
        answer: "When the requirement is a fixed number of rows, such as exactly one latest record per customer. Supply a total ordering to break ties; RANK preserves ties and may return more rows.",
        followUp: "What if the requirement is all employees tied for third place?"
      }
    ],
    revision: [
      "No, each row receives a distinct number",
      "ROW_NUMBER ordered by salary DESC and unique id, then filter rn <= 3",
      "To filter the window result, wrap it in a CTE or derived table because WHERE is evaluated before window output. PostgreSQL has no QUALIFY clause in current supported versions."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-row-number-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "For tied salaries, does ROW_NUMBER give equal ranks?",
        options: [
          "No, each row receives a distinct number",
          "Yes",
          "Only when partitioned",
          "Only with ASC"
        ],
        answer: "No, each row receives a distinct number",
        explanation: "Each row gets 1, 2, 3, and so on. Equal ordering keys still receive different numbers; add a unique tie-breaker to make the choice reproducible.",
        hint: "ROW_NUMBER assigns a unique sequence number within each partition according to its window ordering. It is ideal when exactly one row per rank is needed."
      },
      {
        id: "sql-row-number-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "How do you choose exactly three employees per department deterministically?",
        options: [
          "ROW_NUMBER ordered by salary DESC and unique id, then filter rn <= 3",
          "DENSE_RANK by salary only",
          "LIMIT 3 on the entire table",
          "GROUP BY salary"
        ],
        answer: "ROW_NUMBER ordered by salary DESC and unique id, then filter rn <= 3",
        explanation: "To filter the window result, wrap it in a CTE or derived table because WHERE is evaluated before window output. PostgreSQL has no QUALIFY clause in current supported versions.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-row-number-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "When should ROW_NUMBER be chosen over RANK?",
        answer: "When the requirement is a fixed number of rows, such as exactly one latest record per customer. Supply a total ordering to break ties; RANK preserves ties and may return more rows.",
        explanation: "Each row gets 1, 2, 3, and so on. Equal ordering keys still receive different numbers; add a unique tie-breaker to make the choice reproducible. To filter the window result, wrap it in a CTE or derived table because WHERE is evaluated before window output. PostgreSQL has no QUALIFY clause in current supported versions.",
        hint: "What if the requirement is all employees tied for third place?"
      }
    ]
  },
  {
    id: "sql-rank",
    title: "RANK",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "RANK assigns the same rank to equal ordering values and leaves gaps after ties. It models competition ranking.",
    sections: [
      {
        title: "How it works",
        body: "For salaries 100, 100, 90, ranks are 1, 1, 3. The next rank counts all preceding rows plus one, not just preceding distinct values."
      },
      {
        title: "Practical considerations",
        body: "Adding id to the ranking ORDER BY removes salary ties. If ties matter, rank only by salary and use a separate final ORDER BY for stable display."
      }
    ],
    example: "SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank\nFROM employees;",
    interview: [
      {
        question: "Explain top three ranks versus top three distinct salaries.",
        answer: "RANK <= 3 follows competition positions and can skip a rank after a large tie. DENSE_RANK <= 3 selects the top three distinct salary levels. ROW_NUMBER <= 3 selects exactly three rows.",
        followUp: "What happens if four employees tie for the highest salary?"
      }
    ],
    revision: [
      "1, 1, 3",
      "The unique id makes the ordering tuples distinct",
      "Adding id to the ranking ORDER BY removes salary ties. If ties matter, rank only by salary and use a separate final ORDER BY for stable display."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-rank-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "For values 100, 100, 90, what ranks result?",
        options: [
          "1, 1, 3",
          "1, 2, 3",
          "1, 1, 2",
          "0, 0, 1"
        ],
        answer: "1, 1, 3",
        explanation: "For salaries 100, 100, 90, ranks are 1, 1, 3. The next rank counts all preceding rows plus one, not just preceding distinct values.",
        hint: "RANK assigns the same rank to equal ordering values and leaves gaps after ties. It models competition ranking."
      },
      {
        id: "sql-rank-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Why avoid adding a unique id to RANK\u2019s ORDER BY when salary ties must remain?",
        options: [
          "The unique id makes the ordering tuples distinct",
          "It disables the window",
          "It always changes DESC to ASC",
          "It removes the partition"
        ],
        answer: "The unique id makes the ordering tuples distinct",
        explanation: "Adding id to the ranking ORDER BY removes salary ties. If ties matter, rank only by salary and use a separate final ORDER BY for stable display.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-rank-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Explain top three ranks versus top three distinct salaries.",
        answer: "RANK <= 3 follows competition positions and can skip a rank after a large tie. DENSE_RANK <= 3 selects the top three distinct salary levels. ROW_NUMBER <= 3 selects exactly three rows.",
        explanation: "For salaries 100, 100, 90, ranks are 1, 1, 3. The next rank counts all preceding rows plus one, not just preceding distinct values. Adding id to the ranking ORDER BY removes salary ties. If ties matter, rank only by salary and use a separate final ORDER BY for stable display.",
        hint: "What happens if four employees tie for the highest salary?"
      }
    ]
  },
  {
    id: "sql-dense-rank",
    title: "DENSE_RANK",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "DENSE_RANK assigns equal ranks to peers and does not leave gaps. It counts distinct ordered value groups.",
    sections: [
      {
        title: "How it works",
        body: "For salaries 100, 100, 90, ranks are 1, 1, 2. It is useful for kth distinct salary and top-N distinct value levels."
      },
      {
        title: "Practical considerations",
        body: "Rank at the intended grain. Partition by department for department-local salary levels, and decide whether NULL salaries should be excluded."
      }
    ],
    example: "SELECT name, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS level\nFROM employees\nWHERE salary IS NOT NULL;",
    interview: [
      {
        question: "How do you retrieve every employee earning the kth highest distinct salary?",
        answer: "Use DENSE_RANK() OVER (ORDER BY salary DESC) after excluding NULL salaries, wrap the result, and filter rank = k. This retains everyone at that salary level.",
        followUp: "How would you handle k larger than the number of distinct salaries?"
      }
    ],
    revision: [
      "1, 1, 2",
      "DENSE_RANK",
      "Rank at the intended grain. Partition by department for department-local salary levels, and decide whether NULL salaries should be excluded."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-dense-rank-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "For 100, 100, 90, what does DENSE_RANK return?",
        options: [
          "1, 1, 2",
          "1, 1, 3",
          "1, 2, 3",
          "2, 2, 1"
        ],
        answer: "1, 1, 2",
        explanation: "For salaries 100, 100, 90, ranks are 1, 1, 2. It is useful for kth distinct salary and top-N distinct value levels.",
        hint: "DENSE_RANK assigns equal ranks to peers and does not leave gaps. It counts distinct ordered value groups."
      },
      {
        id: "sql-dense-rank-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which function finds the second distinct salary level despite duplicates?",
        options: [
          "DENSE_RANK",
          "ROW_NUMBER with arbitrary ties",
          "COUNT(*)",
          "NTILE(2)"
        ],
        answer: "DENSE_RANK",
        explanation: "Rank at the intended grain. Partition by department for department-local salary levels, and decide whether NULL salaries should be excluded.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-dense-rank-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How do you retrieve every employee earning the kth highest distinct salary?",
        answer: "Use DENSE_RANK() OVER (ORDER BY salary DESC) after excluding NULL salaries, wrap the result, and filter rank = k. This retains everyone at that salary level.",
        explanation: "For salaries 100, 100, 90, ranks are 1, 1, 2. It is useful for kth distinct salary and top-N distinct value levels. Rank at the intended grain. Partition by department for department-local salary levels, and decide whether NULL salaries should be excluded.",
        hint: "How would you handle k larger than the number of distinct salaries?"
      }
    ]
  },
  {
    id: "sql-lead",
    title: "LEAD",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "LEAD reads a value from a following row in the same ordered partition. It supports next-event comparisons without a self join.",
    sections: [
      {
        title: "How it works",
        body: "LEAD(expression, offset, default) uses offset 1 by default. The default is returned when the target row falls outside the partition; a NULL value in an existing target row remains NULL."
      },
      {
        title: "Practical considerations",
        body: "Without deterministic ordering, \u201Cnext\u201D is ambiguous. An outer ORDER BY does not define the window order; the OVER clause must specify it."
      }
    ],
    example: "SELECT user_id, happened_at,\n LEAD(happened_at) OVER (PARTITION BY user_id ORDER BY happened_at, id) AS next_event\nFROM events;",
    interview: [
      {
        question: "How would you calculate time until a user\u2019s next event?",
        answer: "Partition by user, order by timestamp plus a unique id, compute LEAD(timestamp), and subtract the current timestamp. Keep the last event\u2019s duration NULL unless the business defines a censoring endpoint.",
        followUp: "Why should an existing next event with NULL timestamp not be treated as missing automatically?"
      }
    ],
    revision: [
      "Forward in the window order",
      "When the following row does not exist",
      "Without deterministic ordering, \u201Cnext\u201D is ambiguous. An outer ORDER BY does not define the window order; the OVER clause must specify it."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-lead-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which direction does LEAD look?",
        options: [
          "Forward in the window order",
          "Backward always",
          "Across every partition",
          "Only to the first row"
        ],
        answer: "Forward in the window order",
        explanation: "LEAD(expression, offset, default) uses offset 1 by default. The default is returned when the target row falls outside the partition; a NULL value in an existing target row remains NULL.",
        hint: "LEAD reads a value from a following row in the same ordered partition. It supports next-event comparisons without a self join."
      },
      {
        id: "sql-lead-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "When is LEAD(x, 1, 0) default 0 used?",
        options: [
          "When the following row does not exist",
          "Whenever x is NULL",
          "For the current row",
          "Only at partition start"
        ],
        answer: "When the following row does not exist",
        explanation: "Without deterministic ordering, \u201Cnext\u201D is ambiguous. An outer ORDER BY does not define the window order; the OVER clause must specify it.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-lead-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you calculate time until a user\u2019s next event?",
        answer: "Partition by user, order by timestamp plus a unique id, compute LEAD(timestamp), and subtract the current timestamp. Keep the last event\u2019s duration NULL unless the business defines a censoring endpoint.",
        explanation: "LEAD(expression, offset, default) uses offset 1 by default. The default is returned when the target row falls outside the partition; a NULL value in an existing target row remains NULL. Without deterministic ordering, \u201Cnext\u201D is ambiguous. An outer ORDER BY does not define the window order; the OVER clause must specify it.",
        hint: "Why should an existing next event with NULL timestamp not be treated as missing automatically?"
      }
    ]
  },
  {
    id: "sql-lag",
    title: "LAG",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "LAG reads a value from a preceding row in an ordered partition. It is useful for changes over time and gap detection.",
    sections: [
      {
        title: "How it works",
        body: "LAG(expression, offset, default) defaults to the previous row. The first row has no predecessor, so it yields the supplied default or NULL."
      },
      {
        title: "Practical considerations",
        body: "LAG refers to a prior row, not necessarily yesterday. Sparse time-series data needs a calendar or an explicit date comparison when daily adjacency matters."
      }
    ],
    example: "SELECT day, revenue,\n revenue - LAG(revenue) OVER (ORDER BY day) AS change\nFROM daily_sales;",
    interview: [
      {
        question: "How do you distinguish a day-over-day change from change since the last observed record?",
        answer: "Use LAG(day) and LAG(value), verify that dates differ by one day, or left join values to a complete date calendar before applying LAG. Otherwise missing dates distort the metric.",
        followUp: "How would you compute a percentage change when the previous value is zero?"
      }
    ],
    revision: [
      "The preceding row in window order",
      "No; it returns the preceding available row",
      "LAG refers to a prior row, not necessarily yesterday. Sparse time-series data needs a calendar or an explicit date comparison when daily adjacency matters."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-lag-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which row does LAG(x) read by default?",
        options: [
          "The preceding row in window order",
          "The following row",
          "The first row always",
          "A random row"
        ],
        answer: "The preceding row in window order",
        explanation: "LAG(expression, offset, default) defaults to the previous row. The first row has no predecessor, so it yields the supplied default or NULL.",
        hint: "LAG reads a value from a preceding row in an ordered partition. It is useful for changes over time and gap detection."
      },
      {
        id: "sql-lag-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Can LAG(day) guarantee the previous calendar day exists?",
        options: [
          "No; it returns the preceding available row",
          "Yes",
          "Only with DESC",
          "Only with SUM"
        ],
        answer: "No; it returns the preceding available row",
        explanation: "LAG refers to a prior row, not necessarily yesterday. Sparse time-series data needs a calendar or an explicit date comparison when daily adjacency matters.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-lag-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How do you distinguish a day-over-day change from change since the last observed record?",
        answer: "Use LAG(day) and LAG(value), verify that dates differ by one day, or left join values to a complete date calendar before applying LAG. Otherwise missing dates distort the metric.",
        explanation: "LAG(expression, offset, default) defaults to the previous row. The first row has no predecessor, so it yields the supplied default or NULL. LAG refers to a prior row, not necessarily yesterday. Sparse time-series data needs a calendar or an explicit date comparison when daily adjacency matters.",
        hint: "How would you compute a percentage change when the previous value is zero?"
      }
    ]
  },
  {
    id: "sql-common-table-expressions",
    title: "Common Table Expressions",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "A common table expression names a query for use within one statement. WITH improves readability and lets a complex transformation be written in stages.",
    sections: [
      {
        title: "How it works",
        body: "Each CTE can reference earlier CTEs. A CTE is not a permanent table. PostgreSQL may inline a side-effect-free non-recursive CTE or materialize it depending on usage and directives."
      },
      {
        title: "Practical considerations",
        body: "CTEs are not inherently faster. MATERIALIZED and NOT MATERIALIZED can influence optimization in PostgreSQL; inspect the actual plan before forcing either behavior."
      }
    ],
    example: "WITH totals AS (\n SELECT customer_id, SUM(amount) AS spent FROM orders GROUP BY customer_id\n) SELECT * FROM totals WHERE spent > 1000;",
    interview: [
      {
        question: "When can materializing a CTE help or hurt?",
        answer: "It can avoid repeated expensive work when referenced several times, but it can also block predicate pushdown and materialize too many rows. Compare plans and consider volatile expressions and repeated references.",
        followUp: "When might NOT MATERIALIZED duplicate computation?"
      }
    ],
    revision: [
      "For the enclosing SQL statement",
      "No; eligible CTEs may be inlined",
      "CTEs are not inherently faster. MATERIALIZED and NOT MATERIALIZED can influence optimization in PostgreSQL; inspect the actual plan before forcing either behavior."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-common-table-expressions-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "How long does a normal CTE name exist?",
        options: [
          "For the enclosing SQL statement",
          "Until the connection closes",
          "Permanently",
          "Until COMMIT only"
        ],
        answer: "For the enclosing SQL statement",
        explanation: "Each CTE can reference earlier CTEs. A CTE is not a permanent table. PostgreSQL may inline a side-effect-free non-recursive CTE or materialize it depending on usage and directives.",
        hint: "A common table expression names a query for use within one statement. WITH improves readability and lets a complex transformation be written in stages."
      },
      {
        id: "sql-common-table-expressions-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Does a CTE always create an optimization barrier in modern PostgreSQL?",
        options: [
          "No; eligible CTEs may be inlined",
          "Yes, always",
          "Only when it has one row",
          "Only with SELECT *"
        ],
        answer: "No; eligible CTEs may be inlined",
        explanation: "CTEs are not inherently faster. MATERIALIZED and NOT MATERIALIZED can influence optimization in PostgreSQL; inspect the actual plan before forcing either behavior.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-common-table-expressions-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "When can materializing a CTE help or hurt?",
        answer: "It can avoid repeated expensive work when referenced several times, but it can also block predicate pushdown and materialize too many rows. Compare plans and consider volatile expressions and repeated references.",
        explanation: "Each CTE can reference earlier CTEs. A CTE is not a permanent table. PostgreSQL may inline a side-effect-free non-recursive CTE or materialize it depending on usage and directives. CTEs are not inherently faster. MATERIALIZED and NOT MATERIALIZED can influence optimization in PostgreSQL; inspect the actual plan before forcing either behavior.",
        hint: "When might NOT MATERIALIZED duplicate computation?"
      }
    ]
  },
  {
    id: "sql-recursive-ctes",
    title: "Recursive CTEs",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "A recursive CTE repeatedly applies a recursive query to traverse hierarchical or graph-shaped data. It contains a non-recursive anchor and a recursive step.",
    sections: [
      {
        title: "How it works",
        body: "WITH RECURSIVE first evaluates the anchor, then repeatedly evaluates the recursive term using the current working set until no new rows remain. UNION ALL preserves duplicates."
      },
      {
        title: "Practical considerations",
        body: "Cycles can cause non-termination. Use a visited-path check, a depth bound, or PostgreSQL CYCLE support. Filtering only the final output does not necessarily prevent runaway recursion."
      }
    ],
    example: "WITH RECURSIVE tree AS (\n SELECT id, manager_id, 0 AS depth FROM employees WHERE manager_id IS NULL\n UNION ALL\n SELECT e.id, e.manager_id, t.depth + 1 FROM employees e JOIN tree t ON e.manager_id = t.id\n) SELECT * FROM tree;",
    interview: [
      {
        question: "How would you traverse a category hierarchy safely?",
        answer: "Anchor at the selected category, recurse to children, carry the visited ids, and reject any id already in the path. Optionally bound depth and index parent_id. Choose UNION versus UNION ALL deliberately.",
        followUp: "Why does UNION remove duplicate rows but not necessarily every logical cycle when depth is selected?"
      }
    ],
    revision: [
      "The anchor term",
      "Cycles",
      "Cycles can cause non-termination. Use a visited-path check, a depth bound, or PostgreSQL CYCLE support. Filtering only the final output does not necessarily prevent runaway recursion."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-recursive-ctes-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What provides the starting rows?",
        options: [
          "The anchor term",
          "The final ORDER BY",
          "The recursive alias alone",
          "HAVING"
        ],
        answer: "The anchor term",
        explanation: "WITH RECURSIVE first evaluates the anchor, then repeatedly evaluates the recursive term using the current working set until no new rows remain. UNION ALL preserves duplicates.",
        hint: "A recursive CTE repeatedly applies a recursive query to traverse hierarchical or graph-shaped data. It contains a non-recursive anchor and a recursive step."
      },
      {
        id: "sql-recursive-ctes-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "What data issue must graph traversal guard against?",
        options: [
          "Cycles",
          "Every primary key",
          "An empty result only",
          "Uppercase identifiers"
        ],
        answer: "Cycles",
        explanation: "Cycles can cause non-termination. Use a visited-path check, a depth bound, or PostgreSQL CYCLE support. Filtering only the final output does not necessarily prevent runaway recursion.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-recursive-ctes-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you traverse a category hierarchy safely?",
        answer: "Anchor at the selected category, recurse to children, carry the visited ids, and reject any id already in the path. Optionally bound depth and index parent_id. Choose UNION versus UNION ALL deliberately.",
        explanation: "WITH RECURSIVE first evaluates the anchor, then repeatedly evaluates the recursive term using the current working set until no new rows remain. UNION ALL preserves duplicates. Cycles can cause non-termination. Use a visited-path check, a depth bound, or PostgreSQL CYCLE support. Filtering only the final output does not necessarily prevent runaway recursion.",
        hint: "Why does UNION remove duplicate rows but not necessarily every logical cycle when depth is selected?"
      }
    ]
  },
  {
    id: "sql-query-optimization",
    title: "Query Optimization",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "Query optimization chooses efficient access paths and join strategies while preserving query meaning. Performance depends on data distributions, indexes, and work volume.",
    sections: [
      {
        title: "How it works",
        body: "Use EXPLAIN to inspect estimates and EXPLAIN ANALYZE to measure actual execution. Compare estimated versus actual rows, scan types, join algorithms, sort spills, and repeated loops."
      },
      {
        title: "Practical considerations",
        body: "EXPLAIN ANALYZE executes the statement. Use caution for writes and expensive queries. Keep statistics current, avoid unnecessary columns, and fix the most expensive measured work first."
      }
    ],
    example: "EXPLAIN (ANALYZE, BUFFERS)\nSELECT id FROM orders\nWHERE customer_id = 42 AND created_at >= CURRENT_DATE - INTERVAL '30 days';",
    interview: [
      {
        question: "Why can an index scan be slower than a sequential scan?",
        answer: "If a query selects a large portion of a table, many random heap fetches can cost more than scanning pages sequentially. Table size, caching, correlation, index coverage, and parallelism affect the choice.",
        followUp: "How can extended statistics help correlated predicates?"
      }
    ],
    revision: [
      "EXPLAIN ANALYZE",
      "Outdated statistics or unmodeled value correlations",
      "EXPLAIN ANALYZE executes the statement. Use caution for writes and expensive queries. Keep statistics current, avoid unnecessary columns, and fix the most expensive measured work first."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-query-optimization-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which command measures actual execution in PostgreSQL?",
        options: [
          "EXPLAIN ANALYZE",
          "EXPLAIN only",
          "DESCRIBE only",
          "SHOW TABLES"
        ],
        answer: "EXPLAIN ANALYZE",
        explanation: "Use EXPLAIN to inspect estimates and EXPLAIN ANALYZE to measure actual execution. Compare estimated versus actual rows, scan types, join algorithms, sort spills, and repeated loops.",
        hint: "Query optimization chooses efficient access paths and join strategies while preserving query meaning. Performance depends on data distributions, indexes, and work volume."
      },
      {
        id: "sql-query-optimization-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "What can a large estimated-versus-actual row mismatch suggest?",
        options: [
          "Outdated statistics or unmodeled value correlations",
          "Guaranteed index corruption",
          "A syntax error",
          "That all indexes should be removed"
        ],
        answer: "Outdated statistics or unmodeled value correlations",
        explanation: "EXPLAIN ANALYZE executes the statement. Use caution for writes and expensive queries. Keep statistics current, avoid unnecessary columns, and fix the most expensive measured work first.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-query-optimization-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "Why can an index scan be slower than a sequential scan?",
        answer: "If a query selects a large portion of a table, many random heap fetches can cost more than scanning pages sequentially. Table size, caching, correlation, index coverage, and parallelism affect the choice.",
        explanation: "Use EXPLAIN to inspect estimates and EXPLAIN ANALYZE to measure actual execution. Compare estimated versus actual rows, scan types, join algorithms, sort spills, and repeated loops. EXPLAIN ANALYZE executes the statement. Use caution for writes and expensive queries. Keep statistics current, avoid unnecessary columns, and fix the most expensive measured work first.",
        hint: "How can extended statistics help correlated predicates?"
      }
    ]
  },
  {
    id: "sql-indexing-and-query-performance",
    title: "Indexing and Query Performance",
    subjectId: "sql",
    module: "Advanced SQL",
    minutes: 7,
    difficulty: "Hard",
    overview: "Indexes trade extra storage and write work for faster access to selected rows or ordered results. A useful index matches actual predicates and ordering.",
    sections: [
      {
        title: "How it works",
        body: "A composite B-tree index is ordered lexicographically. Leading equality predicates followed by a range often exploit it well. An index-only scan also depends on visibility information and included columns."
      },
      {
        title: "Practical considerations",
        body: "Wrapping an indexed column in a function may prevent use of a plain index; consider a suitable expression index. Every additional index increases insert, update, and maintenance cost."
      }
    ],
    example: "CREATE INDEX orders_customer_created_idx ON orders (customer_id, created_at DESC);\nSELECT id FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;",
    interview: [
      {
        question: "How would you decide whether to add a covering index?",
        answer: "Measure the query frequency and plan, select only needed columns, and weigh reduced heap access against index size and write amplification. In PostgreSQL an index-only scan still checks visibility unless pages are all-visible.",
        followUp: "Why may a newly updated table still require heap fetches during an index-only scan?"
      }
    ],
    revision: [
      "Additional storage and write maintenance",
      "(customer_id, created_at DESC)",
      "Wrapping an indexed column in a function may prevent use of a plain index; consider a suitable expression index. Every additional index increases insert, update, and maintenance cost."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-indexing-and-query-performance-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What is a common cost of adding an index?",
        options: [
          "Additional storage and write maintenance",
          "Loss of all transactions",
          "Automatic duplicate deletion",
          "Guaranteed slower reads"
        ],
        answer: "Additional storage and write maintenance",
        explanation: "A composite B-tree index is ordered lexicographically. Leading equality predicates followed by a range often exploit it well. An index-only scan also depends on visibility information and included columns.",
        hint: "Indexes trade extra storage and write work for faster access to selected rows or ordered results. A useful index matches actual predicates and ordering."
      },
      {
        id: "sql-indexing-and-query-performance-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which index naturally supports customer-specific newest orders?",
        options: [
          "(customer_id, created_at DESC)",
          "(amount) only",
          "(status) only",
          "No index can support sorting"
        ],
        answer: "(customer_id, created_at DESC)",
        explanation: "Wrapping an indexed column in a function may prevent use of a plain index; consider a suitable expression index. Every additional index increases insert, update, and maintenance cost.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-indexing-and-query-performance-hard",
        difficulty: "Hard",
        type: "descriptive",
        prompt: "How would you decide whether to add a covering index?",
        answer: "Measure the query frequency and plan, select only needed columns, and weigh reduced heap access against index size and write amplification. In PostgreSQL an index-only scan still checks visibility unless pages are all-visible.",
        explanation: "A composite B-tree index is ordered lexicographically. Leading equality predicates followed by a range often exploit it well. An index-only scan also depends on visibility information and included columns. Wrapping an indexed column in a function may prevent use of a plain index; consider a suitable expression index. Every additional index increases insert, update, and maintenance cost.",
        hint: "Why may a newly updated table still require heap fetches during an index-only scan?"
      }
    ]
  },
  {
    id: "sql-find-the-second-highest-salary",
    title: "Find the Second Highest Salary",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Return the second highest distinct non-NULL salary. Duplicate salaries represent the same salary level; if fewer than two distinct values exist, return NULL.",
    sections: [
      {
        title: "How it works",
        body: "The inner MAX finds the highest salary. Filtering below that value and applying MAX again finds the second distinct salary. An aggregate without GROUP BY still returns one row for empty input."
      },
      {
        title: "Practical considerations",
        body: "Do not sort employee rows and simply take the second row: ties at the highest salary can produce the wrong distinct salary. Decide whether the output should be a scalar NULL or no rows."
      }
    ],
    example: "SELECT MAX(salary) AS second_highest_salary\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);",
    interview: [
      {
        question: "Write a query for the second highest distinct salary and explain its empty-input behavior.",
        answer: "The outer MAX of salaries lower than the global MAX yields the second distinct value. If no lower salary exists, MAX returns NULL. Both aggregates ignore NULL salaries.",
        followUp: "How would you return names of every employee earning that salary?"
      }
    ],
    revision: [
      "One distinct salary level",
      "One row containing NULL",
      "Do not sort employee rows and simply take the second row: ties at the highest salary can produce the wrong distinct salary. Decide whether the output should be a scalar NULL or no rows."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-the-second-highest-salary-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What should duplicate highest salaries count as?",
        options: [
          "One distinct salary level",
          "Two separate levels",
          "Invalid records",
          "Zero levels"
        ],
        answer: "One distinct salary level",
        explanation: "The inner MAX finds the highest salary. Filtering below that value and applying MAX again finds the second distinct salary. An aggregate without GROUP BY still returns one row for empty input.",
        hint: "Return the second highest distinct non-NULL salary. Duplicate salaries represent the same salary level; if fewer than two distinct values exist, return NULL."
      },
      {
        id: "sql-find-the-second-highest-salary-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "What does the nested MAX solution return when only one distinct salary exists?",
        options: [
          "One row containing NULL",
          "The highest salary",
          "Two rows",
          "A division error"
        ],
        answer: "One row containing NULL",
        explanation: "Do not sort employee rows and simply take the second row: ties at the highest salary can produce the wrong distinct salary. Decide whether the output should be a scalar NULL or no rows.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-the-second-highest-salary-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a query for the second highest distinct salary and explain its empty-input behavior.",
        answer: "SELECT MAX(salary) AS second_highest_salary\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);\n\nThe outer MAX of salaries lower than the global MAX yields the second distinct value. If no lower salary exists, MAX returns NULL. Both aggregates ignore NULL salaries.",
        explanation: "The inner MAX finds the highest salary. Filtering below that value and applying MAX again finds the second distinct salary. An aggregate without GROUP BY still returns one row for empty input. Do not sort employee rows and simply take the second row: ties at the highest salary can produce the wrong distinct salary. Decide whether the output should be a scalar NULL or no rows.",
        hint: "How would you return names of every employee earning that salary?"
      },
      {
        prompt: "Salaries are 100, 100, 90, and 80. Which method returns the second highest distinct salary even when the top salary is duplicated?",
        options: [
          "DENSE_RANK() OVER (ORDER BY salary DESC) and filter rank = 2",
          "ROW_NUMBER() OVER (ORDER BY salary DESC) and filter row_number = 2",
          "RANK() OVER (ORDER BY salary DESC) and filter rank = 2"
        ],
        answer: "DENSE_RANK() OVER (ORDER BY salary DESC) and filter rank = 2",
        explanation: "DENSE_RANK assigns both 100 rows rank 1 and 90 rank 2. ROW_NUMBER can make the second 100 row number 2; RANK leaves a gap so 90 receives rank 3.",
        hint: "The task asks for the second distinct salary value, not the second physical row.",
        id: "sql-find-the-second-highest-salary-hard-mcq",
        difficulty: "Hard",
        type: "mcq"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        }
      ],
      expected: [
        [
          "90000"
        ]
      ],
      solution: "SELECT MAX(salary) AS second_highest_salary\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);",
      alternative: "SELECT (SELECT DISTINCT salary FROM employees WHERE salary IS NOT NULL ORDER BY salary DESC LIMIT 1 OFFSET 1) AS second_highest_salary;"
    }
  },
  {
    id: "sql-find-the-kth-highest-salary",
    title: "Find the Kth Highest Salary",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Return the kth highest distinct salary for a positive integer k. Use k = 3 for the sample, so the expected value is 80000.",
    sections: [
      {
        title: "How it works",
        body: "DENSE_RANK groups equal salaries at the same level without gaps. Exclude NULL salaries, rank descending, and select the requested level. MAX produces a scalar NULL when k is absent."
      },
      {
        title: "Practical considerations",
        body: "Validate k as a positive integer and bind it as a parameter. RANK can skip levels after ties; ROW_NUMBER counts individual employees rather than distinct salaries."
      }
    ],
    example: "WITH ranked AS (\n SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_level\n FROM employees WHERE salary IS NOT NULL\n)\nSELECT MAX(salary) AS kth_highest_salary FROM ranked WHERE salary_level = 3;",
    interview: [
      {
        question: "Write a parameterized kth-distinct-salary query, including behavior when k is too large.",
        answer: "Rank distinct levels with DENSE_RANK, then aggregate the selected rank to one value. Bind k through the driver. A missing rank yields NULL rather than an arbitrary employee.",
        followUp: "When could DISTINCT ORDER BY with OFFSET be a simpler solution?"
      }
    ],
    revision: [
      "DENSE_RANK",
      "80",
      "Validate k as a positive integer and bind it as a parameter. RANK can skip levels after ties; ROW_NUMBER counts individual employees rather than distinct salaries."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-the-kth-highest-salary-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which function numbers distinct salary levels without gaps?",
        options: [
          "DENSE_RANK",
          "RANK",
          "ROW_NUMBER",
          "COUNT"
        ],
        answer: "DENSE_RANK",
        explanation: "DENSE_RANK groups equal salaries at the same level without gaps. Exclude NULL salaries, rank descending, and select the requested level. MAX produces a scalar NULL when k is absent.",
        hint: "Return the kth highest distinct salary for a positive integer k. Use k = 3 for the sample, so the expected value is 80000."
      },
      {
        id: "sql-find-the-kth-highest-salary-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "For salaries 100, 100, 80, the second distinct salary is what?",
        options: [
          "80",
          "100",
          "NULL",
          "2"
        ],
        answer: "80",
        explanation: "Validate k as a positive integer and bind it as a parameter. RANK can skip levels after ties; ROW_NUMBER counts individual employees rather than distinct salaries.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-the-kth-highest-salary-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a parameterized kth-distinct-salary query, including behavior when k is too large.",
        answer: "WITH ranked AS (\n SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_level\n FROM employees WHERE salary IS NOT NULL\n)\nSELECT MAX(salary) AS kth_highest_salary FROM ranked WHERE salary_level = 3;\n\nRank distinct levels with DENSE_RANK, then aggregate the selected rank to one value. Bind k through the driver. A missing rank yields NULL rather than an arbitrary employee.",
        explanation: "DENSE_RANK groups equal salaries at the same level without gaps. Exclude NULL salaries, rank descending, and select the requested level. MAX produces a scalar NULL when k is absent. Validate k as a positive integer and bind it as a parameter. RANK can skip levels after ties; ROW_NUMBER counts individual employees rather than distinct salaries.",
        hint: "When could DISTINCT ORDER BY with OFFSET be a simpler solution?"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        }
      ],
      expected: [
        [
          "80000"
        ]
      ],
      solution: "WITH ranked AS (\n SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_level\n FROM employees WHERE salary IS NOT NULL\n)\nSELECT MAX(salary) AS kth_highest_salary FROM ranked WHERE salary_level = 3;",
      alternative: "SELECT (SELECT DISTINCT salary FROM employees WHERE salary IS NOT NULL ORDER BY salary DESC LIMIT 1 OFFSET 2) AS kth_highest_salary;"
    }
  },
  {
    id: "sql-find-duplicate-records",
    title: "Find Duplicate Records",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Find email values that appear more than once and report their counts. Define duplicates by the business key email rather than by the unique row id.",
    sections: [
      {
        title: "How it works",
        body: "GROUP BY email puts equal emails in the same group. HAVING COUNT(*) > 1 filters to repeated groups. COUNT(*) counts every row, including rows whose email is NULL."
      },
      {
        title: "Practical considerations",
        body: "Decide how case, whitespace, and NULL should affect identity before deduplicating. Normalization rules must agree with the intended UNIQUE constraint."
      }
    ],
    example: "SELECT email, COUNT(*) AS duplicate_count\nFROM contacts\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY email;",
    interview: [
      {
        question: "Write a query identifying duplicate emails and explain how NULL is treated.",
        answer: "Group by the chosen email representation and use HAVING COUNT(*) > 1. SQL grouping places NULL emails together; explicitly exclude NULL if unknown addresses should not be treated as duplicates.",
        followUp: "How would you enforce case-insensitive uniqueness after cleanup?"
      }
    ],
    revision: [
      "HAVING COUNT(*) > 1",
      "A unique id splits each row into its own group",
      "Decide how case, whitespace, and NULL should affect identity before deduplicating. Normalization rules must agree with the intended UNIQUE constraint."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-duplicate-records-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which clause filters to groups that repeat?",
        options: [
          "HAVING COUNT(*) > 1",
          "WHERE COUNT(*) > 1",
          "ORDER BY email",
          "LIMIT 1"
        ],
        answer: "HAVING COUNT(*) > 1",
        explanation: "GROUP BY email puts equal emails in the same group. HAVING COUNT(*) > 1 filters to repeated groups. COUNT(*) counts every row, including rows whose email is NULL.",
        hint: "Find email values that appear more than once and report their counts. Define duplicates by the business key email rather than by the unique row id."
      },
      {
        id: "sql-find-duplicate-records-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Why should id not be included in GROUP BY when detecting duplicate emails?",
        options: [
          "A unique id splits each row into its own group",
          "It always raises a syntax error",
          "It removes NULLs",
          "It changes email casing"
        ],
        answer: "A unique id splits each row into its own group",
        explanation: "Decide how case, whitespace, and NULL should affect identity before deduplicating. Normalization rules must agree with the intended UNIQUE constraint.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-duplicate-records-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a query identifying duplicate emails and explain how NULL is treated.",
        answer: "SELECT email, COUNT(*) AS duplicate_count\nFROM contacts\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY email;\n\nGroup by the chosen email representation and use HAVING COUNT(*) > 1. SQL grouping places NULL emails together; explicitly exclude NULL if unknown addresses should not be treated as duplicates.",
        explanation: "GROUP BY email puts equal emails in the same group. HAVING COUNT(*) > 1 filters to repeated groups. COUNT(*) counts every row, including rows whose email is NULL. Decide how case, whitespace, and NULL should affect identity before deduplicating. Normalization rules must agree with the intended UNIQUE constraint.",
        hint: "How would you enforce case-insensitive uniqueness after cleanup?"
      }
    ],
    sql: {
      tables: [
        {
          name: "contacts",
          columns: [
            "id",
            "email"
          ],
          rows: [
            [
              "1",
              "asha@example.com"
            ],
            [
              "2",
              "ben@example.com"
            ],
            [
              "3",
              "asha@example.com"
            ],
            [
              "4",
              "chen@example.com"
            ],
            [
              "5",
              "ben@example.com"
            ]
          ]
        }
      ],
      expected: [
        [
          "asha@example.com",
          "2"
        ],
        [
          "ben@example.com",
          "2"
        ]
      ],
      solution: "SELECT email, COUNT(*) AS duplicate_count\nFROM contacts\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY email;"
    }
  },
  {
    id: "sql-delete-duplicate-records",
    title: "Delete Duplicate Records",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Delete duplicate email rows while retaining the row with the smallest id for each email. The sample keeps ids 1, 2, and 4.",
    sections: [
      {
        title: "How it works",
        body: "ROW_NUMBER partitioned by email and ordered by id marks the survivor as 1. Delete only rows whose number exceeds 1. The ordering defines a deterministic retention rule."
      },
      {
        title: "Practical considerations",
        body: "Preview the rows to delete and run cleanup inside a transaction. Back up important data and add an appropriate UNIQUE constraint after cleanup to prevent new duplicates. PostgreSQL DELETE USING is dialect-specific."
      }
    ],
    example: "WITH ranked AS (\n SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn\n FROM contacts\n)\nDELETE FROM contacts c USING ranked r\nWHERE c.id = r.id AND r.rn > 1\nRETURNING c.id;",
    interview: [
      {
        question: "Write a safe deduplication query keeping the smallest id and describe rollout precautions.",
        answer: "Preview a ranked result, delete rn > 1 within a transaction, validate surviving rows, and then add a compatible unique index. Pause or coordinate concurrent writers so duplicates cannot reappear between cleanup and constraint creation.",
        followUp: "What if duplicate rows have child references that must be reassigned before deletion?"
      }
    ],
    revision: [
      "ROW_NUMBER = 1",
      "Otherwise the retained row can be arbitrary and discard preferred data",
      "Preview the rows to delete and run cleanup inside a transaction. Back up important data and add an appropriate UNIQUE constraint after cleanup to prevent new duplicates. PostgreSQL DELETE USING is dialect-specific."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-delete-duplicate-records-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which rank should be retained for each email?",
        options: [
          "ROW_NUMBER = 1",
          "Every RANK > 1",
          "Only the largest id automatically",
          "All tied salaries"
        ],
        answer: "ROW_NUMBER = 1",
        explanation: "ROW_NUMBER partitioned by email and ordered by id marks the survivor as 1. Delete only rows whose number exceeds 1. The ordering defines a deterministic retention rule.",
        hint: "Delete duplicate email rows while retaining the row with the smallest id for each email. The sample keeps ids 1, 2, and 4."
      },
      {
        id: "sql-delete-duplicate-records-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Why must the survivor rule be explicit?",
        options: [
          "Otherwise the retained row can be arbitrary and discard preferred data",
          "Because DELETE cannot use a CTE",
          "Because all duplicates are physically adjacent",
          "Because NULL cannot be grouped"
        ],
        answer: "Otherwise the retained row can be arbitrary and discard preferred data",
        explanation: "Preview the rows to delete and run cleanup inside a transaction. Back up important data and add an appropriate UNIQUE constraint after cleanup to prevent new duplicates. PostgreSQL DELETE USING is dialect-specific.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-delete-duplicate-records-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a safe deduplication query keeping the smallest id and describe rollout precautions.",
        answer: "WITH ranked AS (\n SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn\n FROM contacts\n)\nDELETE FROM contacts c USING ranked r\nWHERE c.id = r.id AND r.rn > 1\nRETURNING c.id;\n\nPreview a ranked result, delete rn > 1 within a transaction, validate surviving rows, and then add a compatible unique index. Pause or coordinate concurrent writers so duplicates cannot reappear between cleanup and constraint creation.",
        explanation: "ROW_NUMBER partitioned by email and ordered by id marks the survivor as 1. Delete only rows whose number exceeds 1. The ordering defines a deterministic retention rule. Preview the rows to delete and run cleanup inside a transaction. Back up important data and add an appropriate UNIQUE constraint after cleanup to prevent new duplicates. PostgreSQL DELETE USING is dialect-specific.",
        hint: "What if duplicate rows have child references that must be reassigned before deletion?"
      }
    ],
    sql: {
      tables: [
        {
          name: "contacts",
          columns: [
            "id",
            "email"
          ],
          rows: [
            [
              "1",
              "asha@example.com"
            ],
            [
              "2",
              "ben@example.com"
            ],
            [
              "3",
              "asha@example.com"
            ],
            [
              "4",
              "chen@example.com"
            ],
            [
              "5",
              "ben@example.com"
            ]
          ]
        }
      ],
      expected: [
        [
          "3"
        ],
        [
          "5"
        ]
      ],
      solution: "WITH ranked AS (\n SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn\n FROM contacts\n)\nDELETE FROM contacts c USING ranked r\nWHERE c.id = r.id AND r.rn > 1\nRETURNING c.id;",
      alternative: "DELETE FROM contacts a USING contacts b WHERE a.email = b.email AND a.id > b.id; -- Use IS NOT DISTINCT FROM if NULL emails should also be deduplicated."
    }
  },
  {
    id: "sql-find-employees-earning-more-than-their-managers",
    title: "Find Employees Earning More Than Their Managers",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Return employees whose salary exceeds their own manager\u2019s salary. Compare each employee with the manager referenced by manager_id.",
    sections: [
      {
        title: "How it works",
        body: "Self-join employees as e and m on e.manager_id = m.id, then retain e.salary > m.salary. Employees with no matching manager are excluded by INNER JOIN."
      },
      {
        title: "Practical considerations",
        body: "Comparisons involving a NULL salary are UNKNOWN and are excluded. Define whether inconsistent manager references should be rejected by a foreign key or reported separately."
      }
    ],
    example: "SELECT e.name AS employee, e.salary, m.name AS manager\nFROM employees e\nJOIN employees m ON e.manager_id = m.id\nWHERE e.salary > m.salary\nORDER BY e.id;",
    interview: [
      {
        question: "Write the self-join for employees earning more than their managers and discuss missing data.",
        answer: "Use an INNER JOIN on the manager foreign key and a salary comparison. An employee without a manager or with a NULL compared salary does not qualify. Use separate diagnostics if missing manager data must be reported.",
        followUp: "How would you list every employee with their manager even when no manager exists?"
      }
    ],
    revision: [
      "Join e.manager_id to m.id",
      "Eli",
      "Comparisons involving a NULL salary are UNKNOWN and are excluded. Define whether inconsistent manager references should be rejected by a foreign key or reported separately."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-employees-earning-more-than-their-managers-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "How is the manager found?",
        options: [
          "Join e.manager_id to m.id",
          "Join e.id to m.id",
          "Compare every employee to every employee",
          "Group by salary"
        ],
        answer: "Join e.manager_id to m.id",
        explanation: "Self-join employees as e and m on e.manager_id = m.id, then retain e.salary > m.salary. Employees with no matching manager are excluded by INNER JOIN.",
        hint: "Return employees whose salary exceeds their own manager\u2019s salary. Compare each employee with the manager referenced by manager_id."
      },
      {
        id: "sql-find-employees-earning-more-than-their-managers-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which sample employee earns more than their manager?",
        options: [
          "Eli",
          "Ben",
          "Chen",
          "Dina"
        ],
        answer: "Eli",
        explanation: "Comparisons involving a NULL salary are UNKNOWN and are excluded. Define whether inconsistent manager references should be rejected by a foreign key or reported separately.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-employees-earning-more-than-their-managers-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write the self-join for employees earning more than their managers and discuss missing data.",
        answer: "SELECT e.name AS employee, e.salary, m.name AS manager\nFROM employees e\nJOIN employees m ON e.manager_id = m.id\nWHERE e.salary > m.salary\nORDER BY e.id;\n\nUse an INNER JOIN on the manager foreign key and a salary comparison. An employee without a manager or with a NULL compared salary does not qualify. Use separate diagnostics if missing manager data must be reported.",
        explanation: "Self-join employees as e and m on e.manager_id = m.id, then retain e.salary > m.salary. Employees with no matching manager are excluded by INNER JOIN. Comparisons involving a NULL salary are UNKNOWN and are excluded. Define whether inconsistent manager references should be rejected by a foreign key or reported separately.",
        hint: "How would you list every employee with their manager even when no manager exists?"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        }
      ],
      expected: [
        [
          "Eli",
          "95000",
          "Asha"
        ]
      ],
      solution: "SELECT e.name AS employee, e.salary, m.name AS manager\nFROM employees e\nJOIN employees m ON e.manager_id = m.id\nWHERE e.salary > m.salary\nORDER BY e.id;"
    }
  },
  {
    id: "sql-find-department-wise-highest-salary",
    title: "Find Department-Wise Highest Salary",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Return every employee tied for the highest salary within each department. Exclude employees without a department in this version.",
    sections: [
      {
        title: "How it works",
        body: "DENSE_RANK partitioned by department and ordered by salary descending gives the largest salary rank 1. Joining departments adds the department name without changing the rank grain."
      },
      {
        title: "Practical considerations",
        body: "MAX(salary) grouped by department gives salaries but not employee names. Joining back to the grouped maximum or using DENSE_RANK preserves every tie. Exclude NULL salaries before ranking."
      }
    ],
    example: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.rnk = 1\nORDER BY d.id, r.id;",
    interview: [
      {
        question: "Write a department-wise maximum salary query that includes tied employees.",
        answer: "Rank employees within each department by salary descending and filter rank 1, or join employees to per-department MAX(salary). Keep departmentless employees out explicitly if that is the requirement.",
        followUp: "What changes if the requirement is exactly one employee per department?"
      }
    ],
    revision: [
      "Return every tied employee",
      "PARTITION BY department_id",
      "MAX(salary) grouped by department gives salaries but not employee names. Joining back to the grouped maximum or using DENSE_RANK preserves every tie. Exclude NULL salaries before ranking."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-department-wise-highest-salary-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "How should ties for highest department salary be handled?",
        options: [
          "Return every tied employee",
          "Return an arbitrary one",
          "Delete duplicates",
          "Use a global LIMIT 1"
        ],
        answer: "Return every tied employee",
        explanation: "DENSE_RANK partitioned by department and ordered by salary descending gives the largest salary rank 1. Joining departments adds the department name without changing the rank grain.",
        hint: "Return every employee tied for the highest salary within each department. Exclude employees without a department in this version."
      },
      {
        id: "sql-find-department-wise-highest-salary-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which window partition is needed?",
        options: [
          "PARTITION BY department_id",
          "PARTITION BY employee id",
          "No partition",
          "PARTITION BY salary"
        ],
        answer: "PARTITION BY department_id",
        explanation: "MAX(salary) grouped by department gives salaries but not employee names. Joining back to the grouped maximum or using DENSE_RANK preserves every tie. Exclude NULL salaries before ranking.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-department-wise-highest-salary-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a department-wise maximum salary query that includes tied employees.",
        answer: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.rnk = 1\nORDER BY d.id, r.id;\n\nRank employees within each department by salary descending and filter rank 1, or join employees to per-department MAX(salary). Keep departmentless employees out explicitly if that is the requirement.",
        explanation: "DENSE_RANK partitioned by department and ordered by salary descending gives the largest salary rank 1. Joining departments adds the department name without changing the rank grain. MAX(salary) grouped by department gives salaries but not employee names. Joining back to the grouped maximum or using DENSE_RANK preserves every tie. Exclude NULL salaries before ranking.",
        hint: "What changes if the requirement is exactly one employee per department?"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        },
        {
          name: "departments",
          columns: [
            "id",
            "name"
          ],
          rows: [
            [
              "10",
              "Engineering"
            ],
            [
              "20",
              "Data"
            ],
            [
              "30",
              "Support"
            ]
          ]
        }
      ],
      expected: [
        [
          "Engineering",
          "Asha",
          "90000"
        ],
        [
          "Data",
          "Chen",
          "80000"
        ]
      ],
      solution: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.rnk = 1\nORDER BY d.id, r.id;",
      alternative: "SELECT d.name AS department, e.name AS employee, e.salary FROM employees e JOIN (SELECT department_id, MAX(salary) AS maximum FROM employees GROUP BY department_id) x ON e.department_id = x.department_id AND e.salary = x.maximum JOIN departments d ON d.id = e.department_id;"
    }
  },
  {
    id: "sql-find-employees-with-no-department",
    title: "Find Employees With No Department",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Find employees with no matching department record, including a NULL department_id and any orphaned foreign key if the schema permits one.",
    sections: [
      {
        title: "How it works",
        body: "LEFT JOIN keeps all employees. WHERE d.id IS NULL finds rows where no department matched, provided departments.id is NOT NULL as a primary key."
      },
      {
        title: "Practical considerations",
        body: "Testing e.department_id IS NULL only finds explicitly unassigned employees; it does not detect orphaned non-NULL ids. A validated foreign key prevents those orphans."
      }
    ],
    example: "SELECT e.id, e.name\nFROM employees e\nLEFT JOIN departments d ON d.id = e.department_id\nWHERE d.id IS NULL\nORDER BY e.id;",
    interview: [
      {
        question: "Write a query for employees lacking a valid department and explain the nullable-key trap.",
        answer: "Left join on department id and select rows whose right primary key is NULL. A nullable department name could be NULL even on a valid match, so it is not a reliable existence indicator.",
        followUp: "How does NOT EXISTS express the same anti-join?"
      }
    ],
    revision: [
      "LEFT JOIN",
      "The primary key cannot be NULL on a genuine matched department",
      "Testing e.department_id IS NULL only finds explicitly unassigned employees; it does not detect orphaned non-NULL ids. A validated foreign key prevents those orphans."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-employees-with-no-department-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which join keeps employees without matches?",
        options: [
          "LEFT JOIN",
          "INNER JOIN",
          "CROSS JOIN",
          "A join requiring d.id IS NOT NULL"
        ],
        answer: "LEFT JOIN",
        explanation: "LEFT JOIN keeps all employees. WHERE d.id IS NULL finds rows where no department matched, provided departments.id is NOT NULL as a primary key.",
        hint: "Find employees with no matching department record, including a NULL department_id and any orphaned foreign key if the schema permits one."
      },
      {
        id: "sql-find-employees-with-no-department-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Why check d.id rather than d.name for NULL?",
        options: [
          "The primary key cannot be NULL on a genuine matched department",
          "Names are always unique",
          "Names are numeric",
          "It forces a full scan"
        ],
        answer: "The primary key cannot be NULL on a genuine matched department",
        explanation: "Testing e.department_id IS NULL only finds explicitly unassigned employees; it does not detect orphaned non-NULL ids. A validated foreign key prevents those orphans.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-employees-with-no-department-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a query for employees lacking a valid department and explain the nullable-key trap.",
        answer: "SELECT e.id, e.name\nFROM employees e\nLEFT JOIN departments d ON d.id = e.department_id\nWHERE d.id IS NULL\nORDER BY e.id;\n\nLeft join on department id and select rows whose right primary key is NULL. A nullable department name could be NULL even on a valid match, so it is not a reliable existence indicator.",
        explanation: "LEFT JOIN keeps all employees. WHERE d.id IS NULL finds rows where no department matched, provided departments.id is NOT NULL as a primary key. Testing e.department_id IS NULL only finds explicitly unassigned employees; it does not detect orphaned non-NULL ids. A validated foreign key prevents those orphans.",
        hint: "How does NOT EXISTS express the same anti-join?"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        },
        {
          name: "departments",
          columns: [
            "id",
            "name"
          ],
          rows: [
            [
              "10",
              "Engineering"
            ],
            [
              "20",
              "Data"
            ],
            [
              "30",
              "Support"
            ]
          ]
        }
      ],
      expected: [
        [
          "5",
          "Eli"
        ]
      ],
      solution: "SELECT e.id, e.name\nFROM employees e\nLEFT JOIN departments d ON d.id = e.department_id\nWHERE d.id IS NULL\nORDER BY e.id;",
      alternative: "SELECT e.id, e.name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.id = e.department_id) ORDER BY e.id;"
    }
  },
  {
    id: "sql-find-consecutive-records",
    title: "Find Consecutive Records",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Find numbers appearing in at least three consecutive rows when logs are ordered by id. \u201CConsecutive\u201D means adjacent ordered records, not necessarily gap-free numeric ids.",
    sections: [
      {
        title: "How it works",
        body: "LAG(num, 1) and LAG(num, 2) expose the two preceding values. A row completes a run of three when its value equals both. DISTINCT returns each qualifying number once."
      },
      {
        title: "Practical considerations",
        body: "If the business requires consecutive numeric ids, also compare id gaps. A stable unique order is essential; timestamps alone may tie and produce ambiguous adjacency."
      }
    ],
    example: "WITH adjacent AS (\n SELECT id, num, LAG(num, 1) OVER (ORDER BY id) AS p1,\n        LAG(num, 2) OVER (ORDER BY id) AS p2\n FROM logs\n)\nSELECT DISTINCT num FROM adjacent\nWHERE num = p1 AND num = p2\nORDER BY num;",
    interview: [
      {
        question: "Write a query for three equal consecutive values and specify your adjacency definition.",
        answer: "Use two LAG expressions ordered by a unique key and compare all three values. This detects adjacent records even if ids have gaps. Add explicit id-difference conditions if numeric consecutiveness is required.",
        followUp: "How would you find the length of every run rather than runs of at least three?"
      }
    ],
    revision: [
      "The value two ordered rows earlier",
      "Yes, they are adjacent rows in id order",
      "If the business requires consecutive numeric ids, also compare id gaps. A stable unique order is essential; timestamps alone may tie and produce ambiguous adjacency."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-consecutive-records-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "What does LAG(num, 2) retrieve?",
        options: [
          "The value two ordered rows earlier",
          "The next value",
          "The second largest value",
          "The value at id minus two always"
        ],
        answer: "The value two ordered rows earlier",
        explanation: "LAG(num, 1) and LAG(num, 2) expose the two preceding values. A row completes a run of three when its value equals both. DISTINCT returns each qualifying number once.",
        hint: "Find numbers appearing in at least three consecutive rows when logs are ordered by id. \u201CConsecutive\u201D means adjacent ordered records, not necessarily gap-free numeric ids."
      },
      {
        id: "sql-find-consecutive-records-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "If ids are 1, 3, 8 with equal nums, are they consecutive under this problem\u2019s definition?",
        options: [
          "Yes, they are adjacent rows in id order",
          "No, all ids must differ by one",
          "Only if nums equal ids",
          "Only with a self join"
        ],
        answer: "Yes, they are adjacent rows in id order",
        explanation: "If the business requires consecutive numeric ids, also compare id gaps. A stable unique order is essential; timestamps alone may tie and produce ambiguous adjacency.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-consecutive-records-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write a query for three equal consecutive values and specify your adjacency definition.",
        answer: "WITH adjacent AS (\n SELECT id, num, LAG(num, 1) OVER (ORDER BY id) AS p1,\n        LAG(num, 2) OVER (ORDER BY id) AS p2\n FROM logs\n)\nSELECT DISTINCT num FROM adjacent\nWHERE num = p1 AND num = p2\nORDER BY num;\n\nUse two LAG expressions ordered by a unique key and compare all three values. This detects adjacent records even if ids have gaps. Add explicit id-difference conditions if numeric consecutiveness is required.",
        explanation: "LAG(num, 1) and LAG(num, 2) expose the two preceding values. A row completes a run of three when its value equals both. DISTINCT returns each qualifying number once. If the business requires consecutive numeric ids, also compare id gaps. A stable unique order is essential; timestamps alone may tie and produce ambiguous adjacency.",
        hint: "How would you find the length of every run rather than runs of at least three?"
      }
    ],
    sql: {
      tables: [
        {
          name: "logs",
          columns: [
            "id",
            "num"
          ],
          rows: [
            [
              "1",
              "7"
            ],
            [
              "2",
              "7"
            ],
            [
              "3",
              "7"
            ],
            [
              "4",
              "2"
            ],
            [
              "5",
              "7"
            ],
            [
              "6",
              "7"
            ],
            [
              "7",
              "3"
            ]
          ]
        }
      ],
      expected: [
        [
          "7"
        ]
      ],
      solution: "WITH adjacent AS (\n SELECT id, num, LAG(num, 1) OVER (ORDER BY id) AS p1,\n        LAG(num, 2) OVER (ORDER BY id) AS p2\n FROM logs\n)\nSELECT DISTINCT num FROM adjacent\nWHERE num = p1 AND num = p2\nORDER BY num;"
    }
  },
  {
    id: "sql-find-top-n-employees-per-department",
    title: "Find Top N Employees Per Department",
    subjectId: "sql",
    module: "Interview SQL Challenges",
    minutes: 7,
    difficulty: "Hard",
    overview: "Return employees in the top N distinct salary levels per department, including ties. Use N = 2 for the sample and exclude departmentless employees.",
    sections: [
      {
        title: "How it works",
        body: "DENSE_RANK ranks salary levels independently per department. Filter rank <= N in an outer query because window results are not available to the same query\u2019s WHERE clause."
      },
      {
        title: "Practical considerations",
        body: "\u201CTop N\u201D is ambiguous: ROW_NUMBER selects exactly N rows, RANK uses competition positions, and DENSE_RANK selects N distinct levels. Agree on tie semantics before writing the query."
      }
    ],
    example: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS level\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.level <= 2\nORDER BY d.id, r.salary DESC, r.id;",
    interview: [
      {
        question: "Write top-N-per-department queries for both exact rows and distinct salary levels.",
        answer: "Use ROW_NUMBER ordered by salary DESC, id for exactly N rows. Use DENSE_RANK ordered only by salary DESC for N distinct salary levels with ties. Partition both by department and filter in an outer query.",
        followUp: "How can a composite department-and-salary index help, and why might sorting still occur?"
      }
    ],
    revision: [
      "DENSE_RANK",
      "ROW_NUMBER",
      "\u201CTop N\u201D is ambiguous: ROW_NUMBER selects exactly N rows, RANK uses competition positions, and DENSE_RANK selects N distinct levels. Agree on tie semantics before writing the query."
    ],
    resources: [
      {
        title: "PostgreSQL SQL reference",
        url: "https://www.postgresql.org/docs/current/sql.html"
      },
      {
        title: "PostgreSQL query tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial-sql.html"
      }
    ],
    questions: [
      {
        id: "sql-find-top-n-employees-per-department-easy",
        difficulty: "Easy",
        type: "mcq",
        prompt: "Which function preserves the top N distinct salary levels?",
        options: [
          "DENSE_RANK",
          "ROW_NUMBER",
          "COUNT",
          "SUM"
        ],
        answer: "DENSE_RANK",
        explanation: "DENSE_RANK ranks salary levels independently per department. Filter rank <= N in an outer query because window results are not available to the same query\u2019s WHERE clause.",
        hint: "Return employees in the top N distinct salary levels per department, including ties. Use N = 2 for the sample and exclude departmentless employees."
      },
      {
        id: "sql-find-top-n-employees-per-department-medium",
        difficulty: "Medium",
        type: "mcq",
        prompt: "Which function would select exactly N employees with a unique tie-breaker?",
        options: [
          "ROW_NUMBER",
          "DENSE_RANK",
          "RANK without ties",
          "MAX"
        ],
        answer: "ROW_NUMBER",
        explanation: "\u201CTop N\u201D is ambiguous: ROW_NUMBER selects exactly N rows, RANK uses competition positions, and DENSE_RANK selects N distinct levels. Agree on tie semantics before writing the query.",
        hint: "Trace the example against its input rows before choosing."
      },
      {
        id: "sql-find-top-n-employees-per-department-hard",
        difficulty: "Hard",
        type: "sql",
        prompt: "Write top-N-per-department queries for both exact rows and distinct salary levels.",
        answer: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS level\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.level <= 2\nORDER BY d.id, r.salary DESC, r.id;\n\nUse ROW_NUMBER ordered by salary DESC, id for exactly N rows. Use DENSE_RANK ordered only by salary DESC for N distinct salary levels with ties. Partition both by department and filter in an outer query.",
        explanation: "DENSE_RANK ranks salary levels independently per department. Filter rank <= N in an outer query because window results are not available to the same query\u2019s WHERE clause. \u201CTop N\u201D is ambiguous: ROW_NUMBER selects exactly N rows, RANK uses competition positions, and DENSE_RANK selects N distinct levels. Agree on tie semantics before writing the query.",
        hint: "How can a composite department-and-salary index help, and why might sorting still occur?"
      }
    ],
    sql: {
      tables: [
        {
          name: "employees",
          columns: [
            "id",
            "name",
            "salary",
            "department_id",
            "manager_id"
          ],
          rows: [
            [
              "1",
              "Asha",
              "90000",
              "10",
              "NULL"
            ],
            [
              "2",
              "Ben",
              "80000",
              "10",
              "1"
            ],
            [
              "3",
              "Chen",
              "80000",
              "20",
              "1"
            ],
            [
              "4",
              "Dina",
              "70000",
              "20",
              "3"
            ],
            [
              "5",
              "Eli",
              "95000",
              "NULL",
              "1"
            ]
          ]
        },
        {
          name: "departments",
          columns: [
            "id",
            "name"
          ],
          rows: [
            [
              "10",
              "Engineering"
            ],
            [
              "20",
              "Data"
            ],
            [
              "30",
              "Support"
            ]
          ]
        }
      ],
      expected: [
        [
          "Engineering",
          "Asha",
          "90000"
        ],
        [
          "Engineering",
          "Ben",
          "80000"
        ],
        [
          "Data",
          "Chen",
          "80000"
        ],
        [
          "Data",
          "Dina",
          "70000"
        ]
      ],
      solution: "WITH ranked AS (\n SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS level\n FROM employees e WHERE salary IS NOT NULL\n)\nSELECT d.name AS department, r.name AS employee, r.salary\nFROM ranked r JOIN departments d ON d.id = r.department_id\nWHERE r.level <= 2\nORDER BY d.id, r.salary DESC, r.id;"
    }
  }
];

// content/sql.ts
var sqlTopics = sql_data_default;

// content/cn-helper.ts
function networkLesson(data) {
  const slug = data.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id2 = `cn-${slug}`;
  return {
    // Return independent data instead of embedding lesson copy in React components.
    id: id2,
    // Use the same identifier for navigation, progress, and checkpoint ownership.
    title: data.title,
    // Display the authored lesson title.
    subjectId: "cn",
    // Connect the topic to Computer Networks.
    module: data.module,
    // Preserve the explicit module grouping.
    minutes: 7,
    // Estimate a focused reading and reflection session.
    difficulty: data.module === "Network Fundamentals" ? "Easy" : "Medium",
    // Set a starting expectation while keeping every checkpoint accessible.
    overview: data.definition,
    // Introduce the concept before its mechanics.
    sections: [
      // Split conceptual understanding from limitations.
      { title: "How it works", body: data.mechanism },
      // Explain the actual protocol or mechanism.
      { title: "Trade-offs and interview distinctions", body: data.tradeoff }
      // Help learners reason beyond the definition.
    ],
    // Finish the detailed explanation sections.
    example: data.example,
    // Provide an applied example for the concept.
    interview: [{ question: data.hard, answer: data.hardAnswer, followUp: data.scenario }],
    // Connect a deep answer to a concrete interviewer follow-up.
    revision: [data.definition, data.tradeoff],
    // Keep the important facts available for last-minute review.
    resources: [{ title: "Independent reference: protocol documentation", url: data.reference }],
    // Point learners to a source outside the authored explanation.
    diagram: data.diagram,
    // Preserve optional workflow steps for visual understanding.
    questions: [
      // Give learners an accessible practice task at every difficulty.
      {
        // Begin the definition checkpoint.
        id: `${id2}-easy`,
        // Keep this checkpoint stable across repeat attempts.
        difficulty: "Easy",
        // Place the question in basic understanding.
        type: "mcq",
        // Let the server score this objective question.
        prompt: `Which statement about ${data.title} is accurate?`,
        // Test the central concept directly.
        options: [data.definition, data.misconception, "It eliminates every form of network delay and packet loss."],
        // Include one true statement and two clear misconceptions.
        answer: data.definition,
        // Use exact choice text for consistent server-side scoring.
        explanation: data.mechanism,
        // Explain the mechanism after submission.
        hint: "Identify the layer, responsibility, and guarantee this concept actually provides."
        // Encourage reasoning without revealing the answer.
      },
      // Finish the definition checkpoint.
      {
        // Begin the applied checkpoint.
        id: `${id2}-medium`,
        // Give the applied question an independent attempt history.
        difficulty: "Medium",
        // Place this scenario in applied understanding.
        type: "mcq",
        // Score the scenario against its reference answer.
        prompt: data.scenario,
        // Ask the authored practical question.
        options: [data.scenarioWrong, data.scenarioAnswer, "There is not enough information because networks never expose observable behavior."],
        // Keep the correct answer away from the first position here.
        answer: data.scenarioAnswer,
        // Preserve the precise applied reference answer.
        explanation: `${data.scenarioAnswer} ${data.tradeoff}`,
        // Connect the answer to the relevant limitation.
        hint: data.example
        // Give a concrete example as optional support.
      },
      // Finish the applied checkpoint.
      {
        // Begin the interview checkpoint.
        id: `${id2}-hard`,
        // Keep interview self-assessment distinct from MCQ performance.
        difficulty: "Hard",
        // Require deeper interview-level reasoning.
        type: "descriptive",
        // Ask learners to write and explicitly assess their answer.
        prompt: data.hard,
        // Present the authored follow-up scenario.
        answer: data.hardAnswer,
        // Provide a technically grounded comparison answer.
        explanation: data.tradeoff,
        // Reinforce the edge case or trade-off.
        hint: data.mechanism
        // Offer the mechanics when the learner needs help.
      },
      // Finish the interview checkpoint.
      ...data.hardQuiz ? [{ id: `${id2}-hard-mcq`, difficulty: "Hard", type: "mcq", ...data.hardQuiz }] : []
      // Include an independently scored Hard question when this lesson supplies one.
    ]
    // Finish the three difficulty levels.
  };
}

// content/cn.ts
var cnTopics = [
  // Export all Computer Networks topics as editable curriculum data.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "What is a Computer Network?",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A computer network connects independent devices so they can exchange data and share services using agreed protocols.",
    // Introduce the concept and explain why it matters.
    mechanism: "A sender encodes application data into protocol messages. Interfaces carry frames over links, switches connect local segments, and routers forward IP packets between networks. An endpoint address identifies a destination at the relevant layer.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A link being connected does not guarantee that an application is reachable: addressing, routing, transport ports, and application behavior must all work.",
    // Record limitations and important interview distinctions.
    example: "A laptop sends an HTTPS request through Wi-Fi, a home router, and several provider networks to a remote web server.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every connected device must run the same operating system.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Two laptops share Wi-Fi but cannot reach a remote website. Does their local connection prove Internet routing works?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Local link connectivity and end-to-end Internet reachability are separate properties.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. A working local link guarantees that every remote server is reachable.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you distinguish a local network problem from an application-server problem?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Check link association and local addressing first, then the default gateway, DNS resolution, destination reachability where permitted, and the application port. Compare a known working endpoint. A blocked ping alone does not establish a failed application because ICMP and TCP can be filtered differently.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1122"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "OSI Model",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "The OSI model describes network communication using seven conceptual layers, from physical signaling to application services.",
    // Introduce the concept and explain why it matters.
    mechanism: "The layers are Physical, Data Link, Network, Transport, Session, Presentation, and Application. Encapsulation adds layer-specific control information as data moves downward; the receiver interprets it upward. Layer boundaries help separate responsibilities during design and troubleshooting.",
    // Explain its actual operation with correct terminology.
    tradeoff: "OSI is a reference model rather than the exact implementation blueprint of the Internet. Real protocols can span responsibilities, and TCP/IP commonly groups its upper three layers together.",
    // Record limitations and important interview distinctions.
    example: "For an HTTPS request, HTTP belongs to application behavior, TLS handles encryption above TCP, TCP provides a byte stream, IP routes packets, and Ethernet carries local frames.",
    // Demonstrate a realistic use case or calculation.
    misconception: "OSI requires all Internet software to implement seven separate processes.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A packet reaches the destination network but the receiving application does not listen on the requested TCP port. Which layer is the immediate focus?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Transport: examine TCP port reachability and connection behavior.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Physical: replace the cable solely because an application port is closed.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why is assigning TLS to one OSI layer sometimes misleading?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "TLS combines security and representation responsibilities and runs over a transport stream, while real stacks do not implement OSI as seven strict software modules. Explain the actual protocol nesting and guarantees first; use the model to organize reasoning rather than force a perfect category.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/",
    // Link to independent protocol or technical documentation.
    diagram: ["7 \xB7 Application \u2014 HTTP, DNS", "6 \xB7 Presentation \u2014 representation and encryption", "5 \xB7 Session \u2014 dialog management", "4 \xB7 Transport \u2014 TCP, UDP", "3 \xB7 Network \u2014 IP routing", "2 \xB7 Data Link \u2014 Ethernet frames", "1 \xB7 Physical \u2014 electrical, optical, radio signals"]
    // Show an ordered workflow to reinforce visual understanding.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "TCP/IP Model",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "The TCP/IP model groups Internet communication into application, transport, Internet, and link layers.",
    // Introduce the concept and explain why it matters.
    mechanism: "Applications create messages such as HTTP requests. TCP or UDP provides transport addressing; IP forwards packets across networks; link protocols move frames over one local hop. Each router usually replaces link framing while forwarding the IP packet.",
    // Explain its actual operation with correct terminology.
    tradeoff: "TCP/IP is sometimes taught as five layers by splitting link into data link and physical. State which convention you use; the protocol behavior remains the same.",
    // Record limitations and important interview distinctions.
    example: "An HTTP message is carried inside TCP segments, inside IP packets, inside Wi-Fi or Ethernet frames.",
    // Demonstrate a realistic use case or calculation.
    misconception: "TCP/IP means every application must use TCP rather than UDP.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An application uses UDP instead of TCP. Does it stop using the TCP/IP suite?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. UDP is a transport protocol within the Internet protocol suite.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. The suite supports only reliable byte streams.",
    // Provide a plausible wrong choice for comparison.
    hard: "What changes at a router hop and what usually remains end-to-end?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "The router removes incoming link framing and emits a new frame for the next link. IP source and destination generally remain endpoint addresses, although TTL or hop limit changes and NAT can rewrite addresses. Transport state belongs to endpoints except where middleboxes intervene.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1122"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "OSI vs TCP/IP",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "OSI is a seven-layer reference model; TCP/IP is the deployed Internet protocol architecture commonly explained in four or five layers.",
    // Introduce the concept and explain why it matters.
    mechanism: "OSI application, presentation, and session functions usually map to TCP/IP application behavior. Both identify transport and network responsibilities; TCP/IP link behavior covers OSI data-link and physical concerns in the four-layer convention.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The mapping is approximate. Protocols such as TLS and QUIC demonstrate why actual encapsulation and guarantees matter more than memorizing a strict layer number.",
    // Record limitations and important interview distinctions.
    example: "TCP provides transport reliability in both descriptions, but no separate OSI session-layer daemon is required for a browser to communicate.",
    // Demonstrate a realistic use case or calculation.
    misconception: "OSI and TCP/IP are two mutually incompatible cable standards.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A team debates whether TLS is presentation or application layer. What is the most useful next step?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Describe TLS placement and guarantees in the actual stack rather than forcing an exact model mapping.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Require a new network because the two models cannot describe the same traffic.",
    // Provide a plausible wrong choice for comparison.
    hard: "How can the layer models help diagnose a slow web request without becoming a memorization exercise?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Break the request into DNS, connection setup, security negotiation, request transfer, server processing, and response transfer. Associate each observation with its protocol responsibility. Models organize hypotheses, but packet traces and timing identify the actual delay.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1122"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Network Topologies",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Network topology describes how nodes and links connect, either physically or logically.",
    // Introduce the concept and explain why it matters.
    mechanism: "Common forms include star, bus, ring, mesh, and tree. A switched Ethernet LAN is commonly a physical star, while redundant switches can form a richer physical graph whose active forwarding topology is controlled to avoid loops.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Full mesh gives many alternate paths but needs n(n\u22121)/2 links for n nodes. A star is easier to manage, but its central device can be a failure point unless redundant.",
    // Record limitations and important interview distinctions.
    example: "Five fully meshed routers need ten point-to-point links, while a five-node star needs four links to one central node.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A full mesh always requires fewer links than a star.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "How many undirected links connect four nodes in a full mesh?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Six links, because 4 \xD7 3 \xF7 2 = 6.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Four links, because each node needs exactly one connection.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a physical Ethernet ring fail without a loop-prevention protocol?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Ethernet broadcasts and unknown-destination frames can circulate because ordinary frames have no IP-style hop limit. Redundant links need a loop-prevention mechanism such as spanning tree or a controlled fabric. The logical forwarding topology can therefore differ from the physical wiring.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-network-topology.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Bandwidth vs Throughput",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Bandwidth is a link capacity measure; throughput is the amount of data actually delivered per unit of time.",
    // Introduce the concept and explain why it matters.
    mechanism: "Throughput depends on the bottleneck link, congestion, protocol overhead, loss, receiver limits, and sender behavior. Application goodput excludes retransmissions and protocol headers, so it can be lower than transport or link throughput.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Adding capacity to a non-bottleneck link may not improve end-to-end performance. Bits per second and bytes per second also differ by a factor of eight.",
    // Record limitations and important interview distinctions.
    example: "A 100 Mb/s link has a raw ceiling of 12.5 MB/s before overhead; a download at 10 MB/s can be perfectly plausible.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A 100 Mb/s link guarantees every application transfers at 100 MB/s.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A path has links of 1 Gb/s, 100 Mb/s, and 500 Mb/s. What is its capacity bottleneck before other constraints?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The 100 Mb/s link.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The sum, 1.6 Gb/s, because capacities add across a path.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why might a single TCP flow underuse a high-bandwidth, long-distance link?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "The flow must keep roughly bandwidth \xD7 round-trip-time bytes in flight to fill the path. A small receive window, congestion window, loss, or slow startup can prevent that. Measure RTT, loss, flow windows, and application limits before assuming the physical bandwidth is unavailable.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc6349"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Latency",
    // Name this specific networking concept.
    module: "Network Fundamentals",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Latency is the time required for data to travel or for an operation to respond; one-way delay and round-trip time are different measurements.",
    // Introduce the concept and explain why it matters.
    mechanism: "Network delay includes propagation, serialization, queueing, and processing. Queueing varies with load, while propagation has a physical distance limit. A small message on a fast long-distance path can still have substantial round-trip latency.",
    // Explain its actual operation with correct terminology.
    tradeoff: "High bandwidth improves bulk transfer capacity but does not remove propagation delay. Tail latency and jitter matter for interactive services even when average latency is acceptable.",
    // Record limitations and important interview distinctions.
    example: "A request requiring three sequential network round trips on an 80 ms RTT path spends about 240 ms waiting for the network before server processing and transfer time.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Doubling bandwidth necessarily halves propagation delay.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A service makes four sequential RPCs, each taking one 50 ms round trip. What network waiting time is implied?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Approximately 200 ms before adding processing and payload transfer.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Approximately 12.5 ms because parallel bandwidth is divided by four.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you reduce latency for many small sequential requests?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Reuse connections, reduce unnecessary round trips, batch requests when semantics allow, and move suitable computation or cacheable data closer to users. Parallelize independent work but account for server load. More bandwidth alone does not remove dependencies or distance.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc7679"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "HTTP vs HTTPS",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "HTTPS carries HTTP over an authenticated encrypted transport, normally TLS, protecting traffic between the client and TLS endpoint.",
    // Introduce the concept and explain why it matters.
    mechanism: "TLS negotiates keys and authenticates the server certificate chain and hostname. It provides confidentiality and integrity in transit; HTTP semantics such as methods and status codes remain. HTTP/3 uses QUIC with integrated TLS 1.3 rather than TCP.",
    // Explain its actual operation with correct terminology.
    tradeoff: "HTTPS does not prove that site content is trustworthy and does not protect data after TLS terminates. Certificate validation and correct endpoint configuration remain essential.",
    // Record limitations and important interview distinctions.
    example: "An observer on public Wi-Fi can see a destination IP and traffic timing but cannot read a properly protected HTTPS request body.",
    // Demonstrate a realistic use case or calculation.
    misconception: "HTTPS encrypts data permanently even after the server decrypts it.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A reverse proxy terminates TLS and forwards plaintext to a backend. Which segment lacks that TLS protection?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The proxy-to-backend segment unless separately encrypted.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The browser-to-proxy segment because all reverse proxies disable TLS.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why is certificate validation as important as encryption?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Encryption without authenticated peer identity can establish a secure channel to an attacker. A client must validate trust, hostname, validity, and relevant policy. TLS termination also establishes a security boundary: downstream links need their own protection where the threat model requires it.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "HTTP Methods",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "HTTP methods communicate request semantics, including retrieval, creation, replacement, partial modification, and deletion.",
    // Introduce the concept and explain why it matters.
    mechanism: "GET is safe and idempotent; HEAD retrieves headers without a response body; PUT and DELETE are idempotent in intended effect. POST is not generally idempotent. PATCH applies a partial modification whose idempotence depends on the patch operation.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Idempotent does not mean identical responses: deleting an already deleted resource can return a different status while preserving the same final state. Safe methods should not trigger requested state changes.",
    // Record limitations and important interview distinctions.
    example: "PUT /profiles/42 can replace a resource consistently on retries; POST /payments needs an idempotency mechanism before retrying safely.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every HTTP method is safe to retry because HTTP uses reliable transport.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A client times out after POST /payments and does not know whether the payment was created. What should support safe retries?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "An application-level idempotency key or another deduplication contract.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Resend the POST indefinitely because POST is always idempotent.",
    // Provide a plausible wrong choice for comparison.
    hard: "Can PATCH be idempotent, and why does the distinction matter?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Yes: setting status to archived repeatedly has the same intended effect, while incrementing a counter repeatedly does not. Retry behavior must follow the operation semantics and the API contract. Transport reliability does not eliminate ambiguous results after connection failures.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9110"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "HTTP Status Codes",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "HTTP status codes report response classes: informational 1xx, successful 2xx, redirection 3xx, client-side 4xx, and server-side 5xx outcomes.",
    // Introduce the concept and explain why it matters.
    mechanism: "200 commonly returns a successful representation, 201 identifies creation, 204 has no response content, and 304 supports cache validation. 401 asks for authentication, while 403 reports refusal. 429 indicates rate limiting; 503 indicates temporary service unavailability.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Status classes alone do not determine whether retrying is safe. Respect Retry-After when supplied and combine status handling with method semantics and application error details.",
    // Record limitations and important interview distinctions.
    example: "GET with If-None-Match may receive 304 when the cached representation remains valid, avoiding another response body transfer.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every 4xx response means the server crashed.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A request has no valid session and must authenticate. Which status is more appropriate than 403?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "401 Unauthorized, with the appropriate authentication challenge for the scheme.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "200 OK, because authentication errors are always successful responses.",
    // Provide a plausible wrong choice for comparison.
    hard: "How should a client react differently to 401, 403, and 503?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "401 can trigger authentication or session renewal. 403 means access is refused and repeatedly supplying the same credentials is unlikely to help. 503 can warrant bounded, backoff-based retries when the operation is safe, using Retry-After when provided. Never retry blindly without considering side effects.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "DNS and DNS Resolution",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "DNS is a distributed hierarchical naming system that maps domain names to records such as IP addresses and mail-routing information.",
    // Introduce the concept and explain why it matters.
    mechanism: "A stub resolver asks a recursive resolver, which may answer from cache or query root, top-level-domain, and authoritative servers. Record TTLs bound ordinary cache lifetime. A and AAAA records hold IPv4 and IPv6 addresses; CNAME names an alias.",
    // Explain its actual operation with correct terminology.
    tradeoff: "DNS caching reduces latency and authoritative load, but stale caches and negative caching can delay observable changes. DNS resolution is separate from the later TCP, QUIC, or HTTP connection.",
    // Record limitations and important interview distinctions.
    example: "For www.example.com, a resolver can follow cached referrals to the authoritative server and cache the returned address for its TTL.",
    // Demonstrate a realistic use case or calculation.
    misconception: "DNS transfers the website HTML directly to the browser.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A valid cached DNS answer has 120 seconds left in its TTL. Must the resolver query the authoritative server for every request?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. It can normally reuse the cached answer until its TTL expires.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. DNS forbids caching address records.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can changing a DNS record fail to redirect every client immediately?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Resolvers and clients can retain the prior answer until its TTL expires; negative caching can also matter. Existing connections may continue using their old endpoint. Reduce TTL before a planned change and account for propagation and connection reuse rather than expecting an instantaneous global update.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1034",
    // Link to independent protocol or technical documentation.
    diagram: ["Browser checks local caches", "Stub asks recursive resolver", "Resolver follows root \u2192 TLD \u2192 authoritative referrals when needed", "Resolver caches the record according to TTL", "Browser uses returned address to start a separate connection"]
    // Show an ordered workflow to reinforce visual understanding.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "FTP",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "FTP is a file-transfer protocol that uses a control connection and a separate data connection.",
    // Introduce the concept and explain why it matters.
    mechanism: "The control channel traditionally uses TCP port 21. Active mode asks the server to connect to a client data port; passive mode lets the client connect to a server-advertised data endpoint. Commands and replies manage authentication and file operations.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Traditional FTP sends credentials and data without encryption. FTPS adds TLS; SFTP is a different protocol built over SSH. Separate data connections complicate firewall and NAT handling.",
    // Record limitations and important interview distinctions.
    example: "Passive FTP is commonly easier behind client-side NAT because the client initiates both control and data connections.",
    // Demonstrate a realistic use case or calculation.
    misconception: "SFTP is simply FTP running on port 21 with the same wire protocol.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A NATed client can log in to FTP but active-mode file transfers fail. What is a useful configuration change?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Try passive mode and ensure the server passive port range is reachable.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Disable the control connection because file transfer never needs it.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why is opening only TCP 21 insufficient for many FTP deployments?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Port 21 carries control messages, while file contents and directory listings use separate negotiated data connections. Active and passive modes establish those connections differently. Firewall rules must account for the data path; a secure modern alternative such as SFTP may simplify deployment.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc959"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "SMTP",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "SMTP transfers email from a submitting client to a mail service and between mail servers.",
    // Introduce the concept and explain why it matters.
    mechanism: "An SMTP dialog uses commands such as EHLO, MAIL FROM, RCPT TO, and DATA. Mail delivery uses DNS MX records to find destination mail exchangers. Port 25 commonly serves server-to-server relay; submission commonly uses 587 with STARTTLS or 465 with implicit TLS.",
    // Explain its actual operation with correct terminology.
    tradeoff: "SMTP handles submission and relay, not mailbox synchronization. Delivery can be queued and retried, and an accepted message is not a guarantee that a human will receive or read it.",
    // Record limitations and important interview distinctions.
    example: "An application submits a welcome email to its provider, which queues a delivery attempt to the recipient domain MX server.",
    // Demonstrate a realistic use case or calculation.
    misconception: "SMTP is the protocol that synchronizes an inbox across all devices.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A server accepts a message with a 250 response. Does this prove the recipient opened it?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Acceptance transfers responsibility for further processing; it does not prove reading.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. SMTP requires the recipient to open every accepted message immediately.",
    // Provide a plausible wrong choice for comparison.
    hard: "How do SMTP, SPF, DKIM, and DMARC differ?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "SMTP transports messages. SPF authorizes sending hosts for an envelope domain, DKIM signs selected message content with a domain key, and DMARC combines alignment checks and policy for the visible From domain. None alone guarantees that the message is wanted, safe, or read.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc5321"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "POP3",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "POP3 retrieves messages from a maildrop using a relatively simple download-oriented protocol.",
    // Introduce the concept and explain why it matters.
    mechanism: "A session authenticates, lists or retrieves messages, and can mark messages for deletion. Deletions are committed in the update state after a successful QUIT. Clients may leave messages on the server according to configuration.",
    // Explain its actual operation with correct terminology.
    tradeoff: "POP3 offers less rich server-side folder and state synchronization than IMAP. It is incorrect to claim that POP3 always immediately deletes every downloaded message.",
    // Record limitations and important interview distinctions.
    example: "A desktop client can download mail for offline reading and leave copies on the server for a configured retention period.",
    // Demonstrate a realistic use case or calculation.
    misconception: "POP3 always deletes each message before the client can read it.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A user needs synchronized folders and read flags on a phone and laptop. Which approach is usually better suited?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "IMAP, which models server-side mailbox state and synchronization.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "POP3, because it standardizes rich shared folders and synchronized flags.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can two POP3 clients show different read or folder states?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "POP3 primarily exposes a maildrop and retrieval operations, rather than the richer shared mailbox state model of IMAP. Clients often maintain their own local organization. Leaving messages on the server can make messages available on both clients without synchronizing every local state change.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1939"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "IMAP",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "IMAP lets clients access and synchronize server-hosted mailboxes, folders, and message flags.",
    // Introduce the concept and explain why it matters.
    mechanism: "Clients select mailboxes, fetch selected message data, search server-side, and update flags such as Seen. Persistent identifiers help clients reconcile mailbox state; extensions can improve change notification and synchronization.",
    // Explain its actual operation with correct terminology.
    tradeoff: "IMAP is for mailbox access rather than message submission. Offline clients still need conflict handling and eventual synchronization, while sending normally uses a separate SMTP submission service.",
    // Record limitations and important interview distinctions.
    example: "Marking a message read on a phone can update its server-side Seen flag so the laptop displays the same state after synchronization.",
    // Demonstrate a realistic use case or calculation.
    misconception: "IMAP sends outgoing mail between destination mail exchangers.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A mail client uses IMAP for reading. What service normally submits a new outgoing email?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "An SMTP submission service.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "An ARP server, because email submission resolves MAC addresses.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why are persistent message identifiers important for disconnected clients?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Message sequence numbers can change as the mailbox changes. Stable identifiers within a mailbox validity context allow a reconnecting client to reconcile cached messages and flags correctly. The client must also handle mailbox validity changes rather than assuming old identifiers remain meaningful forever.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9051"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Cookies vs Sessions",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A cookie is browser-managed request state; a server-side session stores authenticated state on the server and commonly uses an opaque cookie identifier.",
    // Introduce the concept and explain why it matters.
    mechanism: "The server sends Set-Cookie, and the browser attaches eligible cookies according to domain, path, expiry, Secure, and SameSite rules. HttpOnly prevents JavaScript from reading a cookie; the server looks up an opaque session ID and verifies expiry before authorizing a request.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Cookies are not inherently authentication, and sessions need expiry, revocation, and fixation protection. HttpOnly reduces token theft through scripts but does not stop scripts from issuing authorized same-origin requests.",
    // Record limitations and important interview distinctions.
    example: "After login, a random session ID is placed in a Secure, HttpOnly cookie while the corresponding user identity stays in a server-side session record.",
    // Demonstrate a realistic use case or calculation.
    misconception: "An HttpOnly cookie prevents every kind of cross-site request forgery.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A session cookie is HttpOnly. Can injected same-origin JavaScript still issue authenticated fetch requests?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Yes. HttpOnly hides the cookie value but does not remove it from eligible browser requests.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "No. HttpOnly disables all application requests from JavaScript.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you secure a cookie-based session API against common attacks?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Use high-entropy session IDs, hash or otherwise protect stored tokens, rotate on login, revoke on logout, and enforce expiry. Use Secure and HttpOnly cookies, appropriate SameSite behavior, and CSRF protection such as strict origin checks or tokens. Authorize each request from the server identity, never a supplied user ID.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "A session cookie is Secure and HttpOnly, but the server accepts cross-site state-changing requests without checking origin or a CSRF token. Which conclusion is justified?", "options": ["HttpOnly alone guarantees that no cross-site request can use the cookie", "Secure alone guarantees that every request originated from the application", "The attributes protect transport and script access, but explicit CSRF controls and appropriate SameSite behavior are still needed"], "answer": "The attributes protect transport and script access, but explicit CSRF controls and appropriate SameSite behavior are still needed", "explanation": "Secure limits cookie transmission to secure transport and HttpOnly prevents direct JavaScript reads. Neither proves request intent or origin. SameSite behavior reduces selected cross-site sending, while origin validation or CSRF tokens protects state-changing operations under the actual application model.", "hint": "Keep confidentiality of a cookie value separate from whether the browser sends it on a request." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "REST APIs",
    // Name this specific networking concept.
    module: "Application Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "REST is an architectural style centered on resource representations, a uniform interface, and stateless request semantics.",
    // Introduce the concept and explain why it matters.
    mechanism: "A resource can have a stable URI and representations such as JSON. HTTP methods express operations, status codes express outcomes, and cache metadata controls reuse. Each request includes the information required to process it rather than depending on an implicit conversational sequence.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Using JSON over HTTP alone does not establish every REST constraint. Stateless requests do not forbid database persistence; they avoid requiring server-held client conversation context for interpretation.",
    // Record limitations and important interview distinctions.
    example: "GET /articles/42 returns a representation and ETag; a conditional GET can validate a cached copy without transferring the full resource again.",
    // Demonstrate a realistic use case or calculation.
    misconception: "REST requires deleting the database after every response to remain stateless.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An API stores article records in a database. Does this alone violate REST statelessness?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Resource persistence is distinct from per-client conversational state.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. REST forbids storing any server-side data.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you design retries and concurrent edits in a resource API?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Use meaningful method semantics, explicit idempotency where side effects need deduplication, and conditional updates with ETag and If-Match to detect lost updates. Return useful status codes and error representations. A uniform interface helps clients reason about behavior but does not replace application-level concurrency rules.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "TCP vs UDP",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "TCP provides an ordered reliable byte stream; UDP sends independent datagrams without built-in delivery or ordering guarantees.",
    // Introduce the concept and explain why it matters.
    mechanism: "TCP tracks sequence numbers, acknowledgments, retransmissions, flow control, and congestion control. UDP preserves datagram boundaries with a small header. Applications using UDP can add selected reliability or congestion mechanisms above it, as QUIC does.",
    // Explain its actual operation with correct terminology.
    tradeoff: "TCP does not preserve application message boundaries, while UDP does not automatically recover loss. UDP applications still need responsible congestion behavior and must handle path MTU and datagram size limits.",
    // Record limitations and important interview distinctions.
    example: "A TCP receiver may read one application message across several reads; a UDP receiver gets a whole datagram or an indicated truncation according to its API.",
    // Demonstrate a realistic use case or calculation.
    misconception: "TCP guarantees that every write is returned by exactly one matching read.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "You send two short messages through TCP. Can one read return bytes from both?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Yes. TCP is a byte stream, so the application needs framing.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "No. TCP preserves write boundaries as message boundaries.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why might a real-time application choose UDP, and what responsibilities remain?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Timely fresh data can be more valuable than delayed retransmissions. UDP lets the application choose recovery, sequencing, jitter buffering, and expiration policies. It must still control sending rate, handle loss and reordering, secure traffic, and avoid fragmentation or excessive datagram sizes.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9293",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "A transport must carry several independent reliable streams without one lost packet blocking delivery on unrelated streams. Which design best matches this requirement?", "options": ["One TCP connection with application message framing", "A QUIC connection with multiple streams", "Plain UDP with no application reliability or sequencing"], "answer": "A QUIC connection with multiple streams", "explanation": "TCP orders one byte stream, so a missing byte can hold back later bytes even from independently framed application messages. QUIC provides reliable streams with ordering scoped to each stream; connection-level congestion control still applies.", "hint": "Distinguish application multiplexing over one ordered stream from transport-level independent stream ordering." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "TCP Three-Way Handshake",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "TCP normally establishes a connection with SYN, SYN-ACK, and ACK messages that synchronize both endpoints sequence spaces.",
    // Introduce the concept and explain why it matters.
    mechanism: "The client sends a SYN with its initial sequence number. The server replies with its SYN and acknowledges the client SYN. The client acknowledges the server SYN; each SYN consumes one sequence number. Options can negotiate capabilities such as window scaling.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The handshake establishes transport state, not application authentication. Lost handshake packets can be retransmitted, and server resource allocation must account for SYN-flood attacks.",
    // Record limitations and important interview distinctions.
    example: "Client SYN seq=100; server SYN-ACK seq=700 ack=101; client ACK seq=101 ack=701.",
    // Demonstrate a realistic use case or calculation.
    misconception: "The first SYN proves the client has received data from the server.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "The server chooses initial sequence number 700. What acknowledgment normally acknowledges its SYN?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "701, because a SYN consumes one sequence number.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "700, because control flags never consume sequence numbers.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why are three messages useful instead of immediately accepting a SYN as a complete connection?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "The exchange communicates both initial sequence numbers and confirms that the client received the server sequence number. This helps reject stale duplicates and establish bidirectional reachability. It does not by itself authenticate the application user; resource exhaustion needs additional mitigations such as SYN cookies or proxies.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9293",
    // Link to independent protocol or technical documentation.
    diagram: ["Client \u2192 Server: SYN, seq=x", "Server \u2192 Client: SYN + ACK, seq=y, ack=x+1", "Client \u2192 Server: ACK, ack=y+1", "Both sides can exchange stream data"],
    // Show an ordered workflow to reinforce visual understanding.
    hardQuiz: { "prompt": "A client sends SYN seq=900. The server replies SYN-ACK seq=4000 ack=901. Which acknowledgment correctly completes a normal handshake without data?", "options": ["ACK seq=900 ack=4000", "ACK seq=901 ack=4001", "ACK seq=902 ack=4002"], "answer": "ACK seq=901 ack=4001", "explanation": "Each SYN consumes one sequence number. The client next sends sequence 901 and acknowledges the server SYN at 4001. An ACK by itself consumes no additional sequence number.", "hint": "Count SYN control flags in sequence space; do not count a pure ACK." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "TCP Four-Way Termination",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "TCP closes its two stream directions independently, so an orderly close often involves FIN, ACK, FIN, and ACK.",
    // Introduce the concept and explain why it matters.
    mechanism: "A FIN declares that its sender has no more bytes to send and consumes one sequence number. The peer can acknowledge it while still sending its remaining data. The active closer commonly enters TIME_WAIT after acknowledging the peer FIN.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Four separate packets are common but not mandatory because acknowledgments and FIN can be combined. A reset aborts a connection and differs from orderly shutdown.",
    // Record limitations and important interview distinctions.
    example: "A client sends FIN after its request, the server ACKs and finishes a response, then sends its own FIN for the client to ACK.",
    // Demonstrate a realistic use case or calculation.
    misconception: "After receiving FIN, an endpoint must immediately discard all remaining response data.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A server receives a client FIN but still has response bytes to send. Is this valid?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Yes. TCP supports half-close, so the opposite direction can remain open.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "No. FIN always closes both directions simultaneously.",
    // Provide a plausible wrong choice for comparison.
    hard: "What purpose does TIME_WAIT serve, and why can it affect busy servers?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "TIME_WAIT allows retransmission of the final acknowledgment if the peer repeats its FIN and keeps delayed packets from an old connection from contaminating a reused tuple. High connection churn consumes temporary connection identifiers and state; connection reuse and sensible system tuning can help without simply removing protocol protections.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9293"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Flow Control",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "TCP flow control prevents a sender from overwhelming the receivers advertised buffer capacity.",
    // Introduce the concept and explain why it matters.
    mechanism: "The receiver advertises a receive window indicating how much additional stream data it can accept. The sender limits outstanding data according to both receive and congestion windows. Window scaling allows larger windows negotiated during connection establishment.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Flow control protects the receiver; congestion control protects the network. A receiver advertising zero needs persist behavior so a lost window update does not stall the connection forever.",
    // Record limitations and important interview distinctions.
    example: "If the receive window is 16 KiB and unacknowledged data already fills it, the sender waits for acknowledgments or window updates before sending more normal data.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Flow control is the same mechanism as deciding the shortest IP route.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "The network is idle but the receiving application stops reading. What may eventually limit the TCP sender?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The advertised receive window can shrink to zero as buffers fill.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The sender can ignore receiver buffers because there is no congestion.",
    // Provide a plausible wrong choice for comparison.
    hard: "How can a connection stall even when link bandwidth and congestion window are large?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "A small or zero receive window can limit in-flight data if the application reads slowly or buffers are constrained. Effective sending is limited by both congestion and receiver capacity. Inspect advertised windows and application consumption before attributing the stall to congestion.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc9293"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Sliding Window",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A sliding window permits several numbered data units to be in flight before acknowledgments advance the sending range.",
    // Introduce the concept and explain why it matters.
    mechanism: "TCP tracks byte sequence numbers and acknowledges the next expected byte. As acknowledgments arrive, the window moves forward and permits more data. Selective acknowledgments can report received noncontiguous ranges to improve loss recovery.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A large window helps fill a high-bandwidth, high-RTT path but consumes buffering. The practical window is constrained by flow control and congestion control, not just the sequence-number mechanism.",
    // Record limitations and important interview distinctions.
    example: "At 10 Mb/s and 100 ms RTT, roughly 125 kB must be in flight to fill the path before considering overhead.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A sliding window always waits for each individual packet before sending the next.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A path needs 1 MB in flight to fill its bandwidth-delay product, but the effective window is 64 kB. What is likely?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The flow can underuse the path because too little data is outstanding.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The flow necessarily exceeds line rate because its packets are acknowledged.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why does selective acknowledgment help when several segments are lost from one window?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Cumulative acknowledgment alone identifies the first missing byte but not every later received range. SACK tells the sender which blocks arrived, allowing targeted retransmission and more efficient recovery. It improves loss recovery while leaving the reliable ordered byte-stream abstraction unchanged.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2018",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "Ignoring overhead and loss, a 1 Gb/s path has 80 ms RTT. Approximately how much data must be outstanding to fill its bandwidth-delay product?", "options": ["10 megabytes", "80 kilobytes", "1 gigabyte"], "answer": "10 megabytes", "explanation": "1,000,000,000 bits/s \xD7 0.080 s = 80,000,000 bits = 10,000,000 bytes. The effective sender window must accommodate approximately this quantity to sustain the link rate.", "hint": "Multiply rate by round-trip time, then convert bits to bytes." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Congestion Control",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Congestion control adapts a senders offered traffic to network capacity and feedback so shared paths do not collapse under overload.",
    // Introduce the concept and explain why it matters.
    mechanism: "Classic TCP uses a congestion window, slow start, congestion avoidance, and loss recovery. Packet loss or ECN marks can signal congestion. Modern algorithms differ: CUBIC and model-based schemes use different approaches to finding sustainable sending rates.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Congestion control is distinct from receiver flow control. Large buffers can hide loss while creating high queueing latency, a problem known as bufferbloat.",
    // Record limitations and important interview distinctions.
    example: "When many downloads fill a home uplink queue, interactive calls can lag even though no local application has exhausted its receive buffers.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Congestion control only protects the receiving applications memory.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A router reports ECN congestion without dropping packets. What can a supporting sender do?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Reduce or adjust sending based on congestion feedback before further queue growth.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Ignore the signal because only receiver buffer exhaustion matters.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can maximizing throughput without controlling queue delay harm an interactive application?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "A persistent queue increases latency for every packet sharing the bottleneck. Throughput can remain high while call quality and request responsiveness deteriorate. Active queue management, ECN, pacing, and appropriate congestion control can reduce delay while keeping useful utilization.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc5681"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Port Numbers",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Transport ports identify application endpoints within a host; TCP and UDP each have their own 16-bit port namespace.",
    // Introduce the concept and explain why it matters.
    mechanism: "A flow is commonly distinguished by protocol, source address, source port, destination address, and destination port. Servers often listen on known ports while clients use ephemeral source ports. A port number alone does not prove the application protocol or its security.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The same numerical port can be used independently by TCP and UDP. Binding and reuse rules depend on the operating system and socket configuration.",
    // Record limitations and important interview distinctions.
    example: "An HTTPS client can connect from ephemeral TCP port 53010 to server TCP port 443 while another client connects to the same server port using a different source tuple.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Only one client in the world can connect to server port 443 at a time.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Two clients connect to the same server TCP port 443. How can the server distinguish their connections?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The connections have different source/destination address and port tuples.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The server must assign a different public destination port to every client.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why does allowing outbound TCP 443 not guarantee that all outbound traffic is actually HTTPS?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Ports are conventions and demultiplexing identifiers. An application can carry another protocol on 443, and encrypted traffic can obscure content. Policy enforcement must consider endpoints, TLS behavior, application context, and organizational controls rather than trusting a port number alone.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Socket Programming",
    // Name this specific networking concept.
    module: "Transport Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A socket is an operating-system interface for network communication, commonly exposing streams for TCP and datagrams for UDP.",
    // Introduce the concept and explain why it matters.
    mechanism: "A TCP server typically creates a socket, binds, listens, and accepts connections. The accepted socket is separate from the listening socket. Clients connect and both sides read and write bytes; applications must handle partial I/O, closure, errors, and framing.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A successful write means bytes were accepted into local processing, not that the remote application consumed them. Blocking and nonblocking APIs need different waiting and backpressure strategies.",
    // Record limitations and important interview distinctions.
    example: "A length-prefixed protocol reads four length bytes, validates the length, and then loops until that many payload bytes have arrived.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A single read call always returns the complete logical application message.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A TCP read returns only 40 bytes of a 100-byte message. What should a correct framed reader do?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Continue reading until the frame is complete, the connection closes, or an error/timeout occurs.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Treat the connection as corrupted because TCP never splits messages.",
    // Provide a plausible wrong choice for comparison.
    hard: "How do you prevent a socket server from hanging or exhausting memory on hostile partial messages?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Validate frame lengths before allocation, enforce maximum message sizes and deadlines, bound per-connection buffers, and respect write backpressure. Handle partial reads and disconnects explicitly. Use an event-driven or appropriately pooled design so one slow client cannot block unrelated clients indefinitely.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://man7.org/linux/man-pages/man7/socket.7.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "IPv4 vs IPv6",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "IPv4 uses 32-bit addresses, while IPv6 uses 128-bit addresses and a redesigned base header with extension headers.",
    // Introduce the concept and explain why it matters.
    mechanism: "IPv4 commonly uses dotted decimal notation; IPv6 uses hexadecimal groups with defined zero compression. IPv6 neighbor discovery uses ICMPv6 instead of ARP, and routers do not fragment IPv6 packets. Hosts rely on path MTU behavior and appropriate packet sizing.",
    // Explain its actual operation with correct terminology.
    tradeoff: "IPv6 address abundance does not automatically secure hosts or remove firewall needs. Dual-stack applications must support address selection and different path failures.",
    // Record limitations and important interview distinctions.
    example: "192.0.2.10 is documentation IPv4 notation; 2001:db8::10 is documentation IPv6 notation.",
    // Demonstrate a realistic use case or calculation.
    misconception: "IPv6 addresses are 64 bits and all IPv6 traffic is automatically encrypted.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An IPv6 router encounters a packet too large for its next link. What normally happens?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "It drops the packet and sends an ICMPv6 Packet Too Big message rather than fragmenting it.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "It always fragments the packet into smaller IPv6 router fragments.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can blocking all ICMPv6 break otherwise valid IPv6 connections?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "ICMPv6 supports essential functions including neighbor discovery and Packet Too Big feedback. Blocking those messages can prevent address resolution or path MTU discovery. Security rules should allow necessary control traffic instead of treating all ICMP as optional ping traffic.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc8200",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "Small IPv6 requests succeed, but large responses stall after a lower-MTU tunnel is introduced. ICMPv6 Packet Too Big messages are blocked. What is the strongest explanation?", "options": ["IPv6 routers automatically fragment every large packet, so MTU cannot matter", "The sender is missing path-MTU feedback and may keep sending unusably large packets", "IPv6 addresses become too short when tunneled"], "answer": "The sender is missing path-MTU feedback and may keep sending unusably large packets", "explanation": "IPv6 routers do not fragment forwarded packets. Packet Too Big feedback helps endpoints choose an appropriate size; filtering it can create a path-MTU black hole. Transport probing can mitigate some cases but does not make required control traffic irrelevant.", "hint": "Recall which node may fragment in IPv6 and how the sender learns a smaller path MTU." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Public vs Private IP",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Private IPv4 ranges are reserved for internal networks and are not globally routed as public Internet destinations.",
    // Introduce the concept and explain why it matters.
    mechanism: "RFC 1918 defines 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. Separate organizations can reuse these ranges internally. Public addressing supports globally unique routing, subject to allocation and policy; NAT often maps private clients onto public addresses.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Private addressing is not a security boundary by itself. Publicly addressed systems can still be firewalled, and private systems can be reached through tunnels, gateways, or misconfiguration.",
    // Record limitations and important interview distinctions.
    example: "A home laptop at 192.168.1.20 sends traffic through a NAT router whose external interface has a public address.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every address beginning with 172 is an RFC 1918 private address.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Is 172.20.1.5 within an RFC 1918 private range?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Yes. It falls inside 172.16.0.0 through 172.31.255.255.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "No. Only 192.168.0.0/16 can be private IPv4 space.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can two companies using the same private subnet encounter trouble after a merger or VPN connection?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Overlapping prefixes make destinations ambiguous: the same address can refer to different internal hosts. Routing cannot distinguish them solely from the destination IP. Renumbering, translation, segmented routing contexts, or application gateways may be needed; private reuse is convenient until networks must interconnect.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1918"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Subnetting",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Subnetting divides an address block into smaller prefixes by assigning more bits to the network portion.",
    // Introduce the concept and explain why it matters.
    mechanism: "An IPv4 /24 has 256 total addresses; splitting it into /26 blocks creates four blocks of 64 addresses. Conventional IPv4 subnets reserve network and broadcast addresses, while /31 point-to-point and /32 host routes have different semantics.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Address counts and usable-host counts differ. Subnet design must account for routing, growth, and actual network conventions rather than always subtracting two blindly.",
    // Record limitations and important interview distinctions.
    example: "192.0.2.0/24 divides into 192.0.2.0/26, .64/26, .128/26, and .192/26.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Subnetting increases the total number of addresses in the original allocation.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "How many total addresses are in an IPv4 /27 prefix?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "32 addresses, because 2^(32\u221227) = 32.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "27 addresses, because the prefix length is the address count.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you allocate variable-sized subnets for groups needing roughly 100, 50, and 20 conventional IPv4 hosts?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Choose prefixes large enough for each host requirement, commonly /25, /26, and /27 respectively, after accounting for reservations. Allocate larger aligned blocks first to avoid fragmentation, ensure they do not overlap, and leave deliberate growth capacity. Confirm the parent allocation is large enough.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc4632"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "CIDR",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Classless Inter-Domain Routing represents an IP prefix with an address and prefix length, enabling variable-sized allocation and route aggregation.",
    // Introduce the concept and explain why it matters.
    mechanism: "The prefix length counts leading network bits. Routers use longest-prefix matching: a more specific matching route wins over a broader aggregate. Aligned adjacent prefixes can sometimes be summarized to reduce routing-table size.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Aggregation works only when the summary accurately represents reachable destinations and policy. An overbroad announcement can attract traffic for unreachable addresses.",
    // Record limitations and important interview distinctions.
    example: "A route to 203.0.113.0/24 is more specific than a default route /0 and therefore wins for 203.0.113.9.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Routers always prefer the shortest matching prefix.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A table contains 10.0.0.0/8 and 10.20.0.0/16. Which prefix matches 10.20.3.4 most specifically?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "10.20.0.0/16.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "10.0.0.0/8, because fewer prefix bits always have higher priority.",
    // Provide a plausible wrong choice for comparison.
    hard: "Can two adjacent /24 blocks always be summarized into a /23?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Only if they share the correct aligned 23-bit prefix. For example, 192.0.2.0/24 and 192.0.3.0/24 form 192.0.2.0/23. Arbitrary adjacency without alignment is insufficient, and aggregation must also respect real reachability and routing policy.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc4632",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "Routes include 0.0.0.0/0, 10.0.0.0/8, and 10.20.0.0/16. For 10.20.5.8, what does ordinary longest-prefix forwarding select once these routes are installed?", "options": ["The /0 route because it matches all addresses", "The /8 route because shorter prefixes are preferred", "The /16 route because it is the most specific matching prefix"], "answer": "The /16 route because it is the most specific matching prefix", "explanation": "Forwarding first selects the longest matching destination prefix. Administrative preference and routing metrics help choose among candidate routes to the same prefix; they do not normally override a different installed, more-specific matching prefix.", "hint": "Separate control-plane route selection for a prefix from destination-prefix lookup in the forwarding table." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "NAT",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Network Address Translation rewrites IP addressing, and commonly transport ports, as packets cross an address-domain boundary.",
    // Introduce the concept and explain why it matters.
    mechanism: "A home router often performs port-address translation, maintaining mappings from private source address/port tuples to a public address/port. Return traffic is matched to connection state and translated back. Static mappings and port forwarding can permit selected inbound traffic.",
    // Explain its actual operation with correct terminology.
    tradeoff: "NAT conserves IPv4 addresses but complicates end-to-end connectivity, peer discovery, and protocols that embed addresses. NAT behavior alone is not equivalent to a well-defined firewall policy.",
    // Record limitations and important interview distinctions.
    example: "192.168.1.20:51000 can map to a public address port 62000, letting multiple internal clients share one external IPv4 address.",
    // Demonstrate a realistic use case or calculation.
    misconception: "NAT makes every internal application cryptographically secure.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An unsolicited Internet packet reaches a dynamic NAT with no matching mapping or forwarding rule. What commonly occurs?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The router cannot map it to an internal destination and drops it.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The router broadcasts it automatically to every private host.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why do peer-to-peer applications need techniques such as STUN, TURN, or explicit forwarding behind NAT?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Private endpoints cannot assume that a public peer can initiate a direct connection to their internal tuple. Mapping and filtering behavior vary across NATs, and mappings expire. Discovery and hole punching can sometimes establish a path, while a relay provides a fallback when direct connectivity fails.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc3022"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "ICMP",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "ICMP carries IP control and error messages, including reachability diagnostics and time-exceeded or packet-too-big feedback.",
    // Introduce the concept and explain why it matters.
    mechanism: "IPv4 ICMP includes echo requests and replies, destination-unreachable messages, and time-exceeded messages. Tools such as ping and traceroute use selected messages; path MTU discovery also depends on appropriate control feedback.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Failure to receive an echo reply does not prove an application is unavailable because ICMP may be filtered or deprioritized. Blocking every ICMP message can break useful network functions.",
    // Record limitations and important interview distinctions.
    example: "Traceroute varies packet TTL so routers return time-exceeded messages that reveal possible path hops.",
    // Demonstrate a realistic use case or calculation.
    misconception: "ICMP is only the ping command and has no other network purpose.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A host ignores ping but accepts HTTPS successfully. Is that contradictory?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. ICMP echo and TCP 443 can follow different filtering and service policies.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. A host cannot serve HTTPS unless it answers every echo request.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a large transfer hang while small requests work if ICMP feedback is blocked?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "A path MTU issue may prevent oversized packets from reaching the destination. If necessary fragmentation-needed or packet-too-big feedback is lost, the sender may keep using an unusable size. Diagnose packet sizes and PMTU behavior; allow required control messages or use suitable transport fallback mechanisms.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc792"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Routing Algorithms",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Routing algorithms compute paths through a network, while forwarding applies installed routes to individual packets.",
    // Introduce the concept and explain why it matters.
    mechanism: "Protocols exchange topology or reachability information and calculate selected routes based on metrics and policy. Distance-vector algorithms reason from neighbors advertised distances; link-state algorithms construct a topology view; path-vector routing carries path attributes.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The numerically shortest path is not always the chosen path: administrative preferences, policy, stability, and protocol-specific metrics matter. Control-plane convergence takes time after changes.",
    // Record limitations and important interview distinctions.
    example: "A router may learn an internal path through OSPF and an external reachability announcement through BGP, then apply its route selection rules.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every router recomputes the entire Internet graph separately for each packet.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "What is the difference between selecting a route and forwarding a packet?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Routing builds the table; forwarding uses that table to choose a next hop for a packet.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Routing copies application files, while forwarding assigns domain names.",
    // Provide a plausible wrong choice for comparison.
    hard: "What trade-offs matter when choosing a routing protocol for a large network?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Consider convergence time, scale, memory and CPU costs, topology structure, policy needs, operational complexity, and failure behavior. A small simple network may not need the same algorithm as an inter-domain network where independent organizations require policy control. Separate routing protocol selection from data-plane longest-prefix matching.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1812"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Distance Vector Routing",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Distance-vector routing lets routers select destinations using costs advertised by neighboring routers.",
    // Introduce the concept and explain why it matters.
    mechanism: "A router combines a neighbors advertised distance with the cost to reach that neighbor, following a Bellman-Ford style recurrence. Updates communicate reachability changes. Loop mitigations include split horizon, poison reverse, and bounded infinity depending on the protocol.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Routers do not necessarily know the full topology. Failures can produce transient loops and count-to-infinity behavior, so convergence and loop handling matter.",
    // Record limitations and important interview distinctions.
    example: "If neighbor B advertises cost 4 to network X and A-to-B costs 2, A can consider a route to X with total cost 6.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Each distance-vector router must maintain a full link-state map of every physical link.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "B advertises distance 3 to a destination and A reaches B with cost 2. What candidate distance can A calculate?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "5, by adding the link cost to the advertised distance.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "1, by subtracting the link cost from the advertised distance.",
    // Provide a plausible wrong choice for comparison.
    hard: "Explain count-to-infinity after a destination fails.",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Neighbors can incorrectly infer that the other still has a route and repeatedly increase their advertised metric while routing traffic in a loop. Split horizon and poison reverse reduce some cases, but protocol design and topology affect convergence. A finite maximum metric bounds the process at the cost of limiting network diameter.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2453"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Link State Routing",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Link-state routing distributes local link information so routers can compute paths from a topology database.",
    // Introduce the concept and explain why it matters.
    mechanism: "Routers discover neighbors and flood link-state advertisements within a scope. Sequence numbers and aging help distinguish current information from stale records. Each router computes shortest paths, commonly using Dijkstra, from its own position in the resulting graph.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Topology databases and recomputation consume memory and CPU. Areas and flooding scopes improve scale, while transient disagreement during convergence can still affect forwarding.",
    // Record limitations and important interview distinctions.
    example: "After a link fails, an OSPF router originates updated link-state information, and routers recalculate affected paths.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Link-state routing selects paths without learning any link information.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Why do link-state advertisements include freshness information such as sequence numbers?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "To distinguish newer topology information from stale or duplicated advertisements.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "To assign a unique TCP port to every router advertisement.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a consistent link-state protocol still experience brief forwarding problems after a failure?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Information takes time to flood and routers do not install new forwarding entries simultaneously. During this interval, neighbors may use different path calculations, causing temporary loops or drops. Fast detection, incremental computation, careful topology design, and ordered convergence techniques can reduce the disruption.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2328"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "RIP",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "RIP is a distance-vector interior routing protocol that uses hop count and treats 16 hops as unreachable.",
    // Introduce the concept and explain why it matters.
    mechanism: "Routers exchange reachable networks and hop-count metrics, with periodic and triggered updates. RIPv2 supports subnet masks and classless prefixes. Split horizon and route poisoning help reduce routing loops.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The maximum usable metric of 15 limits network size, and convergence is generally less suitable for large complex networks than modern alternatives. RIPv2 uses UDP port 520.",
    // Record limitations and important interview distinctions.
    example: "A route through three routers has a larger RIP metric than one through two routers even if the longer-hop path has faster links.",
    // Demonstrate a realistic use case or calculation.
    misconception: "RIP selects routes based on end-to-end bandwidth and supports unlimited hop count.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A RIP route reaches a metric of 16. What does that mean?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The destination is considered unreachable.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The route is preferred because a higher metric means more capacity.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why might RIP choose a slower path than a bandwidth-aware routing metric?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "RIP counts hops rather than measuring link bandwidth or latency. A two-hop path over slow links can beat a three-hop path over fast links. This simplicity reduces configuration burden but limits optimization and scale, so protocol choice should follow network requirements.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2453"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "OSPF",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "OSPF is a link-state interior gateway protocol that computes shortest paths within an autonomous system using configurable costs.",
    // Introduce the concept and explain why it matters.
    mechanism: "Routers establish adjacencies, synchronize link-state databases, and run shortest-path calculations. Areas limit topology scope, with backbone area 0 connecting the area hierarchy. On suitable multiaccess networks, designated routers reduce adjacency overhead.",
    // Explain its actual operation with correct terminology.
    tradeoff: "OSPF costs are often derived from interface bandwidth but are configurable. Area design, adjacency parameters, and database consistency affect operations; OSPF is not the global inter-domain policy protocol.",
    // Record limitations and important interview distinctions.
    example: "Two equal-cost OSPF paths can support equal-cost multipath when the implementation and configuration allow it.",
    // Demonstrate a realistic use case or calculation.
    misconception: "OSPF routes between independent Internet organizations using AS-path policy.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Which area serves as the OSPF backbone in a conventional multi-area design?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Area 0.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The numerically largest configured area.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can two directly connected OSPF routers fail to become fully adjacent?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Check matching area, authentication, hello/dead intervals, network type, addressing, and MTU behavior. Some multiaccess neighbors remain in 2-Way as expected if neither needs a full adjacency. Interpret neighbor state in context before assuming every non-Full entry is a fault.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2328"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "BGP",
    // Name this specific networking concept.
    module: "Network Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "BGP exchanges inter-domain reachability and path attributes, allowing autonomous systems to apply routing policy.",
    // Introduce the concept and explain why it matters.
    mechanism: "BGP advertises prefixes with attributes such as AS_PATH and NEXT_HOP over TCP sessions, traditionally port 179. Route selection considers policy and attributes; AS path information helps prevent straightforward inter-domain loops.",
    // Explain its actual operation with correct terminology.
    tradeoff: "BGP is not simply shortest-path routing. Business relationships, filtering, local preference, and security controls can outweigh hop count. Invalid or leaked announcements can disrupt global reachability.",
    // Record limitations and important interview distinctions.
    example: "A provider can prefer a customer route using local preference even when another advertised path has fewer autonomous systems.",
    // Demonstrate a realistic use case or calculation.
    misconception: "BGP always chooses the physically shortest route with the lowest latency.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An operator wants to prefer one exit within its own AS regardless of shorter external AS paths. Which common attribute is relevant?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Local preference, applied according to internal routing policy.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The destination applications HTTP Content-Type header.",
    // Provide a plausible wrong choice for comparison.
    hard: "How do route filtering and RPKI origin validation reduce BGP risk, and what do they not prove?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Prefix and AS filters limit unwanted announcements; RPKI origin validation checks whether an origin AS is authorized for a prefix under available ROAs. It does not validate every AS-path hop or guarantee route availability. Operators still need sound policy, monitoring, and handling for unknown or invalid origins.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc4271",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "An organization receives two valid routes for the same prefix. Its policy assigns route A local preference 200 and route B local preference 100, while B has a shorter AS path. In conventional BGP decision ordering, which route is preferred?", "options": ["Route B, because AS-path length always overrides local policy", "Route A, because higher local preference is considered before AS-path length", "Both are discarded because local preferences differ"], "answer": "Route A, because higher local preference is considered before AS-path length", "explanation": "Local preference expresses policy within the AS and conventionally precedes AS-path length in BGP best-path selection. BGP is policy-driven, so the shortest AS path is not an unconditional winner.", "hint": "Consider why an AS may prefer a customer route over a cheaper-looking external path." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "MAC Address",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A MAC address identifies a link-layer interface in technologies such as Ethernet, commonly using a 48-bit value.",
    // Introduce the concept and explain why it matters.
    mechanism: "An Ethernet frame carries source and destination MAC addresses for delivery on a local link. Switches learn source addresses and associate them with ports. The least significant bit of the first octet distinguishes individual from group addresses.",
    // Explain its actual operation with correct terminology.
    tradeoff: "MAC addresses can be locally administered, randomized, or spoofed, so they are not reliable proof of device identity. Remote Internet routers do not forward using the original hosts Ethernet destination address.",
    // Record limitations and important interview distinctions.
    example: "A laptop sends a frame to its default gateways MAC address when the IP destination is on another network.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A MAC address is a globally trustworthy permanent user authentication credential.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A laptop sends an IP packet to a remote network. Which destination MAC appears on its local Ethernet frame?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The next-hop routers MAC address, typically the default gateway.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The remote web servers MAC address obtained across the entire Internet.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why is MAC-based access control insufficient for strong authentication?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "MAC values are visible on local traffic and can often be changed in software. Wireless devices can randomize them for privacy, and bridges may expose different addressing behavior. Use authenticated network access mechanisms and cryptographic identity where strong access control is required.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc7042"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "ARP",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "ARP resolves an IPv4 address to a link-layer address on the local network.",
    // Introduce the concept and explain why it matters.
    mechanism: "A host broadcasts an ARP request asking for the hardware address associated with a target IPv4 address. The owner replies and neighbors cache the mapping. For an off-subnet destination, the host resolves the local next-hop gateway rather than the remote host.",
    // Explain its actual operation with correct terminology.
    tradeoff: "ARP has no built-in cryptographic authentication, allowing spoofed mappings on a shared segment. IPv6 uses Neighbor Discovery rather than ARP.",
    // Record limitations and important interview distinctions.
    example: "Before sending to gateway 192.168.1.1, a host can broadcast an ARP request and cache the returned Ethernet address.",
    // Demonstrate a realistic use case or calculation.
    misconception: "ARP looks up remote websites domain names using recursive DNS servers.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A host needs to reach 203.0.113.10 through its gateway. Which IPv4 address should it ARP for on its local link?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The local gateway address.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "203.0.113.10, even though that host is across multiple routers.",
    // Provide a plausible wrong choice for comparison.
    hard: "How can ARP spoofing redirect local traffic, and what mitigations help?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "An attacker can advertise a false IP-to-MAC mapping for a gateway so neighbors send frames to the attacker. Managed switches can use dynamic ARP inspection with trusted binding information; segmentation and endpoint protections reduce exposure. End-to-end TLS still matters because link-layer controls alone do not protect application content.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc826"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Switch vs Hub vs Router",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A hub repeats physical signals, a switch forwards link-layer frames, and a router forwards network-layer packets between IP networks.",
    // Introduce the concept and explain why it matters.
    mechanism: "A hub shares one collision domain. An Ethernet switch learns MAC-to-port mappings and selectively forwards known unicast frames. A router looks up destination IP prefixes and sends packets toward a next hop, normally separating broadcast domains.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Modern devices can combine roles, such as a home router containing a switch and wireless access point. Product names do not replace understanding the forwarding function.",
    // Record limitations and important interview distinctions.
    example: "A home device may switch traffic between LAN ports but route and translate traffic traveling from the LAN to the Internet.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A basic Ethernet hub maintains an IP routing table and isolates every broadcast.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A frame is addressed to a known MAC on switch port 3. What does a typical switch do?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Forward it toward port 3 rather than repeating it on every port.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Broadcast it through every Internet router regardless of the destination.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why does adding a switch not necessarily stop broadcast storms?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Switches normally flood broadcasts within a VLAN. Loops or excessive broadcast sources can therefore affect the whole broadcast domain. Loop prevention, storm controls, and segmentation are needed; routers or layer-3 boundaries normally stop ordinary layer-2 broadcasts.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/network-switch-how.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Ethernet",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Ethernet is a family of link-layer and physical standards for carrying frames across wired local networks.",
    // Introduce the concept and explain why it matters.
    mechanism: "An Ethernet frame includes destination and source MAC addresses, an EtherType or length field, payload, and a frame check sequence. Modern switched full-duplex links permit simultaneous sending and receiving without collision arbitration.",
    // Explain its actual operation with correct terminology.
    tradeoff: "CSMA/CD belongs to shared half-duplex Ethernet and is not used on ordinary full-duplex switched links. Frame checks detect errors but do not encrypt content or guarantee end-to-end delivery.",
    // Record limitations and important interview distinctions.
    example: "A host wraps an IPv4 packet in an Ethernet frame with EtherType 0x0800 for the local hop.",
    // Demonstrate a realistic use case or calculation.
    misconception: "All modern full-duplex Ethernet links require collision backoff for each frame.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Two endpoints use full-duplex switched Ethernet. Must they detect collisions before transmitting?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Full-duplex point-to-point Ethernet does not use CSMA/CD.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. Every Ethernet transmission reserves a shared collision bus.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a bad Ethernet FCS not be repaired simply by the IP layer at that hop?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "The receiver generally discards the corrupted frame rather than delivering an untrusted packet upward. Ethernet error detection identifies damage but does not supply arbitrary correction. Recovery may come from a reliable higher-level transport or an application retry, depending on the protocol.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://standards.ieee.org/ieee/802.3/10422/"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Error Detection",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Error detection adds redundant information so a receiver can identify some forms of data corruption.",
    // Introduce the concept and explain why it matters.
    mechanism: "Parity, checksums, and CRCs derive check information from message bits. The receiver recomputes and compares it. Different schemes have different mathematical guarantees and detection strength for random errors and burst patterns.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Detection is different from correction, authentication, and retransmission. Finite checks cannot detect every possible arbitrary corruption, and unkeyed checks do not defend against deliberate modification.",
    // Record limitations and important interview distinctions.
    example: "Ethernet uses an FCS based on CRC; a receiver drops a frame when the computed check disagrees with the received value.",
    // Demonstrate a realistic use case or calculation.
    misconception: "An ordinary CRC is a cryptographic signature proving who sent the message.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A corrupted frame fails its FCS. What has the receiver established?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The received bits failed the error-detection check; recovery needs a separate mechanism.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The receiver now knows exactly which original payload bits to restore.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why should an application use authenticated encryption even if every link has a CRC?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Link checks are unkeyed and hop-scoped, so an attacker can alter data and recompute them. Authenticated encryption uses secret-key cryptographic integrity across the intended security boundary. It also protects confidentiality, which a CRC does not address.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc3385"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Parity",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A parity bit makes the total number of set bits in a protected group even or odd, depending on the scheme.",
    // Introduce the concept and explain why it matters.
    mechanism: "For even parity, the sender chooses one extra bit so the full group contains an even number of ones. The receiver checks that property. A single changed bit toggles parity and is detected, while an even number of flipped bits can cancel.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Simple parity detects every odd number of bit flips but does not detect all even-numbered errors and does not locate the erroneous bit. Stronger codes add more structured redundancy.",
    // Record limitations and important interview distinctions.
    example: "The data 1011 contains three ones, so even parity adds a 1 to make four ones in total.",
    // Demonstrate a realistic use case or calculation.
    misconception: "One parity bit identifies and corrects any two corrupted bits.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Can a simple even-parity check miss exactly two flipped bits?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Yes. Two flips preserve the even/odd count.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "No. One parity bit detects every possible corruption.",
    // Provide a plausible wrong choice for comparison.
    hard: "How does two-dimensional parity improve on a single parity bit, and what remains limited?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Row and column parity can locate a single erroneous bit at their intersection and can detect more patterns. Some multi-bit patterns still cancel across rows and columns, so the scheme is not universal error correction. State the assumed error model when claiming detection or correction capability.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc3385"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "CRC",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A cyclic redundancy check treats a bit string as a polynomial and computes a remainder using a chosen generator polynomial.",
    // Introduce the concept and explain why it matters.
    mechanism: "The sender appends check bits derived by polynomial division over GF(2), where subtraction is XOR. The receiver applies the same polynomial rule to detect inconsistent remainders. Polynomial choice determines guarantees for error patterns and frame lengths.",
    // Explain its actual operation with correct terminology.
    tradeoff: "CRCs are efficient and strong against many burst errors but are not cryptographic message authentication. An attacker can deliberately modify a message and recompute its CRC.",
    // Record limitations and important interview distinctions.
    example: "Ethernet CRC-32 forms the frame check sequence so corrupted frames can be rejected on the local link.",
    // Demonstrate a realistic use case or calculation.
    misconception: "CRC uses a secret signing key shared with the sender.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An attacker changes a payload and recomputes its CRC correctly. Does an ordinary CRC expose the forgery?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. A CRC provides accidental-error detection, not keyed authenticity.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. A valid CRC cryptographically identifies the original sender.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why do CRC specifications need to agree on more than the polynomial name?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Initial values, input and output reflection, final XOR rules, bit order, and the exact protected bytes all affect the result. Two implementations can use the same polynomial but produce different check values. Interoperability requires the complete algorithm parameters and known test vectors.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc3385"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Checksum",
    // Name this specific networking concept.
    module: "Data Link Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A checksum combines data into a smaller check value used to detect selected accidental errors.",
    // Introduce the concept and explain why it matters.
    mechanism: "The Internet checksum sums 16-bit words using ones-complement arithmetic and stores the complemented result. TCP and UDP include an IP pseudo-header in their checksum coverage, helping detect certain misdelivery errors as well as payload corruption.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Checksums can miss some patterns and are not authentication. IPv4 checksums only its header, while TCP covers transport data; IPv6 has no equivalent base-header checksum.",
    // Record limitations and important interview distinctions.
    example: "A TCP checksum covers TCP header, payload, and a pseudo-header containing IP addressing and protocol-related fields.",
    // Demonstrate a realistic use case or calculation.
    misconception: "The IPv4 header checksum always validates the complete application payload.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Which IPv4 checksum covers only the IPv4 header rather than its payload?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The IPv4 header checksum.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The TCP checksum, which never includes transport payload.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why does TCP checksum coverage include an IP pseudo-header?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Including source and destination addressing plus protocol and length information helps detect corruption or misdelivery affecting the context in which a segment is interpreted. It does not transform the checksum into cryptographic integrity; an active attacker can recompute an unkeyed checksum.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc1071"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Guided vs Unguided Transmission",
    // Name this specific networking concept.
    module: "Physical Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Guided transmission carries signals through a physical medium such as copper or fiber; unguided transmission uses electromagnetic propagation through space.",
    // Introduce the concept and explain why it matters.
    mechanism: "Twisted pair and coaxial cables guide electrical signals, while optical fiber guides light. Wireless links use antennas and frequency bands with propagation affected by distance, interference, obstacles, and regulation.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Wired links can offer controlled paths and capacity; wireless adds mobility and deployment flexibility but shares spectrum and faces variable conditions. Fiber is resistant to electromagnetic interference but still requires physical handling and optical budgets.",
    // Record limitations and important interview distinctions.
    example: "An office uses fiber between buildings and Wi-Fi for mobile laptops, choosing media for different mobility and distance requirements.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Wireless signals never experience interference because there is no physical cable.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A factory has strong electromagnetic interference across a long cable route. Which guided medium can reduce that interference concern?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Optical fiber, which carries light rather than electrical signals.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Unshielded copper, because all electrical signals are immune to interference.",
    // Provide a plausible wrong choice for comparison.
    hard: "What factors would you compare before replacing a wired connection with wireless?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Evaluate required capacity, latency and jitter, mobility, distance, obstacles, interference, reliability, security, spectrum limits, installation cost, and maintenance. A nominal wireless link rate is not guaranteed application throughput because airtime sharing and retransmissions affect actual performance.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/wireless-network.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Transmission Media",
    // Name this specific networking concept.
    module: "Physical Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Transmission media are the physical paths carrying network signals, including twisted-pair copper, coaxial cable, optical fiber, and radio.",
    // Introduce the concept and explain why it matters.
    mechanism: "Medium characteristics determine attenuation, interference sensitivity, achievable signaling rates, distance, and transceiver requirements. Fiber may be single-mode for longer reach or multimode for shorter deployments; copper standards specify cable categories and channel limits.",
    // Explain its actual operation with correct terminology.
    tradeoff: "The medium alone does not determine end-to-end speed: transceivers, encoding, link negotiation, and bottlenecks also matter. A cable upgrade cannot overcome an unchanged slow endpoint port.",
    // Record limitations and important interview distinctions.
    example: "A fiber cable attached to 1 Gb/s transceivers provides a 1 Gb/s link even if the fiber could support a faster optical system.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Installing fiber automatically makes every connected endpoint operate at unlimited speed.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A 10 Gb/s-capable cable joins two ports that negotiate 1 Gb/s. What is the active link speed?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "1 Gb/s, unless the endpoints and negotiation change.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "10 Gb/s, because cable capability overrides endpoint hardware.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why do optical deployments need a link-budget calculation?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Transmit power must remain sufficient after fiber attenuation, connectors, splices, and engineering margins while avoiding receiver overload. Wavelength, distance, optics type, and fiber compatibility all matter. Physical connectivity alone does not guarantee a usable optical signal.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/products/interfaces-modules/transceiver-modules/index.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Network Devices",
    // Name this specific networking concept.
    module: "Physical Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Network devices perform roles such as repeating signals, bridging frames, routing packets, providing wireless access, and enforcing traffic policy.",
    // Introduce the concept and explain why it matters.
    mechanism: "Access points bridge wireless clients onto a distribution network. Switches connect local links, routers connect IP networks, modems adapt signals to an access technology, and firewalls apply policy. A single appliance may implement several of these functions.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Device role and forwarding behavior are more informative than a consumer product label. Security and performance depend on the configured function and traffic path.",
    // Record limitations and important interview distinctions.
    example: "A home gateway may contain a router, NAT, firewall, Ethernet switch, DHCP server, and Wi-Fi access point in one box.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every Wi-Fi access point must also perform Internet NAT and routing.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An access point bridges Wi-Fi clients into an existing LAN with a separate gateway. Must it perform NAT?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Bridging wireless and wired links does not inherently require NAT.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. Every wireless frame must be translated into a public IP address.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you identify which device is responsible when clients connect to Wi-Fi but receive no address?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Separate radio association from IP configuration. Check the access point bridge or VLAN path, DHCP relay or server reachability, pool capacity, and client exchange. The wireless device may be working correctly while a separate DHCP service or VLAN configuration fails.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Bandwidth",
    // Name this specific networking concept.
    module: "Physical Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Physical bandwidth is a frequency-range measure in hertz, while networking commonly uses bandwidth informally to mean data-rate capacity in bits per second.",
    // Introduce the concept and explain why it matters.
    mechanism: "Signaling design converts physical channel characteristics into a feasible data rate using modulation, coding, and error protection. Noise and available spectrum limit reliable communication; channel capacity and application throughput are related but different quantities.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Always clarify units. A 20 MHz wireless channel is not a 20 Mb/s guarantee, and protocol overhead, sharing, and radio conditions reduce delivered goodput below raw signaling rates.",
    // Record limitations and important interview distinctions.
    example: "Two wireless systems using the same channel width can achieve different data rates because modulation, coding, antenna streams, and signal quality differ.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A 20 MHz channel necessarily delivers exactly 20 megabytes per second.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Why can two radios on 20 MHz channels report different link rates?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "They can use different modulation, coding, antenna streams, and signal quality.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Channel width alone fixes every link rate, so one device must be defective.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you explain the difference between spectrum width, link rate, and application throughput?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Spectrum width describes the frequency resources. The link rate describes encoded transmission speed for a selected physical mode. Application throughput removes shared airtime, protocol overhead, retransmissions, and bottleneck effects. Measuring one does not directly establish the others.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc5136"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Network Topologies",
    // Name this specific networking concept.
    module: "Physical Layer",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Physical topology describes actual cabling or radio relationships, while logical topology describes how traffic is permitted to flow.",
    // Introduce the concept and explain why it matters.
    mechanism: "A collection of redundant cables can form a physical mesh while spanning tree selects a loop-free logical tree. Wireless communication shares radio resources even when a diagram draws clients as a star around an access point.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Diagrams should distinguish physical redundancy from active forwarding paths. A spare link does not provide usable failover unless protocols and configuration support it.",
    // Record limitations and important interview distinctions.
    example: "Two switches connected by redundant links need a loop-safe design such as link aggregation or spanning tree rather than uncontrolled parallel bridging.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every physically connected link must always forward all Ethernet broadcasts.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Two switches have two physical links but spanning tree blocks one. How many links forward ordinary traffic for that tree?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "One active link, while the other can provide redundancy after convergence.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Both must forward identical broadcasts continuously regardless of loops.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why should a network diagram label VLANs, aggregation, and blocked links instead of showing cables alone?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Those labels explain actual forwarding domains and active paths. Physical cabling does not reveal whether traffic is isolated, aggregated, or blocked by a loop-prevention protocol. Clear diagrams make failure analysis and capacity planning possible without assuming every drawn cable contributes independent usable bandwidth.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-network-topology.html",
    // Link to independent protocol or technical documentation.
    slug: "physical-network-topologies"
    // Disambiguate this title from its appearance in another module.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Client-Server Architecture",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Client-server architecture separates service consumers from processes that provide shared data or capabilities.",
    // Introduce the concept and explain why it matters.
    mechanism: "A client sends a request using an agreed protocol and a server processes it and returns a response or stream. Servers can scale horizontally behind a load balancer; persistent state may live in databases, caches, and object storage rather than one process.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Centralized service control simplifies policy and consistency but creates availability and scaling concerns. A server is a role, not necessarily one physical machine.",
    // Record limitations and important interview distinctions.
    example: "A browser requests a lesson from an API service, which checks the session and queries a database before returning the user-specific progress.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Client-server architecture requires one irreplaceable physical server for all users.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "An API moves from one instance to five behind a load balancer. What should happen to session state for reliable routing?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Use shared session storage or another deliberate strategy rather than assuming each process sees every session.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Keep each session only in one random process and route every request arbitrarily.",
    // Provide a plausible wrong choice for comparison.
    hard: "What can fail when a formerly single-instance application scales horizontally?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "In-memory sessions, local file assumptions, process-local locks, and uncoordinated scheduled jobs may stop working consistently. Move shared durable state into suitable services, design idempotent operations, coordinate background work, and make failure handling explicit. Stateless request handling simplifies routing but does not eliminate application state.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Peer-to-Peer Architecture",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Peer-to-peer systems let participating nodes both consume and provide resources or services to one another.",
    // Introduce the concept and explain why it matters.
    mechanism: "Peers discover participants, exchange data, and often coordinate distributed state without routing every payload through one central server. Discovery, identity, and bootstrap services may still be centralized or partially centralized.",
    // Explain its actual operation with correct terminology.
    tradeoff: "P2P can distribute bandwidth and improve resilience but faces churn, untrusted peers, consistency, discovery, and NAT traversal challenges. Decentralized data transfer does not imply the absence of all coordination services.",
    // Record limitations and important interview distinctions.
    example: "A file-sharing swarm downloads different verified chunks from several peers, while a tracker or distributed table helps discover them.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A peer-to-peer system guarantees that every peer is trusted and always online.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A P2P file has chunks from untrusted peers. What helps detect corrupted chunks?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Verify chunks against trusted integrity metadata or an authenticated content-addressing scheme.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Accept every chunk because distributed delivery proves correctness.",
    // Provide a plausible wrong choice for comparison.
    hard: "How does churn change the design of a peer-to-peer system?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Peers can disappear or change address at any time, so discovery, replication, timeout handling, and retry strategies must adapt. Data availability requires enough independent replicas, and integrity must be checked independently of peer identity. NAT or restrictive firewalls can require relays despite peer-oriented architecture.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc5694"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "DHCP",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "DHCP automatically supplies hosts with leased IP configuration, commonly including address, subnet mask, gateway, and DNS resolver information.",
    // Introduce the concept and explain why it matters.
    mechanism: "Initial DHCPv4 allocation commonly follows Discover, Offer, Request, Acknowledge over UDP ports 68 and 67. Leases have renewal behavior, and relay agents can forward client requests to servers on other subnets.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A lease is temporary configuration, not proof of identity. Broadcast reachability, relay settings, scope exhaustion, and rogue servers can all cause failures or unsafe configuration.",
    // Record limitations and important interview distinctions.
    example: "A new laptop broadcasts discovery, accepts an offered address, and receives a lease with its gateway and DNS resolver settings.",
    // Demonstrate a realistic use case or calculation.
    misconception: "DHCP assigns permanent cryptographic identities that cannot be spoofed.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Clients on another VLAN cannot reach a centralized DHCP server through ordinary broadcasts. What feature can help?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "A DHCP relay configured for that subnet.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "An HTTP redirect returned by the website clients plan to visit.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a client retain local connectivity but lose Internet access after a bad DHCP response?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "The offered address might fit the local subnet while the supplied default gateway or DNS resolver is wrong. Validate the entire lease, not just the address. DHCP snooping and trusted-server controls can reduce rogue-server risk, while routing and resolver tests distinguish gateway from name-resolution failures.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc2131",
    // Link to independent protocol or technical documentation.
    diagram: ["Client \u2192 broadcast: DHCPDISCOVER", "Server \u2192 client: DHCPOFFER", "Client \u2192 server: DHCPREQUEST", "Server \u2192 client: DHCPACK with lease and configuration"]
    // Show an ordered workflow to reinforce visual understanding.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Firewall",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A firewall enforces rules controlling which traffic may cross a host or network boundary.",
    // Introduce the concept and explain why it matters.
    mechanism: "Stateless filtering checks individual packet fields; stateful filtering tracks connection context. Application-aware controls can inspect higher-level behavior where visibility permits. Rules commonly combine source, destination, protocol, port, direction, and connection state.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A firewall does not prove application correctness or replace authentication and encryption. Rule order, default policy, IPv6 parity, and actual traffic path must be reviewed.",
    // Record limitations and important interview distinctions.
    example: "A stateful policy can allow outbound HTTPS and related return traffic while denying unsolicited inbound connections.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A firewall automatically fixes injection vulnerabilities in every application behind it.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A firewall allows a clients outbound TCP connection and established replies. Must it open every inbound port to receive the response?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Stateful tracking can permit return traffic for the established connection.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. Returning packets are unrelated to the outbound connection.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can an allow rule for a trusted source IP be insufficient authorization?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "IP addresses can represent shared NAT users, reassigned hosts, compromised systems, or spoofable traffic depending on protocol and position. Use identity and application authorization for sensitive actions, keep network rules narrowly scoped, and log policy outcomes. A network boundary supplements rather than replaces service security.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://csrc.nist.gov/pubs/sp/800/41/r1/final"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "VPN",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A VPN creates a protected logical network path across another network, commonly by tunneling traffic with authentication and encryption.",
    // Introduce the concept and explain why it matters.
    mechanism: "A tunnel encapsulates inner packets within an outer transport between VPN endpoints. Remote-access VPNs connect users to a network; site-to-site VPNs connect networks. Routing determines whether all traffic or selected prefixes use the tunnel.",
    // Explain its actual operation with correct terminology.
    tradeoff: "A VPN protects traffic only across its tunnel and shifts trust to the VPN endpoint. It does not make a malicious website safe or guarantee anonymity. Encapsulation adds overhead and can affect MTU.",
    // Record limitations and important interview distinctions.
    example: "A remote developer reaches an internal 10.0.0.0/8 service through a VPN while split tunneling leaves ordinary public browsing on the local connection.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A VPN prevents every endpoint compromise and makes all online activity untraceable.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A split-tunnel VPN routes only company subnets. Does ordinary public browsing necessarily pass through the VPN?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. Only traffic selected by the tunnel routing policy does.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. Every VPN configuration encrypts all device traffic through one endpoint.",
    // Provide a plausible wrong choice for comparison.
    hard: "What failure modes should be considered when a VPN connects overlapping private subnets?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Identical address ranges can make remote and local destinations ambiguous. Route priority might send traffic to the wrong network. Renumbering, translation, separate routing contexts, or application-specific access can resolve the conflict. Also account for DNS selection, MTU overhead, and least-privilege access to the remote network.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.rfc-editor.org/rfc/rfc4301"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Load Balancing",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Load balancing distributes work across multiple service instances according to a routing strategy and health information.",
    // Introduce the concept and explain why it matters.
    mechanism: "Layer-4 balancing can distribute transport connections; layer-7 balancing can route using HTTP hostnames, paths, or other application metadata. Common algorithms include round robin, least connections, and hashing. Health checks remove unsuitable targets from selection.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Even distribution is not always the right goal because request costs differ. Stateful sessions, graceful draining, retry side effects, and health-check accuracy influence reliability.",
    // Record limitations and important interview distinctions.
    example: "A reverse proxy sends /api requests to healthy API instances and /assets requests to a separate static origin.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A load balancer automatically makes every database transaction safe to execute twice.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A proxy retries a timed-out payment request on another instance. What application concern must be addressed?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Idempotency or deduplication, because the first instance may already have applied the payment.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Only CSS caching, because backend side effects cannot occur before a timeout.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why can a healthy process still be a bad load-balancer target?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "A shallow check can confirm that the process responds while its database dependency, worker pool, or critical endpoint is failing. Health checks should reflect useful readiness without overloading dependencies or causing synchronized flapping. Distinguish liveness, readiness, load, and graceful shutdown behavior.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://www.nginx.com/resources/glossary/load-balancing/"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "CDN",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A content delivery network serves suitable content from distributed edge locations to reduce origin load and user-perceived latency.",
    // Introduce the concept and explain why it matters.
    mechanism: "An edge cache reuses representations according to cache keys, freshness, and validation rules. DNS or routing steers clients toward an edge. On a miss, the edge fetches from an origin and may store the response when policy permits.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Incorrect cache keys or caching private responses can leak user data. Invalidation, personalized content, cookies, query parameters, and Vary behavior require deliberate configuration.",
    // Record limitations and important interview distinctions.
    example: "A versioned JavaScript asset can be cached for a long time, while a personalized dashboard response should usually avoid shared public caching.",
    // Demonstrate a realistic use case or calculation.
    misconception: "A CDN should publicly cache every authenticated users dashboard using the URL alone.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "Two signed-in users request /api/profile. What is dangerous about a shared cache keyed only by the path?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "One users private response could be reused for another user.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Nothing: all HTTP responses are inherently public.",
    // Provide a plausible wrong choice for comparison.
    hard: "How can versioned asset URLs simplify cache invalidation?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "A content hash or version in the URL gives each asset revision a new cache key. Old copies can remain safely cached while HTML references the new version. This does not solve stale HTML, sensitive response caching, or every deployment ordering issue, so configure those separately.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching",
    // Link to independent protocol or technical documentation.
    hardQuiz: { "prompt": "A CDN caches GET /api/profile using only the URL, and the origin returns different private JSON for each session. What change most directly prevents one user receiving another users cached profile?", "options": ["Make the cache TTL longer so profiles change less frequently", "Disable shared caching of this private response, or use a correctly isolated authenticated cache policy", "Compress the JSON before storing it under the same shared key"], "answer": "Disable shared caching of this private response, or use a correctly isolated authenticated cache policy", "explanation": "A path-only cache key can reuse one authenticated representation across users. A suitable Cache-Control policy such as private or no-store, correctly honored by the CDN, avoids shared reuse; deliberately caching personalized responses requires a complete isolation design.", "hint": "Identify which parts of the request determine the representation and whether a shared cache may reuse it." }
    // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "How a URL Works",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A URL identifies a resource using components such as scheme, host, optional port, path, query, and fragment.",
    // Introduce the concept and explain why it matters.
    mechanism: "The scheme selects interpretation and protocol behavior. The host can require DNS resolution; the port identifies a transport service; path and query are sent as part of an HTTP request target. A fragment is normally interpreted by the client and is not sent in the HTTP request target.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Encoding and normalization are security-sensitive. Query strings can appear in logs, and a lock icon does not imply that every URL component or linked resource is safe.",
    // Record limitations and important interview distinctions.
    example: "In https://example.com:8443/lessons?id=7#notes, the explicit port is 8443, the path is /lessons, the query is id=7, and notes is a client-side fragment.",
    // Demonstrate a realistic use case or calculation.
    misconception: "The browser sends the URL fragment to the server as part of every HTTP request target.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "For https://example.com/a?x=1#section, which component is normally omitted from the HTTP request target?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "The fragment, #section.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "The path, /a, because servers never receive paths.",
    // Provide a plausible wrong choice for comparison.
    hard: "Why should an application use a proper URL parser for redirects and allowlists?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Userinfo syntax, encoded characters, relative references, Unicode names, ports, and normalization can defeat naive string checks. Parse once with a standards-aware implementation, compare the intended origin or host fields, and apply clear scheme and destination rules before redirecting or fetching.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/API/URL"
    // Link to independent protocol or technical documentation.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "What Happens When You Enter a URL in a Browser?",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "A browser navigation resolves a resource address, establishes or reuses a connection, requests content, and interprets the response to render a page.",
    // Introduce the concept and explain why it matters.
    mechanism: "The browser parses the URL, checks relevant caches and service workers, resolves the hostname when needed, and establishes TCP plus TLS or QUIC as appropriate. It sends HTTP requests, follows permitted redirects, parses HTML and CSS, executes scripts, and fetches additional resources.",
    // Explain its actual operation with correct terminology.
    tradeoff: "There is no single mandatory fresh DNS or TCP handshake for every navigation: caching, connection reuse, preloading, proxies, and protocol version change the sequence. Rendering and network transfer can overlap.",
    // Record limitations and important interview distinctions.
    example: "An initial HTML response references a stylesheet and JavaScript bundle; the browser schedules those requests while parsing and later updates layout and paint.",
    // Demonstrate a realistic use case or calculation.
    misconception: "Every navigation must start a new TCP connection even when an existing suitable connection is available.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "A browser already has a suitable HTTP/2 connection to the origin. Must a second page request perform another TCP handshake?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "No. It can reuse the existing connection when browser and protocol rules permit.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Yes. HTTP/2 forbids multiple requests on one connection.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you investigate a page that loads slowly only on the first visit?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Inspect navigation timing and resource waterfalls to separate DNS, connection and TLS setup, server response time, transfer, parsing, and rendering. Compare cold and warm caches, connection reuse, bundle sizes, and blocking resources. Avoid attributing all delay to server execution when setup or client work may dominate.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work",
    // Link to independent protocol or technical documentation.
    diagram: ["Parse URL and check browser policies/caches", "Resolve DNS when no suitable cached answer exists", "Establish or reuse TCP + TLS or QUIC connection", "Send HTTP request and receive response", "Parse HTML; fetch CSS, scripts, images, and other resources", "Build DOM/styles, layout, paint, and update the page"]
    // Show an ordered workflow to reinforce visual understanding.
  }),
  // Finish this lesson and its three difficulty-based checkpoints.
  networkLesson({
    // Begin one independently authored networking lesson.
    title: "Common Networking Commands",
    // Name this specific networking concept.
    module: "Important Practical Concepts",
    // Group the lesson in the requested curriculum hierarchy.
    definition: "Networking tools expose different layers: ip shows interfaces and routes, ping probes ICMP reachability, dig queries DNS, ss shows sockets, and curl inspects application requests.",
    // Introduce the concept and explain why it matters.
    mechanism: "Use ip address and ip route to inspect local configuration, dig to inspect DNS records, ss -tuln for listening sockets, and curl -v or timing options for HTTP connection details. Traceroute or tracepath can reveal aspects of the routed path where responses are allowed.",
    // Explain its actual operation with correct terminology.
    tradeoff: "Each tool measures a limited behavior. A failed ping can coexist with working HTTPS, and traceroute output can reflect filtering or asymmetric paths rather than the exact application route.",
    // Record limitations and important interview distinctions.
    example: "For a failed local API: check ss -tuln for its listener, curl the endpoint, inspect ip route for remote destinations, and use dig only when name resolution is involved.",
    // Demonstrate a realistic use case or calculation.
    misconception: "If ping fails, every application protocol must be unavailable.",
    // Use a concept-specific misconception as a basic distractor.
    scenario: "DNS lookup succeeds but curl reports connection refused for the resolved IP and port. What is a useful next check?",
    // Ask learners to apply the explanation to a concrete situation.
    scenarioAnswer: "Confirm the service is listening on that address/port and inspect firewall or proxy behavior.",
    // Preserve the exact correct choice for server-side scoring.
    scenarioWrong: "Change the DNS name repeatedly because connection refusal proves DNS failed.",
    // Provide a plausible wrong choice for comparison.
    hard: "How would you diagnose a website failure without confusing DNS, routing, and application problems?",
    // Ask an interview-level reasoning question without locking access.
    hardAnswer: "Confirm local addressing and route selection, query the expected DNS records, then inspect connection and TLS behavior with an application-aware tool. Compare hostname and resolved-address tests carefully so TLS SNI and HTTP Host remain correct. Interpret each result within its layer and avoid treating absent ICMP responses as conclusive.",
    // Provide a reference answer for explicit descriptive self-assessment.
    reference: "https://man7.org/linux/man-pages/man8/ip.8.html"
    // Link to independent protocol or technical documentation.
  })
  // Finish this lesson and its three difficulty-based checkpoints.
];

// content/nosql-data.json
var nosql_data_default = [
  {
    title: "SQL vs NoSQL",
    module: "NoSQL Foundations",
    summary: "SQL databases commonly emphasize relational tables and declarative joins, while NoSQL covers several nonrelational data models. Choose according to access patterns, relationships, and required guarantees.",
    mechanism: "Document, key-value, column-family, and graph databases organize data differently. Modern relational databases can support JSON, and many NoSQL databases support transactions or declarative queries.",
    tradeoff: "Avoid assuming SQL means unscalable or NoSQL means eventually consistent. Compare a specific engine, topology, transaction boundary, query model, and operational workload.",
    example: "Use PostgreSQL for heavily related financial records; a document model may fit a product catalog with nested variant attributes.",
    easy: [
      "Which statement is accurate?",
      "NoSQL covers several different data models",
      "Every NoSQL database has the same consistency model",
      "SQL databases cannot store JSON"
    ],
    medium: [
      "What should drive a SQL-versus-NoSQL choice?",
      "Access patterns, integrity needs, and specific engine guarantees",
      "Whether the project name contains AI",
      "A blanket rule that joins are always slow"
    ],
    hard: [
      "Would you migrate to NoSQL solely because traffic increased?",
      "First measure the bottleneck and evaluate indexing, caching, query plans, vertical scaling, and read replicas. A different data model helps only when its trade-offs fit the workload and migration cost."
    ],
    source: "https://www.mongodb.com/resources/basics/databases/nosql-explained",
    hardChoice: {
      prompt: "An application needs atomic updates spanning several records. Which selection argument is technically sound?",
      options: [
        "Compare the specific engines\u2019 transaction boundaries and guarantees",
        "Reject every NoSQL database because none supports transactions",
        "Assume every SQL and NoSQL engine offers identical isolation"
      ],
      answer: "Compare the specific engines\u2019 transaction boundaries and guarantees",
      explanation: "Transactions are available in several NoSQL engines as well as relational systems, but their limits, isolation guarantees, costs, and topology requirements differ. Evaluate those concrete properties.",
      hint: "A database category does not specify the full concurrency contract."
    }
  },
  {
    title: "Types of NoSQL Databases",
    module: "NoSQL Foundations",
    summary: "NoSQL is an umbrella for document, key-value, wide-column, and graph models. The model shapes which reads and updates are simple or expensive.",
    mechanism: "Document stores group nested fields, key-value stores address values by key, wide-column stores organize sparse partitioned rows, and graph stores emphasize vertices and edges.",
    tradeoff: "A product may implement more than one model. Names alone do not establish transaction, query, or consistency guarantees.",
    example: "MongoDB: documents; Redis: key-value and data structures; Cassandra: wide-column; Neo4j: property graph.",
    easy: [
      "Which model represents vertices and relationships directly?",
      "Graph",
      "Only a flat key-value cache",
      "A CSV file format"
    ],
    medium: [
      "Why compare an actual database rather than only its NoSQL category?",
      "Engines in the same category can offer different guarantees",
      "Categories determine every failure behavior",
      "All NoSQL engines share one query language"
    ],
    hard: [
      "How can one application reasonably use several database models?",
      "Use a relational system of record, a key-value cache for disposable acceleration, and a search or graph projection for specialized queries. Define ownership, propagation, and reconciliation so copies do not become conflicting sources of truth."
    ],
    source: "https://www.mongodb.com/resources/basics/databases/nosql-explained"
  },
  {
    title: "Document Databases",
    module: "Data Models",
    summary: "A document database stores records as nested documents, often using JSON-like structures. Related fields can be read together without reconstructing them through joins.",
    mechanism: "A document can contain arrays and nested objects. Embedding favors bounded data accessed together; references favor independent lifecycle, large collections, or many-to-many relationships.",
    tradeoff: "Embedding unbounded child arrays causes growth and update pressure. Flexible shape still needs validation and intentional schema evolution.",
    example: "An order document can embed a bounded list of purchased items and their historical prices.",
    easy: [
      "When is embedding usually useful?",
      "Bounded related data frequently read together",
      "Unbounded event history growing forever",
      "Every many-to-many relationship regardless of size"
    ],
    medium: [
      "Why store the purchase-time item price inside an order?",
      "It preserves the historical transaction even if catalog prices change",
      "It guarantees all replicas are synchronous",
      "It removes the need for an order id"
    ],
    hard: [
      "Should all comments be embedded inside a popular article document?",
      "Not if the array can grow without bound. Consider separate comment documents indexed by article id, pagination, document-size limits, write contention, and whether a small summary should remain embedded."
    ],
    source: "https://www.mongodb.com/docs/manual/data-modeling/",
    hardChoice: {
      prompt: "A popular article receives millions of comments. Which model avoids an indefinitely growing parent document while supporting pagination?",
      options: [
        "Store comments separately with an article_id index and bounded pages",
        "Embed every comment forever in one article array",
        "Remove comment identifiers and concatenate all text"
      ],
      answer: "Store comments separately with an article_id index and bounded pages",
      explanation: "An unbounded embedded array grows toward document limits and concentrates writes. Separate comment documents with an appropriate index support bounded queries; a small summary can remain embedded.",
      hint: "Ask whether the embedded child collection is truly bounded."
    }
  },
  {
    title: "Key-Value Databases",
    module: "Data Models",
    summary: "A key-value database retrieves a value using an exact key. It suits lookups such as cached results, sessions, counters, and rate-limit state.",
    mechanism: "The application defines key naming, serialization, expiration, and grouping. Some engines provide rich data structures and atomic operations beyond a simple GET and SET interface.",
    tradeoff: "Key-based access is simple and fast, but arbitrary relational queries may need secondary structures or another system. Expiration and eviction make many caches unsuitable as the only durable source of truth.",
    example: 'SET session:abc "user-17" EX 3600 stores a session mapping with a one-hour expiration in Redis.',
    easy: [
      "What is the natural access pattern for a basic key-value store?",
      "Look up a known key",
      "Join arbitrary tables without extra support",
      "Scan a B+ tree by SQL syntax in every engine"
    ],
    medium: [
      "Why should an evictable cache not be the only store for financial records?",
      "Eviction can remove data that must be durable",
      "Keys cannot contain numbers",
      "Caches always reject writes"
    ],
    hard: [
      "How would you avoid a lost update for a shared Redis counter?",
      "Use an atomic increment operation instead of GET followed by SET. For compound conditions, use an appropriate atomic script or transaction pattern and define durability requirements separately."
    ],
    source: "https://redis.io/docs/latest/develop/data-types/"
  },
  {
    title: "Column-Family Databases",
    module: "Data Models",
    summary: "Wide-column databases organize partitioned rows with flexible columns and support large distributed workloads. Cassandra models tables around known query access paths.",
    mechanism: "A partition key determines data placement, while clustering columns order rows inside a partition. Denormalized query-specific tables avoid expensive cross-node joins.",
    tradeoff: "An unbounded or heavily skewed partition can become a hotspot. Choose partition bounds such as device plus time bucket and account for replication and consistency settings.",
    example: "sensor_readings PRIMARY KEY ((device_id, day), recorded_at) groups one device-day and orders readings by time.",
    easy: [
      "In Cassandra, what primarily determines the partition owning a row?",
      "The partition key",
      "The visual order of SELECT columns",
      "The name of a JSON property"
    ],
    medium: [
      "Why include a time bucket in a high-volume device partition key?",
      "To bound partition growth",
      "To force every device into one partition",
      "To remove all replication"
    ],
    hard: [
      "Why is copying relational tables directly into Cassandra often ineffective?",
      "Cassandra data models are query-driven. Start with required partition-local queries, design partition and clustering keys, duplicate data intentionally, and plan how each projection stays consistent."
    ],
    source: "https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/",
    hardChoice: {
      prompt: "A sensor emits millions of readings daily. Which Cassandra partition key most directly bounds per-partition growth while preserving device-local time queries?",
      options: [
        "(device_id, day) with recorded_at as a clustering column",
        "One constant partition key for every device",
        "recorded_at as an unbounded clustering column under device_id forever"
      ],
      answer: "(device_id, day) with recorded_at as a clustering column",
      explanation: "A device-and-day partition limits each partition to a bounded time window. The recorded_at clustering column preserves order inside that window; applications can query a known set of days.",
      hint: "Separate the partition boundary from the ordering inside it."
    }
  },
  {
    title: "Graph Databases",
    module: "Data Models",
    summary: "A graph database stores entities as vertices and relationships as edges. It fits queries where traversing connected data is central.",
    mechanism: "Property graphs attach properties to nodes and relationships. Traversal languages express paths such as people connected through a friendship or dependencies within a service graph.",
    tradeoff: "Graph models simplify relationship-heavy queries but still need indexes, traversal limits, and careful handling of high-degree nodes. They are not automatically best for every aggregate or bulk scan.",
    example: "MATCH (a:Person {id: 1})-[:FOLLOWS]->(b)-[:FOLLOWS]->(c) RETURN DISTINCT c finds two-hop connections in Cypher.",
    easy: [
      "What is the core relationship representation in a graph model?",
      "An edge connecting vertices",
      "A mandatory comma-separated string",
      "An array index in every database"
    ],
    medium: [
      "Why limit traversal depth in an online request?",
      "Paths can expand rapidly and consume substantial resources",
      "Graphs cannot contain cycles",
      "An index automatically limits all paths"
    ],
    hard: [
      "How would you query friends-of-friends while excluding current friends?",
      "Traverse two friendship hops, exclude the starting user and existing direct relationships, deduplicate results, and bound depth or result count. Evaluate high-degree nodes and authorization along the path."
    ],
    source: "https://neo4j.com/docs/getting-started/graph-database/"
  },
  {
    title: "MongoDB Fundamentals",
    module: "MongoDB Essentials",
    summary: "MongoDB stores BSON documents in collections and supports field queries, indexes, aggregation, and transactions. A useful model follows the application\u2019s read and write patterns.",
    mechanism: "Documents usually have an _id field backed by a unique index. CRUD operations work with query filters and update operators; a single-document write is atomic.",
    tradeoff: "Multi-document transactions exist but add cost and do not replace thoughtful modeling. BSON types, validation, indexes, and deployment topology influence behavior.",
    example: 'db.users.updateOne({ _id: userId }, { $set: { name: "Ada" } });',
    easy: [
      "What is MongoDB\u2019s main record format?",
      "BSON documents",
      "Only plain CSV rows",
      "Only graph edges"
    ],
    medium: [
      "Which atomicity statement is correct?",
      "A single-document write is atomic",
      "All writes across all collections are automatically one transaction",
      "MongoDB never supports transactions"
    ],
    hard: [
      "How would you safely decrement stock only when sufficient inventory exists?",
      "Use a single conditional update matching both the item id and stock >= requested amount, with $inc by a negative quantity. Check matched or modified count and use a transaction if other documents must change atomically."
    ],
    source: "https://www.mongodb.com/docs/manual/crud/"
  },
  {
    title: "Document Structure",
    module: "MongoDB Essentials",
    summary: "A BSON document is a set of typed fields that can include nested documents and arrays. Structure should make common operations predictable and bounded.",
    mechanism: "MongoDB supports explicit types such as dates, numbers, ObjectIds, arrays, and embedded objects. Dot notation addresses nested fields in many queries and updates.",
    tradeoff: "Flexible documents are not schema-free in an engineering sense. Validate required fields, choose consistent types, and avoid documents that grow indefinitely toward size limits.",
    example: '{ _id: ObjectId(...), name: "Ada", profile: { timezone: "Asia/Kolkata" }, skills: ["SQL", "OS"] }',
    easy: [
      "How can a query refer to a nested timezone field?",
      "Using a path such as profile.timezone",
      "Only by converting the whole document to CSV",
      "By removing _id"
    ],
    medium: [
      "Why avoid storing both strings and BSON dates for the same timestamp field?",
      "Mixed types complicate sorting, indexing, and comparisons",
      "BSON has no date type",
      "Strings make all writes atomic"
    ],
    hard: [
      "What problems arise with an unbounded activity array in one user document?",
      "The document grows toward its size limit, writes may contend on one record, and reading or updating history becomes expensive. Store separate bounded event records or time buckets and retain only a small recent summary."
    ],
    source: "https://www.mongodb.com/docs/manual/core/document/"
  },
  {
    title: "Collections",
    module: "MongoDB Essentials",
    summary: "A MongoDB collection groups related documents and is broadly analogous to a table, while allowing varying document shapes unless validation restricts them.",
    mechanism: "Collections own indexes and can define validation rules. Most application queries operate within one collection, while aggregation may join or transform related records.",
    tradeoff: "Do not create one collection per user without considering namespace and index overhead. A shared collection with an indexed tenant or owner field often simplifies operations and authorization.",
    example: 'db.createCollection("topics", { validator: { $jsonSchema: { bsonType: "object", required: ["title"] } } });',
    easy: [
      "What can enforce required fields in a collection?",
      "A collection validation rule",
      "The plural form of its name",
      "A frontend comment"
    ],
    medium: [
      "What is an important requirement for a shared multi-tenant collection?",
      "Every protected query must constrain authenticated tenant ownership",
      "Trusting a tenant id from any request body",
      "Disabling all indexes"
    ],
    hard: [
      "When might separate collections be justified?",
      "Different lifecycle, retention, schema, access policy, or workload may warrant separation. Compare namespace overhead and cross-collection queries rather than separating every individual user by default."
    ],
    source: "https://www.mongodb.com/docs/manual/core/databases-and-collections/"
  },
  {
    title: "Replication",
    module: "Distributed NoSQL",
    summary: "MongoDB replication uses a replica set to maintain copies of data and elect a primary. It improves availability and supports recovery, subject to write concern and failover behavior.",
    mechanism: "The primary accepts writes and secondaries replicate its operation log. Elections require a voting majority; write concern controls acknowledgment and read concern affects visible guarantees.",
    tradeoff: "Reading from a secondary can return stale data. Acknowledgment and read routing need to match the application\u2019s consistency and latency requirements.",
    example: "A three-member replica set can elect a new primary after one member fails when a majority can still communicate.",
    easy: [
      "Which replica-set member normally accepts MongoDB writes?",
      "The primary",
      "Every secondary independently by default",
      "Only an arbiter"
    ],
    medium: [
      "Why can a secondary read miss a recent write?",
      "Replication can lag",
      "Secondaries never store documents",
      "The document id must be a string"
    ],
    hard: [
      "Does w:majority alone guarantee every arbitrary read sees the latest write?",
      "No. Read concern, read preference, session causal guarantees, topology, and timing also matter. Specify the end-to-end consistency contract instead of inferring it from one write setting."
    ],
    source: "https://www.mongodb.com/docs/manual/replication/",
    hardChoice: {
      prompt: "A MongoDB write uses w:majority, then an unrelated client reads from a secondary. What is the safe conclusion?",
      options: [
        "The read may still be stale depending on read concern, routing, and session guarantees",
        "Every arbitrary secondary read must return that write immediately",
        "The write was necessarily rejected by all secondaries"
      ],
      answer: "The read may still be stale depending on read concern, routing, and session guarantees",
      explanation: "Majority write acknowledgment alone does not define every subsequent read\u2019s visibility. Read preference, read concern, replication progress, and causal session settings must be considered together.",
      hint: "One write setting is not the whole end-to-end consistency contract."
    }
  },
  {
    title: "Sharding",
    module: "Distributed NoSQL",
    summary: "MongoDB sharding distributes collection data across shards according to a shard key. Each shard can itself be a replica set.",
    mechanism: "mongos routes operations using metadata maintained by config servers. Range or hashed shard keys affect locality and distribution; balancing moves ranges as the cluster evolves.",
    tradeoff: "A monotonically increasing range key can concentrate inserts on one shard. A hashed key distributes writes better but can scatter range queries.",
    example: "Hash a high-cardinality customer identifier when balanced equality access matters more than contiguous range locality.",
    easy: [
      "What is the role of mongos?",
      "Route requests to relevant shards",
      "Store every database backup",
      "Replace all replica-set elections"
    ],
    medium: [
      "Which trade-off often follows hashing a shard key?",
      "Better distribution but weaker range-query locality",
      "Guaranteed single-shard execution for every query",
      "Removal of the need for indexes"
    ],
    hard: [
      "What happens when a query omits the shard key?",
      "The router may need a scatter-gather query across shards, increasing latency and resource usage. Design common queries and compound shard keys together, while testing skew and large-tenant behavior."
    ],
    source: "https://www.mongodb.com/docs/manual/sharding/"
  },
  {
    title: "CAP Theorem in NoSQL",
    module: "Distributed NoSQL",
    summary: "CAP applies to distributed systems regardless of whether their query language is SQL. During a partition, operations cannot always preserve both linearizability and availability.",
    mechanism: "An available side may accept writes without coordinating with the other side and later reconcile conflicts. A consistency-preserving system may reject or delay some operations until coordination is possible.",
    tradeoff: "Eventual consistency describes convergence under specified conditions, not a promise that conflicts cannot happen. Session guarantees and per-operation consistency options make real behavior more nuanced.",
    example: "A disconnected replica accepting a profile edit may later merge or reject a conflicting edit made elsewhere.",
    easy: [
      "Does CAP apply only to NoSQL products?",
      "No, it applies to distributed read/write systems under its assumptions",
      "Yes, SQL avoids network failures",
      "Only key-value stores have partitions"
    ],
    medium: [
      "What must an eventually consistent application plan for?",
      "Stale reads and possible conflicting updates",
      "The absence of all failures",
      "Every read being linearizable"
    ],
    hard: [
      "How should a shopping cart differ from a bank transfer during a partition?",
      "A cart may accept available edits with a well-defined merge policy. A transfer usually requires stricter invariant preservation and may reject unavailable coordination. The business operation determines acceptable consistency trade-offs."
    ],
    source: "https://www.cs.cornell.edu/courses/cs5414/2014fa/papers/Gilbert_Lynch_CAP.pdf",
    hardChoice: {
      prompt: "A partitioned shopping-cart service accepts edits on both sides and merges them later. What must the application specify?",
      options: [
        "A conflict-resolution policy and acceptable stale-read behavior",
        "That every read during the partition is linearizable",
        "That network partitions cannot affect users"
      ],
      answer: "A conflict-resolution policy and acceptable stale-read behavior",
      explanation: "Favoring available independent edits can create conflicting versions and stale reads. Convergence needs a defined merge or conflict-resolution rule; the word eventual does not remove that design task.",
      hint: "Describe what happens when the same item is edited independently."
    }
  },
  {
    title: "Use Cases and Trade-offs",
    module: "Distributed NoSQL",
    summary: "Database selection is a workload decision. Evaluate the data model, transaction boundaries, query patterns, failure guarantees, and operational costs together.",
    mechanism: "Prototype representative reads and writes, measure skew and growth, verify backup and restore, and test failure behavior. Include schema evolution and observability in the design.",
    tradeoff: "Using several databases adds integration and reconciliation work. Prefer the smallest set of systems that meets measured requirements and that the team can operate reliably.",
    example: "A graph projection can serve dependency traversal while PostgreSQL remains the authoritative record, provided projection lag and rebuilding are documented.",
    easy: [
      "What is a useful first step in selecting a database?",
      "List representative access patterns and required invariants",
      "Choose the product with the newest logo",
      "Assume one benchmark applies to every workload"
    ],
    medium: [
      "What extra cost does polyglot persistence introduce?",
      "Data propagation, monitoring, and reconciliation across systems",
      "Automatic removal of all schema changes",
      "Guaranteed lower latency for every request"
    ],
    hard: [
      "How would you validate a proposed database before migrating production data?",
      "Build a representative workload with realistic volume and skew, test required queries and transactions, simulate node failures and restores, estimate operational cost, and rehearse a reversible migration with reconciliation checks."
    ],
    source: "https://www.mongodb.com/docs/manual/data-modeling/"
  }
];

// content/nosql.ts
var nosqlTopics = buildDatabaseLessons("nosql", nosql_data_default);

// content/index.ts
var subjects = [
  // Keep the presentation metadata editable in one place.
  { id: "oop", title: "Object-Oriented Programming", shortTitle: "OOPs", description: "Think in objects. Design code that lasts.", color: "#b49cff", icon: "Boxes" },
  // Identify the object-oriented curriculum.
  { id: "os", title: "Operating Systems", shortTitle: "Operating Systems", description: "Understand what happens under the hood.", color: "#7fafff", icon: "Cpu" },
  // Identify the systems curriculum.
  { id: "dbms", title: "Database Management", shortTitle: "DBMS", description: "Build a strong foundation in data.", color: "#f1bb75", icon: "Database" },
  // Identify relational data foundations.
  { id: "sql", title: "Structured Query Language", shortTitle: "SQL", description: "Turn questions into powerful queries.", color: "#7ad5b6", icon: "CodeXml" },
  // Identify query language practice.
  { id: "cn", title: "Computer Networks", shortTitle: "Networks", description: "Connect the dots, one packet at a time.", color: "#e69bc3", icon: "Network" },
  // Identify networking fundamentals.
  { id: "nosql", title: "NoSQL Databases", shortTitle: "NoSQL", description: "Explore data beyond rows and columns.", color: "#7bcbd9", icon: "Layers" }
  // Identify non-relational systems.
];
var topics = [...oopTopics, ...osTopics, ...dbmsTopics, ...sqlTopics, ...cnTopics, ...nosqlTopics];

// server/curriculum.ts
var pending = /* @__PURE__ */ new WeakMap();
var moduleId = (topic) => `${topic.subjectId}:${topic.module}`;
function inserts(db, table, columns, records, conflictColumns) {
  const statements = [];
  const rowsPerStatement = Math.floor(100 / columns.length);
  for (let index = 0; index < records.length; index += rowsPerStatement) {
    const selected = records.slice(index, index + rowsPerStatement);
    const placeholders = selected.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders} ON CONFLICT (${conflictColumns.join(", ")}) DO NOTHING`;
    statements.push(db.prepare(sql).bind(...selected.flat()));
  }
  return statements;
}
async function seedCurriculum(db) {
  const modules = new Map(topics.map((topic) => [moduleId(topic), topic]));
  const statements = [
    // Order all writes so parent foreign keys exist before child records.
    ...inserts(db, "subjects", ["id", "data"], subjects.map((subject) => [subject.id, JSON.stringify(subject)]), ["id"]),
    // Seed shared subject metadata in one bounded query.
    ...inserts(db, "modules", ["id", "subject_id", "title"], [...modules].map(([id2, topic]) => [id2, topic.subjectId, topic.module]), ["id"]),
    // Seed subject modules before topic records.
    ...inserts(db, "topics", ["id", "subject_id", "module_id", "data"], topics.map((topic) => [topic.id, topic.subjectId, moduleId(topic), JSON.stringify(topic)]), ["id"]),
    // Store complete editable structured lessons.
    ...inserts(db, "learning_material", ["topic_id", "data"], topics.map((topic) => [topic.id, JSON.stringify({ overview: topic.overview, sections: topic.sections, example: topic.example, interview: topic.interview, revision: topic.revision, resources: topic.resources })]), ["topic_id"]),
    // Keep learning materials independently addressable.
    ...inserts(db, "checkpoints", ["id", "topic_id", "data"], topics.flatMap((topic) => topic.questions.map((question) => [question.id, topic.id, JSON.stringify(question)])), ["id"])
    // Seed stable checkpoint references without one query per question.
  ];
  await db.batch(statements);
}
async function ensureCurriculum(db) {
  let operation = pending.get(db);
  if (!operation) {
    operation = (async () => {
      const existing = await rows(db, "SELECT id FROM subjects LIMIT 1");
      if (!existing.length) await seedCurriculum(db);
    })();
    pending.set(db, operation);
    operation.catch(() => pending.delete(db));
  }
  await operation;
}
async function getCurriculum(db) {
  const [subjectRows, topicRows] = await Promise.all([rows(db, "SELECT data FROM subjects"), rows(db, "SELECT data FROM topics")]);
  return { subjects: subjectRows.map((item) => JSON.parse(item.data)), topics: topicRows.map((item) => JSON.parse(item.data)) };
}

// server/api.ts
var defaultSettings = { dailyGoal: 3, easy: 100, medium: 80, hard: 70, assessment: 80 };
var intervals = [1, 3, 7, 14, 30];
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var after = (milliseconds) => new Date(Date.now() + milliseconds).toISOString();
var id = () => crypto.randomUUID();
var json = (data, status = 200, headers = {}) => {
  const output = new Headers(headers);
  output.set("Cache-Control", "no-store");
  return Response.json({ data }, { status, headers: output });
};
var ApiError = class extends Error {
  // Preserve expected HTTP errors without exposing internal SQL details.
  constructor(status, message, code = "INVALID_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
  // Keep status, readable message, and machine code together.
};
var fail = (condition, status, message, code) => {
  if (condition) throw new ApiError(status, message, code);
};
var text = (value, maximum = 5e3) => {
  fail(typeof value !== "string" || value.length > maximum, 400, `Expected text of at most ${maximum} characters.`);
  return value.trim();
};
async function body(request) {
  fail(Number(request.headers.get("content-length") || 0) > 65536, 413, "Request is too large.");
  const raw = await request.text();
  fail(raw.length > 65536, 413, "Request is too large.");
  let parsed;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    throw new ApiError(400, "Send a valid JSON object.");
  }
  fail(!parsed || typeof parsed !== "object" || Array.isArray(parsed), 400, "Send a JSON object.");
  return parsed;
}
var publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });
async function authenticate(request, db) {
  const raw = readSession(request);
  fail(!raw, 401, "Sign in to save your learning progress.", "UNAUTHENTICATED");
  const user = await row(db, "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ?", await digest(raw), now());
  fail(!user, 401, "Your session has expired. Please sign in again.", "UNAUTHENTICATED");
  return user;
}
async function rateLimit(request, db, category, identifier = "") {
  const client = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "local";
  const bucketId = await digest(`${category}:${client}:${identifier}`);
  const expires = after(15 * 60 * 1e3);
  await write(db, "INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT (id) DO UPDATE SET count = CASE WHEN rate_limits.expires_at < ? THEN 1 ELSE rate_limits.count + 1 END, expires_at = CASE WHEN rate_limits.expires_at < ? THEN ? ELSE rate_limits.expires_at END", bucketId, expires, now(), now(), expires);
  const current = await row(db, "SELECT count FROM rate_limits WHERE id = ?", bucketId);
  fail((current?.count || 0) > 30, 429, "Too many attempts. Please try again in fifteen minutes.", "RATE_LIMITED");
}
function activity(db, userId, topicId, kind) {
  return db.prepare("INSERT INTO learning_activity (id, user_id, topic_id, kind, created_at) VALUES (?, ?, ?, ?, ?)").bind(id(), userId, topicId, kind, now());
}
function progressStatement(db, userId, topicId, status, reviewAt = null) {
  return db.prepare("INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, 0, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, viewed = 1, updated_at = ?, review_at = COALESCE(?, user_topic_progress.review_at)").bind(userId, topicId, status, now(), reviewAt, status, now(), reviewAt);
}
async function workspace(db, user) {
  const [progress, attempts, quizzes, bookmarks, notes, activityRows] = await Promise.all([
    // Fetch independent private collections together.
    rows(db, "SELECT * FROM user_topic_progress WHERE user_id = ?", user.id),
    // Load topic states for this user only.
    rows(db, "SELECT * FROM checkpoint_attempts WHERE user_id = ? ORDER BY created_at ASC", user.id),
    // Preserve all historical checkpoint attempts.
    rows(db, "SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC", user.id),
    // Preserve all historical quiz results.
    rows(db, "SELECT topic_id FROM bookmarks WHERE user_id = ?", user.id),
    // Load private bookmarks.
    rows(db, "SELECT topic_id, text, updated_at FROM user_notes WHERE user_id = ?", user.id),
    // Load private notes.
    rows(db, "SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM learning_activity WHERE user_id = ? GROUP BY substr(created_at, 1, 10) ORDER BY date", user.id)
    // Aggregate actual event counts by UTC calendar day.
  ]);
  return {
    // Map portable SQL columns into the frontend's camel-case contract.
    user: publicUser(user),
    // Expose only safe profile fields.
    progress: progress.map((item) => ({ topicId: item.topic_id, status: item.status, viewed: Boolean(item.viewed), updatedAt: item.updated_at, reviewStep: item.review_step, reviewAt: item.review_at })),
    // Preserve all five learning states.
    attempts: attempts.map((item) => ({ id: item.id, topicId: item.topic_id, questionId: item.question_id, answer: item.answer, correct: item.correct === null ? null : Boolean(item.correct), difficulty: item.difficulty, createdAt: item.created_at })),
    // Keep ungraded descriptive answers null.
    quizzes: quizzes.map((item) => ({ id: item.id, subjectId: item.subject_id, ...item.topic_id ? { topicId: item.topic_id } : {}, score: item.score, correct: item.correct, total: item.total, seconds: item.seconds, createdAt: item.created_at, answers: JSON.parse(String(item.answers)) })),
    // Decode server-scored answer histories.
    bookmarks: bookmarks.map((item) => item.topic_id),
    // Return saved topic IDs instead of join records.
    notes: notes.map((item) => ({ topicId: item.topic_id, text: item.text, updatedAt: item.updated_at })),
    // Return private editable study notes.
    activity: activityRows.map((item) => ({ date: item.date, count: Number(item.count) })),
    // Normalize PostgreSQL COUNT values to numbers.
    settings: { ...defaultSettings, ...JSON.parse(user.settings) }
    // Supply defaults when a future setting has not yet been saved.
  };
}
function topicMastered(topic, attempts, quizzes, settings = defaultSettings) {
  const latest = /* @__PURE__ */ new Map();
  for (const attempt of attempts.filter((item) => item.topicId === topic.id)) latest.set(attempt.questionId, attempt);
  for (const difficulty of ["Easy", "Medium", "Hard"]) {
    const questions = topic.questions.filter((question) => question.difficulty === difficulty);
    if (!questions.length) continue;
    const answers = questions.map((question) => latest.get(question.id));
    if (answers.some((answer) => !answer || answer.correct === null)) return false;
    const correct = answers.filter((answer) => answer?.correct).length;
    if (correct / questions.length * 100 < settings[difficulty.toLowerCase()]) return false;
  }
  const required = Math.min(3, topic.questions.filter((question) => question.type === "mcq").length);
  const assessment = quizzes.filter((quiz) => quiz.topicId === topic.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const covered = assessment && topic.questions.filter((question) => question.type === "mcq").every((question) => assessment.answers.some((answer) => answer.questionId === question.id && answer.topicId === topic.id));
  const recentQuiz = quizzes.filter((quiz) => quiz.answers.some((answer) => answer.topicId === topic.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (recentQuiz && assessment && recentQuiz.createdAt >= assessment.createdAt && recentQuiz.answers.some((answer) => answer.topicId === topic.id && !answer.correct)) return false;
  return required > 0 && Boolean(assessment && covered && assessment.total >= required && assessment.score >= settings.assessment);
}
async function refreshMastery(db, user, topic) {
  const state = await workspace(db, user);
  const existing = state.progress.find((item) => item.topicId === topic.id);
  const mastered = topicMastered(topic, state.attempts, state.quizzes, state.settings);
  const latest = state.attempts.filter((item) => item.topicId === topic.id).at(-1);
  const status = mastered ? "Mastered" : latest?.correct === false ? "Needs Revision" : existing?.status === "Mastered" ? "In Progress" : existing?.status || "In Progress";
  await write(db, "INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, 0, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, updated_at = ?, review_at = COALESCE(user_topic_progress.review_at, ?)", user.id, topic.id, status, now(), after(864e5), status, now(), after(864e5));
}
async function handleAuthentication(request, env, path) {
  const db = env.DB;
  if (path === "/api/auth/logout" && request.method === "POST") {
    const raw = readSession(request);
    if (raw) await write(db, "DELETE FROM sessions WHERE id = ?", await digest(raw));
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", request, true) });
  }
  if ((path === "/api/auth/login" || path === "/api/auth/register") && request.method === "POST") {
    const input = await body(request);
    const email = text(input.email, 254).toLowerCase();
    const password = typeof input.password === "string" ? input.password : "";
    fail(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, "Enter a valid email address.");
    fail(password.length < 10 || password.length > 256, 400, "Use a password between 10 and 256 characters.");
    await rateLimit(request, db, "authentication");
    await rateLimit(request, db, "account", email);
    let user = await row(db, "SELECT * FROM users WHERE email = ?", email);
    if (path.endsWith("/register")) {
      const name = text(input.name, 80);
      fail(name.length < 2, 400, "Enter a name with at least two characters.");
      fail(user, 409, "An account with this email already exists. Try signing in.", "EMAIL_EXISTS");
      user = { id: id(), name, email, password_hash: await hashPassword(password), settings: JSON.stringify(defaultSettings) };
      try {
        await write(db, "INSERT INTO users (id, name, email, password_hash, settings, created_at) VALUES (?, ?, ?, ?, ?, ?)", user.id, user.name, user.email, user.password_hash, user.settings, now());
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "An account with this email already exists.", "EMAIL_EXISTS");
        throw error;
      }
    } else {
      const valid = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, await hashPassword("unavailable-account-password"));
      fail(!user || !valid, 401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
    }
    const raw = token();
    await write(db, "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", await digest(raw), user.id, after(30 * 864e5));
    return json(publicUser(user), path.endsWith("/register") ? 201 : 200, { "Set-Cookie": sessionCookie(raw, request) });
  }
  if (path === "/api/auth/forgot-password" && request.method === "POST") {
    const input = await body(request);
    const email = text(input.email, 254).toLowerCase();
    await rateLimit(request, db, "password-reset");
    await rateLimit(request, db, "password-reset-account", email);
    fail(!env.RESEND_API_KEY && env.DEVELOPMENT !== "true", 503, "Password-reset email delivery has not been configured by the site owner.", "EMAIL_NOT_CONFIGURED");
    const user = await row(db, "SELECT * FROM users WHERE email = ?", email);
    let developmentResetUrl;
    if (user) {
      const raw = token();
      const url = `${env.APP_ORIGIN || new URL(request.url).origin}/reset-password?token=${raw}`;
      await db.batch([db.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(user.id), db.prepare("INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)").bind(await digest(raw), user.id, after(30 * 6e4))]);
      if (env.RESEND_API_KEY) {
        const delivery = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.RESET_FROM_EMAIL || "CS Fundamentals <onboarding@resend.dev>", to: [email], subject: "Reset your CS Fundamentals password", text: `Reset your password using this link within 30 minutes: ${url}

If you did not request this, ignore this message.` }) });
        fail(!delivery.ok, 503, "Email delivery is temporarily unavailable. Please try again later.", "EMAIL_DELIVERY_FAILED");
      } else if (env.DEVELOPMENT === "true") developmentResetUrl = url;
    }
    return json({ message: "If an account exists, a reset link has been sent.", ...developmentResetUrl ? { developmentResetUrl } : {} });
  }
  if (path === "/api/auth/reset-password" && request.method === "POST") {
    const input = await body(request);
    const raw = text(input.token, 256);
    const password = typeof input.password === "string" ? input.password : "";
    fail(password.length < 10 || password.length > 256, 400, "Use a password between 10 and 256 characters.");
    await rateLimit(request, db, "reset-complete");
    const hashed = await digest(raw);
    const reset = await row(db, "SELECT user_id FROM password_resets WHERE id = ? AND expires_at > ?", hashed, now());
    fail(!reset, 400, "This reset link is invalid or expired. Request a new one.", "INVALID_RESET_TOKEN");
    await db.batch([
      // Update credentials and revoke all old access atomically.
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND EXISTS (SELECT 1 FROM password_resets WHERE id = ? AND expires_at > ?)").bind(await hashPassword(password), reset.user_id, hashed, now()),
      // Guard the password write against a simultaneously consumed reset token.
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(reset.user_id),
      // Require every device to sign in with the new password.
      db.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(reset.user_id)
      // Consume every outstanding reset link for this account.
    ]);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", request, true) });
  }
  return null;
}
async function handleApi(request, env) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const db = env.DB;
    fail(!db, 503, "The database is not configured.", "DATABASE_UNAVAILABLE");
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      fail(origin && origin !== url.origin && origin !== env.APP_ORIGIN, 403, "This request came from an untrusted origin.", "ORIGIN_REJECTED");
      fail(request.headers.get("sec-fetch-site") === "cross-site", 403, "Cross-site requests are not allowed.", "ORIGIN_REJECTED");
      fail(!request.headers.get("content-type")?.includes("application/json"), 415, "Use application/json for API requests.");
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS" } });
    await ensureCurriculum(db);
    const authResponse = await handleAuthentication(request, env, path);
    if (authResponse) return authResponse;
    if (request.method === "GET" && (path === "/api/curriculum" || path.startsWith("/api/subjects") || path.startsWith("/api/topics"))) {
      const curriculum2 = await getCurriculum(db);
      if (path === "/api/curriculum") return json(curriculum2);
      if (path === "/api/subjects") return json(curriculum2.subjects);
      const subjectMatch = path.match(/^\/api\/subjects\/([^/]+)(\/topics)?$/);
      if (subjectMatch) {
        const subject = curriculum2.subjects.find((item) => item.id === decodeURIComponent(subjectMatch[1]));
        fail(!subject, 404, "Subject not found.", "NOT_FOUND");
        return json(subjectMatch[2] ? curriculum2.topics.filter((item) => item.subjectId === subject.id) : { ...subject, topics: curriculum2.topics.filter((item) => item.subjectId === subject.id) });
      }
      const topicMatch = path.match(/^\/api\/topics\/([^/]+)(\/(material|checkpoints))?$/);
      if (topicMatch) {
        const topic = curriculum2.topics.find((item) => item.id === decodeURIComponent(topicMatch[1]));
        fail(!topic, 404, "Topic not found.", "NOT_FOUND");
        return json(topicMatch[3] === "checkpoints" ? topic.questions : topic);
      }
    }
    const user = await authenticate(request, db);
    if (path === "/api/auth/me" && request.method === "GET") return json(publicUser(user));
    if (path === "/api/auth/me" && request.method === "PATCH") {
      const input = await body(request);
      const name = text(input.name, 80);
      fail(name.length < 2, 400, "Enter a name with at least two characters.");
      await write(db, "UPDATE users SET name = ? WHERE id = ?", name, user.id);
      return json({ ...publicUser(user), name });
    }
    if (request.method === "GET" && (path === "/api/workspace" || path.startsWith("/api/progress") || path.startsWith("/api/revision") || path === "/api/bookmarks" || path === "/api/notes" || path === "/api/quizzes/history")) {
      const state = await workspace(db, user);
      if (path === "/api/bookmarks") return json(state.bookmarks);
      if (path === "/api/notes") return json(state.notes);
      if (path === "/api/quizzes/history") return json(state.quizzes);
      if (path === "/api/progress/activity") return json(state.activity);
      if (path === "/api/progress/topics") return json(state.progress);
      if (path === "/api/revision/today") return json(state.progress.filter((item) => item.status === "Needs Revision" || item.reviewAt && item.reviewAt <= now()));
      if (path === "/api/revision/weak-topics") return json(state.progress.filter((item) => item.status === "Needs Revision"));
      return json(state);
    }
    if (path === "/api/settings" && request.method === "PUT") {
      const input = await body(request);
      const settings = { ...defaultSettings };
      for (const key of Object.keys(settings)) {
        const value = Number(input[key] ?? JSON.parse(user.settings)[key] ?? settings[key]);
        fail(!Number.isInteger(value) || value < 1 || value > (key === "dailyGoal" ? 100 : 100), 400, `${key} must be a whole number between 1 and 100.`);
        settings[key] = value;
      }
      await write(db, "UPDATE users SET settings = ? WHERE id = ?", JSON.stringify(settings), user.id);
      user.settings = JSON.stringify(settings);
      const [state, catalog] = await Promise.all([workspace(db, user), getCurriculum(db)]);
      const recalculations = [];
      for (const progress of state.progress) {
        const topic = catalog.topics.find((item) => item.id === progress.topicId);
        if (!topic) continue;
        const mastered = topicMastered(topic, state.attempts, state.quizzes, settings);
        const status = mastered ? "Mastered" : progress.status === "Mastered" ? "In Progress" : progress.status;
        if (status !== progress.status) recalculations.push(db.prepare("UPDATE user_topic_progress SET status = ? WHERE user_id = ? AND topic_id = ?").bind(status, user.id, topic.id));
      }
      for (let index = 0; index < recalculations.length; index += 100) await db.batch(recalculations.slice(index, index + 100));
      return json(settings);
    }
    const curriculum = await getCurriculum(db);
    const findTopic = (topicId) => {
      const found = curriculum.topics.find((topic) => topic.id === topicId);
      fail(!found, 404, "Topic not found.", "NOT_FOUND");
      return found;
    };
    const progressMatch = path.match(/^\/api\/progress\/topics\/([^/]+)$/);
    if (progressMatch && request.method === "POST") {
      const topic = findTopic(decodeURIComponent(progressMatch[1]));
      const input = await body(request);
      const status = text(input.status, 40);
      fail(!["Not Started", "In Progress", "Completed", "Needs Revision"].includes(status), 400, "Mastery is calculated from checkpoint and quiz evidence; select a learning status.");
      await db.batch([progressStatement(db, user.id, topic.id, status, status === "Needs Revision" || status === "Completed" ? after(864e5) : null), activity(db, user.id, topic.id, status === "In Progress" ? "learn" : "progress")]);
      await refreshMastery(db, user, topic);
      return json(await workspace(db, user));
    }
    const checkpointMatch = path.match(/^\/api\/checkpoints\/([^/]+)(\/(attempt|history))?$/);
    if (checkpointMatch) {
      const questionId = decodeURIComponent(checkpointMatch[1]);
      const topic = curriculum.topics.find((item) => item.questions.some((question2) => question2.id === questionId));
      const question = topic?.questions.find((item) => item.id === questionId);
      fail(!topic || !question, 404, "Checkpoint not found.", "NOT_FOUND");
      if (request.method === "GET") {
        if (checkpointMatch[3] === "history") return json((await workspace(db, user)).attempts.filter((attempt) => attempt.questionId === questionId));
        return json(question);
      }
      if (request.method === "POST" && checkpointMatch[3] === "attempt") {
        const input = await body(request);
        const answer = text(input.answer, 1e4);
        fail(!answer, 400, "Write an answer before submitting.");
        fail(input.topicId && input.topicId !== topic.id, 400, "This checkpoint belongs to a different topic.");
        const correct = question.type === "mcq" ? answer === question.answer : typeof input.correct === "boolean" ? input.correct : null;
        const attempt = { id: id(), topicId: topic.id, questionId, answer, correct, difficulty: question.difficulty, createdAt: now() };
        await db.batch([db.prepare("INSERT INTO checkpoint_attempts (id, user_id, topic_id, question_id, answer, correct, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(attempt.id, user.id, topic.id, questionId, answer, correct === null ? null : Number(correct), question.difficulty, attempt.createdAt), activity(db, user.id, topic.id, "checkpoint")]);
        await refreshMastery(db, user, topic);
        return json({ attempt, referenceAnswer: question.answer, explanation: question.explanation }, 201);
      }
    }
    if (path === "/api/quizzes" && request.method === "GET") return json({ subjects: curriculum.subjects, difficulties: ["Easy", "Medium", "Hard"], modes: ["topic", "subject", "mixed", "mock"] });
    if (path === "/api/quizzes/start" && request.method === "POST") {
      const input = await body(request);
      const subjectId = text(input.subjectId || "all", 100);
      const topicId = input.topicId ? text(input.topicId, 200) : null;
      const difficulty = text(input.difficulty || "all", 20);
      const count = Math.min(20, Math.max(1, Math.floor(Number(input.count) || 10)));
      fail(subjectId !== "all" && !curriculum.subjects.some((subject) => subject.id === subjectId), 400, "Choose a valid subject.");
      fail(!["all", "Easy", "Medium", "Hard"].includes(difficulty), 400, "Choose a valid difficulty level.");
      if (topicId) findTopic(topicId);
      const pool = curriculum.topics.filter((topic) => (!topicId || topic.id === topicId) && (subjectId === "all" || topic.subjectId === subjectId)).flatMap((topic) => topic.questions.filter((question) => question.type === "mcq" && (difficulty === "all" || question.difficulty === difficulty)).map((question) => ({ ...question, topicId: topic.id })));
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
        const target = Math.floor(random * (index + 1));
        [pool[index], pool[target]] = [pool[target], pool[index]];
      }
      const selected = pool.slice(0, count);
      fail(!selected.length, 400, "No automatically scored questions are available for this selection.");
      const quizId = id();
      const startedAt = now();
      const expiresAt = after(60 * 6e4);
      await write(db, "INSERT INTO quizzes (id, user_id, subject_id, topic_id, questions, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)", quizId, user.id, subjectId, topicId, JSON.stringify(selected.map((question) => ({ questionId: question.id, topicId: question.topicId }))), startedAt, expiresAt);
      return json({ id: quizId, questions: selected.map((question) => ({ ...question, answer: "", explanation: "" })), startedAt, expiresAt }, 201);
    }
    if (path === "/api/quizzes/submit" && request.method === "POST") {
      const input = await body(request);
      fail(!Array.isArray(input.answers) || !input.answers.length || input.answers.length > 50, 400, "Submit between 1 and 50 answers.");
      const supplied = input.answers.map((answer) => ({ questionId: text(answer.questionId, 200), topicId: text(answer.topicId, 200), answer: text(answer.answer, 1e4) }));
      fail(new Set(supplied.map((answer) => answer.questionId)).size !== supplied.length, 400, "Each assessment question may be submitted only once.");
      let subjectId = text(input.subjectId || "all", 100);
      let topicId = input.topicId ? text(input.topicId, 200) : null;
      let selected = supplied.map((answer) => ({ questionId: answer.questionId, topicId: answer.topicId }));
      let seconds = Math.min(3600, Math.max(0, Math.floor(Number(input.seconds) || 0)));
      let quizId = null;
      if (input.quizId) {
        quizId = text(input.quizId, 100);
        const quiz = await row(db, "SELECT * FROM quizzes WHERE id = ? AND user_id = ?", quizId, user.id);
        fail(!quiz || quiz.expires_at < now(), 400, "This assessment is missing or expired. Start a new one.", "QUIZ_EXPIRED");
        const previous = await row(db, "SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?", quizId, user.id);
        if (previous) return json((await workspace(db, user)).quizzes.find((result2) => result2.id === previous.id));
        selected = JSON.parse(quiz.questions);
        subjectId = quiz.subject_id;
        topicId = quiz.topic_id;
        seconds = Math.max(0, Math.floor((Date.now() - Date.parse(quiz.created_at)) / 1e3));
        fail(supplied.some((answer) => !selected.some((question) => question.questionId === answer.questionId && question.topicId === answer.topicId)), 400, "The submitted answers do not match this assessment.");
      } else if (topicId) {
        const topic = findTopic(topicId);
        const allQuestions = topic.questions.filter((question) => question.type === "mcq");
        if (!allQuestions.every((question) => selected.some((answer) => answer.questionId === question.id && answer.topicId === topicId))) topicId = null;
      }
      const scored = selected.map((selection) => {
        const topic = findTopic(selection.topicId);
        const question = topic.questions.find((item) => item.id === selection.questionId);
        fail(!question || question.type !== "mcq", 400, "Only valid multiple-choice questions can be automatically scored.");
        fail(subjectId !== "all" && topic.subjectId !== subjectId, 400, "A question does not belong to the selected subject.");
        const answer = supplied.find((item) => item.questionId === selection.questionId)?.answer || "";
        return { questionId: selection.questionId, topicId: selection.topicId, answer, correct: answer === question.answer };
      });
      const correct = scored.filter((answer) => answer.correct).length;
      const result = { id: id(), subjectId, ...topicId ? { topicId } : {}, score: Math.round(correct / scored.length * 100), correct, total: scored.length, seconds, createdAt: now(), answers: scored };
      const affected = [...new Set(scored.filter((answer) => !answer.correct).map((answer) => answer.topicId))];
      await db.batch([
        // Save result, weak-area schedules, and learning activity atomically.
        db.prepare("INSERT INTO quiz_attempts (id, user_id, quiz_id, subject_id, topic_id, score, correct, total, seconds, created_at, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(result.id, user.id, quizId, subjectId, topicId, result.score, correct, result.total, seconds, result.createdAt, JSON.stringify(scored)),
        // Preserve the complete result and answer history.
        ...affected.map((weakTopicId) => progressStatement(db, user.id, weakTopicId, "Needs Revision", after(864e5))),
        // Schedule a first review for weak lessons.
        activity(db, user.id, topicId, "quiz")
        // Record one genuine assessment event.
      ]);
      for (const affectedTopicId of new Set(scored.map((answer) => answer.topicId))) await refreshMastery(db, user, findTopic(affectedTopicId));
      return json(result, 201);
    }
    if (path === "/api/bookmarks" && request.method === "POST") {
      const input = await body(request);
      const topic = findTopic(text(input.topicId, 200));
      await write(db, "INSERT INTO bookmarks (user_id, topic_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, topic_id) DO NOTHING", user.id, topic.id, now());
      return json({ topicId: topic.id }, 201);
    }
    const bookmarkMatch = path.match(/^\/api\/bookmarks\/([^/]+)$/);
    if (bookmarkMatch && request.method === "DELETE") {
      await write(db, "DELETE FROM bookmarks WHERE user_id = ? AND topic_id = ?", user.id, decodeURIComponent(bookmarkMatch[1]));
      return json({ ok: true });
    }
    if (path === "/api/notes" && request.method === "POST") {
      const input = await body(request);
      const topic = findTopic(text(input.topicId, 200));
      const note = text(input.text, 2e4);
      const updatedAt = now();
      await write(db, "INSERT INTO user_notes (user_id, topic_id, text, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET text = ?, updated_at = ?", user.id, topic.id, note, updatedAt, note, updatedAt);
      return json({ topicId: topic.id, text: note, updatedAt }, 201);
    }
    const noteMatch = path.match(/^\/api\/notes\/([^/]+)$/);
    if (noteMatch && (request.method === "PUT" || request.method === "DELETE")) {
      const topic = findTopic(decodeURIComponent(noteMatch[1]));
      if (request.method === "DELETE") {
        await write(db, "DELETE FROM user_notes WHERE user_id = ? AND topic_id = ?", user.id, topic.id);
        return json({ ok: true });
      }
      const input = await body(request);
      const note = text(input.text, 2e4);
      const updatedAt = now();
      await write(db, "INSERT INTO user_notes (user_id, topic_id, text, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET text = ?, updated_at = ?", user.id, topic.id, note, updatedAt, note, updatedAt);
      return json({ topicId: topic.id, text: note, updatedAt });
    }
    const revisionMatch = path.match(/^\/api\/revision\/([^/]+)\/complete$/);
    if (revisionMatch && request.method === "POST") {
      const topic = findTopic(decodeURIComponent(revisionMatch[1]));
      const previous = await row(db, "SELECT status, review_step, review_at FROM user_topic_progress WHERE user_id = ? AND topic_id = ?", user.id, topic.id);
      fail(previous?.review_at && previous.review_at > now() && previous.status !== "Needs Revision", 409, "This topic has already been reviewed. Its next review is scheduled.", "REVISION_ALREADY_COMPLETE");
      const step = previous ? previous.review_step + 1 : 0;
      const reviewAt = after(intervals[Math.min(step, intervals.length - 1)] * 864e5);
      const status = previous?.status === "Mastered" ? "Mastered" : previous?.status === "Completed" || previous?.status === "Needs Revision" ? "Completed" : "In Progress";
      await db.batch([
        // Preserve the event, next schedule, and daily activity together.
        db.prepare("INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, updated_at = ?, review_step = ?, review_at = ?").bind(user.id, topic.id, status, now(), step, reviewAt, status, now(), step, reviewAt),
        // Upsert the next review schedule for exactly one user/topic pair.
        db.prepare("INSERT INTO revision_history (id, user_id, topic_id, created_at, step) VALUES (?, ?, ?, ?, ?)").bind(id(), user.id, topic.id, now(), step),
        // Retain the completed revision in history.
        activity(db, user.id, topic.id, "revision")
        // Record a real review event for consistency analytics.
      ]);
      return json({ topicId: topic.id, reviewStep: step, reviewAt });
    }
    throw new ApiError(404, "API endpoint not found.", "NOT_FOUND");
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: { message: error.message, code: error.code } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    console.error("API request failed:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: { message: "Something went wrong while saving your work. Please try again.", code: "INTERNAL_ERROR" } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

// server/local.ts
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
function sqliteDatabase(filename = ":memory:") {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const make = (sql, values = []) => ({
    // Defer SQL execution until the statement's read or write method is called.
    sql,
    // Preserve the SQL for transactional batches.
    values,
    // Preserve parameter values separately from SQL text.
    bind(...next) {
      return make(sql, next);
    },
    // Return an immutable bound statement.
    async all() {
      return { results: sqlite.prepare(sql).all(...values) };
    },
    // Return the same collection shape as D1.
    async first() {
      return sqlite.prepare(sql).get(...values) || null;
    },
    // Normalize missing rows to null.
    async run() {
      return sqlite.prepare(sql).run(...values);
    }
    // Execute one parameterized write.
  });
  return {
    // Return a D1-compatible adapter with one extra development migration hook.
    prepare: make,
    // Keep every application query parameterized.
    async batch(statements) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const result = [];
        for (const statement of statements) result.push(sqlite.prepare(statement.sql).run(...statement.values));
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    // Finish the batch implementation.
    migrate(sql) {
      sqlite.exec(sql);
    },
    // Apply schema only at development startup or explicit test setup.
    close() {
      sqlite.close();
    }
    // Allow tests to release their real database handle.
  };
}
async function postgresDatabase() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const sqlFor = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  };
  const make = (sql, values = []) => ({
    // Build one deferred parameterized PostgreSQL statement.
    sql,
    // Preserve the original placeholder form for transactions.
    values,
    // Keep user-supplied values outside SQL text.
    bind(...next) {
      return make(sql, next);
    },
    // Create an immutable bound statement.
    async all() {
      return { results: await prisma.$queryRawUnsafe(sqlFor(sql), ...values) };
    },
    // Use Prisma's parameter binding for reads.
    async first() {
      return (await prisma.$queryRawUnsafe(sqlFor(sql), ...values))[0] || null;
    },
    // Normalize an empty result to null.
    async run() {
      return prisma.$executeRawUnsafe(sqlFor(sql), ...values);
    }
    // The SQL template is authored in the service; arguments remain bound values.
  });
  return {
    // Expose the same interface as D1 and local SQLite.
    prepare: make,
    // Keep database choice outside application logic.
    async batch(statements) {
      return prisma.$transaction(statements.map((statement) => prisma.$executeRawUnsafe(sqlFor(statement.sql), ...statement.values)));
    }
    // Finish PostgreSQL transaction handling.
  };
}
var localEnvironment;
function getLocalEnv() {
  localEnvironment ||= (async () => {
    let db;
    if (process.env.DATABASE_URL) db = await postgresDatabase();
    else {
      mkdirSync(resolve(process.cwd(), "work"), { recursive: true });
      const local = sqliteDatabase(process.env.SQLITE_PATH || resolve(process.cwd(), "work/development.sqlite"));
      const existing = await local.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").first();
      if (!existing) local.migrate(readFileSync(resolve(process.cwd(), "drizzle/0000_initial.sql"), "utf8"));
      db = local;
    }
    return { DB: db, DEVELOPMENT: process.env.NODE_ENV === "production" ? "false" : "true", RESEND_API_KEY: process.env.RESEND_API_KEY, RESET_FROM_EMAIL: process.env.RESET_FROM_EMAIL, APP_ORIGIN: process.env.APP_ORIGIN };
  })();
  return localEnvironment;
}
export {
  getLocalEnv,
  handleApi
};
