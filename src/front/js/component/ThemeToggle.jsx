import React, { useId } from "react";
import { useTheme } from "../hooks/useTheme";

const ThemeToggle = () => {
	const { isDark, toggleTheme } = useTheme();
	const toggleId = useId();

	return (
		<div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0">
			<input
				className="form-check-input"
				type="checkbox"
				role="switch"
				id={toggleId}
				checked={isDark}
				onChange={toggleTheme}
				aria-label="Alternar modo oscuro"
			/>
			<label className="form-check-label text-muted mb-0" htmlFor={toggleId}>
				{isDark ? "Oscuro" : "Claro"}
			</label>
		</div>
	);
};

export default ThemeToggle;
