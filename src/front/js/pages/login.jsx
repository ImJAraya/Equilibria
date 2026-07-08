import React, { useContext, useState } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import bg from "../../img/login.jpg"; 
import "../../styles/login.css";

const Login = () => {
    const navigate = useNavigate();
    const { actions } = useContext(Context);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [validated, setValidated] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setValidated(true);
            return;
        }

        const user = await actions.loginUsuario({ email, password });
        if (user) {
            if (!user.is_active) {
                actions.logout();
                alert("El usuario no está activo");
                return;
            }
            if (user.is_admin) {
                navigate("/admin-dashboard");
            } else {
                navigate("/dashboard");
            }
        } else {
            alert("Error al loguear el usuario");
        }
    };

    return (
        <div className="login-container">
            <div className="row login-row">
                {/* Columna de imagen */}
                <div className="col-md-6 login-img-col">
                    <div
                        className="login-img-bg"
                        style={{ backgroundImage: `url(${bg})` }}
                    ></div>
                </div>

                {/* Columna de formulario */}
                <div className="col-md-6 login-form-col">
                    <h2 className="login-title">Bienvenido de nuevo</h2>
                    <p className="login-subtitle">Inicia sesión con tu cuenta</p>

                    <form onSubmit={handleSubmit} noValidate className={`needs-validation ${validated ? "was-validated" : ""}`}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Correo electrónico</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                required
                                placeholder="ejemplo@correo.com"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <div className="invalid-feedback">Por favor ingresa un correo válido.</div>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="password" className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                required
                                placeholder="Tu contraseña"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="invalid-feedback">Por favor ingresa tu contraseña.</div>
                        </div>

                        <div className="mb-3 text-end">
                            <a href="/reestablecer-contrasena" className="login-link">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <div className="d-grid gap-2">
                            {/* Botón con color morado */}
                            <button className="btn btn-purple" type="submit">Iniciar Sesión</button>
                            <button
                                type="button"
                                className="btn btn-outline-purple"
                                onClick={() => navigate("/signup")}
                            >
                                Crear Cuenta
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
