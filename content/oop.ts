// Object-oriented programming lessons use concise records that can be independently reviewed and extended.
import type { Topic } from '../shared/types'; // Reuse the application-wide lesson type.
import { makeLessons, withHardQuiz, type LessonSeed, type HardQuizSeed } from './oop-os-helper'; // Expand the authored records into complete lessons and checkpoints.
const reference = 'https://docs.oracle.com/javase/tutorial/java/concepts/'; // Use Oracle's language tutorial for foundational object-oriented concepts.
const designReference = 'https://refactoring.guru/design-patterns'; // Use a detailed independent catalogue for design-pattern comparisons.
const seeds: LessonSeed[] = [ // Keep one self-contained, named record for every required concept.
    { // Introduce the relationship between a class declaration and a runtime instance.
        title: 'Classes and Objects', // Name this core concept.
        module: 'Core Concepts', // Place it at the start of the OOP curriculum.
        definition: 'A class defines a type with state and behavior; an object is a runtime instance with its own identity and instance state.', // Define the concept precisely.
        mechanism: 'Instance fields belong to an object, while static members belong to the class. A constructor establishes valid initial state. Two objects may have equal field values while remaining distinct objects, so identity and value equality must be considered separately.', // Explain ownership, construction, and identity.
        example: 'A BankAccount class declares a balance and deposit(amount). Creating alice = new BankAccount() and bob = new BankAccount() creates two independent balances. Calling alice.deposit(50) should not change bob.balance.', // Supply a concrete, editable example.
        misconception: 'Creating two instances of a class always makes their instance fields share the same storage.', // Provide a topic-specific misconception.
        appliedQuestion: 'Two BankAccount objects start with a zero instance balance. Depositing 50 into the first should produce which balances?', // Test understanding through state changes.
        appliedAnswer: 'The first balance becomes 50 and the second remains zero.', // Identify the correct behavior.
        appliedWrong: 'Both balances become 50 because the class definition is shared.', // Offer a plausible state-sharing error.
        hardQuestion: 'When should a bank account use value equality, and when should identity be compared?', // Ask a realistic interview question.
        hardAnswer: 'Use identity to decide whether two references denote the exact same in-memory account object. Use a carefully defined value or domain identity comparison, usually a stable account identifier, to recognize the same persisted account across separate objects. Comparing mutable balance fields alone is unsafe because unrelated accounts can have identical balances.', // Provide a concise answer with its reasoning.
        followUp: 'What changes if the balance field is declared static?', // Invite a deeper ownership discussion.
        resource: reference, // Link to the independent conceptual reference.
    }, // Finish the classes and objects lesson.
    { // Explain protecting representation behind valid operations.
        title: 'Encapsulation', // Name the concept.
        module: 'Core Concepts', // Group it with the foundational OOP principles.
        definition: 'Encapsulation groups state with its operations and controls access so an object can preserve its invariants.', // Define the principle without equating it with getters alone.
        mechanism: 'A private field prevents arbitrary external writes, but a public setter that accepts every value can still break the invariant. Good APIs expose meaningful operations, validate transitions, and avoid leaking mutable internal collections.', // Explain how invariants are enforced.
        example: 'A Wallet keeps balance private and exposes withdraw(amount), which rejects negative amounts and insufficient funds. Returning a copy or read-only view of its transactions prevents callers from editing internal history.', // Demonstrate effective encapsulation.
        misconception: 'Adding an unrestricted setter for every private field automatically preserves all object invariants.', // Identify a common superficial implementation.
        appliedQuestion: 'A private balance has a setter that accepts negative amounts. What should improve the design?', // Test applied API judgment.
        appliedAnswer: 'Expose validated deposit and withdraw operations and reject invalid transitions.', // State the safe operation-based design.
        appliedWrong: 'Make balance public so every caller can enforce the rules independently.', // Show the representation leak.
        hardQuestion: 'Why can returning a private List directly violate encapsulation?', // Ask about indirect mutation.
        hardAnswer: 'Private access controls the field reference, not the referenced object. A caller can mutate the returned list and bypass validation. Return an immutable snapshot, an unmodifiable view with clearly documented live behavior, or narrowly scoped query methods. Consider whether contained elements are themselves mutable.', // Explain shallow and transitive exposure.
        followUp: 'How does an immutable snapshot differ from an unmodifiable live view?', // Extend the discussion.
        resource: reference, // Provide authoritative background reading.
    }, // Finish the encapsulation lesson.
    { // Explain specialization through a subtype relation.
        title: 'Inheritance', // Name the concept.
        module: 'Core Concepts', // Keep the fundamental mechanisms together.
        definition: 'Inheritance allows a derived type to reuse or specialize a base type while supporting a meaningful is-a relationship.', // Define inheritance and its intent.
        mechanism: 'A subclass inherits accessible behavior and can override designated methods. Constructors and private members follow language-specific rules. Inheritance couples the subclass to the base contract, so composition is often better when the relationship is merely uses-a.', // Explain extension and coupling.
        example: 'A SavingsAccount can extend Account when every supported operation still respects the Account contract. A Car should generally contain an Engine rather than extend Engine, because a car is not an engine.', // Give a suitable and unsuitable relation.
        misconception: 'Inheritance should be used whenever two classes happen to contain similar fields.', // Distinguish reuse from valid subtyping.
        appliedQuestion: 'Should a Car extend Engine merely to reuse start()?', // Ask a concrete modeling question.
        appliedAnswer: 'Usually no; Car should hold an Engine and delegate because the relationship is has-a.', // Recommend composition for the example.
        appliedWrong: 'Yes; any opportunity to reuse one method justifies an is-a relationship.', // Offer the common misuse.
        hardQuestion: 'How can changing a base class silently break an otherwise unchanged subclass?', // Examine fragile base classes.
        hardAnswer: 'A base class can change the order in which overridable methods are called or introduce a new call to an overridable method. The subclass may rely on old call sequences or partially initialized state. Favor stable contracts, avoid calling overridable methods during construction, and use composition when independent evolution matters.', // Explain behavioral coupling.
        followUp: 'What does the Liskov substitution principle require of an override?', // Connect to the advanced principle.
        resource: reference, // Link to the official tutorial.
    }, // Finish the inheritance lesson.
    { // Distinguish common inheritance graph shapes.
        title: 'Types of Inheritance', // Name the taxonomy.
        module: 'Core Concepts', // Group the language fundamentals.
        definition: 'Single, multilevel, hierarchical, multiple, and hybrid inheritance describe the shape of relationships between base and derived types.', // Define the categories.
        mechanism: 'Single inheritance has one direct base; multilevel inheritance forms a chain; hierarchical inheritance has several children of one base. Multiple inheritance has several direct bases and may create ambiguity. Java permits one class superclass but multiple interfaces; C++ supports multiple class inheritance.', // Explain language-specific support.
        example: 'Animal → Mammal → Dog is multilevel. Animal → Dog and Animal → Cat is hierarchical. A C++ class implementing both Printer and Scanner behavior is a multiple-inheritance example when both are class bases.', // Provide distinct graph examples.
        misconception: 'Java classes can directly extend any number of concrete superclass types.', // Address a specific language misconception.
        appliedQuestion: 'Animal has subclasses Dog and Cat. Which inheritance shape is present?', // Test classification.
        appliedAnswer: 'Hierarchical inheritance, because multiple derived types share one base.', // Name the correct shape.
        appliedWrong: 'Multilevel inheritance, because Dog and Cat both exist.', // Contrast sibling and chain structures.
        hardQuestion: 'Why do languages often allow multiple interface inheritance while restricting multiple class inheritance?', // Examine design tradeoffs.
        hardAnswer: 'Interfaces typically separate behavioral contracts from mutable instance representation. Multiple class bases can introduce duplicate base state, conflicting implementations, and complicated initialization. Interfaces reduce these concerns, although default methods can still create implementation conflicts requiring explicit resolution.', // Explain state and ambiguity.
        followUp: 'How does C++ virtual inheritance address duplicate base subobjects?', // Connect the taxonomy to the diamond problem.
        resource: 'https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html', // Link to the language documentation.
    }, // Finish the inheritance taxonomy lesson.
    { // Explain using one contract with different implementations.
        title: 'Polymorphism', // Name the OOP principle.
        module: 'Core Concepts', // Group it with the four core principles.
        definition: 'Polymorphism lets code use a common interface while different concrete values provide type-appropriate behavior.', // Define the abstraction.
        mechanism: 'Subtype polymorphism dispatches overridden operations according to an object’s runtime type. Parametric polymorphism uses type parameters such as List<T>. Overloading is often called ad-hoc polymorphism because the compiler selects among differently typed operations.', // Distinguish important forms.
        example: 'A list of Shape references can contain Circle and Rectangle objects. Calling area() through each Shape reference executes the corresponding implementation without an if-chain over concrete shape types.', // Show interface-based behavior.
        misconception: 'Polymorphism requires checking every concrete object type with an if statement before calling its operation.', // Identify a brittle alternative.
        appliedQuestion: 'How can a drawing program add Triangle without editing a switch over every shape?', // Ask about extensibility.
        appliedAnswer: 'Program against Shape and let Triangle implement the shared drawing operation.', // Use the contract.
        appliedWrong: 'Require every caller to inspect the runtime class and manually choose a drawing formula.', // Show the alternative coupling.
        hardQuestion: 'What is the difference between subtype and parametric polymorphism?', // Ask for conceptual depth.
        hardAnswer: 'Subtype polymorphism chooses behavior through a shared type contract and concrete implementations, such as Shape.area(). Parametric polymorphism writes an algorithm independently of a concrete type, such as List<T>. They can coexist: a generic collection may hold values implementing a common interface.', // Compare the mechanisms.
        followUp: 'Which parts of a generic program still need type constraints?', // Extend into constrained generics.
        resource: 'https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html', // Link to Oracle's polymorphism discussion.
    }, // Finish the polymorphism lesson.
    { // Compare compiler selection with virtual dispatch.
        title: 'Compile-time vs Runtime Polymorphism', // Name the comparison.
        module: 'Core Concepts', // Place it after the broad principle.
        definition: 'Compile-time polymorphism resolves an operation using static type information; runtime subtype polymorphism dispatches an override using the actual object type.', // Define both mechanisms.
        mechanism: 'For overloaded methods, argument types visible to the compiler select the signature. For a selected virtual instance method, runtime dispatch can then choose an override. Java static methods are hidden rather than overridden; C++ requires virtual for dynamic dispatch through a base.', // Explain the two-stage selection.
        example: 'If Animal a = new Dog(), an overloaded visit(Animal) is selected over visit(Dog) when the argument expression is a. Calling a.speak() can still execute Dog.speak() when speak is overridden.', // Demonstrate the difference precisely.
        misconception: 'An overloaded method is always chosen from the runtime type of its arguments.', // Address overload resolution.
        appliedQuestion: 'For Animal a = new Dog(), which visit overload is chosen when visit(Animal) and visit(Dog) both exist?', // Ask a concrete resolution question.
        appliedAnswer: 'visit(Animal), because overload resolution uses the static type of the expression a.', // Explain the compiler decision.
        appliedWrong: 'visit(Dog), because all overloaded calls dynamically inspect argument objects.', // Supply the misconception.
        hardQuestion: 'Can one method call involve both overload resolution and runtime overriding?', // Ask about the combined process.
        hardAnswer: 'Yes. The compiler first chooses an accessible overload using static argument and receiver types. If that selected instance method supports virtual dispatch, runtime lookup chooses the overriding implementation on the receiver object. Dynamic dispatch does not rerun overload selection using argument runtime types.', // Separate signature selection from implementation selection.
        followUp: 'How would static methods change the example in Java?', // Invite the hiding distinction.
        resource: 'https://docs.oracle.com/javase/tutorial/java/IandI/override.html', // Provide an independent reference.
    }, // Finish the dispatch comparison lesson.
    { // Explain exposing essential behavior while hiding detail.
        title: 'Abstraction', // Name the principle.
        module: 'Core Concepts', // Group the fundamental design ideas.
        definition: 'Abstraction presents the essential contract of a concept while hiding implementation details that callers do not need.', // Define what callers depend on.
        mechanism: 'A good abstraction specifies observable behavior, preconditions, postconditions, and meaningful failures. Interfaces and abstract classes can express it, but a poor contract remains leaky even when implemented with an interface keyword.', // Explain semantic contracts.
        example: 'A PaymentGateway exposes charge(amount, token) and a documented result. The application does not depend on the provider’s HTTP retry loop, encryption implementation, or connection pool.', // Use a practical service boundary.
        misconception: 'Using an abstract keyword automatically creates a clear and stable abstraction.', // Separate syntax from design.
        appliedQuestion: 'Which detail should a PaymentGateway caller generally depend on?', // Test boundary selection.
        appliedAnswer: 'The charge contract and documented success or failure result.', // Keep the essential interface.
        appliedWrong: 'The provider’s private connection-pool implementation and retry-loop variables.', // Show accidental implementation coupling.
        hardQuestion: 'How does abstraction differ from encapsulation?', // Ask the frequent interview comparison.
        hardAnswer: 'Abstraction chooses the useful external model and contract; encapsulation controls access to representation and enforces invariants. A collection interface is an abstraction. Keeping its backing array private and validating updates is encapsulation. They reinforce each other but describe different design concerns.', // State both roles and one example.
        followUp: 'Give an example of an abstraction that leaks implementation details.', // Encourage concrete reasoning.
        resource: reference, // Link to the foundational tutorial.
    }, // Finish the abstraction lesson.
    { // Compare interface contracts with shared abstract implementation.
        title: 'Abstract Class vs Interface', // Name the comparison.
        module: 'Core Concepts', // Group the language fundamentals.
        definition: 'An abstract class can share instance state and implementation; an interface primarily defines a role that otherwise unrelated types can implement.', // State the design distinction.
        mechanism: 'Java abstract classes may have constructors, instance fields, and nonpublic methods. Interfaces can include abstract, default, static, and private helper methods in modern Java, but no mutable per-instance fields. A class can implement several interfaces while extending only one class.', // Explain current Java capabilities.
        example: 'AbstractDocument can centralize document state and save logic. Printable is a separate capability implemented by Document and ShippingLabel, even when those classes do not share a useful superclass.', // Demonstrate state versus capability.
        misconception: 'Modern Java interfaces can contain only abstract methods and can never include implementation.', // Correct an outdated claim.
        appliedQuestion: 'Unrelated classes need a common Printable capability but different state models. Which is usually a good fit?', // Test modeling judgment.
        appliedAnswer: 'An interface, because the shared requirement is a role rather than common instance representation.', // Choose a capability contract.
        appliedWrong: 'Force all classes into a shared concrete hierarchy even if their state models conflict.', // Offer unnecessary inheritance.
        hardQuestion: 'When would you prefer an abstract class over an interface?', // Ask about the tradeoff.
        hardAnswer: 'Choose an abstract class when closely related subclasses need shared instance state, construction rules, or a controlled template implementation. Prefer an interface for a public capability implemented by unrelated types or when multiple roles are needed. Consider binary evolution, default-method conflicts, and the cost of consuming the single superclass slot.', // Balance several constraints.
        followUp: 'How are conflicting interface default methods resolved?', // Explore the remaining ambiguity.
        resource: 'https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html', // Link to the language reference.
    }, // Finish the abstract class and interface comparison.
    { // Distinguish method signatures from overridden contracts.
        title: 'Method Overloading vs Overriding', // Name the comparison.
        module: 'Core Concepts', // Group it with dispatch concepts.
        definition: 'Overloading provides methods with the same name and different parameter lists; overriding replaces inherited virtual behavior with a compatible subclass implementation.', // Define each mechanism.
        mechanism: 'Return type alone does not create a Java overload. An override must preserve the inherited signature, may use a covariant return type, and cannot reduce accessibility. Java checked exceptions in an override cannot be broadened beyond the inherited contract.', // Explain important validity rules.
        example: 'print(String) and print(int) are overloads. Dog.speak() implementing Animal.speak() is an override. Writing speak(int volume) in Dog adds an overload rather than overriding speak().', // Give three unambiguous examples.
        misconception: 'Changing only a Java method’s return type creates a valid overload.', // Address a frequent compiler error.
        appliedQuestion: 'Animal declares speak(). Dog adds speak(int volume). What did Dog add?', // Test signature reasoning.
        appliedAnswer: 'An overload, because the parameter list differs from speak().', // Identify the new signature.
        appliedWrong: 'An override, because any subclass method with the same name overrides its parent.', // Offer name-only reasoning.
        hardQuestion: 'Why should an override not reduce visibility or strengthen caller preconditions?', // Ask about substitutability.
        hardAnswer: 'Callers written against the base contract must remain valid when the object is replaced by a subtype. Reduced visibility breaks accessible calls at the type boundary, while stronger preconditions reject inputs promised by the base. Language rules enforce some structural constraints; behavioral substitutability still needs design and tests.', // Connect compiler rules and behavioral contracts.
        followUp: 'What is a covariant return type?', // Extend the signature discussion.
        resource: 'https://docs.oracle.com/javase/tutorial/java/IandI/override.html', // Link to overriding documentation.
    }, // Finish the overloading and overriding lesson.
    { // Explain access boundaries in Java.
        title: 'Access Modifiers', // Name the language feature.
        module: 'Core Concepts', // Group basic representation controls.
        definition: 'Access modifiers define which callers may reference a declaration; Java provides public, protected, package-private, and private member access.', // Enumerate the visibility levels.
        mechanism: 'Public exposes an API broadly; package-private omits a keyword and restricts access to the package; private limits access to the declaring top-level nest. Protected adds subclass access with cross-package restrictions. Visibility does not make mutable objects thread-safe.', // Explain the rules and their limits.
        example: 'Keep a class’s mutable cache private, expose a public lookup method, and leave a helper used only by sibling package classes package-private. A public getter should still avoid exposing a mutable cache map.', // Show deliberate API boundaries.
        misconception: 'A private field automatically becomes safe for concurrent mutation by multiple threads.', // Separate access control and synchronization.
        appliedQuestion: 'A helper should be used only by classes in the same Java package. Which access level fits?', // Test the appropriate visibility.
        appliedAnswer: 'Package-private access, declared by omitting an access modifier.', // Choose the least required visibility.
        appliedWrong: 'Public access, because all helpers must be accessible from every package.', // Offer unnecessary exposure.
        hardQuestion: 'Why should public API surface generally be kept small?', // Ask about maintainability.
        hardAnswer: 'External callers can depend on each public contract, so changing or removing it becomes a compatibility concern. A smaller surface preserves freedom to change representation, centralizes invariant checks, and reduces accidental coupling. Public visibility is a design commitment, not a shortcut for making a compiler error disappear.', // Explain practical consequences.
        followUp: 'How does protected access differ inside and outside the declaring package?', // Probe a precise edge case.
        resource: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html', // Link to official access-control guidance.
    }, // Finish the access modifiers lesson.
    { // Compare compile-time and runtime method target binding.
        title: 'Static vs Dynamic Binding', // Name the comparison.
        module: 'Core Concepts', // Connect binding with earlier dispatch lessons.
        definition: 'Static binding resolves a target without runtime subtype dispatch, while dynamic binding chooses an overriding implementation from the receiver’s runtime type.', // Define the mechanisms.
        mechanism: 'Java instance methods normally dispatch virtually unless excluded by the language rules; static methods are selected by the reference type and are hidden rather than overridden. In C++, nonvirtual calls bind statically, while virtual calls through a base can dispatch dynamically.', // Keep language differences explicit.
        example: 'Base b = new Derived(); b.virtualOperation() can invoke Derived’s override. A Java static Base.label() selected through a Base-typed expression remains Base.label(), which is why static methods should be called with the class name.', // Contrast the two behaviors.
        misconception: 'Declaring a method static enables runtime overriding through subclass instances.', // Correct the terminology.
        appliedQuestion: 'A C++ base pointer refers to a Derived object, but show() is not virtual. Which method is selected by ptr->show()?', // Ask a precise C++ question.
        appliedAnswer: 'The base implementation selected from the pointer’s static type.', // Apply the nonvirtual rule.
        appliedWrong: 'The derived implementation merely because the object was allocated as Derived.', // Offer runtime-type-only reasoning.
        hardQuestion: 'Does virtual dispatch always imply an actual indirect call at runtime?', // Ask an optimization-aware question.
        hardAnswer: 'No. The language defines observable dispatch behavior, but a compiler may devirtualize a call when it can prove the concrete target and preserve semantics. Final classes, whole-program analysis, and runtime profiling can help. Optimization does not change which implementation the program is required to behave as if it invoked.', // Distinguish semantics and optimization.
        followUp: 'Why does marking a class final sometimes help optimization?', // Extend the proof discussion.
        resource: 'https://en.cppreference.com/w/cpp/language/virtual.html', // Link to a well-established language reference.
    }, // Finish the binding lesson.
    { // Explain aliasing in copied object graphs.
        title: 'Deep Copy vs Shallow Copy', // Name the comparison.
        module: 'Core Concepts', // Group the state and identity concepts.
        definition: 'A shallow copy duplicates the outer object but shares referenced nested objects; a deep copy recursively duplicates the relevant mutable object graph.', // Define both strategies.
        mechanism: 'Copy depth must follow ownership semantics. Deep copying must handle shared subgraphs and cycles, often with an identity map. Immutable values can usually be shared. External resources such as sockets do not have a generally meaningful automatic deep copy.', // Explain graph and resource limits.
        example: 'Copying a Person with an Address reference shallowly means both people reference the same Address. Updating the copied address changes the original view. A deep copy creates a distinct Address while safely sharing immutable strings.', // Demonstrate aliasing.
        misconception: 'A shallow copy recursively creates independent versions of every nested mutable object.', // Identify the false assumption.
        appliedQuestion: 'After a shallow copy of Person, changing copy.address.city also changes original.address.city. Why?', // Ask about the observed effect.
        appliedAnswer: 'Both Person objects share the same nested Address reference.', // Identify aliasing.
        appliedWrong: 'The copy operation independently duplicated Address and then synchronized the two cities.', // Offer an implausible copying model.
        hardQuestion: 'How can a deep-copy algorithm correctly handle a cyclic graph?', // Ask an implementation question.
        hardAnswer: 'Maintain a map from original object identities to their allocated copies. Allocate and register a copy before recursively copying its outgoing references. Reuse a registered copy when revisiting an object. This terminates cycles and preserves intentional sharing inside the copied graph.', // Describe the correct traversal.
        followUp: 'When should an immutable nested object be shared rather than copied?', // Connect copy policy to immutability.
        resource: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#clone()', // Link to the clone contract.
    }, // Finish the copying lesson.
    { // Introduce the five complementary design principles.
        title: 'SOLID Principles', // Name the principle collection.
        module: 'Advanced Concepts', // Begin the advanced design section.
        definition: 'SOLID groups five object-oriented design principles for managing change: single responsibility, open-closed, Liskov substitution, interface segregation, and dependency inversion.', // Expand the acronym accurately.
        mechanism: 'The principles address different sources of coupling. SRP groups code by reason to change; OCP supports extension; LSP preserves subtype contracts; ISP keeps client dependencies narrow; DIP points high-level policies toward abstractions. They are design heuristics and must be balanced against simplicity.', // Explain the role of each principle.
        example: 'An order service depends on a Payment interface, keeps tax calculations separate from email delivery, and accepts new gateway implementations without changing order policy. Its gateway implementations honor the same error and charge semantics.', // Show several principles working together.
        misconception: 'SOLID requires creating an interface and a class hierarchy for every function, even when no useful variation exists.', // Warn against mechanical abstraction.
        appliedQuestion: 'A report generator mixes formatting, database queries, and email delivery. Which SOLID concern is most immediately visible?', // Ask about a concrete design smell.
        appliedAnswer: 'Single responsibility: these concerns change for different reasons and can be separated.', // Identify the strongest match.
        appliedWrong: 'Liskov substitution is necessarily broken even though no subtype contract exists.', // Avoid applying the wrong principle.
        hardQuestion: 'Can applying SOLID too aggressively make a small program worse?', // Ask for engineering judgment.
        hardAnswer: 'Yes. Speculative interfaces, indirection, and hierarchies add navigation and maintenance costs. Apply a principle when it resolves an observed change boundary, testability need, or contract problem. Prefer a simple design until variation or coupling justifies a new boundary, and evaluate the resulting design rather than counting interfaces.', // Describe a balanced approach.
        followUp: 'Which recurring change in your project would justify extracting an interface?', // Ask for a practical example.
        resource: 'https://web.archive.org/web/20241109020017/http://www.objectmentor.com/resources/articles/Principles_and_Patterns.pdf', // Provide the original principle discussion through an archive.
    }, // Finish the SOLID overview.
    { // Explain grouping behavior by its reason to change.
        title: 'Single Responsibility Principle', // Name SRP explicitly.
        module: 'Advanced Concepts', // Group the SOLID principles together.
        definition: 'The single responsibility principle says a module should have one reason to change, meaning responsibility to one coherent actor or policy area.', // Define the principle beyond function size.
        mechanism: 'Responsibility is about change sources rather than the number of methods. Keep behavior that changes together cohesive and separate policies that evolve independently. Splitting every method into a new class can reduce cohesion rather than improve it.', // Explain a useful boundary.
        example: 'A PayslipCalculator computes payroll rules, a PayslipRepository persists records, and a PayslipPrinter formats output. A layout change should not risk altering payroll calculations.', // Give a familiar separation.
        misconception: 'Single responsibility means every class must contain exactly one method.', // Correct the common slogan.
        appliedQuestion: 'Payroll legislation and PDF branding change independently. Should their implementations share one tightly coupled class?', // Ask about reasons to change.
        appliedAnswer: 'Separate payroll policy from PDF presentation so each change has a focused boundary.', // Apply SRP.
        appliedWrong: 'Keep them inseparable because both features mention payslips.', // Offer grouping by noun alone.
        hardQuestion: 'How do you identify a reason to change before splitting a class?', // Ask how to apply SRP.
        hardAnswer: 'Look at actors requesting changes, existing change history, domain boundaries, and whether edits repeatedly affect unrelated methods. Separate independently evolving policies while retaining cohesive data and behavior. A small class is not automatically single-responsibility, and a larger class can be cohesive.', // Ground the judgment in evidence.
        followUp: 'What costs can excessive class splitting introduce?', // Encourage balanced design.
        resource: 'https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html', // Link to the principle author's explanation.
    }, // Finish the SRP lesson.
    { // Explain extension at stable variation points.
        title: 'Open-Closed Principle', // Name OCP.
        module: 'Advanced Concepts', // Group the SOLID principles together.
        definition: 'The open-closed principle favors extending behavior through stable variation points rather than repeatedly modifying established policy code.', // State the principle in practical language.
        mechanism: 'Interfaces, composition, strategies, and data-driven rules can isolate expected variation. No design can be closed against every possible change. Choose a boundary based on credible extension needs and keep fixes and contract evolution possible.', // Explain scope and mechanisms.
        example: 'A shipping calculator consumes a ShippingStrategy. Adding a bicycle courier strategy extends available delivery pricing without editing the checkout workflow’s decision tree.', // Demonstrate a variation point.
        misconception: 'Open-closed means existing source code must never be edited, even to repair a defect.', // Correct an absolute interpretation.
        appliedQuestion: 'New shipping methods repeatedly add branches to checkout(). What would improve extension?', // Ask about a concrete trigger.
        appliedAnswer: 'Move shipping-specific pricing behind a strategy contract used by checkout.', // Isolate the variation.
        appliedWrong: 'Add another shipping-specific branch to every caller whenever a method is added.', // Show repeated policy edits.
        hardQuestion: 'How do you avoid overengineering while applying the open-closed principle?', // Ask about the tradeoff.
        hardAnswer: 'Identify the axis that already varies, such as payment providers, and introduce a stable contract only there. Keep uncommon or speculative variations direct until evidence appears. Measure whether adding an implementation can be localized without weakening type contracts or spreading conditionals.', // State the evidence-based approach.
        followUp: 'When is a data table simpler than a class hierarchy?', // Explore alternative extension mechanisms.
        resource: 'https://refactoring.guru/design-patterns/strategy', // Link to a concrete implementation pattern.
    }, // Finish the OCP lesson.
    { // Explain behavioral subtype compatibility.
        title: 'Liskov Substitution Principle', // Name LSP.
        module: 'Advanced Concepts', // Keep the SOLID principles adjacent.
        definition: 'The Liskov substitution principle requires a subtype to preserve the observable promises of its base contract when used through that contract.', // Define behavioral substitutability.
        mechanism: 'A subtype must not demand stronger preconditions or provide weaker postconditions. It must preserve invariants and relevant history constraints. Matching method signatures is necessary for many languages but not sufficient for behavioral substitution.', // Explain contract dimensions.
        example: 'If a base collection contract promises add() succeeds for valid items, a ReadOnlyCollection subtype that throws for every add() violates that writable contract. Prefer a separate read-only interface rather than pretending unsupported mutation works.', // Give a precise contract failure.
        misconception: 'Any subclass accepted by the compiler automatically satisfies behavioral substitutability.', // Separate type checking and semantics.
        appliedQuestion: 'A base method accepts every nonnegative amount, but an override rejects amounts below 100. What changed?', // Test contract reasoning.
        appliedAnswer: 'The override strengthened the precondition and can break callers relying on the base contract.', // Identify the violation.
        appliedWrong: 'The override necessarily improves substitutability because it validates more strictly.', // Offer the validation misconception.
        hardQuestion: 'Why can a mutable Square subtype of mutable Rectangle violate LSP?', // Ask the canonical scenario carefully.
        hardAnswer: 'If Rectangle promises independently settable width and height, a Square override that forces both dimensions to change breaks that promise. A client setting width to 5 while expecting height to remain 4 can no longer reason from the Rectangle contract. Immutable shapes or interfaces exposing only area can avoid this particular conflict.', // Explain the required base promise and alternative.
        followUp: 'Would immutable Square and Rectangle types have the same setter problem?', // Explore the role of mutability.
        resource: 'https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf', // Link to the formal behavioral-subtyping paper.
    }, // Finish the LSP lesson.
    { // Explain small contracts shaped by their clients.
        title: 'Interface Segregation Principle', // Name ISP.
        module: 'Advanced Concepts', // Group related principles.
        definition: 'The interface segregation principle says clients should not depend on operations they do not use.', // Define the principle.
        mechanism: 'Split broad interfaces into cohesive roles based on client needs. Implementations can support several roles, while each caller depends only on the capability it requires. This avoids meaningless methods and reduces the impact of unrelated interface changes.', // Describe the client-focused boundary.
        example: 'Separate Printer.print(), Scanner.scan(), and Fax.send(). A basic printer implements Printer without throwing UnsupportedOperationException from scan() and fax methods it never supported.', // Demonstrate role interfaces.
        misconception: 'Every device must implement one giant interface containing every operation any device might support.', // Show the broad-contract problem.
        appliedQuestion: 'A simple printer is forced to implement scan() by throwing an exception. What design is preferable?', // Ask about the contract smell.
        appliedAnswer: 'Separate printing and scanning interfaces and depend on only the required role.', // Apply ISP.
        appliedWrong: 'Require callers to catch unsupported-operation errors from every interface method.', // Offer runtime detection of poor contracts.
        hardQuestion: 'How is interface segregation different from simply making every interface tiny?', // Ask for nuance.
        hardAnswer: 'Segregation follows coherent client roles rather than an arbitrary method limit. Two methods that clients consistently need together may belong in one interface. Excessive fragmentation can force callers to coordinate many pieces and obscure invariants, so cohesion and actual dependency patterns guide the split.', // Explain the practical criterion.
        followUp: 'Can a class implement several role interfaces without violating SRP?', // Connect role and responsibility concepts.
        resource: 'https://refactoring.guru/design-patterns/adapter', // Link to a relevant independent interface example.
    }, // Finish the ISP lesson.
    { // Explain policy depending on abstractions rather than mechanisms.
        title: 'Dependency Inversion Principle', // Name DIP.
        module: 'Advanced Concepts', // Complete the SOLID group.
        definition: 'Dependency inversion makes high-level policy and low-level details depend on abstractions rather than making policy depend directly on concrete mechanisms.', // Define dependency direction.
        mechanism: 'The policy-facing interface expresses what the high-level module needs. A low-level adapter implements that contract. Dependency injection supplies a chosen implementation, but injection alone does not guarantee that a suitable abstraction or dependency direction exists.', // Distinguish inversion and injection.
        example: 'OrderService accepts an OrderStore contract. A PostgreSQLOrderStore implements it, while tests inject an in-memory store. OrderService contains order policy without importing database-client classes.', // Show policy and adapter boundaries.
        misconception: 'Passing a concrete database client through a constructor automatically guarantees dependency inversion.', // Correct injection-only thinking.
        appliedQuestion: 'OrderService imports a vendor database driver and calls vendor-specific methods. How can policy be decoupled?', // Ask about a concrete dependency.
        appliedAnswer: 'Define an OrderStore contract around policy needs and implement the vendor calls in an adapter.', // Apply inversion.
        appliedWrong: 'Spread driver calls across more business classes so every class shares the dependency.', // Show increased coupling.
        hardQuestion: 'What is the difference between dependency injection and dependency inversion?', // Ask the frequent comparison.
        hardAnswer: 'Injection is a construction technique: dependencies are supplied from outside rather than created internally. Inversion is an architectural principle about source dependencies pointing toward abstractions and policy. You can inject a concrete low-level class without inverting the dependency, or invert a dependency using factories and other assembly mechanisms.', // Separate mechanism and principle.
        followUp: 'Which module should own an interface that expresses business policy needs?', // Extend the architectural discussion.
        resource: 'https://martinfowler.com/articles/injection.html', // Link to a detailed independent explanation.
    }, // Finish the DIP lesson.
    { // Explain repeated-base ambiguity in multiple inheritance.
        title: 'Diamond Problem', // Name the inheritance edge case.
        module: 'Advanced Concepts', // Group advanced language mechanisms.
        definition: 'The diamond problem occurs when two inheritance paths reach a common base, potentially duplicating its state or making member selection ambiguous.', // Define the graph problem.
        mechanism: 'In C++, ordinary inheritance can create two Base subobjects through Left and Right. Virtual inheritance makes the common virtual base shared and the most-derived class initializes it. Java default-method conflicts require explicit resolution when neither inherited implementation is more specific.', // Explain both languages accurately.
        example: 'TeachingAssistant inherits Student and Employee, both derived from Person. Without virtual inheritance in C++, the assistant may hold two separate Person subobjects and ambiguous Person fields.', // Give the diamond graph.
        misconception: 'Multiple inheritance always produces exactly one shared copy of every common base automatically.', // Identify the unsafe assumption.
        appliedQuestion: 'In C++, Left and Right both inherit Base normally, and Final inherits both. How many Base subobjects are normally present?', // Ask about duplicated representation.
        appliedAnswer: 'Two Base subobjects, one through each nonvirtual inheritance path.', // State the usual layout semantics.
        appliedWrong: 'Exactly one, because C++ always merges duplicate base classes.', // Offer automatic-merging confusion.
        hardQuestion: 'Does virtual inheritance solve every ambiguity in a diamond hierarchy?', // Ask for the remaining tradeoff.
        hardAnswer: 'No. It shares the virtual base subobject, addressing duplicate base representation. Conflicting overrides or names can still require an explicit final override or qualified access, and construction becomes more complex because the most-derived class initializes virtual bases. Composition may express the domain more clearly.', // Distinguish state duplication and behavior ambiguity.
        followUp: 'Who initializes a C++ virtual base in a multilevel diamond?', // Probe construction ownership.
        resource: 'https://en.cppreference.com/w/cpp/language/derived_class.html', // Link to the C++ inheritance reference.
        diagram: ['Person', '↙ Student    Employee ↘', 'TeachingAssistant reaches Person by two paths'], // Show the repeated-base shape compactly.
    }, // Finish the diamond lesson.
    { // Explain one common implementation of dynamic dispatch.
        title: 'Virtual Functions and Vtables', // Name the implementation concept.
        module: 'Advanced Concepts', // Group advanced dispatch internals.
        definition: 'Virtual functions support dynamic dispatch; many C++ implementations use per-class virtual tables and per-object virtual pointers to select overrides.', // Define the mechanism without promising a mandated layout.
        mechanism: 'A virtual call commonly loads a function pointer through a vtable slot. The C++ standard specifies behavior rather than requiring this representation. Multiple inheritance can need pointer adjustments, and deleting a derived object through a base pointer requires an appropriate virtual destructor.', // Explain implementation and lifetime details.
        example: 'Shape* s = new Circle(); s->area() dispatches to Circle::area() when Shape::area is virtual. If ownership deletes through Shape*, declare virtual ~Shape() so the full derived destruction chain is valid.', // Provide a practical lifetime example.
        misconception: 'The C++ standard requires every object, including objects with no virtual methods, to contain exactly one vtable pointer.', // Correct overgeneralized layout claims.
        appliedQuestion: 'A derived object will be deleted through a C++ base pointer. What should its polymorphic base normally declare?', // Test lifetime safety.
        appliedAnswer: 'A virtual destructor so deletion invokes the correct derived destruction behavior.', // State the necessary design.
        appliedWrong: 'Only a nonvirtual destructor, because virtual methods already make deletion universally safe.', // Offer a common lifetime mistake.
        hardQuestion: 'Why should virtual dispatch from a constructor not be used to invoke fully derived behavior?', // Ask about object construction.
        hardAnswer: 'During C++ base construction, the derived portion has not been initialized, and virtual dispatch resolves within the currently constructing class rather than a not-yet-constructed derived class. Other languages differ in dispatch semantics but still risk observing uninitialized derived state. Constructors should establish their own invariants without relying on overridable behavior.', // Explain language-specific behavior and general risk.
        followUp: 'When can a compiler devirtualize a virtual call?', // Connect optimization knowledge.
        resource: 'https://en.cppreference.com/w/cpp/language/virtual.html', // Link to the language reference.
    }, // Finish the vtable lesson.
    { // Compare three strengths of object relationships.
        title: 'Association vs Aggregation vs Composition', // Name the comparison.
        module: 'Advanced Concepts', // Group object-modeling relationships.
        definition: 'Association is a general relationship, aggregation is a weak whole-part relationship, and composition represents stronger ownership with a part’s lifetime tied to its whole.', // Define the modeling distinction.
        mechanism: 'These are domain and lifecycle semantics rather than automatic consequences of a field declaration. Aggregated parts can exist independently or be shared. Composed parts are conceptually owned by one whole, although a language may enforce or merely document that ownership.', // Explain semantics and enforcement.
        example: 'A Teacher associated with Student does not own the student. A Team aggregates Players who can leave and join another team. An Order composes OrderLines that have no independent domain lifecycle outside that order.', // Provide distinct examples.
        misconception: 'Any class field referencing another object automatically proves composition and exclusive ownership.', // Correct syntax-only classification.
        appliedQuestion: 'Players continue to exist after their Team is dissolved. Which whole-part relationship best fits?', // Test lifetime reasoning.
        appliedAnswer: 'Aggregation, because the parts have an independent lifecycle.', // Choose weak ownership.
        appliedWrong: 'Composition, because dissolving a team must destroy every player.', // Offer a mismatched domain model.
        hardQuestion: 'How can implementation choices enforce composition rather than merely document it?', // Ask about ownership implementation.
        hardAnswer: 'Control construction and exposure of the part, prevent independent reassignment or sharing when the domain forbids it, and tie persistence or cleanup to the aggregate root. Unique ownership types can enforce some constraints in languages such as C++. Garbage collection alone handles memory reachability and does not establish domain ownership.', // Explain API, persistence, and memory distinctions.
        followUp: 'How does domain lifetime differ from garbage-collection lifetime?', // Invite an important follow-up.
        resource: 'https://www.uml-diagrams.org/association.html', // Link to a UML relationship reference.
    }, // Finish the object-relationship lesson.
    { // Introduce patterns as named reusable design approaches.
        title: 'Design Patterns', // Name the pattern overview.
        module: 'Advanced Concepts', // Place it before specific patterns.
        definition: 'A design pattern is a named, reusable approach to a recurring design problem, with a context, structure, and tradeoffs rather than a copy-paste implementation.', // Define patterns accurately.
        mechanism: 'Creational patterns manage object construction, structural patterns compose interfaces and objects, and behavioral patterns organize communication and algorithms. Choose a pattern from the problem and constraints; applying more patterns does not necessarily improve a design.', // Explain the catalogue and decision process.
        example: 'Use Strategy when pricing algorithms must vary independently, Adapter when integrating an incompatible provider interface, and Observer when several consumers respond to changes. Each addresses a different source of variation.', // Relate patterns to concrete needs.
        misconception: 'A codebase is better simply because it uses the largest possible number of named patterns.', // Warn against pattern-driven complexity.
        appliedQuestion: 'A third-party API exposes an incompatible method signature, but existing callers should keep their own interface. Which pattern fits?', // Ask a concrete selection question.
        appliedAnswer: 'Adapter, because it translates between the existing and external interfaces.', // Match problem and pattern.
        appliedWrong: 'Singleton, because interface mismatch is solved by allowing only one provider object.', // Contrast an unrelated pattern.
        hardQuestion: 'What should be documented when introducing a design pattern?', // Ask about maintainable design.
        hardAnswer: 'Document the concrete problem, the variation or coupling it addresses, the participating roles, and the costs introduced. Explain why a simpler direct implementation is insufficient. Pattern names help communication, but their domain-specific intent and lifecycle behavior remain essential.', // Explain reviewable rationale.
        followUp: 'What evidence would justify removing a pattern later?', // Encourage evolution rather than dogma.
        resource: designReference, // Link to the pattern catalogue.
    }, // Finish the pattern overview.
    { // Explain controlled single-instance access and its costs.
        title: 'Singleton', // Name the creational pattern.
        module: 'Design Patterns', // Group the individual patterns.
        definition: 'Singleton restricts a class to one instance within a defined scope and provides access to that instance.', // Specify that the scope matters.
        mechanism: 'Initialization must be safe under concurrency. Lazy initialization needs language-appropriate synchronization; Java class initialization or an enum can provide safe construction. A singleton is still shared mutable state and does not automatically make its methods thread-safe.', // Explain construction and state risks.
        example: 'A process-wide immutable configuration snapshot can be shared safely. A mutable singleton shopping cart would incorrectly mix unrelated users and make tests depend on global state.', // Show a reasonable and harmful use.
        misconception: 'A singleton automatically makes every field and method thread-safe and creates one instance across all machines.', // Correct concurrency and distributed-scope claims.
        appliedQuestion: 'Should a web application store every user’s current cart in one mutable Singleton cart?', // Test user-state isolation.
        appliedAnswer: 'No; carts must be scoped by user or session rather than one shared global cart.', // Explain the ownership boundary.
        appliedWrong: 'Yes; a single global instance automatically isolates concurrent users.', // Offer the global-state mistake.
        hardQuestion: 'Why is singleton often harder to test than an injected dependency?', // Ask about hidden coupling.
        hardAnswer: 'Callers obtain a hidden global dependency, tests may share mutable state across runs, and replacement can require special reset hooks. Injecting a narrow interface makes ownership and lifetime explicit and permits independent test doubles. If one instance is required, the application’s composition root can still manage a singleton lifetime without hardwiring global access.', // Distinguish lifetime from access pattern.
        followUp: 'Does one singleton per process guarantee uniqueness across a distributed deployment?', // Highlight scope.
        resource: 'https://refactoring.guru/design-patterns/singleton', // Link to pattern details.
    }, // Finish the singleton lesson.
    { // Explain moving construction decisions behind a boundary.
        title: 'Factory', // Name the creational pattern.
        module: 'Design Patterns', // Group individual patterns.
        definition: 'A factory centralizes object creation behind a method or object so callers depend on a product contract rather than construction details.', // Define the broad factory idea.
        mechanism: 'A simple factory selects products with explicit logic. Factory Method lets subclasses customize a creation operation, while Abstract Factory creates related product families. These variations have different structures and should not be treated as identical.', // Distinguish related pattern names.
        example: 'PaymentGatewayFactory.create("card") returns a PaymentGateway implementation. Checkout consumes charge() without knowing the provider’s constructor arguments, credential wiring, or connection setup.', // Give a construction boundary.
        misconception: 'Every function returning an object is necessarily the GoF Factory Method pattern with subclass-based creation.', // Avoid collapsing all factories into one form.
        appliedQuestion: 'Several callers repeat provider-specific constructor setup. Where should that setup move?', // Test centralization.
        appliedAnswer: 'Into a factory or composition boundary that returns the common product interface.', // Isolate construction.
        appliedWrong: 'Into duplicated constructor branches inside every business method.', // Show the duplication problem.
        hardQuestion: 'How do Factory Method and Abstract Factory differ?', // Ask a precise pattern comparison.
        hardAnswer: 'Factory Method provides an overridable creation operation, often in a creator superclass, for a product. Abstract Factory supplies an object exposing creation operations for a compatible family of products. The former varies one construction hook through inheritance; the latter groups related creation through a factory interface and composition.', // Explain structure and purpose.
        followUp: 'When is a plain constructor simpler and sufficient?', // Encourage proportional design.
        resource: 'https://refactoring.guru/design-patterns/factory-method', // Link to the specific pattern explanation.
    }, // Finish the factory lesson.
    { // Explain subscription-based change notification.
        title: 'Observer', // Name the behavioral pattern.
        module: 'Design Patterns', // Group individual patterns.
        definition: 'Observer defines a subscription relationship in which a publisher notifies registered subscribers about events or state changes.', // Define the communication model.
        mechanism: 'Subscribers register and unregister through a clear lifecycle. Notifications may push event data or ask subscribers to read state. Ordering, reentrancy, exception handling, and synchronous versus asynchronous delivery must be specified; the pattern alone guarantees none of them.', // Explain operational details.
        example: 'An order publisher emits OrderPlaced. Email and inventory subscribers react independently. A short-lived UI component should unsubscribe when disposed so a long-lived publisher does not retain it unnecessarily.', // Give service and lifecycle examples.
        misconception: 'Observer guarantees delivery order, exactly-once processing, and automatic cleanup for every subscriber.', // Correct unsupported guarantees.
        appliedQuestion: 'A closed UI component remains referenced by a long-lived publisher. What subscription practice helps?', // Test lifecycle awareness.
        appliedAnswer: 'Unsubscribe or dispose the listener when the component’s lifecycle ends.', // Release the reference.
        appliedWrong: 'Add more listeners each time the component opens and never remove them.', // Show the leak pattern.
        hardQuestion: 'What failure modes should be considered in a synchronous observer implementation?', // Ask for engineering depth.
        hardAnswer: 'A slow subscriber blocks publication, an exception may prevent later notifications unless isolated, reentrant callbacks can mutate the subscription collection, and subscribers may observe partially updated state. Define snapshot iteration, exception policy, event timing, and lifecycle cleanup. Use asynchronous delivery only with explicit ordering and consistency expectations.', // Explain concrete failure modes.
        followUp: 'How would asynchronous notifications change consistency and error handling?', // Extend to distributed events.
        resource: 'https://refactoring.guru/design-patterns/observer', // Link to pattern details.
    }, // Finish the observer lesson.
    { // Explain interchangeable algorithms through composition.
        title: 'Strategy', // Name the behavioral pattern.
        module: 'Design Patterns', // Group individual patterns.
        definition: 'Strategy encapsulates interchangeable algorithms behind a shared contract and lets a context delegate to a selected implementation.', // Define the pattern.
        mechanism: 'The context owns policy-independent workflow and delegates the variable step. Strategies can be objects or functions, can be injected, and may be chosen at construction or runtime. The shared contract must specify inputs, outputs, and side effects consistently.', // Explain structure and compatibility.
        example: 'Checkout delegates shipping price to StandardShipping or ExpressShipping. Both accept the same package data and return a price in the same currency and units, so the checkout workflow stays unchanged.', // Give a complete use case.
        misconception: 'Strategy requires the context to copy every algorithm into its own growing conditional statement.', // Contrast delegation and branching.
        appliedQuestion: 'Pricing algorithms change independently from checkout flow. Which design best isolates that variation?', // Ask for application.
        appliedAnswer: 'Inject a pricing strategy and delegate the calculation through a stable contract.', // Apply composition.
        appliedWrong: 'Duplicate checkout flow once for every pricing algorithm.', // Offer coupled variants.
        hardQuestion: 'How is Strategy different from State when both use delegated objects?', // Ask a structural lookalike comparison.
        hardAnswer: 'Strategy selects among interchangeable ways to perform a task; the choice usually represents an external policy or configuration. State represents behavior that changes with the context’s internal lifecycle, often including transitions between states. Their object structure can resemble each other, but intent and transition ownership differ.', // Explain intent rather than syntax.
        followUp: 'When can a function replace a dedicated strategy class?', // Discuss simpler representations.
        resource: 'https://refactoring.guru/design-patterns/strategy', // Link to pattern details.
    }, // Finish the strategy lesson.
    { // Explain extending behavior by wrapping the same interface.
        title: 'Decorator', // Name the structural pattern.
        module: 'Design Patterns', // Group individual patterns.
        definition: 'Decorator adds behavior by wrapping an object while preserving the same client-facing contract, allowing wrappers to be composed.', // Define the pattern.
        mechanism: 'A decorator implements the component interface and delegates to a wrapped component before or after adding behavior. Wrapper order can affect results. Preserve observable contracts and consider lifecycle propagation, identity, and error handling across the chain.', // Explain composition and caveats.
        example: 'An OutputStream can be wrapped with buffering and then compression. Callers still write bytes through the stream interface, while the wrappers add distinct behavior without a subclass for every feature combination.', // Give a real library example.
        misconception: 'Decorator’s main purpose is to translate an incompatible interface into an unrelated client interface.', // Distinguish it from Adapter.
        appliedQuestion: 'You need optional logging and retry behavior around one service without a subclass for each combination. What fits?', // Ask about combinations.
        appliedAnswer: 'Composable decorators that implement the same service contract and wrap one another.', // Use wrapping.
        appliedWrong: 'One inheritance class for every possible combination of all optional features.', // Show combinatorial inheritance.
        hardQuestion: 'Why can decorator order change behavior even when the interface remains the same?', // Ask about semantics.
        hardAnswer: 'Each wrapper changes the sequence of operations around the inner call. Logging outside retry may record one logical request, while logging inside retry may record every physical attempt. Caching outside authorization can be dangerous unless cache keys and access rules preserve the contract. Document ordering and test the intended chain.', // Explain with concrete chains.
        followUp: 'How should close() or dispose() propagate through a wrapper chain?', // Explore lifecycle.
        resource: 'https://refactoring.guru/design-patterns/decorator', // Link to pattern details.
    }, // Finish the decorator lesson.
    { // Explain translating incompatible external interfaces.
        title: 'Adapter', // Name the structural pattern.
        module: 'Design Patterns', // Complete the required pattern group.
        definition: 'Adapter translates an existing interface into the contract a client expects so otherwise incompatible components can work together.', // Define the pattern.
        mechanism: 'An object adapter wraps the existing component and converts arguments, results, and errors. Translation must preserve units and behavioral promises, not merely rename methods. Class adapters use inheritance where language rules permit it.', // Explain semantic translation.
        example: 'Your app expects charge(cents): Receipt, while a provider exposes makePayment(decimalDollars): VendorResult. A provider adapter converts cents to dollars, maps errors, and produces the application Receipt type.', // Give a unit-sensitive example.
        misconception: 'An adapter only needs to rename methods and may ignore incompatible units, errors, or side effects.', // Correct shallow adaptation.
        appliedQuestion: 'Your internal charge API accepts cents, but a vendor accepts decimal dollars. What must the adapter do?', // Ask about semantic conversion.
        appliedAnswer: 'Convert units precisely and map results and errors to the internal contract.', // Preserve the caller's semantics.
        appliedWrong: 'Pass the integer cent amount unchanged as dollars and only rename the method.', // Show a severe unit mismatch.
        hardQuestion: 'How does Adapter differ from Decorator and Facade?', // Ask for a three-way distinction.
        hardAnswer: 'Adapter changes the interface expected by a client to make an existing component compatible. Decorator preserves an interface while adding behavior around a component. Facade provides a simpler entry point over a subsystem. Their implementations may all use wrapping, but the intended contract relationship differs.', // Explain intent and contract.
        followUp: 'What should happen if the vendor cannot satisfy a required internal guarantee?', // Probe impossible adaptation.
        resource: 'https://refactoring.guru/design-patterns/adapter', // Link to pattern details.
    }, // Finish the adapter lesson.
]; // Finish all required OOP concept records.
const hardQuizSeeds: HardQuizSeed[] = [ // Add scored Hard practice to representative concepts while retaining descriptive questions.
    { // Test a subtle leak through mutable objects inside a read-only collection.
        topicTitle: 'Encapsulation', // Attach this scenario to the representation-boundary lesson.
        prompt: 'A class returns an unmodifiable List<Address> view, but Address has public setters. Which invariant risk remains?', // Ask about transitive mutability.
        options: ['Clients can mutate Address elements even though structural list changes are blocked.', 'No state can change because an unmodifiable list recursively freezes all elements.', 'The list necessarily contains deep copies because it is unmodifiable.'], // Distinguish container immutability from object-graph immutability.
        answer: 'Clients can mutate Address elements even though structural list changes are blocked.', // Select the correct remaining risk.
        explanation: 'An unmodifiable list controls additions, removals, and replacements through that view. It does not automatically make referenced elements immutable or copy them. Use immutable element values or appropriate defensive copies when the invariant requires stronger isolation.', // Explain the exact guarantee.
        hint: 'Separate the mutability of the collection from the mutability of each referenced element.', // Guide the reasoning without selecting an option.
    }, // Finish the encapsulation Hard MCQ.
    { // Test compatibility of an override’s accepted inputs.
        topicTitle: 'Liskov Substitution Principle', // Attach this scenario to behavioral subtyping.
        prompt: 'Base.withdraw accepts any amount in [0, balance]. A subtype rejects amounts below 100 while keeping the same method signature. Which assessment is correct?', // Make the base promise explicit.
        options: ['The subtype preserves LSP because its parameter types match.', 'The subtype strengthens a precondition and can violate LSP for callers using the base contract.', 'The subtype only weakens a postcondition, so preconditions are irrelevant.'], // Offer distinct contract interpretations.
        answer: 'The subtype strengthens a precondition and can violate LSP for callers using the base contract.', // Identify the stronger input requirement.
        explanation: 'A caller allowed by the base contract to withdraw 50 must still be valid when using a subtype through the base type. The new minimum rejects a previously valid input. Structural signature compatibility does not prove behavioral substitutability.', // Explain the concrete counterexample.
        hint: 'Consider a caller that withdraws 50 from a balance of 500.', // Supply a valid base-case witness.
    }, // Finish the LSP Hard MCQ.
    { // Test correct copying of shared and cyclic object graphs.
        topicTitle: 'Deep Copy vs Shallow Copy', // Attach the graph-copy scenario.
        prompt: 'Nodes A and B reference one another, and two root fields both reference A. Which deep-copy technique both terminates and preserves this internal sharing?', // Ask for two correctness properties.
        options: ['Recursively allocate a fresh copy every time any reference is encountered.', 'Replace every repeated reference with null without tracking source identity.', 'Register each original object identity with its copy before recursively copying its outgoing references.'], // Contrast graph-aware and tree-only algorithms.
        answer: 'Register each original object identity with its copy before recursively copying its outgoing references.', // Select the identity-map technique.
        explanation: 'Registering before traversal lets a back edge find the already allocated copy, terminating the cycle. Reusing that same copy for repeated references also preserves alias relationships within the copied graph while separating it from the original mutable graph.', // Explain termination and alias preservation.
        hint: 'A graph can revisit an object before recursion has finished copying it.', // Highlight why registration timing matters.
    }, // Finish the deep-copy Hard MCQ.
    { // Test deletion semantics rather than merely dispatch syntax.
        topicTitle: 'Virtual Functions and Vtables', // Attach the C++ lifetime scenario.
        prompt: 'In ordinary C++, Base has a public nonvirtual destructor and Derived extends Base. For Base* p = new Derived(); delete p; what is the consequence?', // State the ordinary deletion case explicitly.
        options: ['It is always safe because the compiler automatically treats every base destructor as virtual.', 'The deletion has undefined behavior because the base destructor is not virtual.', 'It is guaranteed to call only Derived’s destructor and leave Base untouched.'], // Offer the correct language-level guarantee and two false ones.
        answer: 'The deletion has undefined behavior because the base destructor is not virtual.', // State the ordinary C++ rule.
        explanation: 'Deleting a derived object through a base pointer ordinarily requires a virtual base destructor. Without it, the language does not merely promise a partial cleanup sequence; behavior is undefined. A polymorphic owning base should normally expose a suitable virtual destructor.', // Explain why a seemingly partial cleanup answer is insufficient.
        hint: 'Ask what the language guarantees when static and dynamic pointed-to types differ during deletion.', // Direct attention to lifetime rules.
    }, // Finish the destructor Hard MCQ.
    { // Test wrapper ordering with a real retry scenario.
        topicTitle: 'Decorator', // Attach the composition-order lesson.
        prompt: 'A call succeeds on its third physical attempt. Retry wraps a Logging decorator, so each retry invokes Logging. How many per-invocation log entries does Logging produce?', // Define the nesting and count assumption.
        options: ['One, because every decorator always observes only the logical outer operation.', 'Zero, because a decorator inside retry cannot see attempts.', 'Three, because Logging is invoked once for each physical attempt.'], // Contrast inner and outer placement.
        answer: 'Three, because Logging is invoked once for each physical attempt.', // Count the three inner invocations.
        explanation: 'Retry(Logging(Service)) repeats the inner logging-wrapped call three times. Logging(Retry(Service)) could log one outer invocation instead, depending on its logging policy. The interface can remain the same while composition order changes observable behavior.', // Explain both possible wrapper orders.
        hint: 'Trace which object Retry invokes every time it attempts the operation.', // Encourage following the call chain.
    }, // Finish the decorator Hard MCQ.
]; // Finish the selected OOP Hard quiz records.
export const oopTopics: Topic[] = withHardQuiz(makeLessons('oop', seeds), hardQuizSeeds); // Export the full authored curriculum with objective Hard quiz coverage.
