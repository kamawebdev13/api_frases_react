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
        author: String,
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

// Para debug
app.get("/api/debug-db", async(req: Request, res: Response) => {
    try {
        await connectToMongo();
        res.json(getMongoDebugInfo());
    } catch (error) {
        console.error("Error al inspeccionar MongoDB:", error)
        res.status(500).json({
            error: "No se pudo inspeccionar la conexion",
            detail: error instanceof Error ? error.message: "Error Desconocido"
        })
    }
});

// GET DE LAS FRASES
app.get("/api/frases", async(req: Request, res: Response)=>{
    try {
        await connectToMongo();
        const frases = await Frase.find();
        res.json(frases)
    } catch (error) {
        console.error("Error al leer frases", error)
        res.status(500).json({
            error: "No se pudieron obtener las frases",
            detail: error instanceof Error ? error.message: "Error Desconocido"
        })
    }
});

// POST DE LAS FRASES
app.post("/api/frases",async(req: Request, res: Response)=>{
    try {
        const { text, author } = req.body
        if(!text || !author){
            res.status(400).json({error: "Debes enviar texto y autor, espabila!!"})
        }

        await connectToMongo();
        const nuevaFrase = new Frase({text, author}) //Toma los datos que envia el usuario
        await nuevaFrase.save() // Lo guarda en la base de datos
        res.status(201).json(nuevaFrase) //Responder la frase recien creada
    } catch (error) {
        console.error("Error al crear la frase:", error)
        res.status(500).json({
            error: "No se pudieron obtener las frases",
            detail: error instanceof Error ? error.message: "Error Desconocido"
        })
    }
})


