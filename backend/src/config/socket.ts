import { Server } from "socket.io";

let io: Server | undefined;

export const setIo = (instance: Server) => {
  io = instance;
};

export const getIo = (): Server | undefined => io;
