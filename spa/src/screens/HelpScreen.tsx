import { Link } from "react-router-dom";

export function HelpScreen() {
  return (
    <section>
      <div>
        <ul className="list">
          <li>
            <Link to="/help/navigator-comparison">Navigator Comparison</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
