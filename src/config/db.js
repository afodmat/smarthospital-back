// import * as Prisma from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// const { PrismaClient } = Prisma;

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

const connectDB = async () =>{
    try{
        await prisma.$connect();
        console.log(`db connected via prisma`);
    }catch(error){
        console.log(`there was an error ${error.message}`);
        process.exit(1);
    }
}

const disconnectDB = async() =>{
    await prisma.$disconnect();
}

export {prisma, connectDB, disconnectDB};