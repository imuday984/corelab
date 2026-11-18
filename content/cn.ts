import type { Topic } from '../shared/types'; // Use the shared structured curriculum contract.
import { networkLesson } from './cn-helper'; // Reuse documented lesson scaffolding while keeping every explanation topic-specific.
export const cnTopics: Topic[] = [ // Export all Computer Networks topics as editable curriculum data.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "What is a Computer Network?", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "A computer network connects independent devices so they can exchange data and share services using agreed protocols.", // Introduce the concept and explain why it matters.
        mechanism: "A sender encodes application data into protocol messages. Interfaces carry frames over links, switches connect local segments, and routers forward IP packets between networks. An endpoint address identifies a destination at the relevant layer.", // Explain its actual operation with correct terminology.
        tradeoff: "A link being connected does not guarantee that an application is reachable: addressing, routing, transport ports, and application behavior must all work.", // Record limitations and important interview distinctions.
        example: "A laptop sends an HTTPS request through Wi-Fi, a home router, and several provider networks to a remote web server.", // Demonstrate a realistic use case or calculation.
        misconception: "Every connected device must run the same operating system.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Two laptops share Wi-Fi but cannot reach a remote website. Does their local connection prove Internet routing works?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Local link connectivity and end-to-end Internet reachability are separate properties.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. A working local link guarantees that every remote server is reachable.", // Provide a plausible wrong choice for comparison.
        hard: "How would you distinguish a local network problem from an application-server problem?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Check link association and local addressing first, then the default gateway, DNS resolution, destination reachability where permitted, and the application port. Compare a known working endpoint. A blocked ping alone does not establish a failed application because ICMP and TCP can be filtered differently.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1122", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "OSI Model", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "The OSI model describes network communication using seven conceptual layers, from physical signaling to application services.", // Introduce the concept and explain why it matters.
        mechanism: "The layers are Physical, Data Link, Network, Transport, Session, Presentation, and Application. Encapsulation adds layer-specific control information as data moves downward; the receiver interprets it upward. Layer boundaries help separate responsibilities during design and troubleshooting.", // Explain its actual operation with correct terminology.
        tradeoff: "OSI is a reference model rather than the exact implementation blueprint of the Internet. Real protocols can span responsibilities, and TCP/IP commonly groups its upper three layers together.", // Record limitations and important interview distinctions.
        example: "For an HTTPS request, HTTP belongs to application behavior, TLS handles encryption above TCP, TCP provides a byte stream, IP routes packets, and Ethernet carries local frames.", // Demonstrate a realistic use case or calculation.
        misconception: "OSI requires all Internet software to implement seven separate processes.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A packet reaches the destination network but the receiving application does not listen on the requested TCP port. Which layer is the immediate focus?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Transport: examine TCP port reachability and connection behavior.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Physical: replace the cable solely because an application port is closed.", // Provide a plausible wrong choice for comparison.
        hard: "Why is assigning TLS to one OSI layer sometimes misleading?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "TLS combines security and representation responsibilities and runs over a transport stream, while real stacks do not implement OSI as seven strict software modules. Explain the actual protocol nesting and guarantees first; use the model to organize reasoning rather than force a perfect category.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/", // Link to independent protocol or technical documentation.
        diagram: ["7 · Application — HTTP, DNS", "6 · Presentation — representation and encryption", "5 · Session — dialog management", "4 · Transport — TCP, UDP", "3 · Network — IP routing", "2 · Data Link — Ethernet frames", "1 · Physical — electrical, optical, radio signals"], // Show an ordered workflow to reinforce visual understanding.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "TCP/IP Model", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "The TCP/IP model groups Internet communication into application, transport, Internet, and link layers.", // Introduce the concept and explain why it matters.
        mechanism: "Applications create messages such as HTTP requests. TCP or UDP provides transport addressing; IP forwards packets across networks; link protocols move frames over one local hop. Each router usually replaces link framing while forwarding the IP packet.", // Explain its actual operation with correct terminology.
        tradeoff: "TCP/IP is sometimes taught as five layers by splitting link into data link and physical. State which convention you use; the protocol behavior remains the same.", // Record limitations and important interview distinctions.
        example: "An HTTP message is carried inside TCP segments, inside IP packets, inside Wi-Fi or Ethernet frames.", // Demonstrate a realistic use case or calculation.
        misconception: "TCP/IP means every application must use TCP rather than UDP.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An application uses UDP instead of TCP. Does it stop using the TCP/IP suite?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. UDP is a transport protocol within the Internet protocol suite.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. The suite supports only reliable byte streams.", // Provide a plausible wrong choice for comparison.
        hard: "What changes at a router hop and what usually remains end-to-end?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "The router removes incoming link framing and emits a new frame for the next link. IP source and destination generally remain endpoint addresses, although TTL or hop limit changes and NAT can rewrite addresses. Transport state belongs to endpoints except where middleboxes intervene.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1122", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "OSI vs TCP/IP", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "OSI is a seven-layer reference model; TCP/IP is the deployed Internet protocol architecture commonly explained in four or five layers.", // Introduce the concept and explain why it matters.
        mechanism: "OSI application, presentation, and session functions usually map to TCP/IP application behavior. Both identify transport and network responsibilities; TCP/IP link behavior covers OSI data-link and physical concerns in the four-layer convention.", // Explain its actual operation with correct terminology.
        tradeoff: "The mapping is approximate. Protocols such as TLS and QUIC demonstrate why actual encapsulation and guarantees matter more than memorizing a strict layer number.", // Record limitations and important interview distinctions.
        example: "TCP provides transport reliability in both descriptions, but no separate OSI session-layer daemon is required for a browser to communicate.", // Demonstrate a realistic use case or calculation.
        misconception: "OSI and TCP/IP are two mutually incompatible cable standards.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A team debates whether TLS is presentation or application layer. What is the most useful next step?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Describe TLS placement and guarantees in the actual stack rather than forcing an exact model mapping.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Require a new network because the two models cannot describe the same traffic.", // Provide a plausible wrong choice for comparison.
        hard: "How can the layer models help diagnose a slow web request without becoming a memorization exercise?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Break the request into DNS, connection setup, security negotiation, request transfer, server processing, and response transfer. Associate each observation with its protocol responsibility. Models organize hypotheses, but packet traces and timing identify the actual delay.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1122", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Network Topologies", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "Network topology describes how nodes and links connect, either physically or logically.", // Introduce the concept and explain why it matters.
        mechanism: "Common forms include star, bus, ring, mesh, and tree. A switched Ethernet LAN is commonly a physical star, while redundant switches can form a richer physical graph whose active forwarding topology is controlled to avoid loops.", // Explain its actual operation with correct terminology.
        tradeoff: "Full mesh gives many alternate paths but needs n(n−1)/2 links for n nodes. A star is easier to manage, but its central device can be a failure point unless redundant.", // Record limitations and important interview distinctions.
        example: "Five fully meshed routers need ten point-to-point links, while a five-node star needs four links to one central node.", // Demonstrate a realistic use case or calculation.
        misconception: "A full mesh always requires fewer links than a star.", // Use a concept-specific misconception as a basic distractor.
        scenario: "How many undirected links connect four nodes in a full mesh?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Six links, because 4 × 3 ÷ 2 = 6.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Four links, because each node needs exactly one connection.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a physical Ethernet ring fail without a loop-prevention protocol?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Ethernet broadcasts and unknown-destination frames can circulate because ordinary frames have no IP-style hop limit. Redundant links need a loop-prevention mechanism such as spanning tree or a controlled fabric. The logical forwarding topology can therefore differ from the physical wiring.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-network-topology.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Bandwidth vs Throughput", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "Bandwidth is a link capacity measure; throughput is the amount of data actually delivered per unit of time.", // Introduce the concept and explain why it matters.
        mechanism: "Throughput depends on the bottleneck link, congestion, protocol overhead, loss, receiver limits, and sender behavior. Application goodput excludes retransmissions and protocol headers, so it can be lower than transport or link throughput.", // Explain its actual operation with correct terminology.
        tradeoff: "Adding capacity to a non-bottleneck link may not improve end-to-end performance. Bits per second and bytes per second also differ by a factor of eight.", // Record limitations and important interview distinctions.
        example: "A 100 Mb/s link has a raw ceiling of 12.5 MB/s before overhead; a download at 10 MB/s can be perfectly plausible.", // Demonstrate a realistic use case or calculation.
        misconception: "A 100 Mb/s link guarantees every application transfers at 100 MB/s.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A path has links of 1 Gb/s, 100 Mb/s, and 500 Mb/s. What is its capacity bottleneck before other constraints?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The 100 Mb/s link.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The sum, 1.6 Gb/s, because capacities add across a path.", // Provide a plausible wrong choice for comparison.
        hard: "Why might a single TCP flow underuse a high-bandwidth, long-distance link?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "The flow must keep roughly bandwidth × round-trip-time bytes in flight to fill the path. A small receive window, congestion window, loss, or slow startup can prevent that. Measure RTT, loss, flow windows, and application limits before assuming the physical bandwidth is unavailable.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc6349", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Latency", // Name this specific networking concept.
        module: "Network Fundamentals", // Group the lesson in the requested curriculum hierarchy.
        definition: "Latency is the time required for data to travel or for an operation to respond; one-way delay and round-trip time are different measurements.", // Introduce the concept and explain why it matters.
        mechanism: "Network delay includes propagation, serialization, queueing, and processing. Queueing varies with load, while propagation has a physical distance limit. A small message on a fast long-distance path can still have substantial round-trip latency.", // Explain its actual operation with correct terminology.
        tradeoff: "High bandwidth improves bulk transfer capacity but does not remove propagation delay. Tail latency and jitter matter for interactive services even when average latency is acceptable.", // Record limitations and important interview distinctions.
        example: "A request requiring three sequential network round trips on an 80 ms RTT path spends about 240 ms waiting for the network before server processing and transfer time.", // Demonstrate a realistic use case or calculation.
        misconception: "Doubling bandwidth necessarily halves propagation delay.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A service makes four sequential RPCs, each taking one 50 ms round trip. What network waiting time is implied?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Approximately 200 ms before adding processing and payload transfer.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Approximately 12.5 ms because parallel bandwidth is divided by four.", // Provide a plausible wrong choice for comparison.
        hard: "How would you reduce latency for many small sequential requests?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Reuse connections, reduce unnecessary round trips, batch requests when semantics allow, and move suitable computation or cacheable data closer to users. Parallelize independent work but account for server load. More bandwidth alone does not remove dependencies or distance.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc7679", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "HTTP vs HTTPS", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "HTTPS carries HTTP over an authenticated encrypted transport, normally TLS, protecting traffic between the client and TLS endpoint.", // Introduce the concept and explain why it matters.
        mechanism: "TLS negotiates keys and authenticates the server certificate chain and hostname. It provides confidentiality and integrity in transit; HTTP semantics such as methods and status codes remain. HTTP/3 uses QUIC with integrated TLS 1.3 rather than TCP.", // Explain its actual operation with correct terminology.
        tradeoff: "HTTPS does not prove that site content is trustworthy and does not protect data after TLS terminates. Certificate validation and correct endpoint configuration remain essential.", // Record limitations and important interview distinctions.
        example: "An observer on public Wi-Fi can see a destination IP and traffic timing but cannot read a properly protected HTTPS request body.", // Demonstrate a realistic use case or calculation.
        misconception: "HTTPS encrypts data permanently even after the server decrypts it.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A reverse proxy terminates TLS and forwards plaintext to a backend. Which segment lacks that TLS protection?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The proxy-to-backend segment unless separately encrypted.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The browser-to-proxy segment because all reverse proxies disable TLS.", // Provide a plausible wrong choice for comparison.
        hard: "Why is certificate validation as important as encryption?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Encryption without authenticated peer identity can establish a secure channel to an attacker. A client must validate trust, hostname, validity, and relevant policy. TLS termination also establishes a security boundary: downstream links need their own protection where the threat model requires it.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "HTTP Methods", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "HTTP methods communicate request semantics, including retrieval, creation, replacement, partial modification, and deletion.", // Introduce the concept and explain why it matters.
        mechanism: "GET is safe and idempotent; HEAD retrieves headers without a response body; PUT and DELETE are idempotent in intended effect. POST is not generally idempotent. PATCH applies a partial modification whose idempotence depends on the patch operation.", // Explain its actual operation with correct terminology.
        tradeoff: "Idempotent does not mean identical responses: deleting an already deleted resource can return a different status while preserving the same final state. Safe methods should not trigger requested state changes.", // Record limitations and important interview distinctions.
        example: "PUT /profiles/42 can replace a resource consistently on retries; POST /payments needs an idempotency mechanism before retrying safely.", // Demonstrate a realistic use case or calculation.
        misconception: "Every HTTP method is safe to retry because HTTP uses reliable transport.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A client times out after POST /payments and does not know whether the payment was created. What should support safe retries?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "An application-level idempotency key or another deduplication contract.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Resend the POST indefinitely because POST is always idempotent.", // Provide a plausible wrong choice for comparison.
        hard: "Can PATCH be idempotent, and why does the distinction matter?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Yes: setting status to archived repeatedly has the same intended effect, while incrementing a counter repeatedly does not. Retry behavior must follow the operation semantics and the API contract. Transport reliability does not eliminate ambiguous results after connection failures.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9110", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "HTTP Status Codes", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "HTTP status codes report response classes: informational 1xx, successful 2xx, redirection 3xx, client-side 4xx, and server-side 5xx outcomes.", // Introduce the concept and explain why it matters.
        mechanism: "200 commonly returns a successful representation, 201 identifies creation, 204 has no response content, and 304 supports cache validation. 401 asks for authentication, while 403 reports refusal. 429 indicates rate limiting; 503 indicates temporary service unavailability.", // Explain its actual operation with correct terminology.
        tradeoff: "Status classes alone do not determine whether retrying is safe. Respect Retry-After when supplied and combine status handling with method semantics and application error details.", // Record limitations and important interview distinctions.
        example: "GET with If-None-Match may receive 304 when the cached representation remains valid, avoiding another response body transfer.", // Demonstrate a realistic use case or calculation.
        misconception: "Every 4xx response means the server crashed.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A request has no valid session and must authenticate. Which status is more appropriate than 403?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "401 Unauthorized, with the appropriate authentication challenge for the scheme.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "200 OK, because authentication errors are always successful responses.", // Provide a plausible wrong choice for comparison.
        hard: "How should a client react differently to 401, 403, and 503?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "401 can trigger authentication or session renewal. 403 means access is refused and repeatedly supplying the same credentials is unlikely to help. 503 can warrant bounded, backoff-based retries when the operation is safe, using Retry-After when provided. Never retry blindly without considering side effects.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "DNS and DNS Resolution", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "DNS is a distributed hierarchical naming system that maps domain names to records such as IP addresses and mail-routing information.", // Introduce the concept and explain why it matters.
        mechanism: "A stub resolver asks a recursive resolver, which may answer from cache or query root, top-level-domain, and authoritative servers. Record TTLs bound ordinary cache lifetime. A and AAAA records hold IPv4 and IPv6 addresses; CNAME names an alias.", // Explain its actual operation with correct terminology.
        tradeoff: "DNS caching reduces latency and authoritative load, but stale caches and negative caching can delay observable changes. DNS resolution is separate from the later TCP, QUIC, or HTTP connection.", // Record limitations and important interview distinctions.
        example: "For www.example.com, a resolver can follow cached referrals to the authoritative server and cache the returned address for its TTL.", // Demonstrate a realistic use case or calculation.
        misconception: "DNS transfers the website HTML directly to the browser.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A valid cached DNS answer has 120 seconds left in its TTL. Must the resolver query the authoritative server for every request?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. It can normally reuse the cached answer until its TTL expires.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. DNS forbids caching address records.", // Provide a plausible wrong choice for comparison.
        hard: "Why can changing a DNS record fail to redirect every client immediately?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Resolvers and clients can retain the prior answer until its TTL expires; negative caching can also matter. Existing connections may continue using their old endpoint. Reduce TTL before a planned change and account for propagation and connection reuse rather than expecting an instantaneous global update.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1034", // Link to independent protocol or technical documentation.
        diagram: ["Browser checks local caches", "Stub asks recursive resolver", "Resolver follows root → TLD → authoritative referrals when needed", "Resolver caches the record according to TTL", "Browser uses returned address to start a separate connection"], // Show an ordered workflow to reinforce visual understanding.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "FTP", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "FTP is a file-transfer protocol that uses a control connection and a separate data connection.", // Introduce the concept and explain why it matters.
        mechanism: "The control channel traditionally uses TCP port 21. Active mode asks the server to connect to a client data port; passive mode lets the client connect to a server-advertised data endpoint. Commands and replies manage authentication and file operations.", // Explain its actual operation with correct terminology.
        tradeoff: "Traditional FTP sends credentials and data without encryption. FTPS adds TLS; SFTP is a different protocol built over SSH. Separate data connections complicate firewall and NAT handling.", // Record limitations and important interview distinctions.
        example: "Passive FTP is commonly easier behind client-side NAT because the client initiates both control and data connections.", // Demonstrate a realistic use case or calculation.
        misconception: "SFTP is simply FTP running on port 21 with the same wire protocol.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A NATed client can log in to FTP but active-mode file transfers fail. What is a useful configuration change?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Try passive mode and ensure the server passive port range is reachable.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Disable the control connection because file transfer never needs it.", // Provide a plausible wrong choice for comparison.
        hard: "Why is opening only TCP 21 insufficient for many FTP deployments?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Port 21 carries control messages, while file contents and directory listings use separate negotiated data connections. Active and passive modes establish those connections differently. Firewall rules must account for the data path; a secure modern alternative such as SFTP may simplify deployment.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc959", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "SMTP", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "SMTP transfers email from a submitting client to a mail service and between mail servers.", // Introduce the concept and explain why it matters.
        mechanism: "An SMTP dialog uses commands such as EHLO, MAIL FROM, RCPT TO, and DATA. Mail delivery uses DNS MX records to find destination mail exchangers. Port 25 commonly serves server-to-server relay; submission commonly uses 587 with STARTTLS or 465 with implicit TLS.", // Explain its actual operation with correct terminology.
        tradeoff: "SMTP handles submission and relay, not mailbox synchronization. Delivery can be queued and retried, and an accepted message is not a guarantee that a human will receive or read it.", // Record limitations and important interview distinctions.
        example: "An application submits a welcome email to its provider, which queues a delivery attempt to the recipient domain MX server.", // Demonstrate a realistic use case or calculation.
        misconception: "SMTP is the protocol that synchronizes an inbox across all devices.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A server accepts a message with a 250 response. Does this prove the recipient opened it?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Acceptance transfers responsibility for further processing; it does not prove reading.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. SMTP requires the recipient to open every accepted message immediately.", // Provide a plausible wrong choice for comparison.
        hard: "How do SMTP, SPF, DKIM, and DMARC differ?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "SMTP transports messages. SPF authorizes sending hosts for an envelope domain, DKIM signs selected message content with a domain key, and DMARC combines alignment checks and policy for the visible From domain. None alone guarantees that the message is wanted, safe, or read.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc5321", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "POP3", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "POP3 retrieves messages from a maildrop using a relatively simple download-oriented protocol.", // Introduce the concept and explain why it matters.
        mechanism: "A session authenticates, lists or retrieves messages, and can mark messages for deletion. Deletions are committed in the update state after a successful QUIT. Clients may leave messages on the server according to configuration.", // Explain its actual operation with correct terminology.
        tradeoff: "POP3 offers less rich server-side folder and state synchronization than IMAP. It is incorrect to claim that POP3 always immediately deletes every downloaded message.", // Record limitations and important interview distinctions.
        example: "A desktop client can download mail for offline reading and leave copies on the server for a configured retention period.", // Demonstrate a realistic use case or calculation.
        misconception: "POP3 always deletes each message before the client can read it.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A user needs synchronized folders and read flags on a phone and laptop. Which approach is usually better suited?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "IMAP, which models server-side mailbox state and synchronization.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "POP3, because it standardizes rich shared folders and synchronized flags.", // Provide a plausible wrong choice for comparison.
        hard: "Why can two POP3 clients show different read or folder states?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "POP3 primarily exposes a maildrop and retrieval operations, rather than the richer shared mailbox state model of IMAP. Clients often maintain their own local organization. Leaving messages on the server can make messages available on both clients without synchronizing every local state change.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1939", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "IMAP", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "IMAP lets clients access and synchronize server-hosted mailboxes, folders, and message flags.", // Introduce the concept and explain why it matters.
        mechanism: "Clients select mailboxes, fetch selected message data, search server-side, and update flags such as Seen. Persistent identifiers help clients reconcile mailbox state; extensions can improve change notification and synchronization.", // Explain its actual operation with correct terminology.
        tradeoff: "IMAP is for mailbox access rather than message submission. Offline clients still need conflict handling and eventual synchronization, while sending normally uses a separate SMTP submission service.", // Record limitations and important interview distinctions.
        example: "Marking a message read on a phone can update its server-side Seen flag so the laptop displays the same state after synchronization.", // Demonstrate a realistic use case or calculation.
        misconception: "IMAP sends outgoing mail between destination mail exchangers.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A mail client uses IMAP for reading. What service normally submits a new outgoing email?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "An SMTP submission service.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "An ARP server, because email submission resolves MAC addresses.", // Provide a plausible wrong choice for comparison.
        hard: "Why are persistent message identifiers important for disconnected clients?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Message sequence numbers can change as the mailbox changes. Stable identifiers within a mailbox validity context allow a reconnecting client to reconcile cached messages and flags correctly. The client must also handle mailbox validity changes rather than assuming old identifiers remain meaningful forever.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9051", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Cookies vs Sessions", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A cookie is browser-managed request state; a server-side session stores authenticated state on the server and commonly uses an opaque cookie identifier.", // Introduce the concept and explain why it matters.
        mechanism: "The server sends Set-Cookie, and the browser attaches eligible cookies according to domain, path, expiry, Secure, and SameSite rules. HttpOnly prevents JavaScript from reading a cookie; the server looks up an opaque session ID and verifies expiry before authorizing a request.", // Explain its actual operation with correct terminology.
        tradeoff: "Cookies are not inherently authentication, and sessions need expiry, revocation, and fixation protection. HttpOnly reduces token theft through scripts but does not stop scripts from issuing authorized same-origin requests.", // Record limitations and important interview distinctions.
        example: "After login, a random session ID is placed in a Secure, HttpOnly cookie while the corresponding user identity stays in a server-side session record.", // Demonstrate a realistic use case or calculation.
        misconception: "An HttpOnly cookie prevents every kind of cross-site request forgery.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A session cookie is HttpOnly. Can injected same-origin JavaScript still issue authenticated fetch requests?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Yes. HttpOnly hides the cookie value but does not remove it from eligible browser requests.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "No. HttpOnly disables all application requests from JavaScript.", // Provide a plausible wrong choice for comparison.
        hard: "How would you secure a cookie-based session API against common attacks?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Use high-entropy session IDs, hash or otherwise protect stored tokens, rotate on login, revoke on logout, and enforce expiry. Use Secure and HttpOnly cookies, appropriate SameSite behavior, and CSRF protection such as strict origin checks or tokens. Authorize each request from the server identity, never a supplied user ID.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "A session cookie is Secure and HttpOnly, but the server accepts cross-site state-changing requests without checking origin or a CSRF token. Which conclusion is justified?", "options": ["HttpOnly alone guarantees that no cross-site request can use the cookie", "Secure alone guarantees that every request originated from the application", "The attributes protect transport and script access, but explicit CSRF controls and appropriate SameSite behavior are still needed"], "answer": "The attributes protect transport and script access, but explicit CSRF controls and appropriate SameSite behavior are still needed", "explanation": "Secure limits cookie transmission to secure transport and HttpOnly prevents direct JavaScript reads. Neither proves request intent or origin. SameSite behavior reduces selected cross-site sending, while origin validation or CSRF tokens protects state-changing operations under the actual application model.", "hint": "Keep confidentiality of a cookie value separate from whether the browser sends it on a request."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "REST APIs", // Name this specific networking concept.
        module: "Application Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "REST is an architectural style centered on resource representations, a uniform interface, and stateless request semantics.", // Introduce the concept and explain why it matters.
        mechanism: "A resource can have a stable URI and representations such as JSON. HTTP methods express operations, status codes express outcomes, and cache metadata controls reuse. Each request includes the information required to process it rather than depending on an implicit conversational sequence.", // Explain its actual operation with correct terminology.
        tradeoff: "Using JSON over HTTP alone does not establish every REST constraint. Stateless requests do not forbid database persistence; they avoid requiring server-held client conversation context for interpretation.", // Record limitations and important interview distinctions.
        example: "GET /articles/42 returns a representation and ETag; a conditional GET can validate a cached copy without transferring the full resource again.", // Demonstrate a realistic use case or calculation.
        misconception: "REST requires deleting the database after every response to remain stateless.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An API stores article records in a database. Does this alone violate REST statelessness?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Resource persistence is distinct from per-client conversational state.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. REST forbids storing any server-side data.", // Provide a plausible wrong choice for comparison.
        hard: "How would you design retries and concurrent edits in a resource API?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Use meaningful method semantics, explicit idempotency where side effects need deduplication, and conditional updates with ETag and If-Match to detect lost updates. Return useful status codes and error representations. A uniform interface helps clients reason about behavior but does not replace application-level concurrency rules.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "TCP vs UDP", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "TCP provides an ordered reliable byte stream; UDP sends independent datagrams without built-in delivery or ordering guarantees.", // Introduce the concept and explain why it matters.
        mechanism: "TCP tracks sequence numbers, acknowledgments, retransmissions, flow control, and congestion control. UDP preserves datagram boundaries with a small header. Applications using UDP can add selected reliability or congestion mechanisms above it, as QUIC does.", // Explain its actual operation with correct terminology.
        tradeoff: "TCP does not preserve application message boundaries, while UDP does not automatically recover loss. UDP applications still need responsible congestion behavior and must handle path MTU and datagram size limits.", // Record limitations and important interview distinctions.
        example: "A TCP receiver may read one application message across several reads; a UDP receiver gets a whole datagram or an indicated truncation according to its API.", // Demonstrate a realistic use case or calculation.
        misconception: "TCP guarantees that every write is returned by exactly one matching read.", // Use a concept-specific misconception as a basic distractor.
        scenario: "You send two short messages through TCP. Can one read return bytes from both?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Yes. TCP is a byte stream, so the application needs framing.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "No. TCP preserves write boundaries as message boundaries.", // Provide a plausible wrong choice for comparison.
        hard: "Why might a real-time application choose UDP, and what responsibilities remain?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Timely fresh data can be more valuable than delayed retransmissions. UDP lets the application choose recovery, sequencing, jitter buffering, and expiration policies. It must still control sending rate, handle loss and reordering, secure traffic, and avoid fragmentation or excessive datagram sizes.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9293", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "A transport must carry several independent reliable streams without one lost packet blocking delivery on unrelated streams. Which design best matches this requirement?", "options": ["One TCP connection with application message framing", "A QUIC connection with multiple streams", "Plain UDP with no application reliability or sequencing"], "answer": "A QUIC connection with multiple streams", "explanation": "TCP orders one byte stream, so a missing byte can hold back later bytes even from independently framed application messages. QUIC provides reliable streams with ordering scoped to each stream; connection-level congestion control still applies.", "hint": "Distinguish application multiplexing over one ordered stream from transport-level independent stream ordering."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "TCP Three-Way Handshake", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "TCP normally establishes a connection with SYN, SYN-ACK, and ACK messages that synchronize both endpoints sequence spaces.", // Introduce the concept and explain why it matters.
        mechanism: "The client sends a SYN with its initial sequence number. The server replies with its SYN and acknowledges the client SYN. The client acknowledges the server SYN; each SYN consumes one sequence number. Options can negotiate capabilities such as window scaling.", // Explain its actual operation with correct terminology.
        tradeoff: "The handshake establishes transport state, not application authentication. Lost handshake packets can be retransmitted, and server resource allocation must account for SYN-flood attacks.", // Record limitations and important interview distinctions.
        example: "Client SYN seq=100; server SYN-ACK seq=700 ack=101; client ACK seq=101 ack=701.", // Demonstrate a realistic use case or calculation.
        misconception: "The first SYN proves the client has received data from the server.", // Use a concept-specific misconception as a basic distractor.
        scenario: "The server chooses initial sequence number 700. What acknowledgment normally acknowledges its SYN?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "701, because a SYN consumes one sequence number.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "700, because control flags never consume sequence numbers.", // Provide a plausible wrong choice for comparison.
        hard: "Why are three messages useful instead of immediately accepting a SYN as a complete connection?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "The exchange communicates both initial sequence numbers and confirms that the client received the server sequence number. This helps reject stale duplicates and establish bidirectional reachability. It does not by itself authenticate the application user; resource exhaustion needs additional mitigations such as SYN cookies or proxies.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9293", // Link to independent protocol or technical documentation.
        diagram: ["Client → Server: SYN, seq=x", "Server → Client: SYN + ACK, seq=y, ack=x+1", "Client → Server: ACK, ack=y+1", "Both sides can exchange stream data"], // Show an ordered workflow to reinforce visual understanding.
        hardQuiz: {"prompt": "A client sends SYN seq=900. The server replies SYN-ACK seq=4000 ack=901. Which acknowledgment correctly completes a normal handshake without data?", "options": ["ACK seq=900 ack=4000", "ACK seq=901 ack=4001", "ACK seq=902 ack=4002"], "answer": "ACK seq=901 ack=4001", "explanation": "Each SYN consumes one sequence number. The client next sends sequence 901 and acknowledges the server SYN at 4001. An ACK by itself consumes no additional sequence number.", "hint": "Count SYN control flags in sequence space; do not count a pure ACK."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "TCP Four-Way Termination", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "TCP closes its two stream directions independently, so an orderly close often involves FIN, ACK, FIN, and ACK.", // Introduce the concept and explain why it matters.
        mechanism: "A FIN declares that its sender has no more bytes to send and consumes one sequence number. The peer can acknowledge it while still sending its remaining data. The active closer commonly enters TIME_WAIT after acknowledging the peer FIN.", // Explain its actual operation with correct terminology.
        tradeoff: "Four separate packets are common but not mandatory because acknowledgments and FIN can be combined. A reset aborts a connection and differs from orderly shutdown.", // Record limitations and important interview distinctions.
        example: "A client sends FIN after its request, the server ACKs and finishes a response, then sends its own FIN for the client to ACK.", // Demonstrate a realistic use case or calculation.
        misconception: "After receiving FIN, an endpoint must immediately discard all remaining response data.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A server receives a client FIN but still has response bytes to send. Is this valid?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Yes. TCP supports half-close, so the opposite direction can remain open.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "No. FIN always closes both directions simultaneously.", // Provide a plausible wrong choice for comparison.
        hard: "What purpose does TIME_WAIT serve, and why can it affect busy servers?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "TIME_WAIT allows retransmission of the final acknowledgment if the peer repeats its FIN and keeps delayed packets from an old connection from contaminating a reused tuple. High connection churn consumes temporary connection identifiers and state; connection reuse and sensible system tuning can help without simply removing protocol protections.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9293", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Flow Control", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "TCP flow control prevents a sender from overwhelming the receivers advertised buffer capacity.", // Introduce the concept and explain why it matters.
        mechanism: "The receiver advertises a receive window indicating how much additional stream data it can accept. The sender limits outstanding data according to both receive and congestion windows. Window scaling allows larger windows negotiated during connection establishment.", // Explain its actual operation with correct terminology.
        tradeoff: "Flow control protects the receiver; congestion control protects the network. A receiver advertising zero needs persist behavior so a lost window update does not stall the connection forever.", // Record limitations and important interview distinctions.
        example: "If the receive window is 16 KiB and unacknowledged data already fills it, the sender waits for acknowledgments or window updates before sending more normal data.", // Demonstrate a realistic use case or calculation.
        misconception: "Flow control is the same mechanism as deciding the shortest IP route.", // Use a concept-specific misconception as a basic distractor.
        scenario: "The network is idle but the receiving application stops reading. What may eventually limit the TCP sender?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The advertised receive window can shrink to zero as buffers fill.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The sender can ignore receiver buffers because there is no congestion.", // Provide a plausible wrong choice for comparison.
        hard: "How can a connection stall even when link bandwidth and congestion window are large?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "A small or zero receive window can limit in-flight data if the application reads slowly or buffers are constrained. Effective sending is limited by both congestion and receiver capacity. Inspect advertised windows and application consumption before attributing the stall to congestion.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc9293", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Sliding Window", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A sliding window permits several numbered data units to be in flight before acknowledgments advance the sending range.", // Introduce the concept and explain why it matters.
        mechanism: "TCP tracks byte sequence numbers and acknowledges the next expected byte. As acknowledgments arrive, the window moves forward and permits more data. Selective acknowledgments can report received noncontiguous ranges to improve loss recovery.", // Explain its actual operation with correct terminology.
        tradeoff: "A large window helps fill a high-bandwidth, high-RTT path but consumes buffering. The practical window is constrained by flow control and congestion control, not just the sequence-number mechanism.", // Record limitations and important interview distinctions.
        example: "At 10 Mb/s and 100 ms RTT, roughly 125 kB must be in flight to fill the path before considering overhead.", // Demonstrate a realistic use case or calculation.
        misconception: "A sliding window always waits for each individual packet before sending the next.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A path needs 1 MB in flight to fill its bandwidth-delay product, but the effective window is 64 kB. What is likely?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The flow can underuse the path because too little data is outstanding.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The flow necessarily exceeds line rate because its packets are acknowledged.", // Provide a plausible wrong choice for comparison.
        hard: "Why does selective acknowledgment help when several segments are lost from one window?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Cumulative acknowledgment alone identifies the first missing byte but not every later received range. SACK tells the sender which blocks arrived, allowing targeted retransmission and more efficient recovery. It improves loss recovery while leaving the reliable ordered byte-stream abstraction unchanged.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2018", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "Ignoring overhead and loss, a 1 Gb/s path has 80 ms RTT. Approximately how much data must be outstanding to fill its bandwidth-delay product?", "options": ["10 megabytes", "80 kilobytes", "1 gigabyte"], "answer": "10 megabytes", "explanation": "1,000,000,000 bits/s × 0.080 s = 80,000,000 bits = 10,000,000 bytes. The effective sender window must accommodate approximately this quantity to sustain the link rate.", "hint": "Multiply rate by round-trip time, then convert bits to bytes."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Congestion Control", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Congestion control adapts a senders offered traffic to network capacity and feedback so shared paths do not collapse under overload.", // Introduce the concept and explain why it matters.
        mechanism: "Classic TCP uses a congestion window, slow start, congestion avoidance, and loss recovery. Packet loss or ECN marks can signal congestion. Modern algorithms differ: CUBIC and model-based schemes use different approaches to finding sustainable sending rates.", // Explain its actual operation with correct terminology.
        tradeoff: "Congestion control is distinct from receiver flow control. Large buffers can hide loss while creating high queueing latency, a problem known as bufferbloat.", // Record limitations and important interview distinctions.
        example: "When many downloads fill a home uplink queue, interactive calls can lag even though no local application has exhausted its receive buffers.", // Demonstrate a realistic use case or calculation.
        misconception: "Congestion control only protects the receiving applications memory.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A router reports ECN congestion without dropping packets. What can a supporting sender do?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Reduce or adjust sending based on congestion feedback before further queue growth.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Ignore the signal because only receiver buffer exhaustion matters.", // Provide a plausible wrong choice for comparison.
        hard: "Why can maximizing throughput without controlling queue delay harm an interactive application?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "A persistent queue increases latency for every packet sharing the bottleneck. Throughput can remain high while call quality and request responsiveness deteriorate. Active queue management, ECN, pacing, and appropriate congestion control can reduce delay while keeping useful utilization.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc5681", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Port Numbers", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Transport ports identify application endpoints within a host; TCP and UDP each have their own 16-bit port namespace.", // Introduce the concept and explain why it matters.
        mechanism: "A flow is commonly distinguished by protocol, source address, source port, destination address, and destination port. Servers often listen on known ports while clients use ephemeral source ports. A port number alone does not prove the application protocol or its security.", // Explain its actual operation with correct terminology.
        tradeoff: "The same numerical port can be used independently by TCP and UDP. Binding and reuse rules depend on the operating system and socket configuration.", // Record limitations and important interview distinctions.
        example: "An HTTPS client can connect from ephemeral TCP port 53010 to server TCP port 443 while another client connects to the same server port using a different source tuple.", // Demonstrate a realistic use case or calculation.
        misconception: "Only one client in the world can connect to server port 443 at a time.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Two clients connect to the same server TCP port 443. How can the server distinguish their connections?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The connections have different source/destination address and port tuples.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The server must assign a different public destination port to every client.", // Provide a plausible wrong choice for comparison.
        hard: "Why does allowing outbound TCP 443 not guarantee that all outbound traffic is actually HTTPS?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Ports are conventions and demultiplexing identifiers. An application can carry another protocol on 443, and encrypted traffic can obscure content. Policy enforcement must consider endpoints, TLS behavior, application context, and organizational controls rather than trusting a port number alone.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Socket Programming", // Name this specific networking concept.
        module: "Transport Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A socket is an operating-system interface for network communication, commonly exposing streams for TCP and datagrams for UDP.", // Introduce the concept and explain why it matters.
        mechanism: "A TCP server typically creates a socket, binds, listens, and accepts connections. The accepted socket is separate from the listening socket. Clients connect and both sides read and write bytes; applications must handle partial I/O, closure, errors, and framing.", // Explain its actual operation with correct terminology.
        tradeoff: "A successful write means bytes were accepted into local processing, not that the remote application consumed them. Blocking and nonblocking APIs need different waiting and backpressure strategies.", // Record limitations and important interview distinctions.
        example: "A length-prefixed protocol reads four length bytes, validates the length, and then loops until that many payload bytes have arrived.", // Demonstrate a realistic use case or calculation.
        misconception: "A single read call always returns the complete logical application message.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A TCP read returns only 40 bytes of a 100-byte message. What should a correct framed reader do?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Continue reading until the frame is complete, the connection closes, or an error/timeout occurs.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Treat the connection as corrupted because TCP never splits messages.", // Provide a plausible wrong choice for comparison.
        hard: "How do you prevent a socket server from hanging or exhausting memory on hostile partial messages?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Validate frame lengths before allocation, enforce maximum message sizes and deadlines, bound per-connection buffers, and respect write backpressure. Handle partial reads and disconnects explicitly. Use an event-driven or appropriately pooled design so one slow client cannot block unrelated clients indefinitely.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://man7.org/linux/man-pages/man7/socket.7.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "IPv4 vs IPv6", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "IPv4 uses 32-bit addresses, while IPv6 uses 128-bit addresses and a redesigned base header with extension headers.", // Introduce the concept and explain why it matters.
        mechanism: "IPv4 commonly uses dotted decimal notation; IPv6 uses hexadecimal groups with defined zero compression. IPv6 neighbor discovery uses ICMPv6 instead of ARP, and routers do not fragment IPv6 packets. Hosts rely on path MTU behavior and appropriate packet sizing.", // Explain its actual operation with correct terminology.
        tradeoff: "IPv6 address abundance does not automatically secure hosts or remove firewall needs. Dual-stack applications must support address selection and different path failures.", // Record limitations and important interview distinctions.
        example: "192.0.2.10 is documentation IPv4 notation; 2001:db8::10 is documentation IPv6 notation.", // Demonstrate a realistic use case or calculation.
        misconception: "IPv6 addresses are 64 bits and all IPv6 traffic is automatically encrypted.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An IPv6 router encounters a packet too large for its next link. What normally happens?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "It drops the packet and sends an ICMPv6 Packet Too Big message rather than fragmenting it.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "It always fragments the packet into smaller IPv6 router fragments.", // Provide a plausible wrong choice for comparison.
        hard: "Why can blocking all ICMPv6 break otherwise valid IPv6 connections?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "ICMPv6 supports essential functions including neighbor discovery and Packet Too Big feedback. Blocking those messages can prevent address resolution or path MTU discovery. Security rules should allow necessary control traffic instead of treating all ICMP as optional ping traffic.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc8200", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "Small IPv6 requests succeed, but large responses stall after a lower-MTU tunnel is introduced. ICMPv6 Packet Too Big messages are blocked. What is the strongest explanation?", "options": ["IPv6 routers automatically fragment every large packet, so MTU cannot matter", "The sender is missing path-MTU feedback and may keep sending unusably large packets", "IPv6 addresses become too short when tunneled"], "answer": "The sender is missing path-MTU feedback and may keep sending unusably large packets", "explanation": "IPv6 routers do not fragment forwarded packets. Packet Too Big feedback helps endpoints choose an appropriate size; filtering it can create a path-MTU black hole. Transport probing can mitigate some cases but does not make required control traffic irrelevant.", "hint": "Recall which node may fragment in IPv6 and how the sender learns a smaller path MTU."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Public vs Private IP", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Private IPv4 ranges are reserved for internal networks and are not globally routed as public Internet destinations.", // Introduce the concept and explain why it matters.
        mechanism: "RFC 1918 defines 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. Separate organizations can reuse these ranges internally. Public addressing supports globally unique routing, subject to allocation and policy; NAT often maps private clients onto public addresses.", // Explain its actual operation with correct terminology.
        tradeoff: "Private addressing is not a security boundary by itself. Publicly addressed systems can still be firewalled, and private systems can be reached through tunnels, gateways, or misconfiguration.", // Record limitations and important interview distinctions.
        example: "A home laptop at 192.168.1.20 sends traffic through a NAT router whose external interface has a public address.", // Demonstrate a realistic use case or calculation.
        misconception: "Every address beginning with 172 is an RFC 1918 private address.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Is 172.20.1.5 within an RFC 1918 private range?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Yes. It falls inside 172.16.0.0 through 172.31.255.255.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "No. Only 192.168.0.0/16 can be private IPv4 space.", // Provide a plausible wrong choice for comparison.
        hard: "Why can two companies using the same private subnet encounter trouble after a merger or VPN connection?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Overlapping prefixes make destinations ambiguous: the same address can refer to different internal hosts. Routing cannot distinguish them solely from the destination IP. Renumbering, translation, segmented routing contexts, or application gateways may be needed; private reuse is convenient until networks must interconnect.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1918", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Subnetting", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Subnetting divides an address block into smaller prefixes by assigning more bits to the network portion.", // Introduce the concept and explain why it matters.
        mechanism: "An IPv4 /24 has 256 total addresses; splitting it into /26 blocks creates four blocks of 64 addresses. Conventional IPv4 subnets reserve network and broadcast addresses, while /31 point-to-point and /32 host routes have different semantics.", // Explain its actual operation with correct terminology.
        tradeoff: "Address counts and usable-host counts differ. Subnet design must account for routing, growth, and actual network conventions rather than always subtracting two blindly.", // Record limitations and important interview distinctions.
        example: "192.0.2.0/24 divides into 192.0.2.0/26, .64/26, .128/26, and .192/26.", // Demonstrate a realistic use case or calculation.
        misconception: "Subnetting increases the total number of addresses in the original allocation.", // Use a concept-specific misconception as a basic distractor.
        scenario: "How many total addresses are in an IPv4 /27 prefix?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "32 addresses, because 2^(32−27) = 32.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "27 addresses, because the prefix length is the address count.", // Provide a plausible wrong choice for comparison.
        hard: "How would you allocate variable-sized subnets for groups needing roughly 100, 50, and 20 conventional IPv4 hosts?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Choose prefixes large enough for each host requirement, commonly /25, /26, and /27 respectively, after accounting for reservations. Allocate larger aligned blocks first to avoid fragmentation, ensure they do not overlap, and leave deliberate growth capacity. Confirm the parent allocation is large enough.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc4632", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "CIDR", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Classless Inter-Domain Routing represents an IP prefix with an address and prefix length, enabling variable-sized allocation and route aggregation.", // Introduce the concept and explain why it matters.
        mechanism: "The prefix length counts leading network bits. Routers use longest-prefix matching: a more specific matching route wins over a broader aggregate. Aligned adjacent prefixes can sometimes be summarized to reduce routing-table size.", // Explain its actual operation with correct terminology.
        tradeoff: "Aggregation works only when the summary accurately represents reachable destinations and policy. An overbroad announcement can attract traffic for unreachable addresses.", // Record limitations and important interview distinctions.
        example: "A route to 203.0.113.0/24 is more specific than a default route /0 and therefore wins for 203.0.113.9.", // Demonstrate a realistic use case or calculation.
        misconception: "Routers always prefer the shortest matching prefix.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A table contains 10.0.0.0/8 and 10.20.0.0/16. Which prefix matches 10.20.3.4 most specifically?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "10.20.0.0/16.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "10.0.0.0/8, because fewer prefix bits always have higher priority.", // Provide a plausible wrong choice for comparison.
        hard: "Can two adjacent /24 blocks always be summarized into a /23?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Only if they share the correct aligned 23-bit prefix. For example, 192.0.2.0/24 and 192.0.3.0/24 form 192.0.2.0/23. Arbitrary adjacency without alignment is insufficient, and aggregation must also respect real reachability and routing policy.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc4632", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "Routes include 0.0.0.0/0, 10.0.0.0/8, and 10.20.0.0/16. For 10.20.5.8, what does ordinary longest-prefix forwarding select once these routes are installed?", "options": ["The /0 route because it matches all addresses", "The /8 route because shorter prefixes are preferred", "The /16 route because it is the most specific matching prefix"], "answer": "The /16 route because it is the most specific matching prefix", "explanation": "Forwarding first selects the longest matching destination prefix. Administrative preference and routing metrics help choose among candidate routes to the same prefix; they do not normally override a different installed, more-specific matching prefix.", "hint": "Separate control-plane route selection for a prefix from destination-prefix lookup in the forwarding table."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "NAT", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Network Address Translation rewrites IP addressing, and commonly transport ports, as packets cross an address-domain boundary.", // Introduce the concept and explain why it matters.
        mechanism: "A home router often performs port-address translation, maintaining mappings from private source address/port tuples to a public address/port. Return traffic is matched to connection state and translated back. Static mappings and port forwarding can permit selected inbound traffic.", // Explain its actual operation with correct terminology.
        tradeoff: "NAT conserves IPv4 addresses but complicates end-to-end connectivity, peer discovery, and protocols that embed addresses. NAT behavior alone is not equivalent to a well-defined firewall policy.", // Record limitations and important interview distinctions.
        example: "192.168.1.20:51000 can map to a public address port 62000, letting multiple internal clients share one external IPv4 address.", // Demonstrate a realistic use case or calculation.
        misconception: "NAT makes every internal application cryptographically secure.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An unsolicited Internet packet reaches a dynamic NAT with no matching mapping or forwarding rule. What commonly occurs?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The router cannot map it to an internal destination and drops it.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The router broadcasts it automatically to every private host.", // Provide a plausible wrong choice for comparison.
        hard: "Why do peer-to-peer applications need techniques such as STUN, TURN, or explicit forwarding behind NAT?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Private endpoints cannot assume that a public peer can initiate a direct connection to their internal tuple. Mapping and filtering behavior vary across NATs, and mappings expire. Discovery and hole punching can sometimes establish a path, while a relay provides a fallback when direct connectivity fails.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc3022", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "ICMP", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "ICMP carries IP control and error messages, including reachability diagnostics and time-exceeded or packet-too-big feedback.", // Introduce the concept and explain why it matters.
        mechanism: "IPv4 ICMP includes echo requests and replies, destination-unreachable messages, and time-exceeded messages. Tools such as ping and traceroute use selected messages; path MTU discovery also depends on appropriate control feedback.", // Explain its actual operation with correct terminology.
        tradeoff: "Failure to receive an echo reply does not prove an application is unavailable because ICMP may be filtered or deprioritized. Blocking every ICMP message can break useful network functions.", // Record limitations and important interview distinctions.
        example: "Traceroute varies packet TTL so routers return time-exceeded messages that reveal possible path hops.", // Demonstrate a realistic use case or calculation.
        misconception: "ICMP is only the ping command and has no other network purpose.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A host ignores ping but accepts HTTPS successfully. Is that contradictory?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. ICMP echo and TCP 443 can follow different filtering and service policies.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. A host cannot serve HTTPS unless it answers every echo request.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a large transfer hang while small requests work if ICMP feedback is blocked?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "A path MTU issue may prevent oversized packets from reaching the destination. If necessary fragmentation-needed or packet-too-big feedback is lost, the sender may keep using an unusable size. Diagnose packet sizes and PMTU behavior; allow required control messages or use suitable transport fallback mechanisms.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc792", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Routing Algorithms", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Routing algorithms compute paths through a network, while forwarding applies installed routes to individual packets.", // Introduce the concept and explain why it matters.
        mechanism: "Protocols exchange topology or reachability information and calculate selected routes based on metrics and policy. Distance-vector algorithms reason from neighbors advertised distances; link-state algorithms construct a topology view; path-vector routing carries path attributes.", // Explain its actual operation with correct terminology.
        tradeoff: "The numerically shortest path is not always the chosen path: administrative preferences, policy, stability, and protocol-specific metrics matter. Control-plane convergence takes time after changes.", // Record limitations and important interview distinctions.
        example: "A router may learn an internal path through OSPF and an external reachability announcement through BGP, then apply its route selection rules.", // Demonstrate a realistic use case or calculation.
        misconception: "Every router recomputes the entire Internet graph separately for each packet.", // Use a concept-specific misconception as a basic distractor.
        scenario: "What is the difference between selecting a route and forwarding a packet?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Routing builds the table; forwarding uses that table to choose a next hop for a packet.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Routing copies application files, while forwarding assigns domain names.", // Provide a plausible wrong choice for comparison.
        hard: "What trade-offs matter when choosing a routing protocol for a large network?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Consider convergence time, scale, memory and CPU costs, topology structure, policy needs, operational complexity, and failure behavior. A small simple network may not need the same algorithm as an inter-domain network where independent organizations require policy control. Separate routing protocol selection from data-plane longest-prefix matching.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1812", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Distance Vector Routing", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Distance-vector routing lets routers select destinations using costs advertised by neighboring routers.", // Introduce the concept and explain why it matters.
        mechanism: "A router combines a neighbors advertised distance with the cost to reach that neighbor, following a Bellman-Ford style recurrence. Updates communicate reachability changes. Loop mitigations include split horizon, poison reverse, and bounded infinity depending on the protocol.", // Explain its actual operation with correct terminology.
        tradeoff: "Routers do not necessarily know the full topology. Failures can produce transient loops and count-to-infinity behavior, so convergence and loop handling matter.", // Record limitations and important interview distinctions.
        example: "If neighbor B advertises cost 4 to network X and A-to-B costs 2, A can consider a route to X with total cost 6.", // Demonstrate a realistic use case or calculation.
        misconception: "Each distance-vector router must maintain a full link-state map of every physical link.", // Use a concept-specific misconception as a basic distractor.
        scenario: "B advertises distance 3 to a destination and A reaches B with cost 2. What candidate distance can A calculate?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "5, by adding the link cost to the advertised distance.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "1, by subtracting the link cost from the advertised distance.", // Provide a plausible wrong choice for comparison.
        hard: "Explain count-to-infinity after a destination fails.", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Neighbors can incorrectly infer that the other still has a route and repeatedly increase their advertised metric while routing traffic in a loop. Split horizon and poison reverse reduce some cases, but protocol design and topology affect convergence. A finite maximum metric bounds the process at the cost of limiting network diameter.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2453", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Link State Routing", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Link-state routing distributes local link information so routers can compute paths from a topology database.", // Introduce the concept and explain why it matters.
        mechanism: "Routers discover neighbors and flood link-state advertisements within a scope. Sequence numbers and aging help distinguish current information from stale records. Each router computes shortest paths, commonly using Dijkstra, from its own position in the resulting graph.", // Explain its actual operation with correct terminology.
        tradeoff: "Topology databases and recomputation consume memory and CPU. Areas and flooding scopes improve scale, while transient disagreement during convergence can still affect forwarding.", // Record limitations and important interview distinctions.
        example: "After a link fails, an OSPF router originates updated link-state information, and routers recalculate affected paths.", // Demonstrate a realistic use case or calculation.
        misconception: "Link-state routing selects paths without learning any link information.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Why do link-state advertisements include freshness information such as sequence numbers?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "To distinguish newer topology information from stale or duplicated advertisements.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "To assign a unique TCP port to every router advertisement.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a consistent link-state protocol still experience brief forwarding problems after a failure?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Information takes time to flood and routers do not install new forwarding entries simultaneously. During this interval, neighbors may use different path calculations, causing temporary loops or drops. Fast detection, incremental computation, careful topology design, and ordered convergence techniques can reduce the disruption.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2328", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "RIP", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "RIP is a distance-vector interior routing protocol that uses hop count and treats 16 hops as unreachable.", // Introduce the concept and explain why it matters.
        mechanism: "Routers exchange reachable networks and hop-count metrics, with periodic and triggered updates. RIPv2 supports subnet masks and classless prefixes. Split horizon and route poisoning help reduce routing loops.", // Explain its actual operation with correct terminology.
        tradeoff: "The maximum usable metric of 15 limits network size, and convergence is generally less suitable for large complex networks than modern alternatives. RIPv2 uses UDP port 520.", // Record limitations and important interview distinctions.
        example: "A route through three routers has a larger RIP metric than one through two routers even if the longer-hop path has faster links.", // Demonstrate a realistic use case or calculation.
        misconception: "RIP selects routes based on end-to-end bandwidth and supports unlimited hop count.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A RIP route reaches a metric of 16. What does that mean?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The destination is considered unreachable.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The route is preferred because a higher metric means more capacity.", // Provide a plausible wrong choice for comparison.
        hard: "Why might RIP choose a slower path than a bandwidth-aware routing metric?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "RIP counts hops rather than measuring link bandwidth or latency. A two-hop path over slow links can beat a three-hop path over fast links. This simplicity reduces configuration burden but limits optimization and scale, so protocol choice should follow network requirements.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2453", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "OSPF", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "OSPF is a link-state interior gateway protocol that computes shortest paths within an autonomous system using configurable costs.", // Introduce the concept and explain why it matters.
        mechanism: "Routers establish adjacencies, synchronize link-state databases, and run shortest-path calculations. Areas limit topology scope, with backbone area 0 connecting the area hierarchy. On suitable multiaccess networks, designated routers reduce adjacency overhead.", // Explain its actual operation with correct terminology.
        tradeoff: "OSPF costs are often derived from interface bandwidth but are configurable. Area design, adjacency parameters, and database consistency affect operations; OSPF is not the global inter-domain policy protocol.", // Record limitations and important interview distinctions.
        example: "Two equal-cost OSPF paths can support equal-cost multipath when the implementation and configuration allow it.", // Demonstrate a realistic use case or calculation.
        misconception: "OSPF routes between independent Internet organizations using AS-path policy.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Which area serves as the OSPF backbone in a conventional multi-area design?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Area 0.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The numerically largest configured area.", // Provide a plausible wrong choice for comparison.
        hard: "Why can two directly connected OSPF routers fail to become fully adjacent?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Check matching area, authentication, hello/dead intervals, network type, addressing, and MTU behavior. Some multiaccess neighbors remain in 2-Way as expected if neither needs a full adjacency. Interpret neighbor state in context before assuming every non-Full entry is a fault.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2328", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "BGP", // Name this specific networking concept.
        module: "Network Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "BGP exchanges inter-domain reachability and path attributes, allowing autonomous systems to apply routing policy.", // Introduce the concept and explain why it matters.
        mechanism: "BGP advertises prefixes with attributes such as AS_PATH and NEXT_HOP over TCP sessions, traditionally port 179. Route selection considers policy and attributes; AS path information helps prevent straightforward inter-domain loops.", // Explain its actual operation with correct terminology.
        tradeoff: "BGP is not simply shortest-path routing. Business relationships, filtering, local preference, and security controls can outweigh hop count. Invalid or leaked announcements can disrupt global reachability.", // Record limitations and important interview distinctions.
        example: "A provider can prefer a customer route using local preference even when another advertised path has fewer autonomous systems.", // Demonstrate a realistic use case or calculation.
        misconception: "BGP always chooses the physically shortest route with the lowest latency.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An operator wants to prefer one exit within its own AS regardless of shorter external AS paths. Which common attribute is relevant?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Local preference, applied according to internal routing policy.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The destination applications HTTP Content-Type header.", // Provide a plausible wrong choice for comparison.
        hard: "How do route filtering and RPKI origin validation reduce BGP risk, and what do they not prove?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Prefix and AS filters limit unwanted announcements; RPKI origin validation checks whether an origin AS is authorized for a prefix under available ROAs. It does not validate every AS-path hop or guarantee route availability. Operators still need sound policy, monitoring, and handling for unknown or invalid origins.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc4271", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "An organization receives two valid routes for the same prefix. Its policy assigns route A local preference 200 and route B local preference 100, while B has a shorter AS path. In conventional BGP decision ordering, which route is preferred?", "options": ["Route B, because AS-path length always overrides local policy", "Route A, because higher local preference is considered before AS-path length", "Both are discarded because local preferences differ"], "answer": "Route A, because higher local preference is considered before AS-path length", "explanation": "Local preference expresses policy within the AS and conventionally precedes AS-path length in BGP best-path selection. BGP is policy-driven, so the shortest AS path is not an unconditional winner.", "hint": "Consider why an AS may prefer a customer route over a cheaper-looking external path."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "MAC Address", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A MAC address identifies a link-layer interface in technologies such as Ethernet, commonly using a 48-bit value.", // Introduce the concept and explain why it matters.
        mechanism: "An Ethernet frame carries source and destination MAC addresses for delivery on a local link. Switches learn source addresses and associate them with ports. The least significant bit of the first octet distinguishes individual from group addresses.", // Explain its actual operation with correct terminology.
        tradeoff: "MAC addresses can be locally administered, randomized, or spoofed, so they are not reliable proof of device identity. Remote Internet routers do not forward using the original hosts Ethernet destination address.", // Record limitations and important interview distinctions.
        example: "A laptop sends a frame to its default gateways MAC address when the IP destination is on another network.", // Demonstrate a realistic use case or calculation.
        misconception: "A MAC address is a globally trustworthy permanent user authentication credential.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A laptop sends an IP packet to a remote network. Which destination MAC appears on its local Ethernet frame?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The next-hop routers MAC address, typically the default gateway.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The remote web servers MAC address obtained across the entire Internet.", // Provide a plausible wrong choice for comparison.
        hard: "Why is MAC-based access control insufficient for strong authentication?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "MAC values are visible on local traffic and can often be changed in software. Wireless devices can randomize them for privacy, and bridges may expose different addressing behavior. Use authenticated network access mechanisms and cryptographic identity where strong access control is required.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc7042", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "ARP", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "ARP resolves an IPv4 address to a link-layer address on the local network.", // Introduce the concept and explain why it matters.
        mechanism: "A host broadcasts an ARP request asking for the hardware address associated with a target IPv4 address. The owner replies and neighbors cache the mapping. For an off-subnet destination, the host resolves the local next-hop gateway rather than the remote host.", // Explain its actual operation with correct terminology.
        tradeoff: "ARP has no built-in cryptographic authentication, allowing spoofed mappings on a shared segment. IPv6 uses Neighbor Discovery rather than ARP.", // Record limitations and important interview distinctions.
        example: "Before sending to gateway 192.168.1.1, a host can broadcast an ARP request and cache the returned Ethernet address.", // Demonstrate a realistic use case or calculation.
        misconception: "ARP looks up remote websites domain names using recursive DNS servers.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A host needs to reach 203.0.113.10 through its gateway. Which IPv4 address should it ARP for on its local link?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The local gateway address.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "203.0.113.10, even though that host is across multiple routers.", // Provide a plausible wrong choice for comparison.
        hard: "How can ARP spoofing redirect local traffic, and what mitigations help?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "An attacker can advertise a false IP-to-MAC mapping for a gateway so neighbors send frames to the attacker. Managed switches can use dynamic ARP inspection with trusted binding information; segmentation and endpoint protections reduce exposure. End-to-end TLS still matters because link-layer controls alone do not protect application content.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc826", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Switch vs Hub vs Router", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A hub repeats physical signals, a switch forwards link-layer frames, and a router forwards network-layer packets between IP networks.", // Introduce the concept and explain why it matters.
        mechanism: "A hub shares one collision domain. An Ethernet switch learns MAC-to-port mappings and selectively forwards known unicast frames. A router looks up destination IP prefixes and sends packets toward a next hop, normally separating broadcast domains.", // Explain its actual operation with correct terminology.
        tradeoff: "Modern devices can combine roles, such as a home router containing a switch and wireless access point. Product names do not replace understanding the forwarding function.", // Record limitations and important interview distinctions.
        example: "A home device may switch traffic between LAN ports but route and translate traffic traveling from the LAN to the Internet.", // Demonstrate a realistic use case or calculation.
        misconception: "A basic Ethernet hub maintains an IP routing table and isolates every broadcast.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A frame is addressed to a known MAC on switch port 3. What does a typical switch do?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Forward it toward port 3 rather than repeating it on every port.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Broadcast it through every Internet router regardless of the destination.", // Provide a plausible wrong choice for comparison.
        hard: "Why does adding a switch not necessarily stop broadcast storms?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Switches normally flood broadcasts within a VLAN. Loops or excessive broadcast sources can therefore affect the whole broadcast domain. Loop prevention, storm controls, and segmentation are needed; routers or layer-3 boundaries normally stop ordinary layer-2 broadcasts.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/network-switch-how.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Ethernet", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Ethernet is a family of link-layer and physical standards for carrying frames across wired local networks.", // Introduce the concept and explain why it matters.
        mechanism: "An Ethernet frame includes destination and source MAC addresses, an EtherType or length field, payload, and a frame check sequence. Modern switched full-duplex links permit simultaneous sending and receiving without collision arbitration.", // Explain its actual operation with correct terminology.
        tradeoff: "CSMA/CD belongs to shared half-duplex Ethernet and is not used on ordinary full-duplex switched links. Frame checks detect errors but do not encrypt content or guarantee end-to-end delivery.", // Record limitations and important interview distinctions.
        example: "A host wraps an IPv4 packet in an Ethernet frame with EtherType 0x0800 for the local hop.", // Demonstrate a realistic use case or calculation.
        misconception: "All modern full-duplex Ethernet links require collision backoff for each frame.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Two endpoints use full-duplex switched Ethernet. Must they detect collisions before transmitting?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Full-duplex point-to-point Ethernet does not use CSMA/CD.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. Every Ethernet transmission reserves a shared collision bus.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a bad Ethernet FCS not be repaired simply by the IP layer at that hop?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "The receiver generally discards the corrupted frame rather than delivering an untrusted packet upward. Ethernet error detection identifies damage but does not supply arbitrary correction. Recovery may come from a reliable higher-level transport or an application retry, depending on the protocol.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://standards.ieee.org/ieee/802.3/10422/", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Error Detection", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Error detection adds redundant information so a receiver can identify some forms of data corruption.", // Introduce the concept and explain why it matters.
        mechanism: "Parity, checksums, and CRCs derive check information from message bits. The receiver recomputes and compares it. Different schemes have different mathematical guarantees and detection strength for random errors and burst patterns.", // Explain its actual operation with correct terminology.
        tradeoff: "Detection is different from correction, authentication, and retransmission. Finite checks cannot detect every possible arbitrary corruption, and unkeyed checks do not defend against deliberate modification.", // Record limitations and important interview distinctions.
        example: "Ethernet uses an FCS based on CRC; a receiver drops a frame when the computed check disagrees with the received value.", // Demonstrate a realistic use case or calculation.
        misconception: "An ordinary CRC is a cryptographic signature proving who sent the message.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A corrupted frame fails its FCS. What has the receiver established?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The received bits failed the error-detection check; recovery needs a separate mechanism.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The receiver now knows exactly which original payload bits to restore.", // Provide a plausible wrong choice for comparison.
        hard: "Why should an application use authenticated encryption even if every link has a CRC?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Link checks are unkeyed and hop-scoped, so an attacker can alter data and recompute them. Authenticated encryption uses secret-key cryptographic integrity across the intended security boundary. It also protects confidentiality, which a CRC does not address.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc3385", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Parity", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A parity bit makes the total number of set bits in a protected group even or odd, depending on the scheme.", // Introduce the concept and explain why it matters.
        mechanism: "For even parity, the sender chooses one extra bit so the full group contains an even number of ones. The receiver checks that property. A single changed bit toggles parity and is detected, while an even number of flipped bits can cancel.", // Explain its actual operation with correct terminology.
        tradeoff: "Simple parity detects every odd number of bit flips but does not detect all even-numbered errors and does not locate the erroneous bit. Stronger codes add more structured redundancy.", // Record limitations and important interview distinctions.
        example: "The data 1011 contains three ones, so even parity adds a 1 to make four ones in total.", // Demonstrate a realistic use case or calculation.
        misconception: "One parity bit identifies and corrects any two corrupted bits.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Can a simple even-parity check miss exactly two flipped bits?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Yes. Two flips preserve the even/odd count.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "No. One parity bit detects every possible corruption.", // Provide a plausible wrong choice for comparison.
        hard: "How does two-dimensional parity improve on a single parity bit, and what remains limited?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Row and column parity can locate a single erroneous bit at their intersection and can detect more patterns. Some multi-bit patterns still cancel across rows and columns, so the scheme is not universal error correction. State the assumed error model when claiming detection or correction capability.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc3385", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "CRC", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A cyclic redundancy check treats a bit string as a polynomial and computes a remainder using a chosen generator polynomial.", // Introduce the concept and explain why it matters.
        mechanism: "The sender appends check bits derived by polynomial division over GF(2), where subtraction is XOR. The receiver applies the same polynomial rule to detect inconsistent remainders. Polynomial choice determines guarantees for error patterns and frame lengths.", // Explain its actual operation with correct terminology.
        tradeoff: "CRCs are efficient and strong against many burst errors but are not cryptographic message authentication. An attacker can deliberately modify a message and recompute its CRC.", // Record limitations and important interview distinctions.
        example: "Ethernet CRC-32 forms the frame check sequence so corrupted frames can be rejected on the local link.", // Demonstrate a realistic use case or calculation.
        misconception: "CRC uses a secret signing key shared with the sender.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An attacker changes a payload and recomputes its CRC correctly. Does an ordinary CRC expose the forgery?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. A CRC provides accidental-error detection, not keyed authenticity.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. A valid CRC cryptographically identifies the original sender.", // Provide a plausible wrong choice for comparison.
        hard: "Why do CRC specifications need to agree on more than the polynomial name?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Initial values, input and output reflection, final XOR rules, bit order, and the exact protected bytes all affect the result. Two implementations can use the same polynomial but produce different check values. Interoperability requires the complete algorithm parameters and known test vectors.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc3385", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Checksum", // Name this specific networking concept.
        module: "Data Link Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "A checksum combines data into a smaller check value used to detect selected accidental errors.", // Introduce the concept and explain why it matters.
        mechanism: "The Internet checksum sums 16-bit words using ones-complement arithmetic and stores the complemented result. TCP and UDP include an IP pseudo-header in their checksum coverage, helping detect certain misdelivery errors as well as payload corruption.", // Explain its actual operation with correct terminology.
        tradeoff: "Checksums can miss some patterns and are not authentication. IPv4 checksums only its header, while TCP covers transport data; IPv6 has no equivalent base-header checksum.", // Record limitations and important interview distinctions.
        example: "A TCP checksum covers TCP header, payload, and a pseudo-header containing IP addressing and protocol-related fields.", // Demonstrate a realistic use case or calculation.
        misconception: "The IPv4 header checksum always validates the complete application payload.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Which IPv4 checksum covers only the IPv4 header rather than its payload?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The IPv4 header checksum.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The TCP checksum, which never includes transport payload.", // Provide a plausible wrong choice for comparison.
        hard: "Why does TCP checksum coverage include an IP pseudo-header?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Including source and destination addressing plus protocol and length information helps detect corruption or misdelivery affecting the context in which a segment is interpreted. It does not transform the checksum into cryptographic integrity; an active attacker can recompute an unkeyed checksum.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc1071", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Guided vs Unguided Transmission", // Name this specific networking concept.
        module: "Physical Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Guided transmission carries signals through a physical medium such as copper or fiber; unguided transmission uses electromagnetic propagation through space.", // Introduce the concept and explain why it matters.
        mechanism: "Twisted pair and coaxial cables guide electrical signals, while optical fiber guides light. Wireless links use antennas and frequency bands with propagation affected by distance, interference, obstacles, and regulation.", // Explain its actual operation with correct terminology.
        tradeoff: "Wired links can offer controlled paths and capacity; wireless adds mobility and deployment flexibility but shares spectrum and faces variable conditions. Fiber is resistant to electromagnetic interference but still requires physical handling and optical budgets.", // Record limitations and important interview distinctions.
        example: "An office uses fiber between buildings and Wi-Fi for mobile laptops, choosing media for different mobility and distance requirements.", // Demonstrate a realistic use case or calculation.
        misconception: "Wireless signals never experience interference because there is no physical cable.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A factory has strong electromagnetic interference across a long cable route. Which guided medium can reduce that interference concern?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Optical fiber, which carries light rather than electrical signals.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Unshielded copper, because all electrical signals are immune to interference.", // Provide a plausible wrong choice for comparison.
        hard: "What factors would you compare before replacing a wired connection with wireless?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Evaluate required capacity, latency and jitter, mobility, distance, obstacles, interference, reliability, security, spectrum limits, installation cost, and maintenance. A nominal wireless link rate is not guaranteed application throughput because airtime sharing and retransmissions affect actual performance.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/wireless-network.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Transmission Media", // Name this specific networking concept.
        module: "Physical Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Transmission media are the physical paths carrying network signals, including twisted-pair copper, coaxial cable, optical fiber, and radio.", // Introduce the concept and explain why it matters.
        mechanism: "Medium characteristics determine attenuation, interference sensitivity, achievable signaling rates, distance, and transceiver requirements. Fiber may be single-mode for longer reach or multimode for shorter deployments; copper standards specify cable categories and channel limits.", // Explain its actual operation with correct terminology.
        tradeoff: "The medium alone does not determine end-to-end speed: transceivers, encoding, link negotiation, and bottlenecks also matter. A cable upgrade cannot overcome an unchanged slow endpoint port.", // Record limitations and important interview distinctions.
        example: "A fiber cable attached to 1 Gb/s transceivers provides a 1 Gb/s link even if the fiber could support a faster optical system.", // Demonstrate a realistic use case or calculation.
        misconception: "Installing fiber automatically makes every connected endpoint operate at unlimited speed.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A 10 Gb/s-capable cable joins two ports that negotiate 1 Gb/s. What is the active link speed?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "1 Gb/s, unless the endpoints and negotiation change.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "10 Gb/s, because cable capability overrides endpoint hardware.", // Provide a plausible wrong choice for comparison.
        hard: "Why do optical deployments need a link-budget calculation?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Transmit power must remain sufficient after fiber attenuation, connectors, splices, and engineering margins while avoiding receiver overload. Wavelength, distance, optics type, and fiber compatibility all matter. Physical connectivity alone does not guarantee a usable optical signal.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/products/interfaces-modules/transceiver-modules/index.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Network Devices", // Name this specific networking concept.
        module: "Physical Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Network devices perform roles such as repeating signals, bridging frames, routing packets, providing wireless access, and enforcing traffic policy.", // Introduce the concept and explain why it matters.
        mechanism: "Access points bridge wireless clients onto a distribution network. Switches connect local links, routers connect IP networks, modems adapt signals to an access technology, and firewalls apply policy. A single appliance may implement several of these functions.", // Explain its actual operation with correct terminology.
        tradeoff: "Device role and forwarding behavior are more informative than a consumer product label. Security and performance depend on the configured function and traffic path.", // Record limitations and important interview distinctions.
        example: "A home gateway may contain a router, NAT, firewall, Ethernet switch, DHCP server, and Wi-Fi access point in one box.", // Demonstrate a realistic use case or calculation.
        misconception: "Every Wi-Fi access point must also perform Internet NAT and routing.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An access point bridges Wi-Fi clients into an existing LAN with a separate gateway. Must it perform NAT?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Bridging wireless and wired links does not inherently require NAT.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. Every wireless frame must be translated into a public IP address.", // Provide a plausible wrong choice for comparison.
        hard: "How would you identify which device is responsible when clients connect to Wi-Fi but receive no address?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Separate radio association from IP configuration. Check the access point bridge or VLAN path, DHCP relay or server reachability, pool capacity, and client exchange. The wireless device may be working correctly while a separate DHCP service or VLAN configuration fails.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Bandwidth", // Name this specific networking concept.
        module: "Physical Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Physical bandwidth is a frequency-range measure in hertz, while networking commonly uses bandwidth informally to mean data-rate capacity in bits per second.", // Introduce the concept and explain why it matters.
        mechanism: "Signaling design converts physical channel characteristics into a feasible data rate using modulation, coding, and error protection. Noise and available spectrum limit reliable communication; channel capacity and application throughput are related but different quantities.", // Explain its actual operation with correct terminology.
        tradeoff: "Always clarify units. A 20 MHz wireless channel is not a 20 Mb/s guarantee, and protocol overhead, sharing, and radio conditions reduce delivered goodput below raw signaling rates.", // Record limitations and important interview distinctions.
        example: "Two wireless systems using the same channel width can achieve different data rates because modulation, coding, antenna streams, and signal quality differ.", // Demonstrate a realistic use case or calculation.
        misconception: "A 20 MHz channel necessarily delivers exactly 20 megabytes per second.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Why can two radios on 20 MHz channels report different link rates?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "They can use different modulation, coding, antenna streams, and signal quality.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Channel width alone fixes every link rate, so one device must be defective.", // Provide a plausible wrong choice for comparison.
        hard: "How would you explain the difference between spectrum width, link rate, and application throughput?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Spectrum width describes the frequency resources. The link rate describes encoded transmission speed for a selected physical mode. Application throughput removes shared airtime, protocol overhead, retransmissions, and bottleneck effects. Measuring one does not directly establish the others.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc5136", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Network Topologies", // Name this specific networking concept.
        module: "Physical Layer", // Group the lesson in the requested curriculum hierarchy.
        definition: "Physical topology describes actual cabling or radio relationships, while logical topology describes how traffic is permitted to flow.", // Introduce the concept and explain why it matters.
        mechanism: "A collection of redundant cables can form a physical mesh while spanning tree selects a loop-free logical tree. Wireless communication shares radio resources even when a diagram draws clients as a star around an access point.", // Explain its actual operation with correct terminology.
        tradeoff: "Diagrams should distinguish physical redundancy from active forwarding paths. A spare link does not provide usable failover unless protocols and configuration support it.", // Record limitations and important interview distinctions.
        example: "Two switches connected by redundant links need a loop-safe design such as link aggregation or spanning tree rather than uncontrolled parallel bridging.", // Demonstrate a realistic use case or calculation.
        misconception: "Every physically connected link must always forward all Ethernet broadcasts.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Two switches have two physical links but spanning tree blocks one. How many links forward ordinary traffic for that tree?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "One active link, while the other can provide redundancy after convergence.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Both must forward identical broadcasts continuously regardless of loops.", // Provide a plausible wrong choice for comparison.
        hard: "Why should a network diagram label VLANs, aggregation, and blocked links instead of showing cables alone?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Those labels explain actual forwarding domains and active paths. Physical cabling does not reveal whether traffic is isolated, aggregated, or blocked by a loop-prevention protocol. Clear diagrams make failure analysis and capacity planning possible without assuming every drawn cable contributes independent usable bandwidth.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-network-topology.html", // Link to independent protocol or technical documentation.
        slug: "physical-network-topologies", // Disambiguate this title from its appearance in another module.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Client-Server Architecture", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "Client-server architecture separates service consumers from processes that provide shared data or capabilities.", // Introduce the concept and explain why it matters.
        mechanism: "A client sends a request using an agreed protocol and a server processes it and returns a response or stream. Servers can scale horizontally behind a load balancer; persistent state may live in databases, caches, and object storage rather than one process.", // Explain its actual operation with correct terminology.
        tradeoff: "Centralized service control simplifies policy and consistency but creates availability and scaling concerns. A server is a role, not necessarily one physical machine.", // Record limitations and important interview distinctions.
        example: "A browser requests a lesson from an API service, which checks the session and queries a database before returning the user-specific progress.", // Demonstrate a realistic use case or calculation.
        misconception: "Client-server architecture requires one irreplaceable physical server for all users.", // Use a concept-specific misconception as a basic distractor.
        scenario: "An API moves from one instance to five behind a load balancer. What should happen to session state for reliable routing?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Use shared session storage or another deliberate strategy rather than assuming each process sees every session.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Keep each session only in one random process and route every request arbitrarily.", // Provide a plausible wrong choice for comparison.
        hard: "What can fail when a formerly single-instance application scales horizontally?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "In-memory sessions, local file assumptions, process-local locks, and uncoordinated scheduled jobs may stop working consistently. Move shared durable state into suitable services, design idempotent operations, coordinate background work, and make failure handling explicit. Stateless request handling simplifies routing but does not eliminate application state.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Peer-to-Peer Architecture", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "Peer-to-peer systems let participating nodes both consume and provide resources or services to one another.", // Introduce the concept and explain why it matters.
        mechanism: "Peers discover participants, exchange data, and often coordinate distributed state without routing every payload through one central server. Discovery, identity, and bootstrap services may still be centralized or partially centralized.", // Explain its actual operation with correct terminology.
        tradeoff: "P2P can distribute bandwidth and improve resilience but faces churn, untrusted peers, consistency, discovery, and NAT traversal challenges. Decentralized data transfer does not imply the absence of all coordination services.", // Record limitations and important interview distinctions.
        example: "A file-sharing swarm downloads different verified chunks from several peers, while a tracker or distributed table helps discover them.", // Demonstrate a realistic use case or calculation.
        misconception: "A peer-to-peer system guarantees that every peer is trusted and always online.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A P2P file has chunks from untrusted peers. What helps detect corrupted chunks?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Verify chunks against trusted integrity metadata or an authenticated content-addressing scheme.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Accept every chunk because distributed delivery proves correctness.", // Provide a plausible wrong choice for comparison.
        hard: "How does churn change the design of a peer-to-peer system?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Peers can disappear or change address at any time, so discovery, replication, timeout handling, and retry strategies must adapt. Data availability requires enough independent replicas, and integrity must be checked independently of peer identity. NAT or restrictive firewalls can require relays despite peer-oriented architecture.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc5694", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "DHCP", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "DHCP automatically supplies hosts with leased IP configuration, commonly including address, subnet mask, gateway, and DNS resolver information.", // Introduce the concept and explain why it matters.
        mechanism: "Initial DHCPv4 allocation commonly follows Discover, Offer, Request, Acknowledge over UDP ports 68 and 67. Leases have renewal behavior, and relay agents can forward client requests to servers on other subnets.", // Explain its actual operation with correct terminology.
        tradeoff: "A lease is temporary configuration, not proof of identity. Broadcast reachability, relay settings, scope exhaustion, and rogue servers can all cause failures or unsafe configuration.", // Record limitations and important interview distinctions.
        example: "A new laptop broadcasts discovery, accepts an offered address, and receives a lease with its gateway and DNS resolver settings.", // Demonstrate a realistic use case or calculation.
        misconception: "DHCP assigns permanent cryptographic identities that cannot be spoofed.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Clients on another VLAN cannot reach a centralized DHCP server through ordinary broadcasts. What feature can help?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "A DHCP relay configured for that subnet.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "An HTTP redirect returned by the website clients plan to visit.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a client retain local connectivity but lose Internet access after a bad DHCP response?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "The offered address might fit the local subnet while the supplied default gateway or DNS resolver is wrong. Validate the entire lease, not just the address. DHCP snooping and trusted-server controls can reduce rogue-server risk, while routing and resolver tests distinguish gateway from name-resolution failures.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc2131", // Link to independent protocol or technical documentation.
        diagram: ["Client → broadcast: DHCPDISCOVER", "Server → client: DHCPOFFER", "Client → server: DHCPREQUEST", "Server → client: DHCPACK with lease and configuration"], // Show an ordered workflow to reinforce visual understanding.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Firewall", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "A firewall enforces rules controlling which traffic may cross a host or network boundary.", // Introduce the concept and explain why it matters.
        mechanism: "Stateless filtering checks individual packet fields; stateful filtering tracks connection context. Application-aware controls can inspect higher-level behavior where visibility permits. Rules commonly combine source, destination, protocol, port, direction, and connection state.", // Explain its actual operation with correct terminology.
        tradeoff: "A firewall does not prove application correctness or replace authentication and encryption. Rule order, default policy, IPv6 parity, and actual traffic path must be reviewed.", // Record limitations and important interview distinctions.
        example: "A stateful policy can allow outbound HTTPS and related return traffic while denying unsolicited inbound connections.", // Demonstrate a realistic use case or calculation.
        misconception: "A firewall automatically fixes injection vulnerabilities in every application behind it.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A firewall allows a clients outbound TCP connection and established replies. Must it open every inbound port to receive the response?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Stateful tracking can permit return traffic for the established connection.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. Returning packets are unrelated to the outbound connection.", // Provide a plausible wrong choice for comparison.
        hard: "Why can an allow rule for a trusted source IP be insufficient authorization?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "IP addresses can represent shared NAT users, reassigned hosts, compromised systems, or spoofable traffic depending on protocol and position. Use identity and application authorization for sensitive actions, keep network rules narrowly scoped, and log policy outcomes. A network boundary supplements rather than replaces service security.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://csrc.nist.gov/pubs/sp/800/41/r1/final", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "VPN", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "A VPN creates a protected logical network path across another network, commonly by tunneling traffic with authentication and encryption.", // Introduce the concept and explain why it matters.
        mechanism: "A tunnel encapsulates inner packets within an outer transport between VPN endpoints. Remote-access VPNs connect users to a network; site-to-site VPNs connect networks. Routing determines whether all traffic or selected prefixes use the tunnel.", // Explain its actual operation with correct terminology.
        tradeoff: "A VPN protects traffic only across its tunnel and shifts trust to the VPN endpoint. It does not make a malicious website safe or guarantee anonymity. Encapsulation adds overhead and can affect MTU.", // Record limitations and important interview distinctions.
        example: "A remote developer reaches an internal 10.0.0.0/8 service through a VPN while split tunneling leaves ordinary public browsing on the local connection.", // Demonstrate a realistic use case or calculation.
        misconception: "A VPN prevents every endpoint compromise and makes all online activity untraceable.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A split-tunnel VPN routes only company subnets. Does ordinary public browsing necessarily pass through the VPN?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. Only traffic selected by the tunnel routing policy does.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. Every VPN configuration encrypts all device traffic through one endpoint.", // Provide a plausible wrong choice for comparison.
        hard: "What failure modes should be considered when a VPN connects overlapping private subnets?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Identical address ranges can make remote and local destinations ambiguous. Route priority might send traffic to the wrong network. Renumbering, translation, separate routing contexts, or application-specific access can resolve the conflict. Also account for DNS selection, MTU overhead, and least-privilege access to the remote network.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.rfc-editor.org/rfc/rfc4301", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Load Balancing", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "Load balancing distributes work across multiple service instances according to a routing strategy and health information.", // Introduce the concept and explain why it matters.
        mechanism: "Layer-4 balancing can distribute transport connections; layer-7 balancing can route using HTTP hostnames, paths, or other application metadata. Common algorithms include round robin, least connections, and hashing. Health checks remove unsuitable targets from selection.", // Explain its actual operation with correct terminology.
        tradeoff: "Even distribution is not always the right goal because request costs differ. Stateful sessions, graceful draining, retry side effects, and health-check accuracy influence reliability.", // Record limitations and important interview distinctions.
        example: "A reverse proxy sends /api requests to healthy API instances and /assets requests to a separate static origin.", // Demonstrate a realistic use case or calculation.
        misconception: "A load balancer automatically makes every database transaction safe to execute twice.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A proxy retries a timed-out payment request on another instance. What application concern must be addressed?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Idempotency or deduplication, because the first instance may already have applied the payment.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Only CSS caching, because backend side effects cannot occur before a timeout.", // Provide a plausible wrong choice for comparison.
        hard: "Why can a healthy process still be a bad load-balancer target?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "A shallow check can confirm that the process responds while its database dependency, worker pool, or critical endpoint is failing. Health checks should reflect useful readiness without overloading dependencies or causing synchronized flapping. Distinguish liveness, readiness, load, and graceful shutdown behavior.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://www.nginx.com/resources/glossary/load-balancing/", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "CDN", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "A content delivery network serves suitable content from distributed edge locations to reduce origin load and user-perceived latency.", // Introduce the concept and explain why it matters.
        mechanism: "An edge cache reuses representations according to cache keys, freshness, and validation rules. DNS or routing steers clients toward an edge. On a miss, the edge fetches from an origin and may store the response when policy permits.", // Explain its actual operation with correct terminology.
        tradeoff: "Incorrect cache keys or caching private responses can leak user data. Invalidation, personalized content, cookies, query parameters, and Vary behavior require deliberate configuration.", // Record limitations and important interview distinctions.
        example: "A versioned JavaScript asset can be cached for a long time, while a personalized dashboard response should usually avoid shared public caching.", // Demonstrate a realistic use case or calculation.
        misconception: "A CDN should publicly cache every authenticated users dashboard using the URL alone.", // Use a concept-specific misconception as a basic distractor.
        scenario: "Two signed-in users request /api/profile. What is dangerous about a shared cache keyed only by the path?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "One users private response could be reused for another user.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Nothing: all HTTP responses are inherently public.", // Provide a plausible wrong choice for comparison.
        hard: "How can versioned asset URLs simplify cache invalidation?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "A content hash or version in the URL gives each asset revision a new cache key. Old copies can remain safely cached while HTML references the new version. This does not solve stale HTML, sensitive response caching, or every deployment ordering issue, so configure those separately.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", // Link to independent protocol or technical documentation.
        hardQuiz: {"prompt": "A CDN caches GET /api/profile using only the URL, and the origin returns different private JSON for each session. What change most directly prevents one user receiving another users cached profile?", "options": ["Make the cache TTL longer so profiles change less frequently", "Disable shared caching of this private response, or use a correctly isolated authenticated cache policy", "Compress the JSON before storing it under the same shared key"], "answer": "Disable shared caching of this private response, or use a correctly isolated authenticated cache policy", "explanation": "A path-only cache key can reuse one authenticated representation across users. A suitable Cache-Control policy such as private or no-store, correctly honored by the CDN, avoids shared reuse; deliberately caching personalized responses requires a complete isolation design.", "hint": "Identify which parts of the request determine the representation and whether a shared cache may reuse it."}, // Add a separately scored interview-level MCQ while retaining the descriptive Hard checkpoint.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "How a URL Works", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "A URL identifies a resource using components such as scheme, host, optional port, path, query, and fragment.", // Introduce the concept and explain why it matters.
        mechanism: "The scheme selects interpretation and protocol behavior. The host can require DNS resolution; the port identifies a transport service; path and query are sent as part of an HTTP request target. A fragment is normally interpreted by the client and is not sent in the HTTP request target.", // Explain its actual operation with correct terminology.
        tradeoff: "Encoding and normalization are security-sensitive. Query strings can appear in logs, and a lock icon does not imply that every URL component or linked resource is safe.", // Record limitations and important interview distinctions.
        example: "In https://example.com:8443/lessons?id=7#notes, the explicit port is 8443, the path is /lessons, the query is id=7, and notes is a client-side fragment.", // Demonstrate a realistic use case or calculation.
        misconception: "The browser sends the URL fragment to the server as part of every HTTP request target.", // Use a concept-specific misconception as a basic distractor.
        scenario: "For https://example.com/a?x=1#section, which component is normally omitted from the HTTP request target?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "The fragment, #section.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "The path, /a, because servers never receive paths.", // Provide a plausible wrong choice for comparison.
        hard: "Why should an application use a proper URL parser for redirects and allowlists?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Userinfo syntax, encoded characters, relative references, Unicode names, ports, and normalization can defeat naive string checks. Parse once with a standards-aware implementation, compare the intended origin or host fields, and apply clear scheme and destination rules before redirecting or fetching.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/API/URL", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "What Happens When You Enter a URL in a Browser?", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "A browser navigation resolves a resource address, establishes or reuses a connection, requests content, and interprets the response to render a page.", // Introduce the concept and explain why it matters.
        mechanism: "The browser parses the URL, checks relevant caches and service workers, resolves the hostname when needed, and establishes TCP plus TLS or QUIC as appropriate. It sends HTTP requests, follows permitted redirects, parses HTML and CSS, executes scripts, and fetches additional resources.", // Explain its actual operation with correct terminology.
        tradeoff: "There is no single mandatory fresh DNS or TCP handshake for every navigation: caching, connection reuse, preloading, proxies, and protocol version change the sequence. Rendering and network transfer can overlap.", // Record limitations and important interview distinctions.
        example: "An initial HTML response references a stylesheet and JavaScript bundle; the browser schedules those requests while parsing and later updates layout and paint.", // Demonstrate a realistic use case or calculation.
        misconception: "Every navigation must start a new TCP connection even when an existing suitable connection is available.", // Use a concept-specific misconception as a basic distractor.
        scenario: "A browser already has a suitable HTTP/2 connection to the origin. Must a second page request perform another TCP handshake?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "No. It can reuse the existing connection when browser and protocol rules permit.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Yes. HTTP/2 forbids multiple requests on one connection.", // Provide a plausible wrong choice for comparison.
        hard: "How would you investigate a page that loads slowly only on the first visit?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Inspect navigation timing and resource waterfalls to separate DNS, connection and TLS setup, server response time, transfer, parsing, and rendering. Compare cold and warm caches, connection reuse, bundle sizes, and blocking resources. Avoid attributing all delay to server execution when setup or client work may dominate.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work", // Link to independent protocol or technical documentation.
        diagram: ["Parse URL and check browser policies/caches", "Resolve DNS when no suitable cached answer exists", "Establish or reuse TCP + TLS or QUIC connection", "Send HTTP request and receive response", "Parse HTML; fetch CSS, scripts, images, and other resources", "Build DOM/styles, layout, paint, and update the page"], // Show an ordered workflow to reinforce visual understanding.
    }), // Finish this lesson and its three difficulty-based checkpoints.
    networkLesson({ // Begin one independently authored networking lesson.
        title: "Common Networking Commands", // Name this specific networking concept.
        module: "Important Practical Concepts", // Group the lesson in the requested curriculum hierarchy.
        definition: "Networking tools expose different layers: ip shows interfaces and routes, ping probes ICMP reachability, dig queries DNS, ss shows sockets, and curl inspects application requests.", // Introduce the concept and explain why it matters.
        mechanism: "Use ip address and ip route to inspect local configuration, dig to inspect DNS records, ss -tuln for listening sockets, and curl -v or timing options for HTTP connection details. Traceroute or tracepath can reveal aspects of the routed path where responses are allowed.", // Explain its actual operation with correct terminology.
        tradeoff: "Each tool measures a limited behavior. A failed ping can coexist with working HTTPS, and traceroute output can reflect filtering or asymmetric paths rather than the exact application route.", // Record limitations and important interview distinctions.
        example: "For a failed local API: check ss -tuln for its listener, curl the endpoint, inspect ip route for remote destinations, and use dig only when name resolution is involved.", // Demonstrate a realistic use case or calculation.
        misconception: "If ping fails, every application protocol must be unavailable.", // Use a concept-specific misconception as a basic distractor.
        scenario: "DNS lookup succeeds but curl reports connection refused for the resolved IP and port. What is a useful next check?", // Ask learners to apply the explanation to a concrete situation.
        scenarioAnswer: "Confirm the service is listening on that address/port and inspect firewall or proxy behavior.", // Preserve the exact correct choice for server-side scoring.
        scenarioWrong: "Change the DNS name repeatedly because connection refusal proves DNS failed.", // Provide a plausible wrong choice for comparison.
        hard: "How would you diagnose a website failure without confusing DNS, routing, and application problems?", // Ask an interview-level reasoning question without locking access.
        hardAnswer: "Confirm local addressing and route selection, query the expected DNS records, then inspect connection and TLS behavior with an application-aware tool. Compare hostname and resolved-address tests carefully so TLS SNI and HTTP Host remain correct. Interpret each result within its layer and avoid treating absent ICMP responses as conclusive.", // Provide a reference answer for explicit descriptive self-assessment.
        reference: "https://man7.org/linux/man-pages/man8/ip.8.html", // Link to independent protocol or technical documentation.
    }), // Finish this lesson and its three difficulty-based checkpoints.
]; // Finish the complete Computer Networks curriculum.
