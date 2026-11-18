import React from "react"; // Load React's strict runtime checks for development.
import ReactDOM from "react-dom/client"; // Mount the app with the modern React root API.
import { BrowserRouter } from "react-router-dom"; // Keep navigation in real browser URLs.
import { WorkspaceProvider } from "./lib/store"; // Share curriculum and private progress across screens.
import App from "./App"; // Render the application shell and route tree.
import "./styles.css"; // Apply the accessible CoreLab design system.
ReactDOM.createRoot(document.getElementById("root")!).render( // Continue this clearly scoped calculation or control declaration.
    <React.StrictMode> {/* Render this reusable visual component. */}
        <BrowserRouter> {/* Render this reusable visual component. */}
            <WorkspaceProvider> {/* Render this reusable visual component. */}
                <App /> {/* Render this reusable visual component. */}
            </WorkspaceProvider> {/* Finish this interface element. */}
        </BrowserRouter> {/* Finish this interface element. */}
    </React.StrictMode>, // Finish this interface element.
); // Connect routing, state, and presentation at one clear entry point.
