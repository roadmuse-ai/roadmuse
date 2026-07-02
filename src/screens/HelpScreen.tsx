import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTotalPromptCount, helpPromptCategories } from "../data/helpPrompts";
import { savePromptDraft } from "../data/promptDraft";

export function HelpScreen() {
  const navigate = useNavigate();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const copyResetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(copyResetTimer.current);
    };
  }, []);

  const handleCopy = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); ignore.
    }
  };

  const handleUse = (prompt: string) => {
    savePromptDraft(prompt);
    navigate("/");
  };

  return (
    <section>
      <div className="card">
        <h3 className="settings-title">Prompt Library</h3>
        <p className="help-intro">
          {getTotalPromptCount()} example prompts you can say or type. Copy one, or load
          it into the main prompt with “Use”.
        </p>
        <p className="help-intro">
          Each category notes what external navigators can and cannot honor — see the{" "}
          <Link to="/help/navigator-comparison">Navigator Comparison</Link> for the full
          capability matrix.
        </p>
      </div>

      {helpPromptCategories.map((category) => (
        <details className="card prompt-category" key={category.id}>
          <summary className="prompt-category__summary">
            <span className="prompt-category__title">{category.title}</span>
            <span className="prompt-category__count">{category.prompts.length}</span>
          </summary>
          <p className="prompt-category__description">{category.description}</p>
          <p className="prompt-category__note">
            {category.limitationNote}{" "}
            <Link to="/help/navigator-comparison">Provider details</Link>
          </p>
          <ul className="prompt-list">
            {category.prompts.map((prompt) => (
              <li className="prompt-list__item" key={prompt}>
                <span className="prompt-list__text">“{prompt}”</span>
                <span className="prompt-list__actions">
                  <button
                    className="prompt-list__button"
                    type="button"
                    onClick={() => void handleCopy(prompt)}
                  >
                    {copiedPrompt === prompt ? "Copied" : "Copy"}
                  </button>
                  <button
                    className="prompt-list__button prompt-list__button--primary"
                    type="button"
                    onClick={() => handleUse(prompt)}
                  >
                    Use
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}
