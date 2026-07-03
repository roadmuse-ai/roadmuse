import { Link } from "react-router-dom";

export function HelpScreen() {
  return (
    <section className="help-screen">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li aria-current="page">Help</li>
        </ol>
      </nav>
      <div className="help-screen__content">
        <ul className="list">
          <li>
            <Link to="/help/navigator-comparison">Navigator Comparison</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
