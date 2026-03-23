import express , {Request, Response} from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"

// 1.- Activamos las variables de entorno de nuestro archivo secreto
dotenv.config();

// 2.- Creamos la aplicacion express
const app = express();
app.use(express.json()) // permite que nuestra api entienda el json

// Conexion a MongoDB

const mongoUri = process.env.MONGODB_URI

if(!mongoUri) {
    throw new Error ("Falta la variable de entorno, espabila!!")
}

const mongoUriValidated: string = mongoUri;

let isMongoConnected = false;
let currentDatabase = ""; // Valor por defecto, se actualizara al conectar 

async function connectToMongo() {
    if(isMongoConnected) return;

    // Si existe DB_NAME, forzamos ese nombre de base en la conexion
    const dbNameFromEnv = process.env.DB_NAME;
    const connectionOptions = dbNameFromEnv ? {dbName: dbNameFromEnv} : undefined;

    await mongoose.connect(mongoUriValidated, connectionOptions)
    currentDatabase = mongoose.connection.name
} 

// 4.- Creamos el molde (Esquema para nuestras frases)

const FraseSchema = new mongoose.Schema(
    {
        text: String,
        autor: String,
    },
    {
        collection: "Frasesclase"
    }
);

const Frase = mongoose.models.Frases || mongoose.model("Frase", FraseSchema);

function getMongoDebugInfo(){
    return{
        database: currentDatabase || mongoose.connection.name,
        collection: Frase.collection.name,
        readyState: mongoose.connection.readyState,
    }
}

// 5.- Crearemos todas las rutas, get, post, todo esto vamos a configurarlo en vercel.