import React from "react";
import ThemeToggle from "./ThemeToggle.jsx";

export const Footer = () => (
	<footer className="footer mt-auto py-3 text-center bg-light border-top shadow-sm">
		<div className="container d-flex flex-column flex-md-row justify-content-between align-items-center small text-muted">
			<div className="mb-2 mb-md-0">
				&copy; {new Date().getFullYear()} <span className="fw-bold text-success">Equilibria</span>. Todos los derechos reservados.
			</div>
			<div className="d-flex align-items-center gap-3">
				<ThemeToggle />
				<div>
				<a href="/" className="text-success text-decoration-none me-3">Inicio</a>
				<a href="/frases-motivacionales" className="text-success text-decoration-none me-3">Frases</a>
				<a href="/recomendaciones" className="text-success text-decoration-none me-3">Recomendaciones</a>
				<a href="mailto:soporte@equilibria.com" className="text-success text-decoration-none">Contacto</a>
				</div>
			</div>
		</div>
	</footer>
);
