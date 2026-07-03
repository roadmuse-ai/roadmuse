import { Link } from "react-router-dom";
import {
  capabilityDescriptions,
  providerMatrix,
} from "../data/navigatorCapabilityData";

export function NavigatorCapabilityMatrixScreen() {
  const matrixEntries = Object.keys(providerMatrix[0].capability);
  const navigatorNames = providerMatrix.map((provider) => provider.provider);

  return (
    <section className="navigator-comparison">
      <p>
        <Link to="/help">Help</Link> → Navigator Comparison
      </p>

      <section className="navigator-comparison__section">
        <h3>Navigator Capability Matrix</h3>
        <p className="matrix-note">
          This matrix is a capability guide based on current navigator deep-link behavior.
          Exact behavior can vary by app version and platform.
        </p>
        <div className="capability-matrix__viewport">
          <div className="capability-matrix">
            <div className="capability-row capability-header">
              <div>Capability</div>
              {navigatorNames.map((name) => (
                <div key={name}>{name}</div>
              ))}
            </div>
            {matrixEntries.map((capability) => (
              <article key={capability} className="capability-row">
                <div className="provider-name">{capability}</div>
                {providerMatrix.map((provider) => (
                  <div
                    key={`${provider.provider}-${capability}`}
                    className="capability-cell"
                    title={
                      provider.capability[
                        capability as keyof typeof provider.capability
                      ].detail
                    }
                  >
                    {
                      provider.capability[
                        capability as keyof typeof provider.capability
                      ].icon
                    }
                  </div>
                ))}
              </article>
            ))}
          </div>
        </div>

        <div className="matrix-legend">
          <span className="matrix-legend-item">✅ Strong support</span>
          <span className="matrix-legend-item">⚠️ Partial/variable</span>
          <span className="matrix-legend-item">❌ Limited or no support</span>
          <span className="matrix-legend-item">⚪ Tool-dependent</span>
        </div>
      </section>

      <section className="navigator-comparison__section">
        <h3>Capability Meanings</h3>
        <ul className="list">
          {capabilityDescriptions.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>: {item.meaning}
            </li>
          ))}
        </ul>
      </section>

      <section className="navigator-comparison__section">
        <h3>Provider Notes</h3>
        <ul className="list">
          {providerMatrix.map((provider) => (
            <li key={`${provider.provider}-note`}>
              <strong>{provider.provider}</strong>: {provider.notes}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
