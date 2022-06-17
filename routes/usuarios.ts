import { Router, Request, Response } from "express";

// Instanciar el router
const usuarios = Router();

import { UsuarioClass } from "../class/usuarioClass";

// ==================================================================== //
// Prueba de ruta Usuarios
// ==================================================================== //
usuarios.get("/", (req: Request, resp: Response) => {
  resp.json({
    ok: true,
    mensaje: "Ruta de usuarios Ok",
  });
});

// ==================================================================== //
// Crear Usuario
// ==================================================================== //
usuarios.post("/nuevoUsuario", (req: Request, resp: Response) => {
  const nuevoUsuario = new UsuarioClass();
  nuevoUsuario.nuevoUsuario(req, resp);
});

// ==================================================================== //
// Loguear Usuario
// ==================================================================== //
usuarios.put("/loguearUsuario", (req: Request, resp: Response) => {
  const loguearUsuario = new UsuarioClass();
  loguearUsuario.loguearUsuario(req, resp);
});

// ==================================================================== //
// Obtener Usuario
// ==================================================================== //
usuarios.get("/obtenerUsuario", (req: Request, resp: Response) => {
  const obtenerUsuario = new UsuarioClass();
  obtenerUsuario.obtenerUsuario(req, resp);
});

// ==================================================================== //
// Obtener Usuario
// ==================================================================== //
usuarios.get("/obtenerUsuarioID", (req: Request, resp: Response) => {
  const obtenerUsuarioID = new UsuarioClass();
  obtenerUsuarioID.obtenerUsuarioID(req, resp);
});

// ==================================================================== //
// Obtener Usuarios
// ==================================================================== //
usuarios.get("/obtenerUsuarios", (req: Request, resp: Response) => {
  const obtenerUsuarios = new UsuarioClass();
  obtenerUsuarios.obtenerUsuarios(req, resp);
});

// ==================================================================== //
// Obtener Usuario/s criterio
// ==================================================================== //
usuarios.get("/obtenerUsuarioCriterio", (req: Request, resp: Response) => {
  const obtenerUsuarioCriterio = new UsuarioClass();
  obtenerUsuarioCriterio.obtenerUsuarioCriterio(req, resp);
});

// ==================================================================== //
// Obtener Usuario/s criterio
// ==================================================================== //
usuarios.get("/busquedaClienteCriterio", (req: Request, resp: Response) => {
  const busquedaClienteCriterio = new UsuarioClass();
  busquedaClienteCriterio.busquedaClienteCriterio(req, resp);
});

// ==================================================================== //
// Editar Usuario
// ==================================================================== //
usuarios.put("/editarUsuario", (req: Request, resp: Response) => {
  const editarUsuario = new UsuarioClass();
  editarUsuario.editarUsuario(req, resp);
});

// ==================================================================== //
// Decodificar Token
// ==================================================================== //
usuarios.get("/decodificarToken", (req: Request, resp: Response) => {
  const decodificarToken = new UsuarioClass();
  decodificarToken.decodificarToken(req, resp);
});

// ==================================================================== //
// Decodificar Token
// ==================================================================== //
usuarios.post("/mensajeContacto", (req: Request, resp: Response) => {
  const mensajeContacto = new UsuarioClass();
  mensajeContacto.mensajeContacto(req, resp);
});

export default usuarios;
