import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";

const getSystemTheme = () => {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
		return "light";
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getStoredTheme = () => {
	if (typeof window === "undefined") return null;
	const saved = window.localStorage.getItem(STORAGE_KEY);
	return saved === "dark" || saved === "light" ? saved : null;
};

export const useTheme = () => {
	const [theme, setTheme] = useState(() => getStoredTheme() || getSystemTheme());

	const applyTheme = useCallback((nextTheme) => {
		const root = document.documentElement;
		if (nextTheme === "dark") {
			root.setAttribute("data-theme", "dark");
		} else {
			root.removeAttribute("data-theme");
		}
	}, []);

	useEffect(() => {
		applyTheme(theme);
	}, [theme, applyTheme]);

	useEffect(() => {
		const storedTheme = getStoredTheme();
		if (storedTheme) {
			window.localStorage.setItem(STORAGE_KEY, storedTheme);
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const updateFromSystem = (event) => setTheme(event.matches ? "dark" : "light");
		media.addEventListener("change", updateFromSystem);
		return () => media.removeEventListener("change", updateFromSystem);
	}, []);

	const setAndPersistTheme = useCallback((nextTheme) => {
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
		setTheme(nextTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		setAndPersistTheme(nextTheme);
	}, [theme, setAndPersistTheme]);

	return {
		theme,
		isDark: theme === "dark",
		setTheme: setAndPersistTheme,
		toggleTheme
	};
};
