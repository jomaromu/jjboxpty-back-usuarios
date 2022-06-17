import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const roles = {
  values: ["admin", "cliente"],
  message: "{VALUE}, no es un role permitido",
};

// interface
import { UsuarioInterface } from "../interfaces/usuario";

// Crear esquema
const Schema = mongoose.Schema;

const usuarios = new Schema({
  idReferencia: { type: String, required: true },
  nombre: { type: String, default: "Cliente" },
  correo: { type: String, unique: true },
  password: { type: String, default: "null" },
  avatar: { type: String, default: "null" },
  telefono: { type: String, default: "null" },
  direccion: {
    provincia: {
      id: { type: Number, default: null },
      name: { type: String, default: "null" },
    },
    distrito: {
      id: { type: Number, default: null },
      province_id: { type: Number, default: null },
      name: { type: String, default: "null" },
    },
    corregimiento: {
      id: { type: Number, default: null },
      district_id: { type: Number, default: null },
      name: { type: String, default: "null" },
    },
    direccion: { type: String, default: "null" },
  },
  fechaRegistro: { type: String, default: "null" },
  role: { type: String, required: true, default: "cliente", enum: roles },
  contSesion: { type: Number, required: true, default: 0 },
  estado: { type: Boolean, default: true },
});

// validacion para único elemento
usuarios.plugin(uniqueValidator, { message: "El {PATH}, ya existe!!" });

export = mongoose.model<UsuarioInterface>("usuarios", usuarios);
