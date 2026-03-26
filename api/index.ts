import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// Configuración de CORS
app.use(cors()); 
app.use(express.json());

// Ruta raíz
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "API Phrasal Verbs funcionando ✅",
    endpoints: [
      "GET  /api/phrasalverbs",
      "POST /api/phrasalverbs",
      "DELETE /api/phrasalverbs/:id",
      "GET  /api/debug-db"
    ]
  });
});

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error("Falta la variable de entorno, muy mal!!!");
}

let isMongoConnected = false;
let currentDatabase = "";

const connectToMongo = async () => {
    if (isMongoConnected && mongoose.connection.readyState === 1) return;

    const dbNameFromEnv = process.env.DB_NAME;
    const connectionOptions = dbNameFromEnv ? { dbName: dbNameFromEnv } : undefined;

    await mongoose.connect(mongoUri, connectionOptions);
    isMongoConnected = true;
    currentDatabase = mongoose.connection.name;
};

// Esquema de Phrasal Verbs
const PhrasalVerbSchema = new mongoose.Schema(
    {
        text: String,
        src: String,
    },
    { collection: "Phrasalverbs" }
);

const PhrasalVerb = mongoose.models.PhrasalVerb || mongoose.model("PhrasalVerb", PhrasalVerbSchema);

// Auxiliar para debug
const getMongoDebugInfo = () => ({
    database: currentDatabase || mongoose.connection.name,
    collection: PhrasalVerb.collection.name,
    readyState: mongoose.connection.readyState,
});

// RUTAS

// Debug
app.get("/api/debug-db", async (req: Request, res: Response) => {
    try {
        await connectToMongo();
        res.json(getMongoDebugInfo());
    } catch (error) {
        res.status(500).json({ error: "Error de conexión", detail: error instanceof Error ? error.message : "Error Desconocido" });
    }
});

// GET - Listar todos
app.get("/api/phrasalverbs", async (req: Request, res: Response) => {
    try {
        await connectToMongo();
        const phrasalVerbs = await PhrasalVerb.find();
        res.json(phrasalVerbs);
    } catch (error) {
        res.status(500).json({ error: "No se pudieron obtener los datos" });
    }
});

// POST - Crear uno nuevo
app.post("/api/phrasalverbs", async (req: Request, res: Response) => {
    try {
        const { text, src } = req.body;
        if (!text || !src) {
            return res.status(400).json({ error: "Debes enviar text y src, muy mal!!" });
        }

        await connectToMongo();
        const nuevaPhrasalVerb = new PhrasalVerb({ text, src });
        await nuevaPhrasalVerb.save();
        return res.status(201).json(nuevaPhrasalVerb);
    } catch (error) {
        return res.status(500).json({ error: "Error al crear" });
    }
});

// DELETE - Eliminar por ID
app.delete("/api/phrasalverbs/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await connectToMongo();
        
        const eliminado = await PhrasalVerb.findOneAndDelete().where({ _id: id });
        
        if (!eliminado) {
            return res.status(404).json({ error: "No se encontró el elemento" });
        }

        return res.json({ message: "Eliminado con éxito", id });
    } catch (error) {
        return res.status(500).json({ error: "ID no válido o error de servidor" });
    }
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

export default app;