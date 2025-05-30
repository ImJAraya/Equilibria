import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Checkout from "../component/checkout.jsx";
import logo from "../../img/equilibra-logo.png";
import "../../styles/index.css";


const Dashboard = () => {
    const initialOptions = {
        "client-id": process.env.PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
    };

    const navigate = useNavigate();
    const { store, actions } = useContext(Context);
    const [password, setPassword] = useState("");
    const [showCheckout, setShowCheckout] = useState(false);

    // Navegación sencilla
    const handleNavigate = (path) => navigate(path);

    // Cerrar sesión
    const handleLogout = () => {
        actions.logout();
        navigate("/");
    };

    const handleNavigateFavoritos = () => {
        if (store.info?.is_premium) {
            navigate("/favoritos");
        } else {
            alert("¡Ups! Debes ser premium para acceder a esta sección.");
        }
    };

    // Cambio de contraseña forzado
    const handleChangePassword = async () => {
        if (!password.trim()) {
            alert("¡Ups! Debes escribir tu nueva contraseña.");
            return;
        }
        const success = await actions.cambiarDatos({ new_password: password });
        if (success) {
            alert("¡Genial! Contraseña actualizada con éxito.");
            setPassword("");
            actions.verificarToken();
            navigate("/");
        } else {
            alert("Lo siento, ocurrió un error. Intenta de nuevo.");
        }
    };

    useEffect(() => {
        if (!store.info) {
            alert("Debes iniciar sesión primero.");
            navigate("/login");
            return;
        }
        actions.fraseMotivacional();
    }, [store.info?.is_premium]);

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
                <div className="bg-gradient"></div>
                {store.info?.force_password_change ? (
                    <div className="alert alert-warning text-center">
                        <h4 className="alert-heading">¡Atención!</h4>
                        <p>Para continuar, por favor crea una contraseña nueva.</p>
                        <input
                            type="password"
                            className="form-control mb-3"
                            placeholder="Escribe tu nueva contraseña"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleChangePassword}
                        >
                            Cambiar contraseña
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Header amigable */}
                        <div className="w-100 d-flex justify-content-between align-items-center p-3 shadow-sm">
                            <h1 className="page-title">Equilibria</h1>
                            <div className="d-flex gap-2">
                                {/* Mostrar botón solo si el usuario no es premium */}
                                {!store.info?.is_premium && (
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => setShowCheckout(true)}
                                    >
                                        ¡Hazme Premium!
                                    </button>
                                )}
                                {store.info?.is_admin && (
                                    <button
                                        className="btn btn-info"
                                        onClick={() => handleNavigate("/admin-dashboard")}
                                    >
                                        Panel de Admin
                                    </button>
                                )}
                                <button className="btn btn-outline-danger" onClick={handleLogout}>
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>

                        {/* Bienvenida y frase motivacional */}
                        <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 p-4 ">
                            {store.info ? (
                                <>
                                    <div className="modal-body">
                                        <h2 className="text-primary mb-3">¡Nos alegra verte de nuevo, {store.info.name}! 😊</h2>
                                        Bienvenido a Equilibria ✨
                                        <p className="mt-2">Tu bienestar es nuestra prioridad. Algunas recomendaciones se generan con IA para ayudarte de forma personalizada.</p>
                                    </div>
                                    {store.loadingFraseMotivacionalIA ? (
                                        <div className="alert alert-info text-center w-100">
                                            <p>Buscando tu dosis de inspiración...</p>
                                        </div>
                                    ) : store.fraseMotivacional && (
                                        <div className="alert alert-success text-center w-100 shadow-sm">
                                            <h4 className="mb-2">"{store.fraseMotivacional.quote}"</h4>
                                            <p className="mb-0 text-muted">— {store.fraseMotivacional.author}</p>
                                        </div>
                                    )}
                                    {/* Tarjetas de navegación */}
                                    <div className="row row-cols-1 row-cols-md-2 g-4 mt-4 w-100">
                                        {/* Diario */}
                                        <div className="col">
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-body text-center">
                                                    <i className="fa-solid fa-book-open fa-2x mb-3" style={{ color: '#7ca08e' }}></i>
                                                    <h5 className="card-title">Escribe tu día</h5>
                                                    <p className="card-text text-muted">Reflexiona sobre tu día y plasma tus pensamientos.</p>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleNavigate("/diario")}
                                                    >
                                                        ¡Escribir!
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Frases motivacionales */}
                                        <div className="col">
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-body text-center">
                                                    <i className="fa-solid fa-comment-dots fa-2x mb-3" style={{ color: '#7ca08e' }}></i>
                                                    <h5 className="card-title">Inspírate hoy</h5>
                                                    <p className="card-text text-muted">Encuentra esa frase que te impulse.</p>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleNavigate("/frases-motivacionales")}
                                                    >
                                                        Ver frases
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recomendaciones */}
                                        <div className="col">
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-body text-center">
                                                    <i className="fa-solid fa-lightbulb fa-2x mb-3" style={{ color: '#7ca08e' }}></i>
                                                    <h5 className="card-title">Recomendaciones</h5>
                                                    <p className="card-text text-muted">Sugerencias para tu bienestar.</p>
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => handleNavigate("/recomendaciones")}
                                                    >
                                                        ¡Vamos!
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Favoritos */}
                                        <div className="col">
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-body text-center">
                                                    <i className="fa-regular fa-star fa-2x mb-3" style={{ color: '#e6b800' }}></i>
                                                    <h5 className="card-title">Mis favoritos</h5>
                                                    <p className="card-text text-muted">Guarda lo que más te inspira.</p>
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => handleNavigateFavoritos()}
                                                    >
                                                        Mis favoritos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Editar info */}
                                        <div className="col">
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-body text-center">
                                                    <i className="fa-regular fa-user fa-2x mb-3" style={{ color: '#7ca08e' }}></i>
                                                    <h5 className="card-title">Mi perfil</h5>
                                                    <p className="card-text text-muted">Actualiza tus datos personales.</p>
                                                    <button
                                                        className="btn btn-info"
                                                        onClick={() => handleNavigate("/cambiar-info")}
                                                    >
                                                        Editar perfil
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <h4 className="text-danger">No encontramos tu información...</h4>
                            )}


                        </div>
                    </div>
                )}

                {/* Modal para PayPal Checkout */}
                {showCheckout && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                className="modal-close"
                                onClick={() => setShowCheckout(false)}
                            >
                                Cerrar
                            </button>
                            <Checkout
                                onSuccess={() => {
                                    setShowCheckout(false);
                                    actions.verificarToken(); // Actualizar el estado global
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PayPalScriptProvider>
    );
};

export default Dashboard;
