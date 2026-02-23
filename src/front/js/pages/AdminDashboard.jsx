import React from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/admin-dashboard.css";

const AdminDashboard = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
    };
    
    const handleNewAdmin = () => {
        navigate('/signup-admin')
    }
    const handleLogout = () => {
        actions.logout();
        navigate("/");
    };

    return (
        <div className="eq-admin min-vh-100 bg-light">
            {/* Navbar */}
            <div className="eq-admin-header w-100 d-flex justify-content-between p-4 shadow-sm">
                <h1 className="eq-admin-title text-white">Equilibra</h1>
                <div className="d-flex justify-content-end gap-3">
                    <button className="btn btn-outline-light eq-admin-btn-outline eq-admin-card" onClick={() => handleNavigate("/dashboard")}>
                        Dashboard usuario
                    </button>
                    <button className="btn btn-danger eq-admin-card" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="container py-5">
                <div className="row row-cols-1 row-cols-md-2 g-4 px-4">
                    <div className="col">
                        <button className="btn btn-primary eq-admin-btn-primary eq-admin-card w-100 py-3" onClick={() => handleNavigate("/vista-usuarios")}>
                            Ver usuarios
                        </button>
                    </div>
                    <div className="col">
                        <button className="btn btn-warning eq-admin-btn-warning eq-admin-card w-100 py-3" onClick={handleNewAdmin}>
                            Crear nuevo admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
