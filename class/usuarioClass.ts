import { Response, Request, response } from "express";
import { CallbackError } from "mongoose";
const mongoose = require("mongoose");
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import nodemailer from "nodemailer";
import * as google from "googleapis";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import mjml2html from "mjml";

const moment = require("moment-timezone");
moment.locale("es");
import { customAlphabet } from "nanoid";

import Server from "./server";

// modelo
import Usuario from "../models/usuario";

// interface
import { UsuarioInterface } from "../interfaces/usuario";

import { environment } from "../environment/environment";

let limite = 0;

export class UsuarioClass {
  idRef: any;
  constructor() {
    this.idRef = customAlphabet("0123456789", 6);
  }

  nuevoUsuario(req: Request, resp: Response): void {
    const idReferencia = this.idRef();
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const password = bcrypt.hashSync(req.body.password, 10);
    const avatar = req.body.avatar;
    const telefono = req.body.telefono;
    const direccion = {
      provincia: req.body.provincia,
      distrito: req.body.distrito,
      corregimiento: req.body.corregimiento,
      direccion: req.body.direccion,
    };
    const fechaRegistro = moment.tz("America/Bogota").format("DD-MM-YYYY");

    // Insertar usuario en DB
    const nuevoUsuario = new Usuario({
      idReferencia,
      nombre,
      correo,
      password,
      avatar,
      telefono,
      direccion,
      fechaRegistro,
    });

    nuevoUsuario.save((err: CallbackError, usuarioDB: UsuarioInterface) => {
      if (err) {
        return this.respuestaJson(false, "Error al crear usuario", resp, err);
      } else {
        return this.respuestaJson(
          true,
          "Usuario creado",
          resp,
          null,
          usuarioDB
        );
      }
    });
  }

  loguearUsuario(req: Request, resp: Response): void {
    const correo = req.body.correo;
    const password = req.body.password;

    Usuario.findOne(
      { correo },
      (err: CallbackError, usuarioDB: UsuarioInterface) => {
        if (err) {
          return this.respuestaJson(false, "Error buscar correo", resp, err);
        }

        // Verifica correo
        if (!usuarioDB) {
          return this.respuestaJson(
            false,
            "Correo/Contraseña incorrectas",
            resp,
            null
          );
        }

        // Verifica password
        if (!bcrypt.compareSync(password, usuarioDB.password)) {
          return this.respuestaJson(
            false,
            "Correo/Contraseña incorrectas",
            resp
          );
        }

        // Loguear usuario
        Usuario.findByIdAndUpdate(
          usuarioDB._id,
          {},
          { new: true },
          (err: any, usuarioDB: any) => {
            if (err) {
              return this.respuestaJson(
                false,
                "Error al loguear usuario",
                resp,
                err
              );
            }

            // Crear token
            const token = jwt.sign({ usuario: usuarioDB }, environment.SEED, {
              expiresIn: 86400,
            });

            usuarioDB.password = ";)";
            return resp.json({
              ok: true,
              mensaje: "Acceso correcto",
              usuarioDB,
              token,
            });
          }
        );
      }
    );
  }

  obtenerUsuarioID(req: Request, resp: Response): void {
    // const idReferencia = req.body.idReferencia;
    const id = new mongoose.Types.ObjectId(req.get("id"));

    // console.log(id)
    // return;

    Usuario.findById(id, (err: CallbackError, usuarioDB: UsuarioInterface) => {
      if (err) {
        return this.respuestaJson(false, "Error al buscar Usuario", resp, err);
      } else {
        usuarioDB.password = ";)";
        return this.respuestaJson(
          true,
          "Usuario encontrado",
          resp,
          null,
          usuarioDB
        );
      }
    });
  }

  obtenerUsuario(req: Request, resp: Response): void {
    // const idReferencia = req.body.idReferencia;
    const idReferencia = req.get("idReferencia");

    Usuario.findOne(
      { idReferencia },
      (err: CallbackError, usuarioDB: UsuarioInterface) => {
        if (err) {
          return this.respuestaJson(
            false,
            "Error al buscar Usuario",
            resp,
            err
          );
        } else {
          usuarioDB.password = ";)";
          return this.respuestaJson(
            true,
            "Usuario encontrado",
            resp,
            null,
            usuarioDB
          );
        }
      }
    );
  }

  obtenerUsuarioCriterio(req: Request, resp: Response): void {
    const criterio = req.get("criterio") || "";
    const regExpCrit = RegExp(criterio, "i");

    Usuario.find(
      { $or: [{ nombre: regExpCrit }, { telefono: regExpCrit }] },
      (err: CallbackError, usuariosDB: Array<UsuarioInterface>) => {
        if (err) {
          return this.respuestaJson(
            false,
            "Error al buscar usuario/s",
            resp,
            err,
            undefined,
            usuariosDB
          );
        } else {
          return this.respuestaJson(
            true,
            "Usuario/s encontrado/s",
            resp,
            null,
            undefined,
            usuariosDB
          );
        }
      }
    );
  }

  async obtenerUsuarios(req: Request, resp: Response): Promise<any> {
    limite = Number(req.get("lim")) || 0;

    Usuario.find({})
      .limit(limite)
      .exec(async (err: any, usuariosDB: any) => {
        if (err) {
          return this.respuestaJson(
            false,
            "Error al buscar Usuarios",
            resp,
            err
          );
        } else {
          const server = Server.instance;
          server.io.emit("obtener-usuarios", {
            ok: true,
            mensaje: "Usuarios encontrados",
            datas: usuariosDB,
          });
          const cantUsers = await Usuario.find({}).count().exec();

          return resp.json({
            ok: true,
            mensaje: "Usuarios encontrados",
            datas: usuariosDB,
            cantidadUsuarios: cantUsers,
          });
        }
      });
  }

  // edita/inhabilita
  editarUsuario(req: Request, resp: Response): void {
    const idUsuario = req.body.idUsuario;
    const idUsuarioSocket = req.body.idUsuarioSocket;

    Usuario.findById(
      idUsuario,
      (err: CallbackError, usuarioDB: UsuarioInterface) => {
        if (err) {
          return this.respuestaJson(
            false,
            "Error al buscar usuario",
            resp,
            err
          );
        } else {
          const query = {
            nombre: req?.body?.nombre,
            password: req?.body?.password,
            avatar: req?.body?.avatar,
            telefono: req?.body?.telefono,
            direccion: {
              provincia: req?.body?.direccion?.provincia,
              distrito: req?.body?.direccion?.distrito,
              corregimiento: req?.body?.direccion?.corregimiento,
              direccion: req?.body?.direccion?.direccion,
            },
            estado: req?.body?.estado,
            role: req?.body?.role,
            contSesion: 0,
          };

          if (!query.nombre) {
            query.nombre = usuarioDB.nombre;
          }

          if (!query.password) {
            query.password = usuarioDB.password;
          }

          if (!query.avatar) {
            query.avatar = usuarioDB.avatar;
          }

          if (!query.telefono) {
            query.telefono = usuarioDB.telefono;
          }

          if (!query.direccion.provincia) {
            query.direccion.provincia = usuarioDB.direccion.provincia;
          }

          if (!query.direccion.distrito) {
            query.direccion.distrito = usuarioDB.direccion.distrito;
          }

          if (!query.direccion.corregimiento) {
            query.direccion.corregimiento = usuarioDB.direccion.corregimiento;
          }

          if (!query.direccion.direccion) {
            query.direccion.direccion = usuarioDB.direccion.direccion;
          }

          if (!query.role) {
            query.role = usuarioDB.role;
          }

          if (query.estado === "null" || query.estado === undefined) {
            query.estado = usuarioDB.estado;
          }

          const contSesion = Number(usuarioDB.contSesion);
          query.contSesion = contSesion + 1;

          Usuario.findByIdAndUpdate(
            idUsuario,
            query,
            { new: true },
            (err: any, usuarioDB: any) => {
              if (err) {
                return this.respuestaJson(
                  false,
                  "Error al editar usuario",
                  resp,
                  err
                );
              } else {
                // console.log(idUsuarioSocket);
                const server = Server.instance;
                server.io.to(idUsuarioSocket).emit("obtener-usuario-editado", {
                  ok: true,
                  mensaje: "Usuario editado",
                  data: usuarioDB,
                });
                return this.respuestaJson(
                  true,
                  "Usuario editado",
                  resp,
                  null,
                  usuarioDB
                );
              }
            }
          );
        }
      }
    );
  }

  // Decodificar token
  decodificarToken(req: Request, resp: Response): void {
    const token: any = req.get("token");

    jwt.verify(token, environment.SEED, async (err: any, decoded: any) => {
      // console.log(decode)
      // return;
      if (err) {
        return resp.json({
          ok: false,
          mensaje: `Token incorrecto`,
          err,
        });
      } else {
        const usuarioDB: any = await Usuario.findById(
          decoded.usuario._id
        ).exec();

        usuarioDB.password = ":)";

        return resp.json({
          ok: true,
          mensaje: `Token correcto`,
          // usuario: decoded.usuario,
          data: usuarioDB,
          token,
          iat: decoded.iat,
          exp: decoded.exp,
        });
      }
    });
  }

  busquedaClienteCriterio(req: Request, resp: Response): void {
    const criterio = new RegExp(req.get("criterio")! || "", "i");

    Usuario.find({
      $or: [{ idReferencia: criterio }, { correo: criterio }],
    }).exec(async (err: any, usuariosDB: any) => {
      if (err) {
        return this.respuestaJson(false, "Error al buscar Usuarios", resp, err);
      } else {
        const server = Server.instance;
        server.io.emit("obtener-usuarios-criterio", {
          ok: true,
          mensaje: "Usuarios encontrados",
          datas: usuariosDB,
        });
        const cantUsers = await Usuario.find({}).count().exec();

        return resp.json({
          ok: true,
          mensaje: "Usuarios encontrados",
          datas: usuariosDB,
          cantidadUsuarios: cantUsers,
        });
      }
    });
  }

  mensajeContacto(req: Request, resp: Response): void {
    const data = {
      nombre: req.body.nombre,
      correo: req.body.correo,
      mensaje: req.body.mensaje,
    };

    const CLIENTID: string =
      "521016425534-hqfptiq60j1egd3n97194r14m6fu4au0.apps.googleusercontent.com";
    const CLIENTSECRET: string = "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";
    const REDIRECTURI: string = "https://developers.google.com/oauthplayground";
    const REFRESHTOKEN: string =
      "1//04MAGNKFnJ-_WCgYIARAAGAQSNwF-L9IriHfR0tn0vIGh9z42Dn5Rl-dt6tIzZ7o_tnATz2dWH_n0cq_2sGCM-DGF3luLxNPgH9c";

    const oAuth2Client = new google.Auth.OAuth2Client({
      clientId: CLIENTID,
      clientSecret: CLIENTSECRET,
      redirectUri: REDIRECTURI,
    });

    oAuth2Client.setCredentials({ refresh_token: REFRESHTOKEN });

    const sendMail = async () => {
      try {
        const accessToken: any = await oAuth2Client.getAccessToken();

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          auth: {
            type: "OAuth2",
            user: "roserodevmail@gmail.com",
            clientId: CLIENTID,
            clientSecret: CLIENTSECRET,
            refreshToken: REFRESHTOKEN,
            accessToken: accessToken,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const mailOptions: SMTPTransport.Options = {
          from: "JJBOXPTY <jjbox507@gmail.com>",
          to: "jjbox507@gmail.com",
          subject: "Mensaje desde Contacto",
          html: this.templateMensajeContacto(data),
        };

        return await transporter.sendMail(mailOptions);
      } catch (err) {
        return err;
      }
    };

    sendMail()
      .then((data) => {
        // console.log(data);

        resp.json({
          ok: true,
          mensaje: "Correo enviado",
        });
      })
      .catch((err) => {
        resp.json({
          ok: false,
          mensaje: "No se pudo enviar el correo, intentelo más tarde",
          err
        });
        // console.log(err);
      });
  }

  templateMensajeContacto(data: any): string {
    // console.log(dataFactura)
    const htmlOutput = mjml2html(
      `
      <mjml>
  <mj-body>
    <mj-section>
      <mj-column>

        <mj-divider border-color="#F45E43"></mj-divider>

        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">HOLA JJBOXPTY</mj-text>
        
        <mj-text font-size="18px" font-family="helvetica">Tiene un mensaje desde el formulario de contacto:</mj-text>
        
        <mj-spacer></mj-spacer>
        
        <mj-text font-size="16px" font-family="helvetica">Nombre: ${data.nombre}</mj-text>
        <mj-text font-size="16px" font-family="helvetica">Correo: ${data.correo}</mj-text>
        <mj-text font-size="16px" font-family="helvetica" line-height="1.5" >Mensaje: ${data.mensaje}</mj-text>
        

      </mj-column>
    </mj-section>
  </mj-body>
</mjml>  
      `
    );

    return htmlOutput.html;
  }

  respuestaJson(
    ok: boolean,
    mensaje: string,
    resp: Response,
    err?: CallbackError,
    usuarioDB?: UsuarioInterface,
    usuariosDB?: Array<UsuarioInterface>
  ): any {
    switch (ok) {
      case false:
        return resp.json({
          ok,
          mensaje,
          err,
        });
        break;
      case true:
        return resp.json({
          ok,
          mensaje,
          data: usuarioDB,
          datas: usuariosDB,
        });
        break;
    }
  }
}
