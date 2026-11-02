import { Icon } from "../ui.jsx";
export default function ThemeSelector({ app, name }) {
  return (
    <fieldset className="theme-switch">
      <legend className="sr-only">حالت نمایش</legend>
      {[
        ["light", "روشن", "sun"],
        ["dark", "تاریک", "moon"],
      ].map(([value, label, icon]) => (
        <label key={value} className="theme-choice" title={"حالت " + label}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={app.state.theme === value}
            onChange={() => app.setState({ theme: value })}
          />
          <span>
            <Icon name={icon} size={16} />
            <span className="sr-only">{label}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
