import express from "express";
import socketIO from "socket.io";
import http from "http";
import { environment } from "../environment/environment";

export default class Server {
  // propiedades
  private static _instance: Server;

  public app: express.Application;
  public port: Number;

  public io: socketIO.Server;
  public httpServer: http.Server;

  public idCliente: any;

  constructor() {
    this.app = express();
    this.httpServer = new http.Server(this.app);
    this.port = environment.port;

    // configuro io
    this.io = new socketIO.Server(this.httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      path: "/users/",
    });

    this.escucharConexiones();
  }

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  private escucharConexiones() {
    console.log("Escuchando conexiones de usuarios");

    this.io.of("/usuarios").on("connection", (cliente) => {
      console.log(`Cliente conectado a usuarios`);
    });
  }

  // levantar el servidor
  start(callback: Function): void {
    this.httpServer.listen(this.port, callback());
  }
}
