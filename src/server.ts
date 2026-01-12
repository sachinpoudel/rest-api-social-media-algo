import { connectDB } from './configs/db-config'
import { Env } from './configs/env-config';
import app from './app'
import dotenv from 'dotenv-safe'

dotenv.config()




export const startServer = async () => {
    try {
        const conn: any = await connectDB(Env.MONGO_URL);

        console.log("MONGODB connection established")

        app.listen(Env.PORT, () => {
            console.log(`server starting in ${Env.PORT}`)
        })
    } catch (error) {
        console.log(`failed to start ${error}`)
    }
};

startServer();

export default app