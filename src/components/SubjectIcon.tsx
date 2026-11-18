import { Boxes, Cpu, Database, CodeXml, Network, Layers, type LucideIcon } from "lucide-react"; // Use a consistent professional icon family.
import type { Subject } from "../../shared/types"; // Read icon metadata from the curriculum contract.
const icons: Record<string, LucideIcon> = { Boxes, Cpu, Database, CodeXml, Network, Layers }; // Map editable icon names to safe React components.
export function SubjectIcon({ subject, size = 21 }: { subject: Subject; size?: number }) { // Continue this clearly scoped calculation or control declaration.
    const Icon = icons[subject.icon] || Boxes; // Calculate or retain this value for the current render.
    return ( // Return the value or interface produced by this function.
        <span className="subject-icon" style={{ color: subject.color, background: `${subject.color}16` }}> {/* Display this compact piece of interface information. */}
            <Icon size={size} aria-hidden="true" /> {/* Render this reusable visual component. */}
        </span> // Finish this interface element.
    ); // Finish the current expression or code block.
} // Render an icon that is decorative alongside its visible subject label.
