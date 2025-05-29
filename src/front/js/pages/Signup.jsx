import React from "react";
import { Context } from "../store/appContext";
import { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login.css";
import bg from "../../img/signup.png";


export const Signup = () => {

    let [name, setName] = useState('')
    let [gender, setGender] = useState('')
    let [email, setEmail] = useState('')
    let [password, setPassword] = useState('')
    const { store, actions } = useContext(Context);
    const signupFormRef = useRef(null)
    const navigate = useNavigate()



    const handleName = (e) => {
        e.preventDefault()
        setName(e.target.value)
    }
    const handleGender = (e) => {
        setGender(e.target.value)
    }

    const handleEmail = (e) => {
        e.preventDefault()
        setEmail(e.target.value)
    }

    const handlePassword = (e) => {
        e.preventDefault()
        setPassword(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email || !password || !name || !gender) {
            alert("All fields are required, please try again.")
            return;
        }

        const userAvailable = await actions.userSignup({ email, password, name, gender })

        if (userAvailable) {
            alert("User created successfully")
            navigate("/")
        } else {
            alert("User already exists")
        }

        if (signupFormRef.current) {
            signupFormRef.current.reset()
        }
    }

    return (
        <div className="login-container">
            <div className="row login-row">
                <div className="col-md-6 login-img-col" style={{ backgroundImage: `url(${bg})` }}></div>
                <div className="col-md-6 login-form-col d-flex flex-column justify-content-center">
                    <form className="px-4" ref={signupFormRef}>
                        <h2 className="login-title">Crear cuenta</h2>
                        <p className="login-subtitle">Regístrate con tus datos</p>
                        <div className="mb-3">
                            <label htmlFor="inputName" className="form-label">Nombre</label>
                            <input onChange={handleName} type="text" className="form-control" id="inputName" aria-describedby="nameHelp" />
                        </div>
                        <div className="form-check form-check-inline">
                            <input onChange={handleGender} className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1" value="male" required/>
                            <label className="form-check-label" htmlFor="inlineRadio1">Masculino</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input onChange={handleGender} className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2" value="female" required/>
                            <label className="form-check-label" htmlFor="inlineRadio2">Femenino</label>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputEmail1" className="form-label">Email </label>
                            <input onChange={handleEmail} type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                            <div id="emailHelp" className="form-text">No compartiremos tu email con nadie.</div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputPassword1" className="form-label">Contraseña</label>
                            <input onChange={handlePassword} type="password" className="form-control" id="exampleInputPassword1" />
                        </div>
                        <div className="d-grid gap-2">
                            <button onClick={handleSubmit} className="btn btn-purple">Enviar</button>
                            <button type="button" onClick={() => navigate('/')} className="btn btn-outline-purple">Regresar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}