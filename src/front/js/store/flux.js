import { element } from "prop-types";

const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			// Información del usuario
			// mensajePorMood : false,
			pago: null,
			info: null, // Información del usuario autenticado
			token: sessionStorage.getItem("token") || null, // Token almacenado
			mensajeIA: null, // Mensaje generado por IA
			message: null, // Mensaje genérico
			estado: null, // Estado de ánimo del usuario
			favoritos: {
				quotes: null, // Frases favoritas
				movies: null, // Películas favoritas
				series: null, // Series favoritas
				podcasts: null, // Podcasts favoritos
				books: null, // Libros favoritos
				exercises: null // Ejercicios favoritos
			}, // Lista de favoritos
			listaEntradas: [],
			demo: [
				{
					title: "FIRST",
					background: "white",
					initial: "white"
				},
				{
					title: "SECOND",
					background: "white",
					initial: "white"
				}
			]
		},
		actions: {
			handleAuthFailure: () => {
				sessionStorage.removeItem("token");
				getActions().setStoreDefault();
			},
			handleAuthResponse: async (resp) => {
				if (resp.status === 401) {
					getActions().handleAuthFailure();
					return true;
				}

				if (resp.status !== 403 && resp.status !== 404) return false;

				const data = await resp.clone().json().catch(() => ({}));
				if (data.error === "User is suspended" || data.error === "User not found") {
					getActions().handleAuthFailure();
					return true;
				}

				return false;
			},
			// Use getActions to call a function within a fuction
			exampleFunction: () => {
				getActions().changeColor(0, "green");
			},
			getMessage: async () => {
				try {
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello")
					const data = await resp.json()
					setStore({ message: data.message })
					// don't forget to return something, that is how the async resolves
					return data;
				} catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			changeColor: (index, color) => {
				//get the store
				const store = getStore();

				//we have to loop the entire demo array to look for the respective index
				//and change its color
				const demo = store.demo.map((elm, i) => {
					if (i === index) elm.background = color;
					return elm;
				});

				//reset the global store
				setStore({ demo: demo });
			},
			loginUsuario: async (userData) => {
				try {
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "api/login", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify(userData)
					})
					let data = await resp.json();
					if (!resp.ok) {
						getActions().handleAuthFailure();
						return false;
					}
					if (!data.token || !data.user) {
						getActions().handleAuthFailure();
						return false;
					}
					sessionStorage.setItem("token", data.token);
					setStore({ token: data.token, info: data.user });
					return data.user;
				} catch (error) {
					console.log("Error loading message from backend", error)
					getActions().handleAuthFailure();
					return false;
				}
			},
			userSignup: async (userData) => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "api/user", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify(userData)
					})

					if (!resp.ok) {
						throw new Error("Something went wronggg");
					}

					let data = await resp.json()

					return data

				} catch (error) {
					console.log("Something went wrong:", error)

				}
			},
			adminSignup: async (userData) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/signup-admin", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token
						},
						body: JSON.stringify(userData)
					})

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						console.log(resp)
						throw new Error("Something went wronggg");
					}

					let data = await resp.json()

					return data

				} catch (error) {
					console.log("Something went wrong:", error)

				}
			},
			verificarToken: async () => {
				try {
					// fetching data from the backend
					const token = sessionStorage.getItem("token");
					if (!token) {
						getActions().handleAuthFailure();
						return false;
					}
					const resp = await fetch(process.env.BACKEND_URL + "api/user", {
						method: "GET",
						headers: {
							"Authorization": "Bearer " + token
						}
					});

					if (!resp.ok) {
						getActions().handleAuthFailure();
						return false;
					}
					let data = await resp.json();
					if (!data.is_active) {
						getActions().handleAuthFailure();
						return false;
					}

					setStore({ token, info: data });
					return data;
				} catch (error) {
					console.log("Error loading message from backend", error)
					getActions().handleAuthFailure();
					return false;
				}
			},
			logout: () => {
				try {
					getActions().handleAuthFailure();
				} catch (error) {
					console.log("Error al intentar cerrar sesión:", error);
				}
			},
			listaFetch: async (url, seccion) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + url, {
						method: "GET",
						headers: {
							"Authorization": "Bearer " + token
						}
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);

						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					setStore({ ...getStore(), [seccion]: data });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error);
				}
			},
			fetchFavoritos: async (url) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + url, {
						method: "GET",
						headers: {
							"Authorization": "Bearer " + token
						}
					});

					if (resp.status === 404) {
						if (await getActions().handleAuthResponse(resp)) return false;
						setStore({
							...getStore(),
							favoritos: {
								quotes: [],
								movies: [],
								series: [],
								podcasts: [],
								books: [],
								exercises: []
							}
						});
						return true;
					}
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					
					let data = await resp.json();
					const favoritos = {
						quotes: [],
						movies: [],
						series: [],
						podcasts: [],
						books: [],
						exercises: []
					};

					for (const ele of data) {
						if (ele.type === "quote") {
							favoritos.quotes.push(ele);
						} else if (ele.type === "película") {
							favoritos.movies.push(ele);
						} else if (ele.type === "serie") {
							favoritos.series.push(ele);
						} else if (ele.type === "podcast") {
							favoritos.podcasts.push(ele);
						} else if (ele.type === "libro") {
							favoritos.books.push(ele);
						} else if (ele.type === "ejercicio") {
							favoritos.exercises.push(ele);
						}
					}
					setStore({ ...getStore(), favoritos });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error);
				}
			},
			eliminarFavorito: async (id, type) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/favorite-del", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token
						},
						body: JSON.stringify({ "favorite_id": id })
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						alert('There was an error trying to delete you favorite, try again')
						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					// setStore({ ...getStore(), [type]: data });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error);
				}
			},
			guardarEstadodeanimo: async (estado) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/entrada", {
						method: "POST",
						headers: {
							"Authorization": "Bearer " + token,
							"Content-Type": "application/json"
						},
						body: JSON.stringify(estado)
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					setStore({ ...getStore(), estado: estado.mood_tag });

					return true;
				} catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			isAdmin: async () => {
				try {
					const user = await getActions().verificarToken();
					return user?.is_admin === true;
				} catch (error) {
					console.log("Error loading message from backend", error)
					return false;
				}
			},
			mensajePersonalizado: async (mood_tag) => {
				try {
					setStore({ ...getStore(), loadingMensajeIA: true, mensajeIA: null });
					const token = sessionStorage.getItem("token");
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "api/consejo-personalizado", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer " + token
						},
						body: JSON.stringify({ mood_tag })
					});
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					const data = await resp.json();
					setStore({ ...getStore(), mensajeIA: data.advice, loadingMensajeIA: false });
					return true
				}
				catch (error) {
					console.log("Error loading message from backend", error)
					setStore({ ...getStore(), loadingMensajeIA: false });
				}
			},
			mensajePorMood: async () => {
				const store = getStore();
				await getActions().mensajePersonalizado(store.estado);
			},
			fraseMotivacional: async () => {
				try {
					setStore({ ...getStore(), loadingFraseMotivacionalIA: true, fraseMotivacional: null });
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/frase-motivacional", {
						method: "POST",
						headers: {
							"Authorization": "Bearer " + token
						}
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					setStore({ ...getStore(), fraseMotivacional: data, loadingFraseMotivacionalIA: false });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error)
					setStore({ ...getStore(), loadingFraseMotivacionalIA: false });
				}
			},
			frasesMotivacionales: async () => {
				try {
					setStore({ ...getStore(), loadingFrasesMotivacionalesIA: true, frasesMotivacionales: null });
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/frases-motivacionales", {
						method: "POST",
						headers: {
							"Authorization": "Bearer " + token
						}
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					setStore({ ...getStore(), frasesMotivacionales: data, loadingFrasesMotivacionalesIA: false });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error)
					setStore({ ...getStore(), loadingFrasesMotivacionalesIA: false });
				}
			},
			guardarFavorito: async (favorito) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/favorite", {
						method: "POST",
						headers: {
							"Authorization": "Bearer " + token,
							"Content-Type": "application/json"
						},
						body: JSON.stringify(favorito)

					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					setStore({ ...getStore(), favoritos: data });
					return true;
				} catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			cargarRecomendaciones: async (busqueda) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/recomendaciones", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token
						},
						body: JSON.stringify({ "busqueda": busqueda })
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					let data = await resp.json();

					setStore({ ...getStore(), recomendaciones: data });
					return true;
				}
				catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			reestablecerContrasena: async (user_id) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/admin/force-reset-password", {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							"authorization": "Bearer " + token
						},
						body: JSON.stringify({ "user_id": user_id })
					});
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
				}
				catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			suspenderReactivarUsuario: async (user_id) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/admin/suspender-activar-user", {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							"authorization": "Bearer " + token
						},
						body: JSON.stringify({ "user_id": user_id })
					});
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
				}
				catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			modificarIsAdmin: async (user_id) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/admin/hacer-deshacer-admin", {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							"authorization": "Bearer " + token
						},
						body: JSON.stringify({ "user_id": user_id })
					});
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
				}
				catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			cambiarDatos: async (datos) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/user/change-data", {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							"authorization": "Bearer " + token
						},
						body: JSON.stringify(datos)
					});
					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error("Error, token no es correcto");
					}
					return true;
				}
				catch (error) {
					console.log("Error loading message from backend", error)
				}
			},
			setStore: (seccion, favorito_id) => {
				let store = getStore();
				store.favoritos[seccion] = store.favoritos[seccion].filter((item) => item.id !== favorito_id);
				setStore({ ...getStore(), [seccion]: store.favoritos[seccion] });
			},
			descargarPDF: async (fechas) => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/diario/export-pdf", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"authorization": "Bearer " + token
						},
						body: JSON.stringify(fechas)
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error(`Error ${resp.status}`);
					}

					// 1) Lee la respuesta como blob (binario)
					const blob = await resp.blob();

					// 2) Crea un URL temporal para ese blob
					const url = window.URL.createObjectURL(blob);

					// 3) Crea y dispara un <a> "virtual"
					const a = document.createElement("a");
					a.href = url;
					a.download = "mis_entradas_diario.pdf";
					document.body.appendChild(a);
					a.click();
					a.remove();

					// 4) Libera el objeto
					window.URL.revokeObjectURL(url);
				} catch (err) {
					console.error("No se pudo descargar el PDF:", err);
					alert("Error al generar el PDF. Intenta de nuevo.");
				};

			},
			convertirPremium: async () => {
				try {
					const token = sessionStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/user/upgrade", {
						method: "POST",
						headers: {
							"authorization": "Bearer " + token
						}
					});

					if (!resp.ok) {
						await getActions().handleAuthResponse(resp);
						throw new Error(`Error ${resp.status}`);
					}
					const store = getStore()
					setStore({ ...getStore(), info: { ...store.info, is_premium: true } })
					return true
				} catch (err) {
					console.error("No se pudo convertir a premiuum:", err);
				};

			},
			setPago: () => {
				setStore({
					...getStore(), info: { ...store.info, is_premium: true }
				});
			},
			setStoreDefault: () => {
				setStore({
					pago: null,
					info: null,
					token: null,
					mensajeIA: null,
					message: null,
					estado: null,
					loadingMensajeIA: false,
					loadingFraseMotivacionalIA: false,
					loadingFrasesMotivacionalesIA: false,
					fraseMotivacional: null,
					frasesMotivacionales: null,
					recomendaciones: null,
					favoritos: {
						quotes: null,
						movies: null,
						series: null,
						podcasts: null,
						books: null,
						exercises: null
					},
					listaEntradas: []
				});
			}

		}

	};
};

export default getState;
